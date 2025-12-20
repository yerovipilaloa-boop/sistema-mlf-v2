/**
 * ============================================================================
 * Sistema MLF - Servicio de Autenticación
 * Archivo: src/services/auth.service.ts
 * Descripción: Lógica de negocio para autenticación y manejo de sesiones
 * ============================================================================
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import config from '../config/env';
import logger from '../config/logger';
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  UsuarioDuplicadoError,
  EmailDuplicadoError,
} from '../utils/errors';
import { RolSocio } from '../types';

// ============================================================================
// INTERFACES
// ============================================================================

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

// ============================================================================
// SERVICIO DE AUTENTICACIÓN
// ============================================================================

class AuthService {
  /**
   * Login de usuario
   */
  async login(credentials: LoginCredentials, ipAddress?: string): Promise<AuthResponse> {
    const { usuario, password } = credentials;

    // 1. Buscar usuario
    const socio = await prisma.socio.findFirst({
      where: {
        OR: [{ usuario }, { email: usuario }],
        estado: 'ACTIVO',
      },
    });

    if (!socio) {
      logger.warn(`Intento de login fallido para usuario: ${usuario}`);
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // 2. Verificar que tenga usuario y password configurados
    if (!socio.usuario || !socio.passwordHash) {
      throw new UnauthorizedError(
        'Usuario no tiene credenciales configuradas. Contacte al administrador.'
      );
    }

    // 3. Verificar password
    const passwordMatch = await bcrypt.compare(password, socio.passwordHash);

    if (!passwordMatch) {
      logger.warn(`Password incorrecto para usuario: ${usuario}`);
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // 4. Generar tokens
    const tokenPayload: TokenPayload = {
      id: socio.id,
      codigo: socio.codigo,
      usuario: socio.usuario,
      email: socio.email,
      rol: socio.rol as RolSocio,
      nombreCompleto: socio.nombreCompleto,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // 5. Crear sesión
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas

    await prisma.sesion.create({
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

    logger.info(`Usuario ${socio.usuario} (ID: ${socio.id}) inició sesión exitosamente`);

    return {
      user: {
        id: socio.id,
        codigo: socio.codigo,
        usuario: socio.usuario,
        email: socio.email,
        rol: socio.rol as RolSocio,
        nombreCompleto: socio.nombreCompleto,
      },
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    };
  }

  /**
   * Registrar nuevo usuario (solo para ADMIN/OPERADOR)
   */
  async register(data: RegisterData, creadorId?: number): Promise<AuthResponse> {
    const { usuario, password, email, nombreCompleto, documentoIdentidad, rol } = data;

    // 1. Verificar si usuario ya existe
    const usuarioExistente = await prisma.socio.findFirst({
      where: { usuario },
    });

    if (usuarioExistente) {
      throw new UsuarioDuplicadoError(usuario);
    }

    // 2. Verificar si email ya existe
    const emailExistente = await prisma.socio.findFirst({
      where: { email },
    });

    if (emailExistente) {
      throw new EmailDuplicadoError(email);
    }

    // 3. Hash de password
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // 4. Generar código único
    const year = new Date().getFullYear();
    const ultimoSocio = await prisma.socio.findFirst({
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
    const nuevoSocio = await prisma.socio.create({
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
        rol: rol || RolSocio.SOCIO,
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

    logger.info(`Nuevo usuario registrado: ${usuario} (ID: ${nuevoSocio.id})`);

    // 7. Generar tokens para auto-login
    const tokenPayload: TokenPayload = {
      id: nuevoSocio.id,
      codigo: nuevoSocio.codigo,
      usuario: nuevoSocio.usuario!,
      email: nuevoSocio.email,
      rol: nuevoSocio.rol as RolSocio,
      nombreCompleto: nuevoSocio.nombreCompleto,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // 8. Crear sesión
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.sesion.create({
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
        usuario: nuevoSocio.usuario!,
        email: nuevoSocio.email,
        rol: nuevoSocio.rol as RolSocio,
        nombreCompleto: nuevoSocio.nombreCompleto,
      },
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    };
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // 1. Verificar token
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as TokenPayload;

      // 2. Verificar que la sesión exista y esté activa
      const sesion = await prisma.sesion.findFirst({
        where: {
          token: refreshToken,
          activa: true,
          fechaExpiracion: {
            gt: new Date(),
          },
        },
      });

      if (!sesion) {
        throw new UnauthorizedError('Sesión inválida o expirada');
      }

      // 3. Verificar que el usuario siga activo
      const socio = await prisma.socio.findUnique({
        where: { id: decoded.id },
      });

      if (!socio || socio.estado !== 'ACTIVO') {
        throw new UnauthorizedError('Usuario inactivo o eliminado');
      }

      // 4. Actualizar último acceso de la sesión
      await prisma.sesion.update({
        where: { id: sesion.id },
        data: {
          fechaUltimoAcceso: new Date(),
        },
      });

      // 5. Generar nuevo access token
      const tokenPayload: TokenPayload = {
        id: socio.id,
        codigo: socio.codigo,
        usuario: socio.usuario!,
        email: socio.email,
        rol: socio.rol as RolSocio,
        nombreCompleto: socio.nombreCompleto,
      };

      const accessToken = this.generateAccessToken(tokenPayload);

      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Token inválido');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expirado');
      }
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout(refreshToken: string, usuarioId: number): Promise<void> {
    // 1. Buscar sesión
    const sesion = await prisma.sesion.findFirst({
      where: {
        token: refreshToken,
        socioId: usuarioId,
      },
    });

    if (!sesion) {
      throw new NotFoundError('Sesión no encontrada');
    }

    // 2. Cerrar sesión
    await prisma.sesion.update({
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

    logger.info(`Usuario ID ${usuarioId} cerró sesión`);
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(
    usuarioId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // 1. Buscar usuario
    const socio = await prisma.socio.findUnique({
      where: { id: usuarioId },
    });

    if (!socio || !socio.passwordHash) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // 2. Verificar contraseña actual
    const passwordMatch = await bcrypt.compare(currentPassword, socio.passwordHash);

    if (!passwordMatch) {
      throw new BadRequestError('Contraseña actual incorrecta');
    }

    // 3. Hash nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

    // 4. Actualizar contraseña
    await prisma.socio.update({
      where: { id: usuarioId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // 5. Cerrar todas las sesiones activas (excepto la actual)
    await prisma.sesion.updateMany({
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

    logger.info(`Usuario ID ${usuarioId} cambió su contraseña`);
  }

  /**
   * Verificar token
   */
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expirado');
      }
      throw new UnauthorizedError('Token inválido');
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn as string,
    } as jwt.SignOptions);
  }

  private async registrarAuditoria(data: {
    usuarioId?: number;
    usuarioEmail?: string;
    usuarioRol?: string;
    usuarioIp?: string;
    entidad: string;
    entidadId?: number;
    accion: string;
    descripcion: string;
    datosAnteriores?: any;
    datosNuevos?: any;
    exitosa: boolean;
  }): Promise<void> {
    try {
      await prisma.auditoria.create({
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
    } catch (error) {
      logger.error('Error al registrar auditoría:', error);
    }
  }
}

export default new AuthService();
