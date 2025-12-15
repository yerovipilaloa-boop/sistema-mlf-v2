/**
 * ============================================================================
 * Sistema MLF - Servicio de Utilidades
 * Archivo: src/services/utilidades.service.ts
 * Descripción: Cálculo y distribución semestral de utilidades
 * ============================================================================
 *
 * REGLAS DE NEGOCIO IMPLEMENTADAS:
 * RN-UTI-001: Distribución semestral de utilidades (Enero-Junio / Julio-Diciembre)
 * RN-UTI-002: Cálculo: 1% sobre ahorro promedio del semestre
 * RN-UTI-003: Solo socios ACTIVOS participan de la distribución
 * RN-UTI-004: Utilidades se acreditan automáticamente al ahorro
 */
interface CalcularUtilidadesDTO {
    año: number;
    semestre: 1 | 2;
}
interface DistribuirUtilidadesDTO {
    utilidadId: number;
}
interface DetalleUtilidadSocio {
    socioId: number;
    nombreCompleto: string;
    ahorroPromedioSemestre: number;
    montoUtilidad: number;
    etapa: number;
}
interface ResumenUtilidades {
    codigo: string;
    periodo: string;
    totalSocios: number;
    totalAhorrosPromedio: number;
    totalUtilidades: number;
    estado: string;
    detalles: DetalleUtilidadSocio[];
}
declare class UtilidadesService {
    /**
     * Calcular utilidades para un período semestral
     * Implementa: RN-UTI-001, RN-UTI-002, RN-UTI-003
     */
    calcularUtilidades(data: CalcularUtilidadesDTO, usuarioId?: number): Promise<ResumenUtilidades>;
    /**
     * Distribuir (acreditar) utilidades calculadas a los ahorros de socios
     * Implementa: RN-UTI-004
     */
    distribuirUtilidades(data: DistribuirUtilidadesDTO, usuarioId?: number): Promise<any>;
    /**
     * Calcular ahorro promedio de un socio durante el semestre
     * Promedio del saldo al final de cada mes
     * Implementa: RN-UTI-002
     */
    private calcularAhorroPromedioSemestre;
    /**
     * Calcular saldo de ahorro al final de un mes específico
     */
    private calcularSaldoAlFinalDeMes;
    /**
     * Obtener utilidad por ID
     */
    obtenerUtilidadPorId(utilidadId: number): Promise<any>;
    /**
     * Listar utilidades con filtros
     */
    listarUtilidades(filtros: {
        page: number;
        limit: number;
        año?: number;
        semestre?: number;
        estado?: string;
    }): Promise<any>;
    /**
     * Obtener historial de utilidades de un socio
     */
    obtenerHistorialUtilidades(socioId: number): Promise<any>;
    /**
     * Validar período
     */
    private validarPeriodo;
    /**
     * Obtener fechas de inicio y fin del período semestral
     */
    private obtenerFechasPeriodo;
    /**
     * Obtener array de meses del período
     */
    private obtenerMesesPeriodo;
    /**
     * Generar código de utilidad
     */
    private generarCodigoUtilidad;
    /**
     * Generar código de transacción
     */
    private generarCodigoTransaccion;
    /**
     * Obtener configuración del sistema
     */
    private obtenerConfiguracion;
}
declare const _default: UtilidadesService;
export default _default;
//# sourceMappingURL=utilidades.service.d.ts.map