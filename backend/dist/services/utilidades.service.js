"use strict";
/**
 * ============================================================================
 * Sistema MLF - Servicio de Utilidades
 * Archivo: src/services/utilidades.service.ts
 * Descripción: Cálculo y distribución semestral de utilidades
 * ============================================================================
 *
 * REGLAS DE NEGOCIO IMPLEMENTADAS:
 * RN-UTI-001: Distribución semestral de utilidades (Enero-Junio / Julio-Diciembre)
 * RN-UTI-002: Cálculo: 1% sobre ahorro promedio del semestre
 * RN-UTI-003: Solo socios ACTIVOS participan de la distribución
 * RN-UTI-004: Utilidades se acreditan automáticamente al ahorro
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
class UtilidadesBusinessError extends errors_1.BusinessRuleError {
    constructor(message) {
        super(message);
        this.name = 'UtilidadesBusinessError';
    }
}
// ============================================================================
// SERVICIO DE UTILIDADES
// ============================================================================
class UtilidadesService {
    /**
     * Calcular utilidades para un período semestral
     * Implementa: RN-UTI-001, RN-UTI-002, RN-UTI-003
     */
    async calcularUtilidades(data, usuarioId) {
        const { año, semestre } = data;
        // Validaciones
        this.validarPeriodo(año, semestre);
        // Verificar que no exista cálculo previo para este período
        const existente = await database_1.default.utilidad.findUnique({
            where: {
                a_o_semestre: {
                    a_o: año,
                    semestre,
                },
            },
        });
        if (existente) {
            throw new UtilidadesBusinessError(`Ya existe un cálculo de utilidades para ${año}-S${semestre}. ID: ${existente.id}`);
        }
        // Obtener fechas del período
        const { fechaInicio, fechaFin } = this.obtenerFechasPeriodo(año, semestre);
        logger_1.default.info(`Calculando utilidades ${año}-S${semestre}: ${fechaInicio.toISOString()} a ${fechaFin.toISOString()}`);
        // Obtener socios ACTIVOS al final del período
        const sociosActivos = await database_1.default.socio.findMany({
            where: {
                estado: types_1.EstadoSocio.ACTIVO,
                // Creados antes del fin del período
                createdAt: {
                    lte: fechaFin,
                },
            },
            include: {
                transacciones: {
                    where: {
                        tipo: {
                            in: [types_1.TipoTransaccion.DEPOSITO_AHORRO, types_1.TipoTransaccion.RETIRO_AHORRO],
                        },
                        // estado: 'COMPLETADA', // Eliminado, no existe en el esquema
                        fechaTransaccion: {
                            gte: fechaInicio,
                            lte: fechaFin,
                        },
                    },
                    orderBy: {
                        fechaTransaccion: 'asc',
                    },
                },
            },
        });
        if (sociosActivos.length === 0) {
            throw new UtilidadesBusinessError('No hay socios activos en el período para calcular utilidades');
        }
        // Calcular ahorro promedio y utilidad para cada socio
        const detalles = [];
        let totalAhorrosPromedio = 0;
        let totalUtilidades = 0;
        const porcentajeUtilidad = await this.obtenerConfiguracion('UTILIDADES_PORCENTAJE', 1.0);
        for (const socio of sociosActivos) {
            const ahorroPromedio = await this.calcularAhorroPromedioSemestre(socio, fechaInicio, fechaFin);
            if (ahorroPromedio > 0) {
                const montoUtilidad = ahorroPromedio * (porcentajeUtilidad / 100);
                detalles.push({
                    socioId: socio.id,
                    nombreCompleto: socio.nombreCompleto,
                    ahorroPromedioSemestre: ahorroPromedio,
                    montoUtilidad,
                    etapa: socio.etapaActual,
                });
                totalAhorrosPromedio += ahorroPromedio;
                totalUtilidades += montoUtilidad;
            }
        }
        // Crear registro de utilidades en transacción
        const utilidad = await database_1.default.$transaction(async (tx) => {
            // Crear cabecera de utilidades
            const codigo = this.generarCodigoUtilidad(año, semestre);
            const utilidadCreada = await tx.utilidad.create({
                data: {
                    codigo,
                    a_o: año,
                    semestre,
                    total_socios_activos: detalles.length,
                    total_ahorros_promedio: totalAhorrosPromedio,
                    total_utilidades_distribuidas: totalUtilidades,
                    estado: 'CALCULADA',
                    calculadoPorId: usuarioId || null,
                    fechaCalculo: new Date(),
                },
            });
            // Crear detalles por socio
            for (const detalle of detalles) {
                await tx.utilidadDetalle.create({
                    data: {
                        utilidadId: utilidadCreada.id,
                        socioId: detalle.socioId,
                        ahorro_promedio_semestre: detalle.ahorroPromedioSemestre,
                        porcentaje_utilidad: porcentajeUtilidad,
                        montoUtilidad: detalle.montoUtilidad,
                        estado_socio_momento: types_1.EstadoSocio.ACTIVO,
                        etapa_socio_momento: detalle.etapa,
                        acreditada: false,
                    },
                });
            }
            // Auditoría
            await tx.auditoria.create({
                data: {
                    entidad: 'utilidades',
                    accion: 'CREATE',
                    entidadId: utilidadCreada.id,
                    usuarioId: usuarioId || null,
                    datosNuevos: {
                        codigo,
                        periodo: `${año}-S${semestre}`,
                        totalSocios: detalles.length,
                        totalUtilidades,
                    },
                    descripcion: `Utilidades calculadas: ${codigo} - ${detalles.length} socios - $${totalUtilidades.toFixed(2)}`,
                },
            });
            return utilidadCreada;
        });
        logger_1.default.info(`Utilidades calculadas: ${utilidad.codigo} - ${detalles.length} socios - $${totalUtilidades.toFixed(2)}`);
        return {
            codigo: utilidad.codigo,
            periodo: `${año}-S${semestre}`,
            totalSocios: detalles.length,
            totalAhorrosPromedio,
            totalUtilidades,
            estado: 'CALCULADA',
            detalles,
        };
    }
    /**
     * Distribuir (acreditar) utilidades calculadas a los ahorros de socios
     * Implementa: RN-UTI-004
     */
    async distribuirUtilidades(data, usuarioId) {
        const { utilidadId } = data;
        // Obtener utilidad con detalles
        const utilidad = await database_1.default.utilidad.findUnique({
            where: { id: utilidadId },
            include: {
                detalles: {
                    include: {
                        socios: true,
                    },
                },
            },
        });
        if (!utilidad) {
            throw new errors_1.NotFoundError('Utilidad', utilidadId);
        }
        if (utilidad.estado === 'COMPLETADA') {
            throw new UtilidadesBusinessError('Esta distribución de utilidades ya fue completada');
        }
        if (utilidad.detalles.length === 0) {
            throw new UtilidadesBusinessError('No hay detalles de utilidades para distribuir');
        }
        // Distribuir utilidades en transacción
        const resultado = await database_1.default.$transaction(async (tx) => {
            let acreditados = 0;
            let montoTotalAcreditado = 0;
            for (const detalle of utilidad.detalles) {
                // Solo acreditar si no fue acreditado previamente
                if (!detalle.acreditada) {
                    // Acreditar al ahorro del socio
                    await tx.socio.update({
                        where: { id: detalle.socioId },
                        data: {
                            ahorroActual: {
                                increment: detalle.montoUtilidad,
                            },
                        },
                    });
                    // Registrar transacción
                    const codigoTransaccion = await this.generarCodigoTransaccion(detalle.socioId, tx);
                    await tx.transaccion.create({
                        data: {
                            codigo: codigoTransaccion,
                            tipo: types_1.TipoTransaccion.UTILIDAD,
                            socio: { connect: { id: detalle.socioId } }, // Corregido: usar connect
                            monto: detalle.montoUtilidad,
                            metodo: 'AUTOMATICO', // Corregido metodoPago -> metodo
                            concepto: `Utilidades ${utilidad.codigo} - 1% sobre ahorro promedio`,
                            // estado: 'COMPLETADA', // Eliminado
                            fechaTransaccion: new Date(),
                        },
                    });
                    // Marcar como acreditada
                    await tx.utilidadDetalle.update({
                        where: { id: detalle.id },
                        data: {
                            acreditada: true,
                            fechaAcreditacion: new Date(),
                        },
                    });
                    acreditados++;
                    montoTotalAcreditado += detalle.montoUtilidad.toNumber();
                }
            }
            // Actualizar estado de utilidad a COMPLETADA
            await tx.utilidad.update({
                where: { id: utilidadId },
                data: {
                    estado: 'COMPLETADA',
                    distribuidoPorId: usuarioId || null,
                },
            });
            // Auditoría
            await tx.auditoria.create({
                data: {
                    entidad: 'utilidades',
                    accion: 'UPDATE',
                    entidadId: utilidadId,
                    usuarioId: usuarioId || null,
                    datosAnteriores: { estado: utilidad.estado },
                    datosNuevos: {
                        estado: 'COMPLETADA',
                        acreditados,
                        montoTotal: montoTotalAcreditado,
                    },
                    descripcion: `Utilidades distribuidas: ${utilidad.codigo} - ${acreditados} socios - $${montoTotalAcreditado.toFixed(2)}`,
                },
            });
            return {
                utilidadId,
                codigo: utilidad.codigo,
                acreditados,
                montoTotalAcreditado,
            };
        });
        logger_1.default.info(`Utilidades distribuidas: ${utilidad.codigo} - ${resultado.acreditados} socios - $${resultado.montoTotalAcreditado.toFixed(2)}`);
        return resultado;
    }
    /**
     * Calcular ahorro promedio de un socio durante el semestre
     * Promedio del saldo al final de cada mes
     * Implementa: RN-UTI-002
     */
    async calcularAhorroPromedioSemestre(socio, fechaInicio, fechaFin) {
        // Obtener meses del período (6 meses)
        const meses = this.obtenerMesesPeriodo(fechaInicio, fechaFin);
        let sumaSaldos = 0;
        // Para cada mes, calcular el saldo al final
        for (const mes of meses) {
            const saldoFinMes = await this.calcularSaldoAlFinalDeMes(socio, mes.año, mes.mes);
            sumaSaldos += saldoFinMes;
        }
        // Promedio: suma de saldos mensuales / 6 meses
        return sumaSaldos / 6;
    }
    /**
     * Calcular saldo de ahorro al final de un mes específico
     */
    async calcularSaldoAlFinalDeMes(socio, año, mes) {
        // Fecha final del mes
        const ultimoDia = new Date(año, mes, 0); // Día 0 del mes siguiente = último día del mes actual
        ultimoDia.setHours(23, 59, 59, 999);
        // Obtener todas las transacciones hasta el final del mes
        const transacciones = await database_1.default.transaccion.findMany({
            where: {
                socioId: socio.id,
                tipo: {
                    in: [
                        types_1.TipoTransaccion.DEPOSITO_AHORRO,
                        types_1.TipoTransaccion.RETIRO_AHORRO,
                        types_1.TipoTransaccion.DEPOSITO_INICIAL,
                        types_1.TipoTransaccion.UTILIDAD,
                    ],
                },
                // estado: 'COMPLETADA', // Eliminado, campo no existe
                fechaTransaccion: {
                    lte: ultimoDia,
                },
            },
        });
        // Calcular saldo sumando depósitos y restando retiros
        let saldo = 0;
        for (const tx of transacciones) {
            if (tx.tipo === types_1.TipoTransaccion.DEPOSITO_AHORRO ||
                tx.tipo === types_1.TipoTransaccion.DEPOSITO_INICIAL ||
                tx.tipo === types_1.TipoTransaccion.UTILIDAD) {
                saldo += tx.monto.toNumber();
            }
            else if (tx.tipo === types_1.TipoTransaccion.RETIRO_AHORRO) {
                saldo -= tx.monto.toNumber();
            }
        }
        return saldo;
    }
    /**
     * Obtener utilidad por ID
     */
    async obtenerUtilidadPorId(utilidadId) {
        const utilidad = await database_1.default.utilidad.findUnique({
            where: { id: utilidadId },
            include: {
                detalles: {
                    include: {
                        socios: {
                            select: {
                                id: true,
                                codigo: true,
                                nombreCompleto: true,
                                documentoIdentidad: true,
                                etapaActual: true,
                            },
                        },
                    },
                    orderBy: {
                        montoUtilidad: 'desc',
                    },
                },
                socios_utilidades_calculado_por_idTosocios: {
                    select: {
                        id: true,
                        nombreCompleto: true,
                    },
                },
                socios_utilidades_distribuido_por_idTosocios: {
                    select: {
                        id: true,
                        nombreCompleto: true,
                    },
                },
            },
        });
        if (!utilidad) {
            throw new errors_1.NotFoundError('Utilidad', utilidadId);
        }
        return utilidad;
    }
    /**
     * Listar utilidades con filtros
     */
    async listarUtilidades(filtros) {
        const { page, limit, año, semestre, estado } = filtros;
        const where = {};
        if (año)
            where.a_o = año;
        if (semestre)
            where.semestre = semestre;
        if (estado)
            where.estado = estado;
        const [utilidades, total] = await Promise.all([
            database_1.default.utilidad.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    _count: {
                        select: { detalles: true },
                    },
                    socios_utilidades_calculado_por_idTosocios: {
                        select: {
                            nombreCompleto: true,
                        },
                    },
                },
                orderBy: [{ a_o: 'desc' }, { semestre: 'desc' }],
            }),
            database_1.default.utilidad.count({ where }),
        ]);
        return {
            utilidades,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }
    /**
     * Obtener historial de utilidades de un socio
     */
    async obtenerHistorialUtilidades(socioId) {
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
        });
        if (!socio) {
            throw new errors_1.NotFoundError('Socio', socioId);
        }
        const detalles = await database_1.default.utilidadDetalle.findMany({
            where: { socioId },
            include: {
                utilidad: true,
            },
            orderBy: {
                id: 'desc',
            },
        });
        const totalRecibido = detalles.reduce((sum, d) => sum + d.montoUtilidad.toNumber(), 0);
        return {
            socio: {
                id: socio.id,
                codigo: socio.codigo,
                nombreCompleto: socio.nombreCompleto,
            },
            totalPeriodos: detalles.length,
            totalRecibido,
            historial: detalles.map((d) => ({
                periodo: `${d.utilidad.a_o}-S${d.utilidad.semestre}`,
                codigo: d.utilidad.codigo,
                ahorroPromedio: d.ahorro_promedio_semestre,
                montoUtilidad: d.montoUtilidad,
                acreditada: d.acreditada,
                fechaAcreditacion: d.fechaAcreditacion,
            })),
        };
    }
    // ============================================================================
    // MÉTODOS AUXILIARES
    // ============================================================================
    /**
     * Validar período
     */
    validarPeriodo(año, semestre) {
        if (año < 2025) {
            throw new errors_1.ValidationError('El año debe ser 2025 o posterior');
        }
        if (semestre !== 1 && semestre !== 2) {
            throw new errors_1.ValidationError('El semestre debe ser 1 o 2');
        }
        // Validar que no sea un período futuro
        const ahora = new Date();
        const añoActual = ahora.getFullYear();
        const mesActual = ahora.getMonth() + 1;
        const semestreActual = mesActual <= 6 ? 1 : 2;
        if (año > añoActual || (año === añoActual && semestre > semestreActual)) {
            throw new errors_1.ValidationError('No se pueden calcular utilidades para períodos futuros');
        }
    }
    /**
     * Obtener fechas de inicio y fin del período semestral
     */
    obtenerFechasPeriodo(año, semestre) {
        if (semestre === 1) {
            // Enero - Junio
            return {
                fechaInicio: new Date(año, 0, 1, 0, 0, 0, 0), // 1 enero
                fechaFin: new Date(año, 5, 30, 23, 59, 59, 999), // 30 junio
            };
        }
        else {
            // Julio - Diciembre
            return {
                fechaInicio: new Date(año, 6, 1, 0, 0, 0, 0), // 1 julio
                fechaFin: new Date(año, 11, 31, 23, 59, 59, 999), // 31 diciembre
            };
        }
    }
    /**
     * Obtener array de meses del período
     */
    obtenerMesesPeriodo(fechaInicio, fechaFin) {
        const meses = [];
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        while (inicio <= fin) {
            meses.push({
                año: inicio.getFullYear(),
                mes: inicio.getMonth() + 1,
            });
            inicio.setMonth(inicio.getMonth() + 1);
        }
        return meses;
    }
    /**
     * Generar código de utilidad
     */
    generarCodigoUtilidad(año, semestre) {
        return `UTI-${año}-SEM${semestre}`;
    }
    /**
     * Generar código de transacción
     */
    async generarCodigoTransaccion(socioId, tx) {
        const prismaClient = tx || database_1.default;
        const socio = await prismaClient.socio.findUnique({
            where: { id: socioId },
            include: {
                transacciones: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
        });
        if (!socio) {
            throw new errors_1.NotFoundError('Socio', socioId);
        }
        const año = new Date().getFullYear();
        const secuencia = (socio.transacciones.length || 0) + 1;
        return `TRX-${socio.codigo}-${año}-${String(secuencia).padStart(3, '0')}`;
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
exports.default = new UtilidadesService();
//# sourceMappingURL=utilidades.service.js.map