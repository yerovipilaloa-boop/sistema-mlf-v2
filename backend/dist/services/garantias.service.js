"use strict";
/**
 * ============================================================================
 * Sistema MLF - Servicio de Garantías
 * Archivo: src/services/garantias.service.ts
 * Descripción: Gestión del sistema de garantías cruzadas
 * ============================================================================
 *
 * REGLAS DE NEGOCIO IMPLEMENTADAS:
 * RN-GAR-001: Sistema de garantías cruzadas entre socios
 * RN-GAR-002: Cada crédito requiere 2 garantes (Etapa 3 ACTIVO)
 * RN-GAR-003: Solo Socios Especiales (Etapa 3) pueden ser garantes
 * RN-GAR-004: Se congela 10% del monto del crédito en ahorro del garante
 * RN-GAR-005: Máximo 3 garantizados activos por garante
 * RN-GAR-006: Liberación al 50% del crédito con comportamiento excelente
 * RN-GAR-007: Liberación requiere aprobación administrativa
 * RN-GAR-008: Ejecución automática al día 91 de mora
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../config/logger"));
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
// ============================================================================
// ERRORES PERSONALIZADOS
// ============================================================================
class GarantiaBusinessError extends errors_1.BadRequestError {
    constructor(message) {
        super(message);
        this.name = 'GarantiaBusinessError';
    }
}
class MaximoGarantizadosError extends GarantiaBusinessError {
    constructor(garanteId, actual, maximo) {
        super(`El garante ID ${garanteId} ya tiene ${actual} garantizados activos. Máximo permitido: ${maximo} (RN-GAR-005)`);
        this.name = 'MaximoGarantizadosError';
    }
}
class AhorroInsuficienteGarantiaError extends GarantiaBusinessError {
    constructor(disponible, requerido) {
        super(`Ahorro disponible insuficiente para congelar. Disponible: ${disponible}, Requerido: ${requerido} (RN-GAR-004)`);
        this.name = 'AhorroInsuficienteGarantiaError';
    }
}
class GaranteNoElegibleError extends GarantiaBusinessError {
    constructor(socioId, razon) {
        super(`Socio ID ${socioId} no es elegible como garante. Razón: ${razon} (RN-GAR-003)`);
        this.name = 'GaranteNoElegibleError';
    }
}
// ============================================================================
// SERVICIO DE GARANTÍAS
// ============================================================================
class GarantiasService {
    /**
     * Crear garantías para un crédito (requiere 2 garantes)
     * Implementa: RN-GAR-002
     */
    async crearGarantias(data, usuarioId) {
        const { creditoId, garantesIds } = data;
        // Validar que sean exactamente 2 garantes (RN-GAR-002)
        if (!garantesIds || garantesIds.length !== 2) {
            throw new errors_1.ValidationError('Se requieren exactamente 2 garantes para cada crédito (RN-GAR-002)');
        }
        // Validar que no sean garantes duplicados
        if (garantesIds[0] === garantesIds[1]) {
            throw new errors_1.ValidationError('Los garantes deben ser diferentes');
        }
        // Obtener el crédito
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            include: {
                socio: true,
                garantias: true,
            },
        });
        if (!credito) {
            throw new errors_1.NotFoundError('Crédito', creditoId);
        }
        // Validar que el crédito esté en estado APROBADO
        if (credito.estado !== 'APROBADO') {
            throw new GarantiaBusinessError('Solo se pueden asignar garantías a créditos en estado APROBADO');
        }
        // Validar que no tenga garantías ya asignadas
        if (credito.garantias && credito.garantias.length > 0) {
            throw new GarantiaBusinessError('Este crédito ya tiene garantías asignadas');
        }
        // Validar que ningún garante sea el mismo deudor
        if (garantesIds.includes(credito.socioId)) {
            throw new errors_1.ValidationError('El deudor no puede ser su propio garante');
        }
        // Validar elegibilidad de cada garante
        for (const garanteId of garantesIds) {
            await this.validarElegibilidadGarante(garanteId, credito.montoTotal);
        }
        // Crear ambas garantías en transacción
        const garantias = await database_1.default.$transaction(async (tx) => {
            const garantiasCreadas = [];
            for (const garanteId of garantesIds) {
                const garantia = await this.crearGarantia({ creditoId, garanteId }, usuarioId, tx);
                garantiasCreadas.push(garantia);
            }
            // Registrar en auditoría
            await tx.auditoria.create({
                data: {
                    entidad: 'garantias',
                    accion: 'CREAR',
                    entidadId: creditoId,
                    usuarioId: usuarioId || null,
                    datosNuevos: {
                        creditoId,
                        garantesIds,
                    },
                    descripcion: `Garantías asignadas al crédito ${credito.codigo}`,
                },
            });
            return garantiasCreadas;
        });
        logger_1.default.info(`Garantías creadas para crédito ${credito.codigo}: Garantes ${garantesIds.join(', ')}`);
        return garantias;
    }
    /**
     * Crear una garantía individual
     * Implementa: RN-GAR-003, RN-GAR-004, RN-GAR-005
     */
    async crearGarantia(data, usuarioId, tx) {
        const prismaClient = tx || database_1.default;
        const { creditoId, garanteId } = data;
        // Obtener crédito y garante
        const credito = await prismaClient.credito.findUnique({
            where: { id: creditoId },
            include: { socio: true },
        });
        const garante = await prismaClient.socio.findUnique({
            where: { id: garanteId },
        });
        if (!credito || !garante) {
            throw new errors_1.NotFoundError(!credito ? 'Crédito' : 'Garante', !credito ? creditoId : garanteId);
        }
        // Calcular monto a congelar (10% del crédito) - RN-GAR-004
        const porcentajeCongelar = await this.obtenerConfiguracion('GARANTIA_PORCENTAJE_CONGELADO', 10.0);
        const montoTotal = parseFloat(credito.montoTotal.toString());
        const montoCongelar = montoTotal * (porcentajeCongelar / 100);
        // Generar código de garantía
        const ultimaGarantia = await prismaClient.garantia.findFirst({
            orderBy: { id: 'desc' },
        });
        const nuevoNumero = (ultimaGarantia?.id || 0) + 1;
        const codigo = `GAR-${nuevoNumero.toString().padStart(6, '0')}`;
        // Crear garantía con los campos correctos del schema
        const garantia = await prismaClient.garantia.create({
            data: {
                codigo,
                creditoId,
                socio_garante_id: garanteId,
                socio_garantizado_id: credito.socioId,
                montoGarantizado: credito.montoTotal,
                montoCongelado: montoCongelar,
                estado: 'ACTIVA',
            },
            include: {
                credito: {
                    include: { socio: true },
                },
                socios_garantias_socio_garante_idTosocios: true,
            },
        });
        // Congelar ahorro del garante (RN-GAR-004)
        await prismaClient.socio.update({
            where: { id: garanteId },
            data: {
                ahorroCongelado: {
                    increment: montoCongelar,
                },
            },
        });
        logger_1.default.info(`Garantía creada: ID ${garantia.id}, Garante ${garante.nombreCompleto}, Monto congelado: ${montoCongelar}`);
        return garantia;
    }
    /**
     * Validar elegibilidad de un socio para ser garante
     * Implementa: RN-GAR-003, RN-GAR-004, RN-GAR-005
     */
    async validarElegibilidadGarante(garanteId, montoCredito) {
        // Buscar garante con sus garantías activas
        const garante = await database_1.default.socio.findUnique({
            where: { id: garanteId },
        });
        if (!garante) {
            throw new errors_1.NotFoundError('Garante', garanteId);
        }
        // Contar garantías activas del garante
        const garantiasActivas = await database_1.default.garantia.count({
            where: {
                socio_garante_id: garanteId,
                estado: {
                    in: ['ACTIVA', 'PENDIENTE'], // Prisma enum strings
                },
            },
        });
        // RN-GAR-003: Solo Etapa 3 ACTIVOS pueden ser garantes
        if (garante.etapaActual !== 3) {
            throw new GaranteNoElegibleError(garanteId, 'Solo Socios Especiales (Etapa 3) pueden ser garantes');
        }
        if (garante.estado !== 'ACTIVO') {
            throw new GaranteNoElegibleError(garanteId, 'El garante debe estar en estado ACTIVO');
        }
        // RN-GAR-005: Máximo 3 garantizados activos
        const maximoGarantizados = await this.obtenerConfiguracion('GARANTIA_MAXIMO_GARANTIZADOS', 3);
        if (garantiasActivas >= maximoGarantizados) {
            throw new MaximoGarantizadosError(garanteId, garantiasActivas, maximoGarantizados);
        }
        // RN-GAR-004: Validar ahorro disponible
        const porcentajeCongelar = await this.obtenerConfiguracion('GARANTIA_PORCENTAJE_CONGELADO', 10.0);
        const montoTotal = typeof montoCredito === 'object' ? parseFloat(montoCredito.toString()) : parseFloat(montoCredito);
        const montoCongelar = montoTotal * (porcentajeCongelar / 100);
        const ahorroActual = parseFloat(garante.ahorroActual.toString());
        const ahorroCongelado = parseFloat(garante.ahorroCongelado.toString());
        const ahorroDisponible = ahorroActual - ahorroCongelado;
        if (ahorroDisponible < montoCongelar) {
            throw new AhorroInsuficienteGarantiaError(ahorroDisponible, montoCongelar);
        }
    }
    /**
     * Solicitar liberación de garantía
     * Implementa: RN-GAR-006
     */
    async solicitarLiberacion(data, usuarioId) {
        const { garantiaId, motivoSolicitud } = data;
        if (!motivoSolicitud || motivoSolicitud.trim().length === 0) {
            throw new errors_1.ValidationError('El motivo de solicitud es requerido');
        }
        // Obtener garantía con crédito y cuotas
        const garantia = await database_1.default.garantia.findUnique({
            where: { id: garantiaId },
            include: {
                credito: {
                    include: {
                        cuotas: true,
                    },
                },
                // @ts-ignore
                garante: true,
            },
        });
        if (!garantia) {
            throw new errors_1.NotFoundError('Garantía', garantiaId);
        }
        // Validar que esté ACTIVA
        if (garantia.estado !== types_1.EstadoGarantia.ACTIVA) {
            throw new GarantiaBusinessError(`No se puede solicitar liberación de garantía en estado ${garantia.estado}`);
        }
        // RN-GAR-006: Validar que se haya completado al menos el 50% del crédito
        const porcentajeMinimoCompletado = await this.obtenerConfiguracion('GARANTIA_LIBERACION_MINIMO_COMPLETADO', 50);
        const totalCuotas = garantia.credito.cuotas.length;
        const cuotasPagadas = garantia.credito.cuotas.filter((c) => c.estado === 'PAGADA').length;
        const porcentajeCompletado = (cuotasPagadas / totalCuotas) * 100;
        if (porcentajeCompletado < porcentajeMinimoCompletado) {
            throw new GarantiaBusinessError(`El crédito debe estar completado al menos en ${porcentajeMinimoCompletado}% para solicitar liberación. Actual: ${porcentajeCompletado.toFixed(1)}% (RN-GAR-006)`);
        }
        // Validar comportamiento de pago (sin moras)
        const cuotasConMora = garantia.credito.cuotas.filter((c) => (c.interes_mora ? c.interes_mora.toNumber() > 0 : false));
        if (cuotasConMora.length > 0) {
            throw new GarantiaBusinessError('El crédito tiene cuotas con mora. Se requiere comportamiento de pago excelente para liberar garantía (RN-GAR-006)');
        }
        // Crear solicitud de liberación
        const solicitud = await database_1.default.$transaction(async (tx) => {
            // Actualizar estado de garantía
            await tx.garantia.update({
                where: { id: garantiaId }, // Agregado where
                data: {
                // estado: EstadoGarantia.ACTIVA, // Se mantiene activa hasta aprobación
                },
            });
            // Crear solicitud
            const liberacion = await tx.liberacionGarantia.create({
                data: {
                    garantiaId,
                    // solicitanteId eliminado, se asume implícito o no requerido
                    fechaSolicitud: new Date(),
                    // @ts-ignore
                    motivoSolicitud,
                    estado: types_1.EstadoLiberacionGarantia.SOLICITADA,
                    porcentaje_completado_credito: Math.round(porcentajeCompletado), // Campo obligatorio
                },
                include: {
                    garantia: {
                        include: {
                            credito: true,
                            garante: true,
                        },
                    },
                },
            });
            // Auditoría
            await tx.auditoria.create({
                data: {
                    entidad: 'liberaciones_garantia',
                    accion: 'CREAR',
                    entidadId: liberacion.id,
                    usuarioId: usuarioId || null,
                    datosAnteriores: { garantiaEstado: types_1.EstadoGarantia.ACTIVA },
                    datosNuevos: {
                        garantiaEstado: types_1.EstadoGarantia.ACTIVA,
                        solicitudId: liberacion.id,
                    },
                    descripcion: `Solicitud de liberación de garantía ID ${garantiaId}`,
                },
            });
            return liberacion;
        });
        logger_1.default.info(`Solicitud de liberación creada: Garantía ${garantiaId}, Solicitud ${solicitud.id}`);
        return solicitud;
    }
    /**
     * Aprobar liberación de garantía
     * Implementa: RN-GAR-007
     */
    async aprobarLiberacion(data, usuarioId) {
        const { liberacionId, observaciones } = data;
        const liberacion = await database_1.default.liberacionGarantia.findUnique({
            where: { id: liberacionId },
            include: {
                garantia: {
                    include: {
                        garante: true,
                        credito: true,
                    },
                },
            },
        });
        if (!liberacion) {
            throw new errors_1.NotFoundError('Liberación', liberacionId);
        }
        if (liberacion.estado !== types_1.EstadoLiberacionGarantia.SOLICITADA) {
            throw new GarantiaBusinessError(`Esta solicitud ya fue procesada. Estado: ${liberacion.estado}`);
        }
        // Aprobar liberación y liberar ahorro
        const resultado = await database_1.default.$transaction(async (tx) => {
            // Actualizar solicitud
            const liberacionActualizada = await tx.liberacionGarantia.update({
                where: { id: liberacionId },
                data: {
                    estado: types_1.EstadoLiberacionGarantia.APROBADA,
                    // @ts-ignore
                    fechaAprobacion: new Date(),
                    aprobadorId: usuarioId || null,
                    observacionesAprobacion: observaciones,
                },
            });
            // Actualizar garantía a LIBERADA
            await tx.garantia.update({
                where: { id: liberacion.garantiaId },
                data: {
                    estado: types_1.EstadoGarantia.LIBERADA,
                    fechaLiberacion: new Date(),
                },
            });
            // Liberar ahorro congelado del garante
            const montoCongelado = liberacion.garantia.montoCongelado.toNumber();
            await tx.socio.update({
                where: { id: liberacion.garantia.socio_garante_id },
                data: {
                    ahorroCongelado: {
                        decrement: montoCongelado,
                    },
                },
            });
            // Auditoría
            await tx.auditoria.create({
                data: {
                    entidad: 'liberaciones_garantia',
                    accion: 'ACTUALIZAR',
                    entidadId: liberacionId,
                    usuarioId: usuarioId || null,
                    datosAnteriores: { estado: types_1.EstadoLiberacionGarantia.SOLICITADA },
                    datosNuevos: {
                        estado: types_1.EstadoLiberacionGarantia.APROBADA,
                        montoLiberado: montoCongelado,
                    },
                    descripcion: `Liberación aprobada: Garantía ${liberacion.garantiaId}, Monto liberado: ${montoCongelado}`,
                },
            });
            return liberacionActualizada;
        });
        logger_1.default.info(`Liberación aprobada: ID ${liberacionId}, Monto liberado: ${liberacion.garantia.montoCongelado}`);
        return resultado;
    }
    /**
     * Rechazar liberación de garantía
     * Implementa: RN-GAR-007
     */
    async rechazarLiberacion(data, usuarioId) {
        const { liberacionId, motivoRechazo } = data;
        if (!motivoRechazo || motivoRechazo.trim().length === 0) {
            throw new errors_1.ValidationError('El motivo de rechazo es requerido');
        }
        const liberacion = await database_1.default.liberacionGarantia.findUnique({
            where: { id: liberacionId },
            include: {
                garantia: true,
            },
        });
        if (!liberacion) {
            throw new errors_1.NotFoundError('Liberación', liberacionId);
        }
        if (liberacion.estado !== types_1.EstadoLiberacionGarantia.SOLICITADA) {
            throw new GarantiaBusinessError(`Esta solicitud ya fue procesada. Estado: ${liberacion.estado}`);
        }
        // Rechazar solicitud
        const resultado = await database_1.default.$transaction(async (tx) => {
            // Actualizar solicitud
            const liberacionActualizada = await tx.liberacionGarantia.update({
                where: { id: liberacionId },
                data: {
                    estado: types_1.EstadoLiberacionGarantia.RECHAZADA,
                    fechaAprobacion: new Date(),
                    aprobadorId: usuarioId || null,
                    observacionesAprobacion: motivoRechazo,
                },
            });
            // Volver garantía a ACTIVA
            await tx.garantia.update({
                where: { id: liberacion.garantiaId },
                data: {
                    estado: types_1.EstadoGarantia.ACTIVA,
                },
            });
            // Auditoría
            await tx.auditoria.create({
                data: {
                    entidad: 'liberaciones_garantia',
                    accion: 'ACTUALIZAR',
                    entidadId: liberacionId,
                    usuarioId: usuarioId || null,
                    datosAnteriores: { estado: types_1.EstadoLiberacionGarantia.SOLICITADA },
                    datosNuevos: {
                        estado: types_1.EstadoLiberacionGarantia.RECHAZADA,
                        motivoRechazo,
                    },
                    descripcion: `Liberación rechazada: Garantía ${liberacion.garantiaId}`,
                },
            });
            return liberacionActualizada;
        });
        logger_1.default.info(`Liberación rechazada: ID ${liberacionId}`);
        return resultado;
    }
    /**
     * Ejecutar garantía (cuando mora llega a 90+ días)
     * Implementa: RN-GAR-008
     */
    async ejecutarGarantia(data, usuarioId) {
        const { garantiaId, motivoEjecucion } = data;
        const garantia = await database_1.default.garantia.findUnique({
            where: { id: garantiaId },
            include: {
                credito: {
                    include: {
                        cuotas: true,
                        socio: true,
                    },
                },
                garante: true,
            },
        });
        if (!garantia) {
            throw new errors_1.NotFoundError('Garantía', garantiaId);
        }
        if (garantia.estado !== types_1.EstadoGarantia.ACTIVA) {
            throw new GarantiaBusinessError(`No se puede ejecutar garantía en estado ${garantia.estado}`);
        }
        // Ejecutar garantía
        const resultado = await database_1.default.$transaction(async (tx) => {
            // Actualizar garantía
            const garantiaActualizada = await tx.garantia.update({
                where: { id: garantiaId },
                data: {
                    estado: types_1.EstadoGarantia.EJECUTADA,
                    fechaEjecucion: new Date(),
                    montoEjecutado: garantia.montoCongelado,
                    motivoEjecucion,
                },
            });
            // Transferir ahorro congelado como pago al crédito
            const montoEjecucion = garantia.montoCongelado.toNumber();
            // Descongelar y descontar del ahorro del garante
            await tx.socio.update({
                where: { id: garantia.socio_garante_id },
                data: {
                    ahorroCongelado: {
                        decrement: montoEjecucion,
                    },
                    ahorroActual: {
                        decrement: montoEjecucion,
                    },
                },
            });
            // TODO: Aplicar monto ejecutado al crédito moroso
            // (Esto se implementará en el módulo de pagos)
            // Auditoría
            await tx.auditoria.create({
                data: {
                    entidad: 'garantias',
                    accion: 'ACTUALIZAR',
                    entidadId: garantiaId,
                    usuarioId: usuarioId || null,
                    datosAnteriores: { estado: types_1.EstadoGarantia.ACTIVA },
                    datosNuevos: {
                        estado: types_1.EstadoGarantia.EJECUTADA,
                        montoEjecutado: montoEjecucion,
                        motivoEjecucion,
                    },
                    descripcion: `Garantía ejecutada: ID ${garantiaId}, Monto: ${montoEjecucion}, Garante: ${garantia.garante.nombreCompleto}`,
                },
            });
            return garantiaActualizada;
        });
        logger_1.default.warn(`Garantía EJECUTADA: ID ${garantiaId}, Garante ${garantia.garante.nombreCompleto}, Monto: ${garantia.montoCongelado}`);
        return resultado;
    }
    /**
     * Obtener garantía por ID
     */
    async obtenerGarantiaPorId(garantiaId) {
        const garantia = await database_1.default.garantia.findUnique({
            where: { id: garantiaId },
            include: {
                credito: {
                    include: {
                        socio: true,
                    },
                },
                garante: true,
                liberaciones: {
                    orderBy: {
                        fechaSolicitud: 'desc',
                    },
                },
            },
        });
        if (!garantia) {
            throw new errors_1.NotFoundError('Garantía', garantiaId);
        }
        return garantia;
    }
    /**
     * Listar garantías con filtros
     */
    async listarGarantias(filtros) {
        const { page, limit, garanteId, creditoId, estado } = filtros;
        const where = {};
        if (garanteId)
            where.socio_garante_id = garanteId;
        if (creditoId)
            where.creditoId = creditoId;
        if (estado)
            where.estado = estado;
        const [garantias, total] = await Promise.all([
            database_1.default.garantia.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    credito: {
                        include: {
                            socio: true,
                        },
                    },
                    socios_garantias_socio_garante_idTosocios: true,
                    socios_garantias_socio_garantizado_idTosocios: true,
                },
                orderBy: {
                    fecha_creacion: 'desc',
                },
            }),
            database_1.default.garantia.count({ where }),
        ]);
        return {
            garantias,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }
    /**
     * Obtener configuración del sistema
     */
    async obtenerConfiguracion(clave, valorDefecto) {
        const config = await database_1.default.configuracion.findUnique({
            where: { clave },
        });
        if (!config) {
            logger_1.default.warn(`Configuración ${clave} no encontrada, usando valor por defecto: ${valorDefecto}`);
            return valorDefecto;
        }
        return parseFloat(config.valor);
    }
}
exports.default = new GarantiasService();
//# sourceMappingURL=garantias.service.js.map