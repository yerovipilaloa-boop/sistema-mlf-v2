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
import { casosExtremosService } from '../services/casos-extremos.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { sendSuccess } from '../utils/api-response';

/**
 * Procesar fallecimiento de deudor
 * Aplica seguro de vida y ejecuta garantías si es necesario
 */
export const procesarFallecimientoDeudor = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      socioId,
      creditoId,
      fechaFallecimiento,
      certificadoDefuncion,
      observaciones,
    } = req.body;

    if (!socioId || !creditoId || !fechaFallecimiento || !certificadoDefuncion) {
      throw new Error(
        'Se requiere: socioId, creditoId, fechaFallecimiento y certificadoDefuncion'
      );
    }

    const resultado = await casosExtremosService.procesarFallecimientoDeudor(
      {
        socioId: parseInt(socioId, 10),
        creditoId: parseInt(creditoId, 10),
        fechaFallecimiento: new Date(fechaFallecimiento),
        certificadoDefuncion,
        observaciones,
      },
      req.user?.id
    );

    sendSuccess(
      res,
      resultado,
      'Fallecimiento procesado exitosamente. Seguro aplicado.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Procesar fallecimiento de garante
 * Libera garantías y marca créditos que requieren nuevos garantes
 */
export const procesarFallecimientoGarante = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      garanteId,
      fechaFallecimiento,
      certificadoDefuncion,
      observaciones,
    } = req.body;

    if (!garanteId || !fechaFallecimiento || !certificadoDefuncion) {
      throw new Error(
        'Se requiere: garanteId, fechaFallecimiento y certificadoDefuncion'
      );
    }

    const resultado = await casosExtremosService.procesarFallecimientoGarante(
      {
        garanteId: parseInt(garanteId, 10),
        fechaFallecimiento: new Date(fechaFallecimiento),
        certificadoDefuncion,
        observaciones,
      },
      req.user?.id
    );

    sendSuccess(
      res,
      resultado,
      'Fallecimiento de garante procesado. Garantías liberadas.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Detectar y registrar fraude
 * Suspende al socio inmediatamente y registra evidencias
 */
export const detectarFraude = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { socioId, tipo, descripcion, evidencias, gravedad } = req.body;

    if (!socioId || !tipo || !descripcion) {
      throw new Error('Se requiere: socioId, tipo y descripcion');
    }

    const resultado = await casosExtremosService.detectarFraude(
      {
        socioId: parseInt(socioId, 10),
        tipo,
        descripcion,
        evidencias: evidencias || [],
        gravedad: gravedad || 'ALTA',
      },
      req.user?.id
    );

    sendSuccess(
      res,
      resultado,
      '🚨 Fraude registrado. Socio suspendido automáticamente.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Refinanciar crédito
 * Reestructura crédito con nuevo plazo y/o tasa, opcionalmente con quita
 */
export const refinanciarCredito = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      nuevoPlazoMeses,
      nuevaTasaAnual,
      porcentajeQuita,
      motivoRefinanciacion,
      requiereAprobacion,
    } = req.body;

    if (!nuevoPlazoMeses && !nuevaTasaAnual && !porcentajeQuita) {
      throw new Error(
        'Se requiere al menos: nuevoPlazoMeses, nuevaTasaAnual o porcentajeQuita'
      );
    }

    const resultado = await casosExtremosService.refinanciarCredito(
      {
        creditoId: parseInt(id, 10),
        nuevoPlazoMeses: nuevoPlazoMeses ? parseInt(nuevoPlazoMeses, 10) : undefined,
        nuevaTasaAnual: nuevaTasaAnual ? parseFloat(nuevaTasaAnual) : undefined,
        porcentajeQuita: porcentajeQuita ? parseFloat(porcentajeQuita) : undefined,
        motivoRefinanciacion: motivoRefinanciacion || '',
        requiereAprobacion: requiereAprobacion ?? true,
      },
      req.user?.id
    );

    sendSuccess(
      res,
      resultado,
      'Crédito refinanciado exitosamente. Nueva tabla de amortización generada.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Condonar deuda
 * Condonación administrativa de deuda (requiere autorización)
 */
export const condonarDeuda = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { creditoId, porcentajeCondonacion, motivo, autorizadoPor } = req.body;

    if (!creditoId || !porcentajeCondonacion || !motivo || !autorizadoPor) {
      throw new Error(
        'Se requiere: creditoId, porcentajeCondonacion, motivo y autorizadoPor'
      );
    }

    if (parseFloat(porcentajeCondonacion) <= 0 || parseFloat(porcentajeCondonacion) > 100) {
      throw new Error('El porcentaje debe estar entre 0 y 100');
    }

    const resultado = await casosExtremosService.condonarDeuda(
      {
        creditoId: parseInt(creditoId, 10),
        porcentajeCondonacion: parseFloat(porcentajeCondonacion),
        motivo,
        autorizadoPor,
      },
      req.user?.id
    );

    sendSuccess(
      res,
      resultado,
      `Deuda condonada exitosamente (${porcentajeCondonacion}%)`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Procesar catástrofe natural
 * Suspende pagos masivamente y registra afectados
 */
export const procesarCatastrofe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      tipo,
      descripcion,
      fechaEvento,
      sociosAfectadosIds,
      mesesGracia,
      condonarIntereses,
    } = req.body;

    if (!tipo || !descripcion || !fechaEvento || !sociosAfectadosIds) {
      throw new Error(
        'Se requiere: tipo, descripcion, fechaEvento y sociosAfectadosIds'
      );
    }

    if (!Array.isArray(sociosAfectadosIds) || sociosAfectadosIds.length === 0) {
      throw new Error('sociosAfectadosIds debe ser un array con al menos 1 socio');
    }

    const resultado = await casosExtremosService.procesarCatastrofe(
      {
        tipo,
        descripcion,
        fechaEvento: new Date(fechaEvento),
        sociosAfectadosIds: sociosAfectadosIds.map((id: string) => parseInt(id, 10)),
        mesesGracia: mesesGracia ? parseInt(mesesGracia, 10) : 3,
        condonarIntereses: condonarIntereses ?? false,
      },
      req.user?.id
    );

    sendSuccess(
      res,
      resultado,
      `Catástrofe procesada. ${resultado.sociosAfectados} socios beneficiados con ${resultado.mesesGracia} meses de gracia.`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener historial de casos extremos de un socio
 */
export const obtenerHistorialCasosExtremos = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { socioId } = req.params;

    if (!socioId) {
      throw new Error('Se requiere socioId');
    }

    const historial = await casosExtremosService.obtenerHistorialCasosExtremos(
      parseInt(socioId, 10)
    );

    sendSuccess(
      res,
      historial,
      'Historial de casos extremos obtenido exitosamente'
    );
  } catch (error) {
    next(error);
  }
};
