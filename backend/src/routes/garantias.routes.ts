/**
 * ============================================================================
 * Sistema MLF - Rutas de Garantías
 * Archivo: src/routes/garantias.routes.ts
 * Descripción: Definición de rutas para sistema de garantías cruzadas
 * ============================================================================
 */

import { Router } from 'express';
import * as garantiasController from '../controllers/garantias.controller';
import {
  authenticate,
  requireAdmin,
  requireAdminOrOperator,
} from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/garantias
 * @desc    Crear garantías para un crédito (2 garantes requeridos)
 * @access  Private (ADMIN, OPERADOR)
 */
router.post(
  '/',
  authenticate,
  requireAdminOrOperator,
  garantiasController.crearGarantias
);

/**
 * @route   GET /api/v1/garantias
 * @desc    Listar garantías con filtros y paginación
 * @access  Private (ADMIN, OPERADOR)
 */
router.get(
  '/',
  authenticate,
  requireAdminOrOperator,
  garantiasController.listarGarantias
);

/**
 * @route   GET /api/v1/garantias/:id
 * @desc    Obtener garantía por ID
 * @access  Private (ADMIN, OPERADOR)
 */
router.get(
  '/:id',
  authenticate,
  requireAdminOrOperator,
  garantiasController.obtenerGarantia
);

/**
 * @route   POST /api/v1/garantias/:id/solicitar-liberacion
 * @desc    Solicitar liberación de garantía (requiere 50% completado + sin moras)
 * @access  Private (ADMIN, OPERADOR, Garante)
 */
router.post(
  '/:id/solicitar-liberacion',
  authenticate,
  requireAdminOrOperator, // TODO: Permitir también al garante dueño
  garantiasController.solicitarLiberacion
);

/**
 * @route   POST /api/v1/garantias/liberaciones/:id/aprobar
 * @desc    Aprobar solicitud de liberación
 * @access  Private (ADMIN, OPERADOR)
 */
router.post(
  '/liberaciones/:id/aprobar',
  authenticate,
  requireAdminOrOperator,
  garantiasController.aprobarLiberacion
);

/**
 * @route   POST /api/v1/garantias/liberaciones/:id/rechazar
 * @desc    Rechazar solicitud de liberación
 * @access  Private (ADMIN, OPERADOR)
 */
router.post(
  '/liberaciones/:id/rechazar',
  authenticate,
  requireAdminOrOperator,
  garantiasController.rechazarLiberacion
);

/**
 * @route   POST /api/v1/garantias/:id/ejecutar
 * @desc    Ejecutar garantía (mora 90+ días)
 * @access  Private (ADMIN)
 */
router.post(
  '/:id/ejecutar',
  authenticate,
  requireAdmin,
  garantiasController.ejecutarGarantia
);

export default router;
