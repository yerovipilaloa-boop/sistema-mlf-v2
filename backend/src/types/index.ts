/**
 * ============================================================================
 * Sistema MLF - Tipos TypeScript Globales
 * Archivo: src/types/index.ts
 * Descripción: Definiciones de tipos reutilizables en toda la aplicación
 * ============================================================================
 */

import { Request } from 'express';

// ============================================================================
// ENUMS
// ============================================================================

export enum EstadoSocio {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  EXPULSADO = 'EXPULSADO',
}

export enum RolSocio {
  ADMIN = 'ADMIN',
  OPERADOR = 'OPERADOR',
  SOCIO = 'SOCIO',
}

export enum EtapaSocio {
  INICIANTE = 1,
  REGULAR = 2,
  ESPECIAL = 3,
}

export enum EstadoCredito {
  SOLICITADO = 'SOLICITADO',
  EN_REVISION = 'EN_REVISION',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  DESEMBOLSADO = 'DESEMBOLSADO',
  ACTIVO = 'ACTIVO',
  COMPLETADO = 'COMPLETADO',
  CASTIGADO = 'CASTIGADO',
}

export enum MetodoAmortizacion {
  FRANCES = 'FRANCES',
  ALEMAN = 'ALEMAN',
}

export enum EstadoCuota {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  VENCIDA = 'VENCIDA',
  PARCIALMENTE_PAGADA = 'PARCIALMENTE_PAGADA',
}

export enum ClasificacionMora {
  MORA_LEVE = 'MORA_LEVE',              // 1-15 días
  MORA_MODERADA = 'MORA_MODERADA',      // 16-30 días
  MORA_GRAVE = 'MORA_GRAVE',            // 31-60 días
  MORA_PERSISTENTE = 'MORA_PERSISTENTE', // 61-89 días
  CASTIGADO = 'CASTIGADO',              // 90+ días
}

export enum EstadoGarantia {
  PENDIENTE = 'PENDIENTE',
  ACTIVA = 'ACTIVA',
  EN_LIBERACION = 'EN_LIBERACION',
  LIBERADA = 'LIBERADA',
  EJECUTADA = 'EJECUTADA',
  CANCELADA = 'CANCELADA',
}

export enum EstadoLiberacionGarantia {
  SOLICITADA = 'SOLICITADA',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  PROCESADA = 'PROCESADA',
}

export enum TipoTransaccion {
  DEPOSITO = 'DEPOSITO',
  RETIRO = 'RETIRO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  UTILIDAD = 'UTILIDAD',
  DESEMBOLSO = 'DESEMBOLSO',
  CONGELAMIENTO = 'CONGELAMIENTO',
  DESCONGELAMIENTO = 'DESCONGELAMIENTO',
}

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  DEPOSITO = 'DEPOSITO',
  OTRO = 'OTRO',
}

export enum TipoNotificacion {
  BIENVENIDA = 'BIENVENIDA',
  CREDITO_APROBADO = 'CREDITO_APROBADO',
  CREDITO_RECHAZADO = 'CREDITO_RECHAZADO',
  CUOTA_PROXIMA = 'CUOTA_PROXIMA',
  CUOTA_VENCIDA = 'CUOTA_VENCIDA',
  MORA_LEVE = 'MORA_LEVE',
  MORA_GRAVE = 'MORA_GRAVE',
  GARANTIA_CONGELADA = 'GARANTIA_CONGELADA',
  GARANTIA_LIBERADA = 'GARANTIA_LIBERADA',
  GARANTIA_EJECUTADA = 'GARANTIA_EJECUTADA',
  UTILIDAD_ACREDITADA = 'UTILIDAD_ACREDITADA',
  CAMBIO_ETAPA = 'CAMBIO_ETAPA',
  ALERTA_SISTEMA = 'ALERTA_SISTEMA',
}

export enum CanalNotificacion {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  SISTEMA = 'SISTEMA',
  PUSH = 'PUSH',
}

export enum EstadoNotificacion {
  PENDIENTE = 'PENDIENTE',
  ENVIADA = 'ENVIADA',
  ENTREGADA = 'ENTREGADA',
  FALLIDA = 'FALLIDA',
  CANCELADA = 'CANCELADA',
}

// ============================================================================
// INTERFACES DE REQUEST
// ============================================================================

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

// ============================================================================
// INTERFACES DE RESPUESTA API
// ============================================================================

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

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CrearSocioDTO {
  nombreCompleto: string;
  documentoIdentidad: string;
  fechaNacimiento: Date;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  depositoInicial: number;
  recomendadores: number[]; // IDs de socios recomendadores
  usuario: string;
  password: string;
  etapaActual?: number; // Etapa inicial (opcional, por defecto 1)
}

export interface SolicitarCreditoDTO {
  socioId: number;
  montoSolicitado: number;
  plazoMeses: number;
  metodoAmortizacion: MetodoAmortizacion;
  tasaInteresAnual?: number; // Tasa de interés anual (ej: 18 para 18%)
  observaciones?: string;
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

// ============================================================================
// INTERFACES DE CÁLCULOS
// ============================================================================

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

// ============================================================================
// INTERFACES DE AUDITORÍA
// ============================================================================

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

// ============================================================================
// INTERFACES DE REGLAS DE NEGOCIO
// ============================================================================

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

// ============================================================================
// CONSTANTES DE REGLAS DE NEGOCIO
// ============================================================================

export const REGLAS_ETAPAS: ReglasEtapa[] = [
  {
    etapa: EtapaSocio.INICIANTE,
    multiplicadorMinimo: 1.25,
    multiplicadorMaximo: 2.00,
    creditosParaProgresion: 3,
  },
  {
    etapa: EtapaSocio.REGULAR,
    multiplicadorMinimo: 2.00,
    multiplicadorMaximo: 2.00,
    creditosParaProgresion: 5,
  },
  {
    etapa: EtapaSocio.ESPECIAL,
    multiplicadorMinimo: 3.00,
    multiplicadorMaximo: 3.00,
  },
];

export const DIAS_MORA: Record<ClasificacionMora, { min: number; max: number }> = {
  [ClasificacionMora.MORA_LEVE]: { min: 1, max: 15 },
  [ClasificacionMora.MORA_MODERADA]: { min: 16, max: 30 },
  [ClasificacionMora.MORA_GRAVE]: { min: 31, max: 60 },
  [ClasificacionMora.MORA_PERSISTENTE]: { min: 61, max: 89 },
  [ClasificacionMora.CASTIGADO]: { min: 90, max: Infinity },
};
