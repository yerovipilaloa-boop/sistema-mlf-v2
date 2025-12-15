/**
 * ============================================================================
 * Sistema MLF - Middleware de Autenticación
 * Archivo: src/middleware/auth.middleware.ts
 * Descripción: Middleware para validar JWT y autorización por roles
 * ============================================================================
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types/auth.types';
/**
 * Middleware para autenticar requests con JWT
 * Extrae el token del header Authorization y verifica su validez
 */
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware para verificar que el usuario es ADMIN
 */
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware para verificar que el usuario es ADMIN o OPERADOR
 */
export declare const requireAdminOrOperator: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware para verificar que el usuario tiene uno de los roles permitidos
 */
export declare const requireRoles: (...allowedRoles: UserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map