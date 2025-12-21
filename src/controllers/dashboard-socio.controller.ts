/**
 * ============================================================================
 * Sistema MLF - Controlador de Dashboard del Socio
 * Archivo: src/controllers/dashboard-socio.controller.ts
 * Descripción: Endpoints para el dashboard personalizado del socio
 * ============================================================================
 */

import { Request, Response } from 'express';
import dashboardSocioService from '../services/dashboard-socio.service';
import creditosService from '../services/creditos.service';
import sociosService from '../services/socios.service';
import logger from '../config/logger';

// ============================================================================
// INTERFACES
// ============================================================================

interface AuthRequest extends Request {
  user?: {
    id: number;
    usuario: string;
    rol: string;
  };
}

// ============================================================================
// CONTROLADORES
// ============================================================================

class DashboardSocioController {
  /**
   * GET /api/socios/me/dashboard
   * Obtener dashboard completo del socio autenticado
   */
  async obtenerMiDashboard(req: AuthRequest, res: Response): Promise<void> {
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

      logger.info(`Obteniendo dashboard para socio ID: ${socioId}`);

      const dashboard = await dashboardSocioService.obtenerDashboardCompleto(socioId);

      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      logger.error('Error obteniendo dashboard del socio:', error);
      logger.error('Stack trace:', error.stack);

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
  async obtenerMiInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const socioId = req.user?.id;

      if (!socioId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const dashboard = await dashboardSocioService.obtenerDashboardCompleto(socioId);

      res.status(200).json({
        success: true,
        data: {
          socio: dashboard.socio,
          estadisticas: dashboard.estadisticas,
        },
      });
    } catch (error: any) {
      logger.error('Error obteniendo info del socio:', error);

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
  async obtenerMisCreditos(req: AuthRequest, res: Response): Promise<void> {
    try {
      const socioId = req.user?.id;

      if (!socioId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const dashboard = await dashboardSocioService.obtenerDashboardCompleto(socioId);

      res.status(200).json({
        success: true,
        data: {
          resumen: dashboard.creditos,
          proximasCuotas: dashboard.proximasCuotas,
        },
      });
    } catch (error: any) {
      logger.error('Error obteniendo créditos del socio:', error);

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
  async obtenerMisAhorros(req: AuthRequest, res: Response): Promise<void> {
    try {
      const socioId = req.user?.id;

      if (!socioId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const dashboard = await dashboardSocioService.obtenerDashboardCompleto(socioId);

      res.status(200).json({
        success: true,
        data: {
          ahorros: dashboard.ahorros,
          utilidades: dashboard.utilidades,
        },
      });
    } catch (error: any) {
      logger.error('Error obteniendo ahorros del socio:', error);

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
  async obtenerMiHistorial(req: AuthRequest, res: Response): Promise<void> {
    try {
      const socioId = req.user?.id;

      if (!socioId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const dashboard = await dashboardSocioService.obtenerDashboardCompleto(socioId);

      res.status(200).json({
        success: true,
        data: dashboard.historialReciente,
      });
    } catch (error: any) {
      logger.error('Error obteniendo historial del socio:', error);

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
  async obtenerMiLimiteCredito(req: AuthRequest, res: Response): Promise<void> {
    try {
      const socioId = req.user?.id;

      if (!socioId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const limite = await dashboardSocioService.obtenerLimiteCredito(socioId);

      res.status(200).json({
        success: true,
        data: limite,
      });
    } catch (error: any) {
      logger.error('Error obteniendo límite de crédito:', error);

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
  async solicitarMiCredito(req: AuthRequest, res: Response): Promise<void> {
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

      logger.info(`Socio ${socioId} solicitando crédito de $${montoSolicitado}`);

      const credito = await creditosService.solicitarCredito({
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
    } catch (error: any) {
      logger.error('Error solicitando crédito:', error);

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
  async solicitarDeposito(req: AuthRequest, res: Response): Promise<void> {
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

      logger.info(`Socio ${socioId} solicitando depósito de $${monto}`);

      // Por ahora, registrar como solicitud pendiente
      // TODO: Implementar sistema de solicitudes pendientes para aprobación
      const resultado = await dashboardSocioService.registrarSolicitudDeposito(socioId, {
        monto: parseFloat(monto),
        comprobante,
        observaciones,
      });

      res.status(201).json({
        success: true,
        message: 'Solicitud de depósito registrada. Pendiente de aprobación por el administrador.',
        data: resultado,
      });
    } catch (error: any) {
      logger.error('Error solicitando depósito:', error);

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
  async solicitarRetiro(req: AuthRequest, res: Response): Promise<void> {
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

      logger.info(`Socio ${socioId} solicitando retiro de $${monto}`);

      // Verificar que tenga saldo disponible suficiente
      const resultado = await dashboardSocioService.registrarSolicitudRetiro(socioId, {
        monto: parseFloat(monto),
        observaciones,
      });

      res.status(201).json({
        success: true,
        message: 'Solicitud de retiro registrada. Pendiente de aprobación por el administrador.',
        data: resultado,
      });
    } catch (error: any) {
      logger.error('Error solicitando retiro:', error);

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
  async solicitarPago(req: AuthRequest, res: Response): Promise<void> {
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

      logger.info(`Socio ${socioId} reportando pago de $${monto}`);

      const resultado = await dashboardSocioService.registrarSolicitudPago(socioId, {
        monto: parseFloat(monto),
        comprobante,
        observaciones,
      });

      res.status(201).json({
        success: true,
        message: 'Pago reportado exitosamente. Pendiente de aprobación.',
        data: resultado,
      });
    } catch (error: any) {
      logger.error('Error reportando pago:', error);

      res.status(500).json({
        success: false,
        message: 'Error al procesar reporte de pago',
        error: error.message,
      });
    }
  }
}

export default new DashboardSocioController();
