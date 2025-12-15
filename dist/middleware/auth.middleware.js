"use strict";
/**
 * ============================================================================
 * Sistema MLF - Middleware de Autenticación
 * Archivo: src/middleware/auth.middleware.ts
 * Descripción: Middleware para validar JWT y autorización por roles
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = exports.requireAdminOrOperator = exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const errors_1 = require("../utils/errors");
/**
 * Middleware para autenticar requests con JWT
 * Extrae el token del header Authorization y verifica su validez
 */
const authenticate = async (req, res, next) => {
    try {
        // Extraer token del header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('Token de autenticación no proporcionado');
        }
        const token = authHeader.substring(7); // Remover 'Bearer '
        // Verificar token
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.jwt.secret);
        // Agregar información del usuario al request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.rol,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errors_1.UnauthorizedError('Token inválido'));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new errors_1.UnauthorizedError('Token expirado'));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
/**
 * Middleware para verificar que el usuario es ADMIN
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        throw new errors_1.UnauthorizedError('Usuario no autenticado');
    }
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TESORERO') {
        throw new errors_1.ForbiddenError('Se requieren permisos de administrador');
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware para verificar que el usuario es ADMIN o OPERADOR
 */
const requireAdminOrOperator = (req, res, next) => {
    if (!req.user) {
        throw new errors_1.UnauthorizedError('Usuario no autenticado');
    }
    if (req.user.role !== 'ADMIN' && req.user.role !== 'OPERADOR' && req.user.role !== 'TESORERO') {
        throw new errors_1.ForbiddenError('Se requieren permisos de administrador u operador');
    }
    next();
};
exports.requireAdminOrOperator = requireAdminOrOperator;
/**
 * Middleware para verificar que el usuario tiene uno de los roles permitidos
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Usuario no autenticado');
        }
        if (!allowedRoles.includes(req.user.role)) {
            throw new errors_1.ForbiddenError(`Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`);
        }
        next();
    };
};
exports.requireRoles = requireRoles;
//# sourceMappingURL=auth.middleware.js.map