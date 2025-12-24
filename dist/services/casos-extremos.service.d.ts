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
export declare enum TipoCasoExtremo {
    FALLECIMIENTO_DEUDOR = "FALLECIMIENTO_DEUDOR",
    FALLECIMIENTO_GARANTE = "FALLECIMIENTO_GARANTE",
    FRAUDE_DETECTADO = "FRAUDE_DETECTADO",
    REFINANCIAMIENTO = "REFINANCIAMIENTO",
    CONDONACION = "CONDONACION",
    CATASTROFE_NATURAL = "CATASTROFE_NATURAL"
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
    nuevoPlazoMeses?: number;
    nuevaTasaInteres?: number;
    nuevaTasaAnual?: number;
    porcentajeQuita?: number;
    motivoRefinanciamiento?: string;
    motivoRefinanciacion?: string;
    quitas?: number;
    requiereAprobacion?: boolean;
}
interface CondonarDeudaDTO {
    creditoId: number;
    montoCondonado?: number;
    porcentajeCondonacion?: number;
    motivo: string;
    autorizadoPor: number | string;
}
declare class CasosExtremosService {
    /**
     * Procesar fallecimiento de socio deudor
     * Se ejecuta el seguro de vida (1% prima) para cubrir deuda
     */
    procesarFallecimientoDeudor(data: ProcesarFallecimientoDeudorDTO, usuarioId?: number): Promise<any>;
    /**
     * Procesar fallecimiento de garante
     * Se liberan garantías y se buscan nuevos garantes
     */
    procesarFallecimientoGarante(data: ProcesarFallecimientoGaranteDTO, usuarioId?: number): Promise<any>;
    /**
     * Detectar y marcar posible fraude
     */
    detectarFraude(data: DetectarFraudeDTO, usuarioId?: number): Promise<any>;
    /**
     * Refinanciar crédito
     */
    refinanciarCredito(data: RefinanciarCreditoDTO, usuarioId?: number): Promise<any>;
    /**
     * Condonar deuda (casos excepcionales)
     */
    condonarDeuda(data: CondonarDeudaDTO, usuarioId?: number): Promise<any>;
    /**
     * Procesar catástrofe natural (suspensión masiva de pagos)
     */
    procesarCatastrofe(descripcion: string, sociosAfectados: number[], mesesGracia: number, usuarioId?: number): Promise<any>;
}
declare const _default: CasosExtremosService;
export default _default;
//# sourceMappingURL=casos-extremos.service.d.ts.map