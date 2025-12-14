/**
 * ============================================================================
 * Tests Unitarios - Servicio de Créditos
 * Archivo: src/services/__tests__/creditos.service.test.ts
 * ============================================================================
 */

import creditosService from '../creditos.service';
import prisma from '../../config/database';
import { EstadoSocio, EstadoCredito, MetodoAmortizacion } from '../../types';

// Mock de Prisma
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    credito: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    socio: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    cuota: {
      create: jest.fn(),
    },
    fondoSeguro: {
      create: jest.fn(),
    },
    auditoria: {
      create: jest.fn(),
    },
    configuracion: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

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
    calcularTablaAmortizacion: jest.fn(() => ({
      resumen: {
        montoTotal: 5000,
        totalInteres: 967.84,
        totalPagar: 5967.84,
        cuotaMensual: 248.66,
      },
      cuotas: Array.from({ length: 24 }, (_, i) => ({
        numeroCuota: i + 1,
        fechaVencimiento: new Date('2025-02-15'),
        montoCuota: 248.66,
        capital: 173.66,
        interes: 75,
        saldoRestante: 5000 - (i + 1) * 173.66,
      })),
    })),
  },
}));

describe('CreditosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('solicitarCredito', () => {
    const mockSocio = {
      id: 123,
      codigo: 'SOC-2025-0123',
      nombreCompleto: 'Juan Pérez',
      estado: EstadoSocio.ACTIVO,
      etapaActual: 2,
      creditosEtapaActual: 1,
      ahorroActual: { toNumber: () => 5000 },
      creditos: [],
      moras: [],
    };

    const mockCreditoData = {
      socioId: 123,
      montoSolicitado: 8000,
      plazoMeses: 24,
      metodoAmortizacion: MetodoAmortizacion.FRANCES,
      proposito: 'Capital de trabajo',
    };

    it('debe crear solicitud de crédito exitosamente', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);
      (prisma.credito.create as jest.Mock).mockResolvedValue({
        id: 45,
        codigo: 'CRE-2025-0045',
        ...mockCreditoData,
        primaSeguro: 80,
        montoTotal: 8080,
        estado: EstadoCredito.SOLICITADO,
      });

      const resultado = await creditosService.solicitarCredito(
        mockCreditoData,
        1
      );

      expect(resultado).toBeDefined();
      expect(resultado.codigo).toMatch(/^CRE-\d{4}-\d{4}$/);
      expect(resultado.estado).toBe(EstadoCredito.SOLICITADO);
      expect(resultado.primaSeguro).toBeCloseTo(80, 2);
    });

    it('debe rechazar si socio no está ACTIVO', async () => {
      const socioInactivo = {
        ...mockSocio,
        estado: EstadoSocio.SUSPENDIDO,
      };

      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(socioInactivo);

      await expect(
        creditosService.solicitarCredito(mockCreditoData, 1)
      ).rejects.toThrow(/ACTIVO/i);
    });

    it('debe rechazar si socio tiene mora activa (RN-CRE-003)', async () => {
      const socioConMora = {
        ...mockSocio,
        moras: [
          {
            id: 1,
            diasMora: 15,
            estado: 'ACTIVA',
          },
        ],
      };

      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(socioConMora);

      await expect(
        creditosService.solicitarCredito(mockCreditoData, 1)
      ).rejects.toThrow(/mora activa/i);
    });

    it('debe calcular límite correcto para Etapa 2 (RN-CRE-002)', async () => {
      // Etapa 2 = 200% del ahorro = $5000 * 2 = $10,000
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);
      (prisma.credito.create as jest.Mock).mockResolvedValue({
        id: 45,
        codigo: 'CRE-2025-0045',
        montoTotal: 8080,
      });

      // Solicitar $8,000 debe ser aceptado (con prima = $8,080 < $10,000)
      const resultado = await creditosService.solicitarCredito(
        mockCreditoData,
        1
      );

      expect(resultado).toBeDefined();
    });

    it('debe rechazar si excede límite de crédito (RN-CRE-002)', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);

      const creditoExcesivo = {
        ...mockCreditoData,
        montoSolicitado: 11000, // Excede el 200% = $10,000
      };

      await expect(
        creditosService.solicitarCredito(creditoExcesivo, 1)
      ).rejects.toThrow(/límite.*excedido/i);
    });

    it('debe calcular límite progresivo para Etapa 1 (RN-ETA-004)', async () => {
      const socioEtapa1 = {
        ...mockSocio,
        etapaActual: 1,
        creditosEtapaActual: 0,
        ahorroActual: { toNumber: () => 4000 },
      };

      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(socioEtapa1);
      (prisma.credito.create as jest.Mock).mockResolvedValue({
        id: 45,
        montoTotal: 5050,
      });

      // Primer crédito Etapa 1 = 125% = $4000 * 1.25 = $5,000
      const creditoValido = {
        ...mockCreditoData,
        montoSolicitado: 4900, // Con prima $4,949 < $5,000
      };

      const resultado = await creditosService.solicitarCredito(
        creditoValido,
        1
      );

      expect(resultado).toBeDefined();
    });

    it('debe agregar prima de seguro 1% (RN-CRE-005, RN-SEG-001)', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);
      (prisma.credito.create as jest.Mock).mockResolvedValue({
        id: 45,
        montoSolicitado: 5000,
        primaSeguro: 50,
        montoTotal: 5050,
      });

      const creditoData = {
        ...mockCreditoData,
        montoSolicitado: 5000,
      };

      const resultado = await creditosService.solicitarCredito(creditoData, 1);

      // Prima = 1% de $5,000 = $50
      expect(resultado.primaSeguro).toBeCloseTo(50, 2);
      expect(resultado.montoTotal).toBeCloseTo(5050, 2);
    });

    it('debe rechazar monto negativo o cero', async () => {
      await expect(
        creditosService.solicitarCredito(
          {
            ...mockCreditoData,
            montoSolicitado: -1000,
          },
          1
        )
      ).rejects.toThrow(/monto.*mayor a 0/i);
    });

    it('debe rechazar plazo inválido', async () => {
      await expect(
        creditosService.solicitarCredito(
          {
            ...mockCreditoData,
            plazoMeses: 0,
          },
          1
        )
      ).rejects.toThrow(/plazo/i);
    });
  });

  describe('aprobarCredito', () => {
    const mockCredito = {
      id: 45,
      codigo: 'CRE-2025-0045',
      estado: EstadoCredito.SOLICITADO,
      socioId: 123,
      montoTotal: 5050,
    };

    const mockSocio = {
      id: 123,
      ahorroActual: { toNumber: () => 5000 },
      etapaActual: 2,
      creditosEtapaActual: 1,
      creditos: [],
    };

    it('debe aprobar crédito en estado SOLICITADO', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);
      (prisma.credito.update as jest.Mock).mockResolvedValue({
        ...mockCredito,
        estado: EstadoCredito.APROBADO,
      });

      const resultado = await creditosService.aprobarCredito(
        {
          creditoId: 45,
          observaciones: 'Aprobado por comité',
        },
        1
      );

      expect(resultado.estado).toBe(EstadoCredito.APROBADO);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('debe rechazar aprobar crédito ya aprobado', async () => {
      const creditoAprobado = {
        ...mockCredito,
        estado: EstadoCredito.APROBADO,
      };

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(
        creditoAprobado
      );

      await expect(
        creditosService.aprobarCredito({ creditoId: 45 }, 1)
      ).rejects.toThrow(/ya.*aprobado/i);
    });
  });

  describe('desembolsarCredito', () => {
    const mockCredito = {
      id: 45,
      codigo: 'CRE-2025-0045',
      estado: EstadoCredito.APROBADO,
      socioId: 123,
      montoSolicitado: 5000,
      primaSeguro: 50,
      montoTotal: 5050,
      plazoMeses: 24,
      metodoAmortizacion: MetodoAmortizacion.FRANCES,
    };

    it('debe desembolsar crédito y generar tabla de amortización', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.credito.update as jest.Mock).mockResolvedValue({
        ...mockCredito,
        estado: EstadoCredito.ACTIVO,
      });

      const resultado = await creditosService.desembolsarCredito(
        {
          creditoId: 45,
          tasaInteresAnual: 18,
          fechaDesembolso: new Date('2025-01-15'),
        },
        1
      );

      expect(resultado.credito.estado).toBe(EstadoCredito.ACTIVO);
      expect(resultado.tablaAmortizacion).toBeDefined();
      expect(resultado.tablaAmortizacion.cuotas).toHaveLength(24);
      expect(prisma.cuota.create).toHaveBeenCalledTimes(24);
      expect(prisma.fondoSeguro.create).toHaveBeenCalled();
    });

    it('debe rechazar desembolsar crédito no aprobado', async () => {
      const creditoNoAprobado = {
        ...mockCredito,
        estado: EstadoCredito.SOLICITADO,
      };

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(
        creditoNoAprobado
      );

      await expect(
        creditosService.desembolsarCredito(
          {
            creditoId: 45,
            tasaInteresAnual: 18,
          },
          1
        )
      ).rejects.toThrow(/APROBADO/i);
    });

    it('debe incrementar contador de créditos activos', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);

      await creditosService.desembolsarCredito(
        {
          creditoId: 45,
          tasaInteresAnual: 18,
        },
        1
      );

      expect(prisma.socio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creditosActivos: { increment: 1 },
          }),
        })
      );
    });

    it('debe registrar prima en fondo de seguro (RN-SEG-001)', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);

      await creditosService.desembolsarCredito(
        {
          creditoId: 45,
          tasaInteresAnual: 18,
        },
        1
      );

      expect(prisma.fondoSeguro.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: 'INGRESO_PRIMA',
            monto: mockCredito.primaSeguro,
          }),
        })
      );
    });
  });

  describe('rechazarCredito', () => {
    const mockCredito = {
      id: 45,
      codigo: 'CRE-2025-0045',
      estado: EstadoCredito.SOLICITADO,
    };

    it('debe rechazar crédito con motivo válido', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.credito.update as jest.Mock).mockResolvedValue({
        ...mockCredito,
        estado: EstadoCredito.RECHAZADO,
      });

      const resultado = await creditosService.rechazarCredito(
        {
          creditoId: 45,
          motivoRechazo: 'Capacidad de pago insuficiente',
        },
        1
      );

      expect(resultado.estado).toBe(EstadoCredito.RECHAZADO);
    });

    it('debe rechazar sin motivo si no se proporciona', async () => {
      await expect(
        creditosService.rechazarCredito(
          {
            creditoId: 45,
            motivoRechazo: '',
          },
          1
        )
      ).rejects.toThrow(/motivo.*requerido/i);
    });
  });

  describe('obtenerCreditoPorId', () => {
    it('debe retornar crédito con todas las relaciones', async () => {
      const mockCredito = {
        id: 45,
        codigo: 'CRE-2025-0045',
        socio: {
          id: 123,
          nombreCompleto: 'Juan Pérez',
        },
        cuotas: [],
        garantias: [],
      };

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);

      const resultado = await creditosService.obtenerCreditoPorId(45);

      expect(resultado).toBeDefined();
      expect(resultado.socio).toBeDefined();
    });

    it('debe lanzar error si crédito no existe', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(creditosService.obtenerCreditoPorId(999)).rejects.toThrow(
        /no encontrado/i
      );
    });
  });

  describe('listarCreditos', () => {
    it('debe retornar lista paginada de créditos', async () => {
      const mockCreditos = [
        { id: 45, codigo: 'CRE-2025-0045' },
        { id: 46, codigo: 'CRE-2025-0046' },
      ];

      (prisma.credito.findMany as jest.Mock).mockResolvedValue(mockCreditos);
      (prisma.credito.count as jest.Mock).mockResolvedValue(100);

      const resultado = await creditosService.listarCreditos({
        page: 1,
        limit: 20,
      });

      expect(resultado.creditos).toHaveLength(2);
      expect(resultado.total).toBe(100);
    });

    it('debe filtrar por estado', async () => {
      (prisma.credito.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.credito.count as jest.Mock).mockResolvedValue(0);

      await creditosService.listarCreditos({
        page: 1,
        limit: 20,
        estado: EstadoCredito.ACTIVO,
      });

      expect(prisma.credito.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estado: EstadoCredito.ACTIVO,
          }),
        })
      );
    });

    it('debe filtrar por socioId', async () => {
      (prisma.credito.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.credito.count as jest.Mock).mockResolvedValue(0);

      await creditosService.listarCreditos({
        page: 1,
        limit: 20,
        socioId: 123,
      });

      expect(prisma.credito.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            socioId: 123,
          }),
        })
      );
    });
  });
});
