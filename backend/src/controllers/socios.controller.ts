/**
 * ============================================================================
 * Sistema MLF - Controlador de Socios
 * Archivo: src/controllers/socios.controller.ts
 * Descripción: Controladores para endpoints de gestión de socios
 * ============================================================================
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import sociosService from '../services/socios.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/responses';

/**
 * POST /api/v1/socios
 * Crear nuevo socio
 */
export const crearSocio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;

    // Validación básica
    if (
      !data.nombreCompleto ||
      !data.documentoIdentidad ||
      !data.fechaNacimiento ||
      !data.direccion ||
      !data.ciudad ||
      !data.telefono ||
      !data.email ||
      !data.depositoInicial ||
      !data.recomendadores ||
      !data.usuario ||
      !data.password
    ) {
      throw new Error('Todos los campos son requeridos');
    }

    // Convertir fechaNacimiento de string a Date
    const socioData = {
      ...data,
      fechaNacimiento: new Date(data.fechaNacimiento),
    };

    const socio = await sociosService.crearSocio(socioData, req.user?.id);

    sendCreated(res, socio, 'Socio creado exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/socios/:id
 * Obtener socio por ID
 */
export const obtenerSocio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const socio = await sociosService.obtenerSocioPorId(parseInt(id, 10));

    sendSuccess(res, socio);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/socios/codigo/:codigo
 * Obtener socio por código
 */
export const obtenerSocioPorCodigo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { codigo } = req.params;
    const socio = await sociosService.obtenerSocioPorCodigo(codigo);

    sendSuccess(res, socio);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/socios
 * Listar socios con filtros y paginación
 */
export const listarSocios = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      estado,
      etapa,
      busqueda,
    } = req.query;

    const resultado = await sociosService.listarSocios({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      estado: estado as any,
      etapa: etapa ? parseInt(etapa as string, 10) : undefined,
      busqueda: busqueda as string,
    });

    sendPaginated(
      res,
      resultado.socios,
      resultado.page,
      resultado.limit,
      resultado.total,
      'socios'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/socios/:id
 * Actualizar información del socio
 */
export const actualizarSocio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const socio = await sociosService.actualizarSocio(
      parseInt(id, 10),
      data,
      req.user?.id
    );

    sendSuccess(res, socio, 'Socio actualizado exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/socios/:id/depositar
 * Depositar ahorro
 */
export const depositarAhorro = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { monto, metodo, numeroReferencia, concepto } = req.body;

    if (!monto || !metodo) {
      throw new Error('Monto y método son requeridos');
    }

    const transaccion = await sociosService.depositarAhorro(
      {
        socioId: parseInt(id, 10),
        monto: parseFloat(monto),
        metodo,
        numeroReferencia,
        concepto,
      },
      req.user?.id
    );

    sendSuccess(res, transaccion, 'Depósito realizado exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/socios/:id/retirar
 * Retirar ahorro
 */
export const retirarAhorro = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { monto, metodo, numeroReferencia, concepto } = req.body;

    if (!monto || !metodo) {
      throw new Error('Monto y método son requeridos');
    }

    const transaccion = await sociosService.retirarAhorro(
      {
        socioId: parseInt(id, 10),
        monto: parseFloat(monto),
        metodo,
        numeroReferencia,
        concepto,
      },
      req.user?.id
    );

    sendSuccess(res, transaccion, 'Retiro realizado exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/socios/:id/cambiar-etapa
 * Cambiar etapa del socio (solo ADMIN)
 */
export const cambiarEtapa = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { nuevaEtapa, motivoAdministrativo } = req.body;

    if (!nuevaEtapa) {
      throw new Error('Nueva etapa es requerida');
    }

    const socio = await sociosService.cambiarEtapa(
      {
        socioId: parseInt(id, 10),
        nuevaEtapa: parseInt(nuevaEtapa, 10),
        motivoAdministrativo,
      },
      req.user?.id
    );

    sendSuccess(res, socio, 'Etapa cambiada exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/socios/:id/suspender
 * Suspender socio (solo ADMIN)
 */
export const suspenderSocio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      throw new Error('Motivo de suspensión es requerido');
    }

    const socio = await sociosService.suspenderSocio(
      parseInt(id, 10),
      motivo,
      req.user?.id
    );

    sendSuccess(res, socio, 'Socio suspendido exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/socios/:id/reactivar
 * Reactivar socio (solo ADMIN)
 */
export const reactivarSocio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const socio = await sociosService.reactivarSocio(
      parseInt(id, 10),
      req.user?.id
    );

    sendSuccess(res, socio, 'Socio reactivado exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/socios/:id/historial-transacciones
 * Obtener historial de transacciones del socio
 */
export const obtenerHistorialTransacciones = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const historial = await sociosService.obtenerHistorialTransacciones(
      parseInt(id, 10),
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );

    sendPaginated(
      res,
      historial.transacciones,
      historial.page,
      historial.limit,
      historial.total,
      'transacciones'
    );
  } catch (error) {
    next(error);
  }
};
