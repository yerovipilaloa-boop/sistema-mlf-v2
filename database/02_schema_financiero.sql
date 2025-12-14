-- ============================================================================
-- Sistema MLF - Base de Datos PostgreSQL
-- Archivo: 02_schema_financiero.sql
-- Descripción: Tablas módulo financiero (Transacciones, Utilidades, Seguros)
-- Versión: 1.0
-- Fecha: Noviembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: transacciones
-- Descripción: Registro de depósitos y retiros de ahorros
-- Reglas: RN-AHO-001 a RN-AHO-005
-- ============================================================================

CREATE TABLE transacciones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,  -- DEP-SOCXXXX-NNN o RET-SOCXXXX-NNN

    -- Relación
    socio_id INT NOT NULL REFERENCES socios(id) ON DELETE RESTRICT,

    -- Tipo y monto
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('DEPOSITO', 'RETIRO')),
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),

    -- Estado del socio antes/después
    saldo_anterior DECIMAL(12,2) NOT NULL CHECK (saldo_anterior >= 0),
    saldo_nuevo DECIMAL(12,2) NOT NULL CHECK (saldo_nuevo >= 0),

    -- Validación de retiro (RN-AHO-002)
    ahorro_disponible_momento DECIMAL(12,2),
    validacion_retiro BOOLEAN DEFAULT true,

    -- Comprobante
    comprobante_url VARCHAR(500),
    metodo VARCHAR(50) NOT NULL CHECK (metodo IN ('EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO', 'OTRO')),
    referencia_externa VARCHAR(100),

    -- Observaciones
    concepto TEXT,
    notas TEXT,

    -- Auditoría
    fecha_transaccion TIMESTAMP NOT NULL DEFAULT NOW(),
    registrado_por_id INT REFERENCES socios(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Validación de negocio para depósitos
    CHECK (
        (tipo = 'DEPOSITO' AND saldo_nuevo = saldo_anterior + monto) OR
        (tipo = 'RETIRO' AND saldo_nuevo = saldo_anterior - monto)
    )
);

-- Índices
CREATE INDEX idx_transacciones_socio ON transacciones(socio_id);
CREATE INDEX idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha_transaccion);

COMMENT ON TABLE transacciones IS 'Registro de depósitos y retiros de ahorros (RN-AHO-001 a RN-AHO-005)';
COMMENT ON COLUMN transacciones.ahorro_disponible_momento IS 'Ahorro disponible al momento del retiro (para validación RN-AHO-002)';


-- ============================================================================
-- TABLA: utilidades
-- Descripción: Distribución semestral de utilidades
-- Reglas: RN-UTI-001 a RN-UTI-004
-- ============================================================================

CREATE TABLE utilidades (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,  -- UTI-YYYY-SEMN

    -- Período
    año INT NOT NULL CHECK (año >= 2025),
    semestre INT NOT NULL CHECK (semestre IN (1, 2)),
    fecha_distribucion TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Totales del período
    total_socios_activos INT NOT NULL CHECK (total_socios_activos >= 0),
    total_ahorros_promedio DECIMAL(15,2) NOT NULL CHECK (total_ahorros_promedio >= 0),
    total_utilidades_distribuidas DECIMAL(15,2) NOT NULL CHECK (total_utilidades_distribuidas >= 0),

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'CALCULADA'
        CHECK (estado IN ('CALCULADA', 'DISTRIBUIDA', 'COMPLETADA')),

    -- Auditoría
    calculado_por_id INT REFERENCES socios(id),
    distribuido_por_id INT REFERENCES socios(id),
    fecha_calculo TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Restricción: Solo una distribución por período
    UNIQUE (año, semestre)
);

-- Índices
CREATE INDEX idx_utilidades_periodo ON utilidades(año, semestre);
CREATE INDEX idx_utilidades_estado ON utilidades(estado);

COMMENT ON TABLE utilidades IS 'Distribución semestral de utilidades (RN-UTI-001 a RN-UTI-004)';
COMMENT ON COLUMN utilidades.semestre IS '1 = Enero-Junio (distribuye en Julio), 2 = Julio-Diciembre (distribuye en Enero)';


