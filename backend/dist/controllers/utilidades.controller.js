"use strict";
/**
 * ============================================================================
 * Sistema MLF - Controlador de Utilidades
 * Archivo: src/controllers/utilidades.controller.ts
 * Descripción: Controladores para cálculo y distribución de utilidades
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerHistorialUtilidades = exports.listarUtilidades = exports.obtenerUtilidad = exports.distribuirUtilidades = exports.calcularUtilidades = void 0;
const utilidades_service_1 = __importDefault(require("../services/utilidades.service"));
const responses_1 = require("../utils/responses");
/**
 * POST /api/v1/utilidades/calcular
 * Calcular utilidades para un período semestral
 */
const calcularUtilidades = async (req, res, next) => {
    try {
        const { año, semestre } = req.body;
        // Validación básica
        if (!año || !semestre) {
            throw new Error('año y semestre son requeridos');
        }
        const resultado = await utilidades_service_1.default.calcularUtilidades({
            año: parseInt(año, 10),
            semestre: parseInt(semestre, 10),
        }, req.user?.id);
        (0, responses_1.sendCreated)(res, resultado, 'Utilidades calculadas exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.calcularUtilidades = calcularUtilidades;
/**
 * POST /api/v1/utilidades/:id/distribuir
 * Distribuir (acreditar) utilidades calculadas
 */
const distribuirUtilidades = async (req, res, next) => {
    try {
        const { id } = req.params;
        const resultado = await utilidades_service_1.default.distribuirUtilidades({
            utilidadId: parseInt(id, 10),
        }, req.user?.id);
        (0, responses_1.sendSuccess)(res, resultado, 'Utilidades distribuidas exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.distribuirUtilidades = distribuirUtilidades;
/**
 * GET /api/v1/utilidades/:id
 * Obtener utilidad por ID con detalles
 */
const obtenerUtilidad = async (req, res, next) => {
    try {
        const { id } = req.params;
        const utilidad = await utilidades_service_1.default.obtenerUtilidadPorId(parseInt(id, 10));
        (0, responses_1.sendSuccess)(res, utilidad);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerUtilidad = obtenerUtilidad;
/**
 * GET /api/v1/utilidades
 * Listar utilidades con filtros
 */
const listarUtilidades = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', año, semestre, estado, } = req.query;
        const resultado = await utilidades_service_1.default.listarUtilidades({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            año: año ? parseInt(año, 10) : undefined,
            semestre: semestre ? parseInt(semestre, 10) : undefined,
            estado: estado,
        });
        (0, responses_1.sendPaginated)(res, resultado.utilidades, resultado.page, resultado.limit, resultado.total);
    }
    catch (error) {
        next(error);
    }
};
exports.listarUtilidades = listarUtilidades;
/**
 * GET /api/v1/utilidades/socio/:socioId/historial
 * Obtener historial de utilidades de un socio
 */
const obtenerHistorialUtilidades = async (req, res, next) => {
    try {
        const { socioId } = req.params;
        const historial = await utilidades_service_1.default.obtenerHistorialUtilidades(parseInt(socioId, 10));
        (0, responses_1.sendSuccess)(res, historial);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerHistorialUtilidades = obtenerHistorialUtilidades;
//# sourceMappingURL=utilidades.controller.js.map