/**
 * ============================================================================
 * Sistema MLF - Servicio de Gestión de Socios
 * Archivo: src/services/socios.service.ts
 * Descripción: Lógica de negocio para gestión de socios
 * ============================================================================
 */
import { CrearSocioDTO, EstadoSocio, EtapaSocio } from '../types';
interface ActualizarSocioDTO {
    nombreCompleto?: string;
    direccion?: string;
    ciudad?: string;
    telefono?: string;
    email?: string;
    documentoIdentidad?: string;
    fechaNacimiento?: Date | string;
    estado?: EstadoSocio;
    usuario?: string;
    password?: string;
    etapaActual?: number;
}
interface DepositoRetiroDTO {
    socioId: number;
    monto: number;
    metodo: string;
    numeroReferencia?: string;
    concepto?: string;
}
interface CambiarEtapaDTO {
    socioId: number;
    nuevaEtapa: EtapaSocio;
    motivoAdministrativo?: string;
}
declare class SociosService {
    /**
     * Crear nuevo socio
     * Implementa RN-SOC-001 a RN-SOC-008
     */
    crearSocio(data: CrearSocioDTO, creadorId?: number): Promise<any>;
    /**
     * Obtener socio por ID
     */
    obtenerSocioPorId(id: number): Promise<any>;
    /**
     * Obtener socio por código
     */
    obtenerSocioPorCodigo(codigo: string): Promise<any>;
    /**
     * Listar socios con filtros y paginación
     */
    listarSocios(filtros: {
        page?: number;
        limit?: number;
        estado?: EstadoSocio;
        etapa?: EtapaSocio;
        busqueda?: string;
    }): Promise<{
        socios: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * Actualizar información del socio
     */
    actualizarSocio(id: number, data: ActualizarSocioDTO, usuarioId?: number): Promise<any>;
    /**
     * Depositar ahorro
     * Implementa RN-AHO-001
     */
    depositarAhorro(data: DepositoRetiroDTO, usuarioId?: number): Promise<any>;
    /**
     * Retirar ahorro
     * Implementa RN-AHO-002, RN-AHO-003
     */
    retirarAhorro(data: DepositoRetiroDTO, usuarioId?: number): Promise<any>;
    /**
     * Cambiar etapa del socio (manual por administrador)
     */
    cambiarEtapa(data: CambiarEtapaDTO, usuarioId?: number): Promise<any>;
    /**
     * Suspender socio
     */
    suspenderSocio(socioId: number, motivo: string, usuarioId?: number): Promise<any>;
    /**
     * Reactivar socio
     */
    reactivarSocio(socioId: number, usuarioId?: number): Promise<any>;
    private generarCodigoSocio;
    private generarCodigoTransaccion;
    private formatearSocio;
    private obtenerConfiguracion;
    /**
     * Obtener historial de transacciones de un socio
     */
    obtenerHistorialTransacciones(socioId: number, page?: number, limit?: number): Promise<{
        transacciones: any[];
        total: number;
        page: number;
        limit: number;
    }>;
}
declare const _default: SociosService;
export default _default;
//# sourceMappingURL=socios.service.d.ts.map