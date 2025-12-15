"use strict";
/**
 * ============================================================================
 * Sistema MLF - Utilidades de Respuesta API
 * Archivo: src/utils/api-response.ts
 * Descripción: Funciones helper para respuestas HTTP estandarizadas
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInternalError = exports.sendValidationError = exports.sendForbidden = exports.sendUnauthorized = exports.sendBadRequest = exports.sendNotFound = exports.sendDeleted = exports.sendUpdated = exports.sendCreated = exports.sendError = exports.sendSuccess = void 0;
/**
 * Enviar respuesta exitosa
 *
 * @param res - Objeto Response de Express
 * @param data - Datos a enviar
 * @param message - Mensaje opcional
 * @param statusCode - Código de estado HTTP (default: 200)
 */
const sendSuccess = (res, data, message, statusCode = 200) => {
    const response = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
    if (message) {
        response.message = message;
    }
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
/**
 * Enviar respuesta de error
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje de error
 * @param statusCode - Código de estado HTTP (default: 500)
 * @param code - Código de error opcional
 * @param details - Detalles adicionales del error
 */
const sendError = (res, message, statusCode = 500, code, details) => {
    const response = {
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
exports.sendError = sendError;
/**
 * Enviar respuesta de creación exitosa (201)
 *
 * @param res - Objeto Response de Express
 * @param data - Datos creados
 * @param message - Mensaje opcional
 */
const sendCreated = (res, data, message) => {
    (0, exports.sendSuccess)(res, data, message || 'Recurso creado exitosamente', 201);
};
exports.sendCreated = sendCreated;
/**
 * Enviar respuesta de actualización exitosa
 *
 * @param res - Objeto Response de Express
 * @param data - Datos actualizados
 * @param message - Mensaje opcional
 */
const sendUpdated = (res, data, message) => {
    (0, exports.sendSuccess)(res, data, message || 'Recurso actualizado exitosamente', 200);
};
exports.sendUpdated = sendUpdated;
/**
 * Enviar respuesta de eliminación exitosa
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
const sendDeleted = (res, message) => {
    (0, exports.sendSuccess)(res, null, message || 'Recurso eliminado exitosamente', 200);
};
exports.sendDeleted = sendDeleted;
/**
 * Enviar respuesta 404 - No encontrado
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
const sendNotFound = (res, message) => {
    (0, exports.sendError)(res, message || 'Recurso no encontrado', 404, 'NOT_FOUND');
};
exports.sendNotFound = sendNotFound;
/**
 * Enviar respuesta 400 - Bad Request
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje de error
 * @param details - Detalles adicionales
 */
const sendBadRequest = (res, message, details) => {
    (0, exports.sendError)(res, message, 400, 'BAD_REQUEST', details);
};
exports.sendBadRequest = sendBadRequest;
/**
 * Enviar respuesta 401 - No autorizado
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
const sendUnauthorized = (res, message) => {
    (0, exports.sendError)(res, message || 'No autorizado', 401, 'UNAUTHORIZED');
};
exports.sendUnauthorized = sendUnauthorized;
/**
 * Enviar respuesta 403 - Prohibido
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
const sendForbidden = (res, message) => {
    (0, exports.sendError)(res, message || 'Acceso prohibido', 403, 'FORBIDDEN');
};
exports.sendForbidden = sendForbidden;
/**
 * Enviar respuesta 422 - Unprocessable Entity (Validación)
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje de error
 * @param errors - Errores de validación
 */
const sendValidationError = (res, message, errors) => {
    (0, exports.sendError)(res, message, 422, 'VALIDATION_ERROR', errors);
};
exports.sendValidationError = sendValidationError;
/**
 * Enviar respuesta 500 - Error interno del servidor
 *
 * @param res - Objeto Response de Express
 * @param message - Mensaje opcional
 */
const sendInternalError = (res, message) => {
    (0, exports.sendError)(res, message || 'Error interno del servidor', 500, 'INTERNAL_ERROR');
};
exports.sendInternalError = sendInternalError;
//# sourceMappingURL=api-response.js.map