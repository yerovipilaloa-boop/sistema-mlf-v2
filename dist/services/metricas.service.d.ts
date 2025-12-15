/**
 * ============================================================================
 * Sistema MLF - Servicio de Métricas Financieras
 * Archivo: src/services/metricas.service.ts
 * Descripción: Cálculo de métricas e indicadores financieros del sistema
 * ============================================================================
 */
interface PeriodoFiltro {
    fechaInicio: Date;
    fechaFin: Date;
}
interface MetricasIngresos {
    totalInteresesCobrados: number;
    totalCapitalRecuperado: number;
    totalPagosRecibidos: number;
    tasaRecuperacion: number;
}
interface MetricasEgresos {
    totalGastosOperativos: number;
    gastosPorCategoria: {
        [categoria: string]: number;
    };
    utilidadesPendientesPagar: number;
}
interface MetricasReservas {
    fondoSeguroAcumulado: number;
    fondoSeguroUtilizado: number;
    fondoSeguroDisponible: number;
    fondoSeguroLiberado: number;
    primasPendientesCobro: number;
}
interface MetricasUtilidades {
    ingresosTotal: number;
    egresosTotal: number;
    utilidadBruta: number;
    utilidadNeta: number;
    margenBruto: number;
    margenNeto: number;
}
interface MetricasCartera {
    carteraVigente: number;
    carteraVencida: number;
    creditosEnMora: number;
    montoDeMora: number;
    provisionesNecesarias: number;
}
interface DashboardCompleto {
    periodo: {
        inicio: string;
        fin: string;
    };
    ingresos: MetricasIngresos;
    egresos: MetricasEgresos;
    reservas: MetricasReservas;
    utilidades: MetricasUtilidades;
    cartera: MetricasCartera;
    resumen: {
        sociosActivos: number;
        creditosActivos: number;
        totalAhorros: number;
        aporteAdministrador: number;
        capitalPrestado: number;
        sociosPorEtapa: {
            etapa1: number;
            etapa2: number;
            etapa3: number;
        };
    };
}
declare class MetricasService {
    /**
     * Obtener métricas completas del dashboard
     */
    obtenerMetricasCompletas(periodo?: PeriodoFiltro): Promise<DashboardCompleto>;
    /**
     * Calcular métricas de ingresos
     */
    private calcularMetricasIngresos;
    /**
     * Calcular métricas de egresos (SIN incluir Fondo de Seguro - eso va en Reservas)
     */
    private calcularMetricasEgresos;
    /**
     * Calcular métricas de reservas (Fondo de Seguro de Desgravamen)
     *
     * CONTABILIDAD CORRECTA:
     * - El seguro se financia junto con el crédito (1% del monto solicitado)
     * - Se va cobrando dentro de las cuotas (parte del capital)
     * - Es una RESERVA/PASIVO, no un egreso
     * - Solo se convierte en INGRESO cuando el crédito se liquida completamente
     * - Solo se convierte en GASTO si hay un siniestro (fallecimiento)
     */
    private calcularMetricasReservas;
    /**
     * Calcular métricas de utilidades
     *
     * NOTA: El Fondo de Seguro NO se incluye en egresos porque:
     * - Es una RESERVA/PASIVO, no un gasto
     * - Solo se convierte en ingreso cuando el crédito se liquida
     * - Solo se convierte en gasto si hay un siniestro
     */
    private calcularMetricasUtilidades;
    /**
     * Calcular métricas de cartera
     */
    private calcularMetricasCartera;
    /**
     * Calcular resumen general (sin filtro de período)
     */
    private calcularResumenGeneral;
    /**
     * Obtener período actual (mes actual)
     */
    private obtenerPeriodoActual;
    /**
     * Obtener períodos predefinidos
     */
    obtenerPeriodo(tipo: 'dia' | 'semana' | 'mes' | 'año'): PeriodoFiltro;
    /**
     * Redondear a 2 decimales
     */
    private redondear;
}
declare const _default: MetricasService;
export default _default;
//# sourceMappingURL=metricas.service.d.ts.map