-- ============================================================================
-- Sistema MLF - Base de Datos PostgreSQL
-- Archivo: 04_triggers_validaciones.sql
-- Descripción: Triggers y funciones para validar reglas de negocio automáticamente
-- Versión: 1.0
-- Fecha: Noviembre 2025
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: Generar código autoincremental por año
-- Uso: Para socios, créditos, garantías, etc.
-- ============================================================================

CREATE OR REPLACE FUNCTION generar_codigo(
    prefijo VARCHAR,
    tabla_nombre VARCHAR,
    columna_codigo VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    año_actual INT;
    secuencial INT;
    nuevo_codigo VARCHAR;
BEGIN
    año_actual := EXTRACT(YEAR FROM CURRENT_DATE);

    -- Obtener el siguiente secuencial del año
    EXECUTE format(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM 10) AS INT)), 0) + 1
         FROM %I
         WHERE SUBSTRING(%I FROM 5 FOR 4) = %L',
        columna_codigo, tabla_nombre, columna_codigo, año_actual::TEXT
    ) INTO secuencial;

    -- Formato: PREFIJO-YYYY-NNNN
    nuevo_codigo := prefijo || '-' || año_actual::TEXT || '-' || LPAD(secuencial::TEXT, 4, '0');

    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_codigo IS 'Genera códigos únicos autoincrementales por año (ej: SOC-2025-0001)';


-- ============================================================================
-- TRIGGER: Auto-generar código de socio
-- Regla: RN-SOC-008
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_generar_codigo_socio()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := generar_codigo('SOC', 'socios', 'codigo');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_socio_codigo
    BEFORE INSERT ON socios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_codigo_socio();

COMMENT ON FUNCTION trigger_generar_codigo_socio IS 'Auto-genera código SOC-YYYY-NNNN al crear socio (RN-SOC-008)';


-- ============================================================================
-- TRIGGER: Validar recomendadores al crear socio
-- Regla: RN-SOC-007 (2 recomendadores obligatorios, deben ser Etapa 3 ACTIVOS)
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_validar_recomendadores()
RETURNS TRIGGER AS $$
DECLARE
    cuenta_recomendaciones INT;
    recomendador_invalido INT;
BEGIN
    -- Esperar 1 segundo para que se inserten las recomendaciones
    PERFORM pg_sleep(1);

    -- Contar recomendaciones del nuevo socio
    SELECT COUNT(*) INTO cuenta_recomendaciones
    FROM recomendaciones
    WHERE socio_recomendado_id = NEW.id;

    IF cuenta_recomendaciones < 2 THEN
        RAISE EXCEPTION 'El socio debe tener exactamente 2 recomendadores (RN-SOC-007). Tiene: %', cuenta_recomendaciones;
    END IF;

    -- Validar que recomendadores sean Etapa 3 y ACTIVOS
    SELECT r.socio_recomendador_id INTO recomendador_invalido
    FROM recomendaciones r
    JOIN socios s ON r.socio_recomendador_id = s.id
    WHERE r.socio_recomendado_id = NEW.id
      AND (s.etapa_actual != 3 OR s.estado != 'ACTIVO')
    LIMIT 1;

    IF recomendador_invalido IS NOT NULL THEN
        RAISE EXCEPTION 'Todos los recomendadores deben ser Socios Especiales (Etapa 3) en estado ACTIVO (RN-SOC-007). Recomendador inválido ID: %', recomendador_invalido;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Nota: Este trigger se ejecuta DESPUÉS de insert para dar tiempo a que se creen las recomendaciones
CREATE TRIGGER after_insert_socio_validar_recomendadores
    AFTER INSERT ON socios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_recomendadores();

COMMENT ON FUNCTION trigger_validar_recomendadores IS 'Valida que nuevo socio tenga 2 recomendadores Etapa 3 ACTIVOS (RN-SOC-007)';


-- ============================================================================
-- TRIGGER: Actualizar timestamp de updated_at
-- Aplica a todas las tablas
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas principales
CREATE TRIGGER update_socios_updated_at BEFORE UPDATE ON socios
    FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_updated_at();

CREATE TRIGGER update_creditos_updated_at BEFORE UPDATE ON creditos
    FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_updated_at();

CREATE TRIGGER update_cuotas_updated_at BEFORE UPDATE ON cuotas
    FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_updated_at();

CREATE TRIGGER update_garantias_updated_at BEFORE UPDATE ON garantias
    FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_updated_at();

