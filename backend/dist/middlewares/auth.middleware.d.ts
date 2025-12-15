/**
 * ============================================================================
 * Sistema MLF - Middleware de Autenticación
 * Archivo: src/middlewares/auth.middleware.ts
 * Descripción: Middlewares para verificar autenticación y autorización
 * ============================================================================
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, RolSocio } from '../types';
/**
 * Middleware para verificar que el usuario esté autenticado
 */
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 */
export declare const authorize: (...rolesPermitidos: RolSocio[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware para verificar que el usuario sea ADMIN
 */
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware para verificar que el usuario sea ADMIN u OPERADOR
 */
export declare const requireAdminOrOperator: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware para verificar que el usuario acceda solo a sus propios recursos
 * o que sea ADMIN/OPERADOR
 */
export declare const requireOwnerOrAdmin: (idParamName?: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware opcional: Si hay token, autenticar. Si no, continuar sin autenticar.
 */
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map