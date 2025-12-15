/**
 * ============================================================================
 * Sistema MLF - Tipos de Autenticación
 * Archivo: src/types/auth.types.ts
 * Descripción: Tipos relacionados con autenticación y autorización
 * ============================================================================
 */
import { Request } from 'express';
/**
 * Roles de usuario en el sistema
 */
export type UserRole = 'ADMIN' | 'OPERADOR' | 'SOCIO' | 'TESORERO';
/**
 * Payload del JWT
 */
export interface JWTPayload {
    userId: number;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
/**
 * Request extendido con información del usuario autenticado
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: UserRole;
    };
}
/**
 * DTOs de autenticación
 */
export interface LoginDTO {
    email: string;
    password: string;
}
export interface RegisterDTO {
    email: string;
    password: string;
    nombreCompleto: string;
}
export interface RefreshTokenDTO {
    refreshToken: string;
}
/**
 * Respuestas de autenticación
 */
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        email: string;
        role: UserRole;
        nombreCompleto: string;
    };
}
export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}
//# sourceMappingURL=auth.types.d.ts.map