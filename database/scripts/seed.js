#!/usr/bin/env node

/**
 * Script para cargar datos de prueba
 * Inserta datos de ejemplo en todas las tablas
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
    process.exit(1);
}

// Cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Inserta datos de billetes de lotería
 */
async function insertLotteryTickets() {
    console.log('🎫 Insertando billetes de lotería...');
    
    const tickets = [
        // Billetes regulares
        { ticket_number: '12345', status: 'available', is_exclusive: false, price: 20.00 },
        { ticket_number: '12346', status: 'available', is_exclusive: false, price: 20.00 },
        { ticket_number: '12347', status: 'available', is_exclusive: false, price: 20.00 },
        { ticket_number: '12348', status: 'available', is_exclusive: false, price: 20.00 },
        { ticket_number: '12349', status: 'available', is_exclusive: false, price: 20.00 },
        { ticket_number: '12350', status: 'available', is_exclusive: false, price: 25.00 },
        { ticket_number: '12351', status: 'available', is_exclusive: false, price: 25.00 },
        { ticket_number: '12352', status: 'available', is_exclusive: false, price: 25.00 },
        { ticket_number: '12353', status: 'available', is_exclusive: false, price: 30.00 },
        { ticket_number: '12354', status: 'available', is_exclusive: false, price: 30.00 },
        
        // Billetes exclusivos
        { ticket_number: '99001', status: 'available', is_exclusive: true, price: 50.00 },
        { ticket_number: '99002', status: 'available', is_exclusive: true, price: 50.00 },
        { ticket_number: '99003', status: 'available', is_exclusive: true, price: 75.00 },
        { ticket_number: '99004', status: 'available', is_exclusive: true, price: 75.00 },
        { ticket_number: '99005', status: 'available', is_exclusive: true, price: 100.00 },
        
        // Billetes ya vendidos/reservados
        { ticket_number: '11111', status: 'sold', is_exclusive: false, price: 20.00 },
        { ticket_number: '22222', status: 'sold', is_exclusive: false, price: 25.00 },
        { ticket_number: '33333', status: 'reserved', is_exclusive: false, price: 30.00 },
        
        // Billetes especiales
        { ticket_number: '00001', status: 'available', is_exclusive: true, price: 200.00 },
        { ticket_number: '77777', status: 'available', is_exclusive: true, price: 150.00 },
        { ticket_number: '88888', status: 'available', is_exclusive: false, price: 100.00 },
        { ticket_number: '99999', status: 'available', is_exclusive: true, price: 300.00 }
    ];
    
    const { data, error } = await supabase
        .from('lottery_tickets')
        .insert(tickets);
    
    if (error) throw error;
    console.log(`✅ ${tickets.length} billetes insertados`);
}

/**
 * Inserta datos de abonados
 */
async function insertSubscribers() {
    console.log('👥 Insertando abonados...');
    
    const subscribers = [
        { phone_number: '+34600123456', status: 'active', name: 'Juan Pérez' },
        { phone_number: '+34600123457', status: 'active', name: 'María García' },
        { phone_number: '+34600123458', status: 'active', name: 'Carlos López' },
        { phone_number: '+34600123459', status: 'inactive', name: 'Ana Martín' },
        { phone_number: '+34600123460', status: 'active', name: 'Luis Rodríguez' }
    ];
    
    const { data, error } = await supabase
        .from('subscribers')
        .insert(subscribers);
    
    if (error) throw error;
    console.log(`✅ ${subscribers.length} abonados insertados`);
}

/**
 * Inserta base de conocimiento
 */
