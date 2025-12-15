-- CreateTable
CREATE TABLE `socios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre_completo` VARCHAR(200) NOT NULL,
    `documento_identidad` VARCHAR(10) NOT NULL,
    `fecha_nacimiento` DATE NOT NULL,
    `direccion` VARCHAR(191) NOT NULL,
    `ciudad` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `ahorro_actual` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `ahorro_congelado` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `etapa_actual` INTEGER NOT NULL DEFAULT 1,
    `creditos_etapa_actual` INTEGER NOT NULL DEFAULT 0,
    `estado` ENUM('ACTIVO', 'SUSPENDIDO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    `voto_confianza` BOOLEAN NULL DEFAULT false,
    `usuario` VARCHAR(50) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `observaciones` TEXT NULL,
    `rol` ENUM('SOCIO', 'TESORERO', 'ADMIN') NOT NULL DEFAULT 'SOCIO',
    `fecha_registro` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `socios_codigo_key`(`codigo`),
    UNIQUE INDEX `socios_documento_identidad_key`(`documento_identidad`),
    UNIQUE INDEX `socios_usuario_key`(`usuario`),
    INDEX `idx_socios_codigo`(`codigo`),
    INDEX `idx_socios_documento`(`documento_identidad`),
    INDEX `idx_socios_email`(`email`),
    INDEX `idx_socios_estado`(`estado`),
    INDEX `idx_socios_etapa`(`etapa_actual`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recomendaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `socio_recomendado_id` INTEGER NOT NULL,
    `socio_recomendador_id` INTEGER NOT NULL,
    `fecha_recomendacion` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `idx_recomendaciones_recomendado`(`socio_recomendado_id`),
    INDEX `idx_recomendaciones_recomendador`(`socio_recomendador_id`),
    UNIQUE INDEX `recomendaciones_socio_recomendado_id_socio_recomendador_id_key`(`socio_recomendado_id`, `socio_recomendador_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `creditos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `socio_id` INTEGER NOT NULL,
    `monto_solicitado` DECIMAL(12, 2) NOT NULL,
    `prima_seguro` DECIMAL(12, 2) NOT NULL,
    `monto_total` DECIMAL(12, 2) NOT NULL,
    `plazo_meses` INTEGER NOT NULL,
    `tasa_interes_mensual` DECIMAL(5, 2) NOT NULL,
    `metodo_amortizacion` VARCHAR(20) NOT NULL,
    `cuota_mensual` DECIMAL(12, 2) NOT NULL,
    `saldo_capital` DECIMAL(12, 2) NOT NULL,
    `estado` ENUM('SOLICITADO', 'EN_REVISION', 'APROBADO', 'DESEMBOLSADO', 'COMPLETADO', 'CASTIGADO', 'RECHAZADO') NOT NULL DEFAULT 'SOLICITADO',
    `estado_mora` ENUM('AL_DIA', 'MORA_LEVE', 'MORA_MODERADA', 'MORA_GRAVE', 'MORA_PERSISTENTE', 'CASTIGADO') NULL,
    `dias_mora` INTEGER NULL DEFAULT 0,
    `fecha_solicitud` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fecha_aprobacion` TIMESTAMP(6) NULL,
    `fecha_desembolso` TIMESTAMP(6) NULL,
    `fecha_finalizacion` TIMESTAMP(6) NULL,
    `observaciones` TEXT NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `creditos_codigo_key`(`codigo`),
    INDEX `idx_creditos_codigo`(`codigo`),
    INDEX `idx_creditos_estado`(`estado`),
    INDEX `idx_creditos_estado_mora`(`estado_mora`),
    INDEX `idx_creditos_fecha_desembolso`(`fecha_desembolso`),
    INDEX `idx_creditos_socio`(`socio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuotas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `credito_id` INTEGER NOT NULL,
    `numero_cuota` INTEGER NOT NULL,
    `fecha_vencimiento` DATE NOT NULL,
    `monto_cuota` DECIMAL(12, 2) NOT NULL,
    `monto_capital` DECIMAL(12, 2) NOT NULL,
    `monto_interes` DECIMAL(12, 2) NOT NULL,
    `saldo_capital_despues` DECIMAL(12, 2) NOT NULL,
    `monto_pagado` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    `dias_mora` INTEGER NULL DEFAULT 0,
    `interes_mora` DECIMAL(12, 2) NULL DEFAULT 0,
    `fecha_pago` TIMESTAMP(6) NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `idx_cuotas_credito`(`credito_id`),
    INDEX `idx_cuotas_estado`(`estado`),
    INDEX `idx_cuotas_fecha_vencimiento`(`fecha_vencimiento`),
    UNIQUE INDEX `cuotas_credito_id_numero_cuota_key`(`credito_id`, `numero_cuota`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `credito_id` INTEGER NOT NULL,
    `socio_id` INTEGER NOT NULL,
    `cuota_id` INTEGER NULL,
    `monto_pago` DECIMAL(12, 2) NOT NULL,
    `monto_a_mora` DECIMAL(12, 2) NULL DEFAULT 0,
    `monto_a_interes` DECIMAL(12, 2) NULL DEFAULT 0,
    `monto_a_capital` DECIMAL(12, 2) NULL DEFAULT 0,
    `monto_a_cuota_siguiente` DECIMAL(12, 2) NULL DEFAULT 0,
    `es_abono_capital` BOOLEAN NULL DEFAULT false,
    `tipo_abono` VARCHAR(20) NULL,
    `comprobante_url` VARCHAR(500) NULL,
    `metodo_pago` VARCHAR(50) NOT NULL,
    `fecha_pago` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `registrado_por_id` INTEGER NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `pagos_codigo_key`(`codigo`),
    INDEX `idx_pagos_credito`(`credito_id`),
    INDEX `idx_pagos_cuota`(`cuota_id`),
    INDEX `idx_pagos_fecha`(`fecha_pago`),
    INDEX `idx_pagos_socio`(`socio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `credito_id` INTEGER NOT NULL,
    `cuota_id` INTEGER NOT NULL,
    `clasificacion` VARCHAR(30) NOT NULL,
    `dias_mora` INTEGER NOT NULL,
    `monto_cuota_vencida` DECIMAL(12, 2) NOT NULL,
    `interes_mora_acumulado` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `fecha_inicio_mora` DATE NOT NULL,
    `fecha_vencimiento_original` DATE NOT NULL,
    `fecha_regularizacion` DATE NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    `es_castigado` BOOLEAN NULL DEFAULT false,
    `fecha_castigo` TIMESTAMP(6) NULL,
    `tasa_cambio_castigo` DECIMAL(5, 2) NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `idx_moras_clasificacion`(`clasificacion`),
    INDEX `idx_moras_credito`(`credito_id`),
    INDEX `idx_moras_cuota`(`cuota_id`),
    INDEX `idx_moras_estado`(`estado`),
    INDEX `idx_moras_fecha_inicio`(`fecha_inicio_mora`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `garantias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `credito_id` INTEGER NOT NULL,
    `socio_garantizado_id` INTEGER NOT NULL,
    `socio_garante_id` INTEGER NOT NULL,
    `monto_garantizado` DECIMAL(12, 2) NOT NULL,
    `monto_congelado` DECIMAL(12, 2) NOT NULL,
    `estado` ENUM('PENDIENTE', 'ACTIVA', 'EJECUTADA', 'LIBERADA') NOT NULL DEFAULT 'ACTIVA',
    `porcentaje_completado_al_liberar` INTEGER NULL,
    `fecha_liberacion` TIMESTAMP(6) NULL,
    `razon_liberacion` VARCHAR(191) NULL,
    `fecha_ejecucion` TIMESTAMP(6) NULL,
    `monto_ejecutado` DECIMAL(12, 2) NULL,
    `fecha_creacion` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `garantias_codigo_key`(`codigo`),
    INDEX `idx_garantias_credito`(`credito_id`),
    INDEX `idx_garantias_estado`(`estado`),
    INDEX `idx_garantias_garante`(`socio_garante_id`),
    INDEX `idx_garantias_garantizado`(`socio_garantizado_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `liberaciones_garantia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `garantia_id` INTEGER NOT NULL,
    `porcentaje_completado_credito` INTEGER NOT NULL,
    `comportamiento_evaluado` VARCHAR(20) NULL,
    `moras_ultimos_6_meses` INTEGER NULL DEFAULT 0,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'SOLICITADA',
    `fecha_solicitud` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fecha_decision` TIMESTAMP(6) NULL,
    `decidido_por_id` INTEGER NULL,
    `razon_decision` VARCHAR(191) NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `liberaciones_garantia_codigo_key`(`codigo`),
    INDEX `idx_liberaciones_estado`(`estado`),
    INDEX `idx_liberaciones_garantia`(`garantia_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transacciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `socio_id` INTEGER NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `saldo_anterior` DECIMAL(12, 2) NOT NULL,
    `saldo_nuevo` DECIMAL(12, 2) NOT NULL,
    `ahorro_disponible_momento` DECIMAL(12, 2) NULL,
    `validacion_retiro` BOOLEAN NULL DEFAULT true,
    `comprobante_url` VARCHAR(500) NULL,
    `metodo` VARCHAR(50) NOT NULL,
    `referencia_externa` VARCHAR(100) NULL,
    `concepto` VARCHAR(191) NULL,
    `notas` VARCHAR(191) NULL,
    `fecha_transaccion` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `registrado_por_id` INTEGER NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `transacciones_codigo_key`(`codigo`),
    INDEX `idx_transacciones_fecha`(`fecha_transaccion`),
    INDEX `idx_transacciones_socio`(`socio_id`),
    INDEX `idx_transacciones_tipo`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilidades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `año` INTEGER NOT NULL,
    `semestre` INTEGER NOT NULL,
    `fecha_distribucion` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `total_socios_activos` INTEGER NOT NULL,
    `total_ahorros_promedio` DECIMAL(15, 2) NOT NULL,
    `total_utilidades_distribuidas` DECIMAL(15, 2) NOT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'CALCULADA',
    `calculado_por_id` INTEGER NULL,
    `distribuido_por_id` INTEGER NULL,
    `fecha_calculo` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `utilidades_codigo_key`(`codigo`),
    INDEX `idx_utilidades_estado`(`estado`),
    INDEX `idx_utilidades_periodo`(`año`, `semestre`),
    UNIQUE INDEX `utilidades_año_semestre_key`(`año`, `semestre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilidades_detalle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilidad_id` INTEGER NOT NULL,
    `socio_id` INTEGER NOT NULL,
    `ahorro_promedio_semestre` DECIMAL(12, 2) NOT NULL,
    `porcentaje_utilidad` DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    `monto_utilidad` DECIMAL(12, 2) NOT NULL,
    `estado_socio_momento` VARCHAR(20) NOT NULL,
    `etapa_socio_momento` INTEGER NOT NULL,
    `fecha_acreditacion` TIMESTAMP(6) NULL,
    `acreditada` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `idx_utilidades_detalle_socio`(`socio_id`),
    INDEX `idx_utilidades_detalle_utilidad`(`utilidad_id`),
    UNIQUE INDEX `utilidades_detalle_utilidad_id_socio_id_key`(`utilidad_id`, `socio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comprobantes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `tipo` VARCHAR(30) NOT NULL,
    `transaccion_id` INTEGER NULL,
    `pago_id` INTEGER NULL,
    `credito_id` INTEGER NULL,
    `socio_id` INTEGER NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `archivo_url` VARCHAR(500) NULL,
    `archivo_tipo` VARCHAR(50) NULL,
    `archivo_tamaño_kb` INTEGER NULL,
    `generado_automaticamente` BOOLEAN NULL DEFAULT false,
    `plantilla_usada` VARCHAR(100) NULL,
    `fecha_emision` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `generado_por_id` INTEGER NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `comprobantes_codigo_key`(`codigo`),
    INDEX `idx_comprobantes_fecha`(`fecha_emision`),
    INDEX `idx_comprobantes_pago`(`pago_id`),
    INDEX `idx_comprobantes_socio`(`socio_id`),
    INDEX `idx_comprobantes_tipo`(`tipo`),
    INDEX `idx_comprobantes_transaccion`(`transaccion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuraciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(100) NOT NULL,
    `valor` VARCHAR(191) NOT NULL,
    `tipo_dato` VARCHAR(20) NOT NULL,
    `categoria` VARCHAR(50) NOT NULL,
    `nivel_seguridad` INTEGER NOT NULL DEFAULT 1,
    `requiere_aprobacion_cambio` BOOLEAN NULL DEFAULT false,
    `descripcion` VARCHAR(191) NOT NULL,
    `unidad` VARCHAR(20) NULL,
    `valor_minimo` DECIMAL(15, 2) NULL,
    `valor_maximo` DECIMAL(15, 2) NULL,
    `valores_permitidos` VARCHAR(191) NULL,
    `valor_anterior` VARCHAR(191) NULL,
    `fecha_ultimo_cambio` TIMESTAMP(6) NULL,
    `modificado_por_id` INTEGER NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `configuraciones_clave_key`(`clave`),
    INDEX `idx_configuraciones_categoria`(`categoria`),
    INDEX `idx_configuraciones_nivel`(`nivel_seguridad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `socio_id` INTEGER NULL,
    `email` VARCHAR(200) NULL,
    `telefono` VARCHAR(20) NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `prioridad` VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    `asunto` VARCHAR(200) NOT NULL,
    `mensaje` VARCHAR(191) NOT NULL,
    `datos_adicionales` JSON NULL,
    `canal` VARCHAR(20) NOT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    `intentos_envio` INTEGER NULL DEFAULT 0,
    `error_mensaje` VARCHAR(191) NULL,
    `fecha_programada` TIMESTAMP(6) NULL,
    `fecha_enviada` TIMESTAMP(6) NULL,
    `fecha_entregada` TIMESTAMP(6) NULL,
    `fecha_leida` TIMESTAMP(6) NULL,
    `creada_por_id` INTEGER NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `idx_notificaciones_canal`(`canal`),
    INDEX `idx_notificaciones_estado`(`estado`),
    INDEX `idx_notificaciones_fecha_programada`(`fecha_programada`),
    INDEX `idx_notificaciones_prioridad`(`prioridad`),
    INDEX `idx_notificaciones_socio`(`socio_id`),
    INDEX `idx_notificaciones_tipo`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NULL,
    `usuario_email` VARCHAR(200) NULL,
    `usuario_rol` VARCHAR(20) NULL,
    `usuario_ip` VARCHAR(45) NULL,
    `entidad` VARCHAR(50) NOT NULL,
    `entidad_id` INTEGER NULL,
    `accion` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `datos_anteriores` JSON NULL,
    `datos_nuevos` JSON NULL,
    `cambios_detectados` JSON NULL,
    `modulo` VARCHAR(50) NULL,
    `ruta_api` VARCHAR(200) NULL,
    `metodo_http` VARCHAR(10) NULL,
    `user_agent` VARCHAR(191) NULL,
    `exitosa` BOOLEAN NULL DEFAULT true,
    `codigo_error` VARCHAR(20) NULL,
    `mensaje_error` VARCHAR(191) NULL,
    `fecha_accion` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `idx_auditoria_accion`(`accion`),
    INDEX `idx_auditoria_entidad`(`entidad`, `entidad_id`),
    INDEX `idx_auditoria_exitosa`(`exitosa`),
    INDEX `idx_auditoria_fecha`(`fecha_accion`),
    INDEX `idx_auditoria_modulo`(`modulo`),
    INDEX `idx_auditoria_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sesiones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(500) NOT NULL,
    `socio_id` INTEGER NOT NULL,
    `usuario_email` VARCHAR(200) NOT NULL,
    `usuario_rol` VARCHAR(20) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(191) NULL,
    `dispositivo` VARCHAR(100) NULL,
    `navegador` VARCHAR(100) NULL,
    `pais` VARCHAR(100) NULL,
    `ciudad` VARCHAR(100) NULL,
    `activa` BOOLEAN NULL DEFAULT true,
    `fecha_inicio` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fecha_ultimo_acceso` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fecha_expiracion` TIMESTAMP(6) NOT NULL,
    `fecha_cierre` TIMESTAMP(6) NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `sesiones_token_key`(`token`),
    INDEX `idx_sesiones_activa`(`activa`),
    INDEX `idx_sesiones_expiracion`(`fecha_expiracion`),
    INDEX `idx_sesiones_socio`(`socio_id`),
    INDEX `idx_sesiones_token`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dashboard_metricas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha_calculo` DATE NOT NULL,
    `tipo_periodo` VARCHAR(20) NOT NULL,
    `total_socios_activos` INTEGER NULL DEFAULT 0,
    `total_socios_etapa_1` INTEGER NULL DEFAULT 0,
    `total_socios_etapa_2` INTEGER NULL DEFAULT 0,
    `total_socios_etapa_3` INTEGER NULL DEFAULT 0,
    `nuevos_socios_periodo` INTEGER NULL DEFAULT 0,
    `total_creditos_activos` INTEGER NULL DEFAULT 0,
    `total_creditos_completados_periodo` INTEGER NULL DEFAULT 0,
    `monto_total_creditos_activos` DECIMAL(15, 2) NULL DEFAULT 0,
    `monto_desembolsado_periodo` DECIMAL(15, 2) NULL DEFAULT 0,
    `total_ahorros` DECIMAL(15, 2) NULL DEFAULT 0,
    `ingresos_intereses` DECIMAL(15, 2) NULL DEFAULT 0,
    `egresos_utilidades` DECIMAL(15, 2) NULL DEFAULT 0,
    `margen_bruto` DECIMAL(15, 2) NULL DEFAULT 0,
    `porcentaje_margen` DECIMAL(5, 2) NULL DEFAULT 0,
    `total_creditos_mora` INTEGER NULL DEFAULT 0,
    `porcentaje_morosidad` DECIMAL(5, 2) NULL DEFAULT 0,
    `monto_mora_total` DECIMAL(15, 2) NULL DEFAULT 0,
    `creditos_castigados_periodo` INTEGER NULL DEFAULT 0,
    `saldo_fondo_seguro` DECIMAL(15, 2) NULL DEFAULT 0,
    `primas_recaudadas_periodo` DECIMAL(15, 2) NULL DEFAULT 0,
    `coberturas_pagadas_periodo` DECIMAL(15, 2) NULL DEFAULT 0,
    `calculado_por_id` INTEGER NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `idx_dashboard_metricas_fecha`(`fecha_calculo` DESC),
    INDEX `idx_dashboard_metricas_tipo`(`tipo_periodo`),
    UNIQUE INDEX `dashboard_metricas_fecha_calculo_tipo_periodo_key`(`fecha_calculo`, `tipo_periodo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cambios_documento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `socio_id` INTEGER NOT NULL,
    `documento_anterior` VARCHAR(10) NOT NULL,
    `documento_nuevo` VARCHAR(10) NOT NULL,
    `razon_cambio` VARCHAR(191) NOT NULL,
    `documento_respaldo_url` VARCHAR(500) NULL,
    `documento_oficial_url` VARCHAR(500) NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'SOLICITADO',
    `fecha_solicitud` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fecha_aprobacion` TIMESTAMP(6) NULL,
    `aprobado_por_id` INTEGER NULL,
    `observaciones_aprobacion` VARCHAR(191) NULL,
    `solicitado_por_id` INTEGER NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `idx_cambios_documento_estado`(`estado`),
    INDEX `idx_cambios_documento_fecha`(`fecha_solicitud`),
    INDEX `idx_cambios_documento_socio`(`socio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gastos_operativos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `categoria` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `fecha_gasto` TIMESTAMP(6) NOT NULL,
    `tipo_pago` VARCHAR(30) NULL,
    `numero_comprobante` VARCHAR(50) NULL,
    `proveedor` VARCHAR(200) NULL,
    `observaciones` VARCHAR(191) NULL,
    `registrado_por_id` INTEGER NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `gastos_operativos_codigo_key`(`codigo`),
    INDEX `idx_gastos_categoria`(`categoria`),
    INDEX `idx_gastos_fecha`(`fecha_gasto`),
    INDEX `idx_gastos_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fondo_seguro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `socio_id` INTEGER NULL,
    `credito_id` INTEGER NULL,
    `fecha_movimiento` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `registrado_por_id` INTEGER NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `fondo_seguro_codigo_key`(`codigo`),
    INDEX `idx_fondo_seguro_tipo`(`tipo`),
    INDEX `idx_fondo_seguro_fecha`(`fecha_movimiento`),
    INDEX `idx_fondo_seguro_socio`(`socio_id`),
    INDEX `idx_fondo_seguro_credito`(`credito_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recomendaciones` ADD CONSTRAINT `recomendaciones_socio_recomendado_id_fkey` FOREIGN KEY (`socio_recomendado_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `recomendaciones` ADD CONSTRAINT `recomendaciones_socio_recomendador_id_fkey` FOREIGN KEY (`socio_recomendador_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `creditos_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cuotas` ADD CONSTRAINT `cuotas_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_cuota_id_fkey` FOREIGN KEY (`cuota_id`) REFERENCES `cuotas`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_registrado_por_id_fkey` FOREIGN KEY (`registrado_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `moras` ADD CONSTRAINT `moras_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `moras` ADD CONSTRAINT `moras_cuota_id_fkey` FOREIGN KEY (`cuota_id`) REFERENCES `cuotas`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `garantias` ADD CONSTRAINT `garantias_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `garantias` ADD CONSTRAINT `garantias_socio_garante_id_fkey` FOREIGN KEY (`socio_garante_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `garantias` ADD CONSTRAINT `garantias_socio_garantizado_id_fkey` FOREIGN KEY (`socio_garantizado_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `liberaciones_garantia` ADD CONSTRAINT `liberaciones_garantia_decidido_por_id_fkey` FOREIGN KEY (`decidido_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `liberaciones_garantia` ADD CONSTRAINT `liberaciones_garantia_garantia_id_fkey` FOREIGN KEY (`garantia_id`) REFERENCES `garantias`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transacciones` ADD CONSTRAINT `transacciones_registrado_por_id_fkey` FOREIGN KEY (`registrado_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transacciones` ADD CONSTRAINT `transacciones_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `utilidades` ADD CONSTRAINT `utilidades_calculado_por_id_fkey` FOREIGN KEY (`calculado_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `utilidades` ADD CONSTRAINT `utilidades_distribuido_por_id_fkey` FOREIGN KEY (`distribuido_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `utilidades_detalle` ADD CONSTRAINT `utilidades_detalle_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `utilidades_detalle` ADD CONSTRAINT `utilidades_detalle_utilidad_id_fkey` FOREIGN KEY (`utilidad_id`) REFERENCES `utilidades`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comprobantes` ADD CONSTRAINT `comprobantes_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comprobantes` ADD CONSTRAINT `comprobantes_generado_por_id_fkey` FOREIGN KEY (`generado_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comprobantes` ADD CONSTRAINT `comprobantes_pago_id_fkey` FOREIGN KEY (`pago_id`) REFERENCES `pagos`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comprobantes` ADD CONSTRAINT `comprobantes_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comprobantes` ADD CONSTRAINT `comprobantes_transaccion_id_fkey` FOREIGN KEY (`transaccion_id`) REFERENCES `transacciones`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `configuraciones` ADD CONSTRAINT `configuraciones_modificado_por_id_fkey` FOREIGN KEY (`modificado_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_creada_por_id_fkey` FOREIGN KEY (`creada_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socios`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `socios`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `sesiones` ADD CONSTRAINT `sesiones_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socios`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dashboard_metricas` ADD CONSTRAINT `dashboard_metricas_calculado_por_id_fkey` FOREIGN KEY (`calculado_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cambios_documento` ADD CONSTRAINT `cambios_documento_aprobado_por_id_fkey` FOREIGN KEY (`aprobado_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cambios_documento` ADD CONSTRAINT `cambios_documento_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socios`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cambios_documento` ADD CONSTRAINT `cambios_documento_solicitado_por_id_fkey` FOREIGN KEY (`solicitado_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `gastos_operativos` ADD CONSTRAINT `gastos_operativos_registrado_por_id_fkey` FOREIGN KEY (`registrado_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `fondo_seguro` ADD CONSTRAINT `fondo_seguro_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `fondo_seguro` ADD CONSTRAINT `fondo_seguro_credito_id_fkey` FOREIGN KEY (`credito_id`) REFERENCES `creditos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `fondo_seguro` ADD CONSTRAINT `fondo_seguro_registrado_por_id_fkey` FOREIGN KEY (`registrado_por_id`) REFERENCES `socios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
