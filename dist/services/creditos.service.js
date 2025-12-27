"use strict";
/**
 * ============================================================================
 * Sistema MLF - Servicio de Gestión de Créditos
 * Archivo: src/services/creditos.service.ts
 * Descripción: Lógica de negocio para gestión del ciclo completo de créditos
 * ============================================================================
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
const amortization_service_1 = __importDefault(require("./amortization.service"));
const notificaciones_service_1 = __importStar(require("./notificaciones.service"));
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
const client_1 = require("@prisma/client");
// ============================================================================
// SERVICIO DE CRÉDITOS
// ============================================================================
class CreditosService {
    /**
     * Solicitar nuevo crédito
     * Implementa RN-CRE-001 a RN-CRE-008
     */
    async solicitarCredito(data, usuarioId) {
        const { socioId, montoSolicitado, plazoMeses, metodoAmortizacion, tasaInteresAnual, garantesIds } = data;
        // ============================================================================
        // VALIDACIONES BÁSICAS
        // ============================================================================
        (0, validators_1.validarMontoPositivoOrThrow)(montoSolicitado, 'Monto solicitado');
        (0, validators_1.validarPlazoMesesOrThrow)(plazoMeses);
        // ============================================================================
        // VERIFICAR SOCIO
        // ============================================================================
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
            include: {
                creditos: {
                    where: {
                        estado: {
                            in: ['SOLICITADO', 'APROBADO', 'DESEMBOLSADO'],
                        },
                    },
                    include: {
                        moras: {
                            where: {
                                estado: 'ACTIVA',
                            },
                        },
                    },
                },
            },
        });
        if (!socio) {
            throw new errors_1.NotFoundError(`Socio con ID ${socioId} no encontrado`);
        }
        // Solo socios ACTIVOS pueden solicitar créditos
        if (socio.estado !== 'ACTIVO') {
            throw new errors_1.CreditoBusinessError('Solo socios ACTIVOS pueden solicitar créditos');
        }
        // ============================================================================
        // VERIFICAR MORA ACTIVA (RN-CRE-003)
        // ============================================================================
        // Buscar moras activas en todos los créditos del socio
        const morasActivas = socio.creditos.flatMap(c => c.moras || []).filter(m => m.estado === 'ACTIVA');
        if (morasActivas.length > 0) {
            const moraActiva = morasActivas[0];
            throw new errors_1.MoraActivaError(moraActiva.diasMora);
        }
        // ============================================================================
        // CALCULAR LÍMITE DE CRÉDITO (RN-CRE-002, RN-ETA-004)
        // ============================================================================
        const limiteDisponible = await this.calcularLimiteDisponible(socio);
        // Calcular suma de créditos activos
        const sumaCreditosActivos = socio.creditos.reduce((sum, c) => sum + c.montoTotal.toNumber(), 0);
        // ============================================================================
        // CALCULAR PRIMA DE SEGURO (RN-CRE-005, RN-SEG-001)
        // ============================================================================
        const primaSeguroPorcentaje = await this.obtenerConfiguracion('CREDITO_PRIMA_SEGURO', 1.0);
        const primaSeguro = montoSolicitado * (primaSeguroPorcentaje / 100);
        const montoTotal = montoSolicitado + primaSeguro;
        // ========================================================================
        // VALIDACIÓN DE LÍMITE TEMPORALMENTE DESHABILITADA
        // TODO: Reactivar cuando se resuelva la inconsistencia de etapa
        // Fecha: 2024-12-24
        // ========================================================================
        logger_1.default.warn(`[Creditos] Validación de límite temporalmente deshabilitada - Monto: ${montoTotal}, Límite: ${limiteDisponible}`);
        /* BLOQUE COMENTADO - VALIDACIÓN LÍMITE
        if (sumaCreditosActivos + montoTotal > limiteDisponible) {
          throw new LimiteCreditoExcedidoError(
            limiteDisponible - sumaCreditosActivos,
            montoTotal
          );
        }
        FIN BLOQUE COMENTADO */
        // ============================================================================
        // OBTENER TASA DE INTERÉS
        // ============================================================================
        // Si se proporciona tasa anual desde el frontend, convertir a mensual
        // De lo contrario, usar la configuración por defecto (1.5% mensual = 18% anual)
        let tasaInteresMensual;
        if (tasaInteresAnual !== undefined && tasaInteresAnual !== null) {
            tasaInteresMensual = tasaInteresAnual / 12; // Convertir anual a mensual
        }
        else {
            tasaInteresMensual = await this.obtenerConfiguracion('TASA_INTERES_MENSUAL', 1.5);
        }
        // ============================================================================
        // GENERAR CÓDIGO ÚNICO
        // ============================================================================
        const codigo = await this.generarCodigoCredito();
        // ============================================================================
        // CREAR CRÉDITO EN TRANSACCIÓN
        // ============================================================================
        const nuevoCredito = await database_1.default.$transaction(async (tx) => {
            // 1. Calcular cuota mensual según método de amortización
            // tasaInteresMensual ya viene como mensual (ej: 1.5)
            const tasaMensualDecimal = tasaInteresMensual / 100; // Convertir a decimal
            let cuotaMensual;
            if (metodoAmortizacion === 'FRANCES') {
                // Fórmula francesa: C = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
                if (tasaMensualDecimal === 0) {
                    cuotaMensual = montoTotal / plazoMeses;
                }
                else {
                    const potencia = Math.pow(1 + tasaMensualDecimal, plazoMeses);
                    cuotaMensual = montoTotal * (tasaMensualDecimal * potencia) / (potencia - 1);
                }
            }
            else if (metodoAmortizacion === 'ALEMAN') {
                // Método alemán: Primera cuota (capital fijo + interés sobre total)
                const capitalFijo = montoTotal / plazoMeses;
                const interesPrimeraQuota = montoTotal * tasaMensualDecimal;
                cuotaMensual = capitalFijo + interesPrimeraQuota;
            }
            else {
                throw new errors_1.BadRequestError(`Método de amortización no válido: ${metodoAmortizacion}`);
            }
            // Redondear a 2 decimales
            cuotaMensual = Math.round(cuotaMensual * 100) / 100;
            // 2. Crear crédito
            const credito = await tx.credito.create({
                data: {
                    codigo,
                    socioId,
                    montoSolicitado,
                    primaSeguro,
                    montoTotal,
                    tasa_interes_mensual: tasaInteresMensual,
                    cuota_mensual: cuotaMensual,
                    saldo_capital: montoTotal, // Inicialmente todo el monto
                    plazoMeses,
                    metodoAmortizacion,
                    estado: 'SOLICITADO',
                },
            });
            // 3. Registrar auditoría con detalles del crédito
            await tx.auditoria.create({
                data: {
                    usuarioId,
                    entidad: 'creditos',
                    entidadId: credito.id,
                    accion: 'CREAR',
                    descripcion: `Crédito solicitado: ${credito.codigo} - $${montoTotal.toFixed(2)} - ${plazoMeses} meses`,
                    datosNuevos: {
                        codigo: credito.codigo,
                        socio: socio.codigo,
                        monto: montoTotal,
                        plazo: plazoMeses,
                        etapa: socio.etapaActual,
                    },
                    exitosa: true,
                },
            });
            // ========================================================================
            // GARANTÍAS TEMPORALMENTE DESHABILITADAS
            // TODO: Reactivar cuando se resuelva el problema del campo 'codigo'
            // Fecha: 2024-12-24
            // ========================================================================
            logger_1.default.warn(`[Creditos] Garantías temporalmente deshabilitadas para crédito ${credito.codigo}`);
            /* BLOQUE COMENTADO - GARANTÍAS
            // 4. Crear garantías (Lógica de Garantes)
            // Si no se envían garantes, se intenta asignar al Admin por defecto
            const garantesIdsParaProcesar = garantesIds && garantesIds.length > 0 ? garantesIds : [];
      
            if (garantesIdsParaProcesar.length === 0) {
              // Buscar socio Admin activo (fallback a código ADMIN-001)
              const adminSocio = await prisma.socio.findFirst({
                where: { codigo: 'ADMIN-001' }
              });
      
              if (adminSocio) {
                const codigoGarantiaAdmin = await this.generarCodigoGarantia();
                await tx.garantia.create({
                  // @ts-ignore
                  data: {
                    codigo: codigoGarantiaAdmin,
                    credito: { connect: { id: credito.id } },
                    garante: { connect: { id: adminSocio.id } },
                    socioGarantizado: { connect: { id: socioId } },
                    montoGarantizado: montoTotal,
                    montoCongelado: 0, // Admin no congela
                    estado: 'ACTIVA',
                  }
                });
                logger.info(`[Creditos] Admin asignado como garante para crédito ${credito.codigo} - Garantía: ${codigoGarantiaAdmin}`);
              }
            } else {
              // Garantías normales
              const montoPorGarante = montoTotal / garantesIdsParaProcesar.length;
              const montoCongelar = montoPorGarante * 0.10; // 10%
      
              for (const garanteId of garantesIdsParaProcesar) {
                const codigoGarantia = await this.generarCodigoGarantia();
                await tx.garantia.create({
                  // @ts-ignore
                  data: {
                    codigo: codigoGarantia,
                    credito: { connect: { id: credito.id } },
                    garante: { connect: { id: garanteId } },
                    socioGarantizado: { connect: { id: socioId } },
                    montoGarantizado: montoPorGarante,
                    montoCongelado: montoCongelar,
                    estado: 'ACTIVA',
                  }
                });
      
                // Congelar saldo
                await tx.socio.update({
                  where: { id: garanteId },
                  data: {
                    ahorroCongelado: { increment: montoCongelar }
                  }
                });
              }
            }
            FIN BLOQUE COMENTADO */
            return credito;
        });
        logger_1.default.info(`Crédito solicitado: ${nuevoCredito.codigo} - Socio: ${socio.codigo} - Monto: $${montoTotal.toFixed(2)}`);
        return await this.obtenerCreditoPorId(nuevoCredito.id);
    }
    /**
     * Aprobar crédito
     * Cambia estado a APROBADO y genera tabla de amortización
     */
    async aprobarCredito(data) {
        const { creditoId, aprobadoPorId, observaciones } = data;
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            include: {
                socio: true,
            },
        });
        if (!credito) {
            throw new errors_1.NotFoundError(`Crédito con ID ${creditoId} no encontrado`);
        }
        if (credito.estado !== 'SOLICITADO') {
            throw new errors_1.CreditoBusinessError(`El crédito debe estar en estado SOLICITADO para ser aprobado`);
        }
        // Verificar nuevamente el límite (por si cambió el ahorro)
        const limiteDisponible = await this.calcularLimiteDisponible(credito.socio);
        const sumaCreditosActivos = await this.calcularSumaCreditosActivos(credito.socioId);
        if (sumaCreditosActivos + credito.montoTotal.toNumber() > limiteDisponible) {
            throw new errors_1.LimiteCreditoExcedidoError(limiteDisponible - sumaCreditosActivos, credito.montoTotal.toNumber());
        }
        // Aprobar en transacción
        await database_1.default.$transaction(async (tx) => {
            // 1. Actualizar estado
            const actualizado = await tx.credito.update({
                where: { id: creditoId },
                data: {
                    estado: 'APROBADO',
                    fechaAprobacion: new Date(),
                },
            });
            // 2. Registrar auditoría
            await tx.auditoria.create({
                data: {
                    usuarioId: aprobadoPorId,
                    entidad: 'creditos',
                    entidadId: creditoId,
                    accion: 'APROBAR',
                    descripcion: `Crédito ${credito.codigo} aprobado${observaciones ? ': ' + observaciones : ''}`,
                    datosAnteriores: { estado: credito.estado },
                    datosNuevos: { estado: 'APROBADO', observaciones },
                    exitosa: true,
                },
            });
            return actualizado;
        });
        logger_1.default.info(`Crédito aprobado: ${credito.codigo}`);
        // Enviar notificación al socio
        try {
            await notificaciones_service_1.default.enviarNotificacion({
                socioId: credito.socioId,
                tipo: notificaciones_service_1.TipoNotificacion.CREDITO_APROBADO,
                canal: [notificaciones_service_1.CanalNotificacion.IN_APP, notificaciones_service_1.CanalNotificacion.EMAIL],
                prioridad: notificaciones_service_1.PrioridadNotificacion.ALTA,
                datos: {
                    codigoCredito: credito.codigo,
                    monto: credito.montoTotal.toNumber(),
                },
            });
        }
        catch (error) {
            logger_1.default.error(`Error enviando notificación de aprobación: ${error}`);
        }
        return await this.obtenerCreditoPorId(creditoId);
    }
    /**
     * Actualizar crédito (solo SOLICITADO)
     */
    async actualizarCredito(id, data, usuarioId) {
        // Verificar que el crédito existe
        const creditoExistente = await database_1.default.credito.findUnique({
            where: { id },
            include: {
                socio: true,
            },
        });
        if (!creditoExistente) {
            throw new errors_1.NotFoundError(`Crédito con ID ${id} no encontrado`);
        }
        // Solo se pueden editar créditos SOLICITADOS
        if (creditoExistente.estado !== 'SOLICITADO') {
            throw new errors_1.CreditoBusinessError('Solo se pueden editar créditos en estado SOLICITADO');
        }
        // Preparar datos para actualización
        const updateData = {};
        if (data.montoSolicitado !== undefined) {
            (0, validators_1.validarMontoPositivoOrThrow)(data.montoSolicitado, 'Monto solicitado');
            // Verificar límite de crédito
            const limiteDisponible = await this.calcularLimiteDisponible(creditoExistente.socio);
            const sumaCreditosActivos = await this.calcularSumaCreditosActivos(creditoExistente.socioId);
            if (data.montoSolicitado > limiteDisponible - sumaCreditosActivos) {
                throw new errors_1.LimiteCreditoExcedidoError(limiteDisponible - sumaCreditosActivos, data.montoSolicitado);
            }
            updateData.montoSolicitado = new client_1.Prisma.Decimal(data.montoSolicitado);
            updateData.montoTotal = new client_1.Prisma.Decimal(data.montoSolicitado);
        }
        if (data.plazoMeses !== undefined) {
            if (data.plazoMeses < 1 || data.plazoMeses > 60) {
                throw new errors_1.BadRequestError('El plazo debe estar entre 1 y 60 meses');
            }
            updateData.plazoMeses = data.plazoMeses;
        }
        if (data.tasaInteresAnual !== undefined) {
            if (data.tasaInteresAnual < 0 || data.tasaInteresAnual > 100) {
                throw new errors_1.BadRequestError('La tasa de interés debe estar entre 0 y 100');
            }
            updateData.tasaInteresAnual = new client_1.Prisma.Decimal(data.tasaInteresAnual);
        }
        if (data.tipoCredito !== undefined) {
            updateData.tipoCredito = data.tipoCredito;
        }
        if (data.metodoAmortizacion !== undefined) {
            updateData.metodoAmortizacion = data.metodoAmortizacion;
        }
        if (data.proposito !== undefined) {
            updateData.proposito = data.proposito;
        }
        // Actualizar
        const creditoActualizado = await database_1.default.$transaction(async (tx) => {
            const credito = await tx.credito.update({
                where: { id },
                data: updateData,
            });
            // Registrar auditoría
            await tx.auditoria.create({
                data: {
                    usuarioId,
                    entidad: 'creditos',
                    entidadId: id,
                    accion: 'ACTUALIZAR',
                    descripcion: `Información del crédito ${credito.codigo} actualizada`,
                    datosAnteriores: creditoExistente,
                    datosNuevos: updateData,
                    exitosa: true,
                },
            });
            return credito;
        });
        logger_1.default.info(`Crédito actualizado: ${creditoActualizado.codigo}`);
        return await this.obtenerCreditoPorId(id);
    }
    /**
     * Desembolsar crédito
     * Genera tabla de amortización y crea cuotas en la BD
     * Implementa RN-CRE-004
     */
    async desembolsarCredito(data) {
        const { creditoId, desembolsadoPorId, fechaDesembolso = new Date(), tasaInteresAnual } = data;
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            include: {
                socio: true,
            },
        });
        if (!credito) {
            throw new errors_1.NotFoundError(`Crédito con ID ${creditoId} no encontrado`);
        }
        if (credito.estado !== 'APROBADO') {
            throw new errors_1.CreditoBusinessError('El crédito debe estar APROBADO para ser desembolsado');
        }
        // ============================================================================
        // GENERAR TABLA DE AMORTIZACIÓN
        // ============================================================================
        // Usar la tasa almacenada en el crédito (ya guardada como mensual)
        // Si se proporciona tasaInteresAnual desde el frontend, convertir a mensual
        let tasaInteresMensual;
        if (tasaInteresAnual !== undefined && tasaInteresAnual !== null) {
            tasaInteresMensual = tasaInteresAnual / 12; // Convertir anual a mensual
        }
        else {
            tasaInteresMensual = credito.tasa_interes_mensual?.toNumber() || 1.5;
        }
        const tablaAmortizacion = amortization_service_1.default.calcularTablaAmortizacion({
            montoTotal: credito.montoTotal.toNumber(),
            tasaInteresMensual: tasaInteresMensual, // CAMBIADO: Ahora es tasa mensual
            plazoMeses: credito.plazoMeses,
            metodo: credito.metodoAmortizacion,
            fechaDesembolso,
        });
        // ============================================================================
        // DESEMBOLSAR EN TRANSACCIÓN
        // ============================================================================
        const resultado = await database_1.default.$transaction(async (tx) => {
            // 1. Actualizar crédito
            const creditoActualizado = await tx.credito.update({
                where: { id: creditoId },
                data: {
                    estado: 'DESEMBOLSADO',
                    fechaDesembolso,
                },
            });
            // 2. Crear cuotas en la base de datos
            for (const cuota of tablaAmortizacion.cuotas) {
                // Recalcular montoCuota para evitar errores de redondeo (CHECK constraint)
                const montoCuotaExacto = cuota.capital + cuota.interes;
                await tx.cuota.create({
                    data: {
                        creditoId,
                        numeroCuota: cuota.numeroCuota,
                        montoCuota: montoCuotaExacto,
                        monto_capital: cuota.capital,
                        monto_interes: cuota.interes,
                        saldo_capital_despues: cuota.saldoRestante,
                        montoPagado: 0,
                        estado: 'PENDIENTE',
                        fechaVencimiento: cuota.fechaVencimiento,
                        diasMora: 0,
                        interes_mora: 0,
                    },
                });
            }
            // 3. Registrar movimiento en fondo de seguro (prima del 1%)
            const primaSeguro = credito.primaSeguro.toNumber();
            await tx.fondoSeguro.create({
                data: {
                    tipo: 'INGRESO_PRIMA',
                    monto: primaSeguro,
                    creditoId: creditoId,
                    socioId: credito.socioId,
                    concepto: `Prima de seguro 1% - Crédito ${credito.codigo}`,
                },
            });
            // 5. Registrar auditoría
            await tx.auditoria.create({
                data: {
                    usuarioId: desembolsadoPorId,
                    entidad: 'creditos',
                    entidadId: creditoId,
                    accion: 'EJECUTAR',
                    descripcion: `Crédito ${credito.codigo} desembolsado - ${tablaAmortizacion.cuotas.length} cuotas generadas`,
                    datosAnteriores: { estado: 'APROBADO' },
                    datosNuevos: {
                        estado: 'DESEMBOLSADO',
                        fechaDesembolso,
                        cuotasGeneradas: tablaAmortizacion.cuotas.length,
                        totalAPagar: tablaAmortizacion.resumen.totalAPagar,
                        primaSeguroAlFondo: primaSeguro,
                    },
                    exitosa: true,
                },
            });
            return { creditoActualizado, tablaAmortizacion };
        });
        logger_1.default.info(`Crédito desembolsado: ${credito.codigo} - ${tablaAmortizacion.cuotas.length} cuotas - Total: $${tablaAmortizacion.resumen.totalAPagar.toFixed(2)}`);
        // Enviar notificación al socio
        try {
            await notificaciones_service_1.default.enviarNotificacion({
                socioId: credito.socioId,
                tipo: notificaciones_service_1.TipoNotificacion.CREDITO_DESEMBOLSADO,
                canal: [notificaciones_service_1.CanalNotificacion.IN_APP, notificaciones_service_1.CanalNotificacion.EMAIL],
                prioridad: notificaciones_service_1.PrioridadNotificacion.ALTA,
                datos: {
                    codigoCredito: credito.codigo,
                    monto: credito.montoTotal.toNumber(),
                    fechaDesembolso,
                },
            });
        }
        catch (error) {
            logger_1.default.error(`Error enviando notificación de desembolso: ${error}`);
        }
        return {
            credito: await this.obtenerCreditoPorId(creditoId),
            tablaAmortizacion: resultado.tablaAmortizacion,
        };
    }
    /**
     * Rechazar crédito
     */
    async rechazarCredito(data) {
        const { creditoId, rechazadoPorId, motivoRechazo } = data;
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
        });
        if (!credito) {
            throw new errors_1.NotFoundError(`Crédito con ID ${creditoId} no encontrado`);
        }
        if (credito.estado !== 'SOLICITADO' && credito.estado !== 'EN_REVISION') {
            throw new errors_1.CreditoBusinessError('Solo créditos SOLICITADOS o EN_REVISION pueden ser rechazados');
        }
        const creditoRechazado = await database_1.default.$transaction(async (tx) => {
            const actualizado = await tx.credito.update({
                where: { id: creditoId },
                data: {
                    estado: 'RECHAZADO',
                },
            });
            await tx.auditoria.create({
                data: {
                    usuarioId: rechazadoPorId,
                    entidad: 'creditos',
                    entidadId: creditoId,
                    accion: 'RECHAZAR',
                    descripcion: `Crédito ${credito.codigo} rechazado: ${motivoRechazo}`,
                    datosAnteriores: { estado: credito.estado },
                    datosNuevos: { estado: 'RECHAZADO', motivo: motivoRechazo },
                    exitosa: true,
                },
            });
            return actualizado;
        });
        logger_1.default.warn(`Crédito rechazado: ${credito.codigo} - Motivo: ${motivoRechazo}`);
        // Enviar notificación al socio
        try {
            await notificaciones_service_1.default.enviarNotificacion({
                socioId: credito.socioId,
                tipo: notificaciones_service_1.TipoNotificacion.CREDITO_RECHAZADO,
                canal: [notificaciones_service_1.CanalNotificacion.IN_APP, notificaciones_service_1.CanalNotificacion.EMAIL],
                prioridad: notificaciones_service_1.PrioridadNotificacion.ALTA,
                datos: {
                    codigoCredito: credito.codigo,
                    motivo: motivoRechazo,
                },
            });
        }
        catch (error) {
            logger_1.default.error(`Error enviando notificación de rechazo: ${error}`);
        }
        return creditoRechazado;
    }
    /**
     * Obtener crédito por ID con información completa
     */
    async obtenerCreditoPorId(id) {
        const credito = await database_1.default.credito.findUnique({
            where: { id },
            include: {
                socio: {
                    select: {
                        id: true,
                        codigo: true,
                        nombreCompleto: true,
                        etapaActual: true,
                        ahorroActual: true,
                    },
                },
                cuotas: {
                    orderBy: {
                        numeroCuota: 'asc',
                    },
                },
                garantias: {
                    // @ts-ignore
                    include: {
                        garante: {
                            select: {
                                id: true,
                                codigo: true,
                                nombreCompleto: true,
                            },
                        },
                        socioGarantizado: {
                            select: {
                                id: true,
                                codigo: true,
                                nombreCompleto: true,
                            },
                        },
                    },
                },
            },
        });
        if (!credito) {
            throw new errors_1.NotFoundError(`Crédito con ID ${id} no encontrado`);
        }
        // Mapear campos para compatibilidad con frontend
        return {
            ...credito,
            // Mapear tasa de interés: convertir mensual a anual
            tasaInteresMensual: credito.tasa_interes_mensual,
            tasaInteresAnual: credito.tasa_interes_mensual ?
                parseFloat(credito.tasa_interes_mensual.toString()) * 12 : 0,
            // Mapear otros campos snake_case
            saldoCapital: credito.saldo_capital,
            cuotaMensual: credito.cuota_mensual,
            estadoMora: credito.estado_mora,
            diasMora: credito.dias_mora,
            // Mapear campos de cuotas
            cuotas: credito.cuotas?.map((cuota) => ({
                ...cuota,
                montoTotal: cuota.montoCuota, // montoCuota es el monto total de la cuota
                montoCapital: cuota.monto_capital,
                montoInteres: cuota.monto_interes,
                saldoCapitalDespues: cuota.saldo_capital_despues,
                saldoRestante: cuota.saldo_capital_despues, // Alias para el frontend
                montoPagado: cuota.montoPagado, // CORRECCIÓN: Incluir monto pagado
                interesMora: cuota.interes_mora, // CORRECCIÓN: Incluir interés de mora
            })),
        };
    }
    /**
     * Listar créditos con filtros
     */
    async listarCreditos(filtros) {
        const { page = 1, limit = 20, socioId, estado, busqueda } = filtros;
        const where = {};
        if (socioId) {
            where.socioId = socioId;
        }
        if (estado) {
            where.estado = estado;
        }
        if (busqueda) {
            where.OR = [
                { codigo: { contains: busqueda, mode: 'insensitive' } },
                { socio: { nombreCompleto: { contains: busqueda, mode: 'insensitive' } } },
                { socio: { codigo: { contains: busqueda, mode: 'insensitive' } } },
            ];
        }
        const total = await database_1.default.credito.count({ where });
        const creditos = await database_1.default.credito.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                fechaSolicitud: 'desc',
            },
            include: {
                socio: {
                    select: {
                        id: true,
                        codigo: true,
                        nombreCompleto: true,
                        etapaActual: true,
                    },
                },
            },
        });
        // Mapear campos snake_case a camelCase para compatibilidad con frontend
        const creditosMapeados = creditos.map((credito) => ({
            ...credito,
            tasaInteresMensual: credito.tasa_interes_mensual,
            tasaInteresAnual: credito.tasa_interes_mensual ?
                parseFloat(credito.tasa_interes_mensual.toString()) * 12 : 0,
            saldoCapital: credito.saldo_capital,
            cuotaMensual: credito.cuota_mensual,
            estadoMora: credito.estado_mora,
            diasMora: credito.dias_mora,
        }));
        return {
            creditos: creditosMapeados,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    /**
     * Obtener tabla de amortización de un crédito
     */
    async obtenerTablaAmortizacion(creditoId) {
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            include: {
                cuotas: {
                    orderBy: {
                        numeroCuota: 'asc',
                    },
                },
            },
        });
        if (!credito) {
            throw new errors_1.NotFoundError(`Crédito con ID ${creditoId} no encontrado`);
        }
        if (!credito.cuotas || credito.cuotas.length === 0) {
            throw new errors_1.BadRequestError('El crédito aún no ha sido desembolsado (no tiene cuotas)');
        }
        // Construir tabla desde las cuotas en BD
        const cuotas = credito.cuotas.map((c) => ({
            numeroCuota: c.numeroCuota,
            fechaVencimiento: c.fechaVencimiento,
            montoCuota: c.montoCuota.toNumber(),
            capital: c.monto_capital.toNumber(),
            interes: c.monto_interes.toNumber(),
            saldoRestante: c.saldo_capital_despues.toNumber(),
        }));
        // Calcular resumen
        const totalAPagar = cuotas.reduce((sum, c) => sum + c.montoCuota, 0);
        const totalCapital = cuotas.reduce((sum, c) => sum + c.capital, 0);
        const totalIntereses = cuotas.reduce((sum, c) => sum + c.interes, 0);
        return {
            credito: {
                codigo: credito.codigo,
                montoTotal: credito.montoTotal.toNumber(),
                tasaInteres: credito.tasa_interes_mensual.toNumber(),
                plazoMeses: credito.plazoMeses,
                metodo: credito.metodoAmortizacion,
            },
            cuotas,
            resumen: {
                totalAPagar,
                totalCapital,
                totalIntereses,
            },
        };
    }
    // ============================================================================
    // MÉTODOS AUXILIARES PRIVADOS
    // ============================================================================
    /**
     * Calcular límite de crédito disponible para un socio
     * Implementa RN-CRE-002, RN-ETA-004
     */
    async calcularLimiteDisponible(socio) {
        // Calcular ahorro total (Disponible + Congelado)
        // Nota: socio debe incluir ahorroCongelado en su consulta. Si no, se asume 0 o se debe ajustar el include.
        // El llamador 'solicitarCredito' usa findUnique sin include especifico de ahorroCongelado, pero Prisma lo trae por defecto si es campo escalar.
        // Verificaremos si es Decimal.
        const ahorroDisponible = socio.ahorroActual?.toNumber() || 0;
        const ahorroCongelado = socio.ahorroCongelado?.toNumber() || 0;
        const ahorroTotal = ahorroDisponible + ahorroCongelado;
        let multiplicador = 1.0;
        // Determinar multiplicador según etapa
        if (socio.etapaActual === 1) {
            // Etapa Iniciante: 125% → 200% (incrementos de 25%)
            if (socio.creditosEtapaActual === 0)
                multiplicador = 1.25;
            else if (socio.creditosEtapaActual === 1)
                multiplicador = 1.5;
            else if (socio.creditosEtapaActual === 2)
                multiplicador = 1.75;
            else
                multiplicador = 2.0;
        }
        else if (socio.etapaActual === 2) {
            // Etapa Regular: 200% → 275% (empieza en el doble, sigue subiendo)
            if (socio.creditosEtapaActual === 0)
                multiplicador = 2.0;
            else if (socio.creditosEtapaActual === 1)
                multiplicador = 2.25;
            else if (socio.creditosEtapaActual === 2)
                multiplicador = 2.5;
            else
                multiplicador = 2.75;
        }
        else if (socio.etapaActual === 3) {
            multiplicador = 3.0;
        }
        const limitePorAhorros = ahorroTotal * multiplicador;
        // Topes por etapa (Hard caps) - Ajustados para permitir crecimiento
        const limitesPorEtapa = {
            1: 500,
            2: 10000, // Aumentado de 2000 a 10000
            3: 50000, // Aumentado de 10000 a 50000
        };
        const topeEtapa = limitesPorEtapa[socio.etapaActual] || 500;
        // El límite es el menor entre el tope de etapa y el calculado por ahorros
        return Math.min(topeEtapa, limitePorAhorros);
    }
    /**
     * Calcular suma de créditos activos de un socio
     */
    async calcularSumaCreditosActivos(socioId) {
        const creditos = await database_1.default.credito.findMany({
            where: {
                socioId,
                estado: {
                    in: ['APROBADO', 'DESEMBOLSADO'],
                },
            },
        });
        return creditos.reduce((sum, c) => sum + c.montoTotal.toNumber(), 0);
    }
    async generarCodigoCredito() {
        const year = new Date().getFullYear();
        const ultimoCredito = await database_1.default.credito.findFirst({
            where: {
                codigo: {
                    startsWith: `CRE-${year}`,
                },
            },
            orderBy: {
                codigo: 'desc',
            },
        });
        let secuencial = 1;
        if (ultimoCredito) {
            const ultimoSecuencial = parseInt(ultimoCredito.codigo.split('-')[2]);
            secuencial = ultimoSecuencial + 1;
        }
        return `CRE-${year}-${secuencial.toString().padStart(4, '0')}`;
    }
    /**
     * Generar código único para garantía
     * Formato: GAR-XXXX (secuencial)
     */
    async generarCodigoGarantia() {
        const ultimaGarantia = await database_1.default.garantia.findFirst({
            orderBy: { id: 'desc' },
            select: { codigo: true },
        });
        let numeroSecuencial = 1;
        if (ultimaGarantia?.codigo) {
            const match = ultimaGarantia.codigo.match(/GAR-(\d+)/);
            if (match) {
                numeroSecuencial = parseInt(match[1], 10) + 1;
            }
        }
        return `GAR-${numeroSecuencial.toString().padStart(4, '0')}`;
    }
    async obtenerConfiguracion(clave, valorPorDefecto) {
        const config = await database_1.default.configuracion.findUnique({
            where: { clave },
        });
        if (!config) {
            return valorPorDefecto;
        }
        return parseFloat(config.valor);
    }
}
exports.default = new CreditosService();
//# sourceMappingURL=creditos.service.js.map