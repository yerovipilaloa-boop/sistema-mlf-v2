"use strict";
/**
 * ============================================================================
 * Sistema MLF - Controlador de Autenticación
 * Archivo: src/controllers/auth.controller.ts
 * Descripción: Controladores para endpoints de autenticación
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.getMe = exports.changePassword = exports.logout = exports.refresh = exports.register = exports.login = void 0;
const auth_service_1 = __importDefault(require("../services/auth.service"));
const responses_1 = require("../utils/responses");
const validators_1 = require("../utils/validators");
/**
 * POST /api/v1/auth/login
 * Login de usuario
 */
const login = async (req, res, next) => {
    try {
        const { usuario, password } = req.body;
        // Validaciones
        if (!usuario || !password) {
            throw new Error('Usuario y contraseña son requeridos');
        }
        // Obtener IP del cliente
        const ipAddress = req.ip || req.socket.remoteAddress;
        // Login
        const result = await auth_service_1.default.login({ usuario, password }, ipAddress);
        (0, responses_1.sendSuccess)(res, result, 'Login exitoso');
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
/**
 * POST /api/v1/auth/register
 * Registrar nuevo usuario (solo ADMIN)
 */
const register = async (req, res, next) => {
    try {
        const { usuario, password, email, nombreCompleto, documentoIdentidad, rol } = req.body;
        // Validaciones
        if (!usuario || !password || !email || !nombreCompleto || !documentoIdentidad) {
            throw new Error('Todos los campos son requeridos');
        }
        (0, validators_1.validarUsernameOrThrow)(usuario);
        (0, validators_1.validarPasswordOrThrow)(password);
        (0, validators_1.validarEmailOrThrow)(email);
        // Registrar
        const result = await auth_service_1.default.register({
            usuario,
            password,
            email,
            nombreCompleto,
            documentoIdentidad,
            rol,
        }, req.user?.id);
        (0, responses_1.sendCreated)(res, result, 'Usuario registrado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
/**
 * POST /api/v1/auth/refresh
 * Renovar access token
 */
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new Error('Refresh token es requerido');
        }
        const result = await auth_service_1.default.refreshToken(refreshToken);
        (0, responses_1.sendSuccess)(res, result, 'Token renovado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.refresh = refresh;
/**
 * POST /api/v1/auth/logout
 * Cerrar sesión
 */
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new Error('Refresh token es requerido');
        }
        if (!req.user) {
            throw new Error('Usuario no autenticado');
        }
        await auth_service_1.default.logout(refreshToken, req.user.id);
        (0, responses_1.sendSuccess)(res, null, 'Sesión cerrada exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
/**
 * POST /api/v1/auth/change-password
 * Cambiar contraseña
 */
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        // Validaciones
        if (!currentPassword || !newPassword || !confirmPassword) {
            throw new Error('Todos los campos son requeridos');
        }
        if (newPassword !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }
        (0, validators_1.validarPasswordOrThrow)(newPassword);
        if (!req.user) {
            throw new Error('Usuario no autenticado');
        }
        await auth_service_1.default.changePassword(req.user.id, currentPassword, newPassword);
        (0, responses_1.sendSuccess)(res, null, 'Contraseña cambiada exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
/**
 * GET /api/v1/auth/me
 * Obtener información del usuario autenticado
 */
const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new Error('Usuario no autenticado');
        }
        (0, responses_1.sendSuccess)(res, req.user, 'Información de usuario obtenida exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
/**
 * GET /api/v1/auth/verify
 * Verificar si el token es válido
 */
const verifyToken = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new Error('Token inválido');
        }
        (0, responses_1.sendSuccess)(res, {
            valid: true,
            user: req.user,
        }, 'Token válido');
    }
    catch (error) {
        next(error);
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.controller.js.map