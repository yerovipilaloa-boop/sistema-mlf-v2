/**
 * ============================================================================
 * Sistema MLF - Servicio de Dashboard del Socio
 * Archivo: src/services/dashboard-socio.service.ts
 * Descripción: Métricas e información personalizada para cada socio
 * ============================================================================
 */
interface DashboardSocio {
    socio: InfoPersonalSocio;
    ahorros: MetricasAhorro;
    creditos: ResumenCreditos;
    creditosDetalle: CreditoDetalle[];
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
    ahorroDisponible: number;
    ahorroCongelado: number;
    totalAhorrado: number;
    comprometidoEnCreditos: number;
    balanceNeto: number;
    debeAlProyecto: boolean;
    montoDeudaProyecto: number;
    progresoCredito: {
        tieneCreditos: boolean;
        capitalOriginal: number;
        capitalPagado: number;
        porcentajePagado: number;
        etapaProgreso: number;
    };
    ultimoMovimiento: {
        fecha: Date | null;
        tipo: string | null;
        monto: number;
    };
    porcentajeUtilidades: number;
}
interface ResumenCreditos {
    creditosActivos: number;
    totalPrestado: number;
    totalPagado: number;
    saldoCapital: number;
    saldoPendiente: number;
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
    tasaCumplimiento: number;
    promedioAhorro: number;
    totalTransacciones: number;
}
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
declare class DashboardSocioService {
    /**
     * Obtener dashboard completo del socio
     */
    obtenerDashboardCompleto(socioId: number): Promise<DashboardSocio>;
    /**
     * Información personal del socio
     */
    private obtenerInfoPersonal;
    /**
     * Métricas de ahorro del socio
     * Incluye cálculo del balance neto (ahorros vs deuda de créditos)
     */
    private obtenerMetricasAhorro;
    /**
     * Resumen de créditos del socio
     */
    private obtenerResumenCreditos;
    /**
     * Próximas cuotas a pagar (todas las pendientes, ordenadas por fecha)
     */
    private obtenerProximasCuotas;
    /**
     * Historial reciente de movimientos (últimos 10)
     */
    private obtenerHistorialReciente;
    /**
     * Resumen de utilidades recibidas
     */
    private obtenerResumenUtilidades;
    /**
     * Estadísticas generales del socio
     */
    private obtenerEstadisticas;
    /**
     * Obtener créditos requeridos por etapa
     */
    private obtenerCreditosRequeridosEtapa;
    /**
     * Calcular fecha de próxima distribución de utilidades
     */
    private calcularProximaDistribucion;
    /**
     * Redondear a 2 decimales
     */
    private redondear;
    /**
     * Obtener información del límite de crédito disponible
     */
    obtenerLimiteCredito(socioId: number): Promise<{
        etapaActual: number;
        limiteMaximoEtapa: number;
        creditosActivos: number;
        montoEnUso: number;
        disponible: number;
        puedesSolicitar: boolean;
        razon?: string;
    }>;
    /**
     * Obtener garantías activas del socio (otorgadas y recibidas)
     */
    private obtenerGarantias;
    /**
     * Obtener lista detallada de créditos del socio
     * Se usa para el panel de estados con timeline
     */
    private obtenerCreditosDetalle;
    /**
     * Registrar solicitud de depósito
     * Genera una notificación al administrador para su aprobación
     */
    registrarSolicitudDeposito(socioId: number, data: {
        monto: number;
        comprobante?: string;
        observaciones?: string;
    }): Promise<{
        success: boolean;
        mensaje: string;
        fecha: Date;
        estado: string;
    }>;
    /**
     * Registrar solicitud de retiro
     * Genera una notificación al administrador
     */
    registrarSolicitudRetiro(socioId: number, data: {
        monto: number;
        observaciones?: string;
    }): Promise<{
        success: boolean;
        mensaje: string;
        fecha: Date;
        estado: string;
    }>;
    /**
     * Registrar solicitud de PAGO de cuota
     * Genera notificación al admin
     */
    registrarSolicitudPago(socioId: number, data: {
        monto: number;
        comprobante?: string;
        observaciones?: string;
    }): Promise<{
        success: boolean;
        mensaje: string;
        fecha: Date;
        estado: string;
    }>;
}
declare const _default: DashboardSocioService;
export default _default;
//# sourceMappingURL=dashboard-socio.service.d.ts.map