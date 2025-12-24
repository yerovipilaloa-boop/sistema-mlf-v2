/**
 * ============================================================================
 * Sistema MLF - Servicio de Gestión de Créditos
 * Archivo: src/services/creditos.service.ts
 * Descripción: Lógica de negocio para gestión del ciclo completo de créditos
 * ============================================================================
 */
import { EstadoCredito } from '@prisma/client';
import { SolicitarCreditoDTO, TablaAmortizacion } from '../types';
interface AprobarCreditoDTO {
    creditoId: number;
    aprobadoPorId: number;
    observaciones?: string;
}
interface DesembolsarCreditoDTO {
    creditoId: number;
    desembolsadoPorId?: number;
    fechaDesembolso?: Date;
    tasaInteresAnual?: number;
    observaciones?: string;
}
interface RechazarCreditoDTO {
    creditoId: number;
    rechazadoPorId: number;
    motivoRechazo: string;
}
declare class CreditosService {
    /**
     * Solicitar nuevo crédito
     * Implementa RN-CRE-001 a RN-CRE-008
     */
    solicitarCredito(data: SolicitarCreditoDTO, usuarioId?: number): Promise<any>;
    /**
     * Aprobar crédito
     * Cambia estado a APROBADO y genera tabla de amortización
     */
    aprobarCredito(data: AprobarCreditoDTO): Promise<any>;
    /**
     * Actualizar crédito (solo SOLICITADO)
     */
    actualizarCredito(id: number, data: any, usuarioId?: number): Promise<any>;
    /**
     * Desembolsar crédito
     * Genera tabla de amortización y crea cuotas en la BD
     * Implementa RN-CRE-004
     */
    desembolsarCredito(data: DesembolsarCreditoDTO): Promise<any>;
    /**
     * Rechazar crédito
     */
    rechazarCredito(data: RechazarCreditoDTO): Promise<any>;
    /**
     * Obtener crédito por ID con información completa
     */
    obtenerCreditoPorId(id: number): Promise<any>;
    /**
     * Listar créditos con filtros
     */
    listarCreditos(filtros: {
        page?: number;
        limit?: number;
        socioId?: number;
        estado?: EstadoCredito;
        busqueda?: string;
    }): Promise<{
        creditos: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * Obtener tabla de amortización de un crédito
     */
    obtenerTablaAmortizacion(creditoId: number): Promise<TablaAmortizacion>;
    /**
     * Calcular límite de crédito disponible para un socio
     * Implementa RN-CRE-002, RN-ETA-004
     */
    private calcularLimiteDisponible;
    /**
     * Calcular suma de créditos activos de un socio
     */
    private calcularSumaCreditosActivos;
    private generarCodigoCredito;
    /**
     * Generar código único para garantía
     * Formato: GAR-XXXX (secuencial)
     */
    private generarCodigoGarantia;
    private obtenerConfiguracion;
}
declare const _default: CreditosService;
export default _default;
//# sourceMappingURL=creditos.service.d.ts.map