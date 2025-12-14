/**
 * ============================================================================
 * TIPOS COMPARTIDOS ENTRE BACKEND Y FRONTEND
 * Sistema MLF - Mi Libertad Financiera
 * ============================================================================
 *
 * Este archivo define la estructura de datos que debe ser IDÉNTICA
 * entre el backend (TypeScript) y el frontend (JavaScript).
 *
 * IMPORTANTE: Cualquier cambio en estas interfaces debe reflejarse
 * tanto en el backend como en el frontend.
 * ============================================================================
 */

// ============================================================================
// DASHBOARD DEL SOCIO
// ============================================================================

/**
 * Estructura completa del dashboard del socio
 * Endpoint: GET /api/v1/socios/me/dashboard
 */
export interface DashboardSocioResponse {
  success: boolean;
  data: DashboardSocioData;
}

export interface DashboardSocioData {
  socio: InfoPersonalSocio;
  ahorros: MetricasAhorro;
  creditos: ResumenCreditos;
  proximasCuotas: ProximaCuota[];
  historialReciente: HistorialItem[];
  utilidades: ResumenUtilidades;
  estadisticas: EstadisticasGenerales;
}

// ============================================================================
// INFORMACIÓN PERSONAL DEL SOCIO
// ============================================================================

export interface InfoPersonalSocio {
  id: number;
  codigo: string;
  nombreCompleto: string;
  email: string;
  etapaActual: number;
  creditosEnEtapa: number;
  creditosRestantesEtapa: number;
  fechaRegistro: Date | string;
  estado: string;
}

// ============================================================================
// MÉTRICAS DE AHORRO
// ============================================================================

export interface MetricasAhorro {
  ahorroDisponible: number;
  ahorroCongelado: number;
  totalAhorrado: number;
  ultimoMovimiento: {
    fecha: Date | string | null;
    tipo: string | null;
    monto: number;
  };
  porcentajeUtilidades: number; // 1% anual
}

// ============================================================================
// RESUMEN DE CRÉDITOS
// ============================================================================

export interface ResumenCreditos {
  creditosActivos: number;        // ⚠️ Frontend: NO usar "totalActivos"
  totalPrestado: number;           // ⚠️ Frontend: NO usar "montoTotal"
  totalPagado: number;
  saldoPendiente: number;          // ⚠️ IMPORTANTE: Saldo para liquidación anticipada
                                   // ⚠️ = Capital pendiente + intereses del mes actual + intereses vencidos
                                   // ⚠️ NO incluye intereses futuros (se perdonan al liquidar)
  proximoVencimiento: Date | string | null;
  creditoMayorSaldo: {
    codigo: string;
    saldo: number;
  } | null;
}

// ============================================================================
// PRÓXIMAS CUOTAS
// ============================================================================

export interface ProximaCuota {
  cuotaId: number;
  creditoCodigo: string;
  numeroCuota: number;
  fechaVencimiento: Date | string;
  montoCuota: number;
  montoPagado: number;
  saldoPendiente: number;
  diasParaVencimiento: number;
  estado: string;
  tieneMora: boolean;
  montoMora: number;
}

// ============================================================================
// HISTORIAL DE MOVIMIENTOS
// ============================================================================

export interface HistorialItem {
  id: number;
  fecha: Date | string;
  tipo: 'CREDITO' | 'PAGO' | 'AHORRO' | 'UTILIDAD' | 'DEPOSITO' | 'RETIRO' | 'DESEMBOLSO';
  concepto: string;
  monto: number;
}

// ============================================================================
// RESUMEN DE UTILIDADES
// ============================================================================

export interface ResumenUtilidades {
  totalRecibido: number;
  ultimoPago: {
    fecha: Date | string | null;
    monto: number;
    periodo: string | null;
  };
  proximaDistribucion: string;
  porcentajeAnual: number;
}

// ============================================================================
// ESTADÍSTICAS GENERALES
// ============================================================================

export interface EstadisticasGenerales {
  diasComoSocio: number;
  tasaCumplimiento: number;     // ⚠️ Frontend: Está en estadisticas, NO en creditos
  promedioAhorro: number;
  totalTransacciones: number;
}

// ============================================================================
// MAPEO DE PROPIEDADES (REFERENCIA RÁPIDA)
// ============================================================================

