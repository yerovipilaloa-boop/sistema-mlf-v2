/**
 * ============================================================================
 * Sistema MLF - Rutas de Autenticación
 * Archivo: src/routes/auth.routes.ts
 * Descripción: Definición de rutas para autenticación
 * ============================================================================
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

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
router.post('/register', authenticate, requireAdmin, authController.register);

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
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.post('/change-password', authenticate, authController.changePassword);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   GET /api/v1/auth/verify
 * @desc    Verificar si el token es válido
 * @access  Private
 */
router.get('/verify', authenticate, authController.verifyToken);

export default router;
