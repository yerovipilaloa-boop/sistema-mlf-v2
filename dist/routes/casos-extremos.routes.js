"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const casosExtremosController = __importStar(require("../controllers/casos-extremos.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/casos-extremos/fallecimiento-deudor
 * Procesar fallecimiento de deudor
 * - Aplica seguro de vida (1% prima)
 * - Ejecuta garantías si saldo excede cobertura
 * - Requiere certificado de defunción
 */
router.post('/fallecimiento-deudor', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, casosExtremosController.procesarFallecimientoDeudor);
/**
 * POST /api/v1/casos-extremos/fallecimiento-garante
 * Procesar fallecimiento de garante
 * - Libera todas las garantías del garante
 * - Marca créditos que requieren nuevos garantes
 * - Notifica a deudores afectados
 */
router.post('/fallecimiento-garante', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, casosExtremosController.procesarFallecimientoGarante);
/**
 * POST /api/v1/casos-extremos/fraude
 * Detectar y registrar fraude
 * - Suspende al socio inmediatamente
 * - Registra evidencias y gravedad
 * - Notifica a administradores
 */
router.post('/fraude', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, casosExtremosController.detectarFraude);
/**
 * POST /api/v1/casos-extremos/creditos/:id/refinanciar
 * Refinanciar crédito
 * - Reestructura con nuevo plazo y/o tasa
 * - Opcionalmente aplica quita (condonación parcial)
 * - Genera nueva tabla de amortización
 */
router.post('/creditos/:id/refinanciar', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, casosExtremosController.refinanciarCredito);
/**
 * POST /api/v1/casos-extremos/condonar
 * Condonar deuda
 * - Condonación administrativa (requiere autorización)
 * - Porcentaje configurable (1-100%)
 * - Registra motivo y autorizante
 */
router.post('/condonar', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, casosExtremosController.condonarDeuda);
/**
 * POST /api/v1/casos-extremos/catastrofe
 * Procesar catástrofe natural
 * - Suspende pagos masivamente
 * - Otorga meses de gracia (por defecto 3)
 * - Opcionalmente condona intereses
 */
router.post('/catastrofe', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, casosExtremosController.procesarCatastrofe);
/**
 * GET /api/v1/casos-extremos/historial/:socioId
 * Obtener historial de casos extremos de un socio
 * - Lista todos los casos extremos procesados
 * - Incluye fallecimientos, fraudes, refinanciamientos
 */
router.get('/historial/:socioId', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, casosExtremosController.obtenerHistorialCasosExtremos);
exports.default = router;
//# sourceMappingURL=casos-extremos.routes.js.map