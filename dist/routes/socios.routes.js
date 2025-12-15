"use strict";
/**
 * ============================================================================
 * Sistema MLF - Rutas de Socios
 * Archivo: src/routes/socios.routes.ts
 * Descripción: Definición de rutas para gestión de socios
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
const express_1 = require("express");
const sociosController = __importStar(require("../controllers/socios.controller"));
const dashboard_socio_controller_1 = __importDefault(require("../controllers/dashboard-socio.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// ============================================================================
// RUTAS DEL DASHBOARD DEL SOCIO (deben ir antes de /:id para evitar conflictos)
// ============================================================================
/**
 * @route   GET /api/v1/socios/me/dashboard
 * @desc    Obtener dashboard completo del socio autenticado
 * @access  Private (SOCIO)
 */
router.get('/me/dashboard', auth_middleware_1.authenticate, dashboard_socio_controller_1.default.obtenerMiDashboard);
/**
 * @route   GET /api/v1/socios/me/info
 * @desc    Obtener información personal del socio autenticado
 * @access  Private (SOCIO)
 */
router.get('/me/info', auth_middleware_1.authenticate, dashboard_socio_controller_1.default.obtenerMiInfo);
/**
 * @route   GET /api/v1/socios/me/creditos
 * @desc    Obtener créditos del socio autenticado
 * @access  Private (SOCIO)
 */
router.get('/me/creditos', auth_middleware_1.authenticate, dashboard_socio_controller_1.default.obtenerMisCreditos);
/**
 * @route   GET /api/v1/socios/me/ahorros
 * @desc    Obtener ahorros del socio autenticado
 * @access  Private (SOCIO)
 */
router.get('/me/ahorros', auth_middleware_1.authenticate, dashboard_socio_controller_1.default.obtenerMisAhorros);
/**
 * @route   GET /api/v1/socios/me/historial
 * @desc    Obtener historial de movimientos del socio autenticado
 * @access  Private (SOCIO)
 */
router.get('/me/historial', auth_middleware_1.authenticate, dashboard_socio_controller_1.default.obtenerMiHistorial);
/**
 * @route   GET /api/v1/socios/me/limite-credito
 * @desc    Obtener información del límite de crédito disponible
 * @access  Private (SOCIO)
 */
router.get('/me/limite-credito', auth_middleware_1.authenticate, dashboard_socio_controller_1.default.obtenerMiLimiteCredito);
/**
 * @route   POST /api/v1/socios/me/solicitar-credito
 * @desc    Solicitar un nuevo crédito (el socio para sí mismo)
 * @access  Private (SOCIO)
 */
router.post('/me/solicitar-credito', auth_middleware_1.authenticate, dashboard_socio_controller_1.default.solicitarMiCredito);
/**
 * @route   POST /api/v1/socios/me/solicitar-deposito
 * @desc    Solicitar un depósito de ahorro (pendiente de aprobación)
 * @access  Private (SOCIO)
 */
router.post('/me/solicitar-deposito', auth_middleware_1.authenticate, dashboard_socio_controller_1.default.solicitarDeposito);
/**
 * @route   POST /api/v1/socios/me/solicitar-retiro
 * @desc    Solicitar un retiro de ahorro (pendiente de aprobación)
 * @access  Private (SOCIO)
 */
router.post('/me/solicitar-retiro', auth_middleware_1.authenticate, dashboard_socio_controller_1.default.solicitarRetiro);
/**
 * @route   POST /api/v1/socios/me/solicitar-pago
 * @desc    Registrar un reporte de pago de cuota
 * @access  Private (SOCIO)
 */
router.post('/me/solicitar-pago', auth_middleware_1.authenticate, dashboard_socio_controller_1.default.solicitarPago);
// ============================================================================
// RUTAS ADMINISTRATIVAS DE SOCIOS
// ============================================================================
/**
 * @route   POST /api/v1/socios
 * @desc    Crear nuevo socio
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, sociosController.crearSocio);
/**
 * @route   GET /api/v1/socios
 * @desc    Listar socios con filtros y paginación
 * @access  Private (ADMIN, OPERADOR)
 */
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, sociosController.listarSocios);
/**
 * @route   GET /api/v1/socios/:id
 * @desc    Obtener socio por ID
 * @access  Private (Dueño del recurso o ADMIN/OPERADOR)
 */
router.get('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireOwnerOrAdmin)('id'), sociosController.obtenerSocio);
/**
 * @route   GET /api/v1/socios/codigo/:codigo
 * @desc    Obtener socio por código
 * @access  Private (ADMIN, OPERADOR)
 */
router.get('/codigo/:codigo', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, sociosController.obtenerSocioPorCodigo);
/**
 * @route   PUT /api/v1/socios/:id
 * @desc    Actualizar información del socio
 * @access  Private (Dueño del recurso o ADMIN/OPERADOR)
 */
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireOwnerOrAdmin)('id'), sociosController.actualizarSocio);
/**
 * @route   POST /api/v1/socios/:id/depositar
 * @desc    Depositar ahorro
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/:id/depositar', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, sociosController.depositarAhorro);
/**
 * @route   POST /api/v1/socios/:id/retirar
 * @desc    Retirar ahorro
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/:id/retirar', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, sociosController.retirarAhorro);
/**
 * @route   POST /api/v1/socios/:id/cambiar-etapa
 * @desc    Cambiar etapa del socio
 * @access  Private (ADMIN)
 */
router.post('/:id/cambiar-etapa', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, sociosController.cambiarEtapa);
/**
 * @route   POST /api/v1/socios/:id/suspender
 * @desc    Suspender socio
 * @access  Private (ADMIN)
 */
router.post('/:id/suspender', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, sociosController.suspenderSocio);
/**
 * @route   POST /api/v1/socios/:id/reactivar
 * @desc    Reactivar socio
 * @access  Private (ADMIN)
 */
router.post('/:id/reactivar', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, sociosController.reactivarSocio);
/**
 * @route   GET /api/v1/socios/:id/historial-transacciones
 * @desc    Obtener historial de transacciones
 * @access  Private (Dueño del recurso o ADMIN/OPERADOR)
 */
router.get('/:id/historial-transacciones', auth_middleware_1.authenticate, (0, auth_middleware_1.requireOwnerOrAdmin)('id'), sociosController.obtenerHistorialTransacciones);
exports.default = router;
//# sourceMappingURL=socios.routes.js.map