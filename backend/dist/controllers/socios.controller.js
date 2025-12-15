"use strict";
/**
 * ============================================================================
 * Sistema MLF - Controlador de Socios
 * Archivo: src/controllers/socios.controller.ts
 * Descripción: Controladores para endpoints de gestión de socios
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerHistorialTransacciones = exports.reactivarSocio = exports.suspenderSocio = exports.cambiarEtapa = exports.retirarAhorro = exports.depositarAhorro = exports.actualizarSocio = exports.listarSocios = exports.obtenerSocioPorCodigo = exports.obtenerSocio = exports.crearSocio = void 0;
const socios_service_1 = __importDefault(require("../services/socios.service"));
const responses_1 = require("../utils/responses");
/**
 * POST /api/v1/socios
 * Crear nuevo socio
 */
const crearSocio = async (req, res, next) => {
    try {
        const data = req.body;
        // Validación básica
        if (!data.nombreCompleto ||
            !data.documentoIdentidad ||
            !data.fechaNacimiento ||
            !data.direccion ||
            !data.ciudad ||
            !data.telefono ||
            !data.email ||
            !data.depositoInicial ||
            !data.recomendadores ||
            !data.usuario ||
            !data.password) {
            throw new Error('Todos los campos son requeridos');
        }
        // Convertir fechaNacimiento de string a Date
        const socioData = {
            ...data,
            fechaNacimiento: new Date(data.fechaNacimiento),
        };
        const socio = await socios_service_1.default.crearSocio(socioData, req.user?.id);
        (0, responses_1.sendCreated)(res, socio, 'Socio creado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.crearSocio = crearSocio;
/**
 * GET /api/v1/socios/:id
 * Obtener socio por ID
 */
const obtenerSocio = async (req, res, next) => {
    try {
        const { id } = req.params;
        const socio = await socios_service_1.default.obtenerSocioPorId(parseInt(id, 10));
        (0, responses_1.sendSuccess)(res, socio);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerSocio = obtenerSocio;
/**
 * GET /api/v1/socios/codigo/:codigo
 * Obtener socio por código
 */
const obtenerSocioPorCodigo = async (req, res, next) => {
    try {
        const { codigo } = req.params;
        const socio = await socios_service_1.default.obtenerSocioPorCodigo(codigo);
        (0, responses_1.sendSuccess)(res, socio);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerSocioPorCodigo = obtenerSocioPorCodigo;
/**
 * GET /api/v1/socios
 * Listar socios con filtros y paginación
 */
const listarSocios = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', estado, etapa, busqueda, } = req.query;
        const resultado = await socios_service_1.default.listarSocios({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            estado: estado,
            etapa: etapa ? parseInt(etapa, 10) : undefined,
            busqueda: busqueda,
        });
        (0, responses_1.sendPaginated)(res, resultado.socios, resultado.page, resultado.limit, resultado.total, 'socios');
    }
    catch (error) {
        next(error);
    }
};
exports.listarSocios = listarSocios;
/**
 * PUT /api/v1/socios/:id
 * Actualizar información del socio
 */
const actualizarSocio = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const socio = await socios_service_1.default.actualizarSocio(parseInt(id, 10), data, req.user?.id);
        (0, responses_1.sendSuccess)(res, socio, 'Socio actualizado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.actualizarSocio = actualizarSocio;
/**
 * POST /api/v1/socios/:id/depositar
 * Depositar ahorro
 */
const depositarAhorro = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { monto, metodo, numeroReferencia, concepto } = req.body;
        if (!monto || !metodo) {
            throw new Error('Monto y método son requeridos');
        }
        const transaccion = await socios_service_1.default.depositarAhorro({
            socioId: parseInt(id, 10),
            monto: parseFloat(monto),
            metodo,
            numeroReferencia,
            concepto,
        }, req.user?.id);
        (0, responses_1.sendSuccess)(res, transaccion, 'Depósito realizado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.depositarAhorro = depositarAhorro;
/**
 * POST /api/v1/socios/:id/retirar
 * Retirar ahorro
 */
const retirarAhorro = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { monto, metodo, numeroReferencia, concepto } = req.body;
        if (!monto || !metodo) {
            throw new Error('Monto y método son requeridos');
        }
        const transaccion = await socios_service_1.default.retirarAhorro({
            socioId: parseInt(id, 10),
            monto: parseFloat(monto),
            metodo,
            numeroReferencia,
            concepto,
        }, req.user?.id);
        (0, responses_1.sendSuccess)(res, transaccion, 'Retiro realizado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.retirarAhorro = retirarAhorro;
/**
 * POST /api/v1/socios/:id/cambiar-etapa
 * Cambiar etapa del socio (solo ADMIN)
 */
const cambiarEtapa = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nuevaEtapa, motivoAdministrativo } = req.body;
        if (!nuevaEtapa) {
            throw new Error('Nueva etapa es requerida');
        }
        const socio = await socios_service_1.default.cambiarEtapa({
            socioId: parseInt(id, 10),
            nuevaEtapa: parseInt(nuevaEtapa, 10),
            motivoAdministrativo,
        }, req.user?.id);
        (0, responses_1.sendSuccess)(res, socio, 'Etapa cambiada exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.cambiarEtapa = cambiarEtapa;
/**
 * POST /api/v1/socios/:id/suspender
 * Suspender socio (solo ADMIN)
 */
const suspenderSocio = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        if (!motivo) {
            throw new Error('Motivo de suspensión es requerido');
        }
        const socio = await socios_service_1.default.suspenderSocio(parseInt(id, 10), motivo, req.user?.id);
        (0, responses_1.sendSuccess)(res, socio, 'Socio suspendido exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.suspenderSocio = suspenderSocio;
/**
 * POST /api/v1/socios/:id/reactivar
 * Reactivar socio (solo ADMIN)
 */
const reactivarSocio = async (req, res, next) => {
    try {
        const { id } = req.params;
        const socio = await socios_service_1.default.reactivarSocio(parseInt(id, 10), req.user?.id);
        (0, responses_1.sendSuccess)(res, socio, 'Socio reactivado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.reactivarSocio = reactivarSocio;
/**
 * GET /api/v1/socios/:id/historial-transacciones
 * Obtener historial de transacciones del socio
 */
const obtenerHistorialTransacciones = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '20' } = req.query;
        const historial = await socios_service_1.default.obtenerHistorialTransacciones(parseInt(id, 10), parseInt(page, 10), parseInt(limit, 10));
        (0, responses_1.sendPaginated)(res, historial.transacciones, historial.page, historial.limit, historial.total, 'transacciones');
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerHistorialTransacciones = obtenerHistorialTransacciones;
//# sourceMappingURL=socios.controller.js.map