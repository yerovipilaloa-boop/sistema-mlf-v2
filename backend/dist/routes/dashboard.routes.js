"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController = __importStar(require("../controllers/dashboard.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/dashboard
 * Obtener dashboard completo con todas las métricas
 * - Resumen general
 * - Cartera de créditos
 * - Rentabilidad
 * - Indicadores de riesgo
 * - Proyecciones
 */
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, dashboardController.obtenerDashboardCompleto);
/**
 * GET /api/v1/dashboard/resumen
 * Obtener resumen general
 * - Total socios (activos, suspendidos, nuevos)
 * - Total créditos (activos, completados, castigados)
 * - Ahorros totales
 * - Garantías activas
 */
router.get('/resumen', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, dashboardController.obtenerResumenGeneral);
/**
 * GET /api/v1/dashboard/cartera
 * Obtener cartera de créditos
 * - Cartera activa vs vencida
 * - Clasificación por nivel de mora (5 niveles)
 * - Distribución por etapa (1, 2, 3)
 */
router.get('/cartera', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, dashboardController.obtenerCarteraCreditos);
/**
 * GET /api/v1/dashboard/rentabilidad
 * Calcular rentabilidad
 * - Ingresos (intereses, moras, primas)
 * - Egresos (utilidades, fondo seguro)
 * - Utilidad neta
 * - Margen de rentabilidad
 * - ROI (Return on Investment)
 */
router.get('/rentabilidad', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, dashboardController.calcularRentabilidad);
/**
 * GET /api/v1/dashboard/riesgo
 * Calcular indicadores de riesgo
 * - Tasa de morosidad
 * - Índice de cartera en riesgo
 * - Provisión requerida
 * - Créditos problema
 * - Alertas automáticas
 */
router.get('/riesgo', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, dashboardController.calcularIndicadoresRiesgo);
/**
 * GET /api/v1/dashboard/proyecciones
 * Generar proyecciones
 * - Ingresos proyectados próximos 3 meses
 * - Metas vs reales del mes actual
 */
router.get('/proyecciones', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, dashboardController.generarProyecciones);
/**
 * GET /api/v1/dashboard/metricas-periodo
 * Obtener métricas por período
 * Query params: fechaInicio, fechaFin
 * - Total pagos
 * - Créditos desembolsados
 * - Nuevos socios
 */
router.get('/metricas-periodo', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, dashboardController.obtenerMetricasPorPeriodo);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map