/**
 * ============================================================================
 * Sistema MLF - Utilidades de Respuestas HTTP
 * Archivo: src/utils/responses.ts
 * Descripción: Funciones helper para respuestas estandarizadas
 * ============================================================================
 */
import { Response } from 'express';
/**
 * Enviar respuesta exitosa
 */
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response;
/**
 * Enviar respuesta exitosa con mensaje solamente
 */
export declare const sendSuccessMessage: (res: Response, message: string, statusCode?: number) => Response;
/**
 * Enviar respuesta de creación exitosa (201)
 */
export declare const sendCreated: <T>(res: Response, data: T, message?: string) => Response;
/**
 * Enviar respuesta paginada
 */
export declare const sendPaginated: <T>(res: Response, data: T[], page: number, limit: number, total: number, resourceName?: string) => Response;
/**
 * Enviar respuesta de error
 */
export declare const sendError: (res: Response, error: string, statusCode?: number, details?: any) => Response;
/**
 * Enviar respuesta de validación fallida
 */
export declare const sendValidationError: (res: Response, errors: any[]) => Response;
/**
 * Enviar respuesta de no autorizado
 */
export declare const sendUnauthorized: (res: Response, message?: string) => Response;
/**
 * Enviar respuesta de prohibido
 */
export declare const sendForbidden: (res: Response, message?: string) => Response;
/**
 * Enviar respuesta de no encontrado
 */
export declare const sendNotFound: (res: Response, message?: string) => Response;
/**
 * Enviar respuesta de conflicto
 */
export declare const sendConflict: (res: Response, message: string) => Response;
/**
 * Enviar respuesta de error interno del servidor
 */
export declare const sendInternalError: (res: Response, message?: string) => Response;
//# sourceMappingURL=responses.d.ts.map