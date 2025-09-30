# 📋 INSTRUCCIONES PARA CREAR TABLAS EN SUPABASE

## 🎯 Paso 1: Acceder al SQL Editor

1. Ve a tu proyecto: https://supabase.com/dashboard/project/zgttgbdbujrzduqekfmp
2. En el menú lateral, haz clic en **"SQL Editor"**
3. Haz clic en **"New query"**

## 🎯 Paso 2: Ejecutar este SQL

Copia y pega exactamente este código SQL:

```sql
-- Crear tabla de billetes de lotería
CREATE TABLE lottery_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number VARCHAR(10) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  is_exclusive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_lottery_tickets_number ON lottery_tickets(ticket_number);
CREATE INDEX idx_lottery_tickets_status ON lottery_tickets(status);

-- Crear tabla de abonados
CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  subscription_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de base de conocimiento
CREATE TABLE knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keywords TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar billetes de ejemplo (1000 billetes)
INSERT INTO lottery_tickets (ticket_number, price, status, is_exclusive) VALUES
('10001', 8.50, 'available', false),
('10002', 12.00, 'available', true),
('10003', 5.00, 'sold', false),
('10004', 15.50, 'available', true),
('10005', 7.00, 'available', false),
('12345', 10.00, 'available', false),
('67890', 15.00, 'available', true),
('11111', 5.00, 'sold', false),
('22222', 20.00, 'available', true),
('33333', 8.00, 'reserved', false),
('55555', 12.00, 'available', false),
('77777', 25.00, 'available', true),
('88888', 18.00, 'available', true),
('99999', 22.00, 'available', false),
('54321', 9.50, 'available', false);

-- Generar más billetes automáticamente
DO $$
DECLARE
    i INTEGER;
    ticket_num VARCHAR(10);
    random_price DECIMAL(10,2);
    random_status VARCHAR(20);
    random_exclusive BOOLEAN;
BEGIN
    FOR i IN 20000..29999 LOOP
        ticket_num := i::VARCHAR;
        random_price := (RANDOM() * 20 + 5)::DECIMAL(10,2); -- Entre 5 y 25€
        random_status := CASE 
            WHEN RANDOM() > 0.8 THEN 'sold'
            WHEN RANDOM() > 0.9 THEN 'reserved'
            ELSE 'available'
        END;
        random_exclusive := RANDOM() > 0.7; -- 30% exclusivos
        
        INSERT INTO lottery_tickets (ticket_number, price, status, is_exclusive)
        VALUES (ticket_num, random_price, random_status, random_exclusive);
        
        -- Insertar cada 100 para evitar timeouts
        IF i % 100 = 0 THEN
            COMMIT;
        END IF;
    END LOOP;
END $$;

-- Insertar abonados de ejemplo
INSERT INTO subscribers (phone_number, name) VALUES
('+34600000001', 'María García'),
('+34600000002', 'Juan Pérez'),
('+34600000003', 'Ana López'),
('+34600000004', 'Carlos Ruiz'),
('+34600000005', 'Laura Martín');

-- Insertar base de conocimiento
INSERT INTO knowledge_base (keywords, answer, category) VALUES
('horario atencion abierto cerrado', 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 y sábados de 9:00 a 14:00.', 'horarios'),
('ubicacion direccion donde estamos', 'Estamos ubicados en Calle Principal 123, Madrid. ¡Te esperamos!', 'ubicacion'),
('sorteo cuando premio', 'Los sorteos se realizan todos los sábados a las 20:00. Los resultados se publican inmediatamente.', 'sorteos'),
('abonado suscripcion exclusivo', 'La suscripción de abonado cuesta 20€ anuales y te da acceso a billetes exclusivos. Visita nuestra oficina con tu DNI.', 'suscripcion'),
('precio coste cuanto vale', 'Los precios de los billetes varían entre 5€ y 25€ dependiendo del número y tipo.', 'precios');
```

## 🎯 Paso 3: Ejecutar la consulta

1. Haz clic en **"Run"** (botón azul)
2. Espera a que termine (puede tomar 1-2 minutos)
3. Deberías ver "Success. No rows returned" o similar

## 🎯 Paso 4: Verificar

1. Ve a **"Table Editor"** en el menú lateral
2. Deberías ver las tablas: `lottery_tickets`, `subscribers`, `knowledge_base`
3. Haz clic en `lottery_tickets` para ver los billetes creados

## ✅ ¡Listo!

Una vez que hayas ejecutado este SQL, avísame y conectaré el backend real a tu base de datos.

**Tendrás más de 10,000 billetes reales** para probar cualquier número que quieras en el chatbot.

