"use strict";
/**
 * ============================================================================
 * Sistema MLF - Controlador de Métricas
 * Archivo: src/controllers/metricas.controller.ts
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerMetricasDashboard = void 0;
const metricas_service_1 = __importDefault(require("../services/metricas.service"));
const responses_1 = require("../utils/responses");
/**
 * GET /api/v1/metricas/dashboard
 * Obtener métricas completas del dashboard
 */
const obtenerMetricasDashboard = async (req, res, next) => {
    try {
        const { periodo } = req.query;
        let filtro;
        if (periodo && typeof periodo === 'string') {
            if (['dia', 'semana', 'mes', 'año'].includes(periodo)) {
                filtro = metricas_service_1.default.obtenerPeriodo(periodo);
            }
        }
        const metricas = await metricas_service_1.default.obtenerMetricasCompletas(filtro);
        (0, responses_1.sendSuccess)(res, metricas);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerMetricasDashboard = obtenerMetricasDashboard;
//# sourceMappingURL=metricas.controller.js.map