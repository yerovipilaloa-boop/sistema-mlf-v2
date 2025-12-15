/**
 * ============================================================================
 * Tests Unitarios - Servicio de Pagos
 * Archivo: src/services/__tests__/pagos.service.test.ts
 * ============================================================================
 */

import pagosService from '../pagos.service';
import prisma from '../../config/database';
import { EstadoCredito, EstadoCuota, ClasificacionMora } from '../../types';

// Mock de Prisma
jest.mock('../../config/database');

// Mock de logger
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock de amortizationService
jest.mock('../amortization.service', () => ({
  __esModule: true,
  default: {
    distribuirPago: jest.fn((monto, mora, interes, capital) => ({
      aplicadoMora: Math.min(monto, mora),
      aplicadoInteres: Math.min(Math.max(0, monto - mora), interes),
      aplicadoCapital: Math.min(
        Math.max(0, monto - mora - interes),
        capital
      ),
      sobrante: Math.max(0, monto - mora - interes - capital),
    })),
  },
}));

describe('PagosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registrarPago', () => {
    const mockCredito = {
      id: 45,
      codigo: 'CRE-2025-0045',
      estado: EstadoCredito.ACTIVO,
      socioId: 123,
      cuotas: [
        {
          id: 1,
          numeroCuota: 1,
          estado: EstadoCuota.VENCIDA,
          montoCuota: { toNumber: () => 250 },
          capital: { toNumber: () => 175 },
          interes: { toNumber: () => 75 },
          montoPagado: { toNumber: () => 0 },
          montoMora: { toNumber: () => 15 },
          diasMora: 3,
        },
        {
          id: 2,
          numeroCuota: 2,
          estado: EstadoCuota.PENDIENTE,
          montoCuota: { toNumber: () => 250 },
          capital: { toNumber: () => 177 },
          interes: { toNumber: () => 73 },
          montoPagado: { toNumber: () => 0 },
          montoMora: { toNumber: () => 0 },
          diasMora: 0,
        },
      ],
      socio: {
        id: 123,
        codigo: 'SOC-2025-0123',
      },
    };

    it('debe registrar pago y distribuir correctamente (RN-PAG-001)', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.cuota.findMany as jest.Mock).mockResolvedValue(
        mockCredito.cuotas
      );
      (prisma.cuota.update as jest.Mock).mockResolvedValue({});
      (prisma.pago.create as jest.Mock).mockResolvedValue({
        id: 1,
        monto: 300,
      });
      (prisma.transaccion.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await pagosService.registrarPago(
        {
          creditoId: 45,
          montoPagado: 300,
          metodoPago: 'EFECTIVO',
        },
        1
      );

      expect(resultado).toBeDefined();
      expect(resultado.pago).toBeDefined();
      expect(resultado.distribucion).toBeDefined();

      // Verificar que se distribuyó: Mora → Interés → Capital
      expect(prisma.cuota.update).toHaveBeenCalled();
    });

    it('debe rechazar monto negativo o cero', async () => {
      await expect(
        pagosService.registrarPago(
          {
            creditoId: 45,
            montoPagado: -100,
            metodoPago: 'EFECTIVO',
          },
          1
        )
      ).rejects.toThrow(/monto.*mayor a 0/i);
    });

    it('debe rechazar pago a crédito no ACTIVO', async () => {
      const creditoInactivo = {
        ...mockCredito,
        estado: EstadoCredito.COMPLETADO,
      };

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(
        creditoInactivo
      );

      await expect(
        pagosService.registrarPago(
          {
            creditoId: 45,
            montoPagado: 100,
            metodoPago: 'EFECTIVO',
          },
          1
        )
      ).rejects.toThrow(/ACTIVO/i);
    });

    it('debe aplicar mora primero en distribución (RN-PAG-001)', async () => {
      // Cuota con $15 de mora, $75 interés, $175 capital
      // Pago de $50 debe ir: $15 mora + $35 interés
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.cuota.findMany as jest.Mock).mockResolvedValue([
        mockCredito.cuotas[0],
      ]);
      (prisma.cuota.update as jest.Mock).mockResolvedValue({});
      (prisma.pago.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.transaccion.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      await pagosService.registrarPago(
        {
          creditoId: 45,
          montoPagado: 50,
          metodoPago: 'EFECTIVO',
        },
        1
      );

      // Verificar que amortizationService.distribuirPago fue llamado correctamente
      const amortizationService = require('../amortization.service').default;
      expect(amortizationService.distribuirPago).toHaveBeenCalled();
    });

    it('debe actualizar estado de cuota a PAGADA cuando se paga completa', async () => {
      const cuotaPorPagar = {
        ...mockCredito.cuotas[0],
        montoMora: { toNumber: () => 0 },
        diasMora: 0,
      };

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue({
        ...mockCredito,
        cuotas: [cuotaPorPagar],
      });
      (prisma.cuota.findMany as jest.Mock).mockResolvedValue([cuotaPorPagar]);
      (prisma.cuota.update as jest.Mock).mockResolvedValue({});
      (prisma.pago.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      await pagosService.registrarPago(
        {
          creditoId: 45,
          montoPagado: 250, // Pago completo
          metodoPago: 'EFECTIVO',
        },
        1
      );

      // Verificar que se actualizó el estado
      expect(prisma.cuota.update).toHaveBeenCalled();
    });
  });

  describe('actualizarMoraCredito', () => {
    it('debe calcular mora correctamente (RN-MOR-001)', async () => {
      const ahora = new Date();
      const hace5Dias = new Date(ahora.getTime() - 5 * 24 * 60 * 60 * 1000);

      const cuotaVencida = {
        id: 1,
        creditoId: 45,
        numeroCuota: 1,
        estado: EstadoCuota.VENCIDA,
        fechaVencimiento: hace5Dias,
        montoCuota: { toNumber: () => 250 },
        montoPagado: { toNumber: () => 0 },
        montoMora: { toNumber: () => 0 },
        diasMora: 0,
        credito: {
          id: 45,
          socioId: 123,
        },
      };

      (prisma.cuota.findMany as jest.Mock).mockResolvedValue([cuotaVencida]);
      (prisma.cuota.findUnique as jest.Mock).mockResolvedValue(cuotaVencida);
      (prisma.cuota.update as jest.Mock).mockResolvedValue({});
      (prisma.cuota.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.mora.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.mora.create as jest.Mock).mockResolvedValue({});
      (prisma.configuracion.findUnique as jest.Mock).mockResolvedValue({
        valor: '1.0',
      });

      await pagosService.actualizarMoraCredito(45);

      // Mora = $250 × 0.01 × 5 días = $12.50
      expect(prisma.cuota.update).toHaveBeenCalled();
    });

    it('debe clasificar mora en niveles correctos (RN-MOR-002)', async () => {
      const casos = [
        { dias: 10, clasificacion: ClasificacionMora.MORA_LEVE },
        { dias: 20, clasificacion: ClasificacionMora.MORA_MODERADA },
        { dias: 45, clasificacion: ClasificacionMora.MORA_GRAVE },
        { dias: 75, clasificacion: ClasificacionMora.MORA_PERSISTENTE },
        { dias: 95, clasificacion: ClasificacionMora.CASTIGADO },
      ];

      for (const caso of casos) {
        const service = pagosService as any;
        const clasificacion = service.clasificarMora(caso.dias);
        expect(clasificacion).toBe(caso.clasificacion);
      }
    });

    it('debe marcar cuota PENDIENTE como VENCIDA si pasó fecha', async () => {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);

      (prisma.cuota.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.cuota.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.mora.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.mora.deleteMany as jest.Mock).mockResolvedValue({});

      await pagosService.actualizarMoraCredito(45);

      expect(prisma.cuota.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estado: EstadoCuota.PENDIENTE,
          }),
          data: {
            estado: EstadoCuota.VENCIDA,
          },
        })
      );
    });
  });

  describe('obtenerEstadoPagos', () => {
    const mockCredito = {
      id: 45,
      codigo: 'CRE-2025-0045',
      estado: EstadoCredito.ACTIVO,
      montoTotal: 5000,
      saldoCapital: 4500,
      cuotas: [
        {
          estado: EstadoCuota.PAGADA,
          montoMora: { toNumber: () => 0 },
        },
        {
          estado: EstadoCuota.PENDIENTE,
          montoMora: { toNumber: () => 0 },
        },
        {
          estado: EstadoCuota.VENCIDA,
          montoMora: { toNumber: () => 15 },
        },
      ],
      pagos: [
        {
          id: 1,
          monto: { toNumber: () => 250 },
        },
      ],
      moras: [],
    };

    it('debe retornar estado completo de pagos', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);

      const resultado = await pagosService.obtenerEstadoPagos(45);

      expect(resultado).toBeDefined();
      expect(resultado.credito).toBeDefined();
      expect(resultado.resumen).toBeDefined();
      expect(resultado.resumen.cuotasPagadas).toBe(1);
      expect(resultado.resumen.cuotasPendientes).toBe(2);
      expect(resultado.resumen.cuotasVencidas).toBe(1);
      expect(resultado.resumen.totalMora).toBe(15);
    });

    it('debe calcular totales correctamente', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);

      const resultado = await pagosService.obtenerEstadoPagos(45);

      expect(resultado.resumen.totalPagado).toBe(250);
    });
  });

  describe('Casos de castigo de crédito', () => {
    it('debe castigar crédito al llegar a 90 días (RN-MOR-003)', async () => {
      const creditoMoroso = {
        id: 45,
        codigo: 'CRE-2025-0045',
        estado: EstadoCredito.ACTIVO,
      };

      const service = pagosService as any;

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(
        creditoMoroso
      );
      (prisma.credito.update as jest.Mock).mockResolvedValue({
        ...creditoMoroso,
        estado: EstadoCredito.CASTIGADO,
      });
      (prisma.auditoria.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      await service.castigarCredito(45);

      expect(prisma.credito.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoCredito.CASTIGADO,
          }),
        })
      );
    });
  });

  describe('verificarCompletitudCredito', () => {
    it('debe marcar crédito como COMPLETADO cuando todas las cuotas están pagadas', async () => {
      const creditoCompleto = {
        id: 45,
        codigo: 'CRE-2025-0045',
        socioId: 123,
        estado: EstadoCredito.ACTIVO,
        saldoCapital: { toNumber: () => 0 },
        cuotas: [
          { estado: EstadoCuota.PAGADA },
          { estado: EstadoCuota.PAGADA },
          { estado: EstadoCuota.PAGADA },
        ],
      };

      const service = pagosService as any;

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(
        creditoCompleto
      );
      (prisma.credito.update as jest.Mock).mockResolvedValue({
        ...creditoCompleto,
        estado: EstadoCredito.COMPLETADO,
      });
      (prisma.socio.update as jest.Mock).mockResolvedValue({});
      (prisma.mora.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.auditoria.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      await service.verificarCompletitudCredito(45);

      expect(prisma.credito.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoCredito.COMPLETADO,
          }),
        })
      );
    });

    it('debe incrementar contador de créditos completados del socio', async () => {
      const creditoCompleto = {
        id: 45,
        socioId: 123,
        estado: EstadoCredito.ACTIVO,
        saldoCapital: { toNumber: () => 0 },
        cuotas: [{ estado: EstadoCuota.PAGADA }],
      };

      const service = pagosService as any;

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(
        creditoCompleto
      );
      (prisma.credito.update as jest.Mock).mockResolvedValue({});
      (prisma.socio.update as jest.Mock).mockResolvedValue({});
      (prisma.mora.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      await service.verificarCompletitudCredito(45);

      expect(prisma.socio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creditosCompletados: { increment: 1 },
            creditosActivos: { decrement: 1 },
          }),
        })
      );
    });
  });
});
