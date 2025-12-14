-- ============================================================================
-- Sistema MLF - Base de Datos PostgreSQL
-- Archivo: 03_schema_sistema.sql
-- Descripción: Tablas de sistema (Configuraciones, Notificaciones, Auditoría)
-- Versión: 1.0
-- Fecha: Noviembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: configuraciones
-- Descripción: Configuraciones del sistema con 3 niveles de seguridad
-- ============================================================================

CREATE TABLE configuraciones (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,

    -- Valor (puede ser string, número, boolean, JSON)
    valor TEXT NOT NULL,
    tipo_dato VARCHAR(20) NOT NULL CHECK (tipo_dato IN ('STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'JSON')),

    -- Categoría
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
        'CREDITOS', 'TASAS', 'ETAPAS', 'GARANTIAS', 'MOROSIDAD',
        'UTILIDADES', 'SEGURO', 'SISTEMA', 'NOTIFICACIONES'
    )),

    -- Nivel de seguridad
    nivel_seguridad INT NOT NULL DEFAULT 1 CHECK (nivel_seguridad IN (1, 2, 3)),
    requiere_aprobacion_cambio BOOLEAN DEFAULT false,

    -- Descripción
    descripcion TEXT NOT NULL,
    unidad VARCHAR(20),  -- ej: '%', 'días', 'USD', etc.

    -- Validación
    valor_minimo DECIMAL(15,2),
    valor_maximo DECIMAL(15,2),
    valores_permitidos TEXT,  -- JSON array para opciones fijas

    -- Auditoría
    valor_anterior TEXT,
    fecha_ultimo_cambio TIMESTAMP,
    modificado_por_id INT REFERENCES socios(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_configuraciones_categoria ON configuraciones(categoria);
CREATE INDEX idx_configuraciones_nivel ON configuraciones(nivel_seguridad);

COMMENT ON TABLE configuraciones IS 'Configuraciones del sistema con control de cambios';
COMMENT ON COLUMN configuraciones.nivel_seguridad IS '1=Admin, 2=Aprobación múltiple, 3=Requiere backup antes de cambiar';


-- ============================================================================
-- TABLA: notificaciones
-- Descripción: Registro de notificaciones multi-canal
-- ============================================================================

CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,

    -- Destinatario
    socio_id INT REFERENCES socios(id) ON DELETE SET NULL,
    email VARCHAR(200),
    telefono VARCHAR(20),

    -- Tipo de notificación
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
        'BIENVENIDA', 'CREDITO_APROBADO', 'CREDITO_RECHAZADO',
        'CUOTA_PROXIMA', 'CUOTA_VENCIDA', 'MORA_LEVE', 'MORA_GRAVE',
        'GARANTIA_CONGELADA', 'GARANTIA_LIBERADA', 'GARANTIA_EJECUTADA',
        'UTILIDAD_ACREDITADA', 'CAMBIO_ETAPA', 'ALERTA_SISTEMA', 'OTRO'
    )),
    prioridad VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (prioridad IN ('BAJA', 'NORMAL', 'ALTA', 'URGENTE')),

    -- Contenido
    asunto VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    datos_adicionales JSONB,  -- Datos dinámicos para plantillas

    -- Canal
    canal VARCHAR(20) NOT NULL CHECK (canal IN ('EMAIL', 'SMS', 'WHATSAPP', 'SISTEMA', 'PUSH')),

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'ENVIADA', 'ENTREGADA', 'FALLIDA', 'CANCELADA')),
    intentos_envio INT DEFAULT 0 CHECK (intentos_envio >= 0),
    error_mensaje TEXT,

    -- Seguimiento
    fecha_programada TIMESTAMP,
    fecha_enviada TIMESTAMP,
    fecha_entregada TIMESTAMP,
    fecha_leida TIMESTAMP,

    -- Auditoría
    creada_por_id INT REFERENCES socios(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notificaciones_socio ON notificaciones(socio_id);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX idx_notificaciones_estado ON notificaciones(estado);
CREATE INDEX idx_notificaciones_canal ON notificaciones(canal);
CREATE INDEX idx_notificaciones_fecha_programada ON notificaciones(fecha_programada);
CREATE INDEX idx_notificaciones_prioridad ON notificaciones(prioridad);

COMMENT ON TABLE notificaciones IS 'Sistema de notificaciones multi-canal';
COMMENT ON COLUMN notificaciones.datos_adicionales IS 'Datos JSON para personalizar plantillas dinámicamente';


-- ============================================================================
-- TABLA: auditoria
-- Descripción: Log completo de todas las acciones del sistema
-- ============================================================================

CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,

    -- Usuario que realizó la acción
    usuario_id INT REFERENCES socios(id) ON DELETE SET NULL,
    usuario_email VARCHAR(200),
    usuario_rol VARCHAR(20),
    usuario_ip VARCHAR(45),  -- Soporta IPv6

    -- Acción
    entidad VARCHAR(50) NOT NULL,  -- ej: 'socios', 'creditos', 'pagos'
    entidad_id INT,
    accion VARCHAR(50) NOT NULL CHECK (accion IN (
        'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'LEER',
        'LOGIN', 'LOGOUT', 'APROBAR', 'RECHAZAR',
        'EJECUTAR', 'CALCULAR', 'OTRO'
    )),

    -- Detalles
    descripcion TEXT NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    cambios_detectados JSONB,  -- Array de campos modificados

    -- Contexto
    modulo VARCHAR(50),
    ruta_api VARCHAR(200),
    metodo_http VARCHAR(10),
    user_agent TEXT,

    -- Resultado
    exitosa BOOLEAN DEFAULT true,
    codigo_error VARCHAR(20),
    mensaje_error TEXT,

    -- Timestamp
    fecha_accion TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_entidad ON auditoria(entidad, entidad_id);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_accion);