async function insertKnowledgeBase() {
    console.log('📚 Insertando base de conocimiento...');
    
    const knowledge = [
        {
            question: 'Horarios de atención',
            answer: 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 horas. Los sábados de 9:00 a 14:00 horas. Domingos cerrado.',
            keywords: 'horario,horarios,abre,cierra,atención,atencion,cuando,hora,horas',
            category: 'info_general'
        },
        {
            question: 'Dirección de la tienda',
            answer: 'Nos encontramos en Calle Principal 123, 28001 Madrid. Muy cerca del metro Sol.',
            keywords: 'dirección,direccion,donde,ubicación,ubicacion,tienda,local,calle,madrid',
            category: 'info_general'
        },
        {
            question: 'Teléfono de contacto',
            answer: 'Puedes llamarnos al +34 900 123 456 en nuestro horario de atención.',
            keywords: 'teléfono,telefono,llamar,contacto,número,numero',
            category: 'info_general'
        },
        {
            question: 'Cómo comprar billetes',
            answer: 'Para comprar un billete, simplemente envíame el número que te interesa. Te diré si está disponible y te ayudo con el proceso de compra.',
            keywords: 'comprar,compra,billete,billetes,como,cómo,proceso',
            category: 'proceso_compra'
        },
        {
            question: 'Métodos de pago',
            answer: 'Aceptamos pago en efectivo en nuestra tienda física, transferencia bancaria y tarjeta de crédito/débito.',
            keywords: 'pago,pagos,efectivo,tarjeta,transferencia,como pagar,métodos',
            category: 'proceso_compra'
        },
        {
            question: 'Qué son los billetes exclusivos',
            answer: 'Los billetes exclusivos son números especiales disponibles solo para nuestros abonados. Tienen premios más altos y mejores probabilidades.',
            keywords: 'exclusivo,exclusivos,abonado,abonados,especial,especiales,premium',
            category: 'info_billetes'
        },
        {
            question: 'Cómo ser abonado',
            answer: 'Para ser abonado, visita nuestra tienda física o llámanos al +34 900 123 456. Te explicaremos los beneficios y el proceso de suscripción.',
            keywords: 'abonado,abonados,suscripción,suscripcion,como ser,beneficios',
            category: 'suscripcion'
        },
        {
            question: 'Precios de los billetes',
            answer: 'Nuestros billetes regulares van desde 20€ hasta 30€. Los billetes exclusivos para abonados van desde 50€ hasta 300€.',
            keywords: 'precio,precios,cuesta,cuestan,coste,valor,euros',
            category: 'info_billetes'
        },
        {
            question: 'Sorteos y fechas',
            answer: 'Los sorteos se realizan todos los jueves a las 21:00 horas. Los resultados se publican en nuestra web y redes sociales.',
            keywords: 'sorteo,sorteos,cuando,fecha,fechas,jueves,resultados',
            category: 'sorteos'
        },
        {
            question: 'Premios y ganancias',
            answer: 'Los premios varían según el billete. Consulta las bases del sorteo en nuestra web www.loteriaxyz.com o pregunta en la tienda.',
            keywords: 'premio,premios,ganancias,cuanto,bases,web,website',
            category: 'premios'
        },
        {
            question: 'Saludo general',
            answer: '¡Hola! 👋 Soy el asistente virtual de Lotería XYZ. Puedo ayudarte a consultar la disponibilidad de billetes, informarte sobre nuestros servicios o responder tus preguntas. ¿En qué puedo ayudarte?',
            keywords: 'hola,hello,buenas,buenos días,buenas tardes,buenas noches,saludos',
            category: 'saludos'
        },
        {
            question: 'Despedida',
            answer: '¡Hasta pronto! 👋 Gracias por contactar con Lotería XYZ. Si necesitas algo más, no dudes en escribirme. ¡Que tengas un buen día!',
            keywords: 'adiós,adios,hasta luego,chao,bye,gracias,despedida',
            category: 'despedidas'
        },
        {
            question: 'No entiendo',
            answer: 'Disculpa, no he entendido tu consulta. Puedes:\n• Enviarme un número de billete para consultar disponibilidad\n• Escribir "menú" para ver las opciones\n• Hacer una pregunta sobre nuestros servicios\n\n¿Puedes ser más específico?',
            keywords: 'no entiendo,ayuda,help,que puedes hacer,opciones',
            category: 'ayuda'
        }
    ];
    
    const { data, error } = await supabase
        .from('knowledge_base')
        .insert(knowledge);
    
    if (error) throw error;
    console.log(`✅ ${knowledge.length} entradas de conocimiento insertadas`);
}

/**
 * Inserta sesiones de ejemplo
 */
async function insertUserSessions() {
    console.log('💬 Insertando sesiones de usuario...');
    
    const sessions = [
        {
            user_phone: '+34600123456',
            state: 'main_menu',
            context: {}
        },
        {
            user_phone: '+34600123457',
            state: 'awaiting_purchase_confirmation',
            context: { ticket_number: '12345', ticket_price: 20.00 }
        }
    ];
    
    const { data, error } = await supabase
        .from('user_sessions')
        .insert(sessions);
    
    if (error) throw error;
    console.log(`✅ ${sessions.length} sesiones insertadas`);
}

/**
 * Inserta órdenes de ejemplo
 */
