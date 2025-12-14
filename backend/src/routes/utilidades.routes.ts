/**
 * ============================================================================
 * Sistema MLF - Rutas de Utilidades
 * Archivo: src/routes/utilidades.routes.ts
 * Descripción: Definición de rutas para utilidades semestrales
 * ============================================================================
 */

import { Router } from 'express';
import * as utilidadesController from '../controllers/utilidades.controller';
import {
  authenticate,
  requireAdmin,
  requireAdminOrOperator,
} from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/utilidades/calcular
 * @desc    Calcular utilidades para un período semestral
 * @access  Private (ADMIN)
 */
router.post(
  '/calcular',
  authenticate,
  requireAdmin,
  utilidadesController.calcularUtilidades
);

/**
 * @route   POST /api/v1/utilidades/:id/distribuir
 * @desc    Distribuir (acreditar) utilidades calculadas a socios
 * @access  Private (ADMIN)
 */
router.post(
  '/:id/distribuir',
  authenticate,
  requireAdmin,
  utilidadesController.distribuirUtilidades
);

/**
 * @route   GET /api/v1/utilidades
 * @desc    Listar utilidades con filtros
 * @access  Private (ADMIN, OPERADOR)
 */
router.get(
  '/',
  authenticate,
  requireAdminOrOperator,
  utilidadesController.listarUtilidades
);

/**
 * @route   GET /api/v1/utilidades/:id
 * @desc    Obtener utilidad por ID con detalles
 * @access  Private (ADMIN, OPERADOR)
 */
router.get(
  '/:id',
  authenticate,
  requireAdminOrOperator,
  utilidadesController.obtenerUtilidad
);

/**
 * @route   GET /api/v1/utilidades/socio/:socioId/historial
 * @desc    Obtener historial de utilidades de un socio
 * @access  Private (ADMIN, OPERADOR, Dueño)
 */
router.get(
  '/socio/:socioId/historial',
  authenticate,
  requireAdminOrOperator, // TODO: Permitir también al socio dueño
  utilidadesController.obtenerHistorialUtilidades
);

export default router;
