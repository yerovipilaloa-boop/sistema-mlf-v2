/**
 * ============================================================================
 * Sistema MLF - Servicio de Notificaciones
 * Archivo: src/services/notificaciones.service.ts
 * Descripción: Gestión de notificaciones multi-canal (email, SMS, in-app)
 * ============================================================================
 */

import prisma from '../config/database';
import logger from '../config/logger';
import { NotFoundError, ValidationError } from '../utils/errors';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export enum TipoNotificacion {
  // Créditos
  CREDITO_APROBADO = 'CREDITO_APROBADO',
  CREDITO_RECHAZADO = 'CREDITO_RECHAZADO',
  CREDITO_DESEMBOLSADO = 'CREDITO_DESEMBOLSADO',

  // Pagos
  PAGO_REGISTRADO = 'PAGO_REGISTRADO',
  CUOTA_PROXIMA_VENCER = 'CUOTA_PROXIMA_VENCER', // 3 días antes
  CUOTA_VENCIDA = 'CUOTA_VENCIDA',
  MORA_ACTIVA = 'MORA_ACTIVA',

  // Garantías
  GARANTIA_ASIGNADA = 'GARANTIA_ASIGNADA',
  SOLICITUD_LIBERACION = 'SOLICITUD_LIBERACION',
  LIBERACION_APROBADA = 'LIBERACION_APROBADA',
  LIBERACION_RECHAZADA = 'LIBERACION_RECHAZADA',
  GARANTIA_EJECUTADA = 'GARANTIA_EJECUTADA',

  // Utilidades
  UTILIDADES_ACREDITADAS = 'UTILIDADES_ACREDITADAS',

  // Sistema
  BIENVENIDA = 'BIENVENIDA',
  CAMBIO_ETAPA = 'CAMBIO_ETAPA',
  SOCIO_SUSPENDIDO = 'SOCIO_SUSPENDIDO',
  SOCIO_REACTIVADO = 'SOCIO_REACTIVADO',
}

export enum CanalNotificacion {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
}

