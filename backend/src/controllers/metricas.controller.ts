/**
 * ============================================================================
 * Sistema MLF - Controlador de Métricas
 * Archivo: src/controllers/metricas.controller.ts
 * ============================================================================
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import metricasService from '../services/metricas.service';
import { sendSuccess } from '../utils/responses';

/**
 * GET /api/v1/metricas/dashboard
 * Obtener métricas completas del dashboard
 */
export const obtenerMetricasDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { periodo } = req.query;

    let filtro;
    if (periodo && typeof periodo === 'string') {
      if (['dia', 'semana', 'mes', 'año'].includes(periodo)) {
        filtro = metricasService.obtenerPeriodo(periodo as 'dia' | 'semana' | 'mes' | 'año');
      }
    }

    const metricas = await metricasService.obtenerMetricasCompletas(filtro);

    sendSuccess(res, metricas);
  } catch (error) {
    next(error);
  }
};
