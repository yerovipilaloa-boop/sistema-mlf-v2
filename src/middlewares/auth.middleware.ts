/**
 * ============================================================================
 * Sistema MLF - Middleware de Autenticación
 * Archivo: src/middlewares/auth.middleware.ts
 * Descripción: Middlewares para verificar autenticación y autorización
 * ============================================================================
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, RolSocio } from '../types';
import authService from '../services/auth.service';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import logger from '../config/logger';

/**
 * Middleware para verificar que el usuario esté autenticado
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de autenticación no proporcionado');
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // 2. Verificar token
    const decoded = authService.verifyToken(token);

    // 3. Adjuntar usuario al request
    req.user = {
      id: decoded.id,
      codigo: decoded.codigo,
      email: decoded.email,
      rol: decoded.rol,
      nombreCompleto: decoded.nombreCompleto,
    };

    logger.debug(`Usuario autenticado: ${decoded.usuario} (ID: ${decoded.id})`);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 */
export const authorize = (...rolesPermitidos: RolSocio[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      // Verificar rol
      if (!rolesPermitidos.includes(req.user.rol)) {
        logger.warn(
          `Usuario ${req.user.codigo} intentó acceder sin permisos. ` +
          `Rol requerido: ${rolesPermitidos.join(', ')}, Rol actual: ${req.user.rol}`
        );
        throw new ForbiddenError(
          'No tienes permisos suficientes para realizar esta acción'
        );
      }

      logger.debug(
        `Usuario ${req.user.codigo} autorizado con rol ${req.user.rol}`
      );

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar que el usuario sea ADMIN
 */
export const requireAdmin = authorize(RolSocio.ADMIN);

/**
 * Middleware para verificar que el usuario sea ADMIN u OPERADOR
 */
export const requireAdminOrOperator = authorize(RolSocio.ADMIN, RolSocio.TESORERO);

/**
 * Middleware para verificar que el usuario acceda solo a sus propios recursos
 * o que sea ADMIN/OPERADOR
 */
export const requireOwnerOrAdmin = (idParamName: string = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const resourceId = parseInt(req.params[idParamName], 10);

      // Admin y Operador pueden acceder a cualquier recurso
      if (req.user.rol === RolSocio.ADMIN || req.user.rol === RolSocio.TESORERO) {
        return next();
      }

      // Usuario normal solo puede acceder a sus propios recursos
      if (req.user.id !== resourceId) {
        logger.warn(
          `Usuario ${req.user.codigo} intentó acceder al recurso de otro usuario (ID: ${resourceId})`
        );
        throw new ForbiddenError('No puedes acceder a recursos de otros usuarios');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware opcional: Si hay token, autenticar. Si no, continuar sin autenticar.
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);
      req.user = {
        id: decoded.id,
        codigo: decoded.codigo,
        email: decoded.email,
        rol: decoded.rol,
        nombreCompleto: decoded.nombreCompleto,
      };
    }

    next();
  } catch (error) {
    // Si falla la autenticación opcional, continuar sin usuario
    next();
  }
};
