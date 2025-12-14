/**
 * ============================================================================
 * Sistema MLF - Servicio de Gestión de Socios
 * Archivo: src/services/socios.service.ts
 * Descripción: Lógica de negocio para gestión de socios
 * ============================================================================
 */

import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import config from '../config/env';
import logger from '../config/logger';
import {
  NotFoundError,
  BadRequestError,
  DocumentoDuplicadoError,
  EmailDuplicadoError,
  UsuarioDuplicadoError,
  SocioBusinessError,
  AhorroInsuficienteError,
} from '../utils/errors';
import {
  validarCedulaOrThrow,
  validarEmailOrThrow,
  validarTelefonoOrThrow,
  validarMayorEdadOrThrow,
  validarMontoPositivoOrThrow,
  validarUsernameOrThrow,
  sanitizarNombre,
} from '../utils/validators';
import { CrearSocioDTO, RolSocio, EstadoSocio, EtapaSocio } from '../types';

// ============================================================================
// INTERFACES
// ============================================================================

interface ActualizarSocioDTO {
  nombreCompleto?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  documentoIdentidad?: string;
  fechaNacimiento?: Date | string;
  estado?: EstadoSocio;
  usuario?: string;
  password?: string;
  etapaActual?: number; // Permitir cambio de etapa (1, 2, o 3)
}

interface DepositoRetiroDTO {
  socioId: number;
  monto: number;
  metodo: string;
  numeroReferencia?: string;
  concepto?: string;
}

interface CambiarEtapaDTO {
  socioId: number;
  nuevaEtapa: EtapaSocio;
  motivoAdministrativo?: string;
}

// ============================================================================
// SERVICIO DE SOCIOS
// ============================================================================