CREATE TRIGGER update_configuraciones_updated_at BEFORE UPDATE ON configuraciones
    FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_updated_at();

COMMENT ON FUNCTION trigger_actualizar_updated_at IS 'Actualiza automáticamente el campo updated_at al modificar registros';


-- ============================================================================
-- TRIGGER: Validar límite de crédito antes de crear
-- Regla: RN-CRE-002 (Límite basado en ahorro × multiplicador de etapa)
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_validar_limite_credito()
RETURNS TRIGGER AS $$
DECLARE
    socio_record RECORD;
    multiplicador DECIMAL(5,2);
    limite_disponible DECIMAL(12,2);
    suma_creditos_activos DECIMAL(12,2);
    creditos_completados_etapa INT;
BEGIN
    -- Obtener datos del socio
    SELECT * INTO socio_record
    FROM socios
    WHERE id = NEW.socio_id;

    -- Determinar multiplicador según etapa y créditos completados (RN-ETA-004)
    IF socio_record.etapa_actual = 1 THEN
        creditos_completados_etapa := socio_record.creditos_etapa_actual;
        IF creditos_completados_etapa = 0 THEN
            multiplicador := 1.25;  -- 125% primer crédito
        ELSIF creditos_completados_etapa = 1 THEN
            multiplicador := 1.50;  -- 150% segundo
        ELSIF creditos_completados_etapa = 2 THEN
            multiplicador := 1.75;  -- 175% tercero
        ELSE
            multiplicador := 2.00;  -- 200% máximo
        END IF;
    ELSIF socio_record.etapa_actual = 2 THEN
        multiplicador := 2.00;  -- 200% fijo
    ELSE  -- Etapa 3
        multiplicador := 3.00;  -- 300% fijo
    END IF;

    -- Calcular límite disponible
    limite_disponible := socio_record.ahorro_actual * multiplicador;

    -- Sumar créditos activos existentes (RN-CRE-003: Múltiples créditos simultáneos)
    SELECT COALESCE(SUM(saldo_capital), 0) INTO suma_creditos_activos
    FROM creditos
    WHERE socio_id = NEW.socio_id
      AND estado IN ('DESEMBOLSADO', 'APROBADO');

    -- Validar que el nuevo crédito no exceda el límite
    IF (suma_creditos_activos + NEW.monto_total) > limite_disponible THEN
        RAISE EXCEPTION 'Monto excede límite disponible. Límite: %, Créditos activos: %, Nuevo crédito: % (RN-CRE-002, RN-CRE-003)',
            limite_disponible, suma_creditos_activos, NEW.monto_total;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_credito_validar_limite
    BEFORE INSERT ON creditos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_limite_credito();

COMMENT ON FUNCTION trigger_validar_limite_credito IS 'Valida límite de crédito basado en ahorro y etapa (RN-CRE-002, RN-ETA-004)';


-- ============================================================================
-- TRIGGER: Bloquear nuevo crédito si tiene mora activa
-- Regla: RN-CRE-004
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_bloquear_credito_con_mora()
RETURNS TRIGGER AS $$
DECLARE
    tiene_mora BOOLEAN;
BEGIN
    -- Verificar si el socio tiene alguna mora activa
    SELECT EXISTS(
        SELECT 1
        FROM moras m
        JOIN creditos c ON m.credito_id = c.id
        WHERE c.socio_id = NEW.socio_id
          AND m.estado = 'ACTIVA'
    ) INTO tiene_mora;

    IF tiene_mora THEN
        RAISE EXCEPTION 'No puede solicitar crédito con mora activa. Regulariza primero (RN-CRE-004)';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_credito_bloquear_mora
    BEFORE INSERT ON creditos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_bloquear_credito_con_mora();

COMMENT ON FUNCTION trigger_bloquear_credito_con_mora IS 'Bloquea nuevos créditos si socio tiene mora activa (RN-CRE-004)';


-- ============================================================================
-- TRIGGER: Auto-generar código de crédito
-- Regla: Sistema de códigos
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_generar_codigo_credito()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := generar_codigo('CRE', 'creditos', 'codigo');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_credito_codigo
    BEFORE INSERT ON creditos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_codigo_credito();


