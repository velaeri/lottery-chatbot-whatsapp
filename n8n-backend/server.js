const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;

// Configuración de n8n
const N8N_PORT = process.env.N8N_PORT || 5678;
const N8N_HOST = process.env.N8N_HOST || 'localhost';

// Variables de entorno para n8n
process.env.N8N_BASIC_AUTH_ACTIVE = 'false';
process.env.N8N_SECURE_COOKIE = 'false';
process.env.N8N_HOST = '0.0.0.0';
process.env.N8N_PORT = N8N_PORT;
process.env.N8N_PROTOCOL = 'http';
process.env.WEBHOOK_URL = process.env.WEBHOOK_URL || `http://localhost:${port}`;

// Credenciales
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zgttgbdbujrzduqekfmp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpndHRnYmRidWpyemR1cWVrZm1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk3MzIwMywiZXhwIjoyMDczNTQ5MjAzfQ.bL6YhyLDKmwTfXwYazE1VvuxREhnf8KYDwY5D0nJvbw';
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || 'sk-86c5897b82cc4daca828dd989ba03349';

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Variable para almacenar el proceso de n8n
let n8nProcess = null;
let n8nReady = false;

// Función para iniciar n8n
function startN8n() {
  console.log('🚀 Iniciando n8n...');
  
  const n8nCommand = 'npx';
  const n8nArgs = ['n8n', 'start'];
  
  n8nProcess = spawn(n8nCommand, n8nArgs, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      N8N_BASIC_AUTH_ACTIVE: 'false',
      N8N_SECURE_COOKIE: 'false',
      N8N_HOST: '0.0.0.0',
      N8N_PORT: N8N_PORT,
      N8N_PROTOCOL: 'http'
    }
  });

  n8nProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[N8N] ${output}`);
    
    // Detectar cuando n8n está listo
    if (output.includes('n8n ready') || output.includes('Editor is now accessible')) {
      n8nReady = true;
      console.log('✅ n8n está listo');
      setupN8nWorkflows();
    }
  });

  n8nProcess.stderr.on('data', (data) => {
    console.error(`[N8N ERROR] ${data}`);
  });

  n8nProcess.on('close', (code) => {
    console.log(`[N8N] Proceso terminado con código ${code}`);
    n8nReady = false;
  });

  n8nProcess.on('error', (error) => {
    console.error(`[N8N] Error iniciando proceso: ${error}`);
    n8nReady = false;
  });
}

// Función para configurar workflows en n8n
async function setupN8nWorkflows() {
  try {
    console.log('⚙️ Configurando workflows en n8n...');
    
    // Esperar un poco para que n8n esté completamente listo
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Configurar credenciales
    await setupCredentials();
    
    // Importar workflows
    await importWorkflows();
    
    console.log('✅ Workflows configurados exitosamente');
    
  } catch (error) {
    console.error('❌ Error configurando workflows:', error);
  }
}

// Función para configurar credenciales en n8n
async function setupCredentials() {
  try {
    const n8nApiUrl = `http://${N8N_HOST}:${N8N_PORT}/rest`;
    
    // Credencial de Supabase
    const supabaseCredential = {
      name: 'Supabase Auth',
      type: 'httpHeaderAuth',
      data: {
        name: 'apikey',
        value: SUPABASE_KEY
      }
    };
    
    // Credencial de DeepSeek
    const deepseekCredential = {
      name: 'DeepSeek Auth',
      type: 'httpHeaderAuth',
      data: {
        name: 'Authorization',
        value: `Bearer ${DEEPSEEK_KEY}`
      }
    };
    
    // Crear credenciales
    await axios.post(`${n8nApiUrl}/credentials`, supabaseCredential);
    await axios.post(`${n8nApiUrl}/credentials`, deepseekCredential);
    
    console.log('✅ Credenciales configuradas');
    
  } catch (error) {
    console.log('⚠️ Error configurando credenciales (pueden ya existir):', error.message);
  }
}

