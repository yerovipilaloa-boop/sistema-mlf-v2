"use strict";
/**
 * ============================================================================
 * Sistema MLF - Rutas de Utilidades
 * Archivo: src/routes/utilidades.routes.ts
 * Descripción: Definición de rutas para utilidades semestrales
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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const utilidadesController = __importStar(require("../controllers/utilidades.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/utilidades/calcular
 * @desc    Calcular utilidades para un período semestral
 * @access  Private (ADMIN)
 */
router.post('/calcular', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, utilidadesController.calcularUtilidades);
/**
 * @route   POST /api/v1/utilidades/:id/distribuir
 * @desc    Distribuir (acreditar) utilidades calculadas a socios
 * @access  Private (ADMIN)
 */
router.post('/:id/distribuir', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, utilidadesController.distribuirUtilidades);
/**
 * @route   GET /api/v1/utilidades
 * @desc    Listar utilidades con filtros
 * @access  Private (ADMIN, OPERADOR)
 */
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, utilidadesController.listarUtilidades);
/**
 * @route   GET /api/v1/utilidades/:id
 * @desc    Obtener utilidad por ID con detalles
 * @access  Private (ADMIN, OPERADOR)
 */
router.get('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, utilidadesController.obtenerUtilidad);
/**
 * @route   GET /api/v1/utilidades/socio/:socioId/historial
 * @desc    Obtener historial de utilidades de un socio
 * @access  Private (ADMIN, OPERADOR, Dueño)
 */
router.get('/socio/:socioId/historial', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, // TODO: Permitir también al socio dueño
utilidadesController.obtenerHistorialUtilidades);
exports.default = router;
//# sourceMappingURL=utilidades.routes.js.map