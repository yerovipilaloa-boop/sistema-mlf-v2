/**
 * ============================================================================
 * SCRIPT DE DATOS DE PRUEBA (SEED DATA)
 * ============================================================================
 *
 * PROPÓSITO: Crear datos de prueba realistas para testing manual
 *
 * IMPORTANTE:
 * - ⚠️ SOLO EJECUTAR EN ENTORNO DE DESARROLLO/TESTING
 * - ⚠️ NUNCA EJECUTAR EN PRODUCCIÓN
 * - Este script crea socios, créditos y transacciones de ejemplo
 *
 * USO:
 * psql -U postgres -d mlf_system -f 99_SEED_DATA.sql
 *
 * Para limpiar todos los datos y volver a estado inicial:
 * psql -U postgres -d mlf_system -f 98_RESET_DATABASE.sql
 *
 * @author Sistema MLF
 * @version 1.0.0
 * @date 2025-01-20
 */

-- Verificar que no estamos en producción
DO $$
BEGIN
    IF current_database() = 'mlf_production' THEN
        RAISE EXCEPTION '🚨 PELIGRO: No se puede ejecutar SEED en base de producción!';
    END IF;
    RAISE NOTICE '✅ Iniciando carga de datos de prueba...';
END $$;

-- ============================================================================
-- 1. CREAR USUARIOS DE PRUEBA
-- ============================================================================

RAISE NOTICE '📝 Creando usuarios de prueba...';

-- Admin principal
INSERT INTO usuarios (email, password, nombre_completo, rol, activo, created_at)
VALUES
    ('admin@mlf.com', '$2a$10$rKj8VqZNQQYX5oZ8pKvZ0OKvZ0OKvZ0OKvZ0OKvZ0OKvZ0OKvZ0O', 'Administrador Principal', 'ADMIN', true, NOW()),
    ('operador@mlf.com', '$2a$10$rKj8VqZNQQYX5oZ8pKvZ0OKvZ0OKvZ0OKvZ0OKvZ0OKvZ0OKvZ0O', 'Operador Sistema', 'OPERADOR', true, NOW())
ON CONFLICT (email) DO NOTHING;

RAISE NOTICE '✅ Usuarios creados (password: password123)';

-- ============================================================================
-- 2. CREAR SOCIOS DE ETAPA 3 (RECOMENDADORES Y GARANTES)
-- ============================================================================

RAISE NOTICE '📝 Creando socios Etapa 3 (recomendadores/garantes)...';

INSERT INTO socios (
    codigo,
    documento_identidad,
    nombre_completo,
    fecha_nacimiento,
    email,
    telefono,
    direccion,
    etapa_actual,
    estado,
    ahorro_actual,
    ahorro_congelado,
    fecha_ingreso,
    recomendadores,
    contador_creditos
) VALUES
    -- Recomendadores (Etapa 3 ACTIVOS con buen historial)
    ('SOC-2024-0001', '1712345678', 'María Elena García López', '1980-03-15', 'maria.garcia@email.com', '0998765432', 'Av. Principal 123', 3, 'ACTIVO', 25000.00, 0, '2020-01-15', ARRAY[]::integer[], 5),
    ('SOC-2024-0002', '1723456789', 'Juan Carlos Pérez Mendoza', '1975-07-22', 'juan.perez@email.com', '0987654321', 'Calle Secundaria 456', 3, 'ACTIVO', 30000.00, 0, '2020-02-10', ARRAY[]::integer[], 6),
    ('SOC-2024-0003', '1734567890', 'Ana Lucía Rodríguez Flores', '1982-11-30', 'ana.rodriguez@email.com', '0976543210', 'Barrio El Progreso 789', 3, 'ACTIVO', 22000.00, 0, '2020-03-20', ARRAY[]::integer[], 4),
    ('SOC-2024-0004', '1745678901', 'Carlos Alberto Sánchez Cruz', '1978-05-18', 'carlos.sanchez@email.com', '0965432109', 'Urbanización Los Pinos 321', 3, 'ACTIVO', 28000.00, 0, '2020-04-05', ARRAY[]::integer[], 5),

    -- Garantes (Etapa 3 ACTIVOS)
    ('SOC-2024-0005', '1756789012', 'Patricia Isabel Morales Vega', '1985-09-25', 'patricia.morales@email.com', '0954321098', 'Conjunto La Pradera 654', 3, 'ACTIVO', 20000.00, 0, '2021-01-10', ARRAY[1, 2]::integer[], 3),
    ('SOC-2024-0006', '1767890123', 'Roberto Fernando Castro Díaz', '1979-12-08', 'roberto.castro@email.com', '0943210987', 'Ciudadela El Bosque 987', 3, 'ACTIVO', 24000.00, 0, '2021-02-15', ARRAY[1, 3]::integer[], 4),
    ('SOC-2024-0007', '1778901234', 'Sofía Gabriela Torres Ramírez', '1983-06-14', 'sofia.torres@email.com', '0932109876', 'Sector Norte 147', 3, 'ACTIVO', 21000.00, 0, '2021-03-20', ARRAY[2, 3]::integer[], 3),
    ('SOC-2024-0008', '1789012345', 'Diego Alejandro Herrera Luna', '1981-04-03', 'diego.herrera@email.com', '0921098765', 'Barrio Central 258', 3, 'ACTIVO', 26000.00, 0, '2021-04-25', ARRAY[3, 4]::integer[], 4);

