/**
 * ============================================================================
 * Sistema MLF - Rutas de Gastos Operativos
 * ============================================================================
 */

import { Router } from 'express';
import * as gastosController from '../controllers/gastos.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// GET /api/v1/gastos - Obtener lista de gastos
router.get('/', requireAdmin, gastosController.obtenerGastos);

// POST /api/v1/gastos - Registrar nuevo gasto
router.post('/', requireAdmin, gastosController.registrarGasto);

// DELETE /api/v1/gastos/:id - Eliminar gasto
router.delete('/:id', requireAdmin, gastosController.eliminarGasto);

// GET /api/v1/gastos/categorias - Obtener categorías
router.get('/categorias', requireAdmin, gastosController.obtenerCategorias);

export default router;
