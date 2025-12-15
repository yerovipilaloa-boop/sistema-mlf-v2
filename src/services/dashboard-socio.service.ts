/**
 * ============================================================================
 * Sistema MLF - Servicio de Dashboard del Socio
 * Archivo: src/services/dashboard-socio.service.ts
 * Descripción: Métricas e información personalizada para cada socio
 * ============================================================================
 */

import prisma from '../config/database';
import { EstadoCredito } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

interface DashboardSocio {
  socio: InfoPersonalSocio;
  ahorros: MetricasAhorro;
  creditos: ResumenCreditos;
  creditosDetalle: CreditoDetalle[]; // NUEVO: lista completa de créditos con estado
  proximasCuotas: ProximaCuota[];
  historialReciente: HistorialItem[];
  utilidades: ResumenUtilidades;
  estadisticas: EstadisticasGenerales;
  garantias: GarantiasResumen;
}

interface GarantiasResumen {
  otorgadas: GarantiaItem[];
  recibidas: GarantiaItem[];
}

interface GarantiaItem {
  id: number;
  creditoCodigo: string;
  nombreGarante?: string;
  nombreGarantizado?: string;
  montoCongelado: number;
  estado: string;
}

interface InfoPersonalSocio {
  id: number;
  codigo: string;
  nombreCompleto: string;
  email: string;
  etapaActual: number;
  creditosEnEtapa: number;
  creditosRestantesEtapa: number;
  fechaRegistro: Date;
  estado: string;
}

interface MetricasAhorro {
  ahorroDisponible: number;        // Lo disponible para retiro (si balance es positivo)
  ahorroCongelado: number;         // Congelado por garantías a otros
  totalAhorrado: number;           // Ahorro actual + congelado
  comprometidoEnCreditos: number;  // Saldo capital pendiente de créditos activos
  balanceNeto: number;             // totalAhorrado - comprometidoEnCreditos
  debeAlProyecto: boolean;         // true si balanceNeto es negativo
  montoDeudaProyecto: number;      // Cuánto debe al proyecto (si es negativo)
  // Progreso de pago del crédito
  progresoCredito: {
    tieneCreditos: boolean;        // Si tiene créditos activos
    capitalOriginal: number;       // Suma de montos originales de créditos
    capitalPagado: number;         // Cuánto capital ha devuelto
    porcentajePagado: number;      // % del capital devuelto (0-100)
    etapaProgreso: number;         // 1-8 según las etapas definidas
  };
  ultimoMovimiento: {
    fecha: Date | null;
    tipo: string | null;
    monto: number;
  };
  porcentajeUtilidades: number; // 1% anual
}

interface ResumenCreditos {
  creditosActivos: number;
  totalPrestado: number;
  totalPagado: number;
  saldoCapital: number;        // Saldo contable (capital pendiente)
  saldoPendiente: number;      // Saldo para liquidar hoy (capital + interés corriente)
  proximoVencimiento: Date | null;
  creditoMayorSaldo: {
    codigo: string;
    saldo: number;
  } | null;
}

interface ProximaCuota {
  cuotaId: number;
  creditoCodigo: string;
  numeroCuota: number;
  fechaVencimiento: Date;
  montoCuota: number;
  montoPagado: number;
  saldoPendiente: number;
  diasParaVencimiento: number;
  estado: string;
  tieneMora: boolean;
  montoMora: number;
}

interface HistorialItem {
  id: number;
  fecha: Date;
  tipo: 'CREDITO' | 'PAGO' | 'AHORRO' | 'UTILIDAD' | 'DEPOSITO' | 'RETIRO';
  descripcion: string;
  monto: number;
  icono: string;
  color: string;
}

interface ResumenUtilidades {
  totalRecibido: number;
  ultimaDistribucion: {
    fecha: Date | null;
    monto: number;
    periodo: string | null;
  };
  proximaDistribucion: string;
}

interface EstadisticasGenerales {
  diasComoSocio: number;
  tasaCumplimiento: number; // % de cuotas pagadas a tiempo
  promedioAhorro: number;
  totalTransacciones: number;
}