-- ============================================================================
-- TRIGGER: Actualizar saldo de socio al depositar/retirar
-- Reglas: RN-AHO-001, RN-AHO-002, RN-AHO-003
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_actualizar_saldo_socio()
RETURNS TRIGGER AS $$
DECLARE
    socio_record RECORD;
    ahorro_disponible DECIMAL(12,2);
    ahorro_comprometido DECIMAL(12,2);
BEGIN
    -- Obtener datos del socio
    SELECT * INTO socio_record FROM socios WHERE id = NEW.socio_id;

    -- Calcular ahorro comprometido (RN-AHO-001)
    SELECT COALESCE(SUM(saldo_capital), 0) INTO ahorro_comprometido
    FROM creditos
    WHERE socio_id = NEW.socio_id AND estado = 'DESEMBOLSADO';

    -- Calcular ahorro disponible (RN-AHO-002)
    ahorro_disponible := socio_record.ahorro_actual - ahorro_comprometido - socio_record.ahorro_congelado;

    IF NEW.tipo = 'DEPOSITO' THEN
        -- Actualizar saldo
        UPDATE socios
        SET ahorro_actual = ahorro_actual + NEW.monto
        WHERE id = NEW.socio_id;

        NEW.saldo_nuevo := socio_record.ahorro_actual + NEW.monto;

    ELSIF NEW.tipo = 'RETIRO' THEN
        -- Validar que tenga suficiente ahorro disponible
        IF NEW.monto > ahorro_disponible THEN
            RAISE EXCEPTION 'Ahorro insuficiente. Disponible: %, Solicitado: % (RN-AHO-002)', ahorro_disponible, NEW.monto;
        END IF;

        -- Validar mínimo de $10 (RN-AHO-003)
        IF (socio_record.ahorro_actual - NEW.monto) < 10 THEN
            RAISE EXCEPTION 'Debe mantener mínimo $10 en ahorros para permanecer ACTIVO (RN-AHO-003)';
        END IF;

        -- Actualizar saldo
        UPDATE socios
        SET ahorro_actual = ahorro_actual - NEW.monto
        WHERE id = NEW.socio_id;

        NEW.saldo_nuevo := socio_record.ahorro_actual - NEW.monto;
    END IF;

    NEW.saldo_anterior := socio_record.ahorro_actual;
    NEW.ahorro_disponible_momento := ahorro_disponible;
    NEW.validacion_retiro := true;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_transaccion_actualizar_saldo
    BEFORE INSERT ON transacciones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_saldo_socio();

COMMENT ON FUNCTION trigger_actualizar_saldo_socio IS 'Actualiza saldo de socio y valida retiros (RN-AHO-001, RN-AHO-002, RN-AHO-003)';


-- ============================================================================
-- TRIGGER: Validar máximo 3 garantizados por garante
-- Regla: RN-GAR-005
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_validar_maximo_garantizados()
RETURNS TRIGGER AS $$
DECLARE
    cuenta_garantias INT;
    etapa_garante INT;
    estado_garante VARCHAR(20);
BEGIN
    -- Validar que garante sea Etapa 3 y ACTIVO (RN-GAR-003)
    SELECT etapa_actual, estado INTO etapa_garante, estado_garante
    FROM socios
    WHERE id = NEW.socio_garante_id;

    IF etapa_garante != 3 OR estado_garante != 'ACTIVO' THEN
        RAISE EXCEPTION 'Solo Socios Especiales (Etapa 3) en estado ACTIVO pueden ser garantes (RN-GAR-003)';
    END IF;

    -- Contar garantías activas del garante
    SELECT COUNT(*) INTO cuenta_garantias
    FROM garantias
    WHERE socio_garante_id = NEW.socio_garante_id
      AND estado = 'ACTIVA';

    IF cuenta_garantias >= 3 THEN
        RAISE EXCEPTION 'El garante ya tiene 3 garantizados activos. Máximo permitido: 3 (RN-GAR-005)';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_garantia_validar_maximo
    BEFORE INSERT ON garantias
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_maximo_garantizados();

COMMENT ON FUNCTION trigger_validar_maximo_garantizados IS 'Valida máximo 3 garantizados por garante y que sea Etapa 3 ACTIVO (RN-GAR-003, RN-GAR-005)';


-- ============================================================================
-- TRIGGER: Congelar ahorros al crear garantía
-- Regla: RN-GAR-004 (Congelar 10% del monto garantizado)
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_congelar_ahorro_garantia()
RETURNS TRIGGER AS $$
DECLARE
    monto_congelar DECIMAL(12,2);
    ahorro_disponible DECIMAL(12,2);
