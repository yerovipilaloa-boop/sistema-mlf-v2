"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerHistorialCasosExtremos = exports.procesarCatastrofe = exports.condonarDeuda = exports.refinanciarCredito = exports.detectarFraude = exports.procesarFallecimientoGarante = exports.procesarFallecimientoDeudor = void 0;
const casos_extremos_service_1 = __importDefault(require("../services/casos-extremos.service"));
const api_response_1 = require("../utils/api-response");
/**
 * Procesar fallecimiento de deudor
 * Aplica seguro de vida y ejecuta garantías si es necesario
 */
const procesarFallecimientoDeudor = async (req, res, next) => {
    try {
        const { socioId, creditoId, fechaFallecimiento, certificadoDefuncion, observaciones, } = req.body;
        if (!socioId || !creditoId || !fechaFallecimiento || !certificadoDefuncion) {
            throw new Error('Se requiere: socioId, creditoId, fechaFallecimiento y certificadoDefuncion');
        }
        const resultado = await casos_extremos_service_1.default.procesarFallecimientoDeudor({
            socioId: parseInt(socioId, 10),
            creditoId: parseInt(creditoId, 10),
            fechaFallecimiento: new Date(fechaFallecimiento),
            certificadoDefuncion,
            observaciones,
        }, req.user?.id);
        (0, api_response_1.sendSuccess)(res, resultado, 'Fallecimiento procesado exitosamente. Seguro aplicado.');
    }
    catch (error) {
        next(error);
    }
};
exports.procesarFallecimientoDeudor = procesarFallecimientoDeudor;
/**
 * Procesar fallecimiento de garante
 * Libera garantías y marca créditos que requieren nuevos garantes
 */
const procesarFallecimientoGarante = async (req, res, next) => {
    try {
        const { garanteId, fechaFallecimiento, certificadoDefuncion, observaciones, } = req.body;
        if (!garanteId || !fechaFallecimiento || !certificadoDefuncion) {
            throw new Error('Se requiere: garanteId, fechaFallecimiento y certificadoDefuncion');
        }
        const resultado = await casos_extremos_service_1.default.procesarFallecimientoGarante({
            garanteId: parseInt(garanteId, 10),
            fechaFallecimiento: new Date(fechaFallecimiento),
            certificadoDefuncion,
            observaciones,
        }, req.user?.id);
        (0, api_response_1.sendSuccess)(res, resultado, 'Fallecimiento de garante procesado. Garantías liberadas.');
    }
    catch (error) {
        next(error);
    }
};
exports.procesarFallecimientoGarante = procesarFallecimientoGarante;
/**
 * Detectar y registrar fraude
 * Suspende al socio inmediatamente y registra evidencias
 */
const detectarFraude = async (req, res, next) => {
    try {
        const { socioId, tipo, descripcion, evidencias, gravedad } = req.body;
        if (!socioId || !tipo || !descripcion) {
            throw new Error('Se requiere: socioId, tipo y descripcion');
        }
        const resultado = await casos_extremos_service_1.default.detectarFraude({
            socioId: parseInt(socioId, 10),
            tipo,
            descripcion,
            evidencias: evidencias || [],
            gravedad: gravedad || 'ALTA',
        }, req.user?.id);
        (0, api_response_1.sendSuccess)(res, resultado, '🚨 Fraude registrado. Socio suspendido automáticamente.');
    }
    catch (error) {
        next(error);
    }
};
exports.detectarFraude = detectarFraude;
/**
 * Refinanciar crédito
 * Reestructura crédito con nuevo plazo y/o tasa, opcionalmente con quita
 */
