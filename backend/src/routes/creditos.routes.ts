/**
 * ============================================================================
 * Sistema MLF - Rutas de Créditos
 * Archivo: src/routes/creditos.routes.ts
 * Descripción: Definición de rutas para gestión de créditos
 * ============================================================================
 */

import { Router } from 'express';
import * as creditosController from '../controllers/creditos.controller';
import {
  authenticate,
  requireAdmin,
  requireAdminOrOperator,
  requireOwnerOrAdmin,
} from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/creditos
 * @desc    Solicitar nuevo crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.post(
  '/',
  authenticate,
  requireAdminOrOperator,
  creditosController.solicitarCredito
);

/**
 * @route   GET /api/v1/creditos
 * @desc    Listar créditos con filtros y paginación
 * @access  Private (ADMIN, OPERADOR)
 */
router.get(
  '/',
  authenticate,
  requireAdminOrOperator,
  creditosController.listarCreditos
);

/**
 * @route   GET /api/v1/creditos/:id
 * @desc    Obtener crédito por ID
 * @access  Private (Dueño del crédito o ADMIN/OPERADOR)
 * @note    Se valida que el usuario sea dueño del crédito o tenga rol administrativo
 */
router.get(
  '/:id',
  authenticate,
  // requireAdminOrOperator, -> Validado en controlador
  creditosController.obtenerCredito
);

/**
 * @route   PUT /api/v1/creditos/:id
 * @desc    Actualizar crédito (solo SOLICITADO)
 * @access  Private (ADMIN, OPERADOR)
 */
router.put(
  '/:id',
  authenticate,
  requireAdminOrOperator,
  creditosController.actualizarCredito
);

/**
 * @route   POST /api/v1/creditos/:id/aprobar
 * @desc    Aprobar solicitud de crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.post(
  '/:id/aprobar',
  authenticate,
  requireAdminOrOperator,
  creditosController.aprobarCredito
);

/**
 * @route   POST /api/v1/creditos/:id/desembolsar
 * @desc    Desembolsar crédito aprobado y generar tabla de amortización
 * @access  Private (ADMIN, OPERADOR)
 */
router.post(
  '/:id/desembolsar',
  authenticate,
  requireAdminOrOperator,
  creditosController.desembolsarCredito
);

/**
 * @route   POST /api/v1/creditos/:id/rechazar
 * @desc    Rechazar solicitud de crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.post(
  '/:id/rechazar',
  authenticate,
  requireAdminOrOperator,
  creditosController.rechazarCredito
);

/**
 * @route   GET /api/v1/creditos/:id/amortizacion
 * @desc    Obtener tabla de amortización del crédito
 * @access  Private (Dueño del crédito o ADMIN/OPERADOR)
 */
router.get(
  '/:id/amortizacion',
  authenticate,
  // requireAdminOrOperator, -> Validado en controlador
  creditosController.obtenerTablaAmortizacion
);

/**
 * @route   GET /api/v1/creditos/:id/estado-cuenta
 * @desc    Obtener estado de cuenta detallado del crédito
 * @access  Private (Dueño del crédito o ADMIN/OPERADOR)
 */
router.get(
  '/:id/estado-cuenta',
  authenticate,
  // requireAdminOrOperator, -> Validado en controlador
  creditosController.obtenerEstadoCuenta
);

export default router;
