/**
 * ============================================================================
 * Service: Dashboard de Rentabilidad
 * ============================================================================
 * Genera métricas financieras y estadísticas en tiempo real
 *
 * Métricas incluidas:
 * - Resumen general (socios, créditos, ahorros)
 * - Cartera de créditos (activa, vencida, mora)
 * - Rentabilidad (ingresos vs egresos)
 * - Indicadores de riesgo (morosidad, castigos)
 * - Proyecciones y tendencias
 *
 * @author Sistema MLF
 * @version 1.0.0
 */
/**
 * ============================================================================
 * INTERFACES
 * ============================================================================
 */
interface ResumenGeneral {
    socios: {
        total: number;
        activos: number;
        suspendidos: number;
        inactivos: number;
        nuevosEsteMes: number;
        porEtapa: {
            etapa1: number;
            etapa2: number;
            etapa3: number;
        };
    };
    creditos: {
        total: number;
        activos: number;
        completados: number;
        castigados: number;
        montoTotal: number;
        montoDesembolsado: number;
        saldoPendiente: number;
    };
    ahorros: {
        totalAhorrado: number;
        totalCongelado: number;
        ahorroPromedio: number;
        sociosConAhorro: number;
        aporteAdministrador: number;
    };
    garantias: {
        activas: number;
        ejecutadas: number;
        liberadas: number;
        montoCongelado: number;
    };
}
interface CarteraCreditos {
    carteraActiva: {
        montoTotal: number;
        cantidadCreditos: number;
        promedioMonto: number;
    };
    carteraVencida: {
        montoTotal: number;
        cantidadCreditos: number;
        porcentajeCartera: number;
    };
    clasificacionMora: {
        alDia: {
            cantidad: number;
            monto: number;
        };
        moraLeve: {
            cantidad: number;
            monto: number;
        };
        moraModerarda: {
            cantidad: number;
            monto: number;
        };
        moraGrave: {
            cantidad: number;
            monto: number;
        };
        moraPersistente: {
            cantidad: number;
            monto: number;
        };
        castigado: {
            cantidad: number;
            monto: number;
        };
    };
    porEtapa: {
        etapa1: {
            cantidad: number;
            monto: number;
        };
        etapa2: {
            cantidad: number;
            monto: number;
        };
        etapa3: {
            cantidad: number;
            monto: number;
        };
    };
}
interface Rentabilidad {
    ingresos: {
        interesesCobrados: number;
        morasCobradas: number;
        primasSeguro: number;
        total: number;
    };
    egresos: {
        utilidadesDistribuidas: number;
        fondoSeguroUtilizado: number;
        gastosOperativos: number;
        total: number;
    };
    utilidadNeta: number;
    margenRentabilidad: number;
    roi: number;
}
interface IndicadoresRiesgo {
    tasaMorosidad: number;
    indiceCarteraRiesgo: number;
    provisionRequerida: number;
    creditosProblema: number;
    garantiasInsuficientes: number;
    alertas: string[];
}
interface Proyecciones {
    proximosMeses: {
        mes: string;
        ingresoProyectado: number;
        egresoProyectado: number;
        utilidadProyectada: number;
    }[];
    metasVsReales: {
        metaIngresos: number;
        realIngresos: number;
        cumplimiento: number;
    };
}
interface DashboardCompleto {
    resumen: ResumenGeneral;
    cartera: CarteraCreditos;
    rentabilidad: Rentabilidad;
    indicadores: IndicadoresRiesgo;
    proyecciones: Proyecciones;
    fechaGeneracion: Date;
}
/**
 * ============================================================================
 * CLASE DASHBOARD SERVICE
 * ============================================================================
 */
declare class DashboardService {
    /**
     * Obtener dashboard completo con todas las métricas
     */
    obtenerDashboardCompleto(): Promise<DashboardCompleto>;
    /**
     * Resumen general de socios, créditos y ahorros
     */
    obtenerResumenGeneral(): Promise<ResumenGeneral>;
    /**
     * Cartera de créditos con clasificación
     */
    obtenerCarteraCreditos(): Promise<CarteraCreditos>;
    /**
     * Calcular rentabilidad (ingresos vs egresos)
     */
    calcularRentabilidad(): Promise<Rentabilidad>;
    /**
     * Calcular indicadores de riesgo
     */
    calcularIndicadoresRiesgo(): Promise<IndicadoresRiesgo>;
    /**
     * Generar proyecciones de los próximos meses
     */
    generarProyecciones(): Promise<Proyecciones>;
    /**
     * Obtener métricas específicas por período
     */
    obtenerMetricasPorPeriodo(fechaInicio: Date, fechaFin: Date): Promise<any>;
}
export declare const dashboardService: DashboardService;
export {};
//# sourceMappingURL=dashboard.service.d.ts.map