/**
 * IMPORTANTE: Usa estas propiedades exactas en el frontend
 *
 * CORRECTO ✅:
 * - creditos.creditosActivos
 * - creditos.totalPrestado
 * - creditos.saldoPendiente
 * - estadisticas.tasaCumplimiento
 *
 * INCORRECTO ❌:
 * - creditos.totalActivos       ← NO EXISTE
 * - creditos.montoTotal          ← NO EXISTE
 * - creditos.saldoTotal          ← NO EXISTE
 * - creditos.tasaCumplimiento    ← ESTÁ EN ESTADISTICAS
 */

// ============================================================================
// ELEMENTOS DEL DOM (IDs) - DASHBOARD SOCIO
// ============================================================================

/**
 * Referencia de IDs de elementos HTML en dashboard-socio.html
 * Mantener sincronizado con el HTML
 */
export const DOM_IDS = {
  // Tarjetas principales
  AHORRO_TOTAL: 'ahorroTotal',
  SALDO_PENDIENTE: 'saldoPendiente',
  PROXIMO_PAGO: 'proximoPago',
  TASA_CUMPLIMIENTO: 'tasaCumplimiento',

  // Resumen de créditos
  TOTAL_PRESTADO: 'totalPrestado',
  TOTAL_PAGADO: 'totalPagado',
  SALDO_PENDIENTE_DETALLE: 'saldoPendienteDetalle',
  PROGRESS_PAGOS: 'progressPagos',
  PORCENTAJE_PAGADO: 'porcentajePagado',

  // Mis ahorros
  AHORRO_DISPONIBLE: 'ahorroDisponible',
  AHORRO_CONGELADO: 'ahorroCongelado',
  AHORRO_TOTAL_DETALLE: 'ahorroTotalDetalle',

  // Utilidades
  UTILIDADES_TOTALES: 'utilidadesTotales',
  ULTIMA_UTILIDAD: 'ultimaUtilidad',
  PROXIMA_UTILIDAD: 'proximaUtilidad',

  // Información personal
  NOMBRE_SOCIO: 'nombreSocio',
  CODIGO_SOCIO: 'codigoSocio',
  FECHA_REGISTRO: 'fechaRegistro',
  DIAS_COMO_SOCIO: 'diasComoSocio',
  ETAPA_BADGE: 'etapaBadge',
} as const;

// ============================================================================
// VALIDACIÓN DE TIPOS EN RUNTIME (JAVASCRIPT)
// ============================================================================

/**
 * Función helper para validar que los datos del backend
 * coinciden con la estructura esperada
 *
 * Uso en JavaScript:
 *
 * const dashboard = await fetch('/api/v1/socios/me/dashboard').then(r => r.json());
 * validateDashboardData(dashboard.data);
 */
export function validateDashboardData(data: any): data is DashboardSocioData {
  const errors: string[] = [];

  // Validar socio
  if (!data.socio) errors.push('Falta data.socio');
  if (!data.socio?.nombreCompleto) errors.push('Falta data.socio.nombreCompleto');

  // Validar ahorros
  if (!data.ahorros) errors.push('Falta data.ahorros');
  if (typeof data.ahorros?.totalAhorrado !== 'number') errors.push('Falta data.ahorros.totalAhorrado');

  // Validar créditos
  if (!data.creditos) errors.push('Falta data.creditos');
  if (typeof data.creditos?.creditosActivos !== 'number') {
    errors.push('Falta data.creditos.creditosActivos (NO creditosActivos)');
  }
  if (typeof data.creditos?.totalPrestado !== 'number') {
    errors.push('Falta data.creditos.totalPrestado (NO montoTotal)');
  }
  if (typeof data.creditos?.saldoPendiente !== 'number') {
    errors.push('Falta data.creditos.saldoPendiente (NO saldoTotal)');
  }

  // Validar estadísticas
  if (!data.estadisticas) errors.push('Falta data.estadisticas');
  if (typeof data.estadisticas?.tasaCumplimiento !== 'number') {
    errors.push('Falta data.estadisticas.tasaCumplimiento');
  }

  if (errors.length > 0) {
    console.error('❌ Errores de validación de datos del dashboard:', errors);
    console.error('Datos recibidos:', data);
    return false;
  }

  return true;
}
