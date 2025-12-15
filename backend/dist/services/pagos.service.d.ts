/**
 * ============================================================================
 * Sistema MLF - Servicio de Pagos y Morosidad
 * Archivo: src/services/pagos.service.ts
 * Descripción: Gestión de pagos, morosidad y aplicación de abonos
 * ============================================================================
 *
 * REGLAS DE NEGOCIO IMPLEMENTADAS:
 * RN-PAG-001: Distribución de pagos (Mora → Interés → Capital → Prepago)
 * RN-PAG-002: Actualización automática de estado de cuotas
 * RN-MOR-001: Cálculo de mora (1% diario sobre cuota vencida)
 * RN-MOR-002: Clasificación de morosidad (5 niveles)
 * RN-MOR-003: Cambio de tasa al castigar (1.5% → 3%)
 * RN-CRE-003: Bloqueo de nuevos créditos con mora activa
 * RN-GAR-008: Ejecución de garantías al día 91
 */
import { MetodoPago } from '../types';
interface RegistrarPagoDTO {
    creditoId: number;
    montoPagado: number;
    metodoPago: MetodoPago;
    numeroReferencia?: string;
    concepto?: string;
    fechaPago?: Date;
}
declare class PagosService {
    /**
     * Registrar pago a un crédito
     * El pago se distribuye automáticamente entre cuotas vencidas/pendientes
     * Implementa: RN-PAG-001, RN-PAG-002
     */
    registrarPago(data: RegistrarPagoDTO, usuarioId?: number): Promise<any>;
    /**
     * Distribuir pago entre cuotas pendientes y vencidas
     * Implementa: RN-PAG-001 (Mora → Interés → Capital)
     */
    private distribuirPago;
    /**
     * Aplicar pago a una cuota específica
     * Implementa: RN-PAG-001 (distribución Mora → Interés → Capital)
     */
    private aplicarPagoACuota;
    /**
     * Determinar nuevo estado de cuota después de pago
     * CORREGIDO: Ahora considera tolerancia para evitar problemas de redondeo
     */
    private determinarEstadoCuota;
    /**
     * Calcular monto total adeudado de una cuota
     */
    private calcularMontoAdeudadoCuota;
    /**
     * Actualizar mora de todas las cuotas vencidas de un crédito
     * Implementa: RN-MOR-001, RN-MOR-002
     */
    actualizarMoraCredito(creditoId: number): Promise<void>;
    /**
     * Actualizar mora de una cuota específica
     * Implementa: RN-MOR-001 (1% diario sobre saldo adeudado)
     */
    private actualizarMoraCuota;
    /**
     * Actualizar o crear registro de mora del socio
     * Implementa: RN-MOR-002 (clasificación de morosidad)
     */
    private actualizarRegistroMoraSocio;
    /**
     * Clasificar morosidad según días de atraso
     * Implementa: RN-MOR-002
     */
    private clasificarMora;
    /**
     * Castigar crédito (90+ días de mora)
     * Implementa: RN-MOR-003
     */
    private castigarCredito;
    /**
     * Verificar si el crédito se completó
     */
    private verificarCompletitudCredito;
    /**
     * Obtener estado de pagos de un crédito
     */
    obtenerEstadoPagos(creditoId: number): Promise<any>;
    /**
     * Obtener pagos recientes del sistema
     */
    obtenerPagosRecientes(limite?: number): Promise<any>;
    /**
     * Obtener configuración del sistema
     */
    private obtenerConfiguracion;
    /**
     * Generar código único para pago
     * Formato: PAG-CREXXXX-NNN
     * Ejemplo: PAG-CRE0001-001
     */
    private generarCodigoPago;
    /**
     * Obtener pago por ID
     */
    obtenerPago(id: number): Promise<any>;
    /**
     * Actualizar pago (solo dentro de 7 días)
     * Nota: Por ahora solo permite editar datos descriptivos, no el monto
     */
    actualizarPago(id: number, data: any, usuarioId?: number): Promise<any>;
}
declare const _default: PagosService;
export default _default;
//# sourceMappingURL=pagos.service.d.ts.map