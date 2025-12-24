"use strict";
/**
 * ============================================================================
 * Sistema MLF - Controlador de Créditos
 * Archivo: src/controllers/creditos.controller.ts
 * Descripción: Controladores para endpoints de gestión de créditos
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerEstadoCuenta = exports.obtenerTablaAmortizacion = exports.actualizarCredito = exports.listarCreditos = exports.obtenerCredito = exports.rechazarCredito = exports.desembolsarCredito = exports.aprobarCredito = exports.solicitarCredito = void 0;
const creditos_service_1 = __importDefault(require("../services/creditos.service"));
const responses_1 = require("../utils/responses");
/**
 * POST /api/v1/creditos
 * Solicitar nuevo crédito
 */
const solicitarCredito = async (req, res, next) => {
    try {
        const data = req.body;
        // Validación básica
        if (!data.socioId ||
            !data.montoSolicitado ||
            !data.plazoMeses ||
            !data.metodoAmortizacion ||
            !data.proposito) {
            throw new Error('Todos los campos son requeridos');
        }
        const credito = await creditos_service_1.default.solicitarCredito(data, req.user?.id);
        (0, responses_1.sendCreated)(res, credito, 'Crédito solicitado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.solicitarCredito = solicitarCredito;
/**
 * POST /api/v1/creditos/:id/aprobar
 * Aprobar solicitud de crédito
 */
const aprobarCredito = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { observaciones } = req.body;
        const credito = await creditos_service_1.default.aprobarCredito({
            creditoId: parseInt(id, 10),
            observaciones,
            aprobadoPorId: req.user?.id
        });
        (0, responses_1.sendSuccess)(res, credito, 'Crédito aprobado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.aprobarCredito = aprobarCredito;
/**
 * POST /api/v1/creditos/:id/desembolsar
 * Desembolsar crédito aprobado
 */
const desembolsarCredito = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fechaDesembolso, tasaInteresAnual, observaciones } = req.body;
        // Validación
        if (!tasaInteresAnual) {
            throw new Error('La tasa de interés anual es requerida');
        }
        // CORRECCIÓN: Procesar fecha correctamente para evitar problemas de zona horaria
        let fechaDesembolsoProcessed;
        if (fechaDesembolso) {
            // Si viene en formato ISO (YYYY-MM-DD), agregar hora local para evitar cambio de día
            if (typeof fechaDesembolso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaDesembolso)) {
                fechaDesembolsoProcessed = new Date(fechaDesembolso + 'T12:00:00');
            }
            else {
                fechaDesembolsoProcessed = new Date(fechaDesembolso);
            }
        }
        else {
            fechaDesembolsoProcessed = new Date();
        }
        const resultado = await creditos_service_1.default.desembolsarCredito({
            creditoId: parseInt(id, 10),
            fechaDesembolso: fechaDesembolsoProcessed,
            tasaInteresAnual: parseFloat(tasaInteresAnual),
            observaciones,
            desembolsadoPorId: req.user?.id
        });
        (0, responses_1.sendSuccess)(res, resultado, 'Crédito desembolsado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.desembolsarCredito = desembolsarCredito;
/**
 * POST /api/v1/creditos/:id/rechazar
 * Rechazar solicitud de crédito
 */
const rechazarCredito = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { motivoRechazo } = req.body;
        if (!motivoRechazo) {
            throw new Error('El motivo de rechazo es requerido');
        }
        const credito = await creditos_service_1.default.rechazarCredito({
            creditoId: parseInt(id, 10),
            motivoRechazo,
            rechazadoPorId: req.user?.id
        });
        (0, responses_1.sendSuccess)(res, credito, 'Crédito rechazado');
    }
    catch (error) {
        next(error);
    }
};
exports.rechazarCredito = rechazarCredito;
/**
 * GET /api/v1/creditos/:id
 * Obtener crédito por ID
 */
const obtenerCredito = async (req, res, next) => {
    try {
        const { id } = req.params;
        const credito = await creditos_service_1.default.obtenerCreditoPorId(parseInt(id, 10));
        // Validar propiedad: Solo el dueño o Admin/Operador pueden ver el crédito
        if (req.user?.rol === 'SOCIO' && credito.socioId !== req.user.id) {
            res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este crédito'
            });
            return;
        }
        (0, responses_1.sendSuccess)(res, credito);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerCredito = obtenerCredito;
/**
 * GET /api/v1/creditos
 * Listar créditos con filtros y paginación
 */
const listarCreditos = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', socioId, estado, metodoAmortizacion, busqueda, } = req.query;
        const resultado = await creditos_service_1.default.listarCreditos({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            socioId: socioId ? parseInt(socioId, 10) : undefined,
            estado: estado,
            metodoAmortizacion: metodoAmortizacion,
            busqueda: busqueda,
        });
        (0, responses_1.sendPaginated)(res, resultado.creditos, resultado.page, resultado.limit, resultado.total, 'creditos');
    }
    catch (error) {
        next(error);
    }
};
exports.listarCreditos = listarCreditos;
/**
 * PUT /api/v1/creditos/:id
 * Actualizar crédito (solo SOLICITADO)
 */
