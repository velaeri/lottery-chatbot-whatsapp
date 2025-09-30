#!/usr/bin/env node

/**
 * Script de testing completo del sistema
 * Verifica que todos los componentes funcionen correctamente
 */

const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log(chalk.blue.bold('🧪 TESTING COMPLETO DEL SISTEMA'));
console.log(chalk.gray('Verificando todos los componentes del chatbot\n'));

async function main() {
  const results = {
    environment: false,
    database: false,
    api: false,
    n8n: false,
    whatsapp: false,
    workflows: false
  };

  try {
    // Test 1: Variables de entorno
    results.environment = await testEnvironment();
    
    // Test 2: Base de datos
    results.database = await testDatabase();
    
    // Test 3: API
    results.api = await testAPI();
    
    // Test 4: n8n
    results.n8n = await testN8n();
    
    // Test 5: WhatsApp
    results.whatsapp = await testWhatsApp();
    
    // Test 6: Workflows
    results.workflows = await testWorkflows();
    
    // Mostrar resumen
    showTestResults(results);
    
  } catch (error) {
    console.error(chalk.red('❌ Error durante el testing:'), error.message);
    process.exit(1);
  }
}

async function testEnvironment() {
  const spinner = ora('Verificando variables de entorno...').start();
  
  try {
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Variables faltantes: ${missingVars.join(', ')}`);
    }
    
    // Verificar formato de URLs
    if (!process.env.SUPABASE_URL.startsWith('https://')) {
      throw new Error('SUPABASE_URL debe ser una URL válida');
    }
    
    spinner.succeed('Variables de entorno verificadas');
    return true;
    
  } catch (error) {
    spinner.fail(`Error en variables de entorno: ${error.message}`);
    return false;
  }
}

async function testDatabase() {
  const spinner = ora('Probando conexión a base de datos...').start();
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test de conexión básica
    const { data: tickets, error: ticketsError } = await supabase
      .from('lottery_tickets')
      .select('count')
      .limit(1);
    
    if (ticketsError) {
      throw new Error(`Error accediendo a lottery_tickets: ${ticketsError.message}`);
    }
    
    // Test de todas las tablas principales
    const tables = [
      'lottery_tickets',
      'subscribers', 
      'orders',
      'user_sessions',
      'knowledge_base',
      'system_logs'
    ];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        throw new Error(`Tabla ${table} no accesible: ${error.message}`);
      }
    }
    
    // Test de funciones de base de datos
    const { data: availabilityTest, error: funcError } = await supabase
      .rpc('check_ticket_availability', {
        p_ticket_number: '12345',
        p_user_phone: '+34600123456'
      });
    
    if (funcError) {
      console.log(chalk.yellow('⚠️  Funciones de BD no disponibles (normal en setup inicial)'));
    }
    
    spinner.succeed('Base de datos funcionando correctamente');
    return true;
    
  } catch (error) {
    spinner.fail(`Error en base de datos: ${error.message}`);
    return false;
  }
}

async function testAPI() {
  const spinner = ora('Probando API del sistema...').start();
  
  try {
    const API_BASE = `http://localhost:${process.env.PORT || 3000}`;
    
    // Test de health check
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`, {
        timeout: 5000
      });
      
      if (healthResponse.status !== 200) {
        throw new Error(`Health check falló: ${healthResponse.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        spinner.warn('API no está ejecutándose (ejecuta: cd api && npm run dev)');
        return false;
      }
      throw error;
    }
    
    // Test de endpoints principales
    const endpoints = [
      '/api/status',
      '/api/tickets/stats',
      '/api/knowledge/categories'
    ];
    
    for (const endpoint of endpoints) {
      const response = await axios.get(`${API_BASE}${endpoint}`, {
        timeout: 5000
      });
      
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`Endpoint ${endpoint} falló`);
      }
    }
    
    // Test de endpoint de tickets
    const ticketResponse = await axios.post(`${API_BASE}/api/tickets/check-availability`, {
      ticketNumber: '12345',
      userPhone: '+34600123456'
    }, {
      timeout: 5000
    });
    
    if (ticketResponse.status !== 200) {
      throw new Error('Endpoint de tickets falló');
    }
    
    spinner.succeed('API funcionando correctamente');
    return true;
    
  } catch (error) {
    spinner.fail(`Error en API: ${error.message}`);
    return false;
  }
}

async function testN8n() {
  const spinner = ora('Verificando n8n...').start();
  
  try {
    const N8N_BASE = `http://${process.env.N8N_HOST || 'localhost'}:${process.env.N8N_PORT || 5678}`;
    
    try {
      const response = await axios.get(`${N8N_BASE}/healthz`, {
        timeout: 5000
      });
      
      if (response.status !== 200) {
        throw new Error(`n8n health check falló: ${response.status}`);
      }
      
      spinner.succeed('n8n funcionando correctamente');
      return true;
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        spinner.warn('n8n no está ejecutándose (ejecuta: cd n8n && npm run dev)');
        return false;
      }
      throw error;
    }
    
  } catch (error) {
    spinner.fail(`Error en n8n: ${error.message}`);
    return false;
  }
}

