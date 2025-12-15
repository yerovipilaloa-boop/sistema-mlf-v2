"use strict";
/**
 * ============================================================================
 * Sistema MLF - Servicio de Autenticación
 * Archivo: src/services/auth.service.ts
 * Descripción: Lógica de negocio para autenticación y manejo de sesiones
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const env_1 = __importDefault(require("../config/env"));
const logger_1 = __importDefault(require("../config/logger"));
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
// ============================================================================
// SERVICIO DE AUTENTICACIÓN
// ============================================================================
class AuthService {
    /**
     * Login de usuario
     */
    async login(credentials, ipAddress) {
        const { usuario, password } = credentials;
        // 1. Buscar usuario
        const socio = await database_1.default.socio.findFirst({
            where: {
                OR: [{ usuario }, { email: usuario }],
                estado: 'ACTIVO',
            },
        });
        if (!socio) {
            logger_1.default.warn(`Intento de login fallido para usuario: ${usuario}`);
            throw new errors_1.UnauthorizedError('Credenciales inválidas');
        }
        // 2. Verificar que tenga usuario y password configurados
        if (!socio.usuario || !socio.passwordHash) {
            throw new errors_1.UnauthorizedError('Usuario no tiene credenciales configuradas. Contacte al administrador.');
        }
        // 3. Verificar password
        const passwordMatch = await bcryptjs_1.default.compare(password, socio.passwordHash);
        if (!passwordMatch) {
            logger_1.default.warn(`Password incorrecto para usuario: ${usuario}`);
            throw new errors_1.UnauthorizedError('Credenciales inválidas');
        }
        // 4. Generar tokens
        const tokenPayload = {
            id: socio.id,
            codigo: socio.codigo,
            usuario: socio.usuario,
            email: socio.email,
            rol: socio.rol,
            nombreCompleto: socio.nombreCompleto,
        };
        const accessToken = this.generateAccessToken(tokenPayload);
        const refreshToken = this.generateRefreshToken(tokenPayload);
        // 5. Crear sesión
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas
        await database_1.default.sesion.create({
            data: {
                token: refreshToken,
                socioId: socio.id,
                usuarioEmail: socio.email,
                usuarioRol: socio.rol,
                ipAddress,
                fechaExpiracion: expiresAt,
            },
        });
        // 6. Registrar auditoría
        await this.registrarAuditoria({
            usuarioId: socio.id,
            usuarioEmail: socio.email,
            usuarioRol: socio.rol,
            usuarioIp: ipAddress,
            entidad: 'sesiones',
            accion: 'LOGIN',
            descripcion: `Usuario ${socio.usuario} inició sesión exitosamente`,
            exitosa: true,
        });
        logger_1.default.info(`Usuario ${socio.usuario} (ID: ${socio.id}) inició sesión exitosamente`);
        return {
            user: {
                id: socio.id,
                codigo: socio.codigo,
                usuario: socio.usuario,
                email: socio.email,
                rol: socio.rol,
                nombreCompleto: socio.nombreCompleto,
            },
            accessToken,
            refreshToken,
            expiresIn: env_1.default.jwt.expiresIn,
        };
    }
    /**
     * Registrar nuevo usuario (solo para ADMIN/OPERADOR)
     */
    async register(data, creadorId) {
        const { usuario, password, email, nombreCompleto, documentoIdentidad, rol } = data;
        // 1. Verificar si usuario ya existe
        const usuarioExistente = await database_1.default.socio.findFirst({
            where: { usuario },
        });
        if (usuarioExistente) {
            throw new errors_1.UsuarioDuplicadoError(usuario);
        }
        // 2. Verificar si email ya existe
        const emailExistente = await database_1.default.socio.findFirst({
            where: { email },
        });
        if (emailExistente) {
            throw new errors_1.EmailDuplicadoError(email);
        }
        // 3. Hash de password
        const passwordHash = await bcryptjs_1.default.hash(password, env_1.default.bcryptRounds);
        // 4. Generar código único
        const year = new Date().getFullYear();
        const ultimoSocio = await database_1.default.socio.findFirst({
            where: {
                codigo: {
                    startsWith: `SOC-${year}`,
                },
            },
            orderBy: {
                codigo: 'desc',
            },
        });
        let secuencial = 1;
        if (ultimoSocio) {
            const ultimoSecuencial = parseInt(ultimoSocio.codigo.split('-')[2]);
            secuencial = ultimoSecuencial + 1;
        }
        const codigo = `SOC-${year}-${secuencial.toString().padStart(4, '0')}`;
        // 5. Crear socio
        const nuevoSocio = await database_1.default.socio.create({
            data: {
                codigo,
                nombreCompleto,
                documentoIdentidad,
                fechaNacimiento: new Date('1990-01-01'), // Temporal
                direccion: 'Por definir',
                ciudad: 'Por definir',
                telefono: '0000000000',
                email,
                usuario,
                passwordHash,
                rol: rol || types_1.RolSocio.SOCIO,
                estado: 'ACTIVO',
                etapaActual: 1,
            },
        });
        // 6. Registrar auditoría
        await this.registrarAuditoria({
            usuarioId: creadorId,
            entidad: 'socios',
            entidadId: nuevoSocio.id,
            accion: 'CREAR',
            descripcion: `Nuevo usuario registrado: ${usuario} (${email})`,
            datosNuevos: {
                codigo: nuevoSocio.codigo,
                usuario,
                email,
                rol: nuevoSocio.rol,
            },
            exitosa: true,
        });
        logger_1.default.info(`Nuevo usuario registrado: ${usuario} (ID: ${nuevoSocio.id})`);
        // 7. Generar tokens para auto-login
        const tokenPayload = {
            id: nuevoSocio.id,
            codigo: nuevoSocio.codigo,
            usuario: nuevoSocio.usuario,
            email: nuevoSocio.email,
            rol: nuevoSocio.rol,
            nombreCompleto: nuevoSocio.nombreCompleto,
        };
        const accessToken = this.generateAccessToken(tokenPayload);
        const refreshToken = this.generateRefreshToken(tokenPayload);
        // 8. Crear sesión
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        await database_1.default.sesion.create({
            data: {
                token: refreshToken,
                socioId: nuevoSocio.id,
                usuarioEmail: nuevoSocio.email,
                usuarioRol: nuevoSocio.rol,
                fechaExpiracion: expiresAt,
            },
        });
        return {
            user: {
                id: nuevoSocio.id,
                codigo: nuevoSocio.codigo,
                usuario: nuevoSocio.usuario,
                email: nuevoSocio.email,
                rol: nuevoSocio.rol,
                nombreCompleto: nuevoSocio.nombreCompleto,
            },
            accessToken,
            refreshToken,
            expiresIn: env_1.default.jwt.expiresIn,
        };
    }
    /**
     * Refresh token
     */
    async refreshToken(refreshToken) {
        try {
            // 1. Verificar token
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.default.jwt.secret);
            // 2. Verificar que la sesión exista y esté activa
            const sesion = await database_1.default.sesion.findFirst({
                where: {
                    token: refreshToken,
                    activa: true,
                    fechaExpiracion: {
                        gt: new Date(),
                    },
                },
            });
            if (!sesion) {
                throw new errors_1.UnauthorizedError('Sesión inválida o expirada');
            }
            // 3. Verificar que el usuario siga activo
            const socio = await database_1.default.socio.findUnique({
                where: { id: decoded.id },
            });
            if (!socio || socio.estado !== 'ACTIVO') {
                throw new errors_1.UnauthorizedError('Usuario inactivo o eliminado');
            }
            // 4. Actualizar último acceso de la sesión
            await database_1.default.sesion.update({
                where: { id: sesion.id },
                data: {
                    fechaUltimoAcceso: new Date(),
                },
            });
            // 5. Generar nuevo access token
            const tokenPayload = {
                id: socio.id,
                codigo: socio.codigo,
                usuario: socio.usuario,
                email: socio.email,
                rol: socio.rol,
                nombreCompleto: socio.nombreCompleto,
            };
            const accessToken = this.generateAccessToken(tokenPayload);
            return { accessToken };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errors_1.UnauthorizedError('Token inválido');
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errors_1.UnauthorizedError('Token expirado');
            }
            throw error;
        }
    }
    /**
     * Logout
     */
    async logout(refreshToken, usuarioId) {
        // 1. Buscar sesión
        const sesion = await database_1.default.sesion.findFirst({
            where: {
                token: refreshToken,
                socioId: usuarioId,
            },
        });
        if (!sesion) {
            throw new errors_1.NotFoundError('Sesión no encontrada');
        }
        // 2. Cerrar sesión
        await database_1.default.sesion.update({
            where: { id: sesion.id },
            data: {
                activa: false,
                fechaCierre: new Date(),
            },
        });
        // 3. Registrar auditoría
        await this.registrarAuditoria({
            usuarioId,
            entidad: 'sesiones',
            entidadId: sesion.id,
            accion: 'LOGOUT',
            descripcion: 'Usuario cerró sesión',
            exitosa: true,
        });
        logger_1.default.info(`Usuario ID ${usuarioId} cerró sesión`);
    }
    /**
     * Cambiar contraseña
     */
    async changePassword(usuarioId, currentPassword, newPassword) {
        // 1. Buscar usuario
        const socio = await database_1.default.socio.findUnique({
            where: { id: usuarioId },
        });
        if (!socio || !socio.passwordHash) {
            throw new errors_1.NotFoundError('Usuario no encontrado');
        }
        // 2. Verificar contraseña actual
        const passwordMatch = await bcryptjs_1.default.compare(currentPassword, socio.passwordHash);
        if (!passwordMatch) {
            throw new errors_1.BadRequestError('Contraseña actual incorrecta');
        }
        // 3. Hash nueva contraseña
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, env_1.default.bcryptRounds);
        // 4. Actualizar contraseña
        await database_1.default.socio.update({
            where: { id: usuarioId },
            data: {
                passwordHash: newPasswordHash,
            },
        });
        // 5. Cerrar todas las sesiones activas (excepto la actual)
        await database_1.default.sesion.updateMany({
            where: {
                socioId: usuarioId,
                activa: true,
            },
            data: {
                activa: false,
                fechaCierre: new Date(),
            },
        });
        // 6. Registrar auditoría
        await this.registrarAuditoria({
            usuarioId,
            entidad: 'socios',
            entidadId: usuarioId,
            accion: 'ACTUALIZAR',
            descripcion: 'Usuario cambió su contraseña',
            exitosa: true,
        });
        logger_1.default.info(`Usuario ID ${usuarioId} cambió su contraseña`);
    }
    /**
     * Verificar token
     */
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, env_1.default.jwt.secret);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errors_1.UnauthorizedError('Token expirado');
            }
            throw new errors_1.UnauthorizedError('Token inválido');
        }
    }
    // ============================================================================
    // MÉTODOS PRIVADOS
    // ============================================================================
    generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, env_1.default.jwt.secret, {
            expiresIn: env_1.default.jwt.expiresIn,
        });
    }
    generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, env_1.default.jwt.secret, {
            expiresIn: env_1.default.jwt.refreshExpiresIn,
        });
    }
    async registrarAuditoria(data) {
        try {
            await database_1.default.auditoria.create({
                data: {
                    usuarioId: data.usuarioId,
                    usuarioEmail: data.usuarioEmail,
                    usuarioRol: data.usuarioRol,
                    usuarioIp: data.usuarioIp,
                    entidad: data.entidad,
                    entidadId: data.entidadId,
                    accion: data.accion,
                    descripcion: data.descripcion,
                    datosAnteriores: data.datosAnteriores,
                    datosNuevos: data.datosNuevos,
                    exitosa: data.exitosa,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error al registrar auditoría:', error);
        }
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map