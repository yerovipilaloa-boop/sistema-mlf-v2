"use strict";
/**
 * ============================================================================
 * Routes: Notificaciones
 * ============================================================================
 * Rutas para gestión de notificaciones multi-canal
 *
 * Autorización:
 * - ADMIN y OPERADOR: Pueden enviar notificaciones y ver estadísticas
 * - SOCIO: Solo puede ver sus propias notificaciones
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
const notificacionesController = __importStar(require("../controllers/notificaciones.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/notificaciones
 * Enviar notificación manual
 * - Soporta múltiples canales (EMAIL, SMS, IN_APP, PUSH)
 * - Prioridades: BAJA, MEDIA, ALTA, URGENTE
 * - Usa plantillas predefinidas
 */
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, notificacionesController.enviarNotificacion);
/**
 * GET /api/v1/notificaciones/admin
 * Listar notificaciones de sistema (Solicitudes)
 * - Filtros: tipos (array separado por comas)
 * - Paginación
 */
router.get('/admin', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, notificacionesController.listarNotificacionesAdmin);
/**
 * GET /api/v1/notificaciones/socio/:socioId
 * Listar notificaciones de un socio
 * - Filtros: soloNoLeidas, tipo, fechaDesde, fechaHasta
 * - Ordenadas por fecha descendente
 */
router.get('/socio/:socioId', auth_middleware_1.authenticate, notificacionesController.listarNotificacionesSocio);
/**
 * PATCH /api/v1/notificaciones/:id/leida
 * Marcar notificación como leída
 * - Actualiza fechaLeida
 * - Incrementa tasa de lectura
 */
router.patch('/:id/leida', auth_middleware_1.authenticate, notificacionesController.marcarComoLeida);
/**
 * POST /api/v1/notificaciones/recordatorios/cuotas
 * Enviar recordatorios automáticos de cuotas
 * - Ejecutar diariamente via cron job
 * - Cuotas próximas a vencer (3 días)
 * - Cuotas vencidas (diario)
 */
router.post('/recordatorios/cuotas', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, notificacionesController.enviarRecordatoriosCuotas);
/**
 * GET /api/v1/notificaciones/estadisticas
 * Obtener estadísticas de notificaciones
 * - Total enviadas por canal
 * - Tasa de lectura
 * - Distribución por tipo
 * - Filtros por fecha
 */
router.get('/estadisticas', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, notificacionesController.obtenerEstadisticas);
/**
 * POST /api/v1/notificaciones/bienvenida
 * Enviar notificación de bienvenida a nuevo socio
 * - Se envía automáticamente al registrar socio
 * - Canal: EMAIL + SMS
 */
router.post('/bienvenida', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, notificacionesController.enviarNotificacionBienvenida);
/**
 * POST /api/v1/notificaciones/alerta-mora
 * Enviar alerta de mora
 * - Ejecutar automáticamente al detectar mora
 * - Incluye monto adeudado y días vencidos
 */
router.post('/alerta-mora', auth_middleware_1.authenticate, auth_middleware_1.requireAdminOrOperator, notificacionesController.enviarAlertaMora);
exports.default = router;
//# sourceMappingURL=notificaciones.routes.js.map