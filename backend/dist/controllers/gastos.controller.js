"use strict";
/**
 * ============================================================================
 * Sistema MLF - Controlador de Gastos Operativos
 * Archivo: src/controllers/gastos.controller.ts
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerCategorias = exports.eliminarGasto = exports.registrarGasto = exports.obtenerGastos = void 0;
const database_1 = __importDefault(require("../config/database"));
const responses_1 = require("../utils/responses");
const errors_1 = require("../utils/errors");
/**
 * GET /api/v1/gastos
 * Obtener lista de gastos operativos
 */
const obtenerGastos = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, categoria, fechaInicio, fechaFin } = req.query;
        const where = {};
        if (categoria) {
            where.categoria = categoria;
        }
        if (fechaInicio || fechaFin) {
            where.fechaGasto = {};
            if (fechaInicio) {
                where.fechaGasto.gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                where.fechaGasto.lte = new Date(fechaFin);
            }
        }
        const [gastos, total] = await Promise.all([
            database_1.default.gastoOperativo.findMany({
                where,
                orderBy: [
                    { fechaGasto: 'desc' },
                    { id: 'desc' },
                ],
                take: Number(limit),
                skip: (Number(page) - 1) * Number(limit),
                include: {
                    registradoPor: {
                        select: {
                            id: true,
                            nombreCompleto: true,
                            codigo: true,
                        },
                    },
                },
            }),
            database_1.default.gastoOperativo.count({ where }),
        ]);
        const response = {
            gastos: gastos.map(g => ({
                id: g.id,
                codigo: g.codigo,
                categoria: g.categoria,
                descripcion: g.descripcion,
                monto: parseFloat(g.monto.toString()),
                fechaGasto: g.fechaGasto,
                tipoPago: g.tipoPago,
                numeroComprobante: g.numeroComprobante,
                proveedor: g.proveedor,
                observaciones: g.observaciones,
                registradoPor: g.registradoPor,
                createdAt: g.createdAt,
            })),
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        };
        (0, responses_1.sendSuccess)(res, response);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerGastos = obtenerGastos;
/**
 * POST /api/v1/gastos
 * Registrar nuevo gasto operativo
 */
const registrarGasto = async (req, res, next) => {
    try {
        const { categoria, descripcion, monto, fechaGasto, tipoPago, numeroComprobante, proveedor, observaciones, } = req.body;
        // Validaciones
        if (!categoria || !descripcion || !monto) {
            throw new errors_1.BadRequestError('Categoría, descripción y monto son requeridos');
        }
        if (monto <= 0) {
            throw new errors_1.BadRequestError('El monto debe ser mayor a 0');
        }
        const gasto = await database_1.default.gastoOperativo.create({
            data: {
                codigo: '', // Se genera automáticamente por trigger
                categoria,
                descripcion,
                monto,
                fechaGasto: fechaGasto ? new Date(fechaGasto) : new Date(),
                tipoPago,
                numeroComprobante,
                proveedor,
                observaciones,
                registradoPorId: req.user?.id,
            },
            include: {
                registradoPor: {
                    select: {
                        nombreCompleto: true,
                        codigo: true,
                    },
                },
            },
        });
        const response = {
            id: gasto.id,
            codigo: gasto.codigo,
            categoria: gasto.categoria,
            descripcion: gasto.descripcion,
            monto: parseFloat(gasto.monto.toString()),
            fechaGasto: gasto.fechaGasto,
            tipoPago: gasto.tipoPago,
            numeroComprobante: gasto.numeroComprobante,
            proveedor: gasto.proveedor,
            observaciones: gasto.observaciones,
            registradoPor: gasto.registradoPor,
            createdAt: gasto.createdAt,
        };
        (0, responses_1.sendCreated)(res, response, 'Gasto registrado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.registrarGasto = registrarGasto;
/**
 * DELETE /api/v1/gastos/:id
 * Eliminar gasto operativo
 */
const eliminarGasto = async (req, res, next) => {
    try {
        const { id } = req.params;
        const gasto = await database_1.default.gastoOperativo.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!gasto) {
            throw new errors_1.NotFoundError('Gasto no encontrado');
        }
        await database_1.default.gastoOperativo.delete({
            where: { id: parseInt(id, 10) },
        });
        (0, responses_1.sendSuccess)(res, null, 'Gasto eliminado exitosamente');
    }
    catch (error) {
        next(error);
    }
};
exports.eliminarGasto = eliminarGasto;
/**
 * GET /api/v1/gastos/categorias
 * Obtener lista de categorías de gastos
 */
const obtenerCategorias = async (req, res, next) => {
    try {
        const categorias = [
            { value: 'TECNOLOGIA', label: 'Tecnología' },
            { value: 'OPERATIVO', label: 'Operativo' },
            { value: 'NOMINA', label: 'Nómina' },
            { value: 'MARKETING', label: 'Marketing' },
            { value: 'LEGAL', label: 'Legal' },
            { value: 'OTRO', label: 'Otro' },
        ];
        (0, responses_1.sendSuccess)(res, categorias);
    }
    catch (error) {
        next(error);
    }
};
exports.obtenerCategorias = obtenerCategorias;
//# sourceMappingURL=gastos.controller.js.map