#!/usr/bin/env node

/**
 * Script de inicialización completa del sistema
 * Configura todo el entorno desde cero
 */

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const PROJECT_ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(PROJECT_ROOT, '.env');

console.log(chalk.blue.bold('🚀 INICIALIZACIÓN COMPLETA DEL CHATBOT DE LOTERÍA'));
console.log(chalk.gray('Este script configurará todo el sistema desde cero\n'));

async function main() {
  try {
    // Paso 1: Verificar requisitos
    await checkRequirements();
    
    // Paso 2: Configurar variables de entorno
    await setupEnvironment();
    
    // Paso 3: Instalar dependencias
    await installDependencies();
    
    // Paso 4: Configurar base de datos
    await setupDatabase();
    
    // Paso 5: Configurar n8n
    await setupN8n();
    
    // Paso 6: Validar configuración
    await validateSetup();
    
    // Paso 7: Mostrar resumen
    showSummary();
    
  } catch (error) {
    console.error(chalk.red('❌ Error durante la inicialización:'), error.message);
    process.exit(1);
  }
}

async function checkRequirements() {
  const spinner = ora('Verificando requisitos del sistema...').start();
  
  try {
    // Verificar Node.js
    const nodeVersion = process.version;
    if (!nodeVersion.startsWith('v18.') && !nodeVersion.startsWith('v20.') && !nodeVersion.startsWith('v22.')) {
      throw new Error(`Node.js 18+ requerido. Versión actual: ${nodeVersion}`);
    }
    
    // Verificar npm
    execSync('npm --version', { stdio: 'ignore' });
    
    // Verificar git
    execSync('git --version', { stdio: 'ignore' });
    
    spinner.succeed('Requisitos del sistema verificados');
  } catch (error) {
    spinner.fail('Error verificando requisitos');
    throw error;
  }
}

async function setupEnvironment() {
  console.log(chalk.yellow('\\n📝 CONFIGURACIÓN DE VARIABLES DE ENTORNO'));
  
  // Verificar si ya existe .env
  if (fs.existsSync(ENV_FILE)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Ya existe un archivo .env. ¿Deseas sobrescribirlo?',
        default: false
      }
    ]);
    
    if (!overwrite) {
      console.log(chalk.blue('ℹ️  Usando configuración existente'));
      return;
    }
  }
  
  // Solicitar configuración de Supabase
  console.log(chalk.cyan('\\n🗄️  Configuración de Supabase:'));
  const supabaseConfig = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: 'URL de tu proyecto Supabase:',
      validate: (input) => {
        if (!input.startsWith('https://') || !input.includes('.supabase.co')) {
          return 'Debe ser una URL válida de Supabase (https://xxx.supabase.co)';
        }
        return true;
      }
    },
    {
      type: 'password',
      name: 'serviceRoleKey',
      message: 'Service Role Key de Supabase:',
      validate: (input) => input.length > 50 || 'La clave debe tener más de 50 caracteres'
    }
  ]);
  
  // Solicitar configuración de WhatsApp (opcional)
  console.log(chalk.cyan('\\n📱 Configuración de WhatsApp Business API:'));
  const { configureWhatsApp } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'configureWhatsApp',
      message: '¿Deseas configurar WhatsApp ahora? (puedes hacerlo después)',
      default: false
    }
  ]);
  
  let whatsappConfig = {};
  if (configureWhatsApp) {
    whatsappConfig = await inquirer.prompt([
      {
        type: 'password',
        name: 'accessToken',
        message: 'Access Token de WhatsApp:',
        validate: (input) => input.length > 20 || 'El token debe tener más de 20 caracteres'
      },
      {
        type: 'input',
        name: 'phoneNumberId',
        message: 'Phone Number ID:',
        validate: (input) => /^\\d+$/.test(input) || 'Debe ser un ID numérico'
      },
      {
        type: 'input',
        name: 'webhookVerifyToken',
        message: 'Webhook Verify Token (opcional):',
        default: 'lottery_chatbot_verify'
      }
    ]);
  }
  
  // Crear archivo .env
  const envContent = `# Configuración del Chatbot de Lotería
# Generado automáticamente el ${new Date().toISOString()}

# Base de datos Supabase
SUPABASE_URL=${supabaseConfig.url}
SUPABASE_SERVICE_ROLE_KEY=${supabaseConfig.serviceRoleKey}

# WhatsApp Business API
${whatsappConfig.accessToken ? `WHATSAPP_ACCESS_TOKEN=${whatsappConfig.accessToken}` : '# WHATSAPP_ACCESS_TOKEN=tu_access_token'}
${whatsappConfig.phoneNumberId ? `WHATSAPP_PHONE_NUMBER_ID=${whatsappConfig.phoneNumberId}` : '# WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id'}
${whatsappConfig.webhookVerifyToken ? `WHATSAPP_WEBHOOK_VERIFY_TOKEN=${whatsappConfig.webhookVerifyToken}` : '# WHATSAPP_WEBHOOK_VERIFY_TOKEN=lottery_chatbot_verify'}

# Configuración de la API
PORT=3000
NODE_ENV=development

# Configuración de n8n
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
`;
  
  fs.writeFileSync(ENV_FILE, envContent);
  console.log(chalk.green('✅ Archivo .env creado exitosamente'));
}

