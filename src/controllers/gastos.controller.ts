/**
 * ============================================================================
 * Sistema MLF - Controlador de Gastos Operativos
 * Archivo: src/controllers/gastos.controller.ts
 * ============================================================================
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';
import { sendSuccess, sendCreated } from '../utils/responses';
import { BadRequestError, NotFoundError } from '../utils/errors';

/**
 * GET /api/v1/gastos
 * Obtener lista de gastos operativos
 */
export const obtenerGastos = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 50, categoria, fechaInicio, fechaFin } = req.query;

    const where: any = {};

    if (categoria) {
      where.categoria = categoria;
    }

    if (fechaInicio || fechaFin) {
      where.fechaGasto = {};
      if (fechaInicio) {
        where.fechaGasto.gte = new Date(fechaInicio as string);
      }
      if (fechaFin) {
        where.fechaGasto.lte = new Date(fechaFin as string);
      }
    }

    const [gastos, total] = await Promise.all([
      prisma.gastoOperativo.findMany({
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
      prisma.gastoOperativo.count({ where }),
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

    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/gastos
 * Registrar nuevo gasto operativo
 */
export const registrarGasto = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      categoria,
      descripcion,
      monto,
      fechaGasto,
      tipoPago,
      numeroComprobante,
      proveedor,
      observaciones,
    } = req.body;

    // Validaciones
    if (!categoria || !descripcion || !monto) {
      throw new BadRequestError('Categoría, descripción y monto son requeridos');
    }

    if (monto <= 0) {
      throw new BadRequestError('El monto debe ser mayor a 0');
    }

    const gasto = await prisma.gastoOperativo.create({
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

    sendCreated(res, response, 'Gasto registrado exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/gastos/:id
 * Eliminar gasto operativo
 */
export const eliminarGasto = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const gasto = await prisma.gastoOperativo.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!gasto) {
      throw new NotFoundError('Gasto no encontrado');
    }

    await prisma.gastoOperativo.delete({
      where: { id: parseInt(id, 10) },
    });

    sendSuccess(res, null, 'Gasto eliminado exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/gastos/categorias
 * Obtener lista de categorías de gastos
 */
export const obtenerCategorias = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categorias = [
      { value: 'TECNOLOGIA', label: 'Tecnología' },
      { value: 'OPERATIVO', label: 'Operativo' },
      { value: 'NOMINA', label: 'Nómina' },
      { value: 'MARKETING', label: 'Marketing' },
      { value: 'LEGAL', label: 'Legal' },
      { value: 'OTRO', label: 'Otro' },
    ];

    sendSuccess(res, categorias);
  } catch (error) {
    next(error);
  }
};
