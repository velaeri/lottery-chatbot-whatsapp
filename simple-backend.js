const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: '.env' });

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Datos simulados del chatbot
const mockTickets = [
  { ticket_number: '12345', price: 10.00, status: 'available', is_exclusive: false },
  { ticket_number: '67890', price: 15.00, status: 'available', is_exclusive: true },
  { ticket_number: '11111', price: 5.00, status: 'sold', is_exclusive: false },
  { ticket_number: '22222', price: 20.00, status: 'available', is_exclusive: true },
  { ticket_number: '33333', price: 8.00, status: 'reserved', is_exclusive: false },
  { ticket_number: '55555', price: 12.00, status: 'available', is_exclusive: false },
  { ticket_number: '77777', price: 25.00, status: 'available', is_exclusive: true }
];

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
🎫 Consultar billetes (envía un número de 5 dígitos)
📍 Información sobre horarios y ubicación  
🎯 Información sobre sorteos
💰 Proceso de compra

¿En qué más puedo ayudarte?`;
}

// Lógica de negocio para billetes
function handleTicketInquiry(ticketNumber, userId, isSubscriber) {
  const ticket = mockTickets.find(t => t.ticket_number === ticketNumber);
  
  if (!ticket) {
    return `❌ Lo siento, el billete ${ticketNumber} no existe en nuestro sistema.

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
    context: { ticket_number: ticketNumber, price: ticket.price }
  });

  return `✅ ¡Billete disponible!

🎫 Número: ${ticketNumber}
💰 Precio: ${ticket.price}€
${ticket.is_exclusive ? '⭐ Billete exclusivo para abonados' : '📋 Billete regular'}

¿Deseas comprarlo? Responde "sí" para confirmar o "no" para cancelar.`;
}

// Manejo de confirmaciones de compra
function handlePurchaseConfirmation(userId) {
  const session = userSessions.get(userId);
  
  if (!session || session.state !== 'purchase_confirmation') {
    return 'No hay ninguna compra pendiente de confirmación. ¿Te gustaría consultar un billete?';
  }

  const { ticket_number, price } = session.context;

  // Simular reserva del billete
  const ticket = mockTickets.find(t => t.ticket_number === ticket_number);
  if (ticket) {
    ticket.status = 'reserved';
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
  return /^\d{5}$/.test(message.trim());
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
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    deepseek: {
      available: !!process.env.DEEPSEEK_API_KEY,
      configured: !!process.env.DEEPSEEK_API_KEY
    }
  });
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
      businessLogicResult = handleTicketInquiry(message, userId, isSubscriber);
    } else if (isConfirmationMessage(message)) {
      businessLogicResult = handlePurchaseConfirmation(userId);
    } else if (isCancellationMessage(message)) {
      businessLogicResult = handlePurchaseCancellation(userId);
    }

    // Usar DeepSeek para mejorar la respuesta o generar respuesta natural
    const finalResponse = await callDeepSeek(message, userId, isSubscriber, businessLogicResult);
    
    res.json({
      success: true,
      message: finalResponse,
      usedAI: !!process.env.DEEPSEEK_API_KEY,
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
      businessLogicResult = handleTicketInquiry(message, userId, isSubscriber);
    } else if (isConfirmationMessage(message)) {
      businessLogicResult = handlePurchaseConfirmation(userId);
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
app.listen(port, () => {
  console.log(`🚀 Backend simple ejecutándose en puerto ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${port}/chat`);
  console.log(`🌊 Streaming endpoint: http://localhost:${port}/chat/stream`);
  
  // Mostrar estado de DeepSeek
  if (process.env.DEEPSEEK_API_KEY) {
    console.log(`🧠 DeepSeek AI: ✅ Configurado y listo`);
  } else {
    console.log(`🧠 DeepSeek AI: ❌ No configurado (usando respuestas predefinidas)`);
  }
});

