/**
 * ============================================================================
 * Sistema MLF - Controlador de Gastos Operativos
 * Archivo: src/controllers/gastos.controller.ts
 * ============================================================================
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * GET /api/v1/gastos
 * Obtener lista de gastos operativos
 */
export declare const obtenerGastos: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/gastos
 * Registrar nuevo gasto operativo
 */
export declare const registrarGasto: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /api/v1/gastos/:id
 * Eliminar gasto operativo
 */
export declare const eliminarGasto: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/gastos/categorias
 * Obtener lista de categorías de gastos
 */
export declare const obtenerCategorias: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=gastos.controller.d.ts.map