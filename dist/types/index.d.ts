/**
 * ============================================================================
 * Sistema MLF - Tipos TypeScript Globales
 * Archivo: src/types/index.ts
 * Descripción: Definiciones de tipos reutilizables en toda la aplicación
 * ============================================================================
 */
import { Request } from 'express';
export declare enum EstadoSocio {
    ACTIVO = "ACTIVO",
    INACTIVO = "INACTIVO",
    EXPULSADO = "EXPULSADO"
}
export declare enum RolSocio {
    SOCIO = "SOCIO",
    TESORERO = "TESORERO",
    ADMIN = "ADMIN"
}
export declare enum EtapaSocio {
    INICIANTE = 1,
    REGULAR = 2,
    ESPECIAL = 3
}
export declare enum EstadoCredito {
    SOLICITADO = "SOLICITADO",
    EN_REVISION = "EN_REVISION",
    APROBADO = "APROBADO",
    RECHAZADO = "RECHAZADO",
    DESEMBOLSADO = "DESEMBOLSADO",
    ACTIVO = "ACTIVO",
    COMPLETADO = "COMPLETADO",
    CASTIGADO = "CASTIGADO"
}
export declare enum MetodoAmortizacion {
    FRANCES = "FRANCES",
    ALEMAN = "ALEMAN"
}
export declare enum EstadoCuota {
    PENDIENTE = "PENDIENTE",
    PAGADA = "PAGADA",
    VENCIDA = "VENCIDA",
    PARCIALMENTE_PAGADA = "PARCIALMENTE_PAGADA"
}
export declare enum ClasificacionMora {
    MORA_LEVE = "MORA_LEVE",// 1-15 días
    MORA_MODERADA = "MORA_MODERADA",// 16-30 días
    MORA_GRAVE = "MORA_GRAVE",// 31-60 días
    MORA_PERSISTENTE = "MORA_PERSISTENTE",// 61-89 días
    CASTIGADO = "CASTIGADO"
}
export declare enum EstadoGarantia {
    PENDIENTE = "PENDIENTE",
    ACTIVA = "ACTIVA",
    EJECUTADA = "EJECUTADA",
    LIBERADA = "LIBERADA"
}
export declare enum EstadoLiberacionGarantia {
    SOLICITADA = "SOLICITADA",
    APROBADA = "APROBADA",
    RECHAZADA = "RECHAZADA",
    PROCESADA = "PROCESADA"
}
export declare enum TipoTransaccion {
    DEPOSITO = "DEPOSITO",
    RETIRO = "RETIRO",
    TRANSFERENCIA = "TRANSFERENCIA",
    UTILIDAD = "UTILIDAD",
    DESEMBOLSO = "DESEMBOLSO",
    CONGELAMIENTO = "CONGELAMIENTO",
    DESCONGELAMIENTO = "DESCONGELAMIENTO",
    DEPOSITO_AHORRO = "DEPOSITO_AHORRO",
    RETIRO_AHORRO = "RETIRO_AHORRO",
    DEPOSITO_INICIAL = "DEPOSITO_INICIAL"
}
export declare enum MetodoPago {
    EFECTIVO = "EFECTIVO",
    TRANSFERENCIA = "TRANSFERENCIA",
    DEPOSITO = "DEPOSITO",
    OTRO = "OTRO"
}
export declare enum TipoNotificacion {
    BIENVENIDA = "BIENVENIDA",
    CREDITO_APROBADO = "CREDITO_APROBADO",
    CREDITO_RECHAZADO = "CREDITO_RECHAZADO",
    CUOTA_PROXIMA = "CUOTA_PROXIMA",
    CUOTA_VENCIDA = "CUOTA_VENCIDA",
    MORA_LEVE = "MORA_LEVE",
    MORA_GRAVE = "MORA_GRAVE",
    GARANTIA_CONGELADA = "GARANTIA_CONGELADA",
    GARANTIA_LIBERADA = "GARANTIA_LIBERADA",
    GARANTIA_EJECUTADA = "GARANTIA_EJECUTADA",
    UTILIDAD_ACREDITADA = "UTILIDAD_ACREDITADA",
    CAMBIO_ETAPA = "CAMBIO_ETAPA",
    ALERTA_SISTEMA = "ALERTA_SISTEMA"
}
export declare enum CanalNotificacion {
    EMAIL = "EMAIL",
    SMS = "SMS",
    WHATSAPP = "WHATSAPP",
    SISTEMA = "SISTEMA",
    PUSH = "PUSH"
}
export declare enum EstadoNotificacion {
    PENDIENTE = "PENDIENTE",
    ENVIADA = "ENVIADA",
    ENTREGADA = "ENTREGADA",
    FALLIDA = "FALLIDA",
    CANCELADA = "CANCELADA"
}
/**
 * Request extendido con información del usuario autenticado
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        codigo: string;
        email: string;
        rol: RolSocio;
        nombreCompleto: string;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: string;
}
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    timestamp: string;
}
export interface CrearSocioDTO {
    nombreCompleto: string;
    documentoIdentidad: string;
    fechaNacimiento: Date;
    direccion: string;
    ciudad: string;
    telefono: string;
    email: string;
    depositoInicial: number;
    recomendadores: number[];
    usuario: string;
    password: string;
    etapaActual?: number;
}
export interface SolicitarCreditoDTO {
    socioId: number;
    montoSolicitado: number;
    plazoMeses: number;
    metodoAmortizacion: MetodoAmortizacion;
    tasaInteresAnual?: number;
    observaciones?: string;
    garantesIds?: number[];
    proposito?: string;
}
export interface RegistrarPagoDTO {
    creditoId: number;
    montoPagado: number;
    metodoPago: MetodoPago;
    numeroReferencia?: string;
    observaciones?: string;
    esPrepago?: boolean;
}
export interface CrearGarantiaDTO {
    creditoId: number;
    garanteId: number;
    garantizadoId: number;
}
export interface SolicitarLiberacionGarantiaDTO {
    garantiaId: number;
    solicitadoPorId: number;
}
export interface CuotaAmortizacion {
    numeroCuota: number;
    fechaVencimiento: Date;
    montoCuota: number;
    capital: number;
    interes: number;
    saldoRestante: number;
}
export interface TablaAmortizacion {
    credito: {
        codigo: string;
        montoTotal: number;
        tasaInteres: number;
        plazoMeses: number;
        metodo: MetodoAmortizacion;
    };
    cuotas: CuotaAmortizacion[];
    resumen: {
        totalAPagar: number;
        totalCapital: number;
        totalIntereses: number;
    };
}
export interface CalculoUtilidades {
    periodo: string;
    fechaInicio: Date;
    fechaFin: Date;
    tasaUtilidad: number;
    totalAhorroPromedio: number;
    totalUtilidades: number;
    distribuciones: {
        socioId: number;
        socioNombre: string;
        ahorroPromedio: number;
        montoUtilidad: number;
    }[];
}
export interface AuditoriaLog {
    usuarioId?: number;
    usuarioEmail?: string;
    usuarioRol?: string;
    usuarioIp?: string;
    entidad: string;
    entidadId?: number;
    accion: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' | 'LEER' | 'LOGIN' | 'LOGOUT' | 'APROBAR' | 'RECHAZAR';
    descripcion: string;
    datosAnteriores?: any;
    datosNuevos?: any;
    exitosa: boolean;
    codigoError?: string;
    mensajeError?: string;
}
export interface ReglasEtapa {
    etapa: EtapaSocio;
    multiplicadorMinimo: number;
    multiplicadorMaximo: number;
    creditosParaProgresion?: number;
}
export interface ConfiguracionSistema {
    tasaInteresNormal: number;
    tasaInteresCastigo: number;
    tasaInteresMoraDiario: number;
    primaSeguro: number;
    porcentajeGarantiaCongelado: number;
    maximoGarantizados: number;
    ahorroMinimoActivo: number;
    diasMoraCastigo: number;
}
export declare const REGLAS_ETAPAS: ReglasEtapa[];
export declare const DIAS_MORA: Record<ClasificacionMora, {
    min: number;
    max: number;
}>;
//# sourceMappingURL=index.d.ts.map