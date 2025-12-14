/**
 * ============================================================================
 * Sistema MLF - Servicio de Gestión de Créditos
 * Archivo: src/services/creditos.service.ts
 * Descripción: Lógica de negocio para gestión del ciclo completo de créditos
 * ============================================================================
 */

import prisma from '../config/database';
import logger from '../config/logger';
import amortizationService from './amortization.service';
import notificacionesService, {
  TipoNotificacion,
  CanalNotificacion,
  PrioridadNotificacion,
} from './notificaciones.service';
import {
  NotFoundError,
  BadRequestError,
  CreditoBusinessError,
  LimiteCreditoExcedidoError,
  MoraActivaError,

} from '../utils/errors';
import {
  validarMontoPositivoOrThrow,
  validarPlazoMesesOrThrow,
} from '../utils/validators';
import { Prisma, EstadoCredito } from '@prisma/client';
import {
  SolicitarCreditoDTO,
  MetodoAmortizacion,
  TablaAmortizacion,
} from '../types';

// ============================================================================
// INTERFACES
// ============================================================================

interface AprobarCreditoDTO {
  creditoId: number;
  aprobadoPorId: number;
  observaciones?: string;
}

interface DesembolsarCreditoDTO {
  creditoId: number;
  desembolsadoPorId: number;
  fechaDesembolso?: Date;
  tasaInteresAnual?: number; // Tasa de interés anual (ej: 18 para 18%)
}

interface RechazarCreditoDTO {
  creditoId: number;
  rechazadoPorId: number;
  motivoRechazo: string;
}

// ============================================================================
// SERVICIO DE CRÉDITOS
// ============================================================================

