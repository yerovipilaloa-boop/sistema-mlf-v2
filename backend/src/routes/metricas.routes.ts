/**
 * ============================================================================
 * Sistema MLF - Rutas de Métricas
 * ============================================================================
 */

import { Router } from 'express';
import * as metricasController from '../controllers/metricas.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// GET /api/v1/metricas/dashboard - Obtener métricas del dashboard
router.get('/dashboard', requireAdmin, metricasController.obtenerMetricasDashboard);

export default router;
