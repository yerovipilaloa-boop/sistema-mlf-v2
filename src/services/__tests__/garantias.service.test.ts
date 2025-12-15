/**
 * ============================================================================
 * Tests Unitarios - Servicio de Garantías
 * Archivo: src/services/__tests__/garantias.service.test.ts
 * ============================================================================
 */

import garantiasService from '../garantias.service';
import prisma from '../../config/database';
import { EstadoSocio, EstadoCredito, EstadoGarantia } from '../../types';

// Mock de Prisma
jest.mock('../../config/database');

// Mock de logger
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('GarantiasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('crearGarantias', () => {
    const mockCredito = {
      id: 45,
      codigo: 'CRE-2025-0045',
      estado: EstadoCredito.APROBADO,
      socioId: 100,
      montoTotal: 5000,
      garantias: [],
    };

    const mockGarante = {
      id: 78,
      nombreCompleto: 'Garante 1',
      etapaActual: 3,
      estado: EstadoSocio.ACTIVO,
      ahorroActual: { toNumber: () => 2000 },
      ahorroCongelado: { toNumber: () => 0 },
      garantiasOtorgadas: [],
    };

    it('debe crear 2 garantías exitosamente (RN-GAR-002)', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockGarante);
      (prisma.garantia.create as jest.Mock).mockResolvedValue({
        id: 1,
        creditoId: 45,
        garanteId: 78,
        montoCongelado: 500,
        estado: EstadoGarantia.ACTIVA,
      });
      (prisma.auditoria.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );
      (prisma.configuracion.findUnique as jest.Mock).mockResolvedValue({
        valor: '10.0',
      });

      const resultado = await garantiasService.crearGarantias(
        {
          creditoId: 45,
          garantesIds: [78, 92],
        },
        1
      );

      expect(resultado).toHaveLength(2);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('debe rechazar si no son exactamente 2 garantes (RN-GAR-002)', async () => {
      await expect(
        garantiasService.crearGarantias(
          {
            creditoId: 45,
            garantesIds: [78], // Solo 1
          },
          1
        )
      ).rejects.toThrow(/exactamente 2 garantes/i);
    });

    it('debe rechazar garantes duplicados', async () => {
      await expect(
        garantiasService.crearGarantias(
          {
            creditoId: 45,
            garantesIds: [78, 78], // Duplicados
          },
          1
        )
      ).rejects.toThrow(/diferentes/i);
    });

    it('debe rechazar si crédito no está APROBADO', async () => {
      const creditoInvalido = {
        ...mockCredito,
        estado: EstadoCredito.SOLICITADO,
      };

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(
        creditoInvalido
      );

      await expect(
        garantiasService.crearGarantias(
          {
            creditoId: 45,
            garantesIds: [78, 92],
          },
          1
        )
      ).rejects.toThrow(/APROBADO/i);
    });

    it('debe rechazar si crédito ya tiene garantías', async () => {
      const creditoConGarantias = {
        ...mockCredito,
        garantias: [{ id: 1 }],
      };

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(
        creditoConGarantias
      );

      await expect(
        garantiasService.crearGarantias(
          {
            creditoId: 45,
            garantesIds: [78, 92],
          },
          1
        )
      ).rejects.toThrow(/ya tiene garantías/i);
    });

    it('debe rechazar si deudor es su propio garante', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);

      await expect(
        garantiasService.crearGarantias(
          {
            creditoId: 45,
            garantesIds: [100, 78], // 100 es el deudor
          },
          1
        )
      ).rejects.toThrow(/propio garante/i);
    });

    it('debe rechazar garante que no es Etapa 3 (RN-GAR-003)', async () => {
      const garanteEtapa2 = {
        ...mockGarante,
        etapaActual: 2, // No es Etapa 3
      };

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(garanteEtapa2);

      await expect(
        garantiasService.crearGarantias(
          {
            creditoId: 45,
            garantesIds: [78, 92],
          },
          1
        )
      ).rejects.toThrow(/Etapa 3/i);
    });

    it('debe rechazar garante SUSPENDIDO (RN-GAR-003)', async () => {
      const garanteSuspendido = {
        ...mockGarante,
        estado: EstadoSocio.SUSPENDIDO,
      };

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(
        garanteSuspendido
      );

      await expect(
        garantiasService.crearGarantias(
          {
            creditoId: 45,
            garantesIds: [78, 92],
          },
          1
        )
      ).rejects.toThrow(/ACTIVO/i);
    });

    it('debe rechazar si garante ya tiene 3 garantizados (RN-GAR-005)', async () => {
      const garanteConMaximo = {
        ...mockGarante,
        garantiasOtorgadas: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(
        garanteConMaximo
      );
      (prisma.configuracion.findUnique as jest.Mock).mockResolvedValue({
        valor: '3',
      });

      await expect(
        garantiasService.crearGarantias(
          {
            creditoId: 45,
            garantesIds: [78, 92],
          },
          1
        )
      ).rejects.toThrow(/Máximo.*3.*garantizados/i);
    });

    it('debe rechazar si garante no tiene ahorro suficiente (RN-GAR-004)', async () => {
      const garanteSinAhorro = {
        ...mockGarante,
        ahorroActual: { toNumber: () => 300 },
        ahorroCongelado: { toNumber: () => 0 },
      };

      // 10% de $5000 = $500 requeridos, pero solo tiene $300
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(
        garanteSinAhorro
      );
      (prisma.configuracion.findUnique as jest.Mock).mockResolvedValue({
        valor: '10.0',
      });

      await expect(
        garantiasService.crearGarantias(
          {
            creditoId: 45,
            garantesIds: [78, 92],
          },
          1
        )
      ).rejects.toThrow(/ahorro disponible insuficiente/i);
    });

    it('debe congelar 10% del monto del crédito (RN-GAR-004)', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockGarante);
      (prisma.garantia.create as jest.Mock).mockResolvedValue({
        montoCongelado: 500, // 10% de $5000
      });
      (prisma.socio.update as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );
      (prisma.configuracion.findUnique as jest.Mock).mockResolvedValue({
        valor: '10.0',
      });

      await garantiasService.crearGarantias(
        {
          creditoId: 45,
          garantesIds: [78, 92],
        },
        1
      );

      // 10% de $5000 = $500
      expect(prisma.garantia.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            montoCongelado: 500,
          }),
        })
      );
    });
  });

  describe('solicitarLiberacion', () => {
    const mockGarantia = {
      id: 89,
      creditoId: 45,
      garanteId: 78,
      estado: EstadoGarantia.ACTIVA,
      credito: {
        id: 45,
        cuotas: [
          { estado: 'PAGADA', montoMora: { toNumber: () => 0 } },
          { estado: 'PAGADA', montoMora: { toNumber: () => 0 } },
          { estado: 'PAGADA', montoMora: { toNumber: () => 0 } },
          { estado: 'PENDIENTE', montoMora: { toNumber: () => 0 } },
          { estado: 'PENDIENTE', montoMora: { toNumber: () => 0 } },
          { estado: 'PENDIENTE', montoMora: { toNumber: () => 0 } },
        ],
      },
      garante: {
        id: 78,
        nombreCompleto: 'Garante 1',
      },
    };

    it('debe permitir solicitud si cumple 50%+ completado (RN-GAR-006)', async () => {
      (prisma.garantia.findUnique as jest.Mock).mockResolvedValue(
        mockGarantia
      );
      (prisma.garantia.update as jest.Mock).mockResolvedValue({
        ...mockGarantia,
        estado: EstadoGarantia.EN_LIBERACION,
      });
      (prisma.liberacionGarantia.create as jest.Mock).mockResolvedValue({
        id: 12,
      });
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );
      (prisma.configuracion.findUnique as jest.Mock).mockResolvedValue({
        valor: '50',
      });

      const resultado = await garantiasService.solicitarLiberacion(
        {
          garantiaId: 89,
          motivoSolicitud: 'Crédito al 50% sin mora',
        },
        1
      );

      expect(resultado).toBeDefined();
      expect(resultado.id).toBe(12);
    });

    it('debe rechazar si no está ACTIVA', async () => {
      const garantiaLiberada = {
        ...mockGarantia,
        estado: EstadoGarantia.LIBERADA,
      };

      (prisma.garantia.findUnique as jest.Mock).mockResolvedValue(
        garantiaLiberada
      );

      await expect(
        garantiasService.solicitarLiberacion(
          {
            garantiaId: 89,
            motivoSolicitud: 'Motivo',
          },
          1
        )
      ).rejects.toThrow(/ACTIVA/i);
    });

    it('debe rechazar si no cumple 50% completado (RN-GAR-006)', async () => {
      const garantiaMenosDel50 = {
        ...mockGarantia,
        credito: {
          cuotas: [
            { estado: 'PAGADA' },
            { estado: 'PENDIENTE' },
            { estado: 'PENDIENTE' },
            { estado: 'PENDIENTE' },
            { estado: 'PENDIENTE' },
            { estado: 'PENDIENTE' },
          ],
        },
      };

      (prisma.garantia.findUnique as jest.Mock).mockResolvedValue(
        garantiaMenosDel50
      );
      (prisma.configuracion.findUnique as jest.Mock).mockResolvedValue({
        valor: '50',
      });

      await expect(
        garantiasService.solicitarLiberacion(
          {
            garantiaId: 89,
            motivoSolicitud: 'Motivo',
          },
          1
        )
      ).rejects.toThrow(/50%/i);
    });

    it('debe rechazar si tiene cuotas con mora (RN-GAR-006)', async () => {
      const garantiaConMora = {
        ...mockGarantia,
        credito: {
          cuotas: [
            { estado: 'PAGADA', montoMora: { toNumber: () => 10 } }, // Tuvo mora
            { estado: 'PAGADA', montoMora: { toNumber: () => 0 } },
            { estado: 'PAGADA', montoMora: { toNumber: () => 0 } },
            { estado: 'PENDIENTE', montoMora: { toNumber: () => 0 } },
          ],
        },
      };

      (prisma.garantia.findUnique as jest.Mock).mockResolvedValue(
        garantiaConMora
      );
      (prisma.configuracion.findUnique as jest.Mock).mockResolvedValue({
        valor: '50',
      });

      await expect(
        garantiasService.solicitarLiberacion(
          {
            garantiaId: 89,
            motivoSolicitud: 'Motivo',
          },
          1
        )
      ).rejects.toThrow(/mora/i);
    });
  });

  describe('aprobarLiberacion', () => {
    const mockLiberacion = {
      id: 12,
      garantiaId: 89,
      estado: 'PENDIENTE',
      garantia: {
        id: 89,
        garanteId: 78,
        montoCongelado: { toNumber: () => 500 },
      },
    };

    it('debe aprobar liberación y liberar ahorro (RN-GAR-007)', async () => {
      (prisma.liberacionGarantia.findUnique as jest.Mock).mockResolvedValue(
        mockLiberacion
      );
      (prisma.liberacionGarantia.update as jest.Mock).mockResolvedValue({
        ...mockLiberacion,
        estado: 'APROBADA',
      });
      (prisma.garantia.update as jest.Mock).mockResolvedValue({});
      (prisma.socio.update as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await garantiasService.aprobarLiberacion(
        {
          liberacionId: 12,
          observaciones: 'Aprobado',
        },
        1
      );

      expect(resultado).toBeDefined();

      // Verificar que se liberó el ahorro congelado
      expect(prisma.socio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ahorroCongelado: { decrement: 500 },
          }),
        })
      );
    });

    it('debe rechazar si ya fue procesada', async () => {
      const liberacionProcesada = {
        ...mockLiberacion,
        estado: 'APROBADA',
      };

      (prisma.liberacionGarantia.findUnique as jest.Mock).mockResolvedValue(
        liberacionProcesada
      );

      await expect(
        garantiasService.aprobarLiberacion({ liberacionId: 12 }, 1)
      ).rejects.toThrow(/ya fue procesada/i);
    });
  });

  describe('rechazarLiberacion', () => {
    const mockLiberacion = {
      id: 12,
      garantiaId: 89,
      estado: 'PENDIENTE',
      garantia: {},
    };

    it('debe rechazar liberación con motivo válido', async () => {
      (prisma.liberacionGarantia.findUnique as jest.Mock).mockResolvedValue(
        mockLiberacion
      );
      (prisma.liberacionGarantia.update as jest.Mock).mockResolvedValue({
        ...mockLiberacion,
        estado: 'RECHAZADA',
      });
      (prisma.garantia.update as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await garantiasService.rechazarLiberacion(
        {
          liberacionId: 12,
          motivoRechazo: 'No cumple requisitos',
        },
        1
      );

      expect(resultado).toBeDefined();

      // Verificar que garantía vuelve a ACTIVA
      expect(prisma.garantia.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoGarantia.ACTIVA,
          }),
        })
      );
    });

    it('debe rechazar sin motivo de rechazo', async () => {
      await expect(
        garantiasService.rechazarLiberacion(
          {
            liberacionId: 12,
            motivoRechazo: '',
          },
          1
        )
      ).rejects.toThrow(/motivo.*requerido/i);
    });
  });

  describe('ejecutarGarantia', () => {
    const mockGarantia = {
      id: 89,
      garanteId: 78,
      estado: EstadoGarantia.ACTIVA,
      montoCongelado: { toNumber: () => 500 },
      credito: {
        id: 45,
        codigo: 'CRE-2025-0045',
        socio: {},
      },
      garante: {
        nombreCompleto: 'Garante 1',
      },
    };

    it('debe ejecutar garantía y descongelar/descontar ahorro (RN-GAR-008)', async () => {
      (prisma.garantia.findUnique as jest.Mock).mockResolvedValue(
        mockGarantia
      );
      (prisma.garantia.update as jest.Mock).mockResolvedValue({
        ...mockGarantia,
        estado: EstadoGarantia.EJECUTADA,
        montoEjecutado: 500,
      });
      (prisma.socio.update as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await garantiasService.ejecutarGarantia(
        {
          garantiaId: 89,
          motivoEjecucion: 'Mora 91 días',
        },
        1
      );

      expect(resultado).toBeDefined();

      // Verificar descongelación y descuento
      expect(prisma.socio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ahorroCongelado: { decrement: 500 },
            ahorroActual: { decrement: 500 },
          }),
        })
      );
    });

    it('debe rechazar ejecutar garantía no ACTIVA', async () => {
      const garantiaEjecutada = {
        ...mockGarantia,
        estado: EstadoGarantia.EJECUTADA,
      };

      (prisma.garantia.findUnique as jest.Mock).mockResolvedValue(
        garantiaEjecutada
      );

      await expect(
        garantiasService.ejecutarGarantia(
          {
            garantiaId: 89,
            motivoEjecucion: 'Motivo',
          },
          1
        )
      ).rejects.toThrow(/ACTIVA/i);
    });
  });
});
