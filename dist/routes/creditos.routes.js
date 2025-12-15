"use strict";
/**
 * ============================================================================
 * Sistema MLF - Rutas de Créditos
 * Archivo: src/routes/creditos.routes.ts
 * Descripción: Definición de rutas para gestión de créditos
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
const creditosController = __importStar(require("../controllers/creditos.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/creditos
 * @desc    Solicitar nuevo crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, creditosController.solicitarCredito);
/**
 * @route   GET /api/v1/creditos
 * @desc    Listar créditos con filtros y paginación
 * @access  Private (ADMIN, OPERADOR)
 */
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, creditosController.listarCreditos);
/**
 * @route   GET /api/v1/creditos/:id
 * @desc    Obtener crédito por ID
 * @access  Private (Dueño del crédito o ADMIN/OPERADOR)
 * @note    Se valida que el usuario sea dueño del crédito o tenga rol administrativo
 */
router.get('/:id', auth_middleware_1.authenticate, 
// requireAdminOrOperator, -> Validado en controlador
creditosController.obtenerCredito);
/**
 * @route   PUT /api/v1/creditos/:id
 * @desc    Actualizar crédito (solo SOLICITADO)
 * @access  Private (ADMIN, OPERADOR)
 */
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, creditosController.actualizarCredito);
/**
 * @route   POST /api/v1/creditos/:id/aprobar
 * @desc    Aprobar solicitud de crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/:id/aprobar', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, creditosController.aprobarCredito);
/**
 * @route   POST /api/v1/creditos/:id/desembolsar
 * @desc    Desembolsar crédito aprobado y generar tabla de amortización
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/:id/desembolsar', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, creditosController.desembolsarCredito);
/**
 * @route   POST /api/v1/creditos/:id/rechazar
 * @desc    Rechazar solicitud de crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/:id/rechazar', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, creditosController.rechazarCredito);
/**
 * @route   GET /api/v1/creditos/:id/amortizacion
 * @desc    Obtener tabla de amortización del crédito
 * @access  Private (Dueño del crédito o ADMIN/OPERADOR)
 */
router.get('/:id/amortizacion', auth_middleware_1.authenticate, 
// requireAdminOrOperator, -> Validado en controlador
creditosController.obtenerTablaAmortizacion);
/**
 * @route   GET /api/v1/creditos/:id/estado-cuenta
 * @desc    Obtener estado de cuenta detallado del crédito
 * @access  Private (Dueño del crédito o ADMIN/OPERADOR)
 */
router.get('/:id/estado-cuenta', auth_middleware_1.authenticate, 
// requireAdminOrOperator, -> Validado en controlador
creditosController.obtenerEstadoCuenta);
exports.default = router;
//# sourceMappingURL=creditos.routes.js.map