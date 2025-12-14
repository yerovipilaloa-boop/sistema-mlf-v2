/**
 * ============================================================================
 * Sistema MLF - Controlador de Autenticación
 * Archivo: src/controllers/auth.controller.ts
 * Descripción: Controladores para endpoints de autenticación
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import authService from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/responses';
import {
  validarEmailOrThrow,
  validarPasswordOrThrow,
  validarUsernameOrThrow,
} from '../utils/validators';

/**
 * POST /api/v1/auth/login
 * Login de usuario
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { usuario, password } = req.body;

    // Validaciones
    if (!usuario || !password) {
      throw new Error('Usuario y contraseña son requeridos');
    }

    // Obtener IP del cliente
    const ipAddress = req.ip || req.socket.remoteAddress;

    // Login
    const result = await authService.login({ usuario, password }, ipAddress);

    sendSuccess(res, result, 'Login exitoso');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/register
 * Registrar nuevo usuario (solo ADMIN)
 */
export const register = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { usuario, password, email, nombreCompleto, documentoIdentidad, rol } = req.body;

    // Validaciones
    if (!usuario || !password || !email || !nombreCompleto || !documentoIdentidad) {
      throw new Error('Todos los campos son requeridos');
    }

    validarUsernameOrThrow(usuario);
    validarPasswordOrThrow(password);
    validarEmailOrThrow(email);

    // Registrar
    const result = await authService.register(
      {
        usuario,
        password,
        email,
        nombreCompleto,
        documentoIdentidad,
        rol,
      },
      req.user?.id
    );

    sendCreated(res, result, 'Usuario registrado exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Renovar access token
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new Error('Refresh token es requerido');
    }

    const result = await authService.refreshToken(refreshToken);

    sendSuccess(res, result, 'Token renovado exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 * Cerrar sesión
 */
export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new Error('Refresh token es requerido');
    }

    if (!req.user) {
      throw new Error('Usuario no autenticado');
    }

    await authService.logout(refreshToken, req.user.id);

    sendSuccess(res, null, 'Sesión cerrada exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/change-password
 * Cambiar contraseña
 */
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error('Todos los campos son requeridos');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden');
    }

    validarPasswordOrThrow(newPassword);

    if (!req.user) {
      throw new Error('Usuario no autenticado');
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    sendSuccess(res, null, 'Contraseña cambiada exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 * Obtener información del usuario autenticado
 */
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('Usuario no autenticado');
    }

    sendSuccess(res, req.user, 'Información de usuario obtenida exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/verify
 * Verificar si el token es válido
 */
export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('Token inválido');
    }

    sendSuccess(
      res,
      {
        valid: true,
        user: req.user,
      },
      'Token válido'
    );
  } catch (error) {
    next(error);
  }
};
