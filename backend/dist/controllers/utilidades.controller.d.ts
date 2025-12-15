/**
 * ============================================================================
 * Sistema MLF - Controlador de Utilidades
 * Archivo: src/controllers/utilidades.controller.ts
 * Descripción: Controladores para cálculo y distribución de utilidades
 * ============================================================================
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * POST /api/v1/utilidades/calcular
 * Calcular utilidades para un período semestral
 */
export declare const calcularUtilidades: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/utilidades/:id/distribuir
 * Distribuir (acreditar) utilidades calculadas
 */
export declare const distribuirUtilidades: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/utilidades/:id
 * Obtener utilidad por ID con detalles
 */
export declare const obtenerUtilidad: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/utilidades
 * Listar utilidades con filtros
 */
export declare const listarUtilidades: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/utilidades/socio/:socioId/historial
 * Obtener historial de utilidades de un socio
 */
export declare const obtenerHistorialUtilidades: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=utilidades.controller.d.ts.map