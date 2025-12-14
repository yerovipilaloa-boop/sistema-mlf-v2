/**
 * ============================================================================
 * Sistema MLF - Rutas de Pagos
 * Archivo: src/routes/pagos.routes.ts
 * Descripción: Definición de rutas para pagos y morosidad
 * ============================================================================
 */

import { Router } from 'express';
import * as pagosController from '../controllers/pagos.controller';
import {
  authenticate,
  requireAdminOrOperator,
} from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/pagos/recientes
 * @desc    Obtener pagos recientes del sistema
 * @access  Private (ADMIN, OPERADOR)
 */
router.get(
  '/recientes',
  authenticate,
  requireAdminOrOperator,
  pagosController.obtenerPagosRecientes
);

/**
 * @route   POST /api/v1/pagos
 * @desc    Registrar pago a un crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.post(
  '/',
  authenticate,
  requireAdminOrOperator,
  pagosController.registrarPago
);

/**
 * @route   GET /api/v1/pagos/:id
 * @desc    Obtener pago por ID
 * @access  Private (ADMIN, OPERADOR)
 */
router.get(
  '/:id',
  authenticate,
  requireAdminOrOperator,
  pagosController.obtenerPago
);

/**
 * @route   PUT /api/v1/pagos/:id
 * @desc    Actualizar pago (solo dentro de 7 días)
 * @access  Private (ADMIN, OPERADOR)
 */
router.put(
  '/:id',
  authenticate,
  requireAdminOrOperator,
  pagosController.actualizarPago
);

/**
 * @route   GET /api/v1/pagos/credito/:creditoId
 * @desc    Obtener estado de pagos de un crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.get(
  '/credito/:creditoId',
  authenticate,
  requireAdminOrOperator,
  pagosController.obtenerEstadoPagos
);

/**
 * @route   POST /api/v1/pagos/credito/:creditoId/actualizar-mora
 * @desc    Actualizar cálculo de mora de un crédito
 * @access  Private (ADMIN, OPERADOR)
 */
router.post(
  '/credito/:creditoId/actualizar-mora',
  authenticate,
  requireAdminOrOperator,
  pagosController.actualizarMora
);

export default router;
