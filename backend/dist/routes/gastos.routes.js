"use strict";
/**
 * ============================================================================
 * Sistema MLF - Rutas de Gastos Operativos
 * ============================================================================
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
const gastosController = __importStar(require("../controllers/gastos.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Aplicar autenticación a todas las rutas
router.use(auth_middleware_1.authenticate);
// GET /api/v1/gastos - Obtener lista de gastos
router.get('/', auth_middleware_1.requireAdmin, gastosController.obtenerGastos);
// POST /api/v1/gastos - Registrar nuevo gasto
router.post('/', auth_middleware_1.requireAdmin, gastosController.registrarGasto);
// DELETE /api/v1/gastos/:id - Eliminar gasto
router.delete('/:id', auth_middleware_1.requireAdmin, gastosController.eliminarGasto);
// GET /api/v1/gastos/categorias - Obtener categorías
router.get('/categorias', auth_middleware_1.requireAdmin, gastosController.obtenerCategorias);
exports.default = router;
//# sourceMappingURL=gastos.routes.js.map