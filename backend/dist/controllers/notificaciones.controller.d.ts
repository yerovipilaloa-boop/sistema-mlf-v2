/**
 * ============================================================================
 * Controller: Notificaciones
 * ============================================================================
 * Gestión de notificaciones multi-canal (Email, SMS, In-app, Push)
 *
 * Endpoints:
 * 1. POST /notificaciones - Enviar notificación manual
 * 2. GET /notificaciones/socio/:socioId - Listar notificaciones de socio
 * 3. PATCH /notificaciones/:id/leida - Marcar como leída
 * 4. POST /notificaciones/recordatorios/cuotas - Enviar recordatorios automáticos
 * 5. GET /notificaciones/estadisticas - Estadísticas de envío
 *
 * @author Sistema MLF
 * @version 1.0.0
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
/**
 * Enviar notificación manual
 * Permite envío personalizado por cualquier canal
 */
export declare const enviarNotificacion: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Listar notificaciones de un socio
 * Filtros: solo no leídas, por tipo, por fecha
 */
export declare const listarNotificacionesSocio: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Listar notificaciones para ADMIN (Solicitudes)
 */
export declare const listarNotificacionesAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Marcar notificación como leída
 */
export declare const marcarComoLeida: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Enviar recordatorios automáticos de cuotas
 * Ejecutar diariamente via cron job
 */
export declare const enviarRecordatoriosCuotas: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Obtener estadísticas de notificaciones
 * - Total enviadas
 * - Por canal
 * - Por tipo
 * - Tasa de lectura
 */
export declare const obtenerEstadisticas: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Enviar notificación de bienvenida a nuevo socio
 */
export declare const enviarNotificacionBienvenida: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Enviar alerta de mora
 */
export declare const enviarAlertaMora: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=notificaciones.controller.d.ts.map