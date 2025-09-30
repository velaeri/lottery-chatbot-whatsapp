#!/usr/bin/env node

/**
 * Script de health check del sistema
 * Monitorea el estado de todos los componentes
 */

const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  console.log(chalk.blue.bold('🏥 HEALTH CHECK DEL SISTEMA'));
  console.log(chalk.gray(`Timestamp: ${new Date().toISOString()}\\n`));

  const checks = [
    { name: 'Base de datos', check: checkDatabase },
    { name: 'API', check: checkAPI },
    { name: 'n8n', check: checkN8n },
    { name: 'WhatsApp', check: checkWhatsApp },
    { name: 'Recursos del sistema', check: checkSystemResources }
  ];

  const results = [];

  for (const { name, check } of checks) {
    const result = await check();
    results.push({ name, ...result });
  }

  showHealthReport(results);
}

async function checkDatabase() {
  const spinner = ora('Verificando base de datos...').start();
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const startTime = Date.now();
    
    // Test de conectividad
    const { data, error } = await supabase
      .from('lottery_tickets')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      throw new Error(error.message);
    }

    // Obtener estadísticas
    const { data: stats } = await supabase
      .rpc('get_system_stats')
      .single();

    spinner.succeed('Base de datos OK');
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      details: {
        connection: 'OK',
        tables: 'Accesibles',
        stats: stats || 'No disponibles'
      }
    };

  } catch (error) {
    spinner.fail('Base de datos ERROR');
    return {
      status: 'error',
      error: error.message,
      details: {
        connection: 'FAILED'
      }
    };
  }
}

async function checkAPI() {
  const spinner = ora('Verificando API...').start();
  
  try {
    const API_BASE = `http://localhost:${process.env.PORT || 3000}`;
    const startTime = Date.now();

    // Health check
    const healthResponse = await axios.get(`${API_BASE}/health`, {
      timeout: 5000
    });

    const responseTime = Date.now() - startTime;

    if (healthResponse.status !== 200) {
      throw new Error(`Status: ${healthResponse.status}`);
    }

    // Status detallado
    const statusResponse = await axios.get(`${API_BASE}/api/status`, {
      timeout: 5000
    });

    spinner.succeed('API OK');
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      details: {
        health: healthResponse.data,
        status: statusResponse.data.data
      }
    };

  } catch (error) {
    spinner.fail('API ERROR');
    
    if (error.code === 'ECONNREFUSED') {
      return {
        status: 'down',
        error: 'API no está ejecutándose',
        details: {
          suggestion: 'Ejecutar: cd api && npm run dev'
        }
      };
    }

    return {
      status: 'error',
      error: error.message,
      details: {}
    };
  }
}

async function checkN8n() {
  const spinner = ora('Verificando n8n...').start();
  
  try {
    const N8N_BASE = `http://${process.env.N8N_HOST || 'localhost'}:${process.env.N8N_PORT || 5678}`;
    const startTime = Date.now();

    const response = await axios.get(`${N8N_BASE}/healthz`, {
      timeout: 5000
    });

    const responseTime = Date.now() - startTime;

    if (response.status !== 200) {
      throw new Error(`Status: ${response.status}`);
    }

    // Intentar obtener workflows (requiere autenticación)
    let workflowCount = 'No disponible';
    try {
      const workflowsResponse = await axios.get(`${N8N_BASE}/api/v1/workflows`, {
        timeout: 3000
      });
      workflowCount = workflowsResponse.data?.data?.length || 0;
    } catch (authError) {
      // Normal si n8n requiere autenticación
      workflowCount = 'Requiere autenticación';
    }

    spinner.succeed('n8n OK');
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      details: {
        health: response.data,
        workflows: workflowCount
      }
    };

  } catch (error) {
    spinner.fail('n8n ERROR');
    
    if (error.code === 'ECONNREFUSED') {
      return {
        status: 'down',
        error: 'n8n no está ejecutándose',
        details: {
          suggestion: 'Ejecutar: cd n8n && npm run dev'
        }
      };
    }

    return {
      status: 'error',
      error: error.message,
      details: {}
    };
  }
}

