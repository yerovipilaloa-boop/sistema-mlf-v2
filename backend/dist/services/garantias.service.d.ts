/**
 * ============================================================================
 * Sistema MLF - Servicio de Garantías
 * Archivo: src/services/garantias.service.ts
 * Descripción: Gestión del sistema de garantías cruzadas
 * ============================================================================
 *
 * REGLAS DE NEGOCIO IMPLEMENTADAS:
 * RN-GAR-001: Sistema de garantías cruzadas entre socios
 * RN-GAR-002: Cada crédito requiere 2 garantes (Etapa 3 ACTIVO)
 * RN-GAR-003: Solo Socios Especiales (Etapa 3) pueden ser garantes
 * RN-GAR-004: Se congela 10% del monto del crédito en ahorro del garante
 * RN-GAR-005: Máximo 3 garantizados activos por garante
 * RN-GAR-006: Liberación al 50% del crédito con comportamiento excelente
 * RN-GAR-007: Liberación requiere aprobación administrativa
 * RN-GAR-008: Ejecución automática al día 91 de mora
 */
import { EstadoGarantia } from '../types';
interface CrearGarantiasDTO {
    creditoId: number;
    garantesIds: number[];
}
interface SolicitarLiberacionDTO {
    garantiaId: number;
    motivoSolicitud: string;
}
interface AprobarLiberacionDTO {
    liberacionId: number;
    observaciones?: string;
}
interface RechazarLiberacionDTO {
    liberacionId: number;
    motivoRechazo: string;
}
interface EjecutarGarantiaDTO {
    garantiaId: number;
    motivoEjecucion: string;
}
declare class GarantiasService {
    /**
     * Crear garantías para un crédito (requiere 2 garantes)
     * Implementa: RN-GAR-002
     */
    crearGarantias(data: CrearGarantiasDTO, usuarioId?: number): Promise<any[]>;
    /**
     * Crear una garantía individual
     * Implementa: RN-GAR-003, RN-GAR-004, RN-GAR-005
     */
    private crearGarantia;
    /**
     * Validar elegibilidad de un socio para ser garante
     * Implementa: RN-GAR-003, RN-GAR-004, RN-GAR-005
     */
    private validarElegibilidadGarante;
    /**
     * Solicitar liberación de garantía
     * Implementa: RN-GAR-006
     */
    solicitarLiberacion(data: SolicitarLiberacionDTO, usuarioId?: number): Promise<any>;
    /**
     * Aprobar liberación de garantía
     * Implementa: RN-GAR-007
     */
    aprobarLiberacion(data: AprobarLiberacionDTO, usuarioId?: number): Promise<any>;
    /**
     * Rechazar liberación de garantía
     * Implementa: RN-GAR-007
     */
    rechazarLiberacion(data: RechazarLiberacionDTO, usuarioId?: number): Promise<any>;
    /**
     * Ejecutar garantía (cuando mora llega a 90+ días)
     * Implementa: RN-GAR-008
     */
    ejecutarGarantia(data: EjecutarGarantiaDTO, usuarioId?: number): Promise<any>;
    /**
     * Obtener garantía por ID
     */
    obtenerGarantiaPorId(garantiaId: number): Promise<any>;
    /**
     * Listar garantías con filtros
     */
    listarGarantias(filtros: {
        page: number;
        limit: number;
        garanteId?: number;
        creditoId?: number;
        estado?: EstadoGarantia;
    }): Promise<any>;
    /**
     * Obtener configuración del sistema
     */
    private obtenerConfiguracion;
}
declare const _default: GarantiasService;
export default _default;
//# sourceMappingURL=garantias.service.d.ts.map