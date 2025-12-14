-- ============================================================================
-- Sistema MLF - Base de Datos PostgreSQL
-- Archivo: 05_seed_data.sql
-- Descripción: Datos iniciales del sistema (configuraciones + datos de prueba)
-- Versión: 1.0
-- Fecha: Noviembre 2025
-- ============================================================================

-- ============================================================================
-- CONFIGURACIONES INICIALES DEL SISTEMA
-- Basadas en el Documento Maestro MLF
-- ============================================================================

INSERT INTO configuraciones (clave, valor, tipo_dato, categoria, nivel_seguridad, descripcion, unidad, valor_minimo, valor_maximo) VALUES
-- Tasas de interés
('TASA_INTERES_NORMAL', '1.5', 'DECIMAL', 'TASAS', 2, 'Tasa de interés mensual normal para créditos', '%', 0.5, 5.0),
('TASA_INTERES_CASTIGO', '3.0', 'DECIMAL', 'TASAS', 2, 'Tasa de interés mensual para créditos castigados (RN-CRE-007)', '%', 1.0, 10.0),
('TASA_INTERES_MORA_DIARIO', '1.0', 'DECIMAL', 'MOROSIDAD', 2, 'Interés de mora diario sobre cuota vencida (RN-MOR-002)', '%', 0.1, 5.0),

-- Etapas y límites
('ETAPA1_LIMITE_PRIMER_CREDITO', '1.25', 'DECIMAL', 'ETAPAS', 2, 'Multiplicador para primer crédito en Etapa 1 (RN-ETA-004)', 'multiplicador', 1.0, 2.0),
('ETAPA1_LIMITE_SEGUNDO_CREDITO', '1.50', 'DECIMAL', 'ETAPAS', 2, 'Multiplicador para segundo crédito en Etapa 1', 'multiplicador', 1.0, 2.0),
('ETAPA1_LIMITE_TERCER_CREDITO', '1.75', 'DECIMAL', 'ETAPAS', 2, 'Multiplicador para tercer crédito en Etapa 1', 'multiplicador', 1.0, 2.0),
('ETAPA1_LIMITE_MAXIMO', '2.00', 'DECIMAL', 'ETAPAS', 2, 'Multiplicador máximo para Etapa 1', 'multiplicador', 1.0, 3.0),
('ETAPA2_LIMITE', '2.00', 'DECIMAL', 'ETAPAS', 2, 'Multiplicador fijo para Etapa 2 (RN-ETA-004)', 'multiplicador', 1.5, 3.0),
('ETAPA3_LIMITE', '3.00', 'DECIMAL', 'ETAPAS', 2, 'Multiplicador fijo para Etapa 3 (RN-ETA-004)', 'multiplicador', 2.0, 5.0),
('ETAPA1_CREDITOS_PROGRESION', '3', 'INTEGER', 'ETAPAS', 2, 'Créditos consecutivos sin mora para pasar a Etapa 2 (RN-ETA-002)', 'créditos', 1, 10),
('ETAPA2_CREDITOS_PROGRESION', '5', 'INTEGER', 'ETAPAS', 2, 'Créditos consecutivos sin mora para pasar a Etapa 3 (RN-ETA-003)', 'créditos', 1, 10),

-- Créditos
('CREDITO_PLAZO_MINIMO', '6', 'INTEGER', 'CREDITOS', 2, 'Plazo mínimo de crédito en meses (RN-CRE-008)', 'meses', 3, 12),
('CREDITO_PLAZO_MAXIMO', '60', 'INTEGER', 'CREDITOS', 2, 'Plazo máximo de crédito en meses (RN-CRE-008)', 'meses', 12, 120),
('CREDITO_PRIMA_SEGURO', '1.0', 'DECIMAL', 'CREDITOS', 3, 'Prima de seguro de desgravamen obligatoria (RN-CRE-005, RN-SEG-001)', '%', 0.5, 2.0),

