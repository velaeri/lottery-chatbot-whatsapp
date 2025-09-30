#!/usr/bin/env node

const https = require('https');
const assert = require('assert');

class IntegrationTester {
    constructor() {
        this.baseUrls = {
            nodejs: 'https://j6h5i7cg9lg9.manus.space',
            n8n: 'https://ogh5izc6oy1m.manus.space'
        };
        
        this.testResults = [];
        this.startTime = Date.now();
    }

    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
        if (data) {
            console.log(`  Data: ${JSON.stringify(data, null, 2)}`);
        }
    }

    async httpRequest(url, options = {}) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const requestOptions = {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                timeout: options.timeout || 10000
            };

            const req = https.request(url, requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    try {
                        const parsed = data ? JSON.parse(data) : null;
                        resolve({
                            success: res.statusCode >= 200 && res.statusCode < 300,
                            status: res.statusCode,
                            data: parsed,
                            rawData: data,
                            responseTime,
                            error: null
                        });
                    } catch (e) {
                        resolve({
                            success: res.statusCode >= 200 && res.statusCode < 300,
                            status: res.statusCode,
                            data: data,
                            rawData: data,
                            responseTime,
                            error: null
                        });
                    }
                });
            });

            if (options.body) {
                req.write(JSON.stringify(options.body));
            }

            req.on('error', (error) => {
                resolve({
                    success: false,
                    status: 0,
                    data: null,
                    rawData: null,
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
                    rawData: null,
                    responseTime: Date.now() - startTime,
                    error: 'Timeout'
                });
            });

            req.end();
        });
    }

    async runTest(testName, testFunction) {
        this.log('info', `Ejecutando test: ${testName}`);
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name: testName,
                success: true,
                duration,
                result,
                error: null
            });
            
            this.log('success', `✅ Test exitoso: ${testName} (${duration}ms)`);
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name: testName,
                success: false,
                duration,
                result: null,
                error: error.message
            });
            
            this.log('error', `❌ Test falló: ${testName} (${duration}ms) - ${error.message}`);
            throw error;
        }
    }

    async testHealthEndpoints() {
        return await this.runTest('Health Endpoints', async () => {
            const results = {};
            
            for (const [backend, baseUrl] of Object.entries(this.baseUrls)) {
                const response = await this.httpRequest(`${baseUrl}/health`);
                
                assert(response.success, `Health check falló para ${backend}: ${response.error || response.status}`);
                assert(response.data, `No hay datos en health check de ${backend}`);
                assert(response.data.status === 'ok', `Estado no OK en ${backend}: ${response.data.status}`);
                
                results[backend] = {
                    status: response.data.status,
                    responseTime: response.responseTime,
                    backend: response.data.backend
                };
            }
            
            return results;
        });
    }

    async testChatEndpoints() {
        return await this.runTest('Chat Endpoints', async () => {
            const results = {};
            const testMessage = {
                userId: 'test-user-' + Date.now(),
                message: 'hola',
                isSubscriber: false
            };
            
            for (const [backend, baseUrl] of Object.entries(this.baseUrls)) {
                const response = await this.httpRequest(`${baseUrl}/chat`, {
                    method: 'POST',
                    body: testMessage,
                    timeout: 30000 // 30 segundos para chat
                });
                
                assert(response.success, `Chat falló para ${backend}: ${response.error || response.status}`);
                assert(response.data, `No hay datos en chat de ${backend}`);
                assert(response.data.success, `Chat no exitoso en ${backend}`);
                assert(response.data.message, `No hay mensaje en respuesta de ${backend}`);
                
                results[backend] = {
                    success: response.data.success,
                    responseTime: response.responseTime,
                    messageLength: response.data.message.length,
                    usedAI: response.data.usedAI,
                    backend: response.data.backend
                };
            }
            
            return results;
        });
    }

    async testTicketInquiry() {
        return await this.runTest('Ticket Inquiry', async () => {
            const results = {};
            const testMessage = {
                userId: 'test-user-' + Date.now(),
                message: '10000', // Billete que sabemos que existe
                isSubscriber: false
            };
            
            for (const [backend, baseUrl] of Object.entries(this.baseUrls)) {
                const response = await this.httpRequest(`${baseUrl}/chat`, {
                    method: 'POST',
                    body: testMessage,
                    timeout: 30000
                });
                
                assert(response.success, `Consulta de billete falló para ${backend}: ${response.error || response.status}`);
                assert(response.data, `No hay datos en consulta de billete de ${backend}`);
                assert(response.data.success, `Consulta de billete no exitosa en ${backend}`);
                assert(response.data.usedDatabase, `No se usó base de datos en ${backend}`);
                
                results[backend] = {
                    success: response.data.success,
                    responseTime: response.responseTime,
                    usedDatabase: response.data.usedDatabase,
                    usedAI: response.data.usedAI,
                    backend: response.data.backend
                };
            }
            
            return results;
        });
    }

    async testStatsEndpoints() {
        return await this.runTest('Stats Endpoints', async () => {
            const results = {};
            
            for (const [backend, baseUrl] of Object.entries(this.baseUrls)) {
                const response = await this.httpRequest(`${baseUrl}/stats`);
                
                assert(response.success, `Stats falló para ${backend}: ${response.error || response.status}`);
                assert(response.data, `No hay datos en stats de ${backend}`);
                assert(response.data.success, `Stats no exitoso en ${backend}`);
                assert(response.data.data, `No hay datos de estadísticas en ${backend}`);
                
                const stats = response.data.data;
                assert(typeof stats.total === 'number', `Total no es número en ${backend}`);
                assert(typeof stats.available === 'number', `Available no es número en ${backend}`);
                
                results[backend] = {
                    success: response.data.success,
                    responseTime: response.responseTime,
                    stats: stats,
                    backend: response.data.backend
                };
            }
            
            return results;
        });
    }

    async testCorsHeaders() {
        return await this.runTest('CORS Headers', async () => {
            const results = {};
            
            for (const [backend, baseUrl] of Object.entries(this.baseUrls)) {
                const response = await this.httpRequest(`${baseUrl}/health`, {
                    method: 'OPTIONS',
                    headers: {
                        'Origin': 'https://qtbatltpmauukeae.manus-preview.space',
                        'Access-Control-Request-Method': 'POST',
                        'Access-Control-Request-Headers': 'Content-Type'
                    }
                });
                
                // CORS puede devolver 200 o 204
                assert(response.status === 200 || response.status === 204, 
                    `CORS preflight falló para ${backend}: ${response.status}`);
                
                results[backend] = {
                    status: response.status,
                    responseTime: response.responseTime
                };
            }
            
            return results;
        });
    }

    async testPerformance() {
        return await this.runTest('Performance Test', async () => {
            const results = {};
            const iterations = 5;
            
            for (const [backend, baseUrl] of Object.entries(this.baseUrls)) {
                const times = [];
                
                for (let i = 0; i < iterations; i++) {
                    const response = await this.httpRequest(`${baseUrl}/health`);
                    assert(response.success, `Performance test falló en iteración ${i+1} para ${backend}`);
                    times.push(response.responseTime);
                }
                
                const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
                const minTime = Math.min(...times);
                const maxTime = Math.max(...times);
                
                results[backend] = {
                    iterations,
                    averageTime: Math.round(avgTime),
                    minTime,
                    maxTime,
                    times
                };
            }
            
            return results;
        });
    }

    async testBackendComparison() {
        return await this.runTest('Backend Comparison', async () => {
            const testMessage = {
                userId: 'comparison-test-' + Date.now(),
                message: '¿Cuál es el horario?',
                isSubscriber: false
            };
            
            const results = {};
            
            for (const [backend, baseUrl] of Object.entries(this.baseUrls)) {
                const response = await this.httpRequest(`${baseUrl}/chat`, {
                    method: 'POST',
                    body: testMessage,
                    timeout: 30000
                });
                
                assert(response.success, `Comparación falló para ${backend}`);
                
                results[backend] = {
                    responseTime: response.responseTime,
                    messageLength: response.data.message.length,
                    usedAI: response.data.usedAI,
                    backend: response.data.backend,
                    processedBy: response.data.processedBy
                };
            }
            
            // Verificar que ambos backends responden diferente
            assert(results.nodejs.processedBy !== results.n8n.processedBy, 
                'Los backends deberían tener processedBy diferentes');
            
            return results;
        });
    }

    async runAllTests() {
        this.log('info', '🚀 Iniciando suite completa de tests de integración');
        
        const tests = [
            () => this.testHealthEndpoints(),
            () => this.testChatEndpoints(),
            () => this.testTicketInquiry(),
            () => this.testStatsEndpoints(),
            () => this.testCorsHeaders(),
            () => this.testPerformance(),
            () => this.testBackendComparison()
        ];
        
        let passedTests = 0;
        let failedTests = 0;
        
        for (const test of tests) {
            try {
                await test();
                passedTests++;
            } catch (error) {
                failedTests++;
                // Continuar con los demás tests
            }
        }
        
        const totalTime = Date.now() - this.startTime;
        const successRate = (passedTests / (passedTests + failedTests)) * 100;
        
        this.log('info', '📊 RESUMEN DE TESTS:');
        this.log('info', `✅ Tests exitosos: ${passedTests}`);
        this.log('info', `❌ Tests fallidos: ${failedTests}`);
        this.log('info', `📈 Tasa de éxito: ${successRate.toFixed(1)}%`);
        this.log('info', `⏱️ Tiempo total: ${(totalTime/1000).toFixed(1)}s`);
        
        if (successRate < 100) {
            throw new Error(`Tests fallaron: ${failedTests}/${passedTests + failedTests}`);
        }
        
        return {
            success: true,
            passedTests,
            failedTests,
            successRate,
            totalTime,
            results: this.testResults
        };
    }

    generateReport() {
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testResults.length,
                passed: this.testResults.filter(t => t.success).length,
                failed: this.testResults.filter(t => !t.success).length,
                totalTime: Date.now() - this.startTime
            },
            tests: this.testResults,
            baseUrls: this.baseUrls
        };
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'all';

    const tester = new IntegrationTester();

    try {
        switch (command) {
            case 'health':
                await tester.testHealthEndpoints();
                break;
            case 'chat':
                await tester.testChatEndpoints();
                break;
            case 'ticket':
                await tester.testTicketInquiry();
                break;
            case 'stats':
                await tester.testStatsEndpoints();
                break;
            case 'cors':
                await tester.testCorsHeaders();
                break;
            case 'performance':
                await tester.testPerformance();
                break;
            case 'comparison':
                await tester.testBackendComparison();
                break;
            case 'all':
                await tester.runAllTests();
                break;
            case 'report':
                const report = tester.generateReport();
                console.log(JSON.stringify(report, null, 2));
                break;
            default:
                console.log(`
Integration Tester - Tests Automáticos del Sistema

Comandos disponibles:
  health       - Test de health endpoints
  chat         - Test de endpoints de chat
  ticket       - Test de consulta de billetes
  stats        - Test de estadísticas
  cors         - Test de headers CORS
  performance  - Test de rendimiento
  comparison   - Test de comparación entre backends
  all          - Ejecutar todos los tests
  report       - Generar reporte de tests

Ejemplos:
  node integration-test.js all
  node integration-test.js health
  node integration-test.js performance
                `);
                break;
        }

        console.log('\n✅ Tests completados exitosamente');
        process.exit(0);

    } catch (error) {
        console.error(`\n❌ Tests fallaron: ${error.message}`);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(error => {
        console.error('Error fatal en tests:', error);
        process.exit(1);
    });
}

module.exports = IntegrationTester;

