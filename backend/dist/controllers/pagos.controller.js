"use strict";
/**
 * ============================================================================
 * Sistema MLF - Controlador de Pagos
 * Archivo: src/controllers/pagos.controller.ts
 * Descripción: Controladores para endpoints de pagos y morosidad
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.actualizarPago = exports.obtenerPago = exports.obtenerPagosRecientes = exports.actualizarMora = exports.obtenerEstadoPagos = exports.registrarPago = void 0;
const types_1 = require("../types");
const pagos_service_1 = __importDefault(require("../services/pagos.service"));
const responses_1 = require("../utils/responses");
/**
 * POST /api/v1/pagos
 * Registrar pago a un crédito
 */
const registrarPago = async (req, res, next) => {
    try {
        const { creditoId, montoPagado, metodoPago, numeroReferencia, concepto, fechaPago, } = req.body;
        // Validación básica
        if (!creditoId || !montoPagado || !metodoPago) {
            throw new Error('creditoId, montoPagado y metodoPago son requeridos');
        }
        // Validar método de pago
        if (!Object.values(types_1.MetodoPago).includes(metodoPago)) {
            throw new Error(`Método de pago inválido. Valores permitidos: ${Object.values(types_1.MetodoPago).join(', ')}`);
        }
        // CORRECCIÓN: Procesar fecha correctamente para evitar problemas de zona horaria
        // Si se recibe "2025-01-16", debe interpretarse como 2025-01-16 en hora local, no UTC
        let fechaPagoProcessed;
        if (fechaPago) {
            // Si viene en formato ISO (YYYY-MM-DD), agregar hora local para evitar cambio de día
            if (typeof fechaPago === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaPago)) {
                fechaPagoProcessed = new Date(fechaPago + 'T12:00:00');
            }
            else {
                fechaPagoProcessed = new Date(fechaPago);
            }
        }
        const resultado = await pagos_service_1.default.registrarPago({
            creditoId: parseInt(creditoId, 10),
            montoPagado: parseFloat(montoPagado),
            metodoPago,
            numeroReferencia,
            concepto,
            fechaPago: fechaPagoProcessed,
        }, req.user?.id);
        (0, responses_1.sendCreated)(res, resultado, 'Pago registrado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.registrarPago = registrarPago;
/**
 * GET /api/v1/pagos/credito/:creditoId
 * Obtener estado de pagos de un crédito
 */
const obtenerEstadoPagos = async (req, res, next) => {
    try {
        const { creditoId } = req.params;
        const estado = await pagos_service_1.default.obtenerEstadoPagos(parseInt(creditoId, 10));
        (0, responses_1.sendSuccess)(res, estado);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerEstadoPagos = obtenerEstadoPagos;
/**
 * POST /api/v1/pagos/credito/:creditoId/actualizar-mora
 * Actualizar mora de un crédito
 */
const actualizarMora = async (req, res, next) => {
    try {
        const { creditoId } = req.params;
        await pagos_service_1.default.actualizarMoraCredito(parseInt(creditoId, 10));
        (0, responses_1.sendSuccess)(res, null, 'Mora actualizada exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.actualizarMora = actualizarMora;
/**
 * GET /api/v1/pagos/recientes
 * Obtener pagos recientes del sistema
 */
const obtenerPagosRecientes = async (req, res, next) => {
    try {
        const limite = req.query.limite ? parseInt(req.query.limite, 10) : 15;
        const pagos = await pagos_service_1.default.obtenerPagosRecientes(limite);
        (0, responses_1.sendSuccess)(res, pagos);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerPagosRecientes = obtenerPagosRecientes;
/**
 * GET /api/v1/pagos/:id
 * Obtener pago por ID
 */
const obtenerPago = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pago = await pagos_service_1.default.obtenerPago(parseInt(id, 10));
        (0, responses_1.sendSuccess)(res, pago);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerPago = obtenerPago;
/**
 * PUT /api/v1/pagos/:id
 * Actualizar pago (solo dentro de 7 días)
 */
const actualizarPago = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const pago = await pagos_service_1.default.actualizarPago(parseInt(id, 10), data, req.user?.id);
        (0, responses_1.sendSuccess)(res, pago, 'Pago actualizado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.actualizarPago = actualizarPago;
//# sourceMappingURL=pagos.controller.js.map