-- ============================================================================
-- TABLA: utilidades_detalle
-- Descripción: Detalle individual de utilidad por socio
-- Reglas: RN-UTI-002, RN-UTI-003, RN-UTI-004
-- ============================================================================

CREATE TABLE utilidades_detalle (
    id SERIAL PRIMARY KEY,

    -- Relaciones
    utilidad_id INT NOT NULL REFERENCES utilidades(id) ON DELETE RESTRICT,
    socio_id INT NOT NULL REFERENCES socios(id) ON DELETE RESTRICT,

    -- Cálculo (RN-UTI-002: 1% sobre ahorro promedio)
    ahorro_promedio_semestre DECIMAL(12,2) NOT NULL CHECK (ahorro_promedio_semestre >= 0),
    porcentaje_utilidad DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (porcentaje_utilidad > 0),
    monto_utilidad DECIMAL(12,2) NOT NULL CHECK (monto_utilidad >= 0),

    -- Estado del socio
    estado_socio_momento VARCHAR(20) NOT NULL,
    etapa_socio_momento INT NOT NULL,

    -- Control
    fecha_acreditacion TIMESTAMP,
    acreditada BOOLEAN DEFAULT false,

    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Restricción: Un socio solo recibe una vez por período
    UNIQUE (utilidad_id, socio_id),

    -- Validación: monto = ahorro_promedio × porcentaje
    CHECK (ABS(monto_utilidad - (ahorro_promedio_semestre * porcentaje_utilidad / 100)) < 0.01)
);

-- Índices
CREATE INDEX idx_utilidades_detalle_utilidad ON utilidades_detalle(utilidad_id);
CREATE INDEX idx_utilidades_detalle_socio ON utilidades_detalle(socio_id);

COMMENT ON TABLE utilidades_detalle IS 'Detalle de utilidades por socio (RN-UTI-002, RN-UTI-004)';
COMMENT ON COLUMN utilidades_detalle.ahorro_promedio_semestre IS 'Promedio del saldo al final de cada mes del semestre';


-- ============================================================================
-- TABLA: fondo_seguro
-- Descripción: Fondo de seguro de desgravamen
-- Reglas: RN-SEG-001 a RN-SEG-005
-- ============================================================================

CREATE TABLE fondo_seguro (
    id SERIAL PRIMARY KEY,

    -- Movimiento
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('INGRESO_PRIMA', 'PAGO_COBERTURA', 'APORTE_PROYECTO')),
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),

    -- Relaciones (opcionales según tipo)
    credito_id INT REFERENCES creditos(id) ON DELETE SET NULL,
    socio_id INT REFERENCES socios(id) ON DELETE SET NULL,

    -- Balance
    saldo_anterior DECIMAL(15,2) NOT NULL CHECK (saldo_anterior >= 0),
    saldo_nuevo DECIMAL(15,2) NOT NULL CHECK (saldo_nuevo >= 0),

    -- Descripción
    concepto TEXT NOT NULL,
    observaciones TEXT,

    -- Auditoría
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT NOW(),
    registrado_por_id INT REFERENCES socios(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Validación de balance
    CHECK (
        (tipo = 'INGRESO_PRIMA' AND saldo_nuevo = saldo_anterior + monto) OR
        (tipo IN ('PAGO_COBERTURA', 'APORTE_PROYECTO') AND saldo_nuevo = saldo_anterior - monto)
    )
);

-- Índices
CREATE INDEX idx_fondo_seguro_tipo ON fondo_seguro(tipo);
CREATE INDEX idx_fondo_seguro_fecha ON fondo_seguro(fecha_movimiento);
CREATE INDEX idx_fondo_seguro_credito ON fondo_seguro(credito_id);
CREATE INDEX idx_fondo_seguro_socio ON fondo_seguro(socio_id);

COMMENT ON TABLE fondo_seguro IS 'Fondo de seguro de desgravamen (RN-SEG-001 a RN-SEG-005)';
COMMENT ON COLUMN fondo_seguro.tipo IS 'INGRESO_PRIMA: Prima 1% de créditos, PAGO_COBERTURA: Pago por fallecimiento, APORTE_PROYECTO: Proyecto cubre diferencia';