async function testWhatsApp() {
  const spinner = ora('Verificando configuración de WhatsApp...').start();
  
  try {
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      spinner.warn('WhatsApp no configurado (opcional)');
      return false;
    }
    
    // Test básico de configuración
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (accessToken.length < 20 || !/^\\d+$/.test(phoneNumberId)) {
      throw new Error('Credenciales de WhatsApp inválidas');
    }
    
    // Test de API de WhatsApp (sin enviar mensaje)
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${phoneNumberId}?fields=verified_name,display_phone_number`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          timeout: 10000
        }
      );
      
      if (response.status === 200) {
        spinner.succeed(`WhatsApp configurado: ${response.data.display_phone_number}`);
        return true;
      }
      
    } catch (apiError) {
      if (apiError.response?.status === 401) {
        throw new Error('Token de WhatsApp inválido');
      }
      throw new Error(`Error API WhatsApp: ${apiError.message}`);
    }
    
  } catch (error) {
    spinner.fail(`Error en WhatsApp: ${error.message}`);
    return false;
  }
}

async function testWorkflows() {
  const spinner = ora('Verificando workflows de n8n...').start();
  
  try {
    const fs = require('fs');
    const workflowsDir = path.join(__dirname, '../n8n/workflows');
    
    if (!fs.existsSync(workflowsDir)) {
      throw new Error('Directorio de workflows no encontrado');
    }
    
    const workflowFiles = fs.readdirSync(workflowsDir)
      .filter(file => file.endsWith('.json'));
    
    if (workflowFiles.length === 0) {
      throw new Error('No se encontraron workflows');
    }
    
    // Verificar que los workflows sean JSON válidos
    for (const file of workflowFiles) {
      const filePath = path.join(workflowsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      try {
        const workflow = JSON.parse(content);
        
        if (!workflow.name || !workflow.nodes || !Array.isArray(workflow.nodes)) {
          throw new Error(`Workflow ${file} tiene formato inválido`);
        }
        
      } catch (parseError) {
        throw new Error(`Error parseando ${file}: ${parseError.message}`);
      }
    }
    
    spinner.succeed(`${workflowFiles.length} workflows verificados`);
    return true;
    
  } catch (error) {
    spinner.fail(`Error en workflows: ${error.message}`);
    return false;
  }
}

function showTestResults(results) {
  console.log(chalk.cyan('\\n📊 RESULTADOS DEL TESTING:'));
  console.log(chalk.gray('═'.repeat(40)));
  
  const tests = [
    { name: 'Variables de entorno', key: 'environment', critical: true },
    { name: 'Base de datos', key: 'database', critical: true },
    { name: 'API del sistema', key: 'api', critical: false },
    { name: 'n8n', key: 'n8n', critical: false },
    { name: 'WhatsApp', key: 'whatsapp', critical: false },
    { name: 'Workflows', key: 'workflows', critical: true }
  ];
  
  let passedTests = 0;
  let criticalFailed = 0;
  
  for (const test of tests) {
    const status = results[test.key];
    const icon = status ? '✅' : (test.critical ? '❌' : '⚠️');
    const color = status ? 'green' : (test.critical ? 'red' : 'yellow');
    
    console.log(chalk[color](`${icon} ${test.name}`));
    
    if (status) {
      passedTests++;
    } else if (test.critical) {
      criticalFailed++;
    }
  }
  
  console.log(chalk.gray('═'.repeat(40)));
  console.log(`📈 Tests pasados: ${passedTests}/${tests.length}`);
  
  if (criticalFailed > 0) {
    console.log(chalk.red(`\\n❌ ${criticalFailed} tests críticos fallaron`));
    console.log(chalk.yellow('🔧 Soluciones sugeridas:'));
    
    if (!results.environment) {
      console.log('• Verificar archivo .env y variables requeridas');
    }
    if (!results.database) {
      console.log('• Ejecutar: cd database && npm run setup');
    }
    if (!results.workflows) {
      console.log('• Verificar archivos en n8n/workflows/');
    }
    
  } else {
    console.log(chalk.green('\\n🎉 ¡Todos los tests críticos pasaron!'));
    
    if (!results.api) {
      console.log(chalk.yellow('💡 Para iniciar la API: cd api && npm run dev'));
    }
    if (!results.n8n) {
      console.log(chalk.yellow('💡 Para iniciar n8n: cd n8n && npm run dev'));
    }
    if (!results.whatsapp) {
      console.log(chalk.yellow('💡 WhatsApp es opcional, configúralo cuando esté listo'));
    }
  }
  
  console.log(chalk.cyan('\\n📋 ESTADO GENERAL:'));
  if (criticalFailed === 0) {
    console.log(chalk.green('✅ Sistema listo para usar'));
  } else {
    console.log(chalk.red('❌ Sistema requiere configuración adicional'));
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main, testEnvironment, testDatabase, testAPI };