export enum PrioridadNotificacion {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

interface EnviarNotificacionDTO {
  socioId: number;
  tipo: TipoNotificacion;
  canal: CanalNotificacion | CanalNotificacion[];
  prioridad?: PrioridadNotificacion;
  datos?: Record<string, any>;
}

interface PlantillaNotificacion {
  asunto: string;
  mensaje: string;
  html?: string;
}

// ============================================================================
// PLANTILLAS DE NOTIFICACIONES
// ============================================================================

const PLANTILLAS: Record<TipoNotificacion, (datos: any) => PlantillaNotificacion> = {
  // CRÉDITOS
  [TipoNotificacion.CREDITO_APROBADO]: (datos) => ({
    asunto: `✅ Crédito Aprobado - ${datos.codigoCredito}`,
    mensaje: `Hola ${datos.nombreSocio},\n\n¡Excelentes noticias! Tu crédito por $${datos.monto} ha sido aprobado.\n\nCódigo: ${datos.codigoCredito}\nPlazo: ${datos.plazo} meses\n\nEn breve procederemos con el desembolso.\n\nSaludos,\nSistema MLF`,
  }),

  [TipoNotificacion.CREDITO_RECHAZADO]: (datos) => ({
    asunto: `❌ Crédito Rechazado - ${datos.codigoCredito}`,
    mensaje: `Hola ${datos.nombreSocio},\n\nLamentamos informarte que tu solicitud de crédito ${datos.codigoCredito} no fue aprobada.\n\nMotivo: ${datos.motivo}\n\nPuedes contactarnos para más información.\n\nSaludos,\nSistema MLF`,
  }),

  [TipoNotificacion.CREDITO_DESEMBOLSADO]: (datos) => ({
    asunto: `💰 Crédito Desembolsado - ${datos.codigoCredito}`,
    mensaje: `Hola ${datos.nombreSocio},\n\nTu crédito ha sido desembolsado exitosamente.\n\nMonto: $${datos.monto}\nPrimera cuota: $${datos.primeraCuota}\nFecha primer pago: ${datos.fechaPrimerPago}\n\nRevisa tu tabla de amortización en el sistema.\n\nSaludos,\nSistema MLF`,
  }),

  // PAGOS
  [TipoNotificacion.PAGO_REGISTRADO]: (datos) => ({
    asunto: `✅ Pago Recibido - ${datos.codigoCredito}`,
    mensaje: `Hola ${datos.nombreSocio},\n\nHemos registrado tu pago de $${datos.montoPagado}.\n\nCrédito: ${datos.codigoCredito}\nSaldo restante: $${datos.saldoRestante}\n\n¡Gracias por tu puntualidad!\n\nSaludos,\nSistema MLF`,
  }),

  [TipoNotificacion.CUOTA_PROXIMA_VENCER]: (datos) => ({
    asunto: `⏰ Recordatorio: Cuota próxima a vencer`,
    mensaje: `Hola ${datos.nombreSocio},\n\nTe recordamos que tu cuota #${datos.numeroCuota} vence en ${datos.diasRestantes} días.\n\nCrédito: ${datos.codigoCredito}\nMonto: $${datos.montoCuota}\nFecha vencimiento: ${datos.fechaVencimiento}\n\nEvita moras realizando tu pago a tiempo.\n\nSaludos,\nSistema MLF`,
  }),

  [TipoNotificacion.CUOTA_VENCIDA]: (datos) => ({
    asunto: `⚠️ Cuota Vencida - Acción Requerida`,
    mensaje: `Hola ${datos.nombreSocio},\n\nTu cuota #${datos.numeroCuota} está vencida.\n\nCrédito: ${datos.codigoCredito}\nMonto: $${datos.montoCuota}\nMora acumulada: $${datos.montoMora}\nDías vencidos: ${datos.diasMora}\n\nPor favor, regulariza tu situación lo antes posible.\n\nSaludos,\nSistema MLF`,
  }),

  [TipoNotificacion.MORA_ACTIVA]: (datos) => ({
    asunto: `🚨 Alerta: Mora Activa - ${datos.clasificacion}`,
    mensaje: `Hola ${datos.nombreSocio},\n\nTienes mora activa en tu crédito.\n\nCrédito: ${datos.codigoCredito}\nClasificación: ${datos.clasificacion}\nDías de mora: ${datos.diasMora}\nMonto adeudado: $${datos.montoTotal}\n\n⚠️ IMPORTANTE: Si la mora alcanza 90 días, se ejecutarán las garantías automáticamente.\n\nContacta con nosotros urgentemente.\n\nSaludos,\nSistema MLF`,
  }),

  // GARANTÍAS
  [TipoNotificacion.GARANTIA_ASIGNADA]: (datos) => ({
    asunto: `🛡️ Garantía Asignada - ${datos.codigoCredito}`,
    mensaje: `Hola ${datos.nombreGarante},\n\nHas sido asignado como garante del crédito ${datos.codigoCredito}.\n\nDeudor: ${datos.nombreDeudor}\nMonto garantizado: $${datos.montoGarantizado}\nMonto congelado: $${datos.montoCongelado}\n\nGracias por tu apoyo a la comunidad.\n\nSaludos,\nSistema MLF`,
  }),

  [TipoNotificacion.SOLICITUD_LIBERACION]: (datos) => ({
    asunto: `📝 Solicitud de Liberación de Garantía`,
    mensaje: `Hola ${datos.nombreGarante},\n\nSe ha solicitado la liberación de tu garantía del crédito ${datos.codigoCredito}.\n\nMotivo: ${datos.motivo}\nEstado: En revisión\n\nTe notificaremos la decisión.\n\nSaludos,\nSistema MLF`,
  }),

  [TipoNotificacion.LIBERACION_APROBADA]: (datos) => ({
    asunto: `✅ Garantía Liberada - ${datos.codigoCredito}`,
    mensaje: `Hola ${datos.nombreGarante},\n\n¡Buenas noticias! Tu garantía ha sido liberada.\n\nCrédito: ${datos.codigoCredito}\nMonto liberado: $${datos.montoLiberado}\n\nTu ahorro congelado ha sido liberado exitosamente.\n\nSaludos,\nSistema MLF`,
  }),

  [TipoNotificacion.LIBERACION_RECHAZADA]: (datos) => ({
    asunto: `❌ Solicitud de Liberación Rechazada`,
    mensaje: `Hola ${datos.nombreGarante},\n\nTu solicitud de liberación de garantía del crédito ${datos.codigoCredito} no fue aprobada.\n\nMotivo: ${datos.motivoRechazo}\n\nSaludos,\nSistema MLF`,
  }),

  [TipoNotificacion.GARANTIA_EJECUTADA]: (datos) => ({
    asunto: `🚨 URGENTE: Garantía Ejecutada`,
    mensaje: `Hola ${datos.nombreGarante},\n\nLamentamos informarte que tu garantía del crédito ${datos.codigoCredito} ha sido ejecutada debido a mora superior a 90 días.\n\nMonto ejecutado: $${datos.montoEjecutado}\nDeudor: ${datos.nombreDeudor}\n\nEl monto ha sido descontado de tu ahorro.\n\nPor favor, contacta con nosotros.\n\nSaludos,\nSistema MLF`,
  }),

  // UTILIDADES
  [TipoNotificacion.UTILIDADES_ACREDITADAS]: (datos) => ({
    asunto: `🎉 Utilidades Acreditadas - ${datos.periodo}`,
    mensaje: `Hola ${datos.nombreSocio},\n\n¡Felicidades! Se han acreditado tus utilidades del período ${datos.periodo}.\n\nAhorro promedio: $${datos.ahorroPromedio}\nUtilidad (1%): $${datos.montoUtilidad}\n\nLas utilidades han sido acreditadas automáticamente a tu ahorro.\n\n¡Gracias por ser parte de MLF!\n\nSaludos,\nSistema MLF`,
  }),

  // SISTEMA
  [TipoNotificacion.BIENVENIDA]: (datos) => ({
    asunto: `🎉 ¡Bienvenido a MLF!`,
    mensaje: `Hola ${datos.nombreSocio},\n\n¡Bienvenido a My Libertad Financiera!\n\nTu código de socio: ${datos.codigoSocio}\nEtapa inicial: Iniciante (1)\nAhorro inicial: $${datos.ahorroInicial}\n\nPuedes acceder al sistema con tu email y la contraseña que estableciste.\n\n¡Estamos aquí para ayudarte a alcanzar tus metas financieras!\n\nSaludos,\nEquipo MLF`,
  }),

  [TipoNotificacion.CAMBIO_ETAPA]: (datos) => ({
    asunto: `🎖️ ¡Felicitaciones! Has avanzado de etapa`,
    mensaje: `Hola ${datos.nombreSocio},\n\n¡Excelentes noticias! Has avanzado a la Etapa ${datos.nuevaEtapa}.\n\nNuevo límite de crédito: ${datos.nuevoLimite}\nBeneficios adicionales: ${datos.beneficios}\n\n¡Sigue así!\n\nSaludos,\nSistema MLF`,
  }),

  [TipoNotificacion.SOCIO_SUSPENDIDO]: (datos) => ({
    asunto: `⚠️ Cuenta Suspendida`,
    mensaje: `Hola ${datos.nombreSocio},\n\nTu cuenta ha sido suspendida.\n\nMotivo: ${datos.motivo}\n\nPor favor, contacta con nosotros para resolver esta situación.\n\nSaludos,\nSistema MLF`,
  }),

  [TipoNotificacion.SOCIO_REACTIVADO]: (datos) => ({
    asunto: `✅ Cuenta Reactivada`,
    mensaje: `Hola ${datos.nombreSocio},\n\n¡Bienvenido de vuelta! Tu cuenta ha sido reactivada.\n\nPuedes continuar usando todos los servicios de MLF.\n\nSaludos,\nSistema MLF`,
  }),
};

// ============================================================================
// SERVICIO DE NOTIFICACIONES
// ============================================================================

class NotificacionesService {
  /**
   * Enviar notificación multi-canal
   */
  async enviarNotificacion(data: EnviarNotificacionDTO): Promise<any> {
    const {
      socioId,
      tipo,
      canal,
      prioridad = PrioridadNotificacion.MEDIA,
      datos = {},
    } = data;

    // Obtener socio
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      throw new NotFoundError(`Socio con ID ${socioId} no encontrado`);
    }

