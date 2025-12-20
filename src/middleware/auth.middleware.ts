/**
 * ============================================================================
 * Sistema MLF - Middleware de Autenticación
 * Archivo: src/middleware/auth.middleware.ts
 * Descripción: Middleware para validar JWT y autorización por roles
 * ============================================================================
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest, JWTPayload, UserRole } from '../types/auth.types';

/**
 * Middleware para autenticar requests con JWT
 * Extrae el token del header Authorization y verifica su validez
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de autenticación no proporcionado');
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.rol,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Token inválido'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expirado'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware para verificar que el usuario es ADMIN
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new UnauthorizedError('Usuario no autenticado');
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'TESORERO') {
    throw new ForbiddenError('Se requieren permisos de administrador');
  }

  next();
};

/**
 * Middleware para verificar que el usuario es ADMIN o OPERADOR
 */
export const requireAdminOrOperator = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new UnauthorizedError('Usuario no autenticado');
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'TESORERO') {
    throw new ForbiddenError('Se requieren permisos de administrador u operador');
  }

  next();
};

/**
 * Middleware para verificar que el usuario tiene uno de los roles permitidos
 */
export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(`Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};
