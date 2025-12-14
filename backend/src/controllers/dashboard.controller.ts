/**
 * ============================================================================
 * Controller: Dashboard
 * ============================================================================
 * Maneja solicitudes HTTP para métricas y estadísticas del dashboard
 *
 * Endpoints:
 * 1. GET /dashboard - Dashboard completo
 * 2. GET /dashboard/resumen - Resumen general
 * 3. GET /dashboard/cartera - Cartera de créditos
 * 4. GET /dashboard/rentabilidad - Rentabilidad
 * 5. GET /dashboard/riesgo - Indicadores de riesgo
 * 6. GET /dashboard/proyecciones - Proyecciones
 * 7. GET /dashboard/metricas-periodo - Métricas por período
 *
 * @author Sistema MLF
 * @version 1.0.0
 */

import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { sendSuccess } from '../utils/api-response';

/**
 * Obtener dashboard completo
 * Incluye todas las métricas y estadísticas
 */
export const obtenerDashboardCompleto = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dashboard = await dashboardService.obtenerDashboardCompleto();

    sendSuccess(res, dashboard, 'Dashboard generado exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener resumen general
 * Socios, créditos, ahorros y garantías
 */
export const obtenerResumenGeneral = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resumen = await dashboardService.obtenerResumenGeneral();

    sendSuccess(res, resumen, 'Resumen general obtenido exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener cartera de créditos
 * Clasificación por mora y etapa
 */
export const obtenerCarteraCreditos = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cartera = await dashboardService.obtenerCarteraCreditos();

    sendSuccess(res, cartera, 'Cartera de créditos obtenida exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * Calcular rentabilidad
 * Ingresos vs egresos, utilidad neta, ROI
 */
export const calcularRentabilidad = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rentabilidad = await dashboardService.calcularRentabilidad();

    sendSuccess(res, rentabilidad, 'Rentabilidad calculada exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * Calcular indicadores de riesgo
 * Morosidad, cartera en riesgo, provisiones
 */
export const calcularIndicadoresRiesgo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const indicadores = await dashboardService.calcularIndicadoresRiesgo();

    sendSuccess(
      res,
      indicadores,
      'Indicadores de riesgo calculados exitosamente'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Generar proyecciones
 * Ingresos proyectados próximos 3 meses
 */
export const generarProyecciones = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const proyecciones = await dashboardService.generarProyecciones();

    sendSuccess(res, proyecciones, 'Proyecciones generadas exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener métricas por período
 * Query params: fechaInicio, fechaFin
 */
export const obtenerMetricasPorPeriodo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      throw new Error('Se requiere fechaInicio y fechaFin');
    }

    const metricas = await dashboardService.obtenerMetricasPorPeriodo(
      new Date(fechaInicio as string),
      new Date(fechaFin as string)
    );

    sendSuccess(res, metricas, 'Métricas por período obtenidas exitosamente');
  } catch (error) {
    next(error);
  }
};