RAISE NOTICE '✅ 8 socios Etapa 3 creados';

-- ============================================================================
-- 3. CREAR SOCIOS ETAPA 2
-- ============================================================================

RAISE NOTICE '📝 Creando socios Etapa 2...';

INSERT INTO socios (
    codigo,
    documento_identidad,
    nombre_completo,
    fecha_nacimiento,
    email,
    telefono,
    direccion,
    etapa_actual,
    estado,
    ahorro_actual,
    ahorro_congelado,
    fecha_ingreso,
    recomendadores,
    contador_creditos
) VALUES
    ('SOC-2024-0009', '1790123456', 'Luis Fernando Ortiz Silva', '1986-08-20', 'luis.ortiz@email.com', '0910987654', 'Av. Los Andes 369', 2, 'ACTIVO', 8000.00, 0, '2023-01-15', ARRAY[1, 2]::integer[], 2),
    ('SOC-2024-0010', '1701234567', 'Carmen Rosa Gutiérrez Paredes', '1984-02-11', 'carmen.gutierrez@email.com', '0909876543', 'Calle Las Flores 741', 2, 'ACTIVO', 9500.00, 0, '2023-02-20', ARRAY[1, 3]::integer[], 2),
    ('SOC-2024-0011', '1712345679', 'Miguel Ángel Vargas Campos', '1987-10-05', 'miguel.vargas@email.com', '0908765432', 'Barrio San José 852', 2, 'ACTIVO', 7500.00, 0, '2023-03-10', ARRAY[2, 3]::integer[], 1),
    ('SOC-2024-0012', '1723456780', 'Diana Paola Jiménez Reyes', '1989-07-28', 'diana.jimenez@email.com', '0907654321', 'Urbanización Vista Hermosa 963', 2, 'ACTIVO', 10000.00, 0, '2023-04-15', ARRAY[3, 4]::integer[], 2);

RAISE NOTICE '✅ 4 socios Etapa 2 creados';

-- ============================================================================
-- 4. CREAR SOCIOS ETAPA 1 (NUEVOS)
-- ============================================================================

RAISE NOTICE '📝 Creando socios Etapa 1 (nuevos)...';

INSERT INTO socios (
    codigo,
    documento_identidad,
    nombre_completo,
    fecha_nacimiento,
    email,
    telefono,
    direccion,
    etapa_actual,
    estado,
    ahorro_actual,
    ahorro_congelado,
    fecha_ingreso,
    recomendadores,
    contador_creditos
) VALUES
    ('SOC-2025-0001', '1734567891', 'Andrea Melissa Rojas González', '1992-05-12', 'andrea.rojas@email.com', '0996543210', 'Barrio Nuevo 159', 1, 'ACTIVO', 2500.00, 0, '2025-01-05', ARRAY[1, 2]::integer[], 0),
    ('SOC-2025-0002', '1745678902', 'Fernando José Castillo Mendoza', '1990-11-23', 'fernando.castillo@email.com', '0995432109', 'Calle Esperanza 267', 1, 'ACTIVO', 3000.00, 0, '2025-01-10', ARRAY[2, 3]::integer[], 0),
    ('SOC-2025-0003', '1756789013', 'Gabriela Victoria Ramos Vera', '1993-03-08', 'gabriela.ramos@email.com', '0994321098', 'Sector Sur 378', 1, 'ACTIVO', 2000.00, 0, '2025-01-15', ARRAY[3, 4]::integer[], 0),
    ('SOC-2025-0004', '1767890124', 'Ricardo Andrés Salazar Fuentes', '1991-09-17', 'ricardo.salazar@email.com', '0993210987', 'Av. Libertad 489', 1, 'ACTIVO', 2800.00, 0, '2025-01-18', ARRAY[1, 4]::integer[], 0);

