-- =====================================================
-- MIGRACIÓN INICIAL - LOTTERY CHATBOT DATABASE SCHEMA
-- =====================================================
-- Versión: 001
-- Fecha: 2025-09-11
-- Descripción: Creación de todas las tablas principales del sistema

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- TABLA: lottery_tickets
-- Descripción: Almacena el inventario de billetes de lotería
-- =====================================================
CREATE TABLE public.lottery_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_number character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    is_exclusive boolean DEFAULT false NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT lottery_tickets_pkey PRIMARY KEY (id),
    CONSTRAINT lottery_tickets_ticket_number_unique UNIQUE (ticket_number),
    CONSTRAINT lottery_tickets_status_check CHECK (status IN ('available', 'reserved', 'sold')),
    CONSTRAINT lottery_tickets_price_positive CHECK (price > 0)
);

-- Índices para lottery_tickets
CREATE INDEX ix_lottery_tickets_ticket_number ON public.lottery_tickets USING btree (ticket_number);
CREATE INDEX ix_lottery_tickets_status ON public.lottery_tickets USING btree (status);
CREATE INDEX ix_lottery_tickets_is_exclusive ON public.lottery_tickets USING btree (is_exclusive);
CREATE INDEX ix_lottery_tickets_price ON public.lottery_tickets USING btree (price);

-- =====================================================
-- TABLA: subscribers
-- Descripción: Almacena información de abonados con privilegios especiales
-- =====================================================
CREATE TABLE public.subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_number character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    name character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT subscribers_pkey PRIMARY KEY (id),
    CONSTRAINT subscribers_phone_number_unique UNIQUE (phone_number),
    CONSTRAINT subscribers_status_check CHECK (status IN ('active', 'inactive'))
);

-- Índices para subscribers
CREATE INDEX ix_subscribers_phone_number ON public.subscribers USING btree (phone_number);
CREATE INDEX ix_subscribers_status ON public.subscribers USING btree (status);

-- =====================================================
-- TABLA: orders
-- Descripción: Registra todas las solicitudes de compra
-- =====================================================
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    user_phone character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending_review'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.lottery_tickets(id) ON DELETE CASCADE,
    CONSTRAINT orders_status_check CHECK (status IN ('pending_review', 'processed', 'cancelled'))
);

-- Índices para orders
CREATE INDEX ix_orders_ticket_id ON public.orders USING btree (ticket_id);
CREATE INDEX ix_orders_user_phone ON public.orders USING btree (user_phone);
CREATE INDEX ix_orders_status ON public.orders USING btree (status);
CREATE INDEX ix_orders_created_at ON public.orders USING btree (created_at);

-- =====================================================
-- TABLA: user_sessions
-- Descripción: Gestiona el estado de las conversaciones de usuarios
-- =====================================================
CREATE TABLE public.user_sessions (
    user_phone character varying(20) NOT NULL,
    state character varying(50),
    context jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT user_sessions_pkey PRIMARY KEY (user_phone)
);

-- Índices para user_sessions
CREATE INDEX ix_user_sessions_state ON public.user_sessions USING btree (state);
CREATE INDEX ix_user_sessions_updated_at ON public.user_sessions USING btree (updated_at);
CREATE INDEX ix_user_sessions_context ON public.user_sessions USING gin (context);

-- =====================================================
-- TABLA: knowledge_base
-- Descripción: Base de conocimiento para respuestas automáticas
-- =====================================================
CREATE TABLE public.knowledge_base (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question text,
    answer text NOT NULL,
    keywords text,
    category character varying(50) DEFAULT 'general'::character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT knowledge_base_pkey PRIMARY KEY (id)
);

-- Índices para knowledge_base
CREATE INDEX ix_knowledge_base_keywords ON public.knowledge_base USING gin (to_tsvector('spanish', keywords));
CREATE INDEX ix_knowledge_base_question ON public.knowledge_base USING gin (to_tsvector('spanish', question));
CREATE INDEX ix_knowledge_base_category ON public.knowledge_base USING btree (category);
CREATE INDEX ix_knowledge_base_is_active ON public.knowledge_base USING btree (is_active);

-- =====================================================
-- TABLA: system_logs
-- Descripción: Logs del sistema para auditoría y debugging
-- =====================================================
CREATE TABLE public.system_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    level character varying(10) NOT NULL,
    message text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb,
    user_phone character varying(20),
    workflow_id character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT system_logs_pkey PRIMARY KEY (id),
    CONSTRAINT system_logs_level_check CHECK (level IN ('debug', 'info', 'warn', 'error'))
);