-- Garantías
('GARANTIA_PORCENTAJE_CONGELADO', '10.0', 'DECIMAL', 'GARANTIAS', 3, 'Porcentaje del crédito a congelar de garante (RN-GAR-004)', '%', 5.0, 20.0),
('GARANTIA_MAXIMO_GARANTIZADOS', '3', 'INTEGER', 'GARANTIAS', 2, 'Máximo de garantizados por garante (RN-GAR-005)', 'socios', 1, 10),
('GARANTIA_LIBERACION_MINIMO_COMPLETADO', '50', 'INTEGER', 'GARANTIAS', 2, 'Porcentaje mínimo del crédito completado para solicitar liberación (RN-GAR-006)', '%', 30, 100),
('GARANTIA_MORAS_MAXIMO_EXCELENTE', '0', 'INTEGER', 'GARANTIAS', 2, 'Moras máximas en 6 meses para comportamiento EXCELENTE', 'moras', 0, 3),

-- Morosidad
('MORA_LEVE_DIAS', '15', 'INTEGER', 'MOROSIDAD', 2, 'Días máximos para mora leve (RN-MOR-001)', 'días', 1, 30),
('MORA_MODERADA_DIAS', '30', 'INTEGER', 'MOROSIDAD', 2, 'Días máximos para mora moderada (RN-MOR-001)', 'días', 16, 45),
('MORA_GRAVE_DIAS', '60', 'INTEGER', 'MOROSIDAD', 2, 'Días máximos para mora grave (RN-MOR-001)', 'días', 31, 90),
('MORA_PERSISTENTE_DIAS', '89', 'INTEGER', 'MOROSIDAD', 2, 'Días máximos para mora persistente (RN-MOR-001)', 'días', 61, 120),
('MORA_CASTIGO_DIAS', '90', 'INTEGER', 'MOROSIDAD', 3, 'Días para castigo automático del crédito (RN-MOR-003)', 'días', 60, 180),

-- Ahorros
('AHORRO_MINIMO_ACTIVO', '10.0', 'DECIMAL', 'SISTEMA', 2, 'Ahorro mínimo para permanecer ACTIVO (RN-AHO-003)', 'USD', 5.0, 50.0),
('AHORRO_DEPOSITO_INICIAL_MINIMO', '50.0', 'DECIMAL', 'SISTEMA', 2, 'Depósito inicial mínimo para nuevo socio (RN-SOC-005)', 'USD', 20.0, 100.0),

-- Utilidades
('UTILIDADES_PORCENTAJE', '1.0', 'DECIMAL', 'UTILIDADES', 3, 'Porcentaje de utilidades sobre ahorro promedio semestral (RN-UTI-002)', '%', 0.5, 3.0),

-- Recomendadores
('RECOMENDADORES_REQUERIDOS', '2', 'INTEGER', 'SISTEMA', 3, 'Número de recomendadores obligatorios (RN-SOC-007)', 'socios', 1, 5),

-- Sistema
('SISTEMA_NOMBRE', 'My Libertad Financiera', 'STRING', 'SISTEMA', 1, 'Nombre del sistema', NULL, NULL, NULL),
('SISTEMA_SIGLAS', 'MLF', 'STRING', 'SISTEMA', 1, 'Siglas del sistema', NULL, NULL, NULL),
('SISTEMA_VERSION', '1.0', 'STRING', 'SISTEMA', 1, 'Versión del sistema', NULL, NULL, NULL),
('SISTEMA_FECHA_INICIO', '2025-01-01', 'STRING', 'SISTEMA', 3, 'Fecha de inicio de operaciones', NULL, NULL, NULL),

-- Notificaciones
('NOTIFICACIONES_EMAIL_ACTIVO', 'true', 'BOOLEAN', 'NOTIFICACIONES', 1, 'Habilitar notificaciones por email', NULL, NULL, NULL),
('NOTIFICACIONES_SMS_ACTIVO', 'false', 'BOOLEAN', 'NOTIFICACIONES', 1, 'Habilitar notificaciones por SMS', NULL, NULL, NULL),
('NOTIFICACIONES_WHATSAPP_ACTIVO', 'true', 'BOOLEAN', 'NOTIFICACIONES', 1, 'Habilitar notificaciones por WhatsApp', NULL, NULL, NULL);