async function checkWhatsApp() {
  const spinner = ora('Verificando WhatsApp...').start();
  
  try {
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      spinner.warn('WhatsApp no configurado');
      return {
        status: 'not_configured',
        details: {
          message: 'Configuración opcional'
        }
      };
    }

    const startTime = Date.now();
    
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}?fields=verified_name,display_phone_number,quality_rating`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        },
        timeout: 10000
      }
    );

    const responseTime = Date.now() - startTime;

    spinner.succeed('WhatsApp OK');
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      details: {
        phoneNumber: response.data.display_phone_number,
        verifiedName: response.data.verified_name,
        qualityRating: response.data.quality_rating
      }
    };

  } catch (error) {
    spinner.fail('WhatsApp ERROR');
    
    if (error.response?.status === 401) {
      return {
        status: 'error',
        error: 'Token de acceso inválido',
        details: {
          suggestion: 'Verificar WHATSAPP_ACCESS_TOKEN'
        }
      };
    }

    return {
      status: 'error',
      error: error.message,
      details: {}
    };
  }
}

async function checkSystemResources() {
  const spinner = ora('Verificando recursos del sistema...').start();
  
  try {
    const os = require('os');
    const fs = require('fs');
    
    // Memoria
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory * 100).toFixed(1);

    // CPU
    const cpus = os.cpus();
    const loadAverage = os.loadavg();

    // Disco (aproximado)
    let diskUsage = 'No disponible';
    try {
      const stats = fs.statSync(process.cwd());
      diskUsage = 'OK';
    } catch (error) {
      diskUsage = 'Error';
    }

    // Uptime del proceso
    const processUptime = process.uptime();
    const systemUptime = os.uptime();

    spinner.succeed('Recursos del sistema OK');
    
    return {
      status: 'healthy',
      details: {
        memory: {
          total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(1)} GB`,
          used: `${memoryUsage}%`,
          free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(1)} GB`
        },
        cpu: {
          cores: cpus.length,
          model: cpus[0]?.model || 'Unknown',
          loadAverage: loadAverage.map(load => load.toFixed(2))
        },
        uptime: {
          process: `${Math.floor(processUptime / 60)} min`,
          system: `${Math.floor(systemUptime / 3600)} hrs`
        },
        disk: diskUsage,
        platform: `${os.type()} ${os.release()}`
      }
    };

  } catch (error) {
    spinner.fail('Recursos del sistema ERROR');
    return {
      status: 'error',
      error: error.message,
      details: {}
    };
  }
}

function showHealthReport(results) {
  console.log(chalk.cyan('\\n📊 REPORTE DE SALUD:'));
  console.log(chalk.gray('═'.repeat(50)));

  let healthyCount = 0;
  let totalCount = results.length;

  for (const result of results) {
    const { name, status, responseTime, error, details } = result;
    
    let statusIcon, statusColor, statusText;
    
    switch (status) {
      case 'healthy':
        statusIcon = '✅';
        statusColor = 'green';
        statusText = 'HEALTHY';
        healthyCount++;
        break;
      case 'down':
        statusIcon = '🔴';
        statusColor = 'red';
        statusText = 'DOWN';
        break;
      case 'error':
        statusIcon = '❌';
        statusColor = 'red';
        statusText = 'ERROR';
        break;
      case 'not_configured':
        statusIcon = '⚠️';
        statusColor = 'yellow';
        statusText = 'NOT CONFIGURED';
        break;
      default:
        statusIcon = '❓';
        statusColor = 'gray';
        statusText = 'UNKNOWN';
    }

    console.log(chalk[statusColor](`${statusIcon} ${name}: ${statusText}`));
    
    if (responseTime) {
      console.log(chalk.gray(`   Tiempo de respuesta: ${responseTime}`));
    }
    
    if (error) {
      console.log(chalk.red(`   Error: ${error}`));
    }
    
    if (details?.suggestion) {
      console.log(chalk.yellow(`   Sugerencia: ${details.suggestion}`));
    }
    
    console.log('');
  }

  console.log(chalk.gray('═'.repeat(50)));
  
  const healthPercentage = Math.round((healthyCount / totalCount) * 100);
  
  if (healthPercentage >= 80) {
    console.log(chalk.green(`🎉 Estado general: SALUDABLE (${healthPercentage}%)`));
  } else if (healthPercentage >= 60) {
    console.log(chalk.yellow(`⚠️  Estado general: ADVERTENCIA (${healthPercentage}%)`));
  } else {
    console.log(chalk.red(`🚨 Estado general: CRÍTICO (${healthPercentage}%)`));
  }

  console.log(chalk.gray(`\\nComponentes saludables: ${healthyCount}/${totalCount}`));
  console.log(chalk.gray(`Última verificación: ${new Date().toISOString()}`));

  // Mostrar detalles adicionales si están disponibles
  const dbResult = results.find(r => r.name === 'Base de datos');
  if (dbResult?.details?.stats) {
    console.log(chalk.cyan('\\n📈 Estadísticas de la base de datos:'));
    console.log(JSON.stringify(dbResult.details.stats, null, 2));
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Error en health check:'), error);
    process.exit(1);
  });
}

module.exports = { main };

