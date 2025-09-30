-- =====================================================
-- DATOS DE PRUEBA - LOTTERY CHATBOT
-- =====================================================
-- Versión: 001
-- Fecha: 2025-09-11
-- Descripción: Datos de ejemplo para testing y desarrollo

-- =====================================================
-- LIMPIAR DATOS EXISTENTES (solo para desarrollo)
-- =====================================================
TRUNCATE TABLE public.system_logs CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.user_sessions CASCADE;
TRUNCATE TABLE public.knowledge_base CASCADE;
TRUNCATE TABLE public.subscribers CASCADE;
TRUNCATE TABLE public.lottery_tickets CASCADE;

-- =====================================================
-- BILLETES DE LOTERÍA DE EJEMPLO
-- =====================================================

-- Billetes regulares disponibles
INSERT INTO public.lottery_tickets (ticket_number, status, is_exclusive, price) VALUES
('12345', 'available', false, 20.00),
('12346', 'available', false, 20.00),
('12347', 'available', false, 20.00),
('12348', 'available', false, 20.00),
('12349', 'available', false, 20.00),
('12350', 'available', false, 25.00),
('12351', 'available', false, 25.00),
('12352', 'available', false, 25.00),
('12353', 'available', false, 30.00),
('12354', 'available', false, 30.00);

-- Billetes exclusivos para abonados
INSERT INTO public.lottery_tickets (ticket_number, status, is_exclusive, price) VALUES
('99001', 'available', true, 50.00),
('99002', 'available', true, 50.00),
('99003', 'available', true, 75.00),
('99004', 'available', true, 75.00),
('99005', 'available', true, 100.00);

-- Algunos billetes ya vendidos (para testing)
INSERT INTO public.lottery_tickets (ticket_number, status, is_exclusive, price) VALUES
('11111', 'sold', false, 20.00),
('22222', 'sold', false, 25.00),
('33333', 'reserved', false, 30.00);

-- Billetes con números especiales
INSERT INTO public.lottery_tickets (ticket_number, status, is_exclusive, price) VALUES
('00001', 'available', true, 200.00),
('77777', 'available', true, 150.00),
('88888', 'available', false, 100.00),
('99999', 'available', true, 300.00);

-- =====================================================
-- ABONADOS DE EJEMPLO
-- =====================================================
INSERT INTO public.subscribers (phone_number, status, name) VALUES
('+34600123456', 'active', 'Juan Pérez'),
('+34600123457', 'active', 'María García'),
('+34600123458', 'active', 'Carlos López'),
('+34600123459', 'inactive', 'Ana Martín'),
('+34600123460', 'active', 'Luis Rodríguez');

-- =====================================================
-- BASE DE CONOCIMIENTO
-- =====================================================

-- Información general de la empresa
INSERT INTO public.knowledge_base (question, answer, keywords, category) VALUES
('Horarios de atención', 
 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 horas. Los sábados de 9:00 a 14:00 horas. Domingos cerrado.',
 'horario,horarios,abre,cierra,atención,atencion,cuando,hora,horas',
 'info_general'),

('Dirección de la tienda',
 'Nos encontramos en Calle Principal 123, 28001 Madrid. Muy cerca del metro Sol.',
 'dirección,direccion,donde,ubicación,ubicacion,tienda,local,calle,madrid',
 'info_general'),

('Teléfono de contacto',
 'Puedes llamarnos al +34 900 123 456 en nuestro horario de atención.',
 'teléfono,telefono,llamar,contacto,número,numero',
 'info_general'),

('Cómo comprar billetes',
 'Para comprar un billete, simplemente envíame el número que te interesa. Te diré si está disponible y te ayudo con el proceso de compra.',
 'comprar,compra,billete,billetes,como,cómo,proceso',
 'proceso_compra'),

('Métodos de pago',
 'Aceptamos pago en efectivo en nuestra tienda física, transferencia bancaria y tarjeta de crédito/débito.',
 'pago,pagos,efectivo,tarjeta,transferencia,como pagar,métodos',
 'proceso_compra'),

('Qué son los billetes exclusivos',
 'Los billetes exclusivos son números especiales disponibles solo para nuestros abonados. Tienen premios más altos y mejores probabilidades.',
 'exclusivo,exclusivos,abonado,abonados,especial,especiales,premium',
 'info_billetes'),

('Cómo ser abonado',
 'Para ser abonado, visita nuestra tienda física o llámanos al +34 900 123 456. Te explicaremos los beneficios y el proceso de suscripción.',
 'abonado,abonados,suscripción,suscripcion,como ser,beneficios',
 'suscripcion'),