    // Preparar datos completos
    const datosCompletos = {
      nombreSocio: socio.nombreCompleto,
      codigoSocio: socio.codigo,
      ...datos,
    };

    // Generar contenido desde plantilla
    const plantilla = PLANTILLAS[tipo];
    if (!plantilla) {
      throw new ValidationError(`Plantilla no encontrada para tipo: ${tipo}`);
    }

    const contenido = plantilla(datosCompletos);

    // Normalizar canales a array
    const canales = Array.isArray(canal) ? canal : [canal];

    // Enviar por cada canal
    const resultados = await Promise.allSettled(
      canales.map((c) =>
        this.enviarPorCanal(socio, c, tipo, contenido, prioridad)
      )
    );

    // Registrar notificación en BD
    const notificacion = await prisma.notificacion.create({
      data: {
        socioId,
        tipo,
        asunto: contenido.asunto,
        mensaje: contenido.mensaje,
        canal: canales.join(','),
        prioridad,
        estado: 'ENVIADA',
        datosAdicionales: datos as any,
      },
    });

    // Verificar si todos los envíos fueron exitosos
    const exitosos = resultados.filter((r) => r.status === 'fulfilled').length;
    const fallidos = resultados.filter((r) => r.status === 'rejected').length;

    logger.info(
      `Notificación enviada: Tipo=${tipo}, Socio=${socio.codigo}, Canales=${canales.join(',')}, Exitosos=${exitosos}, Fallidos=${fallidos}`
    );