async function insertOrders() {
    console.log('📋 Insertando órdenes...');
    
    // Primero obtener IDs de tickets
    const { data: tickets, error: ticketsError } = await supabase
        .from('lottery_tickets')
        .select('id, ticket_number')
        .in('ticket_number', ['33333', '11111']);
    
    if (ticketsError) throw ticketsError;
    
    const orders = tickets.map((ticket, index) => ({
        ticket_id: ticket.id,
        user_phone: index === 0 ? '+34600123456' : '+34600123457',
        status: index === 0 ? 'pending_review' : 'processed',
        notes: index === 0 ? 'Solicitud automática desde chatbot' : 'Compra completada en tienda física'
    }));
    
    const { data, error } = await supabase
        .from('orders')
        .insert(orders);
    
    if (error) throw error;
    console.log(`✅ ${orders.length} órdenes insertadas`);
}

/**
 * Inserta logs de ejemplo
 */
async function insertSystemLogs() {
    console.log('📝 Insertando logs del sistema...');
    
    const logs = [
        {
            level: 'info',
            message: 'Usuario consultó disponibilidad de billete',
            context: { ticket_number: '12345', result: 'available' },
            user_phone: '+34600123456',
            workflow_id: 'check_availability'
        },
        {
            level: 'info',
            message: 'Nueva orden creada',
            context: { ticket_number: '33333' },
            user_phone: '+34600123456',
            workflow_id: 'create_order'
        },
        {
            level: 'warn',
            message: 'Usuario intentó acceder a billete exclusivo sin suscripción',
            context: { ticket_number: '99001' },
            user_phone: '+34600999999',
            workflow_id: 'check_availability'
        },
        {
            level: 'error',
            message: 'Error al conectar con API de WhatsApp',
            context: { error: 'timeout', retry_count: 3 },
            user_phone: null,
            workflow_id: 'send_message'
        }
    ];
    
    const { data, error } = await supabase
        .from('system_logs')
        .insert(logs);
    
    if (error) throw error;
    console.log(`✅ ${logs.length} logs insertados`);
}

/**
 * Limpia datos existentes
 */
async function clearExistingData() {
    console.log('🧹 Limpiando datos existentes...');
    
    const tables = ['system_logs', 'orders', 'user_sessions', 'knowledge_base', 'subscribers', 'lottery_tickets'];
    
    for (const table of tables) {
        const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todo
        
        if (error && !error.message.includes('No rows found')) {
            console.warn(`⚠️  Advertencia limpiando ${table}: ${error.message}`);
        }
    }
    
    console.log('✅ Datos existentes limpiados');
}

/**
 * Muestra resumen de datos insertados
 */
async function showSummary() {
    console.log('\n📊 Resumen de datos insertados:');
    
    const tables = [
        { name: 'lottery_tickets', label: 'Billetes de lotería' },
        { name: 'subscribers', label: 'Abonados' },
        { name: 'knowledge_base', label: 'Base de conocimiento' },
        { name: 'user_sessions', label: 'Sesiones de usuario' },
        { name: 'orders', label: 'Órdenes' },
        { name: 'system_logs', label: 'Logs del sistema' }
    ];
    
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.log(`   ❌ ${table.label}: Error obteniendo conteo`);
        } else {
            console.log(`   ✅ ${table.label}: ${count} registros`);
        }
    }
}

/**
 * Función principal
 */
async function main() {
    try {
        console.log('🌱 Iniciando carga de datos de prueba...\n');
        
        // Limpiar datos existentes
        await clearExistingData();
        
        // Insertar datos
        await insertLotteryTickets();
        await insertSubscribers();
        await insertKnowledgeBase();
        await insertUserSessions();
        await insertOrders();
        await insertSystemLogs();
        
        // Mostrar resumen
        await showSummary();
        
        console.log('\n🎉 ¡Datos de prueba cargados exitosamente!');
        console.log('\n📋 Datos disponibles para testing:');
        console.log('   • Billetes regulares: 12345-12354');
        console.log('   • Billetes exclusivos: 99001-99005, 00001, 77777, 99999');
        console.log('   • Billetes vendidos/reservados: 11111, 22222, 33333');
        console.log('   • Abonado de prueba: +34600123456');
        console.log('   • Usuario regular: +34600999999');
        
    } catch (error) {
        console.error('\n💥 Error cargando datos:', error.message);
        console.log('\n🔧 Soluciones posibles:');
        console.log('   1. Verificar que las tablas existan (ejecutar npm run setup)');
        console.log('   2. Verificar las credenciales de Supabase');
        console.log('   3. Verificar permisos de la base de datos');
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { main, clearExistingData, showSummary };

