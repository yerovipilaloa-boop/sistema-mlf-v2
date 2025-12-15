"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerMetricasPorPeriodo = exports.generarProyecciones = exports.calcularIndicadoresRiesgo = exports.calcularRentabilidad = exports.obtenerCarteraCreditos = exports.obtenerResumenGeneral = exports.obtenerDashboardCompleto = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const api_response_1 = require("../utils/api-response");
/**
 * Obtener dashboard completo
 * Incluye todas las métricas y estadísticas
 */
const obtenerDashboardCompleto = async (req, res, next) => {
    try {
        const dashboard = await dashboard_service_1.dashboardService.obtenerDashboardCompleto();
        (0, api_response_1.sendSuccess)(res, dashboard, 'Dashboard generado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerDashboardCompleto = obtenerDashboardCompleto;
/**
 * Obtener resumen general
 * Socios, créditos, ahorros y garantías
 */
const obtenerResumenGeneral = async (req, res, next) => {
    try {
        const resumen = await dashboard_service_1.dashboardService.obtenerResumenGeneral();
        (0, api_response_1.sendSuccess)(res, resumen, 'Resumen general obtenido exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerResumenGeneral = obtenerResumenGeneral;
/**
 * Obtener cartera de créditos
 * Clasificación por mora y etapa
 */
const obtenerCarteraCreditos = async (req, res, next) => {
    try {
        const cartera = await dashboard_service_1.dashboardService.obtenerCarteraCreditos();
        (0, api_response_1.sendSuccess)(res, cartera, 'Cartera de créditos obtenida exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerCarteraCreditos = obtenerCarteraCreditos;
/**
 * Calcular rentabilidad
 * Ingresos vs egresos, utilidad neta, ROI
 */
const calcularRentabilidad = async (req, res, next) => {
    try {
        const rentabilidad = await dashboard_service_1.dashboardService.calcularRentabilidad();
        (0, api_response_1.sendSuccess)(res, rentabilidad, 'Rentabilidad calculada exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.calcularRentabilidad = calcularRentabilidad;
/**
 * Calcular indicadores de riesgo
 * Morosidad, cartera en riesgo, provisiones
 */
const calcularIndicadoresRiesgo = async (req, res, next) => {
    try {
        const indicadores = await dashboard_service_1.dashboardService.calcularIndicadoresRiesgo();
        (0, api_response_1.sendSuccess)(res, indicadores, 'Indicadores de riesgo calculados exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.calcularIndicadoresRiesgo = calcularIndicadoresRiesgo;
/**
 * Generar proyecciones
 * Ingresos proyectados próximos 3 meses
 */
const generarProyecciones = async (req, res, next) => {
    try {
        const proyecciones = await dashboard_service_1.dashboardService.generarProyecciones();
        (0, api_response_1.sendSuccess)(res, proyecciones, 'Proyecciones generadas exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.generarProyecciones = generarProyecciones;
/**
 * Obtener métricas por período
 * Query params: fechaInicio, fechaFin
 */
const obtenerMetricasPorPeriodo = async (req, res, next) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        if (!fechaInicio || !fechaFin) {
            throw new Error('Se requiere fechaInicio y fechaFin');
        }
        const metricas = await dashboard_service_1.dashboardService.obtenerMetricasPorPeriodo(new Date(fechaInicio), new Date(fechaFin));
        (0, api_response_1.sendSuccess)(res, metricas, 'Métricas por período obtenidas exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerMetricasPorPeriodo = obtenerMetricasPorPeriodo;
//# sourceMappingURL=dashboard.controller.js.map