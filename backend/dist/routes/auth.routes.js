"use strict";
/**
 * ============================================================================
 * Sistema MLF - Rutas de Autenticación
 * Archivo: src/routes/auth.routes.ts
 * Descripción: Definición de rutas para autenticación
 * ============================================================================
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController = __importStar(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login de usuario
 * @access  Public
 */
router.post('/login', authController.login);
/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar nuevo usuario (solo ADMIN)
 * @access  Private (ADMIN)
 */
router.post('/register', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, authController.register);
/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Renovar access token
 * @access  Public
 */
router.post('/refresh', authController.refresh);
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout', auth_middleware_1.authenticate, authController.logout);
/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.post('/change-password', auth_middleware_1.authenticate, authController.changePassword);
/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', auth_middleware_1.authenticate, authController.getMe);
/**
 * @route   GET /api/v1/auth/verify
 * @desc    Verificar si el token es válido
 * @access  Private
 */
router.get('/verify', auth_middleware_1.authenticate, authController.verifyToken);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map