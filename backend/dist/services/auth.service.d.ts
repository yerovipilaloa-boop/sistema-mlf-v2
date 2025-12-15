/**
 * ============================================================================
 * Sistema MLF - Servicio de Autenticación
 * Archivo: src/services/auth.service.ts
 * Descripción: Lógica de negocio para autenticación y manejo de sesiones
 * ============================================================================
 */
import { RolSocio } from '../types';
interface LoginCredentials {
    usuario: string;
    password: string;
}
interface RegisterData {
    usuario: string;
    password: string;
    email: string;
    nombreCompleto: string;
    documentoIdentidad: string;
    rol?: RolSocio;
}
interface TokenPayload {
    id: number;
    codigo: string;
    usuario: string;
    email: string;
    rol: RolSocio;
    nombreCompleto: string;
}
interface AuthResponse {
    user: {
        id: number;
        codigo: string;
        usuario: string;
        email: string;
        rol: RolSocio;
        nombreCompleto: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
declare class AuthService {
    /**
     * Login de usuario
     */
    login(credentials: LoginCredentials, ipAddress?: string): Promise<AuthResponse>;
    /**
     * Registrar nuevo usuario (solo para ADMIN/OPERADOR)
     */
    register(data: RegisterData, creadorId?: number): Promise<AuthResponse>;
    /**
     * Refresh token
     */
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    /**
     * Logout
     */
    logout(refreshToken: string, usuarioId: number): Promise<void>;
    /**
     * Cambiar contraseña
     */
    changePassword(usuarioId: number, currentPassword: string, newPassword: string): Promise<void>;
    /**
     * Verificar token
     */
    verifyToken(token: string): TokenPayload;
    private generateAccessToken;
    private generateRefreshToken;
    private registrarAuditoria;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map