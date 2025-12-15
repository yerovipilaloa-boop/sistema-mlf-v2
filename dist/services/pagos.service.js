"use strict";
/**
 * ============================================================================
 * Sistema MLF - Servicio de Pagos y Morosidad
 * Archivo: src/services/pagos.service.ts
 * Descripción: Gestión de pagos, morosidad y aplicación de abonos
 * ============================================================================
 *
 * REGLAS DE NEGOCIO IMPLEMENTADAS:
 * RN-PAG-001: Distribución de pagos (Mora → Interés → Capital → Prepago)
 * RN-PAG-002: Actualización automática de estado de cuotas
 * RN-MOR-001: Cálculo de mora (1% diario sobre cuota vencida)
 * RN-MOR-002: Clasificación de morosidad (5 niveles)
 * RN-MOR-003: Cambio de tasa al castigar (1.5% → 3%)
 * RN-CRE-003: Bloqueo de nuevos créditos con mora activa
 * RN-GAR-008: Ejecución de garantías al día 91
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../config/logger"));
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
const amortization_service_1 = __importDefault(require("./amortization.service"));
const notificaciones_service_1 = __importStar(require("./notificaciones.service"));
// ============================================================================
// ERRORES PERSONALIZADOS
// ============================================================================
class PagoBusinessError extends errors_1.BusinessRuleError {
    constructor(message) {
        super(message);
        this.name = 'PagoBusinessError';
    }
}
// ============================================================================
// SERVICIO DE PAGOS
// ============================================================================
class PagosService {
    /**
     * Registrar pago a un crédito
     * El pago se distribuye automáticamente entre cuotas vencidas/pendientes
     * Implementa: RN-PAG-001, RN-PAG-002
     */
    async registrarPago(data, usuarioId) {
        const { creditoId, montoPagado, metodoPago, fechaPago = new Date(), } = data;
        // Validaciones
        if (montoPagado <= 0) {
            throw new errors_1.ValidationError('El monto del pago debe ser mayor a 0');
        }
        // Obtener crédito con cuotas
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            include: {
                cuotas: {
                    orderBy: {
                        numeroCuota: 'asc',
                    },
                },
                socio: true,
            },
        });
        if (!credito) {
            throw new errors_1.NotFoundError(`Crédito ${creditoId} no encontrado`);
        }
        // Permitir pagos en créditos DESEMBOLSADO o ACTIVO
        if (credito.estado !== types_1.EstadoCredito.DESEMBOLSADO) {
            throw new PagoBusinessError(`No se pueden registrar pagos a créditos en estado ${credito.estado}`);
        }
        // Actualizar mora en todas las cuotas antes de aplicar pago
        await this.actualizarMoraCredito(creditoId);
        // Distribuir pago entre cuotas
        const resultado = await this.distribuirPago(creditoId, montoPagado, fechaPago, usuarioId);
        // Generar código del pago
        const codigoPago = await this.generarCodigoPago(creditoId);
        // Registrar transacción de pago
        const pago = await database_1.default.$transaction(async (tx) => {
            const pagoCreado = await tx.pago.create({
                data: {
                    codigo: codigoPago,
                    creditoId,
                    socioId: credito.socioId,
                    monto_pago: montoPagado,
                    monto_a_mora: resultado.totalAplicadoMora,
                    monto_a_interes: resultado.totalAplicadoInteres || 0,
                    monto_a_capital: resultado.totalAplicadoCapital || 0,
                    monto_a_cuota_siguiente: resultado.totalSobrante || 0,
                    metodoPago,
                    fechaPago,
                    registrado_por_id: usuarioId || null,
                },
                include: {
                    credito: {
                        include: {
                            socio: true,
                        },
                    },
                },
            });
            return pagoCreado;
        });
        // Verificar si el crédito se completó
        await this.verificarCompletitudCredito(creditoId);
        logger_1.default.info(`Pago registrado: ID ${pago.id}, Crédito ${credito.codigo}, Monto: ${montoPagado}`);
        // Enviar notificación al socio
        const creditoActualizado = await database_1.default.credito.findUnique({ where: { id: creditoId } });
        try {
            // Obtener saldo actualizado para la notificación
            const saldoActualizado = creditoActualizado?.saldo_capital
                ? parseFloat(creditoActualizado.saldo_capital.toString())
                : 0;
            await notificaciones_service_1.default.enviarNotificacion({
                socioId: credito.socioId,
                tipo: notificaciones_service_1.TipoNotificacion.PAGO_REGISTRADO,
                canal: [notificaciones_service_1.CanalNotificacion.IN_APP],
                prioridad: notificaciones_service_1.PrioridadNotificacion.MEDIA,
                datos: {
                    codigoCredito: credito.codigo,
                    monto: montoPagado,
                    codigoPago: pago.codigo,
                    nuevoSaldo: saldoActualizado,
                },
            });
        }
        catch (error) {
            logger_1.default.error(`Error enviando notificación de pago: ${error}`);
        }
        // Obtener el crédito actualizado para saldo_capital
        const creditoFinal = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            select: {
                saldo_capital: true,
                estado: true,
            },
        });
        // Mapear campos snake_case a camelCase para el frontend
        return {
            pago: {
                id: pago.id,
                codigo: pago.codigo,
                creditoId: pago.creditoId,
                socioId: pago.socioId,
                montoPago: parseFloat(pago.monto_pago.toString()),
                montoAMora: parseFloat((pago.monto_a_mora || 0).toString()),
                montoAInteres: parseFloat((pago.monto_a_interes || 0).toString()),
                montoACapital: parseFloat((pago.monto_a_capital || 0).toString()),
                montoACuotaSiguiente: parseFloat((pago.monto_a_cuota_siguiente || 0).toString()),
                metodoPago: pago.metodoPago,
                fechaPago: pago.fechaPago,
                credito: pago.credito ? {
                    codigo: pago.credito.codigo,
                    socio: pago.credito.socio ? {
                        nombreCompleto: pago.credito.socio.nombreCompleto,
                        codigo: pago.credito.socio.codigo,
                    } : null,
                } : null,
            },
            distribucion: resultado,
            creditoActualizado: {
                saldoCapital: creditoFinal?.saldo_capital ? parseFloat(creditoFinal.saldo_capital.toString()) : 0,
                estado: creditoFinal?.estado || 'ACTIVO',
            },
        };
    }
    /**
     * Distribuir pago entre cuotas pendientes y vencidas
     * Implementa: RN-PAG-001 (Mora → Interés → Capital)
     */
    async distribuirPago(creditoId, montoPagado, fechaPago, usuarioId) {
        let montoRestante = montoPagado;
        const cuotasActualizadas = [];
        let totalAplicadoMora = 0;
        let totalAplicadoCuotas = 0;
        let totalAplicadoInteres = 0;
        let totalAplicadoCapital = 0;
        // Obtener cuotas pendientes y vencidas, ordenadas por fecha
        const cuotas = await database_1.default.cuota.findMany({
            where: {
                creditoId,
                estado: {
                    in: [types_1.EstadoCuota.PENDIENTE, types_1.EstadoCuota.VENCIDA, types_1.EstadoCuota.PARCIALMENTE_PAGADA],
                },
            },
            orderBy: {
                numeroCuota: 'asc',
            },
        });
        // Aplicar pago a cada cuota hasta agotar el monto
        for (const cuota of cuotas) {
            if (montoRestante <= 0)
                break;
            const montoACuota = Math.min(montoRestante, this.calcularMontoAdeudadoCuota(cuota));
            if (montoACuota > 0) {
                const cuotaActualizada = await this.aplicarPagoACuota(cuota.id, montoACuota, fechaPago, usuarioId);
                cuotasActualizadas.push({
                    cuotaId: cuota.id,
                    numeroCuota: cuota.numeroCuota,
                    montoAplicado: montoACuota,
                    distribucion: cuotaActualizada.distribucion,
                });
                totalAplicadoMora += cuotaActualizada.distribucion.aplicadoMora;
                totalAplicadoInteres += cuotaActualizada.distribucion.aplicadoInteres;
                totalAplicadoCapital += cuotaActualizada.distribucion.aplicadoCapital;
                totalAplicadoCuotas += montoACuota;
                montoRestante -= montoACuota;
            }
        }
        return {
            totalPagado: montoPagado,
            totalAplicadoCuotas,
            totalAplicadoMora,
            totalAplicadoInteres,
            totalAplicadoCapital,
            totalSobrante: montoRestante,
            cuotasActualizadas,
        };
    }
    /**
     * Aplicar pago a una cuota específica
     * Implementa: RN-PAG-001 (distribución Mora → Interés → Capital)
     */
    async aplicarPagoACuota(cuotaId, montoPagado, fechaPago, _usuarioId) {
        const cuota = await database_1.default.cuota.findUnique({
            where: { id: cuotaId },
        });
        if (!cuota) {
            throw new errors_1.NotFoundError(`Cuota ${cuotaId} no encontrada`);
        }
        // Calcular montos adeudados
        const montoMoraAdeudado = cuota.interes_mora?.toNumber() || 0;
        // const montoCuotaTotal = cuota.montoCuota.toNumber();
        const montoPagadoActual = cuota.montoPagado.toNumber();
        // CORRECCIÓN: Calcular cuánto falta pagar de cada componente
        // El total de la cuota es: mora + interés + capital
        // Si ya se pagó algo, debemos restar lo pagado en orden de prioridad: mora → interés → capital
        const montoInteresOriginal = cuota.monto_interes.toNumber();
        const montoCapitalOriginal = cuota.monto_capital.toNumber();
        // Distribuir lo ya pagado para saber qué falta
        let montoPagadoRestante = montoPagadoActual;
        // 1. Lo pagado primero cubrió la mora (si había)
        const moraPagada = Math.min(montoPagadoRestante, montoMoraAdeudado);
        montoPagadoRestante -= moraPagada;
        const moraAdeudada = montoMoraAdeudado - moraPagada;
        // 2. Lo que sobró cubrió intereses
        const interesPagado = Math.min(montoPagadoRestante, montoInteresOriginal);
        montoPagadoRestante -= interesPagado;
        const interesAdeudado = montoInteresOriginal - interesPagado;
        // 3. Lo que sobró cubrió capital
        const capitalPagado = Math.min(montoPagadoRestante, montoCapitalOriginal);
        const capitalAdeudado = montoCapitalOriginal - capitalPagado;
        // CORRECCIÓN CRÍTICA: Distribuir pago usando los montos ADEUDADOS (no los totales)
        // Usamos moraAdeudada, interesAdeudado, capitalAdeudado (calculados arriba)
        const distribucion = amortization_service_1.default.distribuirPago(montoPagado, moraAdeudada, // Lo que FALTA pagar de mora
        interesAdeudado, // Lo que FALTA pagar de interés
        capitalAdeudado // Lo que FALTA pagar de capital
        );
        // Actualizar cuota
        const cuotaActualizada = await database_1.default.cuota.update({
            where: { id: cuotaId },
            data: {
                montoPagado: {
                    increment: montoPagado,
                },
                fechaPago: fechaPago,
                // Actualizar estado
                estado: this.determinarEstadoCuota(cuota, distribucion, montoPagado),
            },
        });
        // Actualizar saldo del crédito
        await database_1.default.credito.update({
            where: { id: cuota.creditoId },
            data: {
                saldo_capital: {
                    decrement: distribucion.aplicadoCapital,
                },
            },
        });
        return {
            cuota: cuotaActualizada,
            distribucion,
        };
    }
    /**
     * Determinar nuevo estado de cuota después de pago
     * CORREGIDO: Ahora considera tolerancia para evitar problemas de redondeo
     */
    determinarEstadoCuota(cuota, _distribucion, montoPagado) {
        // Tolerancia para problemas de redondeo (1 centavo)
        const TOLERANCIA = 0.01;
        // Calcular nuevo monto pagado total
        const nuevoMontoPagado = cuota.montoPagado.toNumber() + montoPagado;
        // Calcular total adeudado (cuota + mora si existe)
        const montoCuota = cuota.montoCuota.toNumber();
        const moraTotal = cuota.interes_mora?.toNumber() || 0;
        const totalAdeudado = montoCuota + moraTotal;
        // Determinar estado con tolerancia
        if (nuevoMontoPagado >= (totalAdeudado - TOLERANCIA)) {
            // La cuota está completamente pagada (o casi, dentro de la tolerancia)
            return types_1.EstadoCuota.PAGADA;
        }
        else if (nuevoMontoPagado > TOLERANCIA) {
            // La cuota tiene un pago parcial significativo
            return types_1.EstadoCuota.PARCIALMENTE_PAGADA;
        }
        else {
            // La cuota no tiene pagos, mantener estado según vencimiento
            const ahora = new Date();
            const vencida = new Date(cuota.fechaVencimiento) < ahora;
            return vencida ? types_1.EstadoCuota.VENCIDA : types_1.EstadoCuota.PENDIENTE;
        }
    }
    /**
     * Calcular monto total adeudado de una cuota
     */
    calcularMontoAdeudadoCuota(cuota) {
        const totalCuota = cuota.montoCuota.toNumber() + (cuota.interes_mora?.toNumber() || 0);
        const pagado = cuota.montoPagado.toNumber();
        return totalCuota - pagado;
    }
    /**
     * Actualizar mora de todas las cuotas vencidas de un crédito
     * Implementa: RN-MOR-001, RN-MOR-002
     */
    async actualizarMoraCredito(creditoId) {
        const ahora = new Date();
        // Obtener cuotas vencidas no pagadas
        const cuotasVencidas = await database_1.default.cuota.findMany({
            where: {
                creditoId,
                estado: {
                    in: [types_1.EstadoCuota.VENCIDA, types_1.EstadoCuota.PARCIALMENTE_PAGADA],
                },
                fechaVencimiento: {
                    lt: ahora,
                },
            },
        });
        for (const cuota of cuotasVencidas) {
            await this.actualizarMoraCuota(cuota.id);
        }
        // Actualizar estado de cuotas pendientes que se vencieron
        const cuotasRecienVencidas = await database_1.default.cuota.findMany({
            where: {
                creditoId,
                estado: types_1.EstadoCuota.PENDIENTE,
                fechaVencimiento: {
                    lt: ahora,
                },
            },
        });
        // Cambiar estado a VENCIDA
        for (const cuota of cuotasRecienVencidas) {
            await database_1.default.cuota.update({
                where: { id: cuota.id },
                data: { estado: types_1.EstadoCuota.VENCIDA },
            });
            // Calcular mora para cuotas recién vencidas
            await this.actualizarMoraCuota(cuota.id);
        }
        // Actualizar registro de mora del socio
        await this.actualizarRegistroMoraSocio(creditoId);
    }
    /**
     * Actualizar mora de una cuota específica
     * Implementa: RN-MOR-001 (1% diario sobre saldo adeudado)
     */
    async actualizarMoraCuota(cuotaId) {
        const cuota = await database_1.default.cuota.findUnique({
            where: { id: cuotaId },
            include: {
                credito: true,
            },
        });
        if (!cuota)
            return;
        const ahora = new Date();
        const fechaVencimiento = new Date(cuota.fechaVencimiento);
        // Solo calcular mora si está vencida
        if (fechaVencimiento >= ahora)
            return;
        // Calcular días de mora
        const diasMora = Math.floor((ahora.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));
        if (diasMora <= 0)
            return;
        // Obtener tasa de mora (1% diario)
        const tasaMoraDiaria = await this.obtenerConfiguracion('TASA_MORA_DIARIA', 1.0);
        // Calcular monto adeudado (cuota - pagado)
        const montoAdeudado = cuota.montoCuota.toNumber() - cuota.montoPagado.toNumber();
        if (montoAdeudado <= 0)
            return;
        // Calcular mora: montoAdeudado * (tasaMora/100) * diasMora
        const montoMora = montoAdeudado * (tasaMoraDiaria / 100) * diasMora;
        // Actualizar cuota
        await database_1.default.cuota.update({
            where: { id: cuotaId },
            data: {
                interes_mora: montoMora,
                diasMora,
                estado: types_1.EstadoCuota.VENCIDA,
            },
        });
    }
    /**
     * Actualizar o crear registro de mora del socio
     * Implementa: RN-MOR-002 (clasificación de morosidad)
     */
    async actualizarRegistroMoraSocio(creditoId) {
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            include: {
                cuotas: {
                    where: {
                        estado: {
                            in: [types_1.EstadoCuota.VENCIDA, types_1.EstadoCuota.PARCIALMENTE_PAGADA],
                        },
                    },
                    orderBy: {
                        diasMora: 'desc',
                    },
                },
            },
        });
        if (!credito || !credito.cuotas.length) {
            // No hay mora, eliminar registro si existe
            await database_1.default.mora.deleteMany({
                where: {
                    creditoId,
                    estado: 'ACTIVA',
                },
            });
            return;
        }
        // Obtener la cuota con mayor mora
        const cuotaMayorMora = credito.cuotas[0];
        const diasMora = cuotaMayorMora.diasMora || 0;
        const montoMoraTotal = credito.cuotas.reduce((sum, c) => sum + (c.interes_mora?.toNumber() || 0), 0);
        // Si no hay días de mora, eliminar registro si existe y retornar
        if (diasMora === 0) {
            await database_1.default.mora.deleteMany({
                where: {
                    creditoId,
                    estado: 'ACTIVA',
                },
            });
            return;
        }
        // Clasificar mora (RN-MOR-002)
        const clasificacion = this.clasificarMora(diasMora);
        // Buscar mora activa existente
        const moraExistente = await database_1.default.mora.findFirst({
            where: {
                creditoId,
                estado: 'ACTIVA',
            },
        });
        if (moraExistente) {
            // Actualizar
            await database_1.default.mora.update({
                where: { id: moraExistente.id },
                data: {
                    diasMora,
                    interes_mora_acumulado: montoMoraTotal,
                    clasificacion,
                    updatedAt: new Date(),
                },
            });
        }
        else {
            // Crear nuevo registro
            await database_1.default.mora.create({
                data: {
                    creditoId,
                    cuota_id: cuotaMayorMora.id,
                    clasificacion,
                    diasMora,
                    monto_cuota_vencida: cuotaMayorMora.montoCuota,
                    interes_mora_acumulado: montoMoraTotal,
                    fecha_inicio_mora: cuotaMayorMora.fechaVencimiento,
                    fecha_vencimiento_original: cuotaMayorMora.fechaVencimiento,
                    estado: 'ACTIVA',
                },
            });
        }
        // RN-MOR-003: Castigar crédito si llega a 90+ días
        if (clasificacion === types_1.ClasificacionMora.CASTIGADO) {
            await this.castigarCredito(creditoId);
        }
    }
    /**
     * Clasificar morosidad según días de atraso
     * Implementa: RN-MOR-002
     */
    clasificarMora(diasMora) {
        if (diasMora >= 90)
            return types_1.ClasificacionMora.CASTIGADO;
        if (diasMora >= 61)
            return types_1.ClasificacionMora.MORA_PERSISTENTE;
        if (diasMora >= 31)
            return types_1.ClasificacionMora.MORA_GRAVE;
        if (diasMora >= 16)
            return types_1.ClasificacionMora.MORA_MODERADA;
        return types_1.ClasificacionMora.MORA_LEVE;
    }
    /**
     * Castigar crédito (90+ días de mora)
     * Implementa: RN-MOR-003
     */
    async castigarCredito(creditoId) {
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
        });
        if (!credito || credito.estado === types_1.EstadoCredito.CASTIGADO)
            return;
        await database_1.default.$transaction(async (tx) => {
            // Cambiar estado del crédito
            await tx.credito.update({
                where: { id: creditoId },
                data: {
                    estado: types_1.EstadoCredito.CASTIGADO,
                },
            });
            // RN-MOR-003: Cambiar tasa de interés de 1.5% a 3%
            // (Esto afectaría cuotas futuras si el crédito se reactiva)
            // TODO: RN-GAR-008 - Ejecutar garantías automáticamente
            // await garantiasService.ejecutarGarantiasPorMora(creditoId);
            // Auditoría
            await tx.auditoria.create({
                data: {
                    entidad: 'creditos',
                    accion: 'ACTUALIZAR',
                    entidadId: creditoId,
                    datosAnteriores: { estado: credito.estado },
                    datosNuevos: { estado: types_1.EstadoCredito.CASTIGADO },
                    descripcion: `Crédito castigado por mora >= 90 días: ${credito.codigo}`,
                },
            });
        });
        logger_1.default.warn(`Crédito CASTIGADO: ${credito.codigo} (90+ días de mora)`);
    }
    /**
     * Verificar si el crédito se completó
     */
    async verificarCompletitudCredito(creditoId) {
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            include: {
                cuotas: true,
            },
        });
        if (!credito)
            return;
        // Verificar si todas las cuotas están pagadas
        const todasPagadas = credito.cuotas.every((c) => c.estado === types_1.EstadoCuota.PAGADA);
        if (todasPagadas && (credito.saldo_capital ? credito.saldo_capital.toNumber() : 0) <= 0.01) {
            await database_1.default.$transaction(async (tx) => {
                // Actualizar crédito a COMPLETADO
                await tx.credito.update({
                    where: { id: creditoId },
                    data: {
                        estado: types_1.EstadoCredito.COMPLETADO,
                        fecha_finalizacion: new Date(),
                        saldo_capital: 0,
                    },
                });
                // Incrementar contador de créditos completados del socio
                await tx.socio.update({
                    where: { id: credito.socioId },
                    data: {
                    // creditosCompletados: { increment: 1 }, // Field does not exist
                    // creditosActivos: { decrement: 1 }, // Field does not exist
                    },
                });
                // Eliminar mora si existe
                await tx.mora.updateMany({
                    where: {
                        creditoId,
                        estado: 'ACTIVA',
                    },
                    data: {
                        estado: 'RESUELTA',
                        fecha_regularizacion: new Date(),
                    },
                });
                // Auditoría
                await tx.auditoria.create({
                    data: {
                        entidad: 'creditos',
                        accion: 'ACTUALIZAR',
                        entidadId: creditoId,
                        datosAnteriores: { estado: credito.estado },
                        datosNuevos: { estado: types_1.EstadoCredito.COMPLETADO },
                        descripcion: `Crédito completado: ${credito.codigo}`,
                    },
                });
            });
            logger_1.default.info(`Crédito COMPLETADO: ${credito.codigo}`);
        }
    }
    /**
     * Obtener estado de pagos de un crédito
     */
    async obtenerEstadoPagos(creditoId) {
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            include: {
                cuotas: {
                    orderBy: {
                        numeroCuota: 'asc',
                    },
                },
                pagos: {
                    orderBy: {
                        fechaPago: 'desc',
                    },
                },
                moras: {
                    where: {
                        estado: 'ACTIVA',
                    },
                },
            },
        });
        if (!credito) {
            throw new errors_1.NotFoundError(`Crédito ${creditoId} no encontrado`);
        }
        // Calcular resumen
        const totalPagado = credito.pagos.reduce((sum, p) => sum + (p.monto_pago ? parseFloat(p.monto_pago.toString()) : 0), 0);
        const cuotasPagadas = credito.cuotas.filter((c) => c.estado === types_1.EstadoCuota.PAGADA).length;
        const cuotasVencidas = credito.cuotas.filter((c) => c.estado === types_1.EstadoCuota.VENCIDA).length;
        const totalMora = credito.cuotas.reduce((sum, c) => sum + (c.interes_mora ? parseFloat(c.interes_mora.toString()) : 0), 0);
        return {
            credito: {
                id: credito.id,
                codigo: credito.codigo,
                montoTotal: parseFloat(credito.montoTotal.toString()),
                saldoCapital: credito.saldo_capital ? parseFloat(credito.saldo_capital.toString()) : 0,
                estado: credito.estado,
            },
            resumen: {
                totalPagado,
                cuotasPagadas,
                cuotasPendientes: credito.cuotas.length - cuotasPagadas,
                cuotasVencidas,
                totalMora,
                moraActiva: credito.moras.length > 0 ? credito.moras[0] : null,
            },
            cuotas: credito.cuotas,
            // Mapear pagos de snake_case a camelCase para el frontend
            pagos: credito.pagos.map(p => ({
                id: p.id,
                codigo: p.codigo,
                creditoId: p.creditoId,
                socioId: p.socioId,
                montoPagado: parseFloat(p.monto_pago.toString()),
                montoAMora: p.monto_a_mora ? parseFloat(p.monto_a_mora.toString()) : 0,
                montoAInteres: p.monto_a_interes ? parseFloat(p.monto_a_interes.toString()) : 0,
                montoACapital: p.monto_a_capital ? parseFloat(p.monto_a_capital.toString()) : 0,
                metodoPago: p.metodoPago,
                fechaPago: p.fechaPago,
                createdAt: p.createdAt,
            })),
        };
    }
    /**
     * Obtener pagos recientes del sistema
     */
    async obtenerPagosRecientes(limite = 15) {
        const pagos = await database_1.default.pago.findMany({
            take: limite,
            orderBy: [
                { fechaPago: 'desc' }, // Primero por fecha (más reciente primero)
                { id: 'desc' }, // Luego por ID (más reciente primero)
            ],
            include: {
                credito: {
                    select: {
                        codigo: true,
                        socio: {
                            select: {
                                codigo: true,
                                nombreCompleto: true,
                            },
                        },
                    },
                },
            },
        });
        // Mapear a camelCase para el frontend
        return pagos.map(p => ({
            id: p.id,
            codigo: p.codigo,
            creditoId: p.creditoId, // Mantenemos ID para referencia
            socioId: p.socioId, // Mantenemos ID para referencia
            montoPagado: parseFloat(p.monto_pago.toString()),
            montoAMora: p.monto_a_mora ? parseFloat(p.monto_a_mora.toString()) : 0,
            montoAInteres: p.monto_a_interes ? parseFloat(p.monto_a_interes.toString()) : 0,
            montoACapital: p.monto_a_capital ? parseFloat(p.monto_a_capital.toString()) : 0,
            montoACuotaSiguiente: p.monto_a_cuota_siguiente ? parseFloat(p.monto_a_cuota_siguiente.toString()) : 0,
            metodoPago: p.metodoPago,
            fechaPago: p.fechaPago,
            // concepto: p.concepto, // TODO: Verificar si existe en el modelo (parece que no se usa en registrarPago salvo en el DTO)
            credito: p.credito ? {
                codigo: p.credito.codigo,
                socio: p.credito.socio ? {
                    codigo: p.credito.socio.codigo,
                    nombreCompleto: p.credito.socio.nombreCompleto,
                } : null
            } : null,
        }));
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
    /**
     * Generar código único para pago
     * Formato: PAG-CREXXXX-NNN
     * Ejemplo: PAG-CRE0001-001
     */
    async generarCodigoPago(creditoId) {
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            include: {
                pagos: {
                    orderBy: {
                        id: 'desc',
                    },
                    take: 1,
                },
            },
        });
        if (!credito) {
            throw new errors_1.NotFoundError(`Crédito ${creditoId} no encontrado`);
        }
        // Obtener el último número de secuencia
        const ultimoPago = credito.pagos[0];
        let siguienteSecuencia = 1;
        if (ultimoPago && ultimoPago.codigo) {
            // Extraer el número de secuencia del último código
            const match = ultimoPago.codigo.match(/-(\d+)$/);
            if (match) {
                siguienteSecuencia = parseInt(match[1]) + 1;
            }
        }
        // Formato: PAG-CRE0001-001
        const secuenciaPadded = siguienteSecuencia.toString().padStart(3, '0');
        return `PAG-${credito.codigo}-${secuenciaPadded}`;
    }
    /**
     * Obtener pago por ID
     */
    async obtenerPago(id) {
        const pago = await database_1.default.pago.findUnique({
            where: { id },
            include: {
                credito: {
                    select: {
                        codigo: true,
                        socio: {
                            select: {
                                codigo: true,
                                nombreCompleto: true,
                            },
                        },
                    },
                },
            },
        });
        if (!pago) {
            throw new errors_1.NotFoundError(`Pago con ID ${id} no encontrado`);
        }
        // Mapear a camelCase
        return {
            id: pago.id,
            codigo: pago.codigo,
            creditoId: pago.creditoId,
            socioId: pago.socioId,
            montoPagado: parseFloat(pago.monto_pago.toString()),
            montoAMora: pago.monto_a_mora ? parseFloat(pago.monto_a_mora.toString()) : 0,
            montoAInteres: pago.monto_a_interes ? parseFloat(pago.monto_a_interes.toString()) : 0,
            montoACapital: pago.monto_a_capital ? parseFloat(pago.monto_a_capital.toString()) : 0,
            metodoPago: pago.metodoPago,
            fechaPago: pago.fechaPago,
            credito: pago.credito ? {
                codigo: pago.credito.codigo,
                socio: pago.credito.socio,
            } : null,
        };
    }
    /**
     * Actualizar pago (solo dentro de 7 días)
     * Nota: Por ahora solo permite editar datos descriptivos, no el monto
     */
    async actualizarPago(id, data, usuarioId) {
        // Obtener pago existente
        const pagoExistente = await database_1.default.pago.findUnique({
            where: { id },
            include: {
                credito: true,
            },
        });
        if (!pagoExistente) {
            throw new errors_1.NotFoundError(`Pago con ID ${id} no encontrado`);
        }
        // Verificar que sea editable (dentro de 7 días)
        const fechaPago = new Date(pagoExistente.fechaPago);
        const hoy = new Date();
        const diferenciaDias = Math.floor((hoy.getTime() - fechaPago.getTime()) / (1000 * 60 * 60 * 24));
        if (diferenciaDias > 7) {
            throw new PagoBusinessError('Solo se pueden editar pagos registrados en los últimos 7 días');
        }
        // Verificar si se intenta cambiar el monto
        const montoCambio = data.montoPagado !== undefined &&
            parseFloat(data.montoPagado) !== parseFloat(pagoExistente.monto_pago.toString());
        if (montoCambio) {
            throw new PagoBusinessError('Por motivos de integridad, no se puede cambiar el monto de un pago ya registrado. Solo se pueden editar datos descriptivos (fecha, método, referencia, concepto).');
        }
        // Preparar datos para actualización (solo datos descriptivos)
        const updateData = {};
        if (data.fechaPago !== undefined) {
            updateData.fechaPago = new Date(data.fechaPago);
        }
        if (data.metodoPago !== undefined) {
            updateData.metodoPago = data.metodoPago;
        }
        // Campos no existentes en modelo Pago actual
        // if (data.numeroReferencia !== undefined) {
        //   updateData.numeroReferencia = data.numeroReferencia;
        // }
        // if (data.concepto !== undefined) {
        //   updateData.concepto = data.concepto;
        // }
        // Actualizar
        const pagoActualizado = await database_1.default.$transaction(async (tx) => {
            const pago = await tx.pago.update({
                where: { id },
                data: updateData,
            });
            // Registrar auditoría
            await tx.auditoria.create({
                data: {
                    usuarioId,
                    entidad: 'pagos',
                    entidadId: id,
                    accion: 'ACTUALIZAR',
                    descripcion: `Pago ${pago.codigo} actualizado`,
                    datosAnteriores: pagoExistente,
                    datosNuevos: updateData,
                    exitosa: true,
                },
            });
            return pago;
        });
        logger_1.default.info(`Pago actualizado: ${pagoActualizado.codigo}`);
        return await this.obtenerPago(id);
    }
}
exports.default = new PagosService();
//# sourceMappingURL=pagos.service.js.map