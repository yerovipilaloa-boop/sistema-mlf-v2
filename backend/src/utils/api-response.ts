/**
 * ============================================================================
 * Sistema MLF - Utilidades de Respuesta API
 * Archivo: src/utils/api-response.ts
 * Descripción: Funciones helper para respuestas HTTP estandarizadas
 * ============================================================================
 */

import { Response } from 'express';

/**
 * Interfaz para respuestas exitosas
 */
interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Interfaz para respuestas de error
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Enviar respuesta exitosa
 *
 * @param res - Objeto Response de Express
 * @param data - Datos a enviar
 * @param message - Mensaje opcional
 * @param statusCode - Código de estado HTTP (default: 200)
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
};

/**
 * Enviar respuesta de error
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje de error
 * @param statusCode - Código de estado HTTP (default: 500)
 * @param code - Código de error opcional
 * @param details - Detalles adicionales del error
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
    },
    timestamp: new Date().toISOString(),
  };

  if (code) {
    response.error.code = code;
  }

  if (details) {
    response.error.details = details;
  }

  res.status(statusCode).json(response);
};

/**
 * Enviar respuesta de creación exitosa (201)
 *
 * @param res - Objeto Response de Express
 * @param data - Datos creados
 * @param message - Mensaje opcional
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message?: string
): void => {
  sendSuccess(res, data, message || 'Recurso creado exitosamente', 201);
};

/**
 * Enviar respuesta de actualización exitosa
 *
 * @param res - Objeto Response de Express
 * @param data - Datos actualizados
 * @param message - Mensaje opcional
 */
export const sendUpdated = <T>(
  res: Response,
  data: T,
  message?: string
): void => {
  sendSuccess(res, data, message || 'Recurso actualizado exitosamente', 200);
};

/**
 * Enviar respuesta de eliminación exitosa
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
export const sendDeleted = (
  res: Response,
  message?: string
): void => {
  sendSuccess(res, null, message || 'Recurso eliminado exitosamente', 200);
};

/**
 * Enviar respuesta 404 - No encontrado
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
export const sendNotFound = (
  res: Response,
  message?: string
): void => {
  sendError(res, message || 'Recurso no encontrado', 404, 'NOT_FOUND');
};

/**
 * Enviar respuesta 400 - Bad Request
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje de error
 * @param details - Detalles adicionales
 */
export const sendBadRequest = (
  res: Response,
  message: string,
  details?: any
): void => {
  sendError(res, message, 400, 'BAD_REQUEST', details);
};

/**
 * Enviar respuesta 401 - No autorizado
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
export const sendUnauthorized = (
  res: Response,
  message?: string
): void => {
  sendError(res, message || 'No autorizado', 401, 'UNAUTHORIZED');
};

/**
 * Enviar respuesta 403 - Prohibido
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
export const sendForbidden = (
  res: Response,
  message?: string
): void => {
  sendError(res, message || 'Acceso prohibido', 403, 'FORBIDDEN');
};

/**
 * Enviar respuesta 422 - Unprocessable Entity (Validación)
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje de error
 * @param errors - Errores de validación
 */
export const sendValidationError = (
  res: Response,
  message: string,
  errors?: any
): void => {
  sendError(res, message, 422, 'VALIDATION_ERROR', errors);
};

/**
 * Enviar respuesta 500 - Error interno del servidor
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
export const sendInternalError = (
  res: Response,
  message?: string
): void => {
  sendError(res, message || 'Error interno del servidor', 500, 'INTERNAL_ERROR');
};
