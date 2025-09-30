const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createSchema() {
  console.log('🚀 Creando esquema completo en Supabase...');
  
  try {
    // Primero, vamos a crear una función para ejecutar SQL
    console.log('📝 Creando función auxiliar...');
    
    // Intentar crear las tablas usando el método directo de inserción
    console.log('📝 Creando tabla lottery_tickets usando DDL...');
    
    // Usar la API de administración para crear la tabla
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/sql',
        'Accept': 'application/json'
      },
      body: `
        -- Crear tabla lottery_tickets
        CREATE TABLE IF NOT EXISTS lottery_tickets (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ticket_number VARCHAR(10) UNIQUE NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
          is_exclusive BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear índices
        CREATE INDEX IF NOT EXISTS idx_lottery_tickets_number ON lottery_tickets(ticket_number);
        CREATE INDEX IF NOT EXISTS idx_lottery_tickets_status ON lottery_tickets(status);
        CREATE INDEX IF NOT EXISTS idx_lottery_tickets_exclusive ON lottery_tickets(is_exclusive);

        -- Crear tabla subscribers
        CREATE TABLE IF NOT EXISTS subscribers (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone_number VARCHAR(20) UNIQUE NOT NULL,
          email VARCHAR(255),
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          subscription_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear tabla orders
        CREATE TABLE IF NOT EXISTS orders (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ticket_id UUID REFERENCES lottery_tickets(id),
          user_phone VARCHAR(20) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'processed', 'cancelled')),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear tabla user_sessions
        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_phone VARCHAR(20) NOT NULL,
          state VARCHAR(50) NOT NULL,
          context JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear tabla knowledge_base
        CREATE TABLE IF NOT EXISTS knowledge_base (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          category VARCHAR(100) NOT NULL,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          keywords TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear tabla system_logs
        CREATE TABLE IF NOT EXISTS system_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          level VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          context JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    console.log('📊 Respuesta del servidor:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error en la respuesta:', errorText);
    } else {
      console.log('✅ Esquema creado exitosamente');
    }

    // Ahora intentar insertar datos de prueba
    console.log('📝 Insertando datos de prueba...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('lottery_tickets')
      .insert([
        { ticket_number: '12345', price: 10.00, is_exclusive: false },
        { ticket_number: '67890', price: 15.00, is_exclusive: true },
        { ticket_number: '11111', price: 5.00, is_exclusive: false },
        { ticket_number: '22222', price: 20.00, is_exclusive: true },
        { ticket_number: '33333', price: 8.00, is_exclusive: false }
      ]);

    if (insertError) {
      console.log('⚠️ Error insertando datos:', insertError.message);
    } else {
      console.log('✅ Datos de prueba insertados');
    }

    // Verificar que todo funciona
    const { data: testData, error: testError } = await supabase
      .from('lottery_tickets')
      .select('*')
      .limit(5);

    if (testError) {
      console.log('❌ Error consultando datos:', testError.message);
    } else {
      console.log('✅ Verificación exitosa:', testData.length, 'billetes encontrados');
      testData.forEach(ticket => {
        console.log(`  - ${ticket.ticket_number}: $${ticket.price} (${ticket.is_exclusive ? 'Exclusivo' : 'Regular'})`);
      });
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

createSchema();

