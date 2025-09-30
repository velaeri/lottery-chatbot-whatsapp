const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  console.log('🚀 Creando tablas en Supabase...');
  
  try {
    // Crear tabla lottery_tickets
    console.log('📝 Creando tabla lottery_tickets...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lottery_tickets (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ticket_number VARCHAR(10) UNIQUE NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
          is_exclusive BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error1) {
      console.log('⚠️ Error creando lottery_tickets (puede que ya exista):', error1.message);
    } else {
      console.log('✅ Tabla lottery_tickets creada');
    }

    // Insertar algunos datos de prueba
    console.log('📝 Insertando datos de prueba...');
    const { error: insertError } = await supabase
      .from('lottery_tickets')
      .insert([
        { ticket_number: '12345', price: 10.00, is_exclusive: false },
        { ticket_number: '67890', price: 15.00, is_exclusive: true },
        { ticket_number: '11111', price: 5.00, is_exclusive: false },
        { ticket_number: '22222', price: 20.00, is_exclusive: true },
        { ticket_number: '33333', price: 8.00, is_exclusive: false }
      ]);

    if (insertError) {
      console.log('⚠️ Error insertando datos (pueden ya existir):', insertError.message);
    } else {
      console.log('✅ Datos de prueba insertados');
    }

    // Verificar que los datos se insertaron
    const { data, error: selectError } = await supabase
      .from('lottery_tickets')
      .select('*')
      .limit(5);

    if (selectError) {
      console.log('❌ Error consultando datos:', selectError.message);
    } else {
      console.log('✅ Datos verificados:', data.length, 'billetes encontrados');
      console.log('📊 Primeros billetes:', data);
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

createTables();