const actualizarCredito = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const credito = await creditos_service_1.default.actualizarCredito(parseInt(id, 10), data, req.user?.id);
        (0, responses_1.sendSuccess)(res, credito, 'Crédito actualizado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.actualizarCredito = actualizarCredito;
/**
 * GET /api/v1/creditos/:id/amortizacion
 * Obtener tabla de amortización del crédito
 */
const obtenerTablaAmortizacion = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Obtener el crédito con sus cuotas
        const credito = await creditos_service_1.default.obtenerCreditoPorId(parseInt(id, 10));
        // Validar propiedad
        if (req.user?.rol === 'SOCIO' && credito.socioId !== req.user.id) {
            res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver esta tabla de amortización'
            });
            return;
        }
        if (!credito.cuotas || credito.cuotas.length === 0) {
            throw new Error('Este crédito aún no tiene tabla de amortización. Debe ser desembolsado primero.');
        }
        // Preparar respuesta con resumen
        const resumen = {
            creditoId: credito.id,
            codigo: credito.codigo,
            montoTotal: credito.montoTotal,
            plazoMeses: credito.plazoMeses,
            tasaInteresAnual: credito.tasaInteresAnual,
            metodoAmortizacion: credito.metodoAmortizacion,
            estado: credito.estado,
            fechaDesembolso: credito.fechaDesembolso,
            totalCuotas: credito.cuotas.length,
            cuotasPagadas: credito.cuotas.filter((c) => c.estado === 'PAGADA').length,
            cuotasPendientes: credito.cuotas.filter((c) => c.estado === 'PENDIENTE')
                .length,
            cuotasVencidas: credito.cuotas.filter((c) => c.estado === 'VENCIDA').length,
        };
        // Calcular totales
        const totales = {
            totalCapital: credito.cuotas.reduce((sum, c) => sum + parseFloat(c.monto_capital?.toString() || '0'), 0),
            totalInteres: credito.cuotas.reduce((sum, c) => sum + parseFloat(c.monto_interes?.toString() || '0'), 0),
            totalPagar: credito.cuotas.reduce((sum, c) => sum + parseFloat(c.montoCuota?.toString() || '0'), 0),
            totalPagado: credito.cuotas.reduce((sum, c) => sum + parseFloat(c.montoPagado?.toString() || '0'), 0),
            totalMora: credito.cuotas.reduce((sum, c) => sum + parseFloat(c.interes_mora?.toString() || '0'), 0),
        };
        const respuesta = {
            resumen,
            totales,
            cuotas: credito.cuotas,
        };
        (0, responses_1.sendSuccess)(res, respuesta);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerTablaAmortizacion = obtenerTablaAmortizacion;
/**
 * GET /api/v1/creditos/:id/estado-cuenta
 * Obtener estado de cuenta del crédito
 */
const obtenerEstadoCuenta = async (req, res, next) => {
    try {
        const { id } = req.params;
        const credito = await creditos_service_1.default.obtenerCreditoPorId(parseInt(id, 10));
        // Validar propiedad
        if (req.user?.rol === 'SOCIO' && credito.socioId !== req.user.id) {
            res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este estado de cuenta'
            });
            return;
        }
        if (!credito.cuotas || credito.cuotas.length === 0) {
            throw new Error('Este crédito no tiene cuotas generadas');
        }
        // Calcular información del estado de cuenta
        const cuotasPagadas = credito.cuotas.filter((c) => c.estado === 'PAGADA');
        const cuotasPendientes = credito.cuotas.filter((c) => c.estado === 'PENDIENTE' || c.estado === 'VENCIDA');
        const cuotasVencidas = credito.cuotas.filter((c) => c.estado === 'VENCIDA');
        const totalPagado = cuotasPagadas.reduce((sum, c) => sum + parseFloat(c.montoPagado.toString()), 0);
        const totalPendiente = cuotasPendientes.reduce((sum, c) => sum +
            parseFloat(c.montoCuota.toString()) -
            parseFloat(c.montoPagado.toString()), 0);
        const totalMoraAdeudada = cuotasVencidas.reduce((sum, c) => sum + parseFloat(c.montoMora.toString()), 0);
        const capitalPagado = cuotasPagadas.reduce((sum, c) => sum + parseFloat(c.capitalPagado.toString()), 0);
        const interesPagado = cuotasPagadas.reduce((sum, c) => sum + parseFloat(c.interesPagado.toString()), 0);
        const estadoCuenta = {
            credito: {
                id: credito.id,
                codigo: credito.codigo,
                estado: credito.estado,
                montoTotal: credito.montoTotal,
                plazoMeses: credito.plazoMeses,
                fechaDesembolso: credito.fechaDesembolso,
            },
            resumen: {
                cuotasPagadas: cuotasPagadas.length,
                cuotasPendientes: cuotasPendientes.length,
                cuotasVencidas: cuotasVencidas.length,
                totalCuotas: credito.cuotas.length,
            },
            montos: {
                totalPagado,
                capitalPagado,
                interesPagado,
                totalPendiente,
                totalMoraAdeudada,
                saldoCapital: parseFloat(credito.saldoCapital.toString()),
            },
            proximasCuotas: cuotasPendientes.slice(0, 3).map((c) => ({
                numeroCuota: c.numeroCuota,
                fechaVencimiento: c.fechaVencimiento,
                montoCuota: c.montoCuota,
                estado: c.estado,
                diasVencidos: c.estado === 'VENCIDA'
                    ? Math.floor((new Date().getTime() - new Date(c.fechaVencimiento).getTime()) /
                        (1000 * 60 * 60 * 24))
                    : 0,
            })),
        };
        (0, responses_1.sendSuccess)(res, estadoCuenta);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerEstadoCuenta = obtenerEstadoCuenta;
//# sourceMappingURL=creditos.controller.js.map