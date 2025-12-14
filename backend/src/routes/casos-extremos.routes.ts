/**
 * ============================================================================
 * Routes: Casos Extremos
 * ============================================================================
 * Rutas para manejo de situaciones excepcionales
 *
 * Autorización:
 * - Solo ADMIN puede ejecutar todas las operaciones
 * - Todas las rutas requieren autenticación
 *
 * @author Sistema MLF
 * @version 1.0.0
 */

import { Router } from 'express';
import * as casosExtremosController from '../controllers/casos-extremos.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/v1/casos-extremos/fallecimiento-deudor
 * Procesar fallecimiento de deudor
 * - Aplica seguro de vida (1% prima)
 * - Ejecuta garantías si saldo excede cobertura
 * - Requiere certificado de defunción
 */
router.post(
  '/fallecimiento-deudor',
  authenticate,
  requireAdmin,
  casosExtremosController.procesarFallecimientoDeudor
);

/**
 * POST /api/v1/casos-extremos/fallecimiento-garante
 * Procesar fallecimiento de garante
 * - Libera todas las garantías del garante
 * - Marca créditos que requieren nuevos garantes
 * - Notifica a deudores afectados
 */
router.post(
  '/fallecimiento-garante',
  authenticate,
  requireAdmin,
  casosExtremosController.procesarFallecimientoGarante
);

/**
 * POST /api/v1/casos-extremos/fraude
 * Detectar y registrar fraude
 * - Suspende al socio inmediatamente
 * - Registra evidencias y gravedad
 * - Notifica a administradores
 */
router.post(
  '/fraude',
  authenticate,
  requireAdmin,
  casosExtremosController.detectarFraude
);

/**
 * POST /api/v1/casos-extremos/creditos/:id/refinanciar
 * Refinanciar crédito
 * - Reestructura con nuevo plazo y/o tasa
 * - Opcionalmente aplica quita (condonación parcial)
 * - Genera nueva tabla de amortización
 */
router.post(
  '/creditos/:id/refinanciar',
  authenticate,
  requireAdmin,
  casosExtremosController.refinanciarCredito
);

/**
 * POST /api/v1/casos-extremos/condonar
 * Condonar deuda
 * - Condonación administrativa (requiere autorización)
 * - Porcentaje configurable (1-100%)
 * - Registra motivo y autorizante
 */
router.post(
  '/condonar',
  authenticate,
  requireAdmin,
  casosExtremosController.condonarDeuda
);

/**
 * POST /api/v1/casos-extremos/catastrofe
 * Procesar catástrofe natural
 * - Suspende pagos masivamente
 * - Otorga meses de gracia (por defecto 3)
 * - Opcionalmente condona intereses
 */
router.post(
  '/catastrofe',
  authenticate,
  requireAdmin,
  casosExtremosController.procesarCatastrofe
);

/**
 * GET /api/v1/casos-extremos/historial/:socioId
 * Obtener historial de casos extremos de un socio
 * - Lista todos los casos extremos procesados
 * - Incluye fallecimientos, fraudes, refinanciamientos
 */
router.get(
  '/historial/:socioId',
  authenticate,
  requireAdmin,
  casosExtremosController.obtenerHistorialCasosExtremos
);

export default router;
