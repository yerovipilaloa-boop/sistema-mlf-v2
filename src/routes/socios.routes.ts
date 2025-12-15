/**
 * ============================================================================
 * Sistema MLF - Rutas de Socios
 * Archivo: src/routes/socios.routes.ts
 * Descripción: Definición de rutas para gestión de socios
 * ============================================================================
 */

import { Router } from 'express';
import * as sociosController from '../controllers/socios.controller';
import dashboardSocioController from '../controllers/dashboard-socio.controller';
import {
  authenticate,
  requireAdmin,
  requireAdminOrOperator,
  requireOwnerOrAdmin,
} from '../middlewares/auth.middleware';

const router = Router();

// ============================================================================
// RUTAS DEL DASHBOARD DEL SOCIO (deben ir antes de /:id para evitar conflictos)
// ============================================================================

/**
 * @route   GET /api/v1/socios/me/dashboard
 * @desc    Obtener dashboard completo del socio autenticado
 * @access  Private (SOCIO)
 */
router.get('/me/dashboard', authenticate, dashboardSocioController.obtenerMiDashboard);

/**
 * @route   GET /api/v1/socios/me/info
 * @desc    Obtener información personal del socio autenticado
 * @access  Private (SOCIO)
 */
router.get('/me/info', authenticate, dashboardSocioController.obtenerMiInfo);

/**
 * @route   GET /api/v1/socios/me/creditos
 * @desc    Obtener créditos del socio autenticado
 * @access  Private (SOCIO)
 */
router.get('/me/creditos', authenticate, dashboardSocioController.obtenerMisCreditos);

/**
 * @route   GET /api/v1/socios/me/ahorros
 * @desc    Obtener ahorros del socio autenticado
 * @access  Private (SOCIO)
 */
router.get('/me/ahorros', authenticate, dashboardSocioController.obtenerMisAhorros);

/**
 * @route   GET /api/v1/socios/me/historial
 * @desc    Obtener historial de movimientos del socio autenticado
 * @access  Private (SOCIO)
 */
router.get('/me/historial', authenticate, dashboardSocioController.obtenerMiHistorial);

/**
 * @route   GET /api/v1/socios/me/limite-credito
 * @desc    Obtener información del límite de crédito disponible
 * @access  Private (SOCIO)
 */
router.get('/me/limite-credito', authenticate, dashboardSocioController.obtenerMiLimiteCredito);

/**
 * @route   POST /api/v1/socios/me/solicitar-credito
 * @desc    Solicitar un nuevo crédito (el socio para sí mismo)
 * @access  Private (SOCIO)
 */
router.post('/me/solicitar-credito', authenticate, dashboardSocioController.solicitarMiCredito);

/**
 * @route   POST /api/v1/socios/me/solicitar-deposito
 * @desc    Solicitar un depósito de ahorro (pendiente de aprobación)
 * @access  Private (SOCIO)
 */
router.post('/me/solicitar-deposito', authenticate, dashboardSocioController.solicitarDeposito);

/**
 * @route   POST /api/v1/socios/me/solicitar-retiro
 * @desc    Solicitar un retiro de ahorro (pendiente de aprobación)
 * @access  Private (SOCIO)
 */
router.post('/me/solicitar-retiro', authenticate, dashboardSocioController.solicitarRetiro);

/**
 * @route   POST /api/v1/socios/me/solicitar-pago
 * @desc    Registrar un reporte de pago de cuota
 * @access  Private (SOCIO)
 */
router.post('/me/solicitar-pago', authenticate, dashboardSocioController.solicitarPago);

// ============================================================================
// RUTAS ADMINISTRATIVAS DE SOCIOS
// ============================================================================

/**
 * @route   POST /api/v1/socios
 * @desc    Crear nuevo socio
 * @access  Private (ADMIN, OPERADOR)
 */
router.post('/', authenticate, requireAdminOrOperator, sociosController.crearSocio);

/**
 * @route   GET /api/v1/socios
 * @desc    Listar socios con filtros y paginación
 * @access  Private (ADMIN, OPERADOR)
 */
router.get('/', authenticate, requireAdminOrOperator, sociosController.listarSocios);

/**
 * @route   GET /api/v1/socios/:id
 * @desc    Obtener socio por ID
 * @access  Private (Dueño del recurso o ADMIN/OPERADOR)
 */
router.get('/:id', authenticate, requireOwnerOrAdmin('id'), sociosController.obtenerSocio);

/**
 * @route   GET /api/v1/socios/codigo/:codigo
 * @desc    Obtener socio por código
 * @access  Private (ADMIN, OPERADOR)
 */
router.get(
  '/codigo/:codigo',
  authenticate,
  requireAdminOrOperator,
  sociosController.obtenerSocioPorCodigo
);

/**
 * @route   PUT /api/v1/socios/:id
 * @desc    Actualizar información del socio
 * @access  Private (Dueño del recurso o ADMIN/OPERADOR)
 */
router.put(
  '/:id',
  authenticate,
  requireOwnerOrAdmin('id'),
  sociosController.actualizarSocio
);

/**
 * @route   POST /api/v1/socios/:id/depositar
 * @desc    Depositar ahorro
 * @access  Private (ADMIN, OPERADOR)
 */
router.post(
  '/:id/depositar',
  authenticate,
  requireAdminOrOperator,
  sociosController.depositarAhorro
);

/**
 * @route   POST /api/v1/socios/:id/retirar
 * @desc    Retirar ahorro
 * @access  Private (ADMIN, OPERADOR)
 */
router.post(
  '/:id/retirar',
  authenticate,
  requireAdminOrOperator,
  sociosController.retirarAhorro
);

/**
 * @route   POST /api/v1/socios/:id/cambiar-etapa
 * @desc    Cambiar etapa del socio
 * @access  Private (ADMIN)
 */
router.post(
  '/:id/cambiar-etapa',
  authenticate,
  requireAdmin,
  sociosController.cambiarEtapa
);

/**
 * @route   POST /api/v1/socios/:id/suspender
 * @desc    Suspender socio
 * @access  Private (ADMIN)
 */
router.post(
  '/:id/suspender',
  authenticate,
  requireAdmin,
  sociosController.suspenderSocio
);

/**
 * @route   POST /api/v1/socios/:id/reactivar
 * @desc    Reactivar socio
 * @access  Private (ADMIN)
 */
router.post(
  '/:id/reactivar',
  authenticate,
  requireAdmin,
  sociosController.reactivarSocio
);

/**
 * @route   GET /api/v1/socios/:id/historial-transacciones
 * @desc    Obtener historial de transacciones
 * @access  Private (Dueño del recurso o ADMIN/OPERADOR)
 */
router.get(
  '/:id/historial-transacciones',
  authenticate,
  requireOwnerOrAdmin('id'),
  sociosController.obtenerHistorialTransacciones
);

export default router;
