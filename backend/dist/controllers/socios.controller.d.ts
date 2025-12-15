/**
 * ============================================================================
 * Sistema MLF - Controlador de Socios
 * Archivo: src/controllers/socios.controller.ts
 * Descripción: Controladores para endpoints de gestión de socios
 * ============================================================================
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * POST /api/v1/socios
 * Crear nuevo socio
 */
export declare const crearSocio: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/socios/:id
 * Obtener socio por ID
 */
export declare const obtenerSocio: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/socios/codigo/:codigo
 * Obtener socio por código
 */
export declare const obtenerSocioPorCodigo: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/socios
 * Listar socios con filtros y paginación
 */
export declare const listarSocios: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PUT /api/v1/socios/:id
 * Actualizar información del socio
 */
export declare const actualizarSocio: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/socios/:id/depositar
 * Depositar ahorro
 */
export declare const depositarAhorro: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/socios/:id/retirar
 * Retirar ahorro
 */
export declare const retirarAhorro: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/socios/:id/cambiar-etapa
 * Cambiar etapa del socio (solo ADMIN)
 */
export declare const cambiarEtapa: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/socios/:id/suspender
 * Suspender socio (solo ADMIN)
 */
export declare const suspenderSocio: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/socios/:id/reactivar
 * Reactivar socio (solo ADMIN)
 */
export declare const reactivarSocio: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/socios/:id/historial-transacciones
 * Obtener historial de transacciones del socio
 */
export declare const obtenerHistorialTransacciones: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=socios.controller.d.ts.map