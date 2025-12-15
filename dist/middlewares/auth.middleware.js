"use strict";
/**
 * ============================================================================
 * Sistema MLF - Middleware de Autenticación
 * Archivo: src/middlewares/auth.middleware.ts
 * Descripción: Middlewares para verificar autenticación y autorización
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireOwnerOrAdmin = exports.requireAdminOrOperator = exports.requireAdmin = exports.authorize = exports.authenticate = void 0;
const types_1 = require("../types");
const auth_service_1 = __importDefault(require("../services/auth.service"));
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Middleware para verificar que el usuario esté autenticado
 */
const authenticate = async (req, res, next) => {
    try {
        // 1. Obtener token del header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('Token de autenticación no proporcionado');
        }
        const token = authHeader.substring(7); // Remover "Bearer "
        // 2. Verificar token
        const decoded = auth_service_1.default.verifyToken(token);
        // 3. Adjuntar usuario al request
        req.user = {
            id: decoded.id,
            codigo: decoded.codigo,
            email: decoded.email,
            rol: decoded.rol,
            nombreCompleto: decoded.nombreCompleto,
        };
        logger_1.default.debug(`Usuario autenticado: ${decoded.usuario} (ID: ${decoded.id})`);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 */
const authorize = (...rolesPermitidos) => {
    return (req, res, next) => {
        try {
            // Verificar que el usuario esté autenticado
            if (!req.user) {
                throw new errors_1.UnauthorizedError('Usuario no autenticado');
            }
            // Verificar rol
            if (!rolesPermitidos.includes(req.user.rol)) {
                logger_1.default.warn(`Usuario ${req.user.codigo} intentó acceder sin permisos. ` +
                    `Rol requerido: ${rolesPermitidos.join(', ')}, Rol actual: ${req.user.rol}`);
                throw new errors_1.ForbiddenError('No tienes permisos suficientes para realizar esta acción');
            }
            logger_1.default.debug(`Usuario ${req.user.codigo} autorizado con rol ${req.user.rol}`);
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
/**
 * Middleware para verificar que el usuario sea ADMIN
 */
exports.requireAdmin = (0, exports.authorize)(types_1.RolSocio.ADMIN);
/**
 * Middleware para verificar que el usuario sea ADMIN u OPERADOR
 */
exports.requireAdminOrOperator = (0, exports.authorize)(types_1.RolSocio.ADMIN, types_1.RolSocio.OPERADOR);
/**
 * Middleware para verificar que el usuario acceda solo a sus propios recursos
 * o que sea ADMIN/OPERADOR
 */
const requireOwnerOrAdmin = (idParamName = 'id') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new errors_1.UnauthorizedError('Usuario no autenticado');
            }
            const resourceId = parseInt(req.params[idParamName], 10);
            // Admin y Operador pueden acceder a cualquier recurso
            if (req.user.rol === types_1.RolSocio.ADMIN || req.user.rol === types_1.RolSocio.OPERADOR) {
                return next();
            }
            // Usuario normal solo puede acceder a sus propios recursos
            if (req.user.id !== resourceId) {
                logger_1.default.warn(`Usuario ${req.user.codigo} intentó acceder al recurso de otro usuario (ID: ${resourceId})`);
                throw new errors_1.ForbiddenError('No puedes acceder a recursos de otros usuarios');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireOwnerOrAdmin = requireOwnerOrAdmin;
/**
 * Middleware opcional: Si hay token, autenticar. Si no, continuar sin autenticar.
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = auth_service_1.default.verifyToken(token);
            req.user = {
                id: decoded.id,
                codigo: decoded.codigo,
                email: decoded.email,
                rol: decoded.rol,
                nombreCompleto: decoded.nombreCompleto,
            };
        }
        next();
    }
    catch (error) {
        // Si falla la autenticación opcional, continuar sin usuario
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map