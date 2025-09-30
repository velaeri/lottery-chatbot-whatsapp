const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
dotenv.config({ path: '.env' });

const app = express();
const port = process.env.PORT || 3000;

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Sesiones de usuario en memoria
const userSessions = new Map();

// Función para llamar a DeepSeek
async function callDeepSeek(message, userId, isSubscriber, businessLogicResult) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️ DeepSeek API key no configurada, usando respuesta predefinida');
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

INSTRUCCIONES IMPORTANTES:
1. NUNCA inventes números de billetes o precios. Solo usa la información que te proporcione el sistema.
2. Sé amigable, profesional y usa emojis apropiados.
3. Si el usuario pregunta por billetes exclusivos y no es abonado, explica los beneficios de la suscripción.
4. Para compras, siempre menciona que un operador humano completará el proceso.
5. Mantén las respuestas concisas pero informativas.
6. Responde de manera natural y conversacional.

Responde de manera natural y conversacional, pero siempre mantén el contexto del negocio de lotería.`;

    let userMessage = message;
    if (businessLogicResult) {
      userMessage = `Usuario escribió: "${message}"\nResultado del sistema: ${businessLogicResult}\n\nPor favor, reformula esta respuesta de manera más natural y conversacional, manteniendo toda la información importante.`;
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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
    console.error('Error llamando a DeepSeek:', error);
    return getFallbackResponse(message);
  }
}

// Respuestas de fallback
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('horario')) {
    return '🕒 Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 y sábados de 9:00 a 14:00. ¿En qué más puedo ayudarte?';
  }

  if (lowerMessage.includes('ubicacion') || lowerMessage.includes('direccion') || lowerMessage.includes('donde')) {
    return '📍 Estamos ubicados en Calle Principal 123, Madrid. ¡Te esperamos! ¿Necesitas algo más?';
  }

  if (lowerMessage.includes('sorteo')) {
    return '🎯 Los sorteos se realizan todos los sábados a las 20:00. Los resultados se publican inmediatamente. ¿Te gustaría consultar algún billete?';
  }

  if (lowerMessage.includes('abonado') || lowerMessage.includes('suscripcion')) {
    return '⭐ La suscripción de abonado cuesta 20€ anuales y te da acceso a billetes exclusivos. Visita nuestra oficina con tu DNI para suscribirte. ¿Quieres más información?';
  }

  return `🤔 Entiendo que preguntas sobre "${message}". 

Puedo ayudarte con:
🎫 Consultar billetes (envía un número de 4-5 dígitos)
📍 Información sobre horarios y ubicación  
🎯 Información sobre sorteos
💰 Proceso de compra

¿En qué más puedo ayudarte?`;
}

// Lógica de negocio para billetes - CONECTADA A SUPABASE REAL
async function handleTicketInquiry(ticketNumber, userId, isSubscriber) {
  try {
    // Consultar billete en la base de datos REAL
    const { data: ticket, error } = await supabase
      .from('lottery_tickets')
      .select('*')
      .eq('ticket_number', ticketNumber)
      .single();

    if (error || !ticket) {
      return `❌ Lo siento, el billete ${ticketNumber} no existe en nuestro sistema.

🎯 Prueba con números entre 10001-29999 o algunos especiales como 12345, 67890.

¿Te gustaría consultar otro número?`;
    }

    if (ticket.status === 'sold') {
      return `❌ El billete ${ticketNumber} ya ha sido vendido.

¿Te gustaría consultar otro número disponible?`;
    }

    if (ticket.status === 'reserved') {
      return `⏳ El billete ${ticketNumber} está temporalmente reservado.

¿Te gustaría consultar otro número?`;
    }

    // Verificar acceso a billetes exclusivos
    if (ticket.is_exclusive && !isSubscriber) {
      return `🔒 El billete ${ticketNumber} es exclusivo para abonados.

💰 Precio: ${ticket.price}€
📋 Para ser abonado, visita nuestra oficina con tu DNI. La suscripción cuesta 20€ anuales.

¿Te gustaría consultar billetes regulares disponibles?`;
    }

    // Billete disponible - preparar para compra
    userSessions.set(userId, {
      state: 'purchase_confirmation',
      context: { 
        ticket_number: ticketNumber, 
        price: parseFloat(ticket.price),
        ticket_id: ticket.id
      }
    });

    return `✅ ¡Billete disponible!

🎫 Número: ${ticketNumber}
💰 Precio: ${ticket.price}€
${ticket.is_exclusive ? '⭐ Billete exclusivo para abonados' : '📋 Billete regular'}

¿Deseas comprarlo? Responde "sí" para confirmar o "no" para cancelar.`;

  } catch (error) {
    console.error('Error consultando billete:', error);
    return `❌ Error consultando el billete ${ticketNumber}. Por favor, inténtalo de nuevo.`;
  }
}

// Manejo de confirmaciones de compra - CONECTADO A SUPABASE REAL
async function handlePurchaseConfirmation(userId) {
  const session = userSessions.get(userId);
  
  if (!session || session.state !== 'purchase_confirmation') {
    return 'No hay ninguna compra pendiente de confirmación. ¿Te gustaría consultar un billete?';
  }

  const { ticket_number, price, ticket_id } = session.context;

  try {
    // Actualizar el estado del billete en la base de datos REAL
    const { error } = await supabase
      .from('lottery_tickets')
      .update({ 
        status: 'reserved',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket_id);

    if (error) {
      console.error('Error reservando billete:', error);
      return `❌ Error procesando la compra del billete ${ticket_number}. Por favor, inténtalo de nuevo.`;
    }

    // Limpiar sesión
    userSessions.set(userId, { state: 'main_menu', context: {} });

    return `🎉 ¡Compra confirmada!