-- ============================================================================
-- DATOS DE PRUEBA: Usuarios Administradores Iniciales
-- IMPORTANTE: Cambiar contraseñas en producción
-- ============================================================================

-- Usuario Administrador principal
-- Contraseña: Admin123! (debe ser hasheada con bcrypt en implementación real)
INSERT INTO socios (
    codigo, nombre_completo, documento_identidad, fecha_nacimiento,
    direccion, ciudad, telefono, email,
    ahorro_actual, ahorro_congelado,
    etapa_actual, creditos_etapa_actual,
    estado, usuario, password_hash, rol, fecha_registro
) VALUES (
    'SOC-2025-0001',
    'Administrador Sistema',
    '1234567890',
    '1990-01-01',
    'Oficina Central',
    'Ciudad Principal',
    '+593999999999',
    'admin@mylf.com',
    0,  -- Sin ahorros (es administrador del sistema)
    0,
    3,  -- Etapa Especial (para no tener restricciones)
    0,
    'ACTIVO',
    'admin',
    '$2b$10$abcdefghijklmnopqrstuvwxyz123456',  -- Hash de ejemplo - CAMBIAR EN PRODUCCIÓN
    'ADMIN',
    NOW()
);

-- Usuario Operador de prueba
-- Contraseña: Operador123!
INSERT INTO socios (
    codigo, nombre_completo, documento_identidad, fecha_nacimiento,
    direccion, ciudad, telefono, email,
    ahorro_actual, ahorro_congelado,
    etapa_actual, creditos_etapa_actual,
    estado, usuario, password_hash, rol, fecha_registro
) VALUES (
    'SOC-2025-0002',
    'Operador Sistema',
    '0987654321',
    '1992-05-15',
    'Oficina Secundaria',
    'Ciudad Secundaria',
    '+593988888888',
    'operador@mylf.com',
    0,
    0,
    3,
    0,
    'ACTIVO',
    'operador',
    '$2b$10$zyxwvutsrqponmlkjihgfedcba654321',  -- Hash de ejemplo - CAMBIAR EN PRODUCCIÓN
    'OPERADOR',
    NOW()
);


-- ============================================================================
-- DATOS DE PRUEBA: Socios Especiales (para que puedan recomendar)
-- ============================================================================

-- Socio Especial 1 (Puede ser recomendador)
INSERT INTO socios (
    codigo, nombre_completo, documento_identidad, fecha_nacimiento,
    direccion, ciudad, telefono, email,
    ahorro_actual, ahorro_congelado,
    etapa_actual, creditos_etapa_actual,
    estado, usuario, password_hash, rol, fecha_registro
) VALUES (
    'SOC-2025-0003',
    'Carlos Pérez García',
    '1700000001',
    '1985-03-20',
    'Av. Principal 123',
    'Quito',
    '+593987654321',
    'carlos.perez@email.com',
    5000.00,  -- $5,000 en ahorros
    0,
    3,  -- Etapa Especial
    5,  -- 5 créditos completados
    'ACTIVO',
    'carlos.perez',
    '$2b$10$ejemplo1hash',
    'SOCIO',
    NOW()
);

-- Socio Especial 2 (Puede ser recomendador)
INSERT INTO socios (
    codigo, nombre_completo, documento_identidad, fecha_nacimiento,
    direccion, ciudad, telefono, email,
    ahorro_actual, ahorro_congelado,
    etapa_actual, creditos_etapa_actual,
    estado, usuario, password_hash, rol, fecha_registro
) VALUES (
    'SOC-2025-0004',
    'María González López',
    '1700000002',
    '1988-07-15',
    'Calle Secundaria 456',
    'Guayaquil',
    '+593976543210',
    'maria.gonzalez@email.com',
    8000.00,  -- $8,000 en ahorros
    0,
    3,  -- Etapa Especial
    8,  -- 8 créditos completados
    'ACTIVO',
    'maria.gonzalez',
    '$2b$10$ejemplo2hash',
    'SOCIO',
    NOW()
);

