/**
 * ============================================================================
 * Sistema MLF - Servicio de Notificaciones
 * Archivo: src/services/notificaciones.service.ts
 * Descripción: Gestión de notificaciones multi-canal (email, SMS, in-app)
 * ============================================================================
 */
export declare enum TipoNotificacion {
    CREDITO_APROBADO = "CREDITO_APROBADO",
    CREDITO_RECHAZADO = "CREDITO_RECHAZADO",
    CREDITO_DESEMBOLSADO = "CREDITO_DESEMBOLSADO",
    PAGO_REGISTRADO = "PAGO_REGISTRADO",
    CUOTA_PROXIMA_VENCER = "CUOTA_PROXIMA_VENCER",// 3 días antes
    CUOTA_VENCIDA = "CUOTA_VENCIDA",
    MORA_ACTIVA = "MORA_ACTIVA",
    GARANTIA_ASIGNADA = "GARANTIA_ASIGNADA",
    SOLICITUD_LIBERACION = "SOLICITUD_LIBERACION",
    LIBERACION_APROBADA = "LIBERACION_APROBADA",
    LIBERACION_RECHAZADA = "LIBERACION_RECHAZADA",
    GARANTIA_EJECUTADA = "GARANTIA_EJECUTADA",
    UTILIDADES_ACREDITADAS = "UTILIDADES_ACREDITADAS",
    BIENVENIDA = "BIENVENIDA",
    CAMBIO_ETAPA = "CAMBIO_ETAPA",
    SOCIO_SUSPENDIDO = "SOCIO_SUSPENDIDO",
    SOCIO_REACTIVADO = "SOCIO_REACTIVADO"
}
export declare enum CanalNotificacion {
    EMAIL = "EMAIL",
    SMS = "SMS",
    IN_APP = "IN_APP",
    PUSH = "PUSH"
}
export declare enum PrioridadNotificacion {
    BAJA = "BAJA",
    MEDIA = "MEDIA",
    ALTA = "ALTA",
    URGENTE = "URGENTE"
}
interface EnviarNotificacionDTO {
    socioId: number;
    tipo: TipoNotificacion;
    canal: CanalNotificacion | CanalNotificacion[];
    prioridad?: PrioridadNotificacion;
    datos?: Record<string, any>;
}
declare class NotificacionesService {
    /**
     * Enviar notificación multi-canal
     */
    enviarNotificacion(data: EnviarNotificacionDTO): Promise<any>;
    /**
     * Enviar por un canal específico
     */
    private enviarPorCanal;
    /**
     * Enviar email (integración pendiente)
     */
    private enviarEmail;
    /**
     * Enviar SMS (integración pendiente)
     */
    private enviarSMS;
    /**
     * Guardar notificación in-app
     */
    private guardarInApp;
    /**
     * Enviar push notification (integración pendiente)
     */
    private enviarPush;
    /**
     * Obtener notificaciones de un socio
     */
    obtenerNotificaciones(socioId: number, filtros?: {
        page?: number;
        limit?: number;
        leidas?: boolean;
        tipo?: TipoNotificacion;
    }): Promise<any>;
    /**
     * Listar notificaciones de un socio (alias para controlador)
     */
    listarNotificacionesSocio(filtros: {
        socioId: number;
        soloNoLeidas?: boolean;
        tipo?: string;
        fechaDesde?: Date;
        fechaHasta?: Date;
        limit?: number;
    }): Promise<any[]>;
    /**
     * Obtener notificaciones para administración (todas)
     * Filtrar por tipo (ej: SOLICITUD_*)
     */
    listarTodasNotificaciones(filtros: {
        tipos?: TipoNotificacion[];
        estado?: string;
        page?: number;
        limit?: number;
    }): Promise<any>;
    /**
     * Marcar notificación como leída
     */
    marcarComoLeida(notificacionId: number): Promise<any>;
    /**
     * Marcar todas como leídas
     */
    marcarTodasComoLeidas(socioId: number): Promise<any>;
    /**
     * Enviar recordatorios de cuotas próximas a vencer
     * (Ejecutar diariamente via cron job)
     */
    enviarRecordatoriosCuotas(): Promise<void>;
    /**
     * Obtener estadísticas de notificaciones
     */
    obtenerEstadisticas(filtros: {
        fechaDesde?: Date;
        fechaHasta?: Date;
    }): Promise<any>;
}
declare const _default: NotificacionesService;
export default _default;
//# sourceMappingURL=notificaciones.service.d.ts.map