    return {
      notificacion,
      resultados: {
        exitosos,
        fallidos,
        total: canales.length,
      },
    };
  }

  /**
   * Enviar por un canal específico
   */
  private async enviarPorCanal(
    socio: any,
    canal: CanalNotificacion,
    tipo: TipoNotificacion,
    contenido: PlantillaNotificacion,
    _prioridad: PrioridadNotificacion
  ): Promise<void> {
    switch (canal) {
      case CanalNotificacion.EMAIL:
        await this.enviarEmail(socio.email, contenido);
        break;

      case CanalNotificacion.SMS:
        await this.enviarSMS(socio.telefono, contenido.mensaje);
        break;

      case CanalNotificacion.IN_APP:
        await this.guardarInApp(socio.id, tipo, contenido);
        break;

      case CanalNotificacion.PUSH:
        await this.enviarPush(socio.id, contenido);
        break;

      default:
        logger.warn(`Canal no soportado: ${canal}`);
    }
  }

  /**
   * Enviar email (integración pendiente)
   */
  private async enviarEmail(
    email: string,
    contenido: PlantillaNotificacion
  ): Promise<void> {
    // TODO: Integrar con servicio de email (SendGrid, AWS SES, etc.)
    logger.info(`[EMAIL] Enviando a ${email}: ${contenido.asunto}`);

    // Simulación
    await new Promise((resolve) => setTimeout(resolve, 100));

    // En producción:
    // await emailService.send({
    //   to: email,
    //   subject: contenido.asunto,
    //   text: contenido.mensaje,
    //   html: contenido.html,
    // });
  }

  /**
   * Enviar SMS (integración pendiente)
   */
  private async enviarSMS(telefono: string, mensaje: string): Promise<void> {
    // TODO: Integrar con servicio SMS (Twilio, AWS SNS, etc.)
    logger.info(`[SMS] Enviando a ${telefono}: ${mensaje.substring(0, 50)}...`);

    // Simulación
    await new Promise((resolve) => setTimeout(resolve, 100));

    // En producción:
    // await smsService.send({
    //   to: telefono,
    //   message: mensaje,
    // });
  }

  /**
   * Guardar notificación in-app
   */
  private async guardarInApp(
    socioId: number,
    _tipo: TipoNotificacion,
    contenido: PlantillaNotificacion
  ): Promise<void> {
    // Ya se guarda en la tabla notificaciones
    logger.info(`[IN-APP] Guardada para socio ${socioId}: ${contenido.asunto}`);
  }

  /**
   * Enviar push notification (integración pendiente)
   */
  private async enviarPush(
    socioId: number,
    contenido: PlantillaNotificacion
  ): Promise<void> {
    // TODO: Integrar con FCM/APNS
    logger.info(`[PUSH] Enviando a socio ${socioId}: ${contenido.asunto}`);

    // Simulación
    await new Promise((resolve) => setTimeout(resolve, 100));

    // En producción:
    // await pushService.send({
    //   userId: socioId,
    //   title: contenido.asunto,
    //   body: contenido.mensaje,
    // });
  }

  /**
   * Obtener notificaciones de un socio
   */
  async obtenerNotificaciones(
    socioId: number,
    filtros?: {
      page?: number;
      limit?: number;
      leidas?: boolean;
      tipo?: TipoNotificacion;
    }
  ): Promise<any> {
    const { page = 1, limit = 20, leidas, tipo } = filtros || {};

    const where: any = { socioId };
    if (leidas === true) where.fechaLeida = { not: null };
    if (leidas === false) where.fechaLeida = null;
    if (tipo) where.tipo = tipo;

    const [notificaciones, total] = await Promise.all([
      prisma.notificacion.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.notificacion.count({ where }),
    ]);

    return {
      notificaciones,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      noLeidas: await prisma.notificacion.count({
        where: { socioId, fechaLeida: null },
      }),
    };
  }

  /**
   * Listar notificaciones de un socio (alias para controlador)
   */
  async listarNotificacionesSocio(filtros: {
    socioId: number;
    soloNoLeidas?: boolean;
    tipo?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    limit?: number;
  }): Promise<any[]> {
    const { socioId, soloNoLeidas, tipo, fechaDesde, fechaHasta, limit = 20 } = filtros;

    const where: any = { socioId };

    if (soloNoLeidas) {
      where.fechaLeida = null;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = fechaDesde;
      if (fechaHasta) where.createdAt.lte = fechaHasta;
    }

    const notificaciones = await prisma.notificacion.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return notificaciones;
  }