('Precios de los billetes',
 'Nuestros billetes regulares van desde 20€ hasta 30€. Los billetes exclusivos para abonados van desde 50€ hasta 300€.',
 'precio,precios,cuesta,cuestan,coste,valor,euros',
 'info_billetes'),

('Sorteos y fechas',
 'Los sorteos se realizan todos los jueves a las 21:00 horas. Los resultados se publican en nuestra web y redes sociales.',
 'sorteo,sorteos,cuando,fecha,fechas,jueves,resultados',
 'sorteos'),

('Premios y ganancias',
 'Los premios varían según el billete. Consulta las bases del sorteo en nuestra web www.loteriaxyz.com o pregunta en la tienda.',
 'premio,premios,ganancias,cuanto,bases,web,website',
 'premios');

-- Respuestas para situaciones comunes
INSERT INTO public.knowledge_base (question, answer, keywords, category) VALUES
('Saludo general',
 '¡Hola! 👋 Soy el asistente virtual de Lotería XYZ. Puedo ayudarte a consultar la disponibilidad de billetes, informarte sobre nuestros servicios o responder tus preguntas. ¿En qué puedo ayudarte?',
 'hola,hello,buenas,buenos días,buenas tardes,buenas noches,saludos',
 'saludos'),

('Despedida',
 '¡Hasta pronto! 👋 Gracias por contactar con Lotería XYZ. Si necesitas algo más, no dudes en escribirme. ¡Que tengas un buen día!',
 'adiós,adios,hasta luego,chao,bye,gracias,despedida',
 'despedidas'),

('No entiendo',
 'Disculpa, no he entendido tu consulta. Puedes:\n• Enviarme un número de billete para consultar disponibilidad\n• Escribir "menú" para ver las opciones\n• Hacer una pregunta sobre nuestros servicios\n\n¿Puedes ser más específico?',
 'no entiendo,ayuda,help,que puedes hacer,opciones',
 'ayuda');

-- =====================================================
-- SESIONES DE EJEMPLO (para testing)
-- =====================================================
INSERT INTO public.user_sessions (user_phone, state, context) VALUES
('+34600123456', 'main_menu', '{}'),
('+34600123457', 'awaiting_purchase_confirmation', '{"ticket_number": "12345", "ticket_price": 20.00}');

-- =====================================================
-- ÓRDENES DE EJEMPLO
-- =====================================================
-- Obtener algunos IDs de tickets para las órdenes
DO $$
DECLARE
    ticket_id_1 UUID;
    ticket_id_2 UUID;
BEGIN
    SELECT id INTO ticket_id_1 FROM lottery_tickets WHERE ticket_number = '33333';
    SELECT id INTO ticket_id_2 FROM lottery_tickets WHERE ticket_number = '11111';
    
    INSERT INTO public.orders (ticket_id, user_phone, status, notes) VALUES
    (ticket_id_1, '+34600123456', 'pending_review', 'Solicitud automática desde chatbot'),
    (ticket_id_2, '+34600123457', 'processed', 'Compra completada en tienda física');
END $$;

-- =====================================================
-- LOGS DE EJEMPLO
-- =====================================================
INSERT INTO public.system_logs (level, message, context, user_phone, workflow_id) VALUES
('info', 'Usuario consultó disponibilidad de billete', '{"ticket_number": "12345", "result": "available"}', '+34600123456', 'check_availability'),
('info', 'Nueva orden creada', '{"order_id": "uuid-example", "ticket_number": "33333"}', '+34600123456', 'create_order'),
('warn', 'Usuario intentó acceder a billete exclusivo sin suscripción', '{"ticket_number": "99001"}', '+34600999999', 'check_availability'),
('error', 'Error al conectar con API de WhatsApp', '{"error": "timeout", "retry_count": 3}', NULL, 'send_message');

-- =====================================================
-- VERIFICACIÓN DE DATOS
-- =====================================================

-- Mostrar resumen de datos insertados
DO $$
BEGIN
    RAISE NOTICE 'Datos de prueba insertados exitosamente:';
    RAISE NOTICE '- Billetes de lotería: %', (SELECT COUNT(*) FROM lottery_tickets);
    RAISE NOTICE '- Abonados: %', (SELECT COUNT(*) FROM subscribers);
    RAISE NOTICE '- Entradas de conocimiento: %', (SELECT COUNT(*) FROM knowledge_base);
    RAISE NOTICE '- Sesiones de usuario: %', (SELECT COUNT(*) FROM user_sessions);
    RAISE NOTICE '- Órdenes: %', (SELECT COUNT(*) FROM orders);
    RAISE NOTICE '- Logs del sistema: %', (SELECT COUNT(*) FROM system_logs);
END $$;

