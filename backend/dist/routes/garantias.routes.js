"use strict";
/**
 * ============================================================================
 * Sistema MLF - Rutas de Garantías
 * Archivo: src/routes/garantias.routes.ts
 * Descripción: Definición de rutas para sistema de garantías cruzadas
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
const garantiasController = __importStar(require("../controllers/garantias.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/garantias
 * @desc    Crear garantías para un crédito (2 garantes requeridos)
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, garantiasController.crearGarantias);
/**
 * @route   GET /api/v1/garantias
 * @desc    Listar garantías con filtros y paginación
 * @access  Private (ADMIN, OPERADOR)
 */
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, garantiasController.listarGarantias);
/**
 * @route   GET /api/v1/garantias/:id
 * @desc    Obtener garantía por ID
 * @access  Private (ADMIN, OPERADOR)
 */
router.get('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, garantiasController.obtenerGarantia);
/**
 * @route   POST /api/v1/garantias/:id/solicitar-liberacion
 * @desc    Solicitar liberación de garantía (requiere 50% completado + sin moras)
 * @access  Private (ADMIN, OPERADOR, Garante)
 */
router.post('/:id/solicitar-liberacion', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, // TODO: Permitir también al garante dueño
garantiasController.solicitarLiberacion);
/**
 * @route   POST /api/v1/garantias/liberaciones/:id/aprobar
 * @desc    Aprobar solicitud de liberación
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/liberaciones/:id/aprobar', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, garantiasController.aprobarLiberacion);
/**
 * @route   POST /api/v1/garantias/liberaciones/:id/rechazar
 * @desc    Rechazar solicitud de liberación
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/liberaciones/:id/rechazar', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, garantiasController.rechazarLiberacion);
/**
 * @route   POST /api/v1/garantias/:id/ejecutar
 * @desc    Ejecutar garantía (mora 90+ días)
 * @access  Private (ADMIN)
 */
router.post('/:id/ejecutar', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, garantiasController.ejecutarGarantia);
exports.default = router;
//# sourceMappingURL=garantias.routes.js.map