-- ============================================================================
-- TABLA: comprobantes
-- Descripción: Comprobantes digitales de transacciones
-- ============================================================================

CREATE TABLE comprobantes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,  -- COM-YYYY-NNNN

    -- Tipo de comprobante
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('DEPOSITO', 'RETIRO', 'PAGO', 'UTILIDAD', 'CREDITO_DESEMBOLSO', 'OTRO')),

    -- Relaciones (opcionales según tipo)
    transaccion_id INT REFERENCES transacciones(id) ON DELETE SET NULL,
    pago_id INT REFERENCES pagos(id) ON DELETE SET NULL,
    credito_id INT REFERENCES creditos(id) ON DELETE SET NULL,
    socio_id INT NOT NULL REFERENCES socios(id) ON DELETE RESTRICT,

    -- Información del comprobante
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    concepto TEXT NOT NULL,
    descripcion TEXT,

    -- Archivo
    archivo_url VARCHAR(500),
    archivo_tipo VARCHAR(50),
    archivo_tamaño_kb INT,

    -- Generación (puede ser manual o automático)
    generado_automaticamente BOOLEAN DEFAULT false,
    plantilla_usada VARCHAR(100),

    -- Auditoría
    fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
    generado_por_id INT REFERENCES socios(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_comprobantes_tipo ON comprobantes(tipo);
CREATE INDEX idx_comprobantes_socio ON comprobantes(socio_id);
CREATE INDEX idx_comprobantes_transaccion ON comprobantes(transaccion_id);
CREATE INDEX idx_comprobantes_pago ON comprobantes(pago_id);
CREATE INDEX idx_comprobantes_fecha ON comprobantes(fecha_emision);

COMMENT ON TABLE comprobantes IS 'Comprobantes digitales de todas las operaciones financieras';


-- ============================================================================
-- TABLA: moras
-- Descripción: Registro detallado de moras por crédito
-- Reglas: RN-MOR-001 a RN-MOR-007
-- ============================================================================

CREATE TABLE moras (
    id SERIAL PRIMARY KEY,

    -- Relaciones
    credito_id INT NOT NULL REFERENCES creditos(id) ON DELETE RESTRICT,
    cuota_id INT NOT NULL REFERENCES cuotas(id) ON DELETE RESTRICT,

    -- Clasificación (RN-MOR-001)
    clasificacion VARCHAR(30) NOT NULL
        CHECK (clasificacion IN ('MORA_LEVE', 'MORA_MODERADA', 'MORA_GRAVE', 'MORA_PERSISTENTE', 'CASTIGADO')),
    dias_mora INT NOT NULL CHECK (dias_mora > 0),

    -- Montos
    monto_cuota_vencida DECIMAL(12,2) NOT NULL CHECK (monto_cuota_vencida > 0),
    interes_mora_acumulado DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (interes_mora_acumulado >= 0),

    -- Fechas importantes
    fecha_inicio_mora DATE NOT NULL,
    fecha_vencimiento_original DATE NOT NULL,
    fecha_regularizacion DATE,

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA', 'REGULARIZADA', 'CASTIGADA')),

    -- Castigo (RN-MOR-003: Al día 90)
    es_castigado BOOLEAN DEFAULT false,
    fecha_castigo TIMESTAMP,
    tasa_cambio_castigo DECIMAL(5,2),  -- Cambio de 1.5% a 3%

    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_moras_credito ON moras(credito_id);
CREATE INDEX idx_moras_cuota ON moras(cuota_id);
CREATE INDEX idx_moras_clasificacion ON moras(clasificacion);
CREATE INDEX idx_moras_estado ON moras(estado);
CREATE INDEX idx_moras_fecha_inicio ON moras(fecha_inicio_mora);

COMMENT ON TABLE moras IS 'Registro detallado de moras (RN-MOR-001 a RN-MOR-007)';
COMMENT ON COLUMN moras.interes_mora_acumulado IS 'Interés 1% diario sobre monto_cuota_vencida (RN-MOR-002)';
COMMENT ON COLUMN moras.es_castigado IS 'TRUE cuando mora llega a 90 días (RN-MOR-003)';


-- ============================================================================
-- FIN DE ARCHIVO: 02_schema_financiero.sql
-- ============================================================================