// Detalle de crédito para el panel de estados
interface CreditoDetalle {
  id: number;
  codigo: string;
  estado: string;
  montoSolicitado: number;
  montoTotal: number;
  plazoMeses: number;
  fechaSolicitud: Date;
  fechaAprobacion?: Date | null;
  fechaDesembolso?: Date | null;
  saldoCapital?: number;
}

// ============================================================================
// SERVICIO
// ============================================================================

class DashboardSocioService {
  /**
   * Obtener dashboard completo del socio
   */
  async obtenerDashboardCompleto(socioId: number): Promise<DashboardSocio> {
    // Verificar que el socio existe
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
    });

    if (!socio) {
      throw new Error('Socio no encontrado');
    }

    // Obtener todas las métricas en paralelo
    const [
      infoPersonal,
      ahorros,
      creditos,
      proximasCuotas,
      historial,
      utilidades,
      estadisticas,
      garantias,
    ] = await Promise.all([
      this.obtenerInfoPersonal(socioId),
      this.obtenerMetricasAhorro(socioId),
      this.obtenerResumenCreditos(socioId),
      this.obtenerProximasCuotas(socioId),
      this.obtenerHistorialReciente(socioId),
      this.obtenerResumenUtilidades(socioId),
      this.obtenerEstadisticas(socioId),
      this.obtenerGarantias(socioId),
    ]);

    // Obtener lista detallada de créditos (para el panel de estados)
    const creditosDetalle = await this.obtenerCreditosDetalle(socioId);

    return {
      socio: infoPersonal,
      ahorros,
      creditos,
      creditosDetalle, // NUEVO: lista de créditos con estado y detalles
      proximasCuotas,
      historialReciente: historial,
      utilidades,
      estadisticas,
      garantias,
    };
  }

  /**
   * Información personal del socio
   */
  private async obtenerInfoPersonal(socioId: number): Promise<InfoPersonalSocio> {
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      select: {
        id: true,
        codigo: true,
        nombreCompleto: true,
        email: true,
        etapaActual: true,
        creditosEtapaActual: true,
        fechaRegistro: true,
        estado: true,
      },
    });

    if (!socio) {
      throw new Error('Socio no encontrado');
    }

    // Calcular créditos restantes para pasar a siguiente etapa
    const creditosRequeridos = this.obtenerCreditosRequeridosEtapa(socio.etapaActual);
    const creditosRestantes = Math.max(0, creditosRequeridos - socio.creditosEtapaActual);

    return {
      id: socio.id,
      codigo: socio.codigo,
      nombreCompleto: socio.nombreCompleto,
      email: socio.email,
      etapaActual: socio.etapaActual,
      creditosEnEtapa: socio.creditosEtapaActual,
      creditosRestantesEtapa: creditosRestantes,
      fechaRegistro: socio.fechaRegistro,
      estado: socio.estado,
    };
  }

  /**
   * Métricas de ahorro del socio
   * Incluye cálculo del balance neto (ahorros vs deuda de créditos)
   */
  private async obtenerMetricasAhorro(socioId: number): Promise<MetricasAhorro> {
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      select: {
        ahorroActual: true,
        ahorroCongelado: true,
      },
    });

    if (!socio) {
      throw new Error('Socio no encontrado');
    }

    // Obtener última transacción
    const ultimaTransaccion = await prisma.transaccion.findFirst({
      where: { socioId },
      orderBy: { fechaTransaccion: 'desc' },
      select: {
        fechaTransaccion: true,
        tipo: true,
        monto: true,
      },
    });

    // Obtener saldo capital pendiente de créditos DESEMBOLSADOS
    const creditosActivos = await prisma.credito.findMany({
      where: {
        socioId,
        estado: EstadoCredito.DESEMBOLSADO,
      },
      select: {
        saldo_capital: true,
        montoTotal: true,  // Capital original del crédito
      },
    });

    // Suma del saldo capital de todos los créditos activos
    const comprometidoEnCreditos = creditosActivos.reduce(
      (sum, c) => sum + (c.saldo_capital?.toNumber() || 0),
      0
    );

    // Calcular progreso del crédito
    const capitalOriginal = creditosActivos.reduce(
      (sum, c) => sum + (c.montoTotal?.toNumber() || 0),
      0
    );
    const capitalPagado = capitalOriginal - comprometidoEnCreditos;
    const porcentajePagado = capitalOriginal > 0
      ? Math.round((capitalPagado / capitalOriginal) * 100)
      : 0;

    // Determinar etapa de progreso (1-8)
    let etapaProgreso = 1;
    if (creditosActivos.length === 0) {
      etapaProgreso = 8; // Sin créditos activos
    } else if (porcentajePagado >= 100) {
      etapaProgreso = 7; // Crédito completamente pagado (recuperando ahorros)
    } else if (porcentajePagado >= 75) {
      etapaProgreso = 6; // Casi libre (75-99%)
    } else if (porcentajePagado >= 50) {
      etapaProgreso = 5; // Pasó la mitad (50-75%)
    } else if (porcentajePagado >= 49 && porcentajePagado <= 51) {
      etapaProgreso = 4; // Justo en la mitad (para mensaje especial)
    } else if (porcentajePagado >= 25) {
      etapaProgreso = 3; // En camino (25-50%)
    } else if (porcentajePagado >= 10) {
      etapaProgreso = 2; // Buen inicio (10-25%)
    } else {
      etapaProgreso = 1; // Recién comenzó (0-10%)
    }

    const ahorroActual = socio.ahorroActual.toNumber();
    const ahorroCongelado = socio.ahorroCongelado.toNumber();
    const totalAhorrado = ahorroActual + ahorroCongelado;

    // Balance neto: Ahorros - Deuda de Créditos
    // Si es positivo: el socio tiene ahorros disponibles
    // Si es negativo: el socio debe dinero al proyecto
    const balanceNeto = totalAhorrado - comprometidoEnCreditos;
    const debeAlProyecto = balanceNeto < 0;
    const montoDeudaProyecto = debeAlProyecto ? Math.abs(balanceNeto) : 0;

    // Disponible para retiro: solo si el balance es positivo
    // Si tiene créditos, el disponible es el máximo entre 0 y el balance neto
    const ahorroDisponible = Math.max(0, balanceNeto);

    return {
      ahorroDisponible,
      ahorroCongelado,
      totalAhorrado,
      comprometidoEnCreditos,
      balanceNeto,
      debeAlProyecto,
      montoDeudaProyecto,
      progresoCredito: {
        tieneCreditos: creditosActivos.length > 0,
        capitalOriginal,
        capitalPagado,
        porcentajePagado,
        etapaProgreso,
      },
      ultimoMovimiento: {
        fecha: ultimaTransaccion?.fechaTransaccion || null,
        tipo: ultimaTransaccion?.tipo || null,
        monto: ultimaTransaccion?.monto.toNumber() || 0,
      },
      porcentajeUtilidades: 1.0, // 1% anual sobre ahorros
    };
  }

  /**
   * Resumen de créditos del socio
   */
  private async obtenerResumenCreditos(socioId: number): Promise<ResumenCreditos> {
    const creditos = await prisma.credito.findMany({
      where: {
        socioId,
        estado: EstadoCredito.DESEMBOLSADO,
      },
      include: {
        cuotas: {
          select: {
            montoCuota: true,
            monto_capital: true,
            monto_interes: true,
            montoPagado: true,
            fechaVencimiento: true,
          },
        },
      },
    });

    const creditosActivos = creditos.length;
    let totalPrestado = 0;
    let totalPagado = 0;
    let saldoCapital = 0;    // Suma de saldo_capital contable
    let saldoPendiente = 0;  // Suma de saldo para liquidar (capital + interés corriente)
    let proximoVencimiento: Date | null = null;
    let creditoMayorSaldo: { codigo: string; saldo: number } | null = null;
    let mayorSaldo = 0;

    creditos.forEach((credito) => {
      // Usar montoTotal (incluye seguro de desgravamen) para ser consistente
      const montoPrestado = credito.montoTotal.toNumber();
      const capitalPendiente = credito.saldo_capital.toNumber();

      // Calcular el saldo para liquidación según política:
      // - Capital total pendiente
      // - + Interés del mes actual (cuota que está corriendo)
      // - + Intereses de cuotas vencidas
      // - NO incluye intereses de meses futuros (se perdonan al liquidar)

      const hoy = new Date();
      let interesesAdeudados = 0;

      credito.cuotas.forEach((cuota) => {
        const fechaVencimiento = new Date(cuota.fechaVencimiento);
        const montoCuota = cuota.montoCuota.toNumber();
        const montoPagado = cuota.montoPagado.toNumber();
        const montoCapital = cuota.monto_capital.toNumber();
        const montoInteres = cuota.monto_interes.toNumber();
        const saldoCuota = montoCuota - montoPagado;

        if (saldoCuota > 0) {
          // Si la cuota ya venció o vence este mes, incluir su interés
          if (fechaVencimiento.getFullYear() <= hoy.getFullYear() &&
            fechaVencimiento.getMonth() <= hoy.getMonth()) {
            // Calcular cuánto interés falta por pagar de esta cuota
            const capitalPagadoCuota = Math.min(montoPagado, montoCapital);
            const interesPagadoCuota = montoPagado - capitalPagadoCuota;
            const interesPendienteCuota = montoInteres - interesPagadoCuota;
            interesesAdeudados += interesPendienteCuota;
          }

          // Próxima cuota a vencer
          if (!proximoVencimiento || fechaVencimiento < proximoVencimiento) {
            proximoVencimiento = fechaVencimiento;
          }
        }
      });

      const saldoLiquidacion = capitalPendiente + interesesAdeudados;

      totalPrestado += montoPrestado;
      saldoCapital += capitalPendiente;
      saldoPendiente += saldoLiquidacion;
      totalPagado += montoPrestado - capitalPendiente;

      // Crédito con mayor saldo
      if (saldoLiquidacion > mayorSaldo) {
        mayorSaldo = saldoLiquidacion;
        creditoMayorSaldo = {
          codigo: credito.codigo,
          saldo: saldoLiquidacion,
        };
      }
    });

    return {
      creditosActivos,
      totalPrestado: this.redondear(totalPrestado),
      totalPagado: this.redondear(totalPagado),
      saldoCapital: this.redondear(saldoCapital),
      saldoPendiente: this.redondear(saldoPendiente),
      proximoVencimiento,
      creditoMayorSaldo,
    };
  }

  /**
   * Próximas cuotas a pagar (todas las pendientes, ordenadas por fecha)
   */
  private async obtenerProximasCuotas(socioId: number): Promise<ProximaCuota[]> {
    const hoy = new Date();

    const cuotas = await prisma.cuota.findMany({
      where: {
        credito: {
          socioId,
          estado: EstadoCredito.DESEMBOLSADO,
        },
        estado: {
          in: ['PENDIENTE', 'VENCIDA', 'PARCIALMENTE_PAGADA'],
        },
      },
      include: {
        credito: {
          select: {
            codigo: true,
          },
        },
      },
      orderBy: {
        fechaVencimiento: 'asc',
      },
      take: 100, // Aumentado a 100 para permitir precancelación de cuotas futuras con seguridad
    });

    return cuotas.map((cuota) => {
      const montoCuota = cuota.montoCuota.toNumber();
      const montoPagado = cuota.montoPagado.toNumber();
      const saldoPendiente = montoCuota - montoPagado;
      const montoMora = cuota.interes_mora?.toNumber() || 0;

      // Calcular días para vencimiento
      const fechaVenc = new Date(cuota.fechaVencimiento);
      const diasParaVencimiento = Math.ceil(
        (fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        cuotaId: cuota.id,
        creditoCodigo: cuota.credito.codigo,
        numeroCuota: cuota.numeroCuota,
        fechaVencimiento: cuota.fechaVencimiento,
        montoCuota,
        montoPagado,
        saldoPendiente: this.redondear(saldoPendiente),
        diasParaVencimiento,
        estado: cuota.estado,
        tieneMora: montoMora > 0,
        montoMora: this.redondear(montoMora),
      };
    });
  }

  /**
   * Historial reciente de movimientos (últimos 10)
   */
  private async obtenerHistorialReciente(socioId: number): Promise<HistorialItem[]> {
    const historial: HistorialItem[] = [];

    // Obtener créditos
    const creditos = await prisma.credito.findMany({
      where: { socioId },
      orderBy: { fechaDesembolso: 'desc' },
      take: 3,
      select: {
        id: true,
        codigo: true,
        montoSolicitado: true,
        fechaDesembolso: true,
      },
    });

    creditos.forEach((credito) => {
      if (credito.fechaDesembolso) {
        historial.push({
          id: credito.id,
          fecha: credito.fechaDesembolso,
          tipo: 'CREDITO',
          descripcion: `Crédito ${credito.codigo} desembolsado`,
          monto: credito.montoSolicitado.toNumber(),
          icono: '💳',
          color: 'primary',
        });
      }
    });

    // Obtener pagos
    const pagos = await prisma.pago.findMany({
      where: { socioId },
      orderBy: { fechaPago: 'desc' },
      take: 5,
      select: {
        id: true,
        codigo: true,
        monto_pago: true,
        fechaPago: true,
        credito: {
          select: {
            codigo: true,
          },
        },
      },
    });

    pagos.forEach((pago) => {
      historial.push({
        id: pago.id,
        fecha: pago.fechaPago,
        tipo: 'PAGO',
        descripcion: `Pago ${pago.codigo} - Crédito ${pago.credito.codigo}`,
        monto: pago.monto_pago.toNumber(),
        icono: '💰',
        color: 'success',
      });
    });

    // Obtener transacciones de ahorro
    const transacciones = await prisma.transaccion.findMany({
      where: { socioId },
      orderBy: { fechaTransaccion: 'desc' },
      take: 5,
      select: {
        id: true,
        tipo: true,
        monto: true,
        fechaTransaccion: true,
        concepto: true,
      },
    });

    transacciones.forEach((trans) => {
      historial.push({
        id: trans.id,
        fecha: trans.fechaTransaccion,
        tipo: trans.tipo as any, // 'DEPOSITO' | 'RETIRO'
        descripcion: trans.concepto || `${trans.tipo} en ahorro`,
        monto: trans.monto.toNumber(),
        icono: trans.tipo === 'DEPOSITO' ? '📥' : '📤',
        color: trans.tipo === 'DEPOSITO' ? 'info' : 'warning',
      });
    });

    // Ordenar por fecha descendente y tomar los 10 más recientes
    return historial
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 10);
  }

  /**
   * Resumen de utilidades recibidas
   */
  private async obtenerResumenUtilidades(socioId: number): Promise<ResumenUtilidades> {
    const utilidades = await prisma.utilidadDetalle.findMany({
      where: { socioId },
      include: {
        utilidad: {
          select: {
            a_o: true,
            semestre: true,
            fechaDistribucion: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalRecibido = utilidades.reduce(
      (sum, u) => sum + u.montoUtilidad.toNumber(),
      0
    );

    const ultimaUtilidad = utilidades[0];

    return {
      totalRecibido: this.redondear(totalRecibido),
      ultimaDistribucion: {
        fecha: ultimaUtilidad?.utilidad.fechaDistribucion || null,
        monto: ultimaUtilidad?.montoUtilidad.toNumber() || 0,
        periodo: ultimaUtilidad
          ? `${ultimaUtilidad.utilidad.a_o}-S${ultimaUtilidad.utilidad.semestre}`
          : null,
      },
      proximaDistribucion: this.calcularProximaDistribucion(),
    };
  }

  /**
   * Estadísticas generales del socio
   */
  private async obtenerEstadisticas(socioId: number): Promise<EstadisticasGenerales> {
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      select: {
        fechaRegistro: true,
      },
    });

    if (!socio) {
      throw new Error('Socio no encontrado');
    }

    // Días como socio
    const hoy = new Date();
    const diasComoSocio = Math.floor(
      (hoy.getTime() - socio.fechaRegistro.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Tasa de cumplimiento (cuotas pagadas a tiempo)
    const cuotasPagadas = await prisma.cuota.count({
      where: {
        credito: { socioId },
        estado: 'PAGADA',
        diasMora: 0,
      },
    });

    const cuotasTotales = await prisma.cuota.count({
      where: {
        credito: { socioId },
        estado: 'PAGADA',
      },
    });

    const tasaCumplimiento =
      cuotasTotales > 0 ? (cuotasPagadas / cuotasTotales) * 100 : 100;

    // Promedio de ahorro
    const transacciones = await prisma.transaccion.findMany({
      where: { socioId, tipo: 'DEPOSITO' },
      select: { monto: true },
    });

    const promedioAhorro =
      transacciones.length > 0
        ? transacciones.reduce((sum, t) => sum + t.monto.toNumber(), 0) /
        transacciones.length
        : 0;

    const totalTransacciones = await prisma.transaccion.count({
      where: { socioId },
    });

    return {
      diasComoSocio,
      tasaCumplimiento: this.redondear(tasaCumplimiento),
      promedioAhorro: this.redondear(promedioAhorro),
      totalTransacciones,
    };
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  /**
   * Obtener créditos requeridos por etapa
   */
  private obtenerCreditosRequeridosEtapa(etapa: number): number {
    const requerimientos: { [key: number]: number } = {
      1: 2, // Etapa 1: 2 créditos
      2: 3, // Etapa 2: 3 créditos
      3: 0, // Etapa 3: sin límite
    };
    return requerimientos[etapa] || 0;
  }

  /**
   * Calcular fecha de próxima distribución de utilidades
   */
  private calcularProximaDistribucion(): string {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1; // 1-12

    if (mes <= 6) {
      return `Junio ${hoy.getFullYear()}`;
    } else {
      return `Diciembre ${hoy.getFullYear()}`;
    }
  }

  /**
   * Redondear a 2 decimales
   */
  private redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  // ============================================================================
  // MÉTODOS PÚBLICOS PARA ACCIONES DEL SOCIO
  // ============================================================================

  /**
   * Obtener información del límite de crédito disponible
   */
  async obtenerLimiteCredito(socioId: number): Promise<{
    etapaActual: number;
    limiteMaximoEtapa: number;
    creditosActivos: number;
    montoEnUso: number;
    disponible: number;
    puedesSolicitar: boolean;
    razon?: string;
  }> {
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
              where: { estado: 'ACTIVA' },
            },
          },
        },
      },
    });

    if (!socio) {
      throw new Error('Socio no encontrado');
    }

    // Límites por etapa (Topes máximos duros)
    const limitesPorEtapa: { [key: number]: number } = {
      1: 500,
      2: 2000,
      3: 10000,
    };

    const etapaActual = socio.etapaActual;
    const topeMaximoEtapa = limitesPorEtapa[etapaActual] || 500;

    // Calcular multiplicador según etapa (Misma lógica que CreditosService)
    let multiplicador = 1.0;
    if (etapaActual === 1) {
      if (socio.creditosEtapaActual === 0) multiplicador = 1.25;
      else if (socio.creditosEtapaActual === 1) multiplicador = 1.5;
      else if (socio.creditosEtapaActual === 2) multiplicador = 1.75;
      else multiplicador = 2.0;
    } else if (etapaActual === 2) {
      multiplicador = 2.0;
    } else if (etapaActual === 3) {
      multiplicador = 3.0;
    }

    // Calcular límite basado en ahorros (Disponible + Congelado)
    const ahorroTotal = socio.ahorroActual.toNumber() + socio.ahorroCongelado.toNumber();
    const limitePorAhorros = ahorroTotal * multiplicador;

    // El límite real es el menor entre el tope de etapa y el cálculo por ahorros
    const limiteReal = Math.min(topeMaximoEtapa, limitePorAhorros);

    // Calcular monto en uso (créditos activos)
    const montoEnUso = socio.creditos.reduce(
      (sum, c) => sum + c.montoTotal.toNumber(),
      0
    );

    const disponible = Math.max(0, limiteReal - montoEnUso);

    // Verificar si tiene moras activas
    const tieneMoras = socio.creditos.some(c => c.moras && c.moras.length > 0);

    let puedesSolicitar = true;
    let razon: string | undefined;

    if (socio.estado !== 'ACTIVO') {
      puedesSolicitar = false;
      razon = 'Tu cuenta no está activa';
    } else if (tieneMoras) {
      puedesSolicitar = false;
      razon = 'Tienes mora activa. Regulariza tus pagos primero.';
    } else if (disponible <= 0) {
      puedesSolicitar = false;
      razon = 'Has alcanzado el límite de crédito disponible';
    }

    return {
      etapaActual,
      limiteMaximoEtapa: limiteReal, // Devolvemos el límite efectivo para que el frontend muestre el correcto
      creditosActivos: socio.creditos.filter(c => c.estado === 'DESEMBOLSADO').length,
      montoEnUso: this.redondear(montoEnUso),
      disponible: this.redondear(disponible),
      puedesSolicitar,
      razon,
    };
  }

  /**
   * Obtener garantías activas del socio (otorgadas y recibidas)
   */
  private async obtenerGarantias(socioId: number): Promise<GarantiasResumen> {
    // Garantías que el socio ha otorgado a otros
    const otorgadas = await prisma.garantia.findMany({
      where: {
        socio_garante_id: socioId,
        estado: 'ACTIVA',
      },
      include: {
        credito: { select: { codigo: true } },
        socios_garantias_socio_garantizado_idTosocios: {
          select: { nombreCompleto: true },
        },
      },
    });

    // Garantías que el socio ha recibido de otros
    const recibidas = await prisma.garantia.findMany({
      where: {
        socio_garantizado_id: socioId,
        estado: 'ACTIVA',
      },
      include: {
        credito: { select: { codigo: true } },
        socios_garantias_socio_garante_idTosocios: {
          select: { nombreCompleto: true },
        },
      },
    });

    return {
      otorgadas: otorgadas.map(g => ({
        id: g.id,
        creditoCodigo: g.credito?.codigo || '-',
        nombreGarantizado: g.socios_garantias_socio_garantizado_idTosocios?.nombreCompleto || 'Socio',
        montoCongelado: g.montoCongelado.toNumber(),
        estado: g.estado,
      })),
      recibidas: recibidas.map(g => ({
        id: g.id,
        creditoCodigo: g.credito?.codigo || '-',
        nombreGarante: g.socios_garantias_socio_garante_idTosocios?.nombreCompleto || 'Socio',
        montoCongelado: g.montoCongelado.toNumber(),
        estado: g.estado,
      })),
    };
  }

  /**
   * Obtener lista detallada de créditos del socio
   * Se usa para el panel de estados con timeline
   */
  private async obtenerCreditosDetalle(socioId: number): Promise<CreditoDetalle[]> {
    const creditos = await prisma.credito.findMany({
      where: { socioId },
      orderBy: { fechaSolicitud: 'desc' },
      select: {
        id: true,
        codigo: true,
        estado: true,
        montoSolicitado: true,
        montoTotal: true,
        plazoMeses: true,
        fechaSolicitud: true,
        fechaAprobacion: true,
        fechaDesembolso: true,
        saldo_capital: true,
      },
    });

    return creditos.map(credito => ({
      id: credito.id,
      codigo: credito.codigo,
      estado: credito.estado,
      montoSolicitado: credito.montoSolicitado?.toNumber() || 0,
      montoTotal: credito.montoTotal.toNumber(),
      plazoMeses: credito.plazoMeses,
      fechaSolicitud: credito.fechaSolicitud,
      fechaAprobacion: credito.fechaAprobacion,
      fechaDesembolso: credito.fechaDesembolso,
      saldoCapital: credito.saldo_capital?.toNumber() || 0,
    }));
  }

  /**
   * Registrar solicitud de depósito
   * Genera una notificación al administrador para su aprobación
   */
  async registrarSolicitudDeposito(socioId: number, data: { monto: number; comprobante?: string; observaciones?: string }) {
    // 1. Validar datos básicos
    if (data.monto <= 0) {
      throw new Error('El monto debe ser mayor a cero');
    }

    // 2. Buscar al administrador para enviarle la notificación
    const admin = await prisma.socio.findFirst({
      where: { rol: 'ADMIN' },
    });

    // Si no hay admin, al menos registramos el log, pero no fallamos la request del usuario
    // para no bloquear la UX. Idealmente deberia haber un admin default.
    if (admin) {
      try {
        await prisma.notificacion.create({
          data: {
            socioId: admin.id,
            tipo: 'SOLICITUD_DEPOSITO',
            prioridad: 'ALTA',
            asunto: 'Nueva Solicitud de Depósito',
            mensaje: `El socio ${socioId} ha solicitado un depósito de $${data.monto}. Comprobante: ${data.comprobante || 'N/A'}. Observaciones: ${data.observaciones || 'Ninguna'}`,
            datosAdicionales: {
              socioId,
              tipoSolicitud: 'DEPOSITO',
              monto: data.monto,
              comprobante: data.comprobante,
              observaciones: data.observaciones,
            },
            canal: 'SISTEMA',
            estado: 'PENDIENTE',
            creadaPorId: socioId,
          },
        });
      } catch (error) {
        console.error("Error creando notificacion deposito:", error);
        // No relanzamos para no romper el flujo visual del socio
      }
    } else {
      console.warn("ADVERTENCIA: No se encontró usuario ADMIN para notificar depósito.");
    }

    return {
      success: true,
      mensaje: 'Solicitud enviada a revisión',
      fecha: new Date(),
      estado: 'PENDIENTE'
    };
  }

  /**
   * Registrar solicitud de retiro
   * Genera una notificación al administrador
   */
  async registrarSolicitudRetiro(socioId: number, data: { monto: number; observaciones?: string }) {
    if (data.monto <= 0) {
      throw new Error('El monto debe ser mayor a cero');
    }

    const metricas = await this.obtenerMetricasAhorro(socioId);
    if (metricas.ahorroDisponible < data.monto) {
      throw new Error(`Saldo insuficiente. Disponible: $${metricas.ahorroDisponible}`);
    }

    const admin = await prisma.socio.findFirst({ where: { rol: 'ADMIN' } });

    if (admin) {
      try {
        await prisma.notificacion.create({
          data: {
            socioId: admin.id,
            tipo: 'SOLICITUD_RETIRO',
            prioridad: 'ALTA',
            asunto: 'Nueva Solicitud de Retiro',
            mensaje: `El socio ${socioId} ha solicitado retirar $${data.monto}. Observaciones: ${data.observaciones || 'Ninguna'}`,
            datosAdicionales: {
              socioId,
              tipoSolicitud: 'RETIRO',
              monto: data.monto,
              observaciones: data.observaciones,
            },
            canal: 'SISTEMA',
            estado: 'PENDIENTE',
            creadaPorId: socioId,
          },
        });
      } catch (error) {
        console.error("Error creando notificacion retiro:", error);
      }
    }

    return {
      success: true,
      mensaje: 'Solicitud de retiro enviada a revisión',
      fecha: new Date(),
      estado: 'PENDIENTE'
    };
  }

  /**
   * Registrar solicitud de PAGO de cuota
   * Genera notificación al admin
   */
  async registrarSolicitudPago(socioId: number, data: { monto: number; comprobante?: string; observaciones?: string }) {
    if (data.monto <= 0) {
      throw new Error('El monto debe ser mayor a cero');
    }

    const admin = await prisma.socio.findFirst({ where: { rol: 'ADMIN' } });

    if (admin) {
      try {
        await prisma.notificacion.create({
          data: {
            socioId: admin.id,
            tipo: 'SOLICITUD_PAGO',
            prioridad: 'ALTA',
            asunto: 'Nuevo Pago de Cuota Reportado',
            mensaje: `El socio ${socioId} ha reportado un pago de $${data.monto}. Comprobante: ${data.comprobante || 'N/A'}.`,
            datosAdicionales: {
              socioId,
              tipoSolicitud: 'PAGO_CUOTA',
              monto: data.monto,
              comprobante: data.comprobante,
              observaciones: data.observaciones,
            },
            canal: 'SISTEMA',
            estado: 'PENDIENTE',
            creadaPorId: socioId,
          },
        });
      } catch (error) {
        console.error("Error creando notificacion pago:", error);
      }
    }

    return {
      success: true,
      mensaje: 'Pago reportado exitosamente. Pendiente de verificación.',
      fecha: new Date(),
      estado: 'PENDIENTE'
    };
  }
}

export default new DashboardSocioService();

