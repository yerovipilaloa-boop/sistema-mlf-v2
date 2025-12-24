"use strict";
/**
 * ============================================================================
 * Sistema MLF - Controlador de Dashboard del Socio
 * Archivo: src/controllers/dashboard-socio.controller.ts
 * Descripción: Endpoints para el dashboard personalizado del socio
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dashboard_socio_service_1 = __importDefault(require("../services/dashboard-socio.service"));
const creditos_service_1 = __importDefault(require("../services/creditos.service"));
const logger_1 = __importDefault(require("../config/logger"));
// ============================================================================
// CONTROLADORES
// ============================================================================
class DashboardSocioController {
    /**
     * GET /api/socios/me/dashboard
     * Obtener dashboard completo del socio autenticado
     */
    async obtenerMiDashboard(req, res) {
        try {
            // El socio ID viene del middleware de autenticación
            const socioId = req.user?.id;
            if (!socioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            logger_1.default.info(`Obteniendo dashboard para socio ID: ${socioId}`);
            const dashboard = await dashboard_socio_service_1.default.obtenerDashboardCompleto(socioId);
            res.status(200).json({
                success: true,
                data: dashboard,
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo dashboard del socio:', error);
            logger_1.default.error('Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Error al obtener información del dashboard',
                error: error.message,
                stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
            });
        }
    }
    /**
     * GET /api/socios/me/info
     * Obtener solo información personal del socio
     */
    async obtenerMiInfo(req, res) {
        try {
            const socioId = req.user?.id;
            if (!socioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const dashboard = await dashboard_socio_service_1.default.obtenerDashboardCompleto(socioId);
            res.status(200).json({
                success: true,
                data: {
                    socio: dashboard.socio,
                    estadisticas: dashboard.estadisticas,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo info del socio:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener información personal',
                error: error.message,
            });
        }
    }
    /**
     * GET /api/socios/me/creditos
     * Obtener créditos del socio con detalles
     */
    async obtenerMisCreditos(req, res) {
        try {
            const socioId = req.user?.id;
            if (!socioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const dashboard = await dashboard_socio_service_1.default.obtenerDashboardCompleto(socioId);
            res.status(200).json({
                success: true,
                data: {
                    resumen: dashboard.creditos,
                    proximasCuotas: dashboard.proximasCuotas,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo créditos del socio:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener información de créditos',
                error: error.message,
            });
        }
    }
    /**
     * GET /api/socios/me/ahorros
     * Obtener información de ahorros del socio
     */
    async obtenerMisAhorros(req, res) {
        try {
            const socioId = req.user?.id;
            if (!socioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const dashboard = await dashboard_socio_service_1.default.obtenerDashboardCompleto(socioId);
            res.status(200).json({
                success: true,
                data: {
                    ahorros: dashboard.ahorros,
                    utilidades: dashboard.utilidades,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo ahorros del socio:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener información de ahorros',
                error: error.message,
            });
        }
    }
    /**
     * GET /api/socios/me/historial
     * Obtener historial de movimientos del socio
     */
    async obtenerMiHistorial(req, res) {
        try {
            const socioId = req.user?.id;
            if (!socioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const dashboard = await dashboard_socio_service_1.default.obtenerDashboardCompleto(socioId);
            res.status(200).json({
                success: true,
                data: dashboard.historialReciente,
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo historial del socio:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener historial de movimientos',
                error: error.message,
            });
        }
    }
    /**
     * GET /api/socios/me/limite-credito
     * Obtener información sobre el límite de crédito disponible del socio
     */
    async obtenerMiLimiteCredito(req, res) {
        try {
            const socioId = req.user?.id;
            if (!socioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const limite = await dashboard_socio_service_1.default.obtenerLimiteCredito(socioId);
            res.status(200).json({
                success: true,
                data: limite,
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo límite de crédito:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener límite de crédito',
                error: error.message,
            });
        }
    }
    /**
     * POST /api/socios/me/solicitar-credito
     * Solicitar un nuevo crédito (el socio solicita para sí mismo)
     */
    async solicitarMiCredito(req, res) {
        try {
            const socioId = req.user?.id;
            if (!socioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const { montoSolicitado, plazoMeses, metodoAmortizacion, proposito } = req.body;
            // Validaciones básicas
            if (!montoSolicitado || !plazoMeses || !proposito) {
                res.status(400).json({
                    success: false,
                    message: 'Monto, plazo y propósito son requeridos',
                });
                return;
            }
            logger_1.default.info(`Socio ${socioId} solicitando crédito de $${montoSolicitado}`);
            const credito = await creditos_service_1.default.solicitarCredito({
                socioId,
                montoSolicitado: parseFloat(montoSolicitado),
                plazoMeses: parseInt(plazoMeses),
                metodoAmortizacion: metodoAmortizacion || 'FRANCES',
                proposito,
            }, socioId);
            res.status(201).json({
                success: true,
                message: 'Solicitud de crédito registrada exitosamente',
                data: credito,
            });
        }
        catch (error) {
            logger_1.default.error('Error solicitando crédito:', error);
            // Manejar errores específicos del negocio
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Error al procesar solicitud de crédito',
                error: error.name,
            });
        }
    }
    /**
     * POST /api/socios/me/solicitar-deposito
     * Solicitar un depósito de ahorro (genera solicitud pendiente de aprobación)
     */
    async solicitarDeposito(req, res) {
        try {
            const socioId = req.user?.id;
            if (!socioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const { monto, comprobante, observaciones } = req.body;
            if (!monto || monto <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El monto debe ser mayor a cero',
                });
                return;
            }
            logger_1.default.info(`Socio ${socioId} solicitando depósito de $${monto}`);
            // Por ahora, registrar como solicitud pendiente
            // TODO: Implementar sistema de solicitudes pendientes para aprobación
            const resultado = await dashboard_socio_service_1.default.registrarSolicitudDeposito(socioId, {
                monto: parseFloat(monto),
                comprobante,
                observaciones,
            });
            res.status(201).json({
                success: true,
                message: 'Solicitud de depósito registrada. Pendiente de aprobación por el administrador.',
                data: resultado,
            });
        }
        catch (error) {
            logger_1.default.error('Error solicitando depósito:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar solicitud de depósito',
                error: error.message,
            });
        }
    }
    /**
     * POST /api/socios/me/solicitar-retiro
     * Solicitar un retiro de ahorro (genera solicitud pendiente de aprobación)
     */
    async solicitarRetiro(req, res) {
        try {
            const socioId = req.user?.id;
            if (!socioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const { monto, observaciones } = req.body;
            if (!monto || monto <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El monto debe ser mayor a cero',
                });
                return;
            }
            logger_1.default.info(`Socio ${socioId} solicitando retiro de $${monto}`);
            // Verificar que tenga saldo disponible suficiente
            const resultado = await dashboard_socio_service_1.default.registrarSolicitudRetiro(socioId, {
                monto: parseFloat(monto),
                observaciones,
            });
            res.status(201).json({
                success: true,
                message: 'Solicitud de retiro registrada. Pendiente de aprobación por el administrador.',
                data: resultado,
            });
        }
        catch (error) {
            logger_1.default.error('Error solicitando retiro:', error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Error al procesar solicitud de retiro',
                error: error.name,
            });
        }
    }
    /**
     * POST /api/socios/me/solicitar-pago
     * Reportar un pago de cuota
     */
    async solicitarPago(req, res) {
        try {
            const socioId = req.user?.id;
            if (!socioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const { monto, comprobante, observaciones } = req.body;
            if (!monto || monto <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El monto debe ser mayor a cero',
                });
                return;
            }
            logger_1.default.info(`Socio ${socioId} reportando pago de $${monto}`);
            const resultado = await dashboard_socio_service_1.default.registrarSolicitudPago(socioId, {
                monto: parseFloat(monto),
                comprobante,
                observaciones,
            });
            res.status(201).json({
                success: true,
                message: 'Pago reportado exitosamente. Pendiente de aprobación.',
                data: resultado,
            });
        }
        catch (error) {
            logger_1.default.error('Error reportando pago:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar reporte de pago',
                error: error.message,
            });
        }
    }
}
exports.default = new DashboardSocioController();
//# sourceMappingURL=dashboard-socio.controller.js.map