🎫 Billete: ${ticket_number}
💰 Precio: ${price}€
📋 Estado: Reservado temporalmente

📞 Un operador se pondrá en contacto contigo en breve para completar el pago y la entrega.

⏰ La reserva es válida por 24 horas.

¿Necesitas algo más?`;

  } catch (error) {
    console.error('Error confirmando compra:', error);
    return `❌ Error procesando la compra. Por favor, inténtalo de nuevo.`;
  }
}

// Manejo de cancelaciones
function handlePurchaseCancellation(userId) {
  const session = userSessions.get(userId);
  
  if (!session || session.state !== 'purchase_confirmation') {
    return 'No hay ninguna compra pendiente de cancelación. ¿En qué más puedo ayudarte?';
  }

  // Limpiar sesión
  userSessions.set(userId, { state: 'main_menu', context: {} });

  return `❌ Compra cancelada.

¿Te gustaría consultar otro billete o necesitas ayuda con algo más?`;
}

// Detectar tipo de mensaje
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
    const { data, error } = await supabase
      .from('lottery_tickets')
      .select('count(*)')
      .limit(1);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      deepseek: {
        available: !!process.env.DEEPSEEK_API_KEY,
        configured: !!process.env.DEEPSEEK_API_KEY
      },
      supabase: {
        connected: !error,
        error: error?.message || null
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Endpoint para obtener estadísticas de billetes
app.get('/stats', async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .from('lottery_tickets')
      .select('status, is_exclusive')
      .then(result => {
        if (result.error) throw result.error;
        
        const total = result.data.length;
        const available = result.data.filter(t => t.status === 'available').length;
        const sold = result.data.filter(t => t.status === 'sold').length;
        const reserved = result.data.filter(t => t.status === 'reserved').length;
        const exclusive = result.data.filter(t => t.is_exclusive).length;
        
        return {
          total,
          available,
          sold,
          reserved,
          exclusive,
          regular: total - exclusive
        };
      });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas',
      details: error.message
    });
  }
});

// Endpoint principal de chat
app.post('/chat', async (req, res) => {
  try {
    const { userId, message, isSubscriber = false } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: 'userId y message son requeridos'
      });
    }

    let businessLogicResult = null;

    // Detectar si requiere lógica específica del negocio
    if (isTicketNumber(message)) {
      businessLogicResult = await handleTicketInquiry(message, userId, isSubscriber);
    } else if (isConfirmationMessage(message)) {
      businessLogicResult = await handlePurchaseConfirmation(userId);
    } else if (isCancellationMessage(message)) {
      businessLogicResult = handlePurchaseCancellation(userId);
    }

    // Usar DeepSeek para mejorar la respuesta o generar respuesta natural
    const finalResponse = await callDeepSeek(message, userId, isSubscriber, businessLogicResult);
    
    res.json({
      success: true,
      message: finalResponse,
      usedAI: !!process.env.DEEPSEEK_API_KEY,
      usedDatabase: isTicketNumber(message),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Endpoint de streaming
app.post('/chat/stream', async (req, res) => {
  try {
    const { userId, message, isSubscriber = false } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: 'userId y message son requeridos'
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

    let businessLogicResult = null;

    // Detectar si requiere lógica específica del negocio
    if (isTicketNumber(message)) {
      businessLogicResult = await handleTicketInquiry(message, userId, isSubscriber);
    } else if (isConfirmationMessage(message)) {
      businessLogicResult = await handlePurchaseConfirmation(userId);
    } else if (isCancellationMessage(message)) {
      businessLogicResult = handlePurchaseCancellation(userId);
    }

    // Obtener respuesta de DeepSeek
    const response = await callDeepSeek(message, userId, isSubscriber, businessLogicResult);
    
    // Simular streaming palabra por palabra
    const words = response.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      res.write(chunk);
      
      // Pequeño delay para simular streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    res.end();

  } catch (error) {
    console.error('Error en chat streaming:', error);
    res.write('🤖 Disculpa, he tenido un problema técnico. ¿Podrías repetir tu mensaje?');
    res.end();
  }
});

// Iniciar servidor
app.listen(port, async () => {
  console.log(`🚀 Backend REAL ejecutándose en puerto ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${port}/chat`);
  console.log(`🌊 Streaming endpoint: http://localhost:${port}/chat/stream`);
  console.log(`📈 Stats endpoint: http://localhost:${port}/stats`);
  
  // Mostrar estado de DeepSeek
  if (process.env.DEEPSEEK_API_KEY) {
    console.log(`🧠 DeepSeek AI: ✅ Configurado y listo`);
  } else {
    console.log(`🧠 DeepSeek AI: ❌ No configurado (usando respuestas predefinidas)`);
  }

  // Probar conexión a Supabase
  try {
    const { data, error } = await supabase
      .from('lottery_tickets')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.log(`🗄️ Supabase: ❌ Error de conexión - ${error.message}`);
    } else {
      console.log(`🗄️ Supabase: ✅ Conectado a base de datos real`);
      
      // Mostrar estadísticas
      const { data: stats } = await supabase
        .from('lottery_tickets')
        .select('status, is_exclusive');
      
      if (stats) {
        const total = stats.length;
        const available = stats.filter(t => t.status === 'available').length;
        const exclusive = stats.filter(t => t.is_exclusive).length;
        
        console.log(`📊 Billetes en base de datos: ${total} total, ${available} disponibles, ${exclusive} exclusivos`);
      }
    }
  } catch (error) {
    console.log(`🗄️ Supabase: ❌ Error - ${error.message}`);
  }
});

