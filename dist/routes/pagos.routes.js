"use strict";
/**
 * ============================================================================
 * Sistema MLF - Rutas de Pagos
 * Archivo: src/routes/pagos.routes.ts
 * Descripción: Definición de rutas para pagos y morosidad
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
const pagosController = __importStar(require("../controllers/pagos.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/v1/pagos/recientes
 * @desc    Obtener pagos recientes del sistema
 * @access  Private (ADMIN, OPERADOR)
 */
router.get('/recientes', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, pagosController.obtenerPagosRecientes);
/**
 * @route   POST /api/v1/pagos
 * @desc    Registrar pago a un crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, pagosController.registrarPago);
/**
 * @route   GET /api/v1/pagos/:id
 * @desc    Obtener pago por ID
 * @access  Private (ADMIN, OPERADOR)
 */
router.get('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, pagosController.obtenerPago);
/**
 * @route   PUT /api/v1/pagos/:id
 * @desc    Actualizar pago (solo dentro de 7 días)
 * @access  Private (ADMIN, OPERADOR)
 */
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, pagosController.actualizarPago);
/**
 * @route   GET /api/v1/pagos/credito/:creditoId
 * @desc    Obtener estado de pagos de un crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.get('/credito/:creditoId', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, pagosController.obtenerEstadoPagos);
/**
 * @route   POST /api/v1/pagos/credito/:creditoId/actualizar-mora
 * @desc    Actualizar cálculo de mora de un crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/credito/:creditoId/actualizar-mora', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, pagosController.actualizarMora);
exports.default = router;
//# sourceMappingURL=pagos.routes.js.map