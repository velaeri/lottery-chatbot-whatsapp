#!/usr/bin/env node

/**
 * Demostración completa del chatbot de lotería
 * Simula conversaciones reales con el bot
 */

const readline = require('readline');

// Colores simples para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Datos simulados
const mockTickets = [
  { ticket_number: '12345', price: 10.00, status: 'available', is_exclusive: false },
  { ticket_number: '67890', price: 15.00, status: 'available', is_exclusive: true },
  { ticket_number: '11111', price: 5.00, status: 'sold', is_exclusive: false },
  { ticket_number: '22222', price: 20.00, status: 'available', is_exclusive: true },
  { ticket_number: '33333', price: 8.00, status: 'reserved', is_exclusive: false },
  { ticket_number: '55555', price: 12.00, status: 'available', is_exclusive: false },
  { ticket_number: '77777', price: 25.00, status: 'available', is_exclusive: true }
];

const mockSubscribers = [
  { phone_number: '+34666123456', name: 'María García', status: 'active' },
  { phone_number: '+34666789012', name: 'José Rodríguez', status: 'active' },
  { phone_number: '+34666345678', name: 'Carmen López', status: 'active' }
];

const mockKnowledge = [
  {
    category: 'info_general',
    question: '¿Cuál es el horario de atención?',
    answer: 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 y sábados de 9:00 a 14:00.',
    keywords: 'horario atencion abierto cerrado horas'
  },
  {
    category: 'info_general',
    question: '¿Dónde están ubicados?',
    answer: 'Estamos ubicados en Calle Principal 123, Madrid. También puedes visitarnos en nuestra web.',
    keywords: 'direccion ubicacion donde estan oficina'
  },
  {
    category: 'proceso_compra',
    question: '¿Cómo puedo comprar un billete?',
    answer: 'Puedes comprar billetes enviándome el número que deseas. Te confirmaré disponibilidad y precio.',
    keywords: 'comprar billete como proceso pasos'
  },
  {
    category: 'sorteos',
    question: '¿Cuándo son los sorteos?',
    answer: 'Los sorteos se realizan todos los sábados a las 20:00. Los resultados se publican inmediatamente.',
    keywords: 'sorteo cuando fecha hora sabado resultados'
  }
];

// Estado de sesión del usuario
let userSession = {
  phone: '+34666999888',
  state: 'main_menu',
  context: {}
};

// Simulador del chatbot
class ChatbotSimulator {
  constructor() {
    this.isSubscriber = false;
  }

  // Simula el workflow principal de n8n
  async processMessage(message) {
    console.log(colorize('blue', `\n👤 Usuario: ${message}`));
    
    // Simular delay de procesamiento
    await this.delay(500);
    
    // Detectar tipo de mensaje
    if (this.isTicketNumber(message)) {
      return await this.handleTicketInquiry(message);
    } else if (message.toLowerCase().includes('menú') || message.toLowerCase().includes('menu')) {
      return await this.handleMainMenu();
    } else if (message.toLowerCase().includes('sí') || message.toLowerCase().includes('si') || message.toLowerCase().includes('confirmo')) {
      return await this.handlePurchaseConfirmation();
    } else if (message.toLowerCase().includes('no') || message.toLowerCase().includes('cancelar')) {
      return await this.handlePurchaseCancellation();
    } else {
      return await this.handleChitchat(message);
    }
  }

  // Verifica si el mensaje es un número de billete
  isTicketNumber(message) {
    return /^\d{5}$/.test(message.trim());
  }

  // Maneja consultas de billetes
  async handleTicketInquiry(ticketNumber) {
    console.log(colorize('yellow', '🔍 Procesando consulta de billete...'));
    
    const ticket = mockTickets.find(t => t.ticket_number === ticketNumber);
    
    if (!ticket) {
      return `❌ Lo siento, el billete ${ticketNumber} no existe en nuestro sistema.

¿Te gustaría consultar otro número o ver el menú principal?`;
    }

    if (ticket.status === 'sold') {
      return `❌ El billete ${ticketNumber} ya ha sido vendido.

¿Te gustaría consultar otro número disponible?`;
    }

    if (ticket.status === 'reserved') {
      return `⏳ El billete ${ticketNumber} está temporalmente reservado.

¿Te gustaría consultar otro número?`;
    }

    // Verificar si es exclusivo y el usuario es abonado
    if (ticket.is_exclusive && !this.isSubscriber) {
      return `🔒 El billete ${ticketNumber} es exclusivo para abonados.

💰 Precio: ${ticket.price}€
📋 Para ser abonado, visita nuestra oficina con tu DNI. La suscripción cuesta 20€ anuales.

¿Te gustaría consultar billetes regulares disponibles?`;
    }

    // Billete disponible
    userSession.state = 'purchase_confirmation';
    userSession.context = { ticket_number: ticketNumber, price: ticket.price };

    return `✅ ¡Billete disponible!

🎫 Número: ${ticketNumber}
💰 Precio: ${ticket.price}€
${ticket.is_exclusive ? '⭐ Billete exclusivo para abonados' : '📋 Billete regular'}

¿Deseas comprarlo? Responde "sí" para confirmar o "no" para cancelar.`;
  }

  // Maneja el menú principal
  async handleMainMenu() {
    userSession.state = 'main_menu';
    userSession.context = {};

    return `🎰 ¡Bienvenido a Lotería El Trébol!

¿En qué puedo ayudarte?

🎫 Consultar disponibilidad: Envía el número de 5 dígitos
💬 Información general: Pregúntame sobre horarios, ubicación, etc.
🎯 Sorteos: Información sobre fechas y premios

Ejemplo: Envía "12345" para consultar ese billete`;
  }

