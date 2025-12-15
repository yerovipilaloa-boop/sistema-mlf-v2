/**
 * ============================================================================
 * Sistema MLF - Controlador de Garantías
 * Archivo: src/controllers/garantias.controller.ts
 * Descripción: Controladores para endpoints de garantías cruzadas
 * ============================================================================
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import garantiasService from '../services/garantias.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/responses';

/**
 * POST /api/v1/garantias
 * Crear garantías para un crédito (requiere 2 garantes)
 */
export const crearGarantias = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { creditoId, garantesIds } = req.body;

    // Validación básica
    if (!creditoId || !garantesIds || !Array.isArray(garantesIds)) {
      throw new Error(
        'creditoId y garantesIds (array) son requeridos'
      );
    }

    const garantias = await garantiasService.crearGarantias(
      { creditoId, garantesIds },
      req.user?.id
    );

    sendCreated(res, garantias, 'Garantías creadas exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/garantias/:id
 * Obtener garantía por ID
 */
export const obtenerGarantia = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const garantia = await garantiasService.obtenerGarantiaPorId(
      parseInt(id, 10)
    );

    sendSuccess(res, garantia);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/garantias
 * Listar garantías con filtros y paginación
 */
export const listarGarantias = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      garanteId,
      creditoId,
      estado,
    } = req.query;

    const resultado = await garantiasService.listarGarantias({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      garanteId: garanteId ? parseInt(garanteId as string, 10) : undefined,
      creditoId: creditoId ? parseInt(creditoId as string, 10) : undefined,
      estado: estado as any,
    });

    sendPaginated(
      res,
      resultado.garantias,
      resultado.page,
      resultado.limit,
      resultado.total
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/garantias/:id/solicitar-liberacion
 * Solicitar liberación de garantía
 */
export const solicitarLiberacion = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { motivoSolicitud } = req.body;

    if (!motivoSolicitud) {
      throw new Error('El motivo de solicitud es requerido');
    }

    const solicitud = await garantiasService.solicitarLiberacion(
      {
        garantiaId: parseInt(id, 10),
        motivoSolicitud,
      },
      req.user?.id
    );

    sendCreated(res, solicitud, 'Solicitud de liberación creada');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/garantias/liberaciones/:id/aprobar
 * Aprobar solicitud de liberación
 */
export const aprobarLiberacion = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const resultado = await garantiasService.aprobarLiberacion(
      {
        liberacionId: parseInt(id, 10),
        observaciones,
      },
      req.user?.id
    );

    sendSuccess(res, resultado, 'Liberación aprobada exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/garantias/liberaciones/:id/rechazar
 * Rechazar solicitud de liberación
 */
export const rechazarLiberacion = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { motivoRechazo } = req.body;

    if (!motivoRechazo) {
      throw new Error('El motivo de rechazo es requerido');
    }

    const resultado = await garantiasService.rechazarLiberacion(
      {
        liberacionId: parseInt(id, 10),
        motivoRechazo,
      },
      req.user?.id
    );

    sendSuccess(res, resultado, 'Liberación rechazada');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/garantias/:id/ejecutar
 * Ejecutar garantía (mora 90+ días)
 */
export const ejecutarGarantia = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { motivoEjecucion } = req.body;

    if (!motivoEjecucion) {
      throw new Error('El motivo de ejecución es requerido');
    }

    const resultado = await garantiasService.ejecutarGarantia(
      {
        garantiaId: parseInt(id, 10),
        motivoEjecucion,
      },
      req.user?.id
    );

    sendSuccess(res, resultado, 'Garantía ejecutada');
  } catch (error) {
    next(error);
  }
};
