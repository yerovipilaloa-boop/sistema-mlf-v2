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

import { Router } from 'express';
import * as notificacionesController from '../controllers/notificaciones.controller';
import { authenticate, requireAdminOrOperator } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/v1/notificaciones
 * Enviar notificación manual
 * - Soporta múltiples canales (EMAIL, SMS, IN_APP, PUSH)
 * - Prioridades: BAJA, MEDIA, ALTA, URGENTE
 * - Usa plantillas predefinidas
 */
router.post(
  '/',
  authenticate,
  requireAdminOrOperator,
  notificacionesController.enviarNotificacion
);

/**
 * GET /api/v1/notificaciones/admin
 * Listar notificaciones de sistema (Solicitudes)
 * - Filtros: tipos (array separado por comas)
 * - Paginación
 */
router.get(
  '/admin',
  authenticate,
  requireAdminOrOperator,
  notificacionesController.listarNotificacionesAdmin
);

/**
 * GET /api/v1/notificaciones/socio/:socioId
 * Listar notificaciones de un socio
 * - Filtros: soloNoLeidas, tipo, fechaDesde, fechaHasta
 * - Ordenadas por fecha descendente
 */
router.get(
  '/socio/:socioId',
  authenticate,
  notificacionesController.listarNotificacionesSocio
);

/**
 * PATCH /api/v1/notificaciones/:id/leida
 * Marcar notificación como leída
 * - Actualiza fechaLeida
 * - Incrementa tasa de lectura
 */
router.patch(
  '/:id/leida',
  authenticate,
  notificacionesController.marcarComoLeida
);

/**
 * POST /api/v1/notificaciones/recordatorios/cuotas
 * Enviar recordatorios automáticos de cuotas
 * - Ejecutar diariamente via cron job
 * - Cuotas próximas a vencer (3 días)
 * - Cuotas vencidas (diario)
 */
router.post(
  '/recordatorios/cuotas',
  authenticate,
  requireAdminOrOperator,
  notificacionesController.enviarRecordatoriosCuotas
);

/**
 * GET /api/v1/notificaciones/estadisticas
 * Obtener estadísticas de notificaciones
 * - Total enviadas por canal
 * - Tasa de lectura
 * - Distribución por tipo
 * - Filtros por fecha
 */
router.get(
  '/estadisticas',
  authenticate,
  requireAdminOrOperator,
  notificacionesController.obtenerEstadisticas
);

/**
 * POST /api/v1/notificaciones/bienvenida
 * Enviar notificación de bienvenida a nuevo socio
 * - Se envía automáticamente al registrar socio
 * - Canal: EMAIL + SMS
 */
router.post(
  '/bienvenida',
  authenticate,
  requireAdminOrOperator,
  notificacionesController.enviarNotificacionBienvenida
);

/**
 * POST /api/v1/notificaciones/alerta-mora
 * Enviar alerta de mora
 * - Ejecutar automáticamente al detectar mora
 * - Incluye monto adeudado y días vencidos
 */
router.post(
  '/alerta-mora',
  authenticate,
  requireAdminOrOperator,
  notificacionesController.enviarAlertaMora
);

export default router;