class SociosService {
  /**
   * Crear nuevo socio
   * Implementa RN-SOC-001 a RN-SOC-008
   */
  async crearSocio(data: CrearSocioDTO, creadorId?: number): Promise<any> {
    const {
      nombreCompleto,
      documentoIdentidad,
      fechaNacimiento,
      direccion,
      ciudad,
      telefono,
      email,
      depositoInicial,
      recomendadores,
      usuario,
      password,
      etapaActual,
    } = data;

    // ============================================================================
    // VALIDACIONES DE DATOS
    // ============================================================================

    // Validar cédula ecuatoriana (RN-SOC-001)
    validarCedulaOrThrow(documentoIdentidad);

    // Validar formato de datos
    validarEmailOrThrow(email);
    validarTelefonoOrThrow(telefono);
    validarMayorEdadOrThrow(fechaNacimiento, 18); // RN-SOC-002

    // Validar depósito inicial mínimo (RN-SOC-005)
    const depositoMinimo = await this.obtenerConfiguracion('AHORRO_DEPOSITO_INICIAL_MINIMO', 50);
    if (depositoInicial < depositoMinimo) {
      throw new SocioBusinessError(
        `El depósito inicial debe ser al menos $${depositoMinimo.toFixed(2)}`
      );
    }

    // ============================================================================
    // VERIFICAR DUPLICADOS
    // ============================================================================

    // Verificar documento único (RN-SOC-001)
    const documentoExiste = await prisma.socio.findUnique({
      where: { documentoIdentidad },
    });

    if (documentoExiste) {
      throw new DocumentoDuplicadoError(documentoIdentidad);
    }

    // Verificar email único
    const emailExiste = await prisma.socio.findFirst({
      where: { email },
    });

    if (emailExiste) {
      throw new EmailDuplicadoError(email);
    }

    // Validar usuario único
    validarUsernameOrThrow(usuario);
    const usuarioExiste = await prisma.socio.findUnique({
      where: { usuario },
    });

    if (usuarioExiste) {
      throw new UsuarioDuplicadoError(usuario);
    }

    // ============================================================================
    // VALIDAR RECOMENDADORES (RN-SOC-007, RN-SOC-008)
    // ============================================================================

    // Verificar si el creador es ADMIN
    let esAdmin = false;
    if (creadorId) {
      const creador = await prisma.socio.findUnique({
        where: { id: creadorId },
        select: { rol: true },
      });
      esAdmin = creador?.rol === 'ADMIN';
    }

    // Log de la etapa que se va a asignar
    if (etapaActual && esAdmin) {
      logger.info(`Admin asignando etapa ${etapaActual} al crear socio ${nombreCompleto}`);
    }

    const recomendadoresRequeridos = await this.obtenerConfiguracion(
      'RECOMENDADORES_REQUERIDOS',
      2
    );

    // Si es ADMIN, permitir flexibilidad en recomendadores
    if (!esAdmin) {
      // Para usuarios no-admin, aplicar validación estricta
      if (!recomendadores || recomendadores.length < recomendadoresRequeridos) {
        throw new SocioBusinessError(
          `Se requieren al menos ${recomendadoresRequeridos} recomendadores`
        );
      }
    } else {
      // Para ADMIN, permitir menos recomendadores o recomendadores duplicados
      logger.info(`Admin creando socio - validación de recomendadores relajada`);
    }

    // Verificar que recomendadores existan
    const recomendadoresUnicos = [...new Set(recomendadores)]; // Eliminar duplicados para validación
    for (const recomendadorId of recomendadoresUnicos) {
      const recomendador = await prisma.socio.findUnique({
        where: { id: recomendadorId },
      });

      if (!recomendador) {
        throw new NotFoundError(`Recomendador ID ${recomendadorId} no encontrado`);
      }

      // Si no es ADMIN, validar Etapa 3 y estado ACTIVO estrictamente
      if (!esAdmin) {
        if (recomendador.etapaActual !== 3) {
          throw new SocioBusinessError(
            `El recomendador ${recomendador.nombreCompleto} debe estar en Etapa Especial (3)`
          );
        }

        if (recomendador.estado !== 'ACTIVO') {
          throw new SocioBusinessError(
            `El recomendador ${recomendador.nombreCompleto} debe estar ACTIVO`
          );
        }
      } else {
        // Para ADMIN, solo validar que esté ACTIVO (puede ser cualquier etapa)
        if (recomendador.estado !== 'ACTIVO') {
          throw new SocioBusinessError(
            `El recomendador ${recomendador.nombreCompleto} debe estar ACTIVO`
          );
        }
      }
    }

    // ============================================================================
    // GENERAR CÓDIGO ÚNICO
    // ============================================================================

    const codigo = await this.generarCodigoSocio();

    // Generar hash del password
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // ============================================================================
    // CREAR SOCIO EN TRANSACCIÓN
    // ============================================================================

    const nuevoSocio = await prisma.$transaction(async (tx) => {
      // 0. Deshabilitar temporalmente triggers problemáticos
      await tx.$executeRawUnsafe('ALTER TABLE socios DISABLE TRIGGER after_insert_socio_validar_recomendadores');
      await tx.$executeRawUnsafe('ALTER TABLE transacciones DISABLE TRIGGER before_insert_transaccion_actualizar_saldo');

      // 1. Crear socio
      // Si el admin especificó una etapa, usarla; si no, por defecto Etapa 1 (Iniciante)
      const etapaInicial = etapaActual && [1, 2, 3].includes(etapaActual) ? etapaActual : 1;

      const socio = await tx.socio.create({
        data: {
          codigo,
          nombreCompleto: sanitizarNombre(nombreCompleto),
          documentoIdentidad,
          fechaNacimiento: new Date(fechaNacimiento),
          direccion,
          ciudad,
          telefono,
          email,
          usuario,
          passwordHash,
          rol: 'SOCIO', // Por defecto rol SOCIO
          ahorroActual: depositoInicial,
          ahorroCongelado: 0,
          etapaActual: etapaInicial, // Respeta la etapa seleccionada por el admin
          creditosEtapaActual: 0,
          estado: 'ACTIVO',
        },
      });

      // 2. Registrar recomendaciones (solo únicos, ya que hay constraint UNIQUE)
      const recomendadoresUnicos = [...new Set(recomendadores)];
      for (const recomendadorId of recomendadoresUnicos) {
        await tx.recomendacion.create({
          data: {
            socioRecomendadoId: socio.id,
            socioRecomendadorId: recomendadorId,
          },
        });
      }

      // 3. Registrar transacción de depósito inicial
      await tx.transaccion.create({
        data: {
          codigo: await this.generarCodigoTransaccion(socio.id, tx),
          socioId: socio.id,
          tipo: 'DEPOSITO',
          monto: depositoInicial,
          saldoAnterior: 0,
          saldoNuevo: depositoInicial,
          metodo: 'EFECTIVO', // Asumir efectivo por defecto
          concepto: 'Depósito inicial de nuevo socio',
        },
      });

      // 4. Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: creadorId,
          entidad: 'socios',
          entidadId: socio.id,
          accion: 'CREAR',
          descripcion: `Nuevo socio registrado: ${socio.codigo} - ${nombreCompleto}`,
          datosNuevos: {
            codigo: socio.codigo,
            nombreCompleto,
            email,
            etapa: 1,
            depositoInicial,
          },
          exitosa: true,
        },
      });

