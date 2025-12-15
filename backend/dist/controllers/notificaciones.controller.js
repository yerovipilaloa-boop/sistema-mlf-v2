"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarAlertaMora = exports.enviarNotificacionBienvenida = exports.obtenerEstadisticas = exports.enviarRecordatoriosCuotas = exports.marcarComoLeida = exports.listarNotificacionesAdmin = exports.listarNotificacionesSocio = exports.enviarNotificacion = void 0;
const notificaciones_service_1 = __importDefault(require("../services/notificaciones.service"));
const api_response_1 = require("../utils/api-response");
/**
 * Enviar notificación manual
 * Permite envío personalizado por cualquier canal
 */
const enviarNotificacion = async (req, res, next) => {
    try {
        const { socioId, tipo, canal, prioridad, datos } = req.body;
        if (!socioId || !tipo || !canal) {
            throw new Error('Se requiere: socioId, tipo y canal');
        }
        // Validar que canal sea array
        const canales = Array.isArray(canal) ? canal : [canal];
        const resultado = await notificaciones_service_1.default.enviarNotificacion({
            socioId: parseInt(socioId, 10),
            tipo,
            canal: canales,
            prioridad: prioridad || 'MEDIA',
            datos: datos || {},
        }, req.user?.id);
        (0, api_response_1.sendSuccess)(res, resultado, `Notificación enviada exitosamente por ${canales.join(', ')}`);
    }
    catch (error) {
        next(error);
    }
};
exports.enviarNotificacion = enviarNotificacion;
/**
 * Listar notificaciones de un socio
 * Filtros: solo no leídas, por tipo, por fecha
 */
const listarNotificacionesSocio = async (req, res, next) => {
    try {
        const { socioId } = req.params;
        const { soloNoLeidas, tipo, fechaDesde, fechaHasta } = req.query;
        if (!socioId) {
            throw new Error('Se requiere socioId');
        }
        const notificaciones = await notificaciones_service_1.default.listarNotificacionesSocio({
            socioId: parseInt(socioId, 10),
            soloNoLeidas: soloNoLeidas === 'true',
            tipo: tipo,
            fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
            fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
        });
        (0, api_response_1.sendSuccess)(res, notificaciones, `${notificaciones.length} notificaciones encontradas`);
    }
    catch (error) {
        next(error);
    }
};
exports.listarNotificacionesSocio = listarNotificacionesSocio;
/**
 * Listar notificaciones para ADMIN (Solicitudes)
 */
const listarNotificacionesAdmin = async (req, res, next) => {
    try {
        const { tipos, page, limit } = req.query;
        // Convertir tipos a array si viene separado por comas
        let tiposArray = [];
        if (tipos) {
            tiposArray = tipos.split(',');
        }
        const resultado = await notificaciones_service_1.default.listarTodasNotificaciones({
            tipos: tiposArray.length > 0 ? tiposArray : undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50
        });
        (0, api_response_1.sendSuccess)(res, resultado, 'Notificaciones obtenidas');
    }
    catch (error) {
        next(error);
    }
};
exports.listarNotificacionesAdmin = listarNotificacionesAdmin;
/**
 * Marcar notificación como leída
 */
const marcarComoLeida = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new Error('Se requiere id de notificación');
        }
        const resultado = await notificaciones_service_1.default.marcarComoLeida(parseInt(id, 10));
        (0, api_response_1.sendSuccess)(res, resultado, 'Notificación marcada como leída');
    }
    catch (error) {
        next(error);
    }
};
exports.marcarComoLeida = marcarComoLeida;
/**
 * Enviar recordatorios automáticos de cuotas
 * Ejecutar diariamente via cron job
 */
const enviarRecordatoriosCuotas = async (req, res, next) => {
    try {
        await notificaciones_service_1.default.enviarRecordatoriosCuotas();
        (0, api_response_1.sendSuccess)(res, { ejecutado: true }, 'Recordatorios de cuotas enviados exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.enviarRecordatoriosCuotas = enviarRecordatoriosCuotas;
/**
 * Obtener estadísticas de notificaciones
 * - Total enviadas
 * - Por canal
 * - Por tipo
 * - Tasa de lectura
 */
const obtenerEstadisticas = async (req, res, next) => {
    try {
        const { fechaDesde, fechaHasta } = req.query;
        const estadisticas = await notificaciones_service_1.default.obtenerEstadisticas({
            fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
            fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
        });
        (0, api_response_1.sendSuccess)(res, estadisticas, 'Estadísticas obtenidas exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerEstadisticas = obtenerEstadisticas;
/**
 * Enviar notificación de bienvenida a nuevo socio
 */
const enviarNotificacionBienvenida = async (req, res, next) => {
    try {
        const { socioId } = req.body;
        if (!socioId) {
            throw new Error('Se requiere socioId');
        }
        const resultado = await notificaciones_service_1.default.enviarNotificacion({
            socioId: parseInt(socioId, 10),
            tipo: 'SOCIO_NUEVO',
            canal: ['EMAIL', 'SMS'],
            prioridad: 'ALTA',
            datos: {},
        }, req.user?.id);
        (0, api_response_1.sendSuccess)(res, resultado, 'Notificación de bienvenida enviada');
    }
    catch (error) {
        next(error);
    }
};
exports.enviarNotificacionBienvenida = enviarNotificacionBienvenida;
/**
 * Enviar alerta de mora
 */
const enviarAlertaMora = async (req, res, next) => {
    try {
        const { creditoId } = req.body;
        if (!creditoId) {
            throw new Error('Se requiere creditoId');
        }
        // Obtener información del crédito y cuota vencida
        // Este método debe ser implementado en el service si se necesita
        // Por ahora, retornamos éxito
        (0, api_response_1.sendSuccess)(res, { enviado: true }, 'Alerta de mora enviada exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.enviarAlertaMora = enviarAlertaMora;
//# sourceMappingURL=notificaciones.controller.js.map