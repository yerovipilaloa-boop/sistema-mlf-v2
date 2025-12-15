/**
 * ============================================================================
 * Sistema MLF - Controlador de Pagos
 * Archivo: src/controllers/pagos.controller.ts
 * Descripción: Controladores para endpoints de pagos y morosidad
 * ============================================================================
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, MetodoPago } from '../types';
import pagosService from '../services/pagos.service';
import { sendSuccess, sendCreated } from '../utils/responses';

/**
 * POST /api/v1/pagos
 * Registrar pago a un crédito
 */
export const registrarPago = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      creditoId,
      montoPagado,
      metodoPago,
      numeroReferencia,
      concepto,
      fechaPago,
    } = req.body;

    // Validación básica
    if (!creditoId || !montoPagado || !metodoPago) {
      throw new Error('creditoId, montoPagado y metodoPago son requeridos');
    }

    // Validar método de pago
    if (!Object.values(MetodoPago).includes(metodoPago as MetodoPago)) {
      throw new Error(`Método de pago inválido. Valores permitidos: ${Object.values(MetodoPago).join(', ')}`);
    }

    // CORRECCIÓN: Procesar fecha correctamente para evitar problemas de zona horaria
    // Si se recibe "2025-01-16", debe interpretarse como 2025-01-16 en hora local, no UTC
    let fechaPagoProcessed: Date | undefined;
    if (fechaPago) {
      // Si viene en formato ISO (YYYY-MM-DD), agregar hora local para evitar cambio de día
      if (typeof fechaPago === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaPago)) {
        fechaPagoProcessed = new Date(fechaPago + 'T12:00:00');
      } else {
        fechaPagoProcessed = new Date(fechaPago);
      }
    }

    const resultado = await pagosService.registrarPago(
      {
        creditoId: parseInt(creditoId, 10),
        montoPagado: parseFloat(montoPagado),
        metodoPago,
        numeroReferencia,
        concepto,
        fechaPago: fechaPagoProcessed,
      },
      req.user?.id
    );

    sendCreated(res, resultado, 'Pago registrado exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/pagos/credito/:creditoId
 * Obtener estado de pagos de un crédito
 */
export const obtenerEstadoPagos = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { creditoId } = req.params;

    const estado = await pagosService.obtenerEstadoPagos(
      parseInt(creditoId, 10)
    );

    sendSuccess(res, estado);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/pagos/credito/:creditoId/actualizar-mora
 * Actualizar mora de un crédito
 */
export const actualizarMora = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { creditoId } = req.params;

    await pagosService.actualizarMoraCredito(parseInt(creditoId, 10));

    sendSuccess(res, null, 'Mora actualizada exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/pagos/recientes
 * Obtener pagos recientes del sistema
 */
export const obtenerPagosRecientes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limite = req.query.limite ? parseInt(req.query.limite as string, 10) : 15;

    const pagos = await pagosService.obtenerPagosRecientes(limite);

    sendSuccess(res, pagos);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/pagos/:id
 * Obtener pago por ID
 */
export const obtenerPago = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const pago = await pagosService.obtenerPago(parseInt(id, 10));

    sendSuccess(res, pago);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/pagos/:id
 * Actualizar pago (solo dentro de 7 días)
 */
export const actualizarPago = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const pago = await pagosService.actualizarPago(
      parseInt(id, 10),
      data,
      req.user?.id
    );

    sendSuccess(res, pago, 'Pago actualizado exitosamente');
  } catch (error) {
    next(error);
  }
};
