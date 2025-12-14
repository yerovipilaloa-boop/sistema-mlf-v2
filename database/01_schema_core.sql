-- ============================================================================
-- Sistema MLF - Base de Datos PostgreSQL
-- Archivo: 01_schema_core.sql
-- Descripción: Tablas core del sistema (Socios, Créditos, Garantías)
-- Versión: 1.0
-- Fecha: Noviembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: socios
-- Descripción: Almacena información completa de todos los socios
-- Reglas: RN-SOC-001 a RN-SOC-008
-- ============================================================================

CREATE TABLE socios (
    -- Identificación
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,  -- SOC-YYYY-NNNN

    -- Datos Personales (RN-SOC-002: Campos obligatorios)
    nombre_completo VARCHAR(200) NOT NULL,
    documento_identidad VARCHAR(10) UNIQUE NOT NULL
        CHECK (LENGTH(documento_identidad) = 10 AND documento_identidad ~ '^[0-9]{10}$'),
    fecha_nacimiento DATE NOT NULL
        CHECK (fecha_nacimiento < CURRENT_DATE),
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(200) NOT NULL,

    -- Financiero
    ahorro_actual DECIMAL(12,2) NOT NULL DEFAULT 0
        CHECK (ahorro_actual >= 0),
    ahorro_congelado DECIMAL(12,2) NOT NULL DEFAULT 0
        CHECK (ahorro_congelado >= 0),

    -- Sistema de Etapas (RN-ETA-001)
    etapa_actual INT NOT NULL DEFAULT 1
        CHECK (etapa_actual IN (1, 2, 3)),
    creditos_etapa_actual INT NOT NULL DEFAULT 0
        CHECK (creditos_etapa_actual >= 0),

    -- Estado (RN-SOC-006)
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO', 'EXPULSADO')),
    voto_confianza BOOLEAN DEFAULT false,

    -- Autenticación
    usuario VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'SOCIO'
        CHECK (rol IN ('ADMIN', 'OPERADOR', 'SOCIO')),

    -- Auditoría
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_socios_codigo ON socios(codigo);
CREATE INDEX idx_socios_documento ON socios(documento_identidad);
CREATE INDEX idx_socios_estado ON socios(estado);
CREATE INDEX idx_socios_etapa ON socios(etapa_actual);
CREATE INDEX idx_socios_email ON socios(email);

-- Comentarios para documentación
COMMENT ON TABLE socios IS 'Tabla principal de socios del sistema MLF';
COMMENT ON COLUMN socios.codigo IS 'Código único formato SOC-YYYY-NNNN (RN-SOC-008)';
COMMENT ON COLUMN socios.documento_identidad IS 'Documento de identidad de 10 dígitos (RN-SOC-003, RN-SOC-004)';
COMMENT ON COLUMN socios.ahorro_congelado IS 'Monto congelado por garantías otorgadas (RN-GAR-004)';
COMMENT ON COLUMN socios.etapa_actual IS '1=Iniciante, 2=Regular, 3=Especial (RN-ETA-001)';
COMMENT ON COLUMN socios.creditos_etapa_actual IS 'Créditos consecutivos sin mora en etapa actual (RN-ETA-005)';


-- ============================================================================
-- TABLA: recomendaciones
-- Descripción: Registro de recomendadores de cada socio nuevo
-- Reglas: RN-SOC-007
-- ============================================================================

CREATE TABLE recomendaciones (
    id SERIAL PRIMARY KEY,

    -- Relaciones
    socio_recomendado_id INT NOT NULL REFERENCES socios(id) ON DELETE RESTRICT,
    socio_recomendador_id INT NOT NULL REFERENCES socios(id) ON DELETE RESTRICT,

    -- Auditoría
    fecha_recomendacion TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Restricción: Un socio no puede recomendarse a sí mismo
    CHECK (socio_recomendado_id != socio_recomendador_id),

    -- Restricción: No puede haber recomendaciones duplicadas
    UNIQUE (socio_recomendado_id, socio_recomendador_id)
);

CREATE INDEX idx_recomendaciones_recomendado ON recomendaciones(socio_recomendado_id);
CREATE INDEX idx_recomendaciones_recomendador ON recomendaciones(socio_recomendador_id);

COMMENT ON TABLE recomendaciones IS 'Registro de sistema de referidos (RN-SOC-007)';


-- ============================================================================
-- TABLA: creditos
-- Descripción: Almacena todos los créditos otorgados
-- Reglas: RN-CRE-001 a RN-CRE-010
-- ============================================================================

CREATE TABLE creditos (
    -- Identificación
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,  -- CRE-YYYY-NNNN

    -- Relaciones
    socio_id INT NOT NULL REFERENCES socios(id) ON DELETE RESTRICT,

    -- Montos (RN-CRE-005: Prima de seguro obligatoria)
    monto_solicitado DECIMAL(12,2) NOT NULL CHECK (monto_solicitado > 0),
    prima_seguro DECIMAL(12,2) NOT NULL CHECK (prima_seguro >= 0),
    monto_total DECIMAL(12,2) NOT NULL CHECK (monto_total > 0),

    -- Términos del crédito
    plazo_meses INT NOT NULL CHECK (plazo_meses >= 6 AND plazo_meses <= 60),
    tasa_interes_mensual DECIMAL(5,2) NOT NULL CHECK (tasa_interes_mensual > 0),
    metodo_amortizacion VARCHAR(20) NOT NULL CHECK (metodo_amortizacion IN ('FRANCES', 'ALEMAN')),
    cuota_mensual DECIMAL(12,2) NOT NULL CHECK (cuota_mensual > 0),

    -- Control de deuda
    saldo_capital DECIMAL(12,2) NOT NULL CHECK (saldo_capital >= 0),

    -- Estado del crédito
    estado VARCHAR(20) NOT NULL DEFAULT 'SOLICITADO'
        CHECK (estado IN ('SOLICITADO', 'APROBADO', 'ACTIVO', 'COMPLETADO', 'CASTIGADO')),

    -- Morosidad (RN-MOR-001)
    estado_mora VARCHAR(30)
        CHECK (estado_mora IS NULL OR estado_mora IN ('AL_DIA', 'MORA_LEVE', 'MORA_MODERADA', 'MORA_GRAVE', 'MORA_PERSISTENTE')),
    dias_mora INT DEFAULT 0 CHECK (dias_mora >= 0),

    -- Fechas importantes
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_aprobacion TIMESTAMP,
    fecha_desembolso TIMESTAMP,
    fecha_finalizacion TIMESTAMP,

    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Validaciones de negocio
    CHECK (monto_total = monto_solicitado + prima_seguro),
    CHECK (prima_seguro = monto_solicitado * 0.01)
);

-- Índices
CREATE INDEX idx_creditos_codigo ON creditos(codigo);
CREATE INDEX idx_creditos_socio ON creditos(socio_id);
CREATE INDEX idx_creditos_estado ON creditos(estado);
CREATE INDEX idx_creditos_estado_mora ON creditos(estado_mora);
CREATE INDEX idx_creditos_fecha_desembolso ON creditos(fecha_desembolso);

COMMENT ON TABLE creditos IS 'Registro de todos los créditos del sistema MLF';
COMMENT ON COLUMN creditos.prima_seguro IS 'Prima obligatoria 1% del monto (RN-CRE-005, RN-SEG-001)';
COMMENT ON COLUMN creditos.monto_total IS 'Monto que debe devolver el socio (incluye prima)';
COMMENT ON COLUMN creditos.tasa_interes_mensual IS '1.5% normal, 3% castigo (RN-CRE-007)';
COMMENT ON COLUMN creditos.estado_mora IS 'Clasificación de mora por días (RN-MOR-001)';


-- ============================================================================
-- TABLA: cuotas
-- Descripción: Tabla de amortización generada para cada crédito
-- Reglas: RN-CRE-010
-- ============================================================================

CREATE TABLE cuotas (
    id SERIAL PRIMARY KEY,

    -- Relación
    credito_id INT NOT NULL REFERENCES creditos(id) ON DELETE CASCADE,

    -- Información de la cuota
    numero_cuota INT NOT NULL CHECK (numero_cuota > 0),
    fecha_vencimiento DATE NOT NULL,

    -- Montos calculados (según método de amortización)
    monto_cuota DECIMAL(12,2) NOT NULL CHECK (monto_cuota > 0),
    monto_capital DECIMAL(12,2) NOT NULL CHECK (monto_capital >= 0),
    monto_interes DECIMAL(12,2) NOT NULL CHECK (monto_interes >= 0),
    saldo_capital_despues DECIMAL(12,2) NOT NULL CHECK (saldo_capital_despues >= 0),

    -- Control de pagos
    monto_pagado DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (monto_pagado >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'PAGADA', 'VENCIDA', 'ADELANTADO')),

    -- Mora (RN-MOR-002: Interés 1% diario)
    dias_mora INT DEFAULT 0 CHECK (dias_mora >= 0),
    interes_mora DECIMAL(12,2) DEFAULT 0 CHECK (interes_mora >= 0),

    -- Auditoría
    fecha_pago TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Restricción: Solo una cuota por número en cada crédito
    UNIQUE (credito_id, numero_cuota),

    -- Validación: monto_cuota = monto_capital + monto_interes
    CHECK (ABS(monto_cuota - (monto_capital + monto_interes)) < 0.01)
);