const refinanciarCredito = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nuevoPlazoMeses, nuevaTasaAnual, porcentajeQuita, motivoRefinanciacion, requiereAprobacion, } = req.body;
        if (!nuevoPlazoMeses && !nuevaTasaAnual && !porcentajeQuita) {
            throw new Error('Se requiere al menos: nuevoPlazoMeses, nuevaTasaAnual o porcentajeQuita');
        }
        const resultado = await casos_extremos_service_1.default.refinanciarCredito({
            creditoId: parseInt(id, 10),
            nuevoPlazoMeses: nuevoPlazoMeses ? parseInt(nuevoPlazoMeses, 10) : undefined,
            nuevaTasaAnual: nuevaTasaAnual ? parseFloat(nuevaTasaAnual) : undefined,
            porcentajeQuita: porcentajeQuita ? parseFloat(porcentajeQuita) : undefined,
            motivoRefinanciacion: motivoRefinanciacion || '',
            requiereAprobacion: requiereAprobacion ?? true,
        }, req.user?.id);
        (0, api_response_1.sendSuccess)(res, resultado, 'Crédito refinanciado exitosamente. Nueva tabla de amortización generada.');
    }
    catch (error) {
        next(error);
    }
};
exports.refinanciarCredito = refinanciarCredito;
/**
 * Condonar deuda
 * Condonación administrativa de deuda (requiere autorización)
 */
const condonarDeuda = async (req, res, next) => {
    try {
        const { creditoId, porcentajeCondonacion, motivo, autorizadoPor } = req.body;
        if (!creditoId || !porcentajeCondonacion || !motivo || !autorizadoPor) {
            throw new Error('Se requiere: creditoId, porcentajeCondonacion, motivo y autorizadoPor');
        }
        if (parseFloat(porcentajeCondonacion) <= 0 || parseFloat(porcentajeCondonacion) > 100) {
            throw new Error('El porcentaje debe estar entre 0 y 100');
        }
        const resultado = await casos_extremos_service_1.default.condonarDeuda({
            creditoId: parseInt(creditoId, 10),
            porcentajeCondonacion: parseFloat(porcentajeCondonacion),
            motivo,
            autorizadoPor,
        }, req.user?.id);
        (0, api_response_1.sendSuccess)(res, resultado, `Deuda condonada exitosamente (${porcentajeCondonacion}%)`);
    }
    catch (error) {
        next(error);
    }
};
exports.condonarDeuda = condonarDeuda;
/**
 * Procesar catástrofe natural
 * Suspende pagos masivamente y registra afectados
 */
const procesarCatastrofe = async (req, res, next) => {
    try {
        const { tipo, descripcion, fechaEvento, sociosAfectadosIds, mesesGracia, condonarIntereses, } = req.body;
        if (!tipo || !descripcion || !fechaEvento || !sociosAfectadosIds) {
            throw new Error('Se requiere: tipo, descripcion, fechaEvento y sociosAfectadosIds');
        }
        if (!Array.isArray(sociosAfectadosIds) || sociosAfectadosIds.length === 0) {
            throw new Error('sociosAfectadosIds debe ser un array con al menos 1 socio');
        }
        const resultado = await casos_extremos_service_1.default.procesarCatastrofe({
            tipo,
            descripcion,
            fechaEvento: new Date(fechaEvento),
            sociosAfectadosIds: sociosAfectadosIds.map((id) => parseInt(id, 10)),
            mesesGracia: mesesGracia ? parseInt(mesesGracia, 10) : 3,
            condonarIntereses: condonarIntereses ?? false,
        }, req.user?.id);
        (0, api_response_1.sendSuccess)(res, resultado, `Catástrofe procesada. ${resultado.sociosAfectados} socios beneficiados con ${resultado.mesesGracia} meses de gracia.`);
    }
    catch (error) {
        next(error);
    }
};
exports.procesarCatastrofe = procesarCatastrofe;
/**
 * Obtener historial de casos extremos de un socio
 */
const obtenerHistorialCasosExtremos = async (req, res, next) => {
    try {
        const { socioId } = req.params;
        if (!socioId) {
            throw new Error('Se requiere socioId');
        }
        const historial = await casos_extremos_service_1.default.obtenerHistorialCasosExtremos(parseInt(socioId, 10));
        (0, api_response_1.sendSuccess)(res, historial, 'Historial de casos extremos obtenido exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerHistorialCasosExtremos = obtenerHistorialCasosExtremos;
//# sourceMappingURL=casos-extremos.controller.js.map