-- Socio Especial 3 (Puede ser recomendador)
INSERT INTO socios (
    codigo, nombre_completo, documento_identidad, fecha_nacimiento,
    direccion, ciudad, telefono, email,
    ahorro_actual, ahorro_congelado,
    etapa_actual, creditos_etapa_actual,
    estado, usuario, password_hash, rol, fecha_registro
) VALUES (
    'SOC-2025-0005',
    'Juan Rodríguez Martínez',
    '1700000003',
    '1982-11-30',
    'Urbanización Norte 789',
    'Cuenca',
    '+593965432109',
    'juan.rodriguez@email.com',
    12000.00,  -- $12,000 en ahorros
    0,
    3,  -- Etapa Especial
    10,  -- 10 créditos completados
    'ACTIVO',
    'juan.rodriguez',
    '$2b$10$ejemplo3hash',
    'SOCIO',
    NOW()
);


-- ============================================================================
-- DATOS DE PRUEBA: Socio Nuevo (Etapa 1) con sus recomendadores
-- ============================================================================

-- Socio nuevo en Etapa 1
INSERT INTO socios (
    codigo, nombre_completo, documento_identidad, fecha_nacimiento,
    direccion, ciudad, telefono, email,
    ahorro_actual, ahorro_congelado,
    etapa_actual, creditos_etapa_actual,
    estado, usuario, password_hash, rol, fecha_registro
) VALUES (
    'SOC-2025-0006',
    'Ana Martínez Silva',
    '1700000004',
    '1995-04-10',
    'Barrio Sur 321',
    'Quito',
    '+593954321098',
    'ana.martinez@email.com',
    500.00,  -- Depósito inicial de $500
    0,
    1,  -- Etapa Iniciante
    0,  -- Sin créditos completados
    'ACTIVO',
    'ana.martinez',
    '$2b$10$ejemplo4hash',
    'SOCIO',
    NOW()
);

-- Recomendaciones del socio nuevo
INSERT INTO recomendaciones (socio_recomendado_id, socio_recomendador_id) VALUES
(6, 3),  -- Carlos Pérez recomienda a Ana
(6, 4);  -- María González recomienda a Ana


-- ============================================================================
-- DATOS DE PRUEBA: Transacción de depósito inicial
-- ============================================================================

INSERT INTO transacciones (
    codigo, socio_id, tipo, monto,
    saldo_anterior, saldo_nuevo, metodo, concepto, fecha_transaccion
) VALUES
('DEP-SOC0006-001', 6, 'DEPOSITO', 500.00, 0, 500.00, 'TRANSFERENCIA', 'Depósito inicial de nuevo socio', NOW());


-- ============================================================================
-- DATOS DE PRUEBA: Fondo de Seguro (comienza en $0)
-- ============================================================================

INSERT INTO fondo_seguro (
    tipo, monto, saldo_anterior, saldo_nuevo,
    concepto, fecha_movimiento
) VALUES (
    'INGRESO_PRIMA',
    0,
    0,
    0,
    'Inicialización del fondo de seguro de desgravamen (RN-SEG-002: Inicia en $0)',
    NOW()
);


-- ============================================================================
-- COMENTARIOS Y NOTAS IMPORTANTES
-- ============================================================================

COMMENT ON TABLE configuraciones IS 'IMPORTANTE: Valores de nivel_seguridad 2 y 3 requieren aprobación antes de modificar';
COMMENT ON TABLE socios IS 'IMPORTANTE: Los primeros 5 socios (0001-0005) son usuarios del sistema y socios especiales de prueba';

-- ============================================================================
-- FIN DE ARCHIVO: 05_seed_data.sql
-- ============================================================================

-- NOTA: Este archivo debe ejecutarse DESPUÉS de los schemas y triggers
-- NOTA: En producción, cambiar todas las contraseñas por hashes bcrypt reales
-- NOTA: Los datos de prueba deben ser removidos o reemplazados en producción
