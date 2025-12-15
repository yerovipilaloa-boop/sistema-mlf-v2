/**
 * ============================================================================
 * Sistema MLF - Controlador de Pagos
 * Archivo: src/controllers/pagos.controller.ts
 * Descripción: Controladores para endpoints de pagos y morosidad
 * ============================================================================
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * POST /api/v1/pagos
 * Registrar pago a un crédito
 */
export declare const registrarPago: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/pagos/credito/:creditoId
 * Obtener estado de pagos de un crédito
 */
export declare const obtenerEstadoPagos: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/pagos/credito/:creditoId/actualizar-mora
 * Actualizar mora de un crédito
 */
export declare const actualizarMora: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/pagos/recientes
 * Obtener pagos recientes del sistema
 */
export declare const obtenerPagosRecientes: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/pagos/:id
 * Obtener pago por ID
 */
export declare const obtenerPago: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PUT /api/v1/pagos/:id
 * Actualizar pago (solo dentro de 7 días)
 */
export declare const actualizarPago: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=pagos.controller.d.ts.map