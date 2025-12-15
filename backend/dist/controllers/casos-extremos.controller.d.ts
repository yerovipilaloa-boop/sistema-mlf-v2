/**
 * ============================================================================
 * Controller: Casos Extremos
 * ============================================================================
 * Maneja situaciones excepcionales: fallecimientos, fraude, catástrofes
 *
 * Endpoints:
 * 1. POST /casos-extremos/fallecimiento-deudor - Procesar fallecimiento deudor
 * 2. POST /casos-extremos/fallecimiento-garante - Procesar fallecimiento garante
 * 3. POST /casos-extremos/fraude - Detectar y registrar fraude
 * 4. POST /casos-extremos/refinanciar - Refinanciar crédito
 * 5. POST /casos-extremos/condonar - Condonar deuda
 * 6. POST /casos-extremos/catastrofe - Procesar catástrofe natural
 * 7. GET /casos-extremos/historial/:socioId - Historial de casos extremos
 *
 * @author Sistema MLF
 * @version 1.0.0
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
/**
 * Procesar fallecimiento de deudor
 * Aplica seguro de vida y ejecuta garantías si es necesario
 */
export declare const procesarFallecimientoDeudor: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Procesar fallecimiento de garante
 * Libera garantías y marca créditos que requieren nuevos garantes
 */
export declare const procesarFallecimientoGarante: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Detectar y registrar fraude
 * Suspende al socio inmediatamente y registra evidencias
 */
export declare const detectarFraude: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Refinanciar crédito
 * Reestructura crédito con nuevo plazo y/o tasa, opcionalmente con quita
 */
export declare const refinanciarCredito: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Condonar deuda
 * Condonación administrativa de deuda (requiere autorización)
 */
export declare const condonarDeuda: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Procesar catástrofe natural
 * Suspende pagos masivamente y registra afectados
 */
export declare const procesarCatastrofe: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Obtener historial de casos extremos de un socio
 */
export declare const obtenerHistorialCasosExtremos: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=casos-extremos.controller.d.ts.map