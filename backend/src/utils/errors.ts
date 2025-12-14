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
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Mantener el stack trace correcto
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error 400 - Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Solicitud inválida') {
    super(message, 400);
  }
}

/**
 * Error 401 - Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

/**
 * Error 403 - Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso prohibido') {
    super(message, 403);
  }
}

/**
 * Error 404 - Not Found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404);
  }
}

/**
 * Error 409 - Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto con el estado actual') {
    super(message, 409);
  }
}

/**
 * Error 422 - Unprocessable Entity
 */
export class ValidationError extends AppError {
  public readonly errors: any[];

  constructor(message: string = 'Error de validación', errors: any[] = []) {
    super(message, 422);
    this.errors = errors;
  }
}

/**
 * Error 500 - Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Error interno del servidor') {
    super(message, 500);
  }
}

// ============================================================================
// ERRORES DE NEGOCIO ESPECÍFICOS DEL SISTEMA MLF
// ============================================================================

/**
 * Error relacionado con reglas de negocio de socios
 */
export class SocioBusinessError extends BadRequestError {
  constructor(message: string) {
    super(`Error de regla de negocio - Socio: ${message}`);
  }
}

/**
 * Error relacionado con reglas de negocio de créditos
 */
export class CreditoBusinessError extends BadRequestError {
  constructor(message: string) {
    super(`Error de regla de negocio - Crédito: ${message}`);
  }
}

/**
 * Error relacionado con reglas de negocio de garantías
 */
export class GarantiaBusinessError extends BadRequestError {
  constructor(message: string) {
    super(`Error de regla de negocio - Garantía: ${message}`);
  }
}

/**
 * Error relacionado con límites de crédito
 */
export class LimiteCreditoExcedidoError extends BadRequestError {
  constructor(limiteDisponible: number, montoSolicitado: number) {
    super(
      `Límite de crédito excedido. Límite disponible: $${limiteDisponible.toFixed(2)}, ` +
      `Monto solicitado: $${montoSolicitado.toFixed(2)}`
    );
  }
}

/**
 * Error relacionado con ahorro insuficiente
 */
export class AhorroInsuficienteError extends BadRequestError {
  constructor(saldoActual: number, montoRequerido: number) {
    super(
      `Ahorro insuficiente. Saldo actual: $${saldoActual.toFixed(2)}, ` +
      `Monto requerido: $${montoRequerido.toFixed(2)}`
    );
  }
}

/**
 * Error relacionado con mora
 */
export class MoraActivaError extends BadRequestError {
  constructor(diasMora: number) {
    super(`Socio tiene mora activa de ${diasMora} días. No puede solicitar nuevo crédito.`);
  }
}

/**
 * Error relacionado con recomendadores
 */
export class RecomendadoresInsuficientesError extends BadRequestError {
  constructor(requeridos: number, proporcionados: number) {
    super(
      `Recomendadores insuficientes. Requeridos: ${requeridos}, ` +
      `Proporcionados: ${proporcionados}`
    );
  }
}

/**
 * Error relacionado con documento de identidad duplicado
 */
export class DocumentoDuplicadoError extends ConflictError {
  constructor(documento: string) {
    super(`El documento de identidad ${documento} ya está registrado en el sistema.`);
  }
}

/**
 * Error relacionado con usuario duplicado
 */
export class UsuarioDuplicadoError extends ConflictError {
  constructor(usuario: string) {
    super(`El nombre de usuario ${usuario} ya está en uso.`);
  }
}

/**
 * Error relacionado con email duplicado
 */
export class EmailDuplicadoError extends ConflictError {
  constructor(email: string) {
    super(`El email ${email} ya está registrado en el sistema.`);
  }
}

/**
 * Error general de reglas de negocio
 */
export class BusinessRuleError extends BadRequestError {
  constructor(message: string) {
    super(`Violación de regla de negocio: ${message}`);
  }
}
