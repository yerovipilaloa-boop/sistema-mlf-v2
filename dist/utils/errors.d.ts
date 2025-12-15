/**
 * ============================================================================
 * Sistema MLF - Clases de Error Personalizadas
 * Archivo: src/utils/errors.ts
 * Descripción: Errores específicos del dominio de la aplicación
 * ============================================================================
 */
/**
 * Clase base para errores operacionales
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
/**
 * Error 400 - Bad Request
 */
export declare class BadRequestError extends AppError {
    constructor(message?: string);
}
/**
 * Error 401 - Unauthorized
 */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/**
 * Error 403 - Forbidden
 */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/**
 * Error 404 - Not Found
 */
export declare class NotFoundError extends AppError {
    constructor(entityOrMessage?: string, entityId?: string | number);
}
/**
 * Error 409 - Conflict
 */
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
/**
 * Error 422 - Unprocessable Entity
 */
export declare class ValidationError extends AppError {
    readonly errors: any[];
    constructor(message?: string, errors?: any[]);
}
/**
 * Error 500 - Internal Server Error
 */
export declare class InternalServerError extends AppError {
    constructor(message?: string);
}
/**
 * Error relacionado con reglas de negocio de socios
 */
export declare class SocioBusinessError extends BadRequestError {
    constructor(message: string);
}
/**
 * Error relacionado con reglas de negocio de créditos
 */
export declare class CreditoBusinessError extends BadRequestError {
    constructor(message: string);
}
/**
 * Error relacionado con reglas de negocio de garantías
 */
export declare class GarantiaBusinessError extends BadRequestError {
    constructor(message: string);
}
/**
 * Error relacionado con límites de crédito
 */
export declare class LimiteCreditoExcedidoError extends BadRequestError {
    constructor(limiteDisponible: number, montoSolicitado: number);
}
/**
 * Error relacionado con ahorro insuficiente
 */
export declare class AhorroInsuficienteError extends BadRequestError {
    constructor(saldoActual: number, montoRequerido: number);
}
/**
 * Error relacionado con mora
 */
export declare class MoraActivaError extends BadRequestError {
    constructor(diasMora: number);
}
/**
 * Error relacionado con recomendadores
 */
export declare class RecomendadoresInsuficientesError extends BadRequestError {
    constructor(requeridos: number, proporcionados: number);
}
/**
 * Error relacionado con documento de identidad duplicado
 */
export declare class DocumentoDuplicadoError extends ConflictError {
    constructor(documento: string);
}
/**
 * Error relacionado con usuario duplicado
 */
export declare class UsuarioDuplicadoError extends ConflictError {
    constructor(usuario: string);
}
/**
 * Error relacionado con email duplicado
 */
export declare class EmailDuplicadoError extends ConflictError {
    constructor(email: string);
}
/**
 * Error general de reglas de negocio
 */
export declare class BusinessRuleError extends BadRequestError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map