class CreditosService {
  /**
   * Solicitar nuevo crédito
   * Implementa RN-CRE-001 a RN-CRE-008
   */
  async solicitarCredito(data: SolicitarCreditoDTO, usuarioId?: number): Promise<any> {
    const { socioId, montoSolicitado, plazoMeses, metodoAmortizacion, tasaInteresAnual } = data;

    // ============================================================================
    // VALIDACIONES BÁSICAS
    // ============================================================================

    validarMontoPositivoOrThrow(montoSolicitado, 'Monto solicitado');
    validarPlazoMesesOrThrow(plazoMeses);

    // ============================================================================
    // VERIFICAR SOCIO
    // ============================================================================

    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: {
        creditos: {
          where: {
            estado: {
              in: ['SOLICITADO', 'APROBADO', 'DESEMBOLSADO'],
            },
          },
          include: {
            moras: {
              where: {
                estado: 'ACTIVA',
              },
            },
          },
        },
      },
    });

    if (!socio) {
      throw new NotFoundError(`Socio con ID ${socioId} no encontrado`);
    }

    // Solo socios ACTIVOS pueden solicitar créditos
    if (socio.estado !== 'ACTIVO') {
      throw new CreditoBusinessError('Solo socios ACTIVOS pueden solicitar créditos');
    }

    // ============================================================================
    // VERIFICAR MORA ACTIVA (RN-CRE-003)
    // ============================================================================

    // Buscar moras activas en todos los créditos del socio
    const morasActivas = socio.creditos.flatMap(c => c.moras || []).filter(m => m.estado === 'ACTIVA');
    if (morasActivas.length > 0) {
      const moraActiva = morasActivas[0];
      throw new MoraActivaError(moraActiva.diasMora);
    }

    // ============================================================================
    // CALCULAR LÍMITE DE CRÉDITO (RN-CRE-002, RN-ETA-004)
    // ============================================================================

    const limiteDisponible = await this.calcularLimiteDisponible(socio);

    // Calcular suma de créditos activos
    const sumaCreditosActivos = socio.creditos.reduce(
      (sum, c) => sum + c.montoTotal.toNumber(),
      0
    );

    // ============================================================================
    // CALCULAR PRIMA DE SEGURO (RN-CRE-005, RN-SEG-001)
    // ============================================================================

    const primaSeguroPorcentaje = await this.obtenerConfiguracion('CREDITO_PRIMA_SEGURO', 1.0);
    const primaSeguro = montoSolicitado * (primaSeguroPorcentaje / 100);
    const montoTotal = montoSolicitado + primaSeguro;

    // ============================================================================
    // VERIFICAR QUE NO EXCEDA LÍMITE (RN-CRE-002)
    // ============================================================================

    if (sumaCreditosActivos + montoTotal > limiteDisponible) {
      throw new LimiteCreditoExcedidoError(
        limiteDisponible - sumaCreditosActivos,
        montoTotal
      );
    }

    // ============================================================================
    // OBTENER TASA DE INTERÉS
    // ============================================================================

    // Si se proporciona tasa anual desde el frontend, convertir a mensual
    // De lo contrario, usar la configuración por defecto (1.5% mensual = 18% anual)
    let tasaInteresMensual: number;
    if (tasaInteresAnual !== undefined && tasaInteresAnual !== null) {
      tasaInteresMensual = tasaInteresAnual / 12; // Convertir anual a mensual
    } else {
      tasaInteresMensual = await this.obtenerConfiguracion('TASA_INTERES_MENSUAL', 1.5);
    }

    // ============================================================================
    // GENERAR CÓDIGO ÚNICO
    // ============================================================================

    const codigo = await this.generarCodigoCredito();

    // ============================================================================
    // CREAR CRÉDITO EN TRANSACCIÓN
    // ============================================================================

    const nuevoCredito = await prisma.$transaction(async (tx) => {
      // 1. Calcular cuota mensual según método de amortización
      // tasaInteresMensual ya viene como mensual (ej: 1.5)
      const tasaMensualDecimal = tasaInteresMensual / 100; // Convertir a decimal

      let cuotaMensual: number;
      if (metodoAmortizacion === 'FRANCES') {
        // Fórmula francesa: C = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
        if (tasaMensualDecimal === 0) {
          cuotaMensual = montoTotal / plazoMeses;
        } else {
          const potencia = Math.pow(1 + tasaMensualDecimal, plazoMeses);
          cuotaMensual = montoTotal * (tasaMensualDecimal * potencia) / (potencia - 1);
        }
      } else if (metodoAmortizacion === 'ALEMAN') {
        // Método alemán: Primera cuota (capital fijo + interés sobre total)
        const capitalFijo = montoTotal / plazoMeses;
        const interesPrimeraQuota = montoTotal * tasaMensualDecimal;
        cuotaMensual = capitalFijo + interesPrimeraQuota;
      } else {
        throw new BadRequestError(`Método de amortización no válido: ${metodoAmortizacion}`);
      }

      // Redondear a 2 decimales
      cuotaMensual = Math.round(cuotaMensual * 100) / 100;

      // 2. Crear crédito
      const credito = await tx.credito.create({
        data: {
          codigo,
          socioId,
          montoSolicitado,
          primaSeguro,
          montoTotal,
          tasa_interes_mensual: tasaInteresMensual,
          cuota_mensual: cuotaMensual,
          saldo_capital: montoTotal, // Inicialmente todo el monto
          plazoMeses,
          metodoAmortizacion,
          estado: 'SOLICITADO',
        },
      });

      // 2. Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId,
          entidad: 'creditos',
          entidadId: credito.id,
          accion: 'CREAR',
          descripcion: `Crédito solicitado: ${credito.codigo} - $${montoTotal.toFixed(2)} - ${plazoMeses} meses`,
          datosNuevos: {
            codigo: credito.codigo,
            socio: socio.codigo,
            monto: montoTotal,
            plazo: plazoMeses,
            etapa: socio.etapaActual,
          },
          exitosa: true,
        },
      });

      return credito;
    });

    logger.info(
      `Crédito solicitado: ${nuevoCredito.codigo} - Socio: ${socio.codigo} - Monto: $${montoTotal.toFixed(2)}`
    );

    return await this.obtenerCreditoPorId(nuevoCredito.id);
  }

  /**
   * Aprobar crédito
   * Cambia estado a APROBADO y genera tabla de amortización
   */
  async aprobarCredito(data: AprobarCreditoDTO): Promise<any> {
    const { creditoId, aprobadoPorId, observaciones } = data;

    const credito = await prisma.credito.findUnique({
      where: { id: creditoId },
      include: {
        socio: true,
      },
    });

    if (!credito) {
      throw new NotFoundError(`Crédito con ID ${creditoId} no encontrado`);
    }

    if (credito.estado !== 'SOLICITADO') {
      throw new CreditoBusinessError(
        `El crédito debe estar en estado SOLICITADO para ser aprobado`
      );
    }

    // Verificar nuevamente el límite (por si cambió el ahorro)
    const limiteDisponible = await this.calcularLimiteDisponible(credito.socio);
    const sumaCreditosActivos = await this.calcularSumaCreditosActivos(credito.socioId);

    if (sumaCreditosActivos + credito.montoTotal.toNumber() > limiteDisponible) {
      throw new LimiteCreditoExcedidoError(
        limiteDisponible - sumaCreditosActivos,
        credito.montoTotal.toNumber()
      );
    }

    // Aprobar en transacción
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar estado
      const actualizado = await tx.credito.update({
        where: { id: creditoId },
        data: {
          estado: 'APROBADO',
          fechaAprobacion: new Date(),
        },
      });

      // 2. Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: aprobadoPorId,
          entidad: 'creditos',
          entidadId: creditoId,
          accion: 'APROBAR',
          descripcion: `Crédito ${credito.codigo} aprobado${observaciones ? ': ' + observaciones : ''}`,
          datosAnteriores: { estado: credito.estado },
          datosNuevos: { estado: 'APROBADO', observaciones },
          exitosa: true,
        },
      });

      return actualizado;
    });

    logger.info(`Crédito aprobado: ${credito.codigo}`);

    // Enviar notificación al socio
    try {
      await notificacionesService.enviarNotificacion({
        socioId: credito.socioId,
        tipo: TipoNotificacion.CREDITO_APROBADO,
        canal: [CanalNotificacion.IN_APP, CanalNotificacion.EMAIL],
        prioridad: PrioridadNotificacion.ALTA,
        datos: {
          codigoCredito: credito.codigo,
          monto: credito.montoTotal.toNumber(),
        },
      });
    } catch (error) {
      logger.error(`Error enviando notificación de aprobación: ${error}`);
    }

    return await this.obtenerCreditoPorId(creditoId);
  }

  /**
   * Actualizar crédito (solo SOLICITADO)
   */
  async actualizarCredito(
    id: number,
    data: any,
    usuarioId?: number
  ): Promise<any> {
    // Verificar que el crédito existe
    const creditoExistente = await prisma.credito.findUnique({
      where: { id },
      include: {
        socio: true,
      },
    });

    if (!creditoExistente) {
      throw new NotFoundError(`Crédito con ID ${id} no encontrado`);
    }

    // Solo se pueden editar créditos SOLICITADOS
    if (creditoExistente.estado !== 'SOLICITADO') {
      throw new CreditoBusinessError(
        'Solo se pueden editar créditos en estado SOLICITADO'
      );
    }

    // Preparar datos para actualización
    const updateData: any = {};

    if (data.montoSolicitado !== undefined) {
      validarMontoPositivoOrThrow(data.montoSolicitado, 'Monto solicitado');

      // Verificar límite de crédito
      const limiteDisponible = await this.calcularLimiteDisponible(creditoExistente.socio);
      const sumaCreditosActivos = await this.calcularSumaCreditosActivos(creditoExistente.socioId);

      if (data.montoSolicitado > limiteDisponible - sumaCreditosActivos) {
        throw new LimiteCreditoExcedidoError(
          limiteDisponible - sumaCreditosActivos,
          data.montoSolicitado
        );
      }

      updateData.montoSolicitado = new Prisma.Decimal(data.montoSolicitado);
      updateData.montoTotal = new Prisma.Decimal(data.montoSolicitado);
    }

    if (data.plazoMeses !== undefined) {
      if (data.plazoMeses < 1 || data.plazoMeses > 60) {
        throw new BadRequestError('El plazo debe estar entre 1 y 60 meses');
      }
      updateData.plazoMeses = data.plazoMeses;
    }

    if (data.tasaInteresAnual !== undefined) {
      if (data.tasaInteresAnual < 0 || data.tasaInteresAnual > 100) {
        throw new BadRequestError('La tasa de interés debe estar entre 0 y 100');
      }
      updateData.tasaInteresAnual = new Prisma.Decimal(data.tasaInteresAnual);
    }

    if (data.tipoCredito !== undefined) {
      updateData.tipoCredito = data.tipoCredito;
    }

    if (data.metodoAmortizacion !== undefined) {
      updateData.metodoAmortizacion = data.metodoAmortizacion;
    }

    if (data.proposito !== undefined) {
      updateData.proposito = data.proposito;
    }

    // Actualizar
    const creditoActualizado = await prisma.$transaction(async (tx) => {
      const credito = await tx.credito.update({
        where: { id },
        data: updateData,
      });

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId,
          entidad: 'creditos',
          entidadId: id,
          accion: 'ACTUALIZAR',
          descripcion: `Información del crédito ${credito.codigo} actualizada`,
          datosAnteriores: creditoExistente,
          datosNuevos: updateData,
          exitosa: true,
        },
      });

      return credito;
    });

    logger.info(`Crédito actualizado: ${creditoActualizado.codigo}`);

    return await this.obtenerCreditoPorId(id);
  }

  /**
   * Desembolsar crédito
   * Genera tabla de amortización y crea cuotas en la BD
   * Implementa RN-CRE-004
   */
  async desembolsarCredito(data: DesembolsarCreditoDTO): Promise<any> {
    const { creditoId, desembolsadoPorId, fechaDesembolso = new Date(), tasaInteresAnual } = data;

    const credito = await prisma.credito.findUnique({
      where: { id: creditoId },
      include: {
        socio: true,
      },
    });

    if (!credito) {
      throw new NotFoundError(`Crédito con ID ${creditoId} no encontrado`);
    }

    if (credito.estado !== 'APROBADO') {
      throw new CreditoBusinessError('El crédito debe estar APROBADO para ser desembolsado');
    }

    // ============================================================================
    // GENERAR TABLA DE AMORTIZACIÓN
    // ============================================================================

    // Usar la tasa almacenada en el crédito (ya guardada como mensual)
    // Si se proporciona tasaInteresAnual desde el frontend, convertir a mensual
    let tasaInteresMensual: number;
    if (tasaInteresAnual !== undefined && tasaInteresAnual !== null) {
      tasaInteresMensual = tasaInteresAnual / 12; // Convertir anual a mensual
    } else {
      tasaInteresMensual = credito.tasa_interes_mensual?.toNumber() || 1.5;
    }

    const tablaAmortizacion = amortizationService.calcularTablaAmortizacion({
      montoTotal: credito.montoTotal.toNumber(),
      tasaInteresMensual: tasaInteresMensual, // CAMBIADO: Ahora es tasa mensual
      plazoMeses: credito.plazoMeses,
      metodo: credito.metodoAmortizacion as MetodoAmortizacion,
      fechaDesembolso,
    });

    // ============================================================================
    // DESEMBOLSAR EN TRANSACCIÓN
    // ============================================================================

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Actualizar crédito
      const creditoActualizado = await tx.credito.update({
        where: { id: creditoId },
        data: {
          estado: 'DESEMBOLSADO',
          fechaDesembolso,
        },
      });

      // 2. Crear cuotas en la base de datos
      for (const cuota of tablaAmortizacion.cuotas) {
        // Recalcular montoCuota para evitar errores de redondeo (CHECK constraint)
        const montoCuotaExacto = cuota.capital + cuota.interes;

        await tx.cuota.create({
          data: {
            creditoId,
            numeroCuota: cuota.numeroCuota,
            montoCuota: montoCuotaExacto,
            monto_capital: cuota.capital,
            monto_interes: cuota.interes,
            saldo_capital_despues: cuota.saldoRestante,
            montoPagado: 0,
            estado: 'PENDIENTE',
            fechaVencimiento: cuota.fechaVencimiento,
            diasMora: 0,
            interes_mora: 0,
          },
        });
      }

      // 3. Registrar movimiento en fondo de seguro (prima del 1%)
      const primaSeguro = credito.primaSeguro.toNumber();

      await tx.fondoSeguro.create({
        data: {
          tipo: 'INGRESO_PRIMA',
          monto: primaSeguro,
          creditoId: creditoId,
          socioId: credito.socioId,
          concepto: `Prima de seguro 1% - Crédito ${credito.codigo}`,
        },
      });

      // 5. Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: desembolsadoPorId,
          entidad: 'creditos',
          entidadId: creditoId,
          accion: 'EJECUTAR',
          descripcion: `Crédito ${credito.codigo} desembolsado - ${tablaAmortizacion.cuotas.length} cuotas generadas`,
          datosAnteriores: { estado: 'APROBADO' },
          datosNuevos: {
            estado: 'DESEMBOLSADO',
            fechaDesembolso,
            cuotasGeneradas: tablaAmortizacion.cuotas.length,
            totalAPagar: tablaAmortizacion.resumen.totalAPagar,
            primaSeguroAlFondo: primaSeguro,
          },
          exitosa: true,
        },
      });

      return { creditoActualizado, tablaAmortizacion };
    });

    logger.info(
      `Crédito desembolsado: ${credito.codigo} - ${tablaAmortizacion.cuotas.length} cuotas - Total: $${tablaAmortizacion.resumen.totalAPagar.toFixed(2)}`
    );

    // Enviar notificación al socio
    try {
      await notificacionesService.enviarNotificacion({
        socioId: credito.socioId,
        tipo: TipoNotificacion.CREDITO_DESEMBOLSADO,
        canal: [CanalNotificacion.IN_APP, CanalNotificacion.EMAIL],
        prioridad: PrioridadNotificacion.ALTA,
        datos: {
          codigoCredito: credito.codigo,
          monto: credito.montoTotal.toNumber(),
          fechaDesembolso,
        },
      });
    } catch (error) {
      logger.error(`Error enviando notificación de desembolso: ${error}`);
    }

    return {
      credito: await this.obtenerCreditoPorId(creditoId),
      tablaAmortizacion: resultado.tablaAmortizacion,
    };
  }

  /**
   * Rechazar crédito
   */
  async rechazarCredito(data: RechazarCreditoDTO): Promise<any> {
    const { creditoId, rechazadoPorId, motivoRechazo } = data;

    const credito = await prisma.credito.findUnique({
      where: { id: creditoId },
    });

    if (!credito) {
      throw new NotFoundError(`Crédito con ID ${creditoId} no encontrado`);
    }

    if (credito.estado !== 'SOLICITADO' && credito.estado !== 'EN_REVISION') {
      throw new CreditoBusinessError('Solo créditos SOLICITADOS o EN_REVISION pueden ser rechazados');
    }

    const creditoRechazado = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.credito.update({
        where: { id: creditoId },
        data: {
          estado: 'RECHAZADO',
        },
      });

      await tx.auditoria.create({
        data: {
          usuarioId: rechazadoPorId,
          entidad: 'creditos',
          entidadId: creditoId,
          accion: 'RECHAZAR',
          descripcion: `Crédito ${credito.codigo} rechazado: ${motivoRechazo}`,
          datosAnteriores: { estado: credito.estado },
          datosNuevos: { estado: 'RECHAZADO', motivo: motivoRechazo },
          exitosa: true,
        },
      });

      return actualizado;
    });

    logger.warn(`Crédito rechazado: ${credito.codigo} - Motivo: ${motivoRechazo}`);

    // Enviar notificación al socio
    try {
      await notificacionesService.enviarNotificacion({
        socioId: credito.socioId,
        tipo: TipoNotificacion.CREDITO_RECHAZADO,
        canal: [CanalNotificacion.IN_APP, CanalNotificacion.EMAIL],
        prioridad: PrioridadNotificacion.ALTA,
        datos: {
          codigoCredito: credito.codigo,
          motivo: motivoRechazo,
        },
      });
    } catch (error) {
      logger.error(`Error enviando notificación de rechazo: ${error}`);
    }

    return creditoRechazado;
  }

  /**
   * Obtener crédito por ID con información completa
   */
  async obtenerCreditoPorId(id: number): Promise<any> {
    const credito = await prisma.credito.findUnique({
      where: { id },
      include: {
        socio: {
          select: {
            id: true,
            codigo: true,
            nombreCompleto: true,
            etapaActual: true,
            ahorroActual: true,
          },
        },
        cuotas: {
          orderBy: {
            numeroCuota: 'asc',
          },
        },
        garantias: {
          include: {
            socios_garantias_socio_garante_idTosocios: {
              select: {
                id: true,
                codigo: true,
                nombreCompleto: true,
              },
            },
            socios_garantias_socio_garantizado_idTosocios: {
              select: {
                id: true,
                codigo: true,
                nombreCompleto: true,
              },
            },
          },
        },
      },
    });

    if (!credito) {
      throw new NotFoundError(`Crédito con ID ${id} no encontrado`);
    }

    // Mapear campos para compatibilidad con frontend
    return {
      ...credito,
      // Mapear tasa de interés: convertir mensual a anual
      tasaInteresMensual: credito.tasa_interes_mensual,
      tasaInteresAnual: credito.tasa_interes_mensual ?
        parseFloat(credito.tasa_interes_mensual.toString()) * 12 : 0,
      // Mapear otros campos snake_case
      saldoCapital: credito.saldo_capital,
      cuotaMensual: credito.cuota_mensual,
      estadoMora: credito.estado_mora,
      diasMora: credito.dias_mora,
      // Mapear campos de cuotas
      cuotas: credito.cuotas?.map((cuota: any) => ({
        ...cuota,
        montoTotal: cuota.montoCuota, // montoCuota es el monto total de la cuota
        montoCapital: cuota.monto_capital,
        montoInteres: cuota.monto_interes,
        saldoCapitalDespues: cuota.saldo_capital_despues,
        saldoRestante: cuota.saldo_capital_despues, // Alias para el frontend
        montoPagado: cuota.montoPagado, // CORRECCIÓN: Incluir monto pagado
        interesMora: cuota.interes_mora, // CORRECCIÓN: Incluir interés de mora
      })),
    };
  }

  /**
   * Listar créditos con filtros
   */
  async listarCreditos(filtros: {
    page?: number;
    limit?: number;
    socioId?: number;
    estado?: EstadoCredito;
    busqueda?: string;
  }): Promise<{
    creditos: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, socioId, estado, busqueda } = filtros;

    const where: any = {};

    if (socioId) {
      where.socioId = socioId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (busqueda) {
      where.OR = [
        { codigo: { contains: busqueda, mode: 'insensitive' } },
        { socio: { nombreCompleto: { contains: busqueda, mode: 'insensitive' } } },
        { socio: { codigo: { contains: busqueda, mode: 'insensitive' } } },
      ];
    }

    const total = await prisma.credito.count({ where });

    const creditos = await prisma.credito.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        fechaSolicitud: 'desc',
      },
      include: {
        socio: {
          select: {
            id: true,
            codigo: true,
            nombreCompleto: true,
            etapaActual: true,
          },
        },
      },
    });

    // Mapear campos snake_case a camelCase para compatibilidad con frontend
    const creditosMapeados = creditos.map((credito: any) => ({
      ...credito,
      tasaInteresMensual: credito.tasa_interes_mensual,
      tasaInteresAnual: credito.tasa_interes_mensual ?
        parseFloat(credito.tasa_interes_mensual.toString()) * 12 : 0,
      saldoCapital: credito.saldo_capital,
      cuotaMensual: credito.cuota_mensual,
      estadoMora: credito.estado_mora,
      diasMora: credito.dias_mora,
    }));

    return {
      creditos: creditosMapeados,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener tabla de amortización de un crédito
   */
  async obtenerTablaAmortizacion(creditoId: number): Promise<TablaAmortizacion> {
    const credito = await prisma.credito.findUnique({
      where: { id: creditoId },
      include: {
        cuotas: {
          orderBy: {
            numeroCuota: 'asc',
          },
        },
      },
    });

    if (!credito) {
      throw new NotFoundError(`Crédito con ID ${creditoId} no encontrado`);
    }

    if (!credito.cuotas || credito.cuotas.length === 0) {
      throw new BadRequestError('El crédito aún no ha sido desembolsado (no tiene cuotas)');
    }

    // Construir tabla desde las cuotas en BD
    const cuotas = credito.cuotas.map((c) => ({
      numeroCuota: c.numeroCuota,
      fechaVencimiento: c.fechaVencimiento,
      montoCuota: c.montoCuota.toNumber(),
      capital: c.monto_capital.toNumber(),
      interes: c.monto_interes.toNumber(),
      saldoRestante: c.saldo_capital_despues.toNumber(),
    }));

    // Calcular resumen
    const totalAPagar = cuotas.reduce((sum, c) => sum + c.montoCuota, 0);
    const totalCapital = cuotas.reduce((sum, c) => sum + c.capital, 0);
    const totalIntereses = cuotas.reduce((sum, c) => sum + c.interes, 0);

    return {
      credito: {
        codigo: credito.codigo,
        montoTotal: credito.montoTotal.toNumber(),
        tasaInteres: credito.tasa_interes_mensual.toNumber(),
        plazoMeses: credito.plazoMeses,
        metodo: credito.metodoAmortizacion as MetodoAmortizacion,
      },
      cuotas,
      resumen: {
        totalAPagar,
        totalCapital,
        totalIntereses,
      },
    };
  }

  // ============================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ============================================================================

  /**
   * Calcular límite de crédito disponible para un socio
   * Implementa RN-CRE-002, RN-ETA-004
   */
  private async calcularLimiteDisponible(socio: any): Promise<number> {
    // Calcular ahorro total (Disponible + Congelado)
    // Nota: socio debe incluir ahorroCongelado en su consulta. Si no, se asume 0 o se debe ajustar el include.
    // El llamador 'solicitarCredito' usa findUnique sin include especifico de ahorroCongelado, pero Prisma lo trae por defecto si es campo escalar.
    // Verificaremos si es Decimal.
    const ahorroDisponible = socio.ahorroActual?.toNumber() || 0;
    const ahorroCongelado = socio.ahorroCongelado?.toNumber() || 0;
    const ahorroTotal = ahorroDisponible + ahorroCongelado;

    let multiplicador = 1.0;

    // Determinar multiplicador según etapa
    if (socio.etapaActual === 1) {
      // Etapa Iniciante: 125% → 200%
      if (socio.creditosEtapaActual === 0) multiplicador = 1.25;
      else if (socio.creditosEtapaActual === 1) multiplicador = 1.5;
      else if (socio.creditosEtapaActual === 2) multiplicador = 1.75;
      else multiplicador = 2.0;
    } else if (socio.etapaActual === 2) {
      multiplicador = 2.0;
    } else if (socio.etapaActual === 3) {
      multiplicador = 3.0;
    }

    const limitePorAhorros = ahorroTotal * multiplicador;

    // Topes por etapa (Hard caps)
    const limitesPorEtapa: { [key: number]: number } = {
      1: 500,
      2: 2000,
      3: 10000,
    };
    const topeEtapa = limitesPorEtapa[socio.etapaActual] || 500;

    // El límite es el menor entre el tope de etapa y el calculado por ahorros
    return Math.min(topeEtapa, limitePorAhorros);
  }

  /**
   * Calcular suma de créditos activos de un socio
   */
  private async calcularSumaCreditosActivos(socioId: number): Promise<number> {
    const creditos = await prisma.credito.findMany({
      where: {
        socioId,
        estado: {
          in: ['APROBADO', 'DESEMBOLSADO'],
        },
      },
    });

    return creditos.reduce((sum, c) => sum + c.montoTotal.toNumber(), 0);
  }

  private async generarCodigoCredito(): Promise<string> {
    const year = new Date().getFullYear();
    const ultimoCredito = await prisma.credito.findFirst({
      where: {
        codigo: {
          startsWith: `CRE-${year}`,
        },
      },
      orderBy: {
        codigo: 'desc',
      },
    });

    let secuencial = 1;
    if (ultimoCredito) {
      const ultimoSecuencial = parseInt(ultimoCredito.codigo.split('-')[2]);
      secuencial = ultimoSecuencial + 1;
    }

    return `CRE-${year}-${secuencial.toString().padStart(4, '0')}`;
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
}

export default new CreditosService();
