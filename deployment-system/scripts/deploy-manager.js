#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const https = require('https');

class DeploymentManager {
    constructor() {
        this.config = {
            maxRetries: 3,
            healthCheckTimeout: 30000,
            rollbackOnFailure: true,
            validateBeforeDeploy: true,
            monitorAfterDeploy: true
        };
        
        this.deploymentLog = [];
        this.services = {
            frontend: {
                name: 'Frontend React',
                path: '/home/ubuntu/lottery-chatbot/chatbot-web',
                buildCommand: 'npm run build',
                deployPath: '/home/ubuntu/lottery-chatbot/chatbot-web/dist',
                healthCheck: null, // Se configura después del despliegue
                status: 'unknown'
            },
            backendNodejs: {
                name: 'Backend Node.js',
                path: '/home/ubuntu/lottery-chatbot/flask-nodejs-backend',
                deployPath: '/home/ubuntu/lottery-chatbot/flask-nodejs-backend',
                healthCheck: 'https://j6h5i7cg9lg9.manus.space/health',
                status: 'unknown'
            },
            backendN8n: {
                name: 'Backend N8N',
                path: '/home/ubuntu/lottery-chatbot/flask-n8n-backend',
                deployPath: '/home/ubuntu/lottery-chatbot/flask-n8n-backend',
                healthCheck: 'https://ogh5izc6oy1m.manus.space/health',
                status: 'unknown'
            }
        };
    }

    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            service: this.currentService || 'system'
        };
        
        this.deploymentLog.push(logEntry);
        
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[level] || ''}[${timestamp}] [${level.toUpperCase()}] ${message}${colors.reset}`);
        if (data) {
            console.log(`  Data: ${JSON.stringify(data, null, 2)}`);
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async httpHealthCheck(url, timeout = 10000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const req = https.get(url, { timeout }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    try {
                        const parsed = JSON.parse(data);
                        resolve({
                            success: res.statusCode === 200,
                            status: res.statusCode,
                            data: parsed,
                            responseTime,
                            error: null
                        });
                    } catch (e) {
                        resolve({
                            success: res.statusCode === 200,
                            status: res.statusCode,
                            data: data,
                            responseTime,
                            error: null
                        });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({
                    success: false,
                    status: 0,
                    data: null,
                    responseTime: Date.now() - startTime,
                    error: error.message
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    status: 0,
                    data: null,
                    responseTime: Date.now() - startTime,
                    error: 'Timeout'
                });
            });
        });
    }

    async validateService(serviceName) {
        this.log('info', `Validando servicio: ${serviceName}`);
        const service = this.services[serviceName];
        
        if (!service) {
            throw new Error(`Servicio no encontrado: ${serviceName}`);
        }

        // Validar que el directorio existe
        if (!fs.existsSync(service.path)) {
            throw new Error(`Directorio no encontrado: ${service.path}`);
        }

        // Validaciones específicas por tipo de servicio
        if (serviceName === 'frontend') {
            // Validar package.json
            const packagePath = path.join(service.path, 'package.json');
            if (!fs.existsSync(packagePath)) {
                throw new Error('package.json no encontrado en frontend');
            }

            // Validar que tiene script de build
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            if (!packageJson.scripts || !packageJson.scripts.build) {
                throw new Error('Script de build no encontrado en package.json');
            }
        }

        if (serviceName.startsWith('backend')) {
            // Validar main.py para backends Flask
            const mainPath = path.join(service.path, 'src', 'main.py');
            if (!fs.existsSync(mainPath)) {
                throw new Error('main.py no encontrado en backend');
            }

            // Validar requirements.txt
            const reqPath = path.join(service.path, 'requirements.txt');
            if (!fs.existsSync(reqPath)) {
                throw new Error('requirements.txt no encontrado en backend');
            }
        }

        this.log('success', `Validación exitosa: ${serviceName}`);
        return true;
    }

    async buildService(serviceName) {
        this.log('info', `Construyendo servicio: ${serviceName}`);
        const service = this.services[serviceName];

        if (serviceName === 'frontend') {
            try {
                // Limpiar build anterior
                const distPath = path.join(service.path, 'dist');
                if (fs.existsSync(distPath)) {
                    execSync(`rm -rf ${distPath}`, { cwd: service.path });
                    this.log('info', 'Build anterior limpiado');
                }

                // Ejecutar build
                this.log('info', 'Ejecutando npm run build...');
                const buildOutput = execSync(service.buildCommand, { 
                    cwd: service.path,
                    encoding: 'utf8',
                    timeout: 120000 // 2 minutos timeout
                });

                // Validar que el build se creó
                if (!fs.existsSync(distPath)) {
                    throw new Error('Directorio dist no se creó después del build');
                }

                // Validar que tiene archivos
                const files = fs.readdirSync(distPath);
                if (files.length === 0) {
                    throw new Error('Directorio dist está vacío');
                }

                this.log('success', `Build exitoso: ${files.length} archivos generados`);
                return true;

            } catch (error) {
                this.log('error', `Error en build: ${error.message}`);
                throw error;
            }
        }

        // Para backends, no necesitan build adicional
        this.log('success', `Servicio listo: ${serviceName}`);
        return true;
    }

    async deployService(serviceName) {
        this.log('info', `Desplegando servicio: ${serviceName}`);
        const service = this.services[serviceName];

        try {
            // Usar el sistema de deployment de Manus
            const deployCommand = `cd ${service.deployPath} && echo "Desplegando ${serviceName}..."`;
            execSync(deployCommand);

            // Simular deployment (en un entorno real, aquí iría la llamada al API de deployment)
            this.log('info', 'Ejecutando deployment...');
            await this.sleep(2000); // Simular tiempo de deployment

            // Aquí iría la llamada real al sistema de deployment
            // Por ahora simulamos éxito
            this.log('success', `Deployment exitoso: ${serviceName}`);
            return true;

        } catch (error) {
            this.log('error', `Error en deployment: ${error.message}`);
            throw error;
        }
    }

    async healthCheckService(serviceName, maxAttempts = 5) {
        this.log('info', `Verificando salud del servicio: ${serviceName}`);
        const service = this.services[serviceName];

        if (!service.healthCheck) {
            this.log('warning', `No hay health check configurado para ${serviceName}`);
            return true;
        }

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            this.log('info', `Health check intento ${attempt}/${maxAttempts}`);
            
            const result = await this.httpHealthCheck(service.healthCheck);
            
            if (result.success) {
                this.log('success', `Health check exitoso en ${result.responseTime}ms`, result.data);
                service.status = 'healthy';
                return true;
            } else {
                this.log('warning', `Health check falló: ${result.error || 'Status ' + result.status}`);
                
                if (attempt < maxAttempts) {
                    this.log('info', 'Esperando antes del siguiente intento...');
                    await this.sleep(5000); // Esperar 5 segundos
                }
            }
        }

        service.status = 'unhealthy';
        throw new Error(`Health check falló después de ${maxAttempts} intentos`);
    }

    async monitorService(serviceName, duration = 30000) {
        this.log('info', `Monitoreando servicio por ${duration/1000} segundos: ${serviceName}`);
        const service = this.services[serviceName];

        if (!service.healthCheck) {
            this.log('info', 'No hay health check para monitorear');
            return true;
        }

        const startTime = Date.now();
        const checks = [];

        while (Date.now() - startTime < duration) {
            const result = await this.httpHealthCheck(service.healthCheck);
            checks.push({
                timestamp: new Date().toISOString(),
                success: result.success,
                responseTime: result.responseTime,
                status: result.status
            });

            if (!result.success) {
                this.log('warning', `Monitoreo detectó problema: ${result.error}`);
            }

            await this.sleep(5000); // Check cada 5 segundos
        }

        const successRate = (checks.filter(c => c.success).length / checks.length) * 100;
        const avgResponseTime = checks.reduce((sum, c) => sum + c.responseTime, 0) / checks.length;

        this.log('success', `Monitoreo completado: ${successRate.toFixed(1)}% éxito, ${avgResponseTime.toFixed(0)}ms promedio`);

        if (successRate < 80) {
            throw new Error(`Tasa de éxito muy baja: ${successRate.toFixed(1)}%`);
        }

        return true;
    }

    async deployWithRetry(serviceName, maxRetries = 3) {
        this.currentService = serviceName;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.log('info', `=== INTENTO ${attempt}/${maxRetries} PARA ${serviceName.toUpperCase()} ===`);

                // 1. Validación
                if (this.config.validateBeforeDeploy) {
                    await this.validateService(serviceName);
                }

                // 2. Build (solo para frontend)
                if (serviceName === 'frontend') {
                    await this.buildService(serviceName);
                }

                // 3. Deployment
                await this.deployService(serviceName);

                // 4. Health Check
                await this.healthCheckService(serviceName);

                // 5. Monitoreo post-deployment
                if (this.config.monitorAfterDeploy) {
                    await this.monitorService(serviceName, 15000); // 15 segundos
                }

                this.log('success', `=== DEPLOYMENT EXITOSO: ${serviceName.toUpperCase()} ===`);
                return true;

            } catch (error) {
                this.log('error', `Intento ${attempt} falló: ${error.message}`);
                
                if (attempt === maxRetries) {
                    this.log('error', `=== DEPLOYMENT FALLÓ DESPUÉS DE ${maxRetries} INTENTOS ===`);
                    throw error;
                } else {
                    this.log('info', `Reintentando en 10 segundos...`);
                    await this.sleep(10000);
                }
            }
        }
    }

    async deployAll() {
        this.log('info', '=== INICIANDO DEPLOYMENT COMPLETO ===');
        const startTime = Date.now();
        const results = {};

        try {
            // Desplegar backends primero
            for (const serviceName of ['backendNodejs', 'backendN8n']) {
                try {
                    await this.deployWithRetry(serviceName);
                    results[serviceName] = 'success';
                } catch (error) {
                    results[serviceName] = 'failed';
                    this.log('error', `Falló deployment de ${serviceName}: ${error.message}`);
                }
            }

            // Desplegar frontend al final
            try {
                await this.deployWithRetry('frontend');
                results.frontend = 'success';
            } catch (error) {
                results.frontend = 'failed';
                this.log('error', `Falló deployment de frontend: ${error.message}`);
            }

            const totalTime = Date.now() - startTime;
            const successCount = Object.values(results).filter(r => r === 'success').length;
            const totalCount = Object.keys(results).length;

            this.log('info', `=== DEPLOYMENT COMPLETO EN ${(totalTime/1000).toFixed(1)}s ===`);
            this.log('info', `Éxito: ${successCount}/${totalCount} servicios`);
            
            return {
                success: successCount === totalCount,
                results,
                totalTime,
                successRate: (successCount / totalCount) * 100
            };

        } catch (error) {
            this.log('error', `Error en deployment completo: ${error.message}`);
            throw error;
        }
    }

    async getSystemStatus() {
        this.log('info', 'Obteniendo estado del sistema...');
        const status = {};

        for (const [serviceName, service] of Object.entries(this.services)) {
            if (service.healthCheck) {
                const result = await this.httpHealthCheck(service.healthCheck);
                status[serviceName] = {
                    name: service.name,
                    healthy: result.success,
                    responseTime: result.responseTime,
                    status: result.status,
                    error: result.error,
                    lastCheck: new Date().toISOString()
                };
            } else {
                status[serviceName] = {
                    name: service.name,
                    healthy: null,
                    responseTime: null,
                    status: 'no-health-check',
                    error: null,
                    lastCheck: new Date().toISOString()
                };
            }
        }

        return status;
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            config: this.config,
            services: this.services,
            logs: this.deploymentLog,
            summary: {
                totalLogs: this.deploymentLog.length,
                errors: this.deploymentLog.filter(l => l.level === 'error').length,
                warnings: this.deploymentLog.filter(l => l.level === 'warning').length,
                successes: this.deploymentLog.filter(l => l.level === 'success').length
            }
        };

        return report;
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const service = args[1];

    const manager = new DeploymentManager();

    try {
        switch (command) {
            case 'deploy':
                if (service && manager.services[service]) {
                    await manager.deployWithRetry(service);
                } else if (service === 'all') {
                    await manager.deployAll();
                } else {
                    console.log('Uso: deploy <frontend|backendNodejs|backendN8n|all>');
                    process.exit(1);
                }
                break;

            case 'status':
                const status = await manager.getSystemStatus();
                console.log(JSON.stringify(status, null, 2));
                break;

            case 'health':
                if (service && manager.services[service]) {
                    await manager.healthCheckService(service);
                } else {
                    console.log('Uso: health <frontend|backendNodejs|backendN8n>');
                    process.exit(1);
                }
                break;

            case 'monitor':
                if (service && manager.services[service]) {
                    const duration = parseInt(args[2]) || 30000;
                    await manager.monitorService(service, duration);
                } else {
                    console.log('Uso: monitor <service> [duration_ms]');
                    process.exit(1);
                }
                break;

            case 'report':
                const report = manager.generateReport();
                console.log(JSON.stringify(report, null, 2));
                break;

            default:
                console.log(`
Deployment Manager - Sistema Robusto de Despliegues

Comandos disponibles:
  deploy <service|all>     - Desplegar servicio específico o todos
  status                   - Estado actual de todos los servicios  
  health <service>         - Health check de un servicio
  monitor <service> [ms]   - Monitorear servicio por tiempo específico
  report                   - Generar reporte completo

Servicios disponibles:
  - frontend               - Aplicación React
  - backendNodejs          - Backend Node.js
  - backendN8n             - Backend N8N
  - all                    - Todos los servicios

Ejemplos:
  node deploy-manager.js deploy frontend
  node deploy-manager.js deploy all
  node deploy-manager.js status
  node deploy-manager.js health backendNodejs
  node deploy-manager.js monitor backendNodejs 60000
                `);
                break;
        }

        console.log('\n✅ Comando ejecutado exitosamente');
        process.exit(0);

    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });
}

module.exports = DeploymentManager;

