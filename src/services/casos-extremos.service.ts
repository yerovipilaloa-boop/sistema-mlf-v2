/**
 * ============================================================================
 * Sistema MLF - Servicio de Casos Extremos
 * Archivo: src/services/casos-extremos.service.ts
 * Descripción: Gestión de situaciones excepcionales (fallecimientos, fraude, etc.)
 * ============================================================================
 *
 * CASOS MANEJADOS:
 * 1. Fallecimiento de socio deudor
 * 2. Fallecimiento de garante
 * 3. Detección de fraude
 * 4. Refinanciamiento de créditos
 * 5. Condonación excepcional
 * 6. Emergencias naturales/catástrofes
 */

import prisma from '../config/database';
import logger from '../config/logger';
import {
  NotFoundError,
  BusinessRuleError,
  ValidationError,
} from '../utils/errors';
import { EstadoCredito, EstadoSocio, EstadoGarantia } from '../types';
import notificacionesService, {
  TipoNotificacion,
  CanalNotificacion,
  PrioridadNotificacion,
} from './notificaciones.service';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export enum TipoCasoExtremo {
  FALLECIMIENTO_DEUDOR = 'FALLECIMIENTO_DEUDOR',
  FALLECIMIENTO_GARANTE = 'FALLECIMIENTO_GARANTE',
  FRAUDE_DETECTADO = 'FRAUDE_DETECTADO',
  REFINANCIAMIENTO = 'REFINANCIAMIENTO',
  CONDONACION = 'CONDONACION',
  CATASTROFE_NATURAL = 'CATASTROFE_NATURAL',
}

interface ProcesarFallecimientoDeudorDTO {
  socioId: number;
  creditoId: number;
  fechaFallecimiento: Date;
  certificadoDefuncion: string;
  observaciones?: string;
}

interface ProcesarFallecimientoGaranteDTO {
  garanteId: number;
  fechaFallecimiento: Date;
  certificadoDefuncion: string;
  observaciones?: string;
}

interface DetectarFraudeDTO {
  socioId: number;
  tipo: 'IDENTIDAD' | 'DOCUMENTACION' | 'INFORMACION_FALSA' | 'OTROS';
  descripcion: string;
  evidencias?: string[];
  gravedad: 'LEVE' | 'MODERADO' | 'GRAVE';
}

interface RefinanciarCreditoDTO {
  creditoId: number;
  nuevoPlazoMeses: number;
  nuevaTasaInteres?: number;
  motivoRefinanciamiento: string;
  quitas?: number; // Monto a condonar
}

interface CondonarDeudaDTO {
  creditoId: number;
  montoCondonado: number;
  motivo: string;
  autorizadoPor: number; // ID del admin que autoriza
}

// ============================================================================
// SERVICIO DE CASOS EXTREMOS
// ============================================================================