  // Maneja confirmación de compra
  async handlePurchaseConfirmation() {
    if (userSession.state !== 'purchase_confirmation') {
      return 'No hay ninguna compra pendiente de confirmación.';
    }

    const { ticket_number, price } = userSession.context;
    
    console.log(colorize('green', '💰 Procesando compra...'));
    
    // Simular reserva del billete
    const ticket = mockTickets.find(t => t.ticket_number === ticket_number);
    if (ticket) {
      ticket.status = 'reserved';
    }

    userSession.state = 'main_menu';
    userSession.context = {};

    return `🎉 ¡Compra confirmada!

🎫 Billete: ${ticket_number}
💰 Precio: ${price}€
📋 Estado: Reservado temporalmente

📞 Un operador se pondrá en contacto contigo en breve para completar el pago y la entrega.

⏰ La reserva es válida por 24 horas.

¿Necesitas algo más? Envía "menú" para ver las opciones.`;
  }

  // Maneja cancelación de compra
  async handlePurchaseCancellation() {
    if (userSession.state !== 'purchase_confirmation') {
      return 'No hay ninguna compra pendiente de cancelación.';
    }

    userSession.state = 'main_menu';
    userSession.context = {};

    return `❌ Compra cancelada.

¿Te gustaría consultar otro billete o necesitas ayuda con algo más?

Envía "menú" para ver las opciones disponibles.`;
  }

  // Maneja conversación general (chitchat)
  async handleChitchat(message) {
    console.log(colorize('cyan', '💬 Procesando consulta general...'));
    
    const lowerMessage = message.toLowerCase();
    
    // Buscar en la base de conocimiento
    for (const entry of mockKnowledge) {
      const keywords = entry.keywords.toLowerCase().split(' ');
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return `${entry.answer}

¿Necesitas algo más? Envía "menú" para ver todas las opciones.`;
      }
    }

    // Respuesta por defecto
    return `🤔 No estoy seguro de cómo ayudarte con eso.

Puedo ayudarte con:
🎫 Consultar billetes (envía un número de 5 dígitos)
📍 Información sobre horarios y ubicación
🎯 Información sobre sorteos
💰 Proceso de compra

¿En qué más puedo ayudarte?`;
  }

  // Simula delay de procesamiento
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cambia el estado de suscripción para demostración
  toggleSubscription() {
    this.isSubscriber = !this.isSubscriber;
    console.log(colorize('magenta', `\n🔄 Estado de suscripción cambiado: ${this.isSubscriber ? 'ABONADO' : 'NO ABONADO'}`));
  }
}

// Función principal de demostración
async function runDemo() {
  console.log(colorize('green', '🎰 DEMOSTRACIÓN DEL CHATBOT DE LOTERÍA'));
  console.log(colorize('gray', '═'.repeat(50)));
  console.log(colorize('yellow', 'Esta demostración simula conversaciones reales con el chatbot.'));
  console.log(colorize('yellow', 'Puedes probar diferentes tipos de mensajes y ver las respuestas.'));
  console.log(colorize('gray', '═'.repeat(50)));

  const chatbot = new ChatbotSimulator();
  
  // Mostrar datos disponibles
  console.log(colorize('cyan', '\n📊 DATOS DE DEMOSTRACIÓN:'));
  console.log(colorize('white', 'Billetes disponibles:'));
  mockTickets.forEach(ticket => {
    const status = ticket.status === 'available' ? '✅' : ticket.status === 'sold' ? '❌' : '⏳';
    const exclusive = ticket.is_exclusive ? '⭐' : '📋';
    console.log(`  ${status} ${exclusive} ${ticket.ticket_number} - ${ticket.price}€ (${ticket.status})`);
  });

  console.log(colorize('white', '\nComandos especiales:'));
  console.log(colorize('gray', '  /toggle - Cambiar estado de suscripción'));
  console.log(colorize('gray', '  /exit - Salir de la demostración'));
  console.log(colorize('gray', '  /menu - Mostrar menú principal'));

  // Configurar readline para entrada interactiva
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Mostrar mensaje inicial
  const initialResponse = await chatbot.handleMainMenu();
  console.log(colorize('green', `\n🤖 Bot: ${initialResponse}`));

  // Función para procesar entrada del usuario
  const processInput = async (input) => {
    const message = input.trim();
    
    if (message === '/exit') {
      console.log(colorize('yellow', '\n👋 ¡Gracias por probar el chatbot!'));
      rl.close();
      return;
    }
    
    if (message === '/toggle') {
      chatbot.toggleSubscription();
      rl.prompt();
      return;
    }
    
    if (message === '/menu') {
      const response = await chatbot.handleMainMenu();
      console.log(colorize('green', `\n🤖 Bot: ${response}`));
      rl.prompt();
      return;
    }

    if (message === '') {
      rl.prompt();
      return;
    }

    try {
      const response = await chatbot.processMessage(message);
      console.log(colorize('green', `\n🤖 Bot: ${response}`));
    } catch (error) {
      console.log(colorize('red', `\n❌ Error: ${error.message}`));
    }
    
    rl.prompt();
  };

  rl.setPrompt(colorize('blue', '\n💬 Tú: '));
  rl.prompt();

  rl.on('line', processInput);
  rl.on('close', () => {
    console.log(colorize('yellow', '\n🎯 Demostración finalizada.'));
    process.exit(0);
  });
}

// Ejecutar demostración si es llamado directamente
if (require.main === module) {
  runDemo().catch(error => {
    console.error(colorize('red', 'Error en la demostración:'), error);
    process.exit(1);
  });
}

module.exports = { ChatbotSimulator };

