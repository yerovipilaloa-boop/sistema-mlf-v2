/**
 * ============================================================================
 * Sistema MLF - Controlador de Utilidades
 * Archivo: src/controllers/utilidades.controller.ts
 * Descripción: Controladores para cálculo y distribución de utilidades
 * ============================================================================
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import utilidadesService from '../services/utilidades.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/responses';

/**
 * POST /api/v1/utilidades/calcular
 * Calcular utilidades para un período semestral
 */
export const calcularUtilidades = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { año, semestre } = req.body;

    // Validación básica
    if (!año || !semestre) {
      throw new Error('año y semestre son requeridos');
    }

    const resultado = await utilidadesService.calcularUtilidades(
      {
        año: parseInt(año, 10),
        semestre: parseInt(semestre, 10) as 1 | 2,
      },
      req.user?.id
    );

    sendCreated(res, resultado, 'Utilidades calculadas exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/utilidades/:id/distribuir
 * Distribuir (acreditar) utilidades calculadas
 */
export const distribuirUtilidades = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const resultado = await utilidadesService.distribuirUtilidades(
      {
        utilidadId: parseInt(id, 10),
      },
      req.user?.id
    );

    sendSuccess(res, resultado, 'Utilidades distribuidas exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/utilidades/:id
 * Obtener utilidad por ID con detalles
 */
export const obtenerUtilidad = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const utilidad = await utilidadesService.obtenerUtilidadPorId(
      parseInt(id, 10)
    );

    sendSuccess(res, utilidad);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/utilidades
 * Listar utilidades con filtros
 */
export const listarUtilidades = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      año,
      semestre,
      estado,
    } = req.query;

    const resultado = await utilidadesService.listarUtilidades({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      año: año ? parseInt(año as string, 10) : undefined,
      semestre: semestre ? parseInt(semestre as string, 10) : undefined,
      estado: estado as string,
    });

    sendPaginated(
      res,
      resultado.utilidades,
      resultado.page,
      resultado.limit,
      resultado.total
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/utilidades/socio/:socioId/historial
 * Obtener historial de utilidades de un socio
 */
export const obtenerHistorialUtilidades = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { socioId } = req.params;

    const historial = await utilidadesService.obtenerHistorialUtilidades(
      parseInt(socioId, 10)
    );

    sendSuccess(res, historial);
  } catch (error) {
    next(error);
  }
};