-- Índices para system_logs
CREATE INDEX ix_system_logs_level ON public.system_logs USING btree (level);
CREATE INDEX ix_system_logs_user_phone ON public.system_logs USING btree (user_phone);
CREATE INDEX ix_system_logs_workflow_id ON public.system_logs USING btree (workflow_id);
CREATE INDEX ix_system_logs_created_at ON public.system_logs USING btree (created_at);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_lottery_tickets_updated_at 
    BEFORE UPDATE ON public.lottery_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at 
    BEFORE UPDATE ON public.subscribers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON public.user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at 
    BEFORE UPDATE ON public.knowledge_base 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES DE NEGOCIO
-- =====================================================

-- Función para verificar disponibilidad de ticket
CREATE OR REPLACE FUNCTION check_ticket_availability(
    p_ticket_number VARCHAR,
    p_user_phone VARCHAR
)
RETURNS TABLE(
    available BOOLEAN,
    ticket_id UUID,
    price NUMERIC,
    is_exclusive BOOLEAN,
    requires_subscription BOOLEAN
) AS $$
DECLARE
    ticket_record RECORD;
    is_subscriber BOOLEAN := FALSE;
BEGIN
    -- Buscar el ticket
    SELECT t.id, t.price, t.status, t.is_exclusive
    INTO ticket_record
    FROM lottery_tickets t
    WHERE t.ticket_number = p_ticket_number;
    
    -- Si no existe el ticket
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::NUMERIC, FALSE, FALSE;
        RETURN;
    END IF;
    
    -- Si el ticket no está disponible
    IF ticket_record.status != 'available' THEN
        RETURN QUERY SELECT FALSE, ticket_record.id, ticket_record.price, ticket_record.is_exclusive, FALSE;
        RETURN;
    END IF;
    
    -- Si es exclusivo, verificar suscripción
    IF ticket_record.is_exclusive THEN
        SELECT EXISTS(
            SELECT 1 FROM subscribers s 
            WHERE s.phone_number = p_user_phone AND s.status = 'active'
        ) INTO is_subscriber;
        
        IF NOT is_subscriber THEN
            RETURN QUERY SELECT FALSE, ticket_record.id, ticket_record.price, ticket_record.is_exclusive, TRUE;
            RETURN;
        END IF;
    END IF;
    
    -- Ticket disponible
    RETURN QUERY SELECT TRUE, ticket_record.id, ticket_record.price, ticket_record.is_exclusive, FALSE;
END;
$$ LANGUAGE plpgsql;

-- Función para reservar un ticket
CREATE OR REPLACE FUNCTION reserve_ticket(
    p_ticket_number VARCHAR,
    p_user_phone VARCHAR
)
RETURNS TABLE(
    success BOOLEAN,
    order_id UUID,
    message TEXT
) AS $$
DECLARE
    ticket_id UUID;
    new_order_id UUID;
BEGIN
    -- Verificar disponibilidad
    SELECT t.id INTO ticket_id
    FROM lottery_tickets t
    WHERE t.ticket_number = p_ticket_number AND t.status = 'available';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Ticket no disponible';
        RETURN;
    END IF;
    
    -- Actualizar estado del ticket
    UPDATE lottery_tickets 
    SET status = 'reserved', updated_at = now()
    WHERE id = ticket_id;
    
    -- Crear orden
    INSERT INTO orders (ticket_id, user_phone, status)
    VALUES (ticket_id, p_user_phone, 'pending_review')
    RETURNING id INTO new_order_id;
    
    RETURN QUERY SELECT TRUE, new_order_id, 'Ticket reservado exitosamente';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================
COMMENT ON TABLE public.lottery_tickets IS 'Inventario de billetes de lotería con estado y precios';
COMMENT ON TABLE public.subscribers IS 'Usuarios abonados con acceso a billetes exclusivos';
COMMENT ON TABLE public.orders IS 'Solicitudes de compra generadas por el chatbot';
COMMENT ON TABLE public.user_sessions IS 'Estado de conversaciones activas de usuarios';
COMMENT ON TABLE public.knowledge_base IS 'Base de conocimiento para respuestas automáticas';
COMMENT ON TABLE public.system_logs IS 'Logs del sistema para auditoría y debugging';

-- =====================================================
-- PERMISOS Y SEGURIDAD
-- =====================================================
-- Nota: Las políticas RLS se configurarán en un script separado
-- para facilitar el desarrollo inicial

-- Crear rol para la aplicación
-- CREATE ROLE lottery_app_role;
-- GRANT USAGE ON SCHEMA public TO lottery_app_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lottery_app_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lottery_app_role;