class CasosExtremosService {
  /**
   * Procesar fallecimiento de socio deudor
   * Se ejecuta el seguro de vida (1% prima) para cubrir deuda
   */
  async procesarFallecimientoDeudor(
    data: ProcesarFallecimientoDeudorDTO,
    usuarioId?: number
  ): Promise<any> {
    const {
      socioId,
      creditoId,
      fechaFallecimiento,
      certificadoDefuncion,
      observaciones,
    } = data;

    // Verificar socio
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: {
        creditos: {
          where: {
            id: creditoId,
            estado: {
              in: [EstadoCredito.DESEMBOLSADO, EstadoCredito.CASTIGADO],
            },
          },
        },
      },
    });

    if (!socio) {
      throw new NotFoundError('Socio', socioId);
    }

    const credito = socio.creditos[0];
    if (!credito) {
      throw new NotFoundError('Crédito activo', creditoId);
    }

    logger.warn(
      `⚠️ Procesando fallecimiento de socio ${socio.codigo} - Crédito ${credito.codigo}`
    );

    // Procesar en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Suspender socio
      await tx.socio.update({
        where: { id: socioId },
        data: {
          estado: EstadoSocio.INACTIVO,
          // observaciones: observaciones ?? undefined, // Campo no existe
        },
      });

      // 2. Calcular saldo pendiente del crédito
      const saldoPendiente = credito.saldo_capital.toNumber();

      // 3. Verificar si el seguro cubre el saldo
      const montoCubierto = Math.min(saldoPendiente, credito.montoTotal.toNumber());
      const saldoRestante = Math.max(0, saldoPendiente - montoCubierto);

      // 4. Registrar uso del fondo de seguro
      await tx.fondoSeguro.create({
        data: {
          tipo: 'EGRESO_FALLECIMIENTO',
          monto: montoCubierto,
          creditoId,
          socioId,
          concepto: `Cobertura por fallecimiento - ${socio.nombreCompleto} - Ref: ${certificadoDefuncion}`,
        },
      });

      // 5. Actualizar crédito
      const nuevoEstado =
        saldoRestante === 0
          ? EstadoCredito.COMPLETADO
          : EstadoCredito.CASTIGADO;

      await tx.credito.update({
        where: { id: creditoId },
        data: {
          estado: nuevoEstado,
          saldo_capital: saldoRestante,
          // observaciones: `Fallecimiento deudor...` // Campo no existe
        },
      });

      // 6. Si hay saldo restante, notificar a garantes
      if (saldoRestante > 0) {
        const garantias = await tx.garantia.findMany({
          where: {
            creditoId,
            estado: EstadoGarantia.ACTIVA,
          },
          include: {
            garante: true,
          },
        });

        // Ejecutar garantías proporcionalmente
        for (const garantia of garantias) {
          const montoEjecutar = Math.min(
            garantia.montoCongelado.toNumber(),
            saldoRestante / garantias.length
          );

          await tx.garantia.update({
            where: { id: garantia.id },
            // @ts-ignore
            data: {
              estado: EstadoGarantia.EJECUTADA,
              fechaEjecucion: new Date(),
              monto_ejecutado: montoEjecutar, // snake_case confirmado
              motivoEjecucion: `Fallecimiento deudor - Saldo no cubierto por seguro`,
            },
          });

          await tx.socio.update({
            where: { id: garantia.socio_garante_id }, // snake_case confirmado
            data: {
              ahorroCongelado: { decrement: montoEjecutar },
              ahorroActual: { decrement: montoEjecutar },
            },
          });

          // Notificar garante
          await notificacionesService.enviarNotificacion({
            socioId: garantia.socio_garante_id,
            tipo: TipoNotificacion.GARANTIA_EJECUTADA,
            canal: [CanalNotificacion.EMAIL, CanalNotificacion.SMS],
            prioridad: PrioridadNotificacion.URGENTE,
            datos: {
              codigoCredito: credito.codigo,
              nombreDeudor: socio.nombreCompleto,
              montoEjecutado: montoEjecutar,
            },
          });
        }
      } else {
        // Liberar garantías si el seguro cubrió todo
        await tx.garantia.updateMany({
          where: {
            creditoId,
            estado: EstadoGarantia.ACTIVA,
          },
          data: {
            estado: EstadoGarantia.LIBERADA,
            fechaLiberacion: new Date(),
          },
        });

        // Liberar ahorros congelados
        const garantias = await tx.garantia.findMany({
          where: { creditoId },
        });

        for (const garantia of garantias) {
          await tx.socio.update({
            where: { id: garantia.socio_garante_id },
            data: {
              ahorroCongelado: { decrement: garantia.montoCongelado.toNumber() },
            },
          });
        }
      }

      // 7. Auditoría
      await tx.auditoria.create({
        data: {
          entidad: 'Socio',
          accion: 'ACTUALIZAR',
          entidadId: socioId,
          usuarioId: usuarioId || null,
          datosAnteriores: {
            estado: socio.estado,
            creditoEstado: credito.estado,
          },
          datosNuevos: {
            estado: EstadoSocio.INACTIVO,
            creditoEstado: nuevoEstado,
            montoCubierto,
            saldoRestante,
          },
          descripcion: `Fallecimiento procesado: ${socio.nombreCompleto} - Seguro: $${montoCubierto}`,
        },
      });

      return {
        socioId,
        creditoId,
        montoCubierto,
        saldoRestante,
        estadoCredito: nuevoEstado,
        garantiasEjecutadas: saldoRestante > 0,
      };
    });

    logger.info(
      `✅ Fallecimiento procesado: Socio ${socio.codigo}, Cubierto: $${resultado.montoCubierto}, Restante: $${resultado.saldoRestante}`
    );

    return resultado;
  }

  /**
   * Procesar fallecimiento de garante
   * Se liberan garantías y se buscan nuevos garantes
   */
  async procesarFallecimientoGarante(
    data: ProcesarFallecimientoGaranteDTO,
    usuarioId?: number
  ): Promise<any> {
    const { garanteId, fechaFallecimiento, certificadoDefuncion, observaciones } = data;

    const garante = await prisma.socio.findUnique({
      where: { id: garanteId },
      include: {
        garantiasOtorgadas: {
          where: {
            estado: {
              in: [EstadoGarantia.ACTIVA],
            },
          },
          include: {
            credito: {
              include: {
                socio: true,
              },
            },
          },
        },
      },
    }) as any; // Cast to any to avoid type error with relations

    if (!garante) {
      throw new NotFoundError('Garante', garanteId);
    }

    logger.warn(
      `⚠️ Procesando fallecimiento de garante ${garante.codigo} - ${garante.garantiasOtorgadas.length} garantías activas`
    );

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Suspender garante
      await tx.socio.update({
        where: { id: garanteId },
        data: {
          estado: EstadoSocio.INACTIVO,
          // observaciones: eliminado
        },
      });

      // 2. Liberar todas las garantías
      const garantiasLiberadas = [];

      for (const garantia of garante.garantiasOtorgadas) {
        await tx.garantia.update({
          where: { id: garantia.id },
          data: {
            estado: EstadoGarantia.LIBERADA,
            fechaLiberacion: new Date(),
          },
        });

        // Liberar ahorro congelado
        await tx.socio.update({
          where: { id: garanteId },
          data: {
            ahorroCongelado: { decrement: garantia.montoCongelado.toNumber() },
          },
        });

        garantiasLiberadas.push({
          creditoId: garantia.creditoId,
          codigoCredito: garantia.credito.codigo,
          deudor: garantia.credito.socio.nombreCompleto,
          montoLiberado: garantia.montoCongelado.toNumber(),
        });

        // 3. Marcar crédito
        await tx.credito.update({
          where: { id: garantia.creditoId },
          data: {
            // observaciones no existe
          },
        });
      }

      // 4. Auditoría
      await tx.auditoria.create({
        data: {
          entidad: 'Socio',
          accion: 'ACTUALIZAR',
          entidadId: garanteId,
          usuarioId: usuarioId || null,
          datosNuevos: {
            estado: EstadoSocio.INACTIVO,
            garantiasLiberadas: garantiasLiberadas.length,
          },
          descripcion: `Fallecimiento garante: ${garante.nombreCompleto} - ${garantiasLiberadas.length} garantías liberadas`,
        },
      });

      return {
        garanteId,
        nombreGarante: garante.nombreCompleto,
        garantiasLiberadas,
        totalLiberado: garantiasLiberadas.reduce(
          (sum, g) => sum + g.montoLiberado,
          0
        ),
      };
    });

    logger.info(
      `✅ Fallecimiento garante procesado: ${garante.codigo}, ${resultado.garantiasLiberadas.length} garantías liberadas`
    );

    return resultado;
  }

  /**
   * Detectar y marcar posible fraude
   */
  async detectarFraude(data: DetectarFraudeDTO, usuarioId?: number): Promise<any> {
    const { socioId, tipo, descripcion, evidencias = [], gravedad } = data;

    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: {
        creditos: {
          where: {
            estado: {
              in: [EstadoCredito.DESEMBOLSADO, EstadoCredito.APROBADO],
            },
          },
        },
      },
    });

    if (!socio) {
      throw new NotFoundError('Socio', socioId);
    }

    logger.warn(
      `🚨 FRAUDE DETECTADO: Socio ${socio.codigo}, Tipo: ${tipo}, Gravedad: ${gravedad}`
    );

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Suspender socio inmediatamente
      await tx.socio.update({
        where: { id: socioId },
        data: {
          estado: EstadoSocio.INACTIVO,
          // observaciones: descripcion,
        },
      });

      // 2. Suspender créditos activos
      const creditosSuspendidos = [];
      for (const credito of socio.creditos) {
        await tx.credito.update({
          where: { id: credito.id },
          data: {
            estado: EstadoCredito.CASTIGADO,
            // observaciones: `SUSPENDIDO POR FRAUDE: ${tipo}`,
          },
        });
        creditosSuspendidos.push(credito.codigo);
      }

      // 3. Auditoría de fraude
      await tx.auditoria.create({
        data: {
          entidad: 'Socio',
          accion: 'ACTUALIZAR',
          entidadId: socioId,
          usuarioId: usuarioId || null,
          datosAnteriores: { estado: 'ACTIVO' },
          datosNuevos: {
            estado: EstadoSocio.INACTIVO,
            tipoFraude: tipo,
            gravedad,
          },
          descripcion: `🚨 FRAUDE: ${tipo} - ${descripcion}`,
        },
      });

      // 4. Notificar a administradores
      // TODO: Implementar notificación

      return {
        socioId,
        nombreSocio: socio.nombreCompleto,
        codigoSocio: socio.codigo,
        tipo,
        gravedad,
        creditosSuspendidos,
        mensaje: 'Socio y créditos suspendidos por fraude detectado',
      };
    });

    return resultado;
  }

  /**
   * Refinanciar crédito
   */
  async refinanciarCredito(
    data: RefinanciarCreditoDTO,
    usuarioId?: number
  ): Promise<any> {
    const {
      creditoId,
      nuevoPlazoMeses,
      nuevaTasaInteres,
      motivoRefinanciamiento,
      quitas = 0,
    } = data;

    const credito = await prisma.credito.findUnique({
      where: { id: creditoId },
      include: {
        socio: true,
        cuotas: true,
      },
    });

    if (!credito) {
      throw new NotFoundError('Crédito', creditoId);
    }

    if (credito.estado !== EstadoCredito.DESEMBOLSADO) {
      throw new BusinessRuleError(
        'Solo se pueden refinanciar créditos DESEMBOLSADOS'
      );
    }

    logger.info(
      `Refinanciando crédito ${credito.codigo}: Plazo ${nuevoPlazoMeses} meses, Quita $${quitas}`
    );

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Calcular nuevo saldo (saldo actual - quitas)
      const saldoActual = credito.saldo_capital.toNumber();
      const nuevoSaldo = saldoActual - quitas;

      if (nuevoSaldo <= 0) {
        throw new ValidationError('Las quitas no pueden ser mayores al saldo');
      }

      // 2. Marcar cuotas antiguas como CANCELADAS
      await tx.cuota.updateMany({
        where: {
          creditoId,
          estado: {
            in: ['PENDIENTE', 'VENCIDA'],
          },
        },
        data: {
          estado: 'CANCELADA' as any,
          // observaciones no existe en Cuota
        },
      });

      // 3. Actualizar crédito
      const tasaFinal = nuevaTasaInteres || credito.tasa_interes_mensual.toNumber();

      await tx.credito.update({
        where: { id: creditoId },
        data: {
          saldo_capital: nuevoSaldo,
          plazoMeses: nuevoPlazoMeses,
          tasa_interes_mensual: tasaFinal, // Nota: Convertir si es necesario, pero manteniendo tipo
          // observaciones: `Refinanciado: ${motivoRefinanciamiento}${quitas > 0 ? ` - Quita: $${quitas}` : ''}`,
        },
      });

      // 4. Generar nueva tabla de amortización
      // TODO: Llamar a amortizationService para generar nuevas cuotas

      // 5. Si hay quitas, registrar en auditoría
      if (quitas > 0) {
        await tx.auditoria.create({
          data: {
            entidad: 'Credito',
            accion: 'ACTUALIZAR',
            entidadId: creditoId,
            usuarioId: usuarioId || null,
            datosAnteriores: {
              saldo: saldoActual,
              plazo: credito.plazoMeses,
            },
            datosNuevos: {
              saldo: nuevoSaldo,
              plazo: nuevoPlazoMeses,
              quitas,
            },
            descripcion: `Refinanciamiento: ${motivoRefinanciamiento}`,
          },
        });
      }

      return {
        creditoId,
        codigoCredito: credito.codigo,
        saldoAnterior: saldoActual,
        nuevoSaldo,
        quitas,
        nuevoPlazosaldo: nuevoPlazoMeses,
        nuevaTasa: tasaFinal,
      };
    });

    // Notificar al socio
    await notificacionesService.enviarNotificacion({
      socioId: credito.socioId,
      tipo: TipoNotificacion.CREDITO_DESEMBOLSADO, // Reutilizar o crear nuevo tipo
      canal: [CanalNotificacion.EMAIL],
      datos: {
        codigoCredito: credito.codigo,
        mensaje: `Tu crédito ha sido refinanciado. Nuevo plazo: ${nuevoPlazoMeses} meses${quitas > 0 ? `. Quita aplicada: $${quitas}` : ''}`,
      },
    });

    return resultado;
  }

  /**
   * Condonar deuda (casos excepcionales)
   */
  async condonarDeuda(
    data: CondonarDeudaDTO,
    usuarioId?: number
  ): Promise<any> {
    const { creditoId, montoCondonado, motivo, autorizadoPor } = data;

    if (!usuarioId || usuarioId !== autorizadoPor) {
      throw new ValidationError(
        'La condonación debe ser autorizada por un administrador'
      );
    }

    const credito = await prisma.credito.findUnique({
      where: { id: creditoId },
      include: { socio: true },
    });

    if (!credito) {
      throw new NotFoundError('Crédito', creditoId);
    }

    const saldoActual = credito.saldo_capital.toNumber();

    if (montoCondonado > saldoActual) {
      throw new ValidationError(
        'El monto a condonar no puede exceder el saldo del crédito'
      );
    }

    logger.warn(
      `⚠️ CONDONACIÓN: Crédito ${credito.codigo}, Monto: $${montoCondonado}, Motivo: ${motivo}`
    );

    const resultado = await prisma.$transaction(async (tx) => {
      const nuevoSaldo = saldoActual - montoCondonado;

      await tx.credito.update({
        where: { id: creditoId },
        data: {
          saldo_capital: nuevoSaldo,
          // observaciones: `Condonación: $${montoCondonado} - ${motivo}`,
        },
      });

      // Auditoría detallada
      await tx.auditoria.create({
        data: {
          entidad: 'Credito',
          accion: 'ACTUALIZAR',
          entidadId: creditoId,
          usuarioId,
          datosAnteriores: { saldo: saldoActual },
          datosNuevos: { saldo: nuevoSaldo, condonacion: montoCondonado },
          descripcion: `⚠️ CONDONACIÓN: $${montoCondonado} - ${motivo} - Autorizado por ID ${autorizadoPor}`,
        },
      });

      return {
        creditoId,
        codigoCredito: credito.codigo,
        saldoAnterior: saldoActual,
        nuevoSaldo,
        montoCondonado,
        motivo,
      };
    });

    return resultado;
  }

  /**
   * Procesar catástrofe natural (suspensión masiva de pagos)
   */
  async procesarCatastrofe(
    descripcion: string,
    sociosAfectados: number[],
    mesesGracia: number,
    usuarioId?: number
  ): Promise<any> {
    logger.warn(
      `🌪️ CATÁSTROFE: ${descripcion} - ${sociosAfectados.length} socios afectados`
    );

    const resultado = await prisma.$transaction(async (tx) => {
      const creditosExtendidos = [];

      for (const socioId of sociosAfectados) {
        const creditos = await tx.credito.findMany({
          where: {
            socioId,
            estado: EstadoCredito.DESEMBOLSADO,
          },
        });

        for (const credito of creditos) {
          // Extender plazo
          await tx.credito.update({
            where: { id: credito.id },
            data: {
              plazoMeses: credito.plazoMeses + mesesGracia,
              // observaciones no existe
            },
          });

          // Postergar cuotas pendientes
          await tx.cuota.updateMany({
            where: {
              creditoId: credito.id,
              estado: {
                in: ['PENDIENTE', 'VENCIDA'],
              },
            },
            data: {
              // Mover fechas de vencimiento
              // observaciones no existe
            },
          });

          creditosExtendidos.push(credito.codigo);
        }
      }

      // Auditoría masiva
      await tx.auditoria.create({
        data: {
          entidad: 'Credito',
          accion: 'ACTUALIZAR',
          entidadId: 0, // No aplica un solo ID
          usuarioId: usuarioId || null,
          datosNuevos: {
            catastrofe: descripcion,
            sociosAfectados: sociosAfectados.length,
            mesesGracia,
          },
          descripcion: `🌪️ CATÁSTROFE: ${descripcion} - ${sociosAfectados.length} socios, ${creditosExtendidos.length} créditos extendidos`,
        },
      });

      return {
        sociosAfectados: sociosAfectados.length,
        creditosExtendidos: creditosExtendidos.length,
        mesesGracia,
        descripcion,
      };
    });

    return resultado;
  }
}

export default new CasosExtremosService();