-- Índices
CREATE INDEX idx_cuotas_credito ON cuotas(credito_id);
CREATE INDEX idx_cuotas_estado ON cuotas(estado);
CREATE INDEX idx_cuotas_fecha_vencimiento ON cuotas(fecha_vencimiento);

COMMENT ON TABLE cuotas IS 'Tabla de amortización de cada crédito (RN-CRE-010)';
COMMENT ON COLUMN cuotas.interes_mora IS 'Interés de mora: 1% diario sobre monto_cuota (RN-MOR-002)';
COMMENT ON COLUMN cuotas.estado IS 'ADELANTADO cuando socio elige reducir plazo (RN-PAG-002)';


-- ============================================================================
-- TABLA: pagos
-- Descripción: Registro detallado de todos los pagos realizados
-- Reglas: RN-PAG-001 a RN-PAG-007
-- ============================================================================

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,  -- PAG-CREXXXX-NNN

    -- Relaciones
    credito_id INT NOT NULL REFERENCES creditos(id) ON DELETE RESTRICT,
    socio_id INT NOT NULL REFERENCES socios(id) ON DELETE RESTRICT,
    cuota_id INT REFERENCES cuotas(id) ON DELETE SET NULL,

    -- Información del pago
    monto_pago DECIMAL(12,2) NOT NULL CHECK (monto_pago > 0),

    -- Aplicación del pago (RN-PAG-006: Orden de aplicación)
    monto_a_mora DECIMAL(12,2) DEFAULT 0 CHECK (monto_a_mora >= 0),
    monto_a_interes DECIMAL(12,2) DEFAULT 0 CHECK (monto_a_interes >= 0),
    monto_a_capital DECIMAL(12,2) DEFAULT 0 CHECK (monto_a_capital >= 0),
    monto_a_cuota_siguiente DECIMAL(12,2) DEFAULT 0 CHECK (monto_a_cuota_siguiente >= 0),

    -- Abonos a capital (RN-PAG-001, RN-PAG-002)
    es_abono_capital BOOLEAN DEFAULT false,
    tipo_abono VARCHAR(20) CHECK (tipo_abono IS NULL OR tipo_abono IN ('REDUCIR_PLAZO', 'REDUCIR_CUOTA')),

    -- Comprobante
    comprobante_url VARCHAR(500),
    metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO', 'OTRO')),

    -- Auditoría
    fecha_pago TIMESTAMP NOT NULL DEFAULT NOW(),
    registrado_por_id INT REFERENCES socios(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Validación: Suma de aplicaciones debe ser igual al monto
    CHECK (ABS(monto_pago - (monto_a_mora + monto_a_interes + monto_a_capital + monto_a_cuota_siguiente)) < 0.01)
);