  /**
   * Obtener notificaciones para administración (todas)
   * Filtrar por tipo (ej: SOLICITUD_*)
   */
  async listarTodasNotificaciones(filtros: {
    tipos?: TipoNotificacion[];
    estado?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const { page = 1, limit = 50, tipos, estado } = filtros;
    const where: any = {};

    if (tipos && tipos.length > 0) {
      where.tipo = { in: tipos };
    }

    if (estado) {
      // Mapeo simple de estado si fuera necesario, o directo de BD
      // Asumimos que 'PENDIENTE', 'APROBADO', etc. se guardan en el campo 'estado'
      // Ojo: en la tabla Notificacion el estado es ENVIADA/LEIDA.
      // Pero para "Solicitudes", el estado real de la solicitud no está en la notificación.
      // Sin embargo, podemos filtrar por tipo.
    }

    const [notificaciones, total] = await Promise.all([
      prisma.notificacion.findMany({
        where,
        include: {
          socio: {
            select: {
              id: true,
              nombreCompleto: true,
              codigo: true,
              email: true
            }
          },
          socios_notificaciones_creada_por_idTosocios: {
            select: {
              id: true,
              nombreCompleto: true,
              codigo: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificacion.count({ where })
    ]);

    return {
      notificaciones,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Marcar notificación como leída
   */
  async marcarComoLeida(notificacionId: number): Promise<any> {
    return await prisma.notificacion.update({
      where: { id: notificacionId },
      data: {
        fechaLeida: new Date(),
      },
    });
  }

  /**
   * Marcar todas como leídas
   */
  async marcarTodasComoLeidas(socioId: number): Promise<any> {
    return await prisma.notificacion.updateMany({
      where: {
        socioId,
        fechaLeida: null,
      },
      data: {
        fechaLeida: new Date(),
      },
    });
  }

  /**
   * Enviar recordatorios de cuotas próximas a vencer
   * (Ejecutar diariamente via cron job)
   */
  async enviarRecordatoriosCuotas(): Promise<void> {
    // Obtener cuotas que vencen en 3 días
    const tresDias = new Date();
    tresDias.setDate(tresDias.getDate() + 3);

    const cuotas = await prisma.cuota.findMany({
      where: {
        estado: 'PENDIENTE',
        fechaVencimiento: {
          gte: new Date(),
          lte: tresDias,
        },
      },
      include: {
        credito: {
          include: {
            socio: true,
          },
        },
      },
    });

    logger.info(`Enviando ${cuotas.length} recordatorios de cuotas...`);

    for (const cuota of cuotas) {
      const diasRestantes = Math.ceil(
        (new Date(cuota.fechaVencimiento).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
      );

      await this.enviarNotificacion({
        socioId: cuota.credito.socioId,
        tipo: TipoNotificacion.CUOTA_PROXIMA_VENCER,
        canal: [CanalNotificacion.EMAIL, CanalNotificacion.SMS],
        prioridad: PrioridadNotificacion.ALTA,
        datos: {
          codigoCredito: cuota.credito.codigo,
          numeroCuota: cuota.numeroCuota,
          montoCuota: cuota.montoCuota.toNumber(),
          fechaVencimiento: cuota.fechaVencimiento.toISOString().split('T')[0],
          diasRestantes,
        },
      });
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async obtenerEstadisticas(filtros: {
    fechaDesde?: Date;
    fechaHasta?: Date;
  }): Promise<any> {
    const { fechaDesde, fechaHasta } = filtros;

    const where: any = {};
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = fechaDesde;
      if (fechaHasta) where.createdAt.lte = fechaHasta;
    }

    const [total, porTipo, leidas, noLeidas] = await Promise.all([
      prisma.notificacion.count({ where }),
      prisma.notificacion.groupBy({
        by: ['tipo'],
        _count: true,
        where,
      }),
      prisma.notificacion.count({
        where: { ...where, fechaLeida: { not: null } },
      }),
      prisma.notificacion.count({
        where: { ...where, fechaLeida: null },
      }),
    ]);

    return {
      total,
      leidas,
      noLeidas,
      tasaLectura: total > 0 ? ((leidas / total) * 100).toFixed(2) : 0,
      porTipo: porTipo.map((t) => ({
        tipo: t.tipo,
        cantidad: t._count,
      })),
    };
  }
}

export default new NotificacionesService();
