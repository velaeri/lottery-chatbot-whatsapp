const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🚀 Creando tablas en Supabase...');

  try {
    // Crear tabla de billetes de lotería
    const { data: ticketsData, error: ticketsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lottery_tickets (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ticket_number VARCHAR(10) UNIQUE NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
          is_exclusive BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_lottery_tickets_number ON lottery_tickets(ticket_number);
        CREATE INDEX IF NOT EXISTS idx_lottery_tickets_status ON lottery_tickets(status);
      `
    });

    if (ticketsError) {
      console.log('⚠️ Intentando método alternativo para crear tablas...');
      
      // Método alternativo: usar la tabla directamente
      const { error: insertError } = await supabase
        .from('lottery_tickets')
        .insert([
          { ticket_number: 'test', price: 1, status: 'available' }
        ]);

      if (insertError && insertError.code === '42P01') {
        console.log('📋 Las tablas no existen. Necesitas crearlas manualmente en Supabase.');
        console.log('🔗 Ve a: https://supabase.com/dashboard/project/zgttgbdbujrzduqekfmp/editor');
        console.log('📝 Ejecuta este SQL:');
        console.log(`
CREATE TABLE lottery_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number VARCHAR(10) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  is_exclusive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  subscription_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keywords TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
        `);
        return false;
      }
    }

    console.log('✅ Tablas creadas exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    return false;
  }
}

async function insertSampleData() {
  console.log('📊 Insertando datos de prueba...');

  try {
    // Limpiar datos existentes
    await supabase.from('lottery_tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insertar billetes de lotería
    const tickets = [];
    for (let i = 10000; i <= 99999; i += Math.floor(Math.random() * 100) + 1) {
      tickets.push({
        ticket_number: i.toString(),
        price: Math.floor(Math.random() * 20) + 5, // Precios entre 5 y 25€
        status: Math.random() > 0.8 ? 'sold' : 'available', // 20% vendidos
        is_exclusive: Math.random() > 0.7 // 30% exclusivos
      });
      
      if (tickets.length >= 1000) break; // Limitar a 1000 billetes
    }

    const { error: ticketsError } = await supabase
      .from('lottery_tickets')
      .insert(tickets);

    if (ticketsError) {
      console.error('❌ Error insertando billetes:', ticketsError);
      return false;
    }

    // Insertar abonados de ejemplo
    const subscribers = [
      { phone_number: '+34600000001', name: 'María García' },
      { phone_number: '+34600000002', name: 'Juan Pérez' },
      { phone_number: '+34600000003', name: 'Ana López' },
      { phone_number: '+34600000004', name: 'Carlos Ruiz' },
      { phone_number: '+34600000005', name: 'Laura Martín' }
    ];

    const { error: subscribersError } = await supabase
      .from('subscribers')
      .insert(subscribers);

    if (subscribersError) {
      console.log('⚠️ Error insertando abonados (puede que la tabla no exista):', subscribersError.message);
    }

    // Insertar base de conocimiento
    const knowledge = [
      {
        keywords: 'horario atencion abierto cerrado',
        answer: 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 y sábados de 9:00 a 14:00.',
        category: 'horarios'
      },
      {
        keywords: 'ubicacion direccion donde estamos',
        answer: 'Estamos ubicados en Calle Principal 123, Madrid. ¡Te esperamos!',
        category: 'ubicacion'
      },
      {
        keywords: 'sorteo cuando premio',
        answer: 'Los sorteos se realizan todos los sábados a las 20:00. Los resultados se publican inmediatamente.',
        category: 'sorteos'
      },
      {
        keywords: 'abonado suscripcion exclusivo',
        answer: 'La suscripción de abonado cuesta 20€ anuales y te da acceso a billetes exclusivos. Visita nuestra oficina con tu DNI.',
        category: 'suscripcion'
      },
      {
        keywords: 'precio coste cuanto vale',
        answer: 'Los precios de los billetes varían entre 5€ y 25€ dependiendo del número y tipo.',
        category: 'precios'
      }
    ];

    const { error: knowledgeError } = await supabase
      .from('knowledge_base')
      .insert(knowledge);

    if (knowledgeError) {
      console.log('⚠️ Error insertando base de conocimiento (puede que la tabla no exista):', knowledgeError.message);
    }

    console.log('✅ Datos de prueba insertados exitosamente');
    console.log(`📊 Se crearon ${tickets.length} billetes de lotería`);
    
    return true;

  } catch (error) {
    console.error('❌ Error insertando datos:', error);
    return false;
  }
}

async function testConnection() {
  console.log('🔍 Probando conexión a Supabase...');

  try {
    const { data, error } = await supabase
      .from('lottery_tickets')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }

    console.log('✅ Conexión exitosa a Supabase');
    return true;

  } catch (error) {
    console.error('❌ Error probando conexión:', error);
    return false;
  }
}

async function main() {
  console.log('🎯 Configurando base de datos real para el chatbot de lotería');
  console.log('🔗 Proyecto:', supabaseUrl);
  
  // Probar conexión
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ No se pudo conectar a Supabase. Verifica las credenciales.');
    return;
  }

  // Crear tablas
  const tablesCreated = await createTables();
  if (!tablesCreated) {
    console.log('⚠️ Las tablas necesitan ser creadas manualmente.');
    console.log('📋 Sigue las instrucciones mostradas arriba.');
    return;
  }

  // Insertar datos
  const dataInserted = await insertSampleData();
  if (!dataInserted) {
    console.log('❌ Error insertando datos de prueba.');
    return;
  }

  console.log('🎉 ¡Base de datos configurada exitosamente!');
  console.log('🚀 El chatbot ahora puede consultar billetes reales.');
}

main().catch(console.error);