CREATE INDEX idx_auditoria_exitosa ON auditoria(exitosa);
CREATE INDEX idx_auditoria_modulo ON auditoria(modulo);

COMMENT ON TABLE auditoria IS 'Log completo de todas las acciones del sistema (auditoría total)';
COMMENT ON COLUMN auditoria.cambios_detectados IS 'Array JSON con los campos que cambiaron y sus valores antes/después';


-- ============================================================================
-- TABLA: sesiones
-- Descripción: Control de sesiones activas de usuarios
-- ============================================================================

CREATE TABLE sesiones (
    id SERIAL PRIMARY KEY,
    token VARCHAR(500) UNIQUE NOT NULL,

    -- Usuario
    socio_id INT NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
    usuario_email VARCHAR(200) NOT NULL,
    usuario_rol VARCHAR(20) NOT NULL,

    -- Información de sesión
    ip_address VARCHAR(45),
    user_agent TEXT,
    dispositivo VARCHAR(100),
    navegador VARCHAR(100),

    -- Geolocalización (opcional)
    pais VARCHAR(100),
    ciudad VARCHAR(100),

    -- Estado
    activa BOOLEAN DEFAULT true,
    fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_ultimo_acceso TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMP NOT NULL,
    fecha_cierre TIMESTAMP,

    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_sesiones_token ON sesiones(token);
CREATE INDEX idx_sesiones_socio ON sesiones(socio_id);
CREATE INDEX idx_sesiones_activa ON sesiones(activa);
CREATE INDEX idx_sesiones_expiracion ON sesiones(fecha_expiracion);

COMMENT ON TABLE sesiones IS 'Control de sesiones activas de usuarios (para seguridad y auditoría)';


-- ============================================================================
-- TABLA: cambios_documento
-- Descripción: Registro de cambios en documentos de identidad
-- ============================================================================

CREATE TABLE cambios_documento (
    id SERIAL PRIMARY KEY,

    -- Socio afectado
    socio_id INT NOT NULL REFERENCES socios(id) ON DELETE RESTRICT,

    -- Cambio
    documento_anterior VARCHAR(10) NOT NULL,
    documento_nuevo VARCHAR(10) NOT NULL,
    razon_cambio TEXT NOT NULL,

    -- Documentación de respaldo
    documento_respaldo_url VARCHAR(500),  -- ej: cédula escaneada
    documento_oficial_url VARCHAR(500),   -- ej: oficio gubernamental

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'SOLICITADO'
        CHECK (estado IN ('SOLICITADO', 'EN_REVISION', 'APROBADO', 'RECHAZADO')),

    -- Aprobación
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_aprobacion TIMESTAMP,
    aprobado_por_id INT REFERENCES socios(id),
    observaciones_aprobacion TEXT,

    -- Auditoría
    solicitado_por_id INT REFERENCES socios(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Restricciones
    CHECK (documento_anterior != documento_nuevo),
    CHECK (LENGTH(documento_anterior) = 10 AND documento_anterior ~ '^[0-9]{10}$'),
    CHECK (LENGTH(documento_nuevo) = 10 AND documento_nuevo ~ '^[0-9]{10}$')
);

-- Índices
CREATE INDEX idx_cambios_documento_socio ON cambios_documento(socio_id);
CREATE INDEX idx_cambios_documento_estado ON cambios_documento(estado);
CREATE INDEX idx_cambios_documento_fecha ON cambios_documento(fecha_solicitud);

COMMENT ON TABLE cambios_documento IS 'Registro de cambios en documentos de identidad (para casos especiales de rectificación)';


-- ============================================================================
-- TABLA: dashboard_metricas
-- Descripción: Métricas pre-calculadas para dashboard de rentabilidad
-- ============================================================================

CREATE TABLE dashboard_metricas (
    id SERIAL PRIMARY KEY,

    -- Período
    fecha_calculo DATE NOT NULL,
    tipo_periodo VARCHAR(20) NOT NULL CHECK (tipo_periodo IN ('DIARIO', 'SEMANAL', 'MENSUAL', 'ANUAL')),

    -- Métricas de socios
    total_socios_activos INT DEFAULT 0,
    total_socios_etapa_1 INT DEFAULT 0,
    total_socios_etapa_2 INT DEFAULT 0,
    total_socios_etapa_3 INT DEFAULT 0,
    nuevos_socios_periodo INT DEFAULT 0,

    -- Métricas de créditos
    total_creditos_activos INT DEFAULT 0,
    total_creditos_completados_periodo INT DEFAULT 0,
    monto_total_creditos_activos DECIMAL(15,2) DEFAULT 0,
    monto_desembolsado_periodo DECIMAL(15,2) DEFAULT 0,

    -- Métricas financieras (RN: Dashboard de rentabilidad)
    total_ahorros DECIMAL(15,2) DEFAULT 0,
    ingresos_intereses DECIMAL(15,2) DEFAULT 0,      -- Intereses al 1.5%
    egresos_utilidades DECIMAL(15,2) DEFAULT 0,       -- Utilidades al 1%
    margen_bruto DECIMAL(15,2) DEFAULT 0,             -- Ingresos - Egresos
    porcentaje_margen DECIMAL(5,2) DEFAULT 0,

    -- Métricas de morosidad
    total_creditos_mora INT DEFAULT 0,
    porcentaje_morosidad DECIMAL(5,2) DEFAULT 0,
    monto_mora_total DECIMAL(15,2) DEFAULT 0,
    creditos_castigados_periodo INT DEFAULT 0,

    -- Fondo de seguro
    saldo_fondo_seguro DECIMAL(15,2) DEFAULT 0,
    primas_recaudadas_periodo DECIMAL(15,2) DEFAULT 0,
    coberturas_pagadas_periodo DECIMAL(15,2) DEFAULT 0,

    -- Auditoría
    calculado_por_id INT REFERENCES socios(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Restricción: Solo un registro por fecha y tipo
    UNIQUE (fecha_calculo, tipo_periodo)
);

-- Índices
CREATE INDEX idx_dashboard_metricas_fecha ON dashboard_metricas(fecha_calculo DESC);
CREATE INDEX idx_dashboard_metricas_tipo ON dashboard_metricas(tipo_periodo);

COMMENT ON TABLE dashboard_metricas IS 'Métricas pre-calculadas para dashboard de rentabilidad en tiempo real';
COMMENT ON COLUMN dashboard_metricas.margen_bruto IS 'Ingresos por intereses (1.5%) - Egresos por utilidades (1%)';


-- ============================================================================
-- FIN DE ARCHIVO: 03_schema_sistema.sql
-- ============================================================================
