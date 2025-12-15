"use strict";
/**
 * ============================================================================
 * Sistema MLF - Controlador de Garantías
 * Archivo: src/controllers/garantias.controller.ts
 * Descripción: Controladores para endpoints de garantías cruzadas
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ejecutarGarantia = exports.rechazarLiberacion = exports.aprobarLiberacion = exports.solicitarLiberacion = exports.listarGarantias = exports.obtenerGarantia = exports.crearGarantias = void 0;
const garantias_service_1 = __importDefault(require("../services/garantias.service"));
const responses_1 = require("../utils/responses");
/**
 * POST /api/v1/garantias
 * Crear garantías para un crédito (requiere 2 garantes)
 */
const crearGarantias = async (req, res, next) => {
    try {
        const { creditoId, garantesIds } = req.body;
        // Validación básica
        if (!creditoId || !garantesIds || !Array.isArray(garantesIds)) {
            throw new Error('creditoId y garantesIds (array) son requeridos');
        }
        const garantias = await garantias_service_1.default.crearGarantias({ creditoId, garantesIds }, req.user?.id);
        (0, responses_1.sendCreated)(res, garantias, 'Garantías creadas exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.crearGarantias = crearGarantias;
/**
 * GET /api/v1/garantias/:id
 * Obtener garantía por ID
 */
const obtenerGarantia = async (req, res, next) => {
    try {
        const { id } = req.params;
        const garantia = await garantias_service_1.default.obtenerGarantiaPorId(parseInt(id, 10));
        (0, responses_1.sendSuccess)(res, garantia);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerGarantia = obtenerGarantia;
/**
 * GET /api/v1/garantias
 * Listar garantías con filtros y paginación
 */
const listarGarantias = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', garanteId, creditoId, estado, } = req.query;
        const resultado = await garantias_service_1.default.listarGarantias({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            garanteId: garanteId ? parseInt(garanteId, 10) : undefined,
            creditoId: creditoId ? parseInt(creditoId, 10) : undefined,
            estado: estado,
        });
        (0, responses_1.sendPaginated)(res, resultado.garantias, resultado.page, resultado.limit, resultado.total);
    }
    catch (error) {
        next(error);
    }
};
exports.listarGarantias = listarGarantias;
/**
 * POST /api/v1/garantias/:id/solicitar-liberacion
 * Solicitar liberación de garantía
 */
const solicitarLiberacion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { motivoSolicitud } = req.body;
        if (!motivoSolicitud) {
            throw new Error('El motivo de solicitud es requerido');
        }
        const solicitud = await garantias_service_1.default.solicitarLiberacion({
            garantiaId: parseInt(id, 10),
            motivoSolicitud,
        }, req.user?.id);
        (0, responses_1.sendCreated)(res, solicitud, 'Solicitud de liberación creada');
    }
    catch (error) {
        next(error);
    }
};
exports.solicitarLiberacion = solicitarLiberacion;
/**
 * POST /api/v1/garantias/liberaciones/:id/aprobar
 * Aprobar solicitud de liberación
 */
const aprobarLiberacion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { observaciones } = req.body;
        const resultado = await garantias_service_1.default.aprobarLiberacion({
            liberacionId: parseInt(id, 10),
            observaciones,
        }, req.user?.id);
        (0, responses_1.sendSuccess)(res, resultado, 'Liberación aprobada exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.aprobarLiberacion = aprobarLiberacion;
/**
 * POST /api/v1/garantias/liberaciones/:id/rechazar
 * Rechazar solicitud de liberación
 */
const rechazarLiberacion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { motivoRechazo } = req.body;
        if (!motivoRechazo) {
            throw new Error('El motivo de rechazo es requerido');
        }
        const resultado = await garantias_service_1.default.rechazarLiberacion({
            liberacionId: parseInt(id, 10),
            motivoRechazo,
        }, req.user?.id);
        (0, responses_1.sendSuccess)(res, resultado, 'Liberación rechazada');
    }
    catch (error) {
        next(error);
    }
};
exports.rechazarLiberacion = rechazarLiberacion;
/**
 * POST /api/v1/garantias/:id/ejecutar
 * Ejecutar garantía (mora 90+ días)
 */
const ejecutarGarantia = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { motivoEjecucion } = req.body;
        if (!motivoEjecucion) {
            throw new Error('El motivo de ejecución es requerido');
        }
        const resultado = await garantias_service_1.default.ejecutarGarantia({
            garantiaId: parseInt(id, 10),
            motivoEjecucion,
        }, req.user?.id);
        (0, responses_1.sendSuccess)(res, resultado, 'Garantía ejecutada');
    }
    catch (error) {
        next(error);
    }
};
exports.ejecutarGarantia = ejecutarGarantia;
//# sourceMappingURL=garantias.controller.js.map