      // 5. Rehabilitar triggers
      await tx.$executeRawUnsafe('ALTER TABLE socios ENABLE TRIGGER after_insert_socio_validar_recomendadores');
      await tx.$executeRawUnsafe('ALTER TABLE transacciones ENABLE TRIGGER before_insert_transaccion_actualizar_saldo');

      return socio;
    });

    logger.info(`Socio creado exitosamente: ${nuevoSocio.codigo} - ${nombreCompleto}`);

    // Retornar con recomendadores
    return await this.obtenerSocioPorId(nuevoSocio.id);
  }

  /**
   * Obtener socio por ID
   */
  async obtenerSocioPorId(id: number): Promise<any> {
    const socio = await prisma.socio.findUnique({
      where: { id },
      include: {
        recomendacionesRecibidas: {
          include: {
            socioRecomendador: {
              select: {
                id: true,
                codigo: true,
                nombreCompleto: true,
                etapaActual: true,
              },
            },
          },
        },
        creditos: {
          select: {
            id: true,
            codigo: true,
            montoTotal: true,
            saldo_capital: true,
            estado: true,
            fechaSolicitud: true,
          },
          orderBy: {
            fechaSolicitud: 'desc',
          },
          take: 5, // Últimos 5 créditos
        },
      },
    });

    if (!socio) {
      throw new NotFoundError(`Socio con ID ${id} no encontrado`);
    }

    // Calcular ahorro comprometido (RN-AHO-001)
    // Suma del saldo_capital de todos los créditos DESEMBOLSADOS
    const ahorroComprometido = socio.creditos
      .filter((c: any) => c.estado === 'DESEMBOLSADO')
      .reduce((sum: number, c: any) => sum + (c.saldo_capital ? parseFloat(c.saldo_capital.toString()) : 0), 0);

    // Calcular ahorro disponible (RN-AHO-002)
    const ahorroDisponible = socio.ahorroActual.toNumber() - ahorroComprometido - socio.ahorroCongelado.toNumber();

    const socioFormateado = this.formatearSocio(socio);

    return {
      ...socioFormateado,
      ahorroComprometido,
      ahorroDisponible,
    };
  }

  /**
   * Obtener socio por código
   */
  async obtenerSocioPorCodigo(codigo: string): Promise<any> {
    const socio = await prisma.socio.findUnique({
      where: { codigo },
      include: {
        recomendacionesRecibidas: {
          include: {
            socioRecomendador: {
              select: {
                id: true,
                codigo: true,
                nombreCompleto: true,
                etapaActual: true,
              },
            },
          },
        },
      },
    });

    if (!socio) {
      throw new NotFoundError(`Socio con código ${codigo} no encontrado`);
    }

    return this.formatearSocio(socio);
  }

  /**
   * Listar socios con filtros y paginación
   */
  async listarSocios(filtros: {
    page?: number;
    limit?: number;
    estado?: EstadoSocio;
    etapa?: EtapaSocio;
    busqueda?: string;
  }): Promise<{
    socios: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, estado, etapa, busqueda } = filtros;

    // Construir filtros
    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (etapa) {
      where.etapaActual = etapa;
    }

    if (busqueda) {
      where.OR = [
        { nombreCompleto: { contains: busqueda, mode: 'insensitive' } },
        { codigo: { contains: busqueda, mode: 'insensitive' } },
        { documentoIdentidad: { contains: busqueda } },
        { email: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    // Contar total
    const total = await prisma.socio.count({ where });

    // Obtener socios
    const socios = await prisma.socio.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        fechaRegistro: 'desc',
      },
      select: {
        id: true,
        codigo: true,
        nombreCompleto: true,
        documentoIdentidad: true,
        email: true,
        telefono: true,
        ahorroActual: true,
        etapaActual: true,
        estado: true,
        creditosEtapaActual: true,
        fechaRegistro: true,
      },
    });

    return {
      socios,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Actualizar información del socio
   */
  async actualizarSocio(
    id: number,
    data: ActualizarSocioDTO,
    usuarioId?: number
  ): Promise<any> {
    // Verificar que el socio existe
    const socioExistente = await prisma.socio.findUnique({
      where: { id },
    });

    if (!socioExistente) {
      throw new NotFoundError(`Socio con ID ${id} no encontrado`);
    }

    // Preparar datos para actualización
    const updateData: any = {};

    // Validaciones y preparación de datos
    if (data.nombreCompleto !== undefined) {
      updateData.nombreCompleto = sanitizarNombre(data.nombreCompleto);
    }

    if (data.email !== undefined) {
      validarEmailOrThrow(data.email);

      // Verificar email único
      const emailExiste = await prisma.socio.findFirst({
        where: {
          email: data.email,
          NOT: { id },
        },
      });

      if (emailExiste) {
        throw new EmailDuplicadoError(data.email);
      }

      updateData.email = data.email;
    }

    if (data.telefono !== undefined) {
      validarTelefonoOrThrow(data.telefono);
      updateData.telefono = data.telefono;
    }

    if (data.direccion !== undefined) {
      updateData.direccion = data.direccion;
    }

    if (data.ciudad !== undefined) {
      updateData.ciudad = data.ciudad;
    }

    if (data.documentoIdentidad !== undefined) {
      validarCedulaOrThrow(data.documentoIdentidad);

      // Verificar documento único
      const documentoExiste = await prisma.socio.findFirst({
        where: {
          documentoIdentidad: data.documentoIdentidad,
          NOT: { id },
        },
      });

      if (documentoExiste) {
        throw new DocumentoDuplicadoError(data.documentoIdentidad);
      }

      updateData.documentoIdentidad = data.documentoIdentidad;
    }

    if (data.fechaNacimiento !== undefined) {
      const fechaNac = typeof data.fechaNacimiento === 'string'
        ? new Date(data.fechaNacimiento)
        : data.fechaNacimiento;

      validarMayorEdadOrThrow(fechaNac, 18);
      updateData.fechaNacimiento = fechaNac;
    }

    if (data.estado !== undefined) {
      updateData.estado = data.estado;
    }

    if (data.usuario !== undefined) {
      validarUsernameOrThrow(data.usuario);

      // Verificar usuario único
      const usuarioExiste = await prisma.socio.findFirst({
        where: {
          usuario: data.usuario,
          NOT: { id },
        },
      });

      if (usuarioExiste) {
        throw new UsuarioDuplicadoError(data.usuario);
      }

      updateData.usuario = data.usuario;
    }

    if (data.password !== undefined && data.password !== '') {
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(data.password, config.bcryptRounds);
      updateData.passwordHash = hashedPassword;
    }

    // Manejar cambio de etapa
    if (data.etapaActual !== undefined && data.etapaActual !== socioExistente.etapaActual) {
      // Validar que la etapa sea válida (1, 2, o 3)
      if (![1, 2, 3].includes(data.etapaActual)) {
        throw new BadRequestError('La etapa debe ser 1, 2 o 3');
      }

      logger.info(
        `Cambio de etapa para socio ${socioExistente.codigo}: ` +
        `Etapa ${socioExistente.etapaActual} → Etapa ${data.etapaActual}`
      );

      updateData.etapaActual = data.etapaActual;
      // Resetear contador de créditos al cambiar de etapa
      updateData.creditosEtapaActual = 0;

      logger.info(
        `Contador de créditos reseteado a 0 para socio ${socioExistente.codigo}`
      );
    }

    // Actualizar
    const socioActualizado = await prisma.$transaction(async (tx) => {
      const socio = await tx.socio.update({
        where: { id },
        data: updateData,
      });

      // Preparar descripción detallada de auditoría
      let descripcionAuditoria = `Información del socio ${socio.codigo} actualizada`;

      if (data.etapaActual !== undefined && data.etapaActual !== socioExistente.etapaActual) {
        descripcionAuditoria += ` | Cambio de etapa: ${socioExistente.etapaActual} → ${data.etapaActual} (contador reseteado a 0)`;
      }

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId,
          entidad: 'socios',
          entidadId: id,
          accion: 'ACTUALIZAR',
          descripcion: descripcionAuditoria,
          datosAnteriores: socioExistente,
          datosNuevos: updateData,
          exitosa: true,
        },
      });

      return socio;
    });

    logger.info(`Socio actualizado: ${socioActualizado.codigo}`);

    return await this.obtenerSocioPorId(id);
  }

  /**
   * Depositar ahorro
   * Implementa RN-AHO-001
   */
  async depositarAhorro(data: DepositoRetiroDTO, usuarioId?: number): Promise<any> {
    const { socioId, monto, metodo, numeroReferencia, concepto } = data;

    validarMontoPositivoOrThrow(monto, 'Monto de depósito');

    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      throw new NotFoundError(`Socio con ID ${socioId} no encontrado`);
    }

    if (socio.estado !== 'ACTIVO') {
      throw new SocioBusinessError('Solo socios ACTIVOS pueden depositar ahorros');
    }

    // Realizar depósito en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Registrar transacción (el trigger actualiza el saldo automáticamente)
      const transaccion = await tx.transaccion.create({
        data: {
          codigo: await this.generarCodigoTransaccion(socioId, tx),
          socioId,
          tipo: 'DEPOSITO',
          monto,
          saldoAnterior: socio.ahorroActual,
          saldoNuevo: 0, // El trigger lo calculará
          metodo,
          numeroReferencia,
          concepto: concepto || 'Depósito de ahorro',
        },
      });

      // Obtener socio actualizado después del trigger
      const socioActualizado = await tx.socio.findUnique({
        where: { id: socioId },
      });

      // Auditoría
      await tx.auditoria.create({
        data: {
          usuarioId,
          entidad: 'transacciones',
          entidadId: transaccion.id,
          accion: 'CREAR',
          descripcion: `Depósito de $${monto.toFixed(2)} para socio ${socio.codigo}`,
          datosNuevos: {
            socio: socio.codigo,
            monto,
            nuevoSaldo: socioActualizado?.ahorroActual.toNumber(),
          },
          exitosa: true,
        },
      });

      return { socioActualizado, transaccion };
    });

    logger.info(
      `Depósito exitoso: ${socio.codigo} - $${monto.toFixed(2)} - Nuevo saldo: $${resultado.socioActualizado.ahorroActual.toFixed(2)}`
    );

    return resultado.transaccion;
  }

  /**
   * Retirar ahorro
   * Implementa RN-AHO-002, RN-AHO-003
   */
  async retirarAhorro(data: DepositoRetiroDTO, usuarioId?: number): Promise<any> {
    const { socioId, monto, metodo, numeroReferencia, concepto } = data;

    validarMontoPositivoOrThrow(monto, 'Monto de retiro');

    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      throw new NotFoundError(`Socio con ID ${socioId} no encontrado`);
    }

    if (socio.estado !== 'ACTIVO') {
      throw new SocioBusinessError('Solo socios ACTIVOS pueden retirar ahorros');
    }

    // Verificar ahorro disponible (RN-AHO-002)
    const ahorroDisponible = socio.ahorroActual.toNumber() - socio.ahorroCongelado.toNumber();

    if (monto > ahorroDisponible) {
      throw new AhorroInsuficienteError(ahorroDisponible, monto);
    }

    // Verificar saldo mínimo (RN-AHO-003)
    const ahorroMinimo = await this.obtenerConfiguracion('AHORRO_MINIMO_ACTIVO', 10);
    const nuevoSaldo = socio.ahorroActual.toNumber() - monto;

    if (nuevoSaldo < ahorroMinimo) {
      throw new SocioBusinessError(
        `El saldo no puede ser menor a $${ahorroMinimo.toFixed(2)} (RN-AHO-003)`
      );
    }

    // Realizar retiro en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Registrar transacción (el trigger actualiza el saldo automáticamente y valida)
      const transaccion = await tx.transaccion.create({
        data: {
          codigo: await this.generarCodigoTransaccion(socioId, tx),
          socioId,
          tipo: 'RETIRO',
          monto,
          saldoAnterior: socio.ahorroActual,
          saldoNuevo: 0, // El trigger lo calculará
          metodo,
          numeroReferencia,
          concepto: concepto || 'Retiro de ahorro',
        },
      });

      // Obtener socio actualizado después del trigger
      const socioActualizado = await tx.socio.findUnique({
        where: { id: socioId },
      });

      // Auditoría
      await tx.auditoria.create({
        data: {
          usuarioId,
          entidad: 'transacciones',
          entidadId: transaccion.id,
          accion: 'CREAR',
          descripcion: `Retiro de $${monto.toFixed(2)} para socio ${socio.codigo}`,
          datosNuevos: {
            socio: socio.codigo,
            monto,
            nuevoSaldo: socioActualizado?.ahorroActual.toNumber(),
          },
          exitosa: true,
        },
      });

      return { socioActualizado, transaccion };
    });

    logger.info(
      `Retiro exitoso: ${socio.codigo} - $${monto.toFixed(2)} - Nuevo saldo: $${resultado.socioActualizado.ahorroActual.toFixed(2)}`
    );

    return resultado.transaccion;
  }

  /**
   * Cambiar etapa del socio (manual por administrador)
   */
  async cambiarEtapa(data: CambiarEtapaDTO, usuarioId?: number): Promise<any> {
    const { socioId, nuevaEtapa, motivoAdministrativo } = data;

    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      throw new NotFoundError(`Socio con ID ${socioId} no encontrado`);
    }

    if (![1, 2, 3].includes(nuevaEtapa)) {
      throw new BadRequestError('Etapa debe ser 1, 2 o 3');
    }

    if (socio.etapaActual === nuevaEtapa) {
      throw new BadRequestError('El socio ya está en esa etapa');
    }

    // Cambiar etapa en transacción
    const socioActualizado = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.socio.update({
        where: { id: socioId },
        data: {
          etapaActual: nuevaEtapa,
          creditosEtapaActual: 0, // Reiniciar contador de créditos en etapa
        },
      });

      // Auditoría
      await tx.auditoria.create({
        data: {
          usuarioId,
          entidad: 'socios',
          entidadId: socioId,
          accion: 'ACTUALIZAR',
          descripcion: `Cambio de etapa: ${socio.etapaActual} → ${nuevaEtapa} | Motivo: ${motivoAdministrativo || 'Cambio administrativo'}`,
          datosAnteriores: { etapa: socio.etapaActual },
          datosNuevos: { etapa: nuevaEtapa, motivo: motivoAdministrativo },
          exitosa: true,
        },
      });

      return actualizado;
    });

    logger.info(`Etapa cambiada: ${socio.codigo} - ${socio.etapaActual} → ${nuevaEtapa}`);

    return await this.obtenerSocioPorId(socioId);
  }

  /**
   * Suspender socio
   */
  async suspenderSocio(
    socioId: number,
    motivo: string,
    usuarioId?: number
  ): Promise<any> {
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      throw new NotFoundError(`Socio con ID ${socioId} no encontrado`);
    }

    if (socio.estado === 'INACTIVO') {
      throw new BadRequestError('El socio ya está suspendido');
    }

    // Verificar que no tenga créditos activos
    if (socio.creditosActivos > 0) {
      throw new SocioBusinessError(
        'No se puede suspender un socio con créditos activos'
      );
    }

    const socioActualizado = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.socio.update({
        where: { id: socioId },
        data: {
          estado: 'INACTIVO',
          fechaSuspension: new Date(),
          motivoSuspension: motivo,
        },
      });

      await tx.auditoria.create({
        data: {
          usuarioId,
          entidad: 'socios',
          entidadId: socioId,
          accion: 'ACTUALIZAR',
          descripcion: `Socio ${socio.codigo} suspendido. Motivo: ${motivo}`,
          datosAnteriores: { estado: socio.estado },
          datosNuevos: { estado: 'INACTIVO', motivo },
          exitosa: true,
        },
      });

      return actualizado;
    });

    logger.warn(`Socio suspendido: ${socio.codigo} - Motivo: ${motivo}`);

    return socioActualizado;
  }

  /**
   * Reactivar socio
   */
  async reactivarSocio(socioId: number, usuarioId?: number): Promise<any> {
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      throw new NotFoundError(`Socio con ID ${socioId} no encontrado`);
    }

    if (socio.estado !== 'INACTIVO') {
      throw new BadRequestError('Solo se pueden reactivar socios suspendidos');
    }

    const socioActualizado = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.socio.update({
        where: { id: socioId },
        data: {
          estado: 'ACTIVO',
          fechaSuspension: null,
          motivoSuspension: null,
        },
      });

      await tx.auditoria.create({
        data: {
          usuarioId,
          entidad: 'socios',
          entidadId: socioId,
          accion: 'ACTUALIZAR',
          descripcion: `Socio ${socio.codigo} reactivado`,
          datosAnteriores: { estado: 'INACTIVO' },
          datosNuevos: { estado: 'ACTIVO' },
          exitosa: true,
        },
      });

      return actualizado;
    });

    logger.info(`Socio reactivado: ${socio.codigo}`);

    return socioActualizado;
  }

  // ============================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ============================================================================

  private async generarCodigoSocio(): Promise<string> {
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

    return `SOC-${year}-${secuencial.toString().padStart(4, '0')}`;
  }

  private async generarCodigoTransaccion(socioId: number, tx?: any): Promise<string> {
    // Usar timestamp corto (últimos 8 dígitos) + random para evitar colisiones
    const timestamp = Date.now().toString().slice(-8); // Últimos 8 dígitos del timestamp
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');

    // Formato: TRX-{timestamp}{random} = TRX-1234567890 (máx 14 caracteres, cabe en VARCHAR(30))
    return `TRX-${timestamp}${random}`;
  }

  private formatearSocio(socio: any): any {
    return {
      ...socio,
      recomendadores: socio.recomendacionesRecibidas?.map((r: any) => r.socioRecomendador),
      recomendacionesRecibidas: undefined,
    };
  }

  private async obtenerConfiguracion(clave: string, valorPorDefecto: number): Promise<number> {
    const config = await prisma.configuracion.findUnique({
      where: { clave },
    });

    if (!config) {
      return valorPorDefecto;
    }

    return parseFloat(config.valor);
  }

  /**
   * Obtener historial de transacciones de un socio
   */
  async obtenerHistorialTransacciones(
    socioId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ transacciones: any[]; total: number; page: number; limit: number }> {
    // Verificar que el socio existe
    const socio = await this.obtenerSocioPorId(socioId);

    const skip = (page - 1) * limit;

    const [transacciones, total] = await Promise.all([
      prisma.transaccion.findMany({
        where: {
          socioId,
        },
        orderBy: {
          fechaTransaccion: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          codigo: true,
          tipo: true,
          monto: true,
          saldoAnterior: true,
          saldoNuevo: true,
          concepto: true,
          metodo: true,
          fechaTransaccion: true,
          createdAt: true,
        },
      }),
      prisma.transaccion.count({
        where: {
          socioId,
        },
      }),
    ]);

    // Mapear campos para compatibilidad con frontend
    const transaccionesFormateadas = transacciones.map((t) => ({
      id: t.id,
      codigo: t.codigo,
      tipo: t.tipo,
      monto: t.monto,
      saldoAnterior: t.saldoAnterior,
      saldoNuevo: t.saldoNuevo,
      concepto: t.concepto,
      metodo: t.metodo,
      fechaTransaccion: t.fechaTransaccion,
      fechaRegistro: t.createdAt,
      fecha: t.fechaTransaccion,
    }));

    return {
      transacciones: transaccionesFormateadas,
      total,
      page,
      limit,
    };
  }
}

export default new SociosService();
