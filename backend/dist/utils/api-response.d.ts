/**
 * ============================================================================
 * Sistema MLF - Utilidades de Respuesta API
 * Archivo: src/utils/api-response.ts
 * Descripción: Funciones helper para respuestas HTTP estandarizadas
 * ============================================================================
 */
import { Response } from 'express';
/**
 * Enviar respuesta exitosa
 *
 * @param res - Objeto Response de Express
 * @param data - Datos a enviar
 * @param message - Mensaje opcional
 * @param statusCode - Código de estado HTTP (default: 200)
 */
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number) => void;
/**
 * Enviar respuesta de error
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje de error
 * @param statusCode - Código de estado HTTP (default: 500)
 * @param code - Código de error opcional
 * @param details - Detalles adicionales del error
 */
export declare const sendError: (res: Response, message: string, statusCode?: number, code?: string, details?: any) => void;
/**
 * Enviar respuesta de creación exitosa (201)
 *
 * @param res - Objeto Response de Express
 * @param data - Datos creados
 * @param message - Mensaje opcional
 */
export declare const sendCreated: <T>(res: Response, data: T, message?: string) => void;
/**
 * Enviar respuesta de actualización exitosa
 *
 * @param res - Objeto Response de Express
 * @param data - Datos actualizados
 * @param message - Mensaje opcional
 */
export declare const sendUpdated: <T>(res: Response, data: T, message?: string) => void;
/**
 * Enviar respuesta de eliminación exitosa
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
export declare const sendDeleted: (res: Response, message?: string) => void;
/**
 * Enviar respuesta 404 - No encontrado
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
export declare const sendNotFound: (res: Response, message?: string) => void;
/**
 * Enviar respuesta 400 - Bad Request
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje de error
 * @param details - Detalles adicionales
 */
export declare const sendBadRequest: (res: Response, message: string, details?: any) => void;
/**
 * Enviar respuesta 401 - No autorizado
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
export declare const sendUnauthorized: (res: Response, message?: string) => void;
/**
 * Enviar respuesta 403 - Prohibido
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
export declare const sendForbidden: (res: Response, message?: string) => void;
/**
 * Enviar respuesta 422 - Unprocessable Entity (Validación)
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje de error
 * @param errors - Errores de validación
 */
export declare const sendValidationError: (res: Response, message: string, errors?: any) => void;
/**
 * Enviar respuesta 500 - Error interno del servidor
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
export declare const sendInternalError: (res: Response, message?: string) => void;
//# sourceMappingURL=api-response.d.ts.map