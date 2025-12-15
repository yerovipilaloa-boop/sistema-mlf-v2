"use strict";
/**
 * ============================================================================
 * Sistema MLF - Utilidades de Respuestas HTTP
 * Archivo: src/utils/responses.ts
 * Descripción: Funciones helper para respuestas estandarizadas
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInternalError = exports.sendConflict = exports.sendNotFound = exports.sendForbidden = exports.sendUnauthorized = exports.sendValidationError = exports.sendError = exports.sendPaginated = exports.sendCreated = exports.sendSuccessMessage = exports.sendSuccess = void 0;
/**
 * Enviar respuesta exitosa
 */
const sendSuccess = (res, data, message, statusCode = 200) => {
    const response = {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
/**
 * Enviar respuesta exitosa con mensaje solamente
 */
const sendSuccessMessage = (res, message, statusCode = 200) => {
    const response = {
        success: true,
        message,
        timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccessMessage = sendSuccessMessage;
/**
 * Enviar respuesta de creación exitosa (201)
 */
const sendCreated = (res, data, message) => {
    return (0, exports.sendSuccess)(res, data, message, 201);
};
exports.sendCreated = sendCreated;
/**
 * Enviar respuesta paginada
 */
const sendPaginated = (res, data, page, limit, total, resourceName) => {
    const totalPages = Math.ceil(total / limit);
    // Determinar el nombre del recurso desde el contexto si no se proporciona
    const response = {
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
exports.sendPaginated = sendPaginated;
/**
 * Enviar respuesta de error
 */
const sendError = (res, error, statusCode = 400, details) => {
    const response = {
        success: false,
        error,
        ...(details && { data: details }),
        timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
/**
 * Enviar respuesta de validación fallida
 */
const sendValidationError = (res, errors) => {
    const response = {
        success: false,
        error: 'Error de validación',
        data: { errors },
        timestamp: new Date().toISOString(),
    };
    return res.status(422).json(response);
};
exports.sendValidationError = sendValidationError;
/**
 * Enviar respuesta de no autorizado
 */
const sendUnauthorized = (res, message = 'No autorizado') => {
    return (0, exports.sendError)(res, message, 401);
};
exports.sendUnauthorized = sendUnauthorized;
/**
 * Enviar respuesta de prohibido
 */
const sendForbidden = (res, message = 'Acceso prohibido') => {
    return (0, exports.sendError)(res, message, 403);
};
exports.sendForbidden = sendForbidden;
/**
 * Enviar respuesta de no encontrado
 */
const sendNotFound = (res, message = 'Recurso no encontrado') => {
    return (0, exports.sendError)(res, message, 404);
};
exports.sendNotFound = sendNotFound;
/**
 * Enviar respuesta de conflicto
 */
const sendConflict = (res, message) => {
    return (0, exports.sendError)(res, message, 409);
};
exports.sendConflict = sendConflict;
/**
 * Enviar respuesta de error interno del servidor
 */
const sendInternalError = (res, message = 'Error interno del servidor') => {
    return (0, exports.sendError)(res, message, 500);
};
exports.sendInternalError = sendInternalError;
//# sourceMappingURL=responses.js.map