RAISE NOTICE '✅ 4 socios Etapa 1 creados';

-- ============================================================================
-- 5. CREAR TRANSACCIONES DE AHORRO
-- ============================================================================

RAISE NOTICE '📝 Creando transacciones de ahorro...';

-- Depósitos iniciales
INSERT INTO transacciones_ahorro (socio_id, tipo, monto, saldo_anterior, saldo_nuevo, metodo_pago, fecha, descripcion)
SELECT
    id,
    'DEPOSITO',
    ahorro_actual,
    0,
    ahorro_actual,
    'EFECTIVO',
    fecha_ingreso,
    'Depósito inicial'
FROM socios
WHERE id <= 16;

-- Depósitos adicionales para socios antiguos
INSERT INTO transacciones_ahorro (socio_id, tipo, monto, saldo_anterior, saldo_nuevo, metodo_pago, fecha, descripcion)
VALUES
    (1, 'DEPOSITO', 5000.00, 20000.00, 25000.00, 'TRANSFERENCIA', '2024-06-15', 'Depósito mensual'),
    (2, 'DEPOSITO', 5000.00, 25000.00, 30000.00, 'TRANSFERENCIA', '2024-07-10', 'Depósito mensual'),
    (3, 'DEPOSITO', 4000.00, 18000.00, 22000.00, 'EFECTIVO', '2024-08-20', 'Depósito ahorro'),
    (4, 'DEPOSITO', 3000.00, 25000.00, 28000.00, 'TRANSFERENCIA', '2024-09-05', 'Depósito mensual');

RAISE NOTICE '✅ Transacciones de ahorro creadas';

-- ============================================================================
-- 6. CREAR CRÉDITOS DE EJEMPLO
-- ============================================================================

RAISE NOTICE '📝 Creando créditos de ejemplo...';

-- Crédito 1: Socio Etapa 2 - Completado
INSERT INTO creditos (
    codigo, socio_id, monto_solicitado, prima_seguro, monto_total,
    plazo_meses, tasa_interes_anual, metodo_amortizacion,
    estado, proposito,
    fecha_solicitud, fecha_aprobacion, fecha_desembolso, fecha_completado,
    saldo_capital
) VALUES (
    'CRE-2023-0001', 9, 5000.00, 50.00, 5050.00,
    12, 18.0, 'FRANCES',
    'COMPLETADO', 'Capital de trabajo para negocio familiar',
    '2023-06-01', '2023-06-05', '2023-06-10', '2024-06-10',
    0
);

-- Crédito 2: Socio Etapa 2 - Activo al día
INSERT INTO creditos (
    codigo, socio_id, monto_solicitado, prima_seguro, monto_total,
    plazo_meses, tasa_interes_anual, metodo_amortizacion,
    estado, proposito,
    fecha_solicitud, fecha_aprobacion, fecha_desembolso,
    saldo_capital
) VALUES (
    'CRE-2024-0001', 10, 8000.00, 80.00, 8080.00,
    24, 18.0, 'FRANCES',
    'DESEMBOLSADO', 'Expansión de local comercial',
    '2024-01-15', '2024-01-20', '2024-01-25',
    6500.00
);

-- Crédito 3: Socio Etapa 2 - Activo con mora leve
INSERT INTO creditos (
    codigo, socio_id, monto_solicitado, prima_seguro, monto_total,
    plazo_meses, tasa_interes_anual, metodo_amortizacion,
    estado, proposito,
    fecha_solicitud, fecha_aprobacion, fecha_desembolso,
    saldo_capital
) VALUES (
    'CRE-2024-0002', 11, 6000.00, 60.00, 6060.00,
    18, 18.0, 'ALEMAN',
    'DESEMBOLSADO', 'Compra de inventario',
    '2024-06-01', '2024-06-05', '2024-06-10',
    4500.00
);

