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
import { AuthenticatedRequest } from '../types/auth.types';
/**
 * Obtener dashboard completo
 * Incluye todas las métricas y estadísticas
 */
export declare const obtenerDashboardCompleto: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Obtener resumen general
 * Socios, créditos, ahorros y garantías
 */
export declare const obtenerResumenGeneral: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Obtener cartera de créditos
 * Clasificación por mora y etapa
 */
export declare const obtenerCarteraCreditos: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Calcular rentabilidad
 * Ingresos vs egresos, utilidad neta, ROI
 */
export declare const calcularRentabilidad: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Calcular indicadores de riesgo
 * Morosidad, cartera en riesgo, provisiones
 */
export declare const calcularIndicadoresRiesgo: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Generar proyecciones
 * Ingresos proyectados próximos 3 meses
 */
export declare const generarProyecciones: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Obtener métricas por período
 * Query params: fechaInicio, fechaFin
 */
export declare const obtenerMetricasPorPeriodo: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=dashboard.controller.d.ts.map