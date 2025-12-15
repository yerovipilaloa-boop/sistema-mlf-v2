/**
 * ============================================================================
 * Sistema MLF - Servicio de Amortización
 * Archivo: src/services/amortization.service.ts
 * Descripción: Algoritmos de amortización Francés y Alemán
 * ============================================================================
 */
import { MetodoAmortizacion, CuotaAmortizacion, TablaAmortizacion } from '../types';
interface CalculoAmortizacionInput {
    montoTotal: number;
    tasaInteresMensual: number;
    plazoMeses: number;
    metodo: MetodoAmortizacion;
    fechaDesembolso: Date;
}
declare class AmortizationService {
    /**
     * Calcular tabla de amortización completa
     */
    calcularTablaAmortizacion(input: CalculoAmortizacionInput): TablaAmortizacion;
    /**
     * ========================================================================
     * MÉTODO FRANCÉS (Cuota Fija)
     * ========================================================================
     *
     * Características:
     * - Cuota mensual FIJA durante todo el período
     * - Intereses DECRECIENTES (se calculan sobre saldo restante)
     * - Capital CRECIENTE (diferencia entre cuota e interés)
     *
     * Fórmula de cuota:
     * C = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
     *
     * Donde:
     * - C = Cuota mensual
     * - P = Monto del préstamo
     * - i = Tasa de interés mensual (anual / 12 / 100)
     * - n = Número de cuotas
     *
     * Ejemplo: $1,000 al 18% anual (1.5% mensual) en 12 meses
     * - Cuota fija: $91.68
     * - Total intereses: $100.13
     * - Total a pagar: $1,100.13
     */
    private calcularMetodoFrances;
    /**
     * Calcular cuota fija del método francés
     * Fórmula: C = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
     */
    private calcularCuotaFrancesa;
    /**
     * ========================================================================
     * MÉTODO ALEMÁN (Capital Fijo)
     * ========================================================================
     *
     * Características:
     * - Capital FIJO en cada cuota (monto / plazo)
     * - Intereses DECRECIENTES (se calculan sobre saldo restante)
     * - Cuota total DECRECIENTE (capital fijo + interés decreciente)
     *
     * Fórmulas:
     * - Capital fijo = P / n
     * - Interés = Saldo restante * i
     * - Cuota = Capital fijo + Interés
     *
     * Donde:
     * - P = Monto del préstamo
     * - i = Tasa de interés mensual
     * - n = Número de cuotas
     *
     * Ejemplo: $1,000 al 18% anual (1.5% mensual) en 12 meses
     * - Capital fijo: $83.33
     * - Primera cuota: $98.33 (83.33 + 15.00)
     * - Última cuota: $84.58 (83.33 + 1.25)
     * - Total intereses: $97.50
     * - Total a pagar: $1,097.50
     */
    private calcularMetodoAleman;
    /**
     * Calcular fecha de vencimiento de una cuota
     * La primera cuota vence 1 mes después del desembolso
     * CORRECCIÓN: Preservar el día correcto evitando problemas de zona horaria
     * VERSIÓN: 2.0 - CORREGIDA
     */
    private calcularFechaVencimiento;
    /**
     * Redondear a 2 decimales
     */
    private redondear;
    /**
     * Calcular monto de pago para una cuota específica (con mora)
     */
    calcularMontoCuotaConMora(montoCuota: number, diasMora: number, tasaMoraDiaria: number): {
        montoCuota: number;
        intereseMora: number;
        montoTotal: number;
    };
    /**
     * Calcular distribución de pago según prioridad: Mora → Interés → Capital
     */
    distribuirPago(montoPagado: number, montoMoraAdeudado: number, montoInteresAdeudado: number, montoCapitalAdeudado: number): {
        aplicadoMora: number;
        aplicadoInteres: number;
        aplicadoCapital: number;
        sobrante: number;
    };
    /**
     * Calcular reducción de plazo por prepago de capital
     */
    calcularReduccionPlazoPorPrepago(cuotasRestantes: CuotaAmortizacion[], montoPrepago: number, tasaInteresMensual: number): {
        cuotasOriginales: number;
        cuotasNuevas: number;
        cuotasAhorradas: number;
        ahorroIntereses: number;
    };
    /**
     * Comparar métodos de amortización
     */
    compararMetodos(montoTotal: number, tasaInteresMensual: number, plazoMeses: number, fechaDesembolso: Date): {
        frances: TablaAmortizacion;
        aleman: TablaAmortizacion;
        comparacion: {
            diferenciaIntereses: number;
            diferenciaPrimeraCuota: number;
            diferenciaUltimaCuota: number;
            metodoRecomendado: MetodoAmortizacion;
            razonRecomendacion: string;
        };
    };
}
declare const _default: AmortizationService;
export default _default;
//# sourceMappingURL=amortization.service.d.ts.map