async function installDependencies() {
  console.log(chalk.yellow('\\n📦 INSTALACIÓN DE DEPENDENCIAS'));
  
  const workspaces = ['shared', 'database', 'api', 'scripts'];
  
  for (const workspace of workspaces) {
    const spinner = ora(`Instalando dependencias de ${workspace}...`).start();
    
    try {
      const workspacePath = path.join(PROJECT_ROOT, workspace);
      if (fs.existsSync(path.join(workspacePath, 'package.json'))) {
        execSync('npm install', { 
          cwd: workspacePath, 
          stdio: 'ignore' 
        });
        spinner.succeed(`Dependencias de ${workspace} instaladas`);
      } else {
        spinner.warn(`Workspace ${workspace} no encontrado`);
      }
    } catch (error) {
      spinner.fail(`Error instalando dependencias de ${workspace}`);
      throw error;
    }
  }
}

async function setupDatabase() {
  console.log(chalk.yellow('\\n🗄️  CONFIGURACIÓN DE BASE DE DATOS'));
  
  const spinner = ora('Configurando esquema de base de datos...').start();
  
  try {
    // Ejecutar setup de base de datos
    execSync('npm run setup', { 
      cwd: path.join(PROJECT_ROOT, 'database'),
      stdio: 'ignore'
    });
    
    spinner.succeed('Esquema de base de datos configurado');
    
    // Preguntar si cargar datos de prueba
    const { loadSampleData } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'loadSampleData',
        message: '¿Deseas cargar datos de prueba?',
        default: true
      }
    ]);
    
    if (loadSampleData) {
      const seedSpinner = ora('Cargando datos de prueba...').start();
      
      try {
        execSync('npm run seed', { 
          cwd: path.join(PROJECT_ROOT, 'database'),
          stdio: 'ignore'
        });
        seedSpinner.succeed('Datos de prueba cargados');
      } catch (error) {
        seedSpinner.fail('Error cargando datos de prueba');
        console.log(chalk.yellow('⚠️  Puedes cargar los datos después con: cd database && npm run seed'));
      }
    }
    
  } catch (error) {
    spinner.fail('Error configurando base de datos');
    throw error;
  }
}

async function setupN8n() {
  console.log(chalk.yellow('\\n🔄 CONFIGURACIÓN DE N8N'));
  
  const { setupN8nNow } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupN8nNow',
      message: '¿Deseas configurar n8n ahora? (requiere configuración manual)',
      default: false
    }
  ]);
  
  if (setupN8nNow) {
    console.log(chalk.cyan('\\n📋 Pasos para configurar n8n:'));
    console.log('1. Ejecuta: cd n8n && npm run dev');
    console.log('2. Ve a http://localhost:5678');
    console.log('3. Configura las credenciales de Supabase y WhatsApp');
    console.log('4. Importa los workflows desde n8n/workflows/');
    
    const { continueSetup } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueSetup',
        message: '¿Has completado la configuración de n8n?',
        default: false
      }
    ]);
    
    if (continueSetup) {
      console.log(chalk.green('✅ Configuración de n8n completada'));
    } else {
      console.log(chalk.yellow('⚠️  Recuerda configurar n8n después'));
    }
  } else {
    console.log(chalk.blue('ℹ️  Configuración de n8n pospuesta'));
    console.log(chalk.gray('   Ejecuta después: cd n8n && npm run dev'));
  }
}

async function validateSetup() {
  console.log(chalk.yellow('\\n✅ VALIDACIÓN DE CONFIGURACIÓN'));
  
  const spinner = ora('Validando configuración del sistema...').start();
  
  try {
    // Verificar archivo .env
    if (!fs.existsSync(ENV_FILE)) {
      throw new Error('Archivo .env no encontrado');
    }
    
    // Verificar conexión a Supabase
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config({ path: ENV_FILE });
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test de conexión simple
    const { data, error } = await supabase
      .from('lottery_tickets')
      .select('count')
      .limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      throw new Error(`Error conectando a Supabase: ${error.message}`);
    }
    
    spinner.succeed('Configuración validada exitosamente');
    
  } catch (error) {
    spinner.fail('Error en validación');
    console.log(chalk.yellow('⚠️  Algunos componentes pueden necesitar configuración adicional'));
    console.log(chalk.gray(`   Error: ${error.message}`));
  }
}

function showSummary() {
  console.log(chalk.green.bold('\\n🎉 ¡INICIALIZACIÓN COMPLETADA!'));
  console.log(chalk.gray('═'.repeat(50)));
  
  console.log(chalk.cyan('\\n📋 RESUMEN DE CONFIGURACIÓN:'));
  console.log(`✅ Variables de entorno: ${ENV_FILE}`);
  console.log(`✅ Base de datos: Configurada`);
  console.log(`✅ Dependencias: Instaladas`);
  
  console.log(chalk.cyan('\\n🚀 PRÓXIMOS PASOS:'));
  console.log('1. Configurar n8n:');
  console.log(chalk.gray('   cd n8n && npm run dev'));
  console.log(chalk.gray('   Ir a http://localhost:5678'));
  
  console.log('\\n2. Iniciar la API:');
  console.log(chalk.gray('   cd api && npm run dev'));
  
  console.log('\\n3. Probar el sistema:');
  console.log(chalk.gray('   npm run test-system'));
  
  console.log(chalk.cyan('\\n📚 DOCUMENTACIÓN:'));
  console.log('• README.md - Información general');
  console.log('• database/README.md - Base de datos');
  console.log('• n8n/credentials/README.md - Configuración de credenciales');
  
  console.log(chalk.cyan('\\n🔧 COMANDOS ÚTILES:'));
  console.log('• npm run health-check - Verificar estado del sistema');
  console.log('• npm run validate-config - Validar configuración');
  console.log('• npm run backup-system - Crear backup');
  
  console.log(chalk.green('\\n¡El chatbot de lotería está listo para usar! 🍀'));
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };

