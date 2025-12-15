/**
 * ============================================================================
 * Sistema MLF - Controlador de Autenticación
 * Archivo: src/controllers/auth.controller.ts
 * Descripción: Controladores para endpoints de autenticación
 * ============================================================================
 */
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * POST /api/v1/auth/login
 * Login de usuario
 */
export declare const login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/auth/register
 * Registrar nuevo usuario (solo ADMIN)
 */
export declare const register: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/auth/refresh
 * Renovar access token
 */
export declare const refresh: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/auth/logout
 * Cerrar sesión
 */
export declare const logout: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/auth/change-password
 * Cambiar contraseña
 */
export declare const changePassword: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/auth/me
 * Obtener información del usuario autenticado
 */
export declare const getMe: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/auth/verify
 * Verificar si el token es válido
 */
export declare const verifyToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map