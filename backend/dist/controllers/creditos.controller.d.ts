/**
 * ============================================================================
 * Sistema MLF - Controlador de Créditos
 * Archivo: src/controllers/creditos.controller.ts
 * Descripción: Controladores para endpoints de gestión de créditos
 * ============================================================================
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * POST /api/v1/creditos
 * Solicitar nuevo crédito
 */
export declare const solicitarCredito: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/creditos/:id/aprobar
 * Aprobar solicitud de crédito
 */
export declare const aprobarCredito: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/creditos/:id/desembolsar
 * Desembolsar crédito aprobado
 */
export declare const desembolsarCredito: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/creditos/:id/rechazar
 * Rechazar solicitud de crédito
 */
export declare const rechazarCredito: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/creditos/:id
 * Obtener crédito por ID
 */
export declare const obtenerCredito: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/creditos
 * Listar créditos con filtros y paginación
 */
export declare const listarCreditos: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PUT /api/v1/creditos/:id
 * Actualizar crédito (solo SOLICITADO)
 */
export declare const actualizarCredito: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/creditos/:id/amortizacion
 * Obtener tabla de amortización del crédito
 */
export declare const obtenerTablaAmortizacion: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/creditos/:id/estado-cuenta
 * Obtener estado de cuenta del crédito
 */
export declare const obtenerEstadoCuenta: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=creditos.controller.d.ts.map