-- Índices
CREATE INDEX idx_pagos_credito ON pagos(credito_id);
CREATE INDEX idx_pagos_socio ON pagos(socio_id);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX idx_pagos_cuota ON pagos(cuota_id);

COMMENT ON TABLE pagos IS 'Registro detallado de todos los pagos (RN-PAG-001 a RN-PAG-007)';
COMMENT ON COLUMN pagos.es_abono_capital IS 'TRUE cuando pago excede cuota vigente (RN-PAG-001)';
COMMENT ON COLUMN pagos.tipo_abono IS 'Decisión del socio para abonos a capital (RN-PAG-002)';


-- ============================================================================
-- TABLA: garantias
-- Descripción: Garantías cruzadas entre socios
-- Reglas: RN-GAR-001 a RN-GAR-008
-- ============================================================================

CREATE TABLE garantias (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,  -- GAR-YYYY-NNNN

    -- Relaciones
    credito_id INT NOT NULL REFERENCES creditos(id) ON DELETE RESTRICT,
    socio_garantizado_id INT NOT NULL REFERENCES socios(id) ON DELETE RESTRICT,
    socio_garante_id INT NOT NULL REFERENCES socios(id) ON DELETE RESTRICT,

    -- Montos (RN-GAR-004: 10% del crédito)
    monto_garantizado DECIMAL(12,2) NOT NULL CHECK (monto_garantizado > 0),
    monto_congelado DECIMAL(12,2) NOT NULL CHECK (monto_congelado > 0),

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA', 'LIBERADA', 'EJECUTADA')),

    -- Liberación (RN-GAR-006, RN-GAR-007)
    porcentaje_completado_al_liberar INT CHECK (porcentaje_completado_al_liberar IN (50, 100)),
    fecha_liberacion TIMESTAMP,
    razon_liberacion TEXT,

    -- Ejecución (RN-GAR-008)
    fecha_ejecucion TIMESTAMP,
    monto_ejecutado DECIMAL(12,2) CHECK (monto_ejecutado >= 0),

    -- Auditoría
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Restricciones de negocio
    CHECK (socio_garantizado_id != socio_garante_id),
    CHECK (monto_congelado = monto_garantizado * 0.10)
);

