/**
 * ============================================================================
 * Sistema MLF - Utilidades de Respuestas HTTP
 * Archivo: src/utils/responses.ts
 * Descripción: Funciones helper para respuestas estandarizadas
 * ============================================================================
 */

import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

/**
 * Enviar respuesta exitosa
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Enviar respuesta exitosa con mensaje solamente
 */
export const sendSuccessMessage = (
  res: Response,
  message: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Enviar respuesta de creación exitosa (201)
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message?: string
): Response => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Enviar respuesta paginada
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  resourceName?: string
): Response => {
  const totalPages = Math.ceil(total / limit);

  // Determinar el nombre del recurso desde el contexto si no se proporciona
  const response: any = {
    success: true,
    data: {
      [resourceName || 'items']: data,
      page,
      limit,
      total,
      totalPages,
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(200).json(response);
};

/**
 * Enviar respuesta de error
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 400,
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
    ...(details && { data: details }),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Enviar respuesta de validación fallida
 */
export const sendValidationError = (
  res: Response,
  errors: any[]
): Response => {
  const response: ApiResponse = {
    success: false,
    error: 'Error de validación',
    data: { errors },
    timestamp: new Date().toISOString(),
  };

  return res.status(422).json(response);
};

/**
 * Enviar respuesta de no autorizado
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'No autorizado'
): Response => {
  return sendError(res, message, 401);
};

/**
 * Enviar respuesta de prohibido
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Acceso prohibido'
): Response => {
  return sendError(res, message, 403);
};

/**
 * Enviar respuesta de no encontrado
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Recurso no encontrado'
): Response => {
  return sendError(res, message, 404);
};

/**
 * Enviar respuesta de conflicto
 */
export const sendConflict = (
  res: Response,
  message: string
): Response => {
  return sendError(res, message, 409);
};

/**
 * Enviar respuesta de error interno del servidor
 */
export const sendInternalError = (
  res: Response,
  message: string = 'Error interno del servidor'
): Response => {
  return sendError(res, message, 500);
};
