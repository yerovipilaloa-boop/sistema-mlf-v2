"use strict";
/**
 * ============================================================================
 * Sistema MLF - Clases de Error Personalizadas
 * Archivo: src/utils/errors.ts
 * Descripción: Errores específicos del dominio de la aplicación
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleError = exports.EmailDuplicadoError = exports.UsuarioDuplicadoError = exports.DocumentoDuplicadoError = exports.RecomendadoresInsuficientesError = exports.MoraActivaError = exports.AhorroInsuficienteError = exports.LimiteCreditoExcedidoError = exports.GarantiaBusinessError = exports.CreditoBusinessError = exports.SocioBusinessError = exports.InternalServerError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
/**
 * Clase base para errores operacionales
 */
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        // Mantener el stack trace correcto
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Error 400 - Bad Request
 */
class BadRequestError extends AppError {
    constructor(message = 'Solicitud inválida') {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
/**
 * Error 401 - Unauthorized
 */
class UnauthorizedError extends AppError {
    constructor(message = 'No autorizado') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Error 403 - Forbidden
 */
class ForbiddenError extends AppError {
    constructor(message = 'Acceso prohibido') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Error 404 - Not Found
 */
class NotFoundError extends AppError {
    constructor(entityOrMessage = 'Recurso no encontrado', entityId) {
        let message = entityOrMessage;
        if (entityId !== undefined) {
            message = `${entityOrMessage} con ID ${entityId} no encontrado`;
        }
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Error 409 - Conflict
 */
class ConflictError extends AppError {
    constructor(message = 'Conflicto con el estado actual') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
/**
 * Error 422 - Unprocessable Entity
 */
class ValidationError extends AppError {
    errors;
    constructor(message = 'Error de validación', errors = []) {
        super(message, 422);
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
/**
 * Error 500 - Internal Server Error
 */
class InternalServerError extends AppError {
    constructor(message = 'Error interno del servidor') {
        super(message, 500);
    }
}
exports.InternalServerError = InternalServerError;
// ============================================================================
// ERRORES DE NEGOCIO ESPECÍFICOS DEL SISTEMA MLF
// ============================================================================
/**
 * Error relacionado con reglas de negocio de socios
 */
class SocioBusinessError extends BadRequestError {
    constructor(message) {
        super(`Error de regla de negocio - Socio: ${message}`);
    }
}
exports.SocioBusinessError = SocioBusinessError;
/**
 * Error relacionado con reglas de negocio de créditos
 */
class CreditoBusinessError extends BadRequestError {
    constructor(message) {
        super(`Error de regla de negocio - Crédito: ${message}`);
    }
}
exports.CreditoBusinessError = CreditoBusinessError;
/**
 * Error relacionado con reglas de negocio de garantías
 */
class GarantiaBusinessError extends BadRequestError {
    constructor(message) {
        super(`Error de regla de negocio - Garantía: ${message}`);
    }
}
exports.GarantiaBusinessError = GarantiaBusinessError;
/**
 * Error relacionado con límites de crédito
 */
class LimiteCreditoExcedidoError extends BadRequestError {
    constructor(limiteDisponible, montoSolicitado) {
        super(`Límite de crédito excedido. Límite disponible: $${limiteDisponible.toFixed(2)}, ` +
            `Monto solicitado: $${montoSolicitado.toFixed(2)}`);
    }
}
exports.LimiteCreditoExcedidoError = LimiteCreditoExcedidoError;
/**
 * Error relacionado con ahorro insuficiente
 */
class AhorroInsuficienteError extends BadRequestError {
    constructor(saldoActual, montoRequerido) {
        super(`Ahorro insuficiente. Saldo actual: $${saldoActual.toFixed(2)}, ` +
            `Monto requerido: $${montoRequerido.toFixed(2)}`);
    }
}
exports.AhorroInsuficienteError = AhorroInsuficienteError;
/**
 * Error relacionado con mora
 */
class MoraActivaError extends BadRequestError {
    constructor(diasMora) {
        super(`Socio tiene mora activa de ${diasMora} días. No puede solicitar nuevo crédito.`);
    }
}
exports.MoraActivaError = MoraActivaError;
/**
 * Error relacionado con recomendadores
 */
class RecomendadoresInsuficientesError extends BadRequestError {
    constructor(requeridos, proporcionados) {
        super(`Recomendadores insuficientes. Requeridos: ${requeridos}, ` +
            `Proporcionados: ${proporcionados}`);
    }
}
exports.RecomendadoresInsuficientesError = RecomendadoresInsuficientesError;
/**
 * Error relacionado con documento de identidad duplicado
 */
class DocumentoDuplicadoError extends ConflictError {
    constructor(documento) {
        super(`El documento de identidad ${documento} ya está registrado en el sistema.`);
    }
}
exports.DocumentoDuplicadoError = DocumentoDuplicadoError;
/**
 * Error relacionado con usuario duplicado
 */
class UsuarioDuplicadoError extends ConflictError {
    constructor(usuario) {
        super(`El nombre de usuario ${usuario} ya está en uso.`);
    }
}
exports.UsuarioDuplicadoError = UsuarioDuplicadoError;
/**
 * Error relacionado con email duplicado
 */
class EmailDuplicadoError extends ConflictError {
    constructor(email) {
        super(`El email ${email} ya está registrado en el sistema.`);
    }
}
exports.EmailDuplicadoError = EmailDuplicadoError;
/**
 * Error general de reglas de negocio
 */
class BusinessRuleError extends BadRequestError {
    constructor(message) {
        super(`Violación de regla de negocio: ${message}`);
    }
}
exports.BusinessRuleError = BusinessRuleError;
//# sourceMappingURL=errors.js.map