#!/usr/bin/env node

/**
 * Script para generar datos de prueba adicionales
 * Útil para testing y desarrollo
 */

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log(chalk.blue.bold('🎲 GENERADOR DE DATOS DE PRUEBA'));
console.log(chalk.gray('Genera datos adicionales para testing y desarrollo\\n'));

async function main() {
  try {
    // Verificar conexión
    const supabase = await initializeSupabase();
    
    // Mostrar opciones
    const options = await showOptions();
    
    // Generar datos según selección
    if (options.tickets) await generateTickets(supabase, options.ticketCount);
    if (options.subscribers) await generateSubscribers(supabase, options.subscriberCount);
    if (options.knowledge) await generateKnowledge(supabase);
    if (options.orders) await generateOrders(supabase, options.orderCount);
    if (options.sessions) await generateSessions(supabase, options.sessionCount);
    
    console.log(chalk.green('\\n🎉 ¡Generación de datos completada!'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
}

async function initializeSupabase() {
  const spinner = ora('Conectando a Supabase...').start();
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test de conexión
    const { error } = await supabase
      .from('lottery_tickets')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Error de conexión: ${error.message}`);
    }
    
    spinner.succeed('Conectado a Supabase');
    return supabase;
    
  } catch (error) {
    spinner.fail('Error conectando a Supabase');
    throw error;
  }
}

async function showOptions() {
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'dataTypes',
      message: '¿Qué tipos de datos quieres generar?',
      choices: [
        { name: 'Billetes de lotería', value: 'tickets' },
        { name: 'Abonados', value: 'subscribers' },
        { name: 'Base de conocimiento', value: 'knowledge' },
        { name: 'Órdenes de prueba', value: 'orders' },
        { name: 'Sesiones de usuario', value: 'sessions' }
      ]
    }
  ]);

  const options = {
    tickets: answers.dataTypes.includes('tickets'),
    subscribers: answers.dataTypes.includes('subscribers'),
    knowledge: answers.dataTypes.includes('knowledge'),
    orders: answers.dataTypes.includes('orders'),
    sessions: answers.dataTypes.includes('sessions')
  };

  // Preguntar cantidades
  if (options.tickets) {
    const { ticketCount } = await inquirer.prompt([
      {
        type: 'number',
        name: 'ticketCount',
        message: '¿Cuántos billetes generar?',
        default: 50,
        validate: (input) => input > 0 && input <= 1000
      }
    ]);
    options.ticketCount = ticketCount;
  }

  if (options.subscribers) {
    const { subscriberCount } = await inquirer.prompt([
      {
        type: 'number',
        name: 'subscriberCount',
        message: '¿Cuántos abonados generar?',
        default: 20,
        validate: (input) => input > 0 && input <= 100
      }
    ]);
    options.subscriberCount = subscriberCount;
  }

  if (options.orders) {
    const { orderCount } = await inquirer.prompt([
      {
        type: 'number',
        name: 'orderCount',
        message: '¿Cuántas órdenes generar?',
        default: 30,
        validate: (input) => input > 0 && input <= 200
      }
    ]);
    options.orderCount = orderCount;
  }

  if (options.sessions) {
    const { sessionCount } = await inquirer.prompt([
      {
        type: 'number',
        name: 'sessionCount',
        message: '¿Cuántas sesiones generar?',
        default: 15,
        validate: (input) => input > 0 && input <= 100
      }
    ]);
    options.sessionCount = sessionCount;
  }

  return options;
}

async function generateTickets(supabase, count) {
  const spinner = ora(`Generando ${count} billetes...`).start();
  
  try {
    const tickets = [];
    const usedNumbers = new Set();
    
    // Obtener números existentes
    const { data: existing } = await supabase
      .from('lottery_tickets')
      .select('ticket_number');
    
    existing?.forEach(ticket => usedNumbers.add(ticket.ticket_number));
    
    for (let i = 0; i < count; i++) {
      let ticketNumber;
      do {
        ticketNumber = String(Math.floor(Math.random() * 90000) + 10000);
      } while (usedNumbers.has(ticketNumber));
      
      usedNumbers.add(ticketNumber);
      
      const isExclusive = Math.random() < 0.2; // 20% exclusivos
      const basePrice = isExclusive ? 15 : 5;
      const price = basePrice + Math.floor(Math.random() * 10);
      
      tickets.push({
        ticket_number: ticketNumber,
        price: price,
        status: Math.random() < 0.8 ? 'available' : (Math.random() < 0.5 ? 'reserved' : 'sold'),
        is_exclusive: isExclusive
      });
    }
    
    // Insertar en lotes de 50
    for (let i = 0; i < tickets.length; i += 50) {
      const batch = tickets.slice(i, i + 50);
      const { error } = await supabase
        .from('lottery_tickets')
        .insert(batch);
      
      if (error) {
        throw new Error(`Error insertando lote: ${error.message}`);
      }
    }
    
    spinner.succeed(`${count} billetes generados`);
    
  } catch (error) {
    spinner.fail('Error generando billetes');
    throw error;
  }
}

async function generateSubscribers(supabase, count) {
  const spinner = ora(`Generando ${count} abonados...`).start();
  
  try {
    const subscribers = [];
    const names = [
      'María García', 'José Rodríguez', 'Carmen López', 'Antonio Martín',
      'Ana Sánchez', 'Francisco Pérez', 'Isabel Gómez', 'Manuel Ruiz',
      'Pilar Hernández', 'David Jiménez', 'Teresa Álvarez', 'Carlos Moreno',
      'Rosa Muñoz', 'Miguel Romero', 'Dolores Alonso', 'Juan Gutiérrez',
      'Josefa Navarro', 'Pedro Torres', 'Antonia Domínguez', 'Alejandro Vázquez'
    ];
    
    for (let i = 0; i < count; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const phoneNumber = `+346${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
      
      subscribers.push({
        name: `${name} ${i + 1}`,
        phone_number: phoneNumber,
        email: `usuario${i + 1}@email.com`,
        status: Math.random() < 0.9 ? 'active' : 'inactive',
        subscription_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    const { error } = await supabase
      .from('subscribers')
      .insert(subscribers);
    
    if (error) {
      throw new Error(error.message);
    }
    
    spinner.succeed(`${count} abonados generados`);
    
  } catch (error) {
    spinner.fail('Error generando abonados');
    throw error;
  }
}

async function generateKnowledge(supabase) {
  const spinner = ora('Generando entradas de conocimiento...').start();
  
  try {
    const knowledgeEntries = [
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
        category: 'proceso_compra',
        question: '¿Qué métodos de pago aceptan?',
        answer: 'Aceptamos efectivo, tarjeta de crédito/débito y transferencia bancaria.',
        keywords: 'pago metodos tarjeta efectivo transferencia'
      },
      {
        category: 'info_billetes',
        question: '¿Cuál es la diferencia entre billetes regulares y exclusivos?',
        answer: 'Los billetes exclusivos tienen mayor premio y solo están disponibles para abonados.',
        keywords: 'diferencia exclusivo regular abonado premio'
      },
      {
        category: 'suscripcion',
        question: '¿Cómo puedo ser abonado?',
        answer: 'Para ser abonado, visita nuestra oficina con tu DNI. La suscripción cuesta 20€ anuales.',
        keywords: 'abonado suscripcion como ser precio coste'
      },
      {
        category: 'sorteos',
        question: '¿Cuándo son los sorteos?',
        answer: 'Los sorteos se realizan todos los sábados a las 20:00. Los resultados se publican inmediatamente.',
        keywords: 'sorteo cuando fecha hora sabado resultados'
      },
      {
        category: 'premios',
        question: '¿Cómo cobro si gano?',
        answer: 'Los premios se cobran en nuestra oficina con el billete original y DNI. Premios mayores requieren cita previa.',
        keywords: 'cobrar premio ganar oficina dni cita'
      }
    ];
    
    const { error } = await supabase
      .from('knowledge_base')
      .insert(knowledgeEntries);
    
    if (error) {
      throw new Error(error.message);
    }
    
    spinner.succeed(`${knowledgeEntries.length} entradas de conocimiento generadas`);
    
  } catch (error) {
    spinner.fail('Error generando base de conocimiento');
    throw error;
  }
}

async function generateOrders(supabase, count) {
  const spinner = ora(`Generando ${count} órdenes...`).start();
  
  try {
    // Obtener billetes disponibles
    const { data: tickets } = await supabase
      .from('lottery_tickets')
      .select('id')
      .eq('status', 'available')
      .limit(count);
    
    if (!tickets || tickets.length === 0) {
      throw new Error('No hay billetes disponibles para generar órdenes');
    }
    
    const orders = [];
    const statuses = ['pending_review', 'processed', 'cancelled'];
    
    for (let i = 0; i < Math.min(count, tickets.length); i++) {
      const phoneNumber = `+346${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
      
      orders.push({
        ticket_id: tickets[i].id,
        user_phone: phoneNumber,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        notes: `Orden de prueba generada automáticamente`,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    const { error } = await supabase
      .from('orders')
      .insert(orders);
    
    if (error) {
      throw new Error(error.message);
    }
    
    spinner.succeed(`${orders.length} órdenes generadas`);
    
  } catch (error) {
    spinner.fail('Error generando órdenes');
    throw error;
  }
}

async function generateSessions(supabase, count) {
  const spinner = ora(`Generando ${count} sesiones...`).start();
  
  try {
    const sessions = [];
    const states = ['main_menu', 'ticket_inquiry', 'purchase_confirmation', 'chitchat'];
    
    for (let i = 0; i < count; i++) {
      const phoneNumber = `+346${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
      const state = states[Math.floor(Math.random() * states.length)];
      
      let context = {};
      if (state === 'ticket_inquiry' || state === 'purchase_confirmation') {
        context = {
          ticket_number: String(Math.floor(Math.random() * 90000) + 10000),
          ticket_price: Math.floor(Math.random() * 20) + 5
        };
      }
      
      sessions.push({
        user_phone: phoneNumber,
        state: state,
        context: context,
        updated_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    const { error } = await supabase
      .from('user_sessions')
      .upsert(sessions);
    
    if (error) {
      throw new Error(error.message);
    }
    
    spinner.succeed(`${count} sesiones generadas`);
    
  } catch (error) {
    spinner.fail('Error generando sesiones');
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };

