/**
 * ============================================================================
 * Routes: Dashboard
 * ============================================================================
 * Rutas para métricas y estadísticas del dashboard
 *
 * Autorización:
 * - ADMIN y OPERADOR: Acceso completo a todas las métricas
 * - Todas las rutas requieren autenticación
 *
 * @author Sistema MLF
 * @version 1.0.0
 */

import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, requireAdminOrOperator } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/v1/dashboard
 * Obtener dashboard completo con todas las métricas
 * - Resumen general
 * - Cartera de créditos
 * - Rentabilidad
 * - Indicadores de riesgo
 * - Proyecciones
 */
router.get(
  '/',
  authenticate,
  requireAdminOrOperator,
  dashboardController.obtenerDashboardCompleto
);

/**
 * GET /api/v1/dashboard/resumen
 * Obtener resumen general
 * - Total socios (activos, suspendidos, nuevos)
 * - Total créditos (activos, completados, castigados)
 * - Ahorros totales
 * - Garantías activas
 */
router.get(
  '/resumen',
  authenticate,
  requireAdminOrOperator,
  dashboardController.obtenerResumenGeneral
);

/**
 * GET /api/v1/dashboard/cartera
 * Obtener cartera de créditos
 * - Cartera activa vs vencida
 * - Clasificación por nivel de mora (5 niveles)
 * - Distribución por etapa (1, 2, 3)
 */
router.get(
  '/cartera',
  authenticate,
  requireAdminOrOperator,
  dashboardController.obtenerCarteraCreditos
);

/**
 * GET /api/v1/dashboard/rentabilidad
 * Calcular rentabilidad
 * - Ingresos (intereses, moras, primas)
 * - Egresos (utilidades, fondo seguro)
 * - Utilidad neta
 * - Margen de rentabilidad
 * - ROI (Return on Investment)
 */
router.get(
  '/rentabilidad',
  authenticate,
  requireAdminOrOperator,
  dashboardController.calcularRentabilidad
);

/**
 * GET /api/v1/dashboard/riesgo
 * Calcular indicadores de riesgo
 * - Tasa de morosidad
 * - Índice de cartera en riesgo
 * - Provisión requerida
 * - Créditos problema
 * - Alertas automáticas
 */
router.get(
  '/riesgo',
  authenticate,
  requireAdminOrOperator,
  dashboardController.calcularIndicadoresRiesgo
);

/**
 * GET /api/v1/dashboard/proyecciones
 * Generar proyecciones
 * - Ingresos proyectados próximos 3 meses
 * - Metas vs reales del mes actual
 */
router.get(
  '/proyecciones',
  authenticate,
  requireAdminOrOperator,
  dashboardController.generarProyecciones
);

/**
 * GET /api/v1/dashboard/metricas-periodo
 * Obtener métricas por período
 * Query params: fechaInicio, fechaFin
 * - Total pagos
 * - Créditos desembolsados
 * - Nuevos socios
 */
router.get(
  '/metricas-periodo',
  authenticate,
  requireAdminOrOperator,
  dashboardController.obtenerMetricasPorPeriodo
);

export default router;
