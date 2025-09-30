import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatbotService } from './services/ChatbotService';
import { TicketController } from './controllers/TicketController';
import { KnowledgeController } from './controllers/KnowledgeController';

// Cargar variables de entorno
dotenv.config({ path: '../.env' });

console.log('🔧 Variables de entorno cargadas:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurada' : '❌ No encontrada');
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '✅ Configurada' : '❌ No encontrada');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Permitir todos los orígenes para desarrollo
  credentials: true
}));
app.use(express.json());

// Inicializar servicios
const chatbotService = new ChatbotService();
const ticketController = new TicketController();
const knowledgeController = new KnowledgeController();

// Endpoint de salud
app.get('/health', (req, res) => {
  const stats = chatbotService.getStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    deepseek: {
      available: stats.deepSeekAvailable,
      stats: stats.deepSeekStats
    },
    supabase: {
      connected: stats.supabaseConnected
    }
  });
});

// Endpoint principal de chat con streaming
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

    // Procesar mensaje con streaming
    const response = await chatbotService.processMessage(userId, message, isSubscriber);
    
    // Simular streaming palabra por palabra para demostración
    const words = response.message.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      res.write(chunk);
      
      // Pequeño delay para simular streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    res.end();

  } catch (error) {
    console.error('Error en chat streaming:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Endpoint de chat sin streaming (para compatibilidad)
app.post('/chat', async (req, res) => {
  try {
    const { userId, message, isSubscriber = false } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: 'userId y message son requeridos'
      });
    }

    const response = await chatbotService.processMessage(userId, message, isSubscriber);
    
    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Endpoints de tickets
app.get('/tickets/check/:ticketNumber', ticketController.checkAvailability.bind(ticketController));
app.post('/tickets/reserve', ticketController.reserveTicket.bind(ticketController));
app.get('/tickets/stats', ticketController.getStats.bind(ticketController));

// Endpoints de base de conocimiento
app.post('/knowledge/search', knowledgeController.search.bind(knowledgeController));

// Webhook de WhatsApp (para futuro uso)
app.post('/webhook/whatsapp', (req, res) => {
  // Verificación del webhook
  if (req.query['hub.verify_token'] === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
    return;
  }

  // Procesar mensaje de WhatsApp
  console.log('Webhook de WhatsApp recibido:', req.body);
  res.sendStatus(200);
});

// Verificación del webhook de WhatsApp
app.get('/webhook/whatsapp', (req, res) => {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook de WhatsApp verificado');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Manejo de errores global
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 API del chatbot ejecutándose en puerto ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${port}/chat`);
  console.log(`🌊 Streaming endpoint: http://localhost:${port}/chat/stream`);
  
  // Mostrar estado de DeepSeek
  const stats = chatbotService.getStats();
  if (stats.deepSeekAvailable) {
    console.log(`🧠 DeepSeek AI: ✅ Configurado y listo`);
  } else {
    console.log(`🧠 DeepSeek AI: ❌ No configurado (usando respuestas predefinidas)`);
  }
});

