/**
 * ============================================================================
 * Sistema MLF - Controlador de Garantías
 * Archivo: src/controllers/garantias.controller.ts
 * Descripción: Controladores para endpoints de garantías cruzadas
 * ============================================================================
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * POST /api/v1/garantias
 * Crear garantías para un crédito (requiere 2 garantes)
 */
export declare const crearGarantias: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/garantias/:id
 * Obtener garantía por ID
 */
export declare const obtenerGarantia: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/garantias
 * Listar garantías con filtros y paginación
 */
export declare const listarGarantias: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/garantias/:id/solicitar-liberacion
 * Solicitar liberación de garantía
 */
export declare const solicitarLiberacion: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/garantias/liberaciones/:id/aprobar
 * Aprobar solicitud de liberación
 */
export declare const aprobarLiberacion: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/garantias/liberaciones/:id/rechazar
 * Rechazar solicitud de liberación
 */
export declare const rechazarLiberacion: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/garantias/:id/ejecutar
 * Ejecutar garantía (mora 90+ días)
 */
export declare const ejecutarGarantia: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=garantias.controller.d.ts.map