-- Índices
CREATE INDEX idx_garantias_credito ON garantias(credito_id);
CREATE INDEX idx_garantias_garantizado ON garantias(socio_garantizado_id);
CREATE INDEX idx_garantias_garante ON garantias(socio_garante_id);
CREATE INDEX idx_garantias_estado ON garantias(estado);

COMMENT ON TABLE garantias IS 'Sistema de garantías cruzadas entre socios (RN-GAR-001 a RN-GAR-008)';
COMMENT ON COLUMN garantias.monto_congelado IS '10% del monto garantizado (RN-GAR-004)';
COMMENT ON COLUMN garantias.estado IS 'EJECUTADA cuando mora llega a 90 días (RN-GAR-008)';


-- ============================================================================
-- TABLA: liberaciones_garantia
-- Descripción: Solicitudes de liberación de garantías
-- Reglas: RN-GAR-006, RN-GAR-007
-- ============================================================================

CREATE TABLE liberaciones_garantia (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,  -- LIB-YYYY-NNNN

    -- Relación
    garantia_id INT NOT NULL REFERENCES garantias(id) ON DELETE RESTRICT,

    -- Solicitud
    porcentaje_completado_credito INT NOT NULL CHECK (porcentaje_completado_credito >= 0 AND porcentaje_completado_credito <= 100),
    comportamiento_evaluado VARCHAR(20) CHECK (comportamiento_evaluado IN ('EXCELENTE', 'BUENO', 'REGULAR', 'MALO')),
    moras_ultimos_6_meses INT DEFAULT 0 CHECK (moras_ultimos_6_meses >= 0),

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'SOLICITADA'
        CHECK (estado IN ('SOLICITADA', 'APROBADA', 'RECHAZADA')),

    -- Decisión
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_decision TIMESTAMP,
    decidido_por_id INT REFERENCES socios(id),
    razon_decision TEXT,

    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_liberaciones_garantia ON liberaciones_garantia(garantia_id);
CREATE INDEX idx_liberaciones_estado ON liberaciones_garantia(estado);

COMMENT ON TABLE liberaciones_garantia IS 'Solicitudes de liberación de garantías (RN-GAR-006, RN-GAR-007)';
COMMENT ON COLUMN liberaciones_garantia.comportamiento_evaluado IS 'EXCELENTE: 0 moras en 6 meses, BUENO: max 1 mora leve hace >3 meses';


-- ============================================================================
-- FIN DE ARCHIVO: 01_schema_core.sql
-- ============================================================================