-- Crédito 4: Socio Etapa 1 - Solicitado (pendiente aprobación)
INSERT INTO creditos (
    codigo, socio_id, monto_solicitado, prima_seguro, monto_total,
    plazo_meses, tasa_interes_anual, metodo_amortizacion,
    estado, proposito,
    fecha_solicitud,
    saldo_capital
) VALUES (
    'CRE-2025-0001', 13, 3000.00, 30.00, 3030.00,
    12, 18.0, 'FRANCES',
    'SOLICITADO', 'Mejoras en el hogar',
    '2025-01-20',
    3030.00
);

RAISE NOTICE '✅ 4 créditos de ejemplo creados';

-- ============================================================================
-- 7. CREAR GARANTÍAS
-- ============================================================================

RAISE NOTICE '📝 Creando garantías...';

-- Garantías para Crédito 2 (activo)
INSERT INTO garantias (credito_id, garante_id, monto_congelado, estado, fecha_creacion)
VALUES
    (2, 5, 404.00, 'ACTIVA', '2024-01-22'),  -- 10% / 2 del monto total
    (2, 6, 404.00, 'ACTIVA', '2024-01-22');

-- Garantías para Crédito 3 (activo con mora)
INSERT INTO garantias (credito_id, garante_id, monto_congelado, estado, fecha_creacion)
VALUES
    (3, 7, 303.00, 'ACTIVA', '2024-06-08'),
    (3, 8, 303.00, 'ACTIVA', '2024-06-08');

-- Actualizar ahorro congelado de garantes
UPDATE socios SET ahorro_congelado = 404.00 WHERE id IN (5, 6);
UPDATE socios SET ahorro_congelado = 303.00 WHERE id IN (7, 8);

RAISE NOTICE '✅ Garantías creadas y ahorros congelados';

-- ============================================================================
-- 8. CREAR CUOTAS Y PAGOS
-- ============================================================================

RAISE NOTICE '📝 Creando cuotas y pagos...';

-- Cuotas para Crédito 2 (8 pagadas, 16 pendientes)
DO $$
DECLARE
    v_credito_id INTEGER := 2;
    v_fecha_base DATE := '2024-02-25';
    v_cuota NUMERIC := 433.00; -- Aproximado para método francés
    v_i INTEGER;
BEGIN
    FOR v_i IN 1..24 LOOP
        INSERT INTO cuotas (
            credito_id, numero_cuota, fecha_vencimiento,
            capital, interes, monto_cuota,
            capital_pagado, interes_pagado, monto_mora,
            estado
        ) VALUES (
            v_credito_id, v_i, v_fecha_base + (v_i - 1) * INTERVAL '1 month',
            300.00, 133.00, v_cuota,
            CASE WHEN v_i <= 8 THEN 300.00 ELSE 0 END,
            CASE WHEN v_i <= 8 THEN 133.00 ELSE 0 END,
            0,
            CASE WHEN v_i <= 8 THEN 'PAGADA' ELSE 'PENDIENTE' END
        );
    END LOOP;
END $$;

-- Cuotas para Crédito 3 (5 pagadas, 13 pendientes, 1 vencida con mora)
DO $$
DECLARE
    v_credito_id INTEGER := 3;
    v_fecha_base DATE := '2024-07-10';
    v_i INTEGER;
BEGIN
    FOR v_i IN 1..18 LOOP
        INSERT INTO cuotas (
            credito_id, numero_cuota, fecha_vencimiento,
            capital, interes, monto_cuota,
            capital_pagado, interes_pagado, monto_mora,
            estado, dias_mora, clasificacion_mora
        ) VALUES (
            v_credito_id, v_i, v_fecha_base + (v_i - 1) * INTERVAL '1 month',
            336.00, 91.00, 427.00,
            CASE WHEN v_i <= 5 THEN 336.00 ELSE 0 END,
            CASE WHEN v_i <= 5 THEN 91.00 ELSE 0 END,
            CASE WHEN v_i = 6 THEN 42.70 ELSE 0 END, -- 10 días mora * 1%
            CASE WHEN v_i <= 5 THEN 'PAGADA'
                 WHEN v_i = 6 THEN 'PENDIENTE'
                 ELSE 'PENDIENTE' END,
            CASE WHEN v_i = 6 THEN 10 ELSE 0 END,
            CASE WHEN v_i = 6 THEN 'MORA_LEVE' ELSE 'AL_DIA' END
        );
    END LOOP;
