const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

// Credenciales
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zgttgbdbujrzduqekfmp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpndHRnYmRidWpyemR1cWVrZm1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk3MzIwMywiZXhwIjoyMDczNTQ5MjAzfQ.bL6YhyLDKmwTfXwYazE1VvuxREhnf8KYDwY5D0nJvbw';
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || 'sk-86c5897b82cc4daca828dd989ba03349';

// Middleware
app.use(cors({
  origin: ['*', 'https://qtbatltpmauukeae.manus-preview.space', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Sesiones de usuario en memoria (simulando n8n workflow state)
const userSessions = new Map();

// Simulación de workflow n8n: Función para llamar a DeepSeek
async function n8nWorkflowCallDeepSeek(message, userId, isSubscriber, businessLogicResult) {
  if (!DEEPSEEK_KEY) {
    return getFallbackResponse(message);
  }

  try {
    const systemPrompt = `Eres un asistente virtual de "Lotería El Trébol", una tienda de billetes de lotería en España.

INFORMACIÓN DE LA EMPRESA:
- Nombre: Lotería El Trébol
- Horario: Lunes a viernes 9:00-18:00, sábados 9:00-14:00
- Ubicación: Calle Principal 123, Madrid
- Sorteos: Todos los sábados a las 20:00
- Suscripción de abonados: 20€ anuales (acceso a billetes exclusivos)

ESTADO DEL USUARIO:
- Tipo: ${isSubscriber ? 'Abonado (acceso a billetes exclusivos)' : 'Usuario regular'}

WORKFLOW N8N ACTIVO: Este mensaje está siendo procesado por workflows de n8n.

INSTRUCCIONES IMPORTANTES:
1. NUNCA inventes números de billetes o precios. Solo usa la información que te proporcione el sistema.
2. Sé amigable, profesional y usa emojis apropiados.
3. Si el usuario pregunta por billetes exclusivos y no es abonado, explica los beneficios de la suscripción.
4. Para compras, siempre menciona que un operador humano completará el proceso.
5. Mantén las respuestas concisas pero informativas.
6. Responde de manera natural y conversacional.
7. Menciona sutilmente que estás usando workflows de n8n para procesar la consulta.

Responde de manera natural y conversacional, pero siempre mantén el contexto del negocio de lotería.`;

    let userMessage = message;
    if (businessLogicResult) {
      userMessage = `Usuario escribió: "${message}"\nResultado del workflow n8n: ${businessLogicResult}\n\nPor favor, reformula esta respuesta de manera más natural y conversacional, manteniendo toda la información importante. Menciona que has procesado esto usando workflows de n8n.`;
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('Error en DeepSeek API:', response.status, response.statusText);
      return getFallbackResponse(message);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      console.error('Respuesta vacía de DeepSeek');
      return getFallbackResponse(message);
    }

    return assistantMessage;

  } catch (error) {
    console.error('Error llamando a DeepSeek desde n8n workflow:', error);
    return getFallbackResponse(message);
  }
}

// Respuestas de fallback (simulando n8n workflow)
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('horario')) {
    return '🕒 [N8N Workflow] Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 y sábados de 9:00 a 14:00. ¿En qué más puedo ayudarte?';
  }

  if (lowerMessage.includes('ubicacion') || lowerMessage.includes('direccion') || lowerMessage.includes('donde')) {
    return '📍 [N8N Workflow] Estamos ubicados en Calle Principal 123, Madrid. ¡Te esperamos! ¿Necesitas algo más?';
  }

  if (lowerMessage.includes('sorteo')) {
    return '🎯 [N8N Workflow] Los sorteos se realizan todos los sábados a las 20:00. Los resultados se publican inmediatamente. ¿Te gustaría consultar algún billete?';
  }

  if (lowerMessage.includes('abonado') || lowerMessage.includes('suscripcion')) {
    return '⭐ [N8N Workflow] La suscripción de abonado cuesta 20€ anuales y te da acceso a billetes exclusivos. Visita nuestra oficina con tu DNI para suscribirte. ¿Quieres más información?';
  }

  return `🔄 [N8N Workflow] Entiendo que preguntas sobre "${message}". 

Puedo ayudarte con:
🎫 Consultar billetes (envía un número de 4-5 dígitos)
📍 Información sobre horarios y ubicación  
🎯 Información sobre sorteos
💰 Proceso de compra

¿En qué más puedo ayudarte?`;
}

// Simulación de workflow n8n: Lógica de negocio para billetes
async function n8nWorkflowHandleTicketInquiry(ticketNumber, userId, isSubscriber) {
  try {
    console.log(`[N8N Workflow] Consultando billete ${ticketNumber} en Supabase...`);
    
    // Consultar billete en la base de datos REAL (simulando nodo HTTP Request de n8n)
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/lottery_tickets`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      params: {
        'ticket_number': `eq.${ticketNumber}`,
        'select': '*'
      }
    });

    const tickets = response.data;
    const ticket = tickets[0];

    if (!ticket) {
      return `❌ [N8N Workflow] Lo siento, el billete ${ticketNumber} no existe en nuestro sistema.

🎯 Prueba con números como: 10000, 10090, 10115, 10190, etc.

¿Te gustaría consultar otro número?`;
    }

    if (ticket.status === 'sold') {
      return `❌ [N8N Workflow] El billete ${ticketNumber} ya ha sido vendido.

¿Te gustaría consultar otro número disponible?`;
    }

    if (ticket.status === 'reserved') {
      return `⏳ [N8N Workflow] El billete ${ticketNumber} está temporalmente reservado.

¿Te gustaría consultar otro número?`;
    }

    // Verificar acceso a billetes exclusivos (simulando nodo IF de n8n)
    if (ticket.is_exclusive && !isSubscriber) {
      return `🔒 [N8N Workflow] El billete ${ticketNumber} es exclusivo para abonados.

💰 Precio: ${ticket.price}€
📋 Para ser abonado, visita nuestra oficina con tu DNI. La suscripción cuesta 20€ anuales.

¿Te gustaría consultar billetes regulares disponibles?`;
    }

    // Billete disponible - preparar para compra (simulando nodo Set de n8n)
    userSessions.set(userId, {
      state: 'purchase_confirmation',
      context: { 
        ticket_number: ticketNumber, 
        price: parseFloat(ticket.price),
        ticket_id: ticket.id
      }
    });

    return `✅ [N8N Workflow] ¡Billete disponible!

🎫 Número: ${ticketNumber}
💰 Precio: ${ticket.price}€
${ticket.is_exclusive ? '⭐ Billete exclusivo para abonados' : '📋 Billete regular'}

¿Deseas comprarlo? Responde "sí" para confirmar o "no" para cancelar.`;

  } catch (error) {
    console.error('[N8N Workflow] Error consultando billete:', error);
    return `❌ [N8N Workflow] Error consultando el billete ${ticketNumber}. Por favor, inténtalo de nuevo.`;
  }
}

// Simulación de workflow n8n: Manejo de confirmaciones de compra
async function n8nWorkflowHandlePurchaseConfirmation(userId) {
  const session = userSessions.get(userId);
  
  if (!session || session.state !== 'purchase_confirmation') {
    return '[N8N Workflow] No hay ninguna compra pendiente de confirmación. ¿Te gustaría consultar un billete?';
  }

  const { ticket_number, price, ticket_id } = session.context;

  try {
    console.log(`[N8N Workflow] Reservando billete ${ticket_number}...`);
    
    // Actualizar el estado del billete en la base de datos REAL (simulando nodo HTTP Request de n8n)
    await axios.patch(`${SUPABASE_URL}/rest/v1/lottery_tickets`, 
      { 
        status: 'reserved',
        updated_at: new Date().toISOString()
      },
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        params: {
          'id': `eq.${ticket_id}`
        }
      }
    );

    // Limpiar sesión (simulando nodo Set de n8n)
    userSessions.set(userId, { state: 'main_menu', context: {} });

    return `🎉 [N8N Workflow] ¡Compra confirmada!

🎫 Billete: ${ticket_number}
💰 Precio: ${price}€
📋 Estado: Reservado temporalmente

📞 Un operador se pondrá en contacto contigo en breve para completar el pago y la entrega.

⏰ La reserva es válida por 24 horas.

¿Necesitas algo más?`;

  } catch (error) {
    console.error('[N8N Workflow] Error confirmando compra:', error);
    return `❌ [N8N Workflow] Error procesando la compra. Por favor, inténtalo de nuevo.`;
  }
}

// Simulación de workflow n8n: Manejo de cancelaciones
function n8nWorkflowHandlePurchaseCancellation(userId) {
  const session = userSessions.get(userId);
  
  if (!session || session.state !== 'purchase_confirmation') {
    return '[N8N Workflow] No hay ninguna compra pendiente de cancelación. ¿En qué más puedo ayudarte?';
  }

  // Limpiar sesión (simulando nodo Set de n8n)
  userSessions.set(userId, { state: 'main_menu', context: {} });

  return `❌ [N8N Workflow] Compra cancelada.

¿Te gustaría consultar otro billete o necesitas ayuda con algo más?`;
}

// Detectar tipo de mensaje (simulando nodos IF de n8n)
function isTicketNumber(message) {
  return /^\d{4,5}$/.test(message.trim());
}

function isConfirmationMessage(message) {
  const confirmationWords = ['sí', 'si', 'confirmo', 'comprar', 'quiero', 'acepto', 'ok'];
  const lowerMessage = message.toLowerCase().trim();
  return confirmationWords.some(word => lowerMessage.includes(word));
}

function isCancellationMessage(message) {
  const cancellationWords = ['no', 'cancelar', 'no quiero', 'rechazar', 'nada'];
  const lowerMessage = message.toLowerCase().trim();
  return cancellationWords.some(word => lowerMessage.includes(word));
}

// Endpoint de salud
app.get('/health', async (req, res) => {
  try {
    // Probar conexión a Supabase
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/lottery_tickets?limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      backend: 'n8n',
      n8n: {
        ready: true,
        status: 'simulated',
        workflows: ['main-chat', 'streaming-chat', 'ticket-inquiry', 'purchase-confirmation']
      },
      deepseek: {
        available: !!DEEPSEEK_KEY,
        configured: !!DEEPSEEK_KEY
      },
      supabase: {
        connected: true,
        url: SUPABASE_URL
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      backend: 'n8n'
    });
  }
});

// Endpoint para obtener estadísticas de billetes
app.get('/stats', async (req, res) => {
  try {
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
      backend: 'n8n',
      processedBy: 'n8n-workflows'
    });

  } catch (error) {
    console.error('[N8N Workflow] Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas',
      details: error.message,
      backend: 'n8n'
    });
  }
});

// Endpoint principal de chat (simulando workflow principal de n8n)
app.post('/chat', async (req, res) => {
  try {
    const { userId, message, isSubscriber = false } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: 'userId y message son requeridos',
        backend: 'n8n'
      });
    }

    console.log(`[N8N Main Workflow] Procesando mensaje: "${message}" de usuario ${userId}`);

    let businessLogicResult = null;

    // Detectar si requiere lógica específica del negocio (simulando nodos IF de n8n)
    if (isTicketNumber(message)) {
      console.log('[N8N Workflow] Ejecutando workflow de consulta de billete...');
      businessLogicResult = await n8nWorkflowHandleTicketInquiry(message, userId, isSubscriber);
    } else if (isConfirmationMessage(message)) {
      console.log('[N8N Workflow] Ejecutando workflow de confirmación de compra...');
      businessLogicResult = await n8nWorkflowHandlePurchaseConfirmation(userId);
    } else if (isCancellationMessage(message)) {
      console.log('[N8N Workflow] Ejecutando workflow de cancelación...');
      businessLogicResult = n8nWorkflowHandlePurchaseCancellation(userId);
    }

    // Usar DeepSeek para mejorar la respuesta (simulando nodo HTTP Request a DeepSeek)
    console.log('[N8N Workflow] Ejecutando workflow de DeepSeek...');
    const finalResponse = await n8nWorkflowCallDeepSeek(message, userId, isSubscriber, businessLogicResult);
    
    res.json({
      success: true,
      message: finalResponse,
      usedAI: !!DEEPSEEK_KEY,
      usedDatabase: isTicketNumber(message),
      backend: 'n8n',
      processedBy: 'n8n-workflows',
      workflowsExecuted: businessLogicResult ? ['ticket-inquiry', 'deepseek-enhancement'] : ['deepseek-general'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[N8N Workflow] Error en chat:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
      backend: 'n8n'
    });
  }
});

// Endpoint de streaming (simulando workflow de streaming de n8n)
app.post('/chat/stream', async (req, res) => {
  try {
    const { userId, message, isSubscriber = false } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: 'userId y message son requeridos',
        backend: 'n8n'
      });
    }

    console.log(`[N8N Streaming Workflow] Procesando mensaje: "${message}"`);

    // Configurar headers para streaming
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    let businessLogicResult = null;

    // Detectar si requiere lógica específica del negocio (simulando workflows de n8n)
    if (isTicketNumber(message)) {
      businessLogicResult = await n8nWorkflowHandleTicketInquiry(message, userId, isSubscriber);
    } else if (isConfirmationMessage(message)) {
      businessLogicResult = await n8nWorkflowHandlePurchaseConfirmation(userId);
    } else if (isCancellationMessage(message)) {
      businessLogicResult = n8nWorkflowHandlePurchaseCancellation(userId);
    }

    // Obtener respuesta de DeepSeek (simulando workflow de DeepSeek)
    const response = await n8nWorkflowCallDeepSeek(message, userId, isSubscriber, businessLogicResult);
    
    // Simular streaming palabra por palabra (simulando nodo de streaming de n8n)
    const words = response.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      res.write(chunk);
      
      // Pequeño delay para simular streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    res.end();

  } catch (error) {
    console.error('[N8N Streaming Workflow] Error en chat streaming:', error);
    res.write('🔄 [N8N Workflow] Disculpa, he tenido un problema técnico. ¿Podrías repetir tu mensaje?');
    res.end();
  }
});

// Endpoint para obtener información de workflows n8n
app.get('/n8n/status', (req, res) => {
  res.json({
    ready: true,
    backend: 'n8n',
    mode: 'simulated',
    activeWorkflows: [
      { name: 'main-chat-workflow', status: 'active', description: 'Workflow principal de chat' },
      { name: 'streaming-chat-workflow', status: 'active', description: 'Workflow de streaming' },
      { name: 'ticket-inquiry-workflow', status: 'active', description: 'Consulta de billetes' },
      { name: 'purchase-confirmation-workflow', status: 'active', description: 'Confirmación de compras' },
      { name: 'deepseek-integration-workflow', status: 'active', description: 'Integración con DeepSeek' }
    ],
    supabaseIntegration: 'active',
    deepseekIntegration: 'active'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Lottery Chatbot N8N Backend API (Simulated)',
    version: '1.0.0',
    backend: 'n8n',
    mode: 'simulated-workflows',
    endpoints: {
      health: '/health',
      chat: '/chat',
      streaming: '/chat/stream',
      stats: '/stats',
      n8nStatus: '/n8n/status'
    },
    workflows: {
      active: 5,
      description: 'Simulación completa de workflows n8n con funcionalidad real'
    },
    features: [
      'Workflows n8n simulados',
      'Integración real con Supabase',
      'Integración real con DeepSeek',
      'Streaming de respuestas',
      'Gestión de sesiones',
      'Lógica de negocio completa'
    ],
    status: 'running'
  });
});

// Iniciar servidor
app.listen(port, async () => {
  console.log(`🔄 Backend N8N (Simulado) ejecutándose en puerto ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${port}/chat`);
  console.log(`🌊 Streaming endpoint: http://localhost:${port}/chat/stream`);
  console.log(`📈 Stats endpoint: http://localhost:${port}/stats`);
  console.log(`🔧 N8N Status: http://localhost:${port}/n8n/status`);
  
  // Mostrar configuración
  console.log(`🧠 DeepSeek AI: ${DEEPSEEK_KEY ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`🗄️ Supabase: ${SUPABASE_KEY ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`🔄 N8N Workflows: ✅ Simulados (5 workflows activos)`);
  
  // Probar conexión a Supabase
  try {
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/lottery_tickets?limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    console.log(`🗄️ Supabase: ✅ Conectado a base de datos real`);
    console.log(`📊 Workflows n8n listos para procesar consultas de billetes`);
    
  } catch (error) {
    console.log(`🗄️ Supabase: ❌ Error - ${error.message}`);
  }
});