// Función para importar workflows
async function importWorkflows() {
  try {
    const n8nApiUrl = `http://${N8N_HOST}:${N8N_PORT}/rest`;
    const workflowsDir = path.join(__dirname, 'workflows');
    
    // Leer archivos de workflows
    const workflowFiles = fs.readdirSync(workflowsDir).filter(file => file.endsWith('.json'));
    
    for (const file of workflowFiles) {
      const workflowPath = path.join(workflowsDir, file);
      const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
      
      try {
        await axios.post(`${n8nApiUrl}/workflows`, workflowData);
        console.log(`✅ Workflow importado: ${file}`);
      } catch (error) {
        console.log(`⚠️ Error importando ${file} (puede ya existir):`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error importando workflows:', error);
  }
}

// Función para hacer llamadas a workflows de n8n
async function callN8nWorkflow(endpoint, data) {
  try {
    const webhookUrl = `http://${N8N_HOST}:${N8N_PORT}/webhook/${endpoint}`;
    const response = await axios.post(webhookUrl, data, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error llamando a workflow ${endpoint}:`, error.message);
    throw error;
  }
}

// Endpoints de la API

// Endpoint de salud
app.get('/health', async (req, res) => {
  try {
    let n8nStatus = 'disconnected';
    
    if (n8nReady) {
      try {
        await axios.get(`http://${N8N_HOST}:${N8N_PORT}/rest/active-workflows`);
        n8nStatus = 'connected';
      } catch (error) {
        n8nStatus = 'error';
      }
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      backend: 'n8n',
      n8n: {
        ready: n8nReady,
        status: n8nStatus,
        port: N8N_PORT
      },
      deepseek: {
        available: !!DEEPSEEK_KEY,
        configured: !!DEEPSEEK_KEY
      },
      supabase: {
        configured: !!SUPABASE_KEY,
        url: SUPABASE_URL
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Endpoint de estadísticas
app.get('/stats', async (req, res) => {
  try {
    // Llamar directamente a Supabase para estadísticas
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/lottery_tickets?select=status,is_exclusive`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const tickets = response.data;
    const total = tickets.length;
    const available = tickets.filter(t => t.status === 'available').length;
    const sold = tickets.filter(t => t.status === 'sold').length;
    const reserved = tickets.filter(t => t.status === 'reserved').length;
    const exclusive = tickets.filter(t => t.is_exclusive).length;
    
    const stats = {
      total,
      available,
      sold,
      reserved,
      exclusive,
      regular: total - exclusive
    };

    res.json({
      success: true,
      data: stats,
      backend: 'n8n'
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas',
      details: error.message,
      backend: 'n8n'
    });
  }
});

// Endpoint principal de chat
app.post('/chat', async (req, res) => {
  try {
    if (!n8nReady) {
      return res.status(503).json({
        error: 'n8n no está listo aún',
        backend: 'n8n'
      });
    }
    
    const { userId, message, isSubscriber = false } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: 'userId y message son requeridos',
        backend: 'n8n'
      });
    }

    // Llamar al workflow principal de n8n
    const result = await callN8nWorkflow('chat', {
      userId,
      message,
      isSubscriber
    });
    
    // Asegurar que la respuesta incluya el backend
    const response = {
      ...result,
      backend: 'n8n'
    };
    
    res.json(response);

  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
      backend: 'n8n'
    });
  }
});

// Endpoint de streaming
app.post('/chat/stream', async (req, res) => {
  try {
    if (!n8nReady) {
      return res.status(503).json({
        error: 'n8n no está listo aún',
        backend: 'n8n'
      });
    }
    
    const { userId, message, isSubscriber = false } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: 'userId y message son requeridos',
        backend: 'n8n'
      });
    }

    // Configurar headers para streaming
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    try {
      // Llamar al workflow de streaming de n8n
      const result = await callN8nWorkflow('chat/stream', {
        userId,
        message,
        isSubscriber
      });
      
      // Simular streaming palabra por palabra
      const response = result.message || result.streamChunk || 'Respuesta desde n8n';
      const words = response.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        res.write(chunk);
        
        // Pequeño delay para simular streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error) {
      console.error('Error en streaming workflow:', error);
      res.write('🤖 Disculpa, he tenido un problema técnico con n8n. ¿Podrías repetir tu mensaje?');
    }

    res.end();

  } catch (error) {
    console.error('Error en chat streaming:', error);
    res.write('🤖 Error en el sistema de streaming de n8n.');
    res.end();
  }
});

// Endpoint para obtener información de n8n
app.get('/n8n/status', async (req, res) => {
  try {
    if (!n8nReady) {
      return res.json({
        ready: false,
        message: 'n8n no está listo aún'
      });
    }
    
    const response = await axios.get(`http://${N8N_HOST}:${N8N_PORT}/rest/active-workflows`);
    
    res.json({
      ready: true,
      activeWorkflows: response.data.length,
      n8nUrl: `http://${N8N_HOST}:${N8N_PORT}`,
      webhookUrl: process.env.WEBHOOK_URL
    });
    
  } catch (error) {
    res.status(500).json({
      ready: false,
      error: error.message
    });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Lottery Chatbot N8N Backend API',
    version: '1.0.0',
    backend: 'n8n',
    endpoints: {
      health: '/health',
      chat: '/chat',
      streaming: '/chat/stream',
      stats: '/stats',
      n8nStatus: '/n8n/status'
    },
    n8n: {
      ready: n8nReady,
      port: N8N_PORT,
      editorUrl: n8nReady ? `http://${N8N_HOST}:${N8N_PORT}` : null
    },
    status: 'running'
  });
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  if (n8nProcess) {
    n8nProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  if (n8nProcess) {
    n8nProcess.kill('SIGINT');
  }
  process.exit(0);
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Backend N8N ejecutándose en puerto ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${port}/chat`);
  console.log(`🌊 Streaming endpoint: http://localhost:${port}/chat/stream`);
  console.log(`📈 Stats endpoint: http://localhost:${port}/stats`);
  console.log(`🔧 N8N Status: http://localhost:${port}/n8n/status`);
  
  // Mostrar configuración
  console.log(`🧠 DeepSeek AI: ${DEEPSEEK_KEY ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`🗄️ Supabase: ${SUPABASE_KEY ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`⚙️ N8N Port: ${N8N_PORT}`);
  
  // Iniciar n8n
  startN8n();
});