BEGIN
    -- Calcular 10% del crédito garantizado
    monto_congelar := NEW.monto_garantizado * 0.10;
    NEW.monto_congelado := monto_congelar;

    -- Verificar que garante tenga suficiente ahorro disponible
    SELECT (ahorro_actual - ahorro_congelado) INTO ahorro_disponible
    FROM socios
    WHERE id = NEW.socio_garante_id;

    IF monto_congelar > ahorro_disponible THEN
        RAISE EXCEPTION 'Garante no tiene suficiente ahorro disponible para congelar. Disponible: %, Requerido: % (RN-GAR-004)',
            ahorro_disponible, monto_congelar;
    END IF;

    -- Congelar el monto
    UPDATE socios
    SET ahorro_congelado = ahorro_congelado + monto_congelar
    WHERE id = NEW.socio_garante_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_garantia_congelar
    BEFORE INSERT ON garantias
    FOR EACH ROW
    EXECUTE FUNCTION trigger_congelar_ahorro_garantia();

COMMENT ON FUNCTION trigger_congelar_ahorro_garantia IS 'Congela 10% del monto en ahorros del garante (RN-GAR-004)';


-- ============================================================================
-- TRIGGER: Liberar ahorros congelados al liberar garantía
-- Regla: RN-GAR-006
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_liberar_ahorro_garantia()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'LIBERADA' AND OLD.estado = 'ACTIVA' THEN
        -- Liberar el monto congelado
        UPDATE socios
        SET ahorro_congelado = ahorro_congelado - OLD.monto_congelado
        WHERE id = OLD.socio_garante_id;

        NEW.fecha_liberacion := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_update_garantia_liberar
    BEFORE UPDATE ON garantias
    FOR EACH ROW
    EXECUTE FUNCTION trigger_liberar_ahorro_garantia();

COMMENT ON FUNCTION trigger_liberar_ahorro_garantia IS 'Libera ahorros congelados cuando garantía se libera (RN-GAR-006)';


-- ============================================================================
-- TRIGGER: Registrar en auditoría automáticamente
-- Aplica a tablas críticas
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_registrar_auditoria()
RETURNS TRIGGER AS $$
DECLARE
    accion VARCHAR(20);
    usuario_actual INT;
BEGIN
    -- Determinar acción
    IF TG_OP = 'INSERT' THEN
        accion := 'CREAR';
    ELSIF TG_OP = 'UPDATE' THEN
        accion := 'ACTUALIZAR';
    ELSIF TG_OP = 'DELETE' THEN
        accion := 'ELIMINAR';
    END IF;

    -- Obtener usuario de la sesión (si está configurado)
    usuario_actual := NULLIF(current_setting('app.current_user_id', TRUE), '')::INT;

    -- Insertar en auditoría
    INSERT INTO auditoria (
        usuario_id,
        entidad,
        entidad_id,
        accion,
        descripcion,
        datos_anteriores,
        datos_nuevos,
        exitosa
    ) VALUES (
        usuario_actual,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        accion,
        TG_OP || ' en ' || TG_TABLE_NAME,
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
        true
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas críticas
CREATE TRIGGER audit_socios
    AFTER INSERT OR UPDATE OR DELETE ON socios
    FOR EACH ROW EXECUTE FUNCTION trigger_registrar_auditoria();

CREATE TRIGGER audit_creditos
    AFTER INSERT OR UPDATE OR DELETE ON creditos
    FOR EACH ROW EXECUTE FUNCTION trigger_registrar_auditoria();

CREATE TRIGGER audit_pagos
    AFTER INSERT OR UPDATE OR DELETE ON pagos
    FOR EACH ROW EXECUTE FUNCTION trigger_registrar_auditoria();

CREATE TRIGGER audit_garantias
    AFTER INSERT OR UPDATE OR DELETE ON garantias
    FOR EACH ROW EXECUTE FUNCTION trigger_registrar_auditoria();

CREATE TRIGGER audit_transacciones
    AFTER INSERT OR UPDATE OR DELETE ON transacciones
    FOR EACH ROW EXECUTE FUNCTION trigger_registrar_auditoria();

COMMENT ON FUNCTION trigger_registrar_auditoria IS 'Registra automáticamente todas las operaciones críticas en tabla de auditoría';


-- ============================================================================
-- FIN DE ARCHIVO: 04_triggers_validaciones.sql
-- ============================================================================