END $$;

-- Registrar pagos realizados
INSERT INTO pagos (credito_id, monto, fecha, metodo_pago, referencia)
SELECT
    credito_id,
    monto_cuota,
    fecha_vencimiento,
    'TRANSFERENCIA',
    'PAG-' || LPAD(numero_cuota::text, 3, '0')
FROM cuotas
WHERE estado = 'PAGADA';

RAISE NOTICE '✅ Cuotas y pagos creados';

-- ============================================================================
-- 9. CREAR REGISTRO EN FONDO DE SEGURO
-- ============================================================================

RAISE NOTICE '📝 Registrando primas en fondo de seguro...';

INSERT INTO fondo_seguro (tipo, monto, credito_id, descripcion, fecha)
SELECT
    'INGRESO_PRIMA',
    prima_seguro,
    id,
    'Prima de seguro 1% - ' || codigo,
    fecha_desembolso
FROM creditos
WHERE estado IN ('DESEMBOLSADO', 'COMPLETADO');

RAISE NOTICE '✅ Fondo de seguro actualizado';

-- ============================================================================
-- 10. CREAR AUDITORÍAS DE EJEMPLO
-- ============================================================================

RAISE NOTICE '📝 Creando registros de auditoría...';

INSERT INTO auditorias (tabla, registro_id, accion, usuario_id, datos_anteriores, datos_nuevos, descripcion)
VALUES
    ('socios', 1, 'CREATE', 1, NULL, '{"estado": "ACTIVO"}', 'Socio creado'),
    ('creditos', 1, 'UPDATE', 1, '{"estado": "SOLICITADO"}', '{"estado": "APROBADO"}', 'Crédito aprobado'),
    ('creditos', 1, 'UPDATE', 1, '{"estado": "APROBADO"}', '{"estado": "DESEMBOLSADO"}', 'Crédito desembolsado'),
    ('creditos', 1, 'UPDATE', 1, '{"estado": "DESEMBOLSADO"}', '{"estado": "COMPLETADO"}', 'Crédito completado');

RAISE NOTICE '✅ Auditorías creadas';

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

DO $$
DECLARE
    v_total_socios INTEGER;
    v_total_creditos INTEGER;
    v_total_transacciones INTEGER;
    v_total_garantias INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_socios FROM socios;
    SELECT COUNT(*) INTO v_total_creditos FROM creditos;
    SELECT COUNT(*) INTO v_total_transacciones FROM transacciones_ahorro;
    SELECT COUNT(*) INTO v_total_garantias FROM garantias;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DATOS DE PRUEBA CARGADOS EXITOSAMENTE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMEN:';
    RAISE NOTICE '  • Socios creados: %', v_total_socios;
    RAISE NOTICE '  • Créditos creados: %', v_total_creditos;
    RAISE NOTICE '  • Transacciones: %', v_total_transacciones;
    RAISE NOTICE '  • Garantías: %', v_total_garantias;
    RAISE NOTICE '';
    RAISE NOTICE '👤 USUARIOS DE PRUEBA:';
    RAISE NOTICE '  • admin@mlf.com / password123 (ADMIN)';
    RAISE NOTICE '  • operador@mlf.com / password123 (OPERADOR)';
    RAISE NOTICE '';
    RAISE NOTICE '📋 SOCIOS POR ETAPA:';
    RAISE NOTICE '  • Etapa 3: 8 socios (recomendadores/garantes)';
    RAISE NOTICE '  • Etapa 2: 4 socios';
    RAISE NOTICE '  • Etapa 1: 4 socios (nuevos)';
    RAISE NOTICE '';
    RAISE NOTICE '💳 CRÉDITOS:';
    RAISE NOTICE '  • 1 completado';
    RAISE NOTICE '  • 2 activos (1 al día, 1 con mora leve)';
    RAISE NOTICE '  • 1 solicitado (pendiente aprobación)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE:';
    RAISE NOTICE '  Para limpiar estos datos y empezar con producción:';
    RAISE NOTICE '  psql -U postgres -d mlf_system -f 98_RESET_DATABASE.sql';
    RAISE NOTICE '';
END $$;
