/**
 * ============================================================================
 * Tests Unitarios - Servicio de Socios
 * Archivo: src/services/__tests__/socios.service.test.ts
 * ============================================================================
 */

import sociosService from '../socios.service';
import prisma from '../../config/database';
import { EstadoSocio } from '../../types';

// Mock de Prisma
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    socio: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    recomendacion: {
      create: jest.fn(),
    },
    transaccion: {
      create: jest.fn(),
    },
    auditoria: {
      create: jest.fn(),
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

describe('SociosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('crearSocio', () => {
    const mockSocioData = {
      nombreCompleto: 'Juan Pérez García',
      documentoIdentidad: '1712345678',
      fechaNacimiento: new Date('1990-05-15'),
      genero: 'MASCULINO' as any,
      direccion: 'Av. Principal 123',
      ciudad: 'Quito',
      provincia: 'Pichincha',
      telefono: '0987654321',
      email: 'juan.perez@email.com',
      depositoInicial: 500,
      recomendadores: [3, 5],
    };

    const mockRecomendador = {
      id: 3,
      etapaActual: 3,
      estado: EstadoSocio.ACTIVO,
      nombreCompleto: 'Recomendador 1',
    };

    it('debe crear un socio exitosamente con datos válidos', async () => {
      // Mock: Verificar que no exista duplicado
      (prisma.socio.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock: Verificar recomendadores
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockRecomendador);

      // Mock: Crear socio
      (prisma.socio.create as jest.Mock).mockResolvedValue({
        id: 123,
        codigo: 'SOC-2025-0123',
        ...mockSocioData,
        etapaActual: 1,
        estado: EstadoSocio.ACTIVO,
        ahorroActual: 500,
      });

      const resultado = await sociosService.crearSocio(mockSocioData, 1);

      expect(resultado).toBeDefined();
      expect(resultado.codigo).toMatch(/^SOC-\d{4}-\d{4}$/);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('debe rechazar cédula inválida (RN-SOC-001)', async () => {
      const dataInvalida = {
        ...mockSocioData,
        documentoIdentidad: '1234567890', // Cédula inválida
      };

      await expect(sociosService.crearSocio(dataInvalida, 1)).rejects.toThrow(
        /cédula.*inválida/i
      );
    });

    it('debe rechazar menor de 18 años (RN-SOC-002)', async () => {
      const hoy = new Date();
      const hace17Años = new Date(
        hoy.getFullYear() - 17,
        hoy.getMonth(),
        hoy.getDate()
      );

      const dataInvalida = {
        ...mockSocioData,
        fechaNacimiento: hace17Años,
      };

      await expect(sociosService.crearSocio(dataInvalida, 1)).rejects.toThrow(
        /18 años/i
      );
    });

    it('debe rechazar cédula duplicada (RN-SOC-003)', async () => {
      // Mock: Ya existe un socio con esa cédula
      (prisma.socio.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        documentoIdentidad: mockSocioData.documentoIdentidad,
      });

      await expect(sociosService.crearSocio(mockSocioData, 1)).rejects.toThrow(
        /ya existe/i
      );
    });

    it('debe rechazar depósito inicial menor al mínimo (RN-SOC-005)', async () => {
      const dataInvalida = {
        ...mockSocioData,
        depositoInicial: 25, // Menor al mínimo de $50
      };

      (prisma.socio.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(sociosService.crearSocio(dataInvalida, 1)).rejects.toThrow(
        /depósito mínimo/i
      );
    });

    it('debe rechazar si no tiene exactamente 2 recomendadores (RN-SOC-007)', async () => {
      const dataInvalida = {
        ...mockSocioData,
        recomendadores: [3], // Solo 1 recomendador
      };

      (prisma.socio.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(sociosService.crearSocio(dataInvalida, 1)).rejects.toThrow(
        /2 recomendadores/i
      );
    });

    it('debe rechazar si recomendador no es Etapa 3 ACTIVO (RN-SOC-008)', async () => {
      (prisma.socio.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock: Recomendador en Etapa 2
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue({
        id: 3,
        etapaActual: 2, // No es Etapa 3
        estado: EstadoSocio.ACTIVO,
      });

      await expect(sociosService.crearSocio(mockSocioData, 1)).rejects.toThrow(
        /Etapa 3.*ACTIVO/i
      );
    });

    it('debe rechazar si recomendador está SUSPENDIDO', async () => {
      (prisma.socio.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock: Recomendador suspendido
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue({
        id: 3,
        etapaActual: 3,
        estado: EstadoSocio.SUSPENDIDO,
      });

      await expect(sociosService.crearSocio(mockSocioData, 1)).rejects.toThrow(
        /Etapa 3.*ACTIVO/i
      );
    });
  });

  describe('depositarAhorro', () => {
    const mockSocio = {
      id: 123,
      codigo: 'SOC-2025-0123',
      nombreCompleto: 'Juan Pérez',
      ahorroActual: { toNumber: () => 1000 },
      ahorroCongelado: { toNumber: () => 200 },
      estado: EstadoSocio.ACTIVO,
      transacciones: [],
    };

    it('debe permitir depósito válido', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);
      (prisma.transaccion.create as jest.Mock).mockResolvedValue({
        id: 1,
        monto: 500,
      });

      const resultado = await sociosService.depositarAhorro(
        {
          socioId: 123,
          monto: 500,
          metodo: 'EFECTIVO',
          concepto: 'Depósito mensual',
        },
        1
      );

      expect(resultado).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('debe rechazar monto negativo o cero', async () => {
      await expect(
        sociosService.depositarAhorro(
          {
            socioId: 123,
            monto: -100,
            metodo: 'EFECTIVO',
          },
          1
        )
      ).rejects.toThrow(/monto.*mayor a 0/i);
    });
  });

  describe('retirarAhorro', () => {
    const mockSocio = {
      id: 123,
      codigo: 'SOC-2025-0123',
      nombreCompleto: 'Juan Pérez',
      ahorroActual: { toNumber: () => 1000 },
      ahorroCongelado: { toNumber: () => 200 },
      estado: EstadoSocio.ACTIVO,
      transacciones: [],
    };

    it('debe permitir retiro con saldo suficiente', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);
      (prisma.transaccion.create as jest.Mock).mockResolvedValue({
        id: 1,
        monto: 300,
      });

      const resultado = await sociosService.retirarAhorro(
        {
          socioId: 123,
          monto: 300,
          metodo: 'EFECTIVO',
        },
        1
      );

      expect(resultado).toBeDefined();
    });

    it('debe mantener ahorro mínimo de $10 (RN-AHO-002)', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);

      // Intentar retirar dejando menos de $10
      await expect(
        sociosService.retirarAhorro(
          {
            socioId: 123,
            monto: 995, // Dejaría $5 disponibles
            metodo: 'EFECTIVO',
          },
          1
        )
      ).rejects.toThrow(/ahorro mínimo.*10/i);
    });

    it('debe rechazar retiro que exceda ahorro disponible (RN-AHO-003)', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);

      // Ahorro disponible = 1000 - 200 (congelado) = 800
      await expect(
        sociosService.retirarAhorro(
          {
            socioId: 123,
            monto: 850, // Mayor al disponible
            metodo: 'EFECTIVO',
          },
          1
        )
      ).rejects.toThrow(/ahorro disponible insuficiente/i);
    });
  });

  describe('obtenerSocioPorId', () => {
    it('debe retornar socio existente', async () => {
      const mockSocio = {
        id: 123,
        codigo: 'SOC-2025-0123',
        nombreCompleto: 'Juan Pérez',
        estado: EstadoSocio.ACTIVO,
      };

      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);

      const resultado = await sociosService.obtenerSocioPorId(123);

      expect(resultado).toBeDefined();
      expect(resultado.id).toBe(123);
    });

    it('debe lanzar error si socio no existe', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(sociosService.obtenerSocioPorId(999)).rejects.toThrow(
        /no encontrado/i
      );
    });
  });

  describe('listarSocios', () => {
    it('debe retornar lista paginada de socios', async () => {
      const mockSocios = [
        { id: 1, codigo: 'SOC-2025-0001', nombreCompleto: 'Socio 1' },
        { id: 2, codigo: 'SOC-2025-0002', nombreCompleto: 'Socio 2' },
      ];

      (prisma.socio.findMany as jest.Mock).mockResolvedValue(mockSocios);
      (prisma.socio.count as jest.Mock).mockResolvedValue(50);

      const resultado = await sociosService.listarSocios({
        page: 1,
        limit: 20,
      });

      expect(resultado.socios).toHaveLength(2);
      expect(resultado.total).toBe(50);
      expect(resultado.totalPages).toBe(3);
    });

    it('debe filtrar por estado', async () => {
      (prisma.socio.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.socio.count as jest.Mock).mockResolvedValue(0);

      await sociosService.listarSocios({
        page: 1,
        limit: 20,
        estado: EstadoSocio.ACTIVO,
      });

      expect(prisma.socio.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estado: EstadoSocio.ACTIVO,
          }),
        })
      );
    });
  });

  describe('suspenderSocio', () => {
    it('debe suspender socio ACTIVO', async () => {
      const mockSocio = {
        id: 123,
        codigo: 'SOC-2025-0123',
        estado: EstadoSocio.ACTIVO,
      };

      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);
      (prisma.socio.update as jest.Mock).mockResolvedValue({
        ...mockSocio,
        estado: EstadoSocio.SUSPENDIDO,
      });

      const resultado = await sociosService.suspenderSocio(
        123,
        'Incumplimiento de políticas',
        1
      );

      expect(resultado.estado).toBe(EstadoSocio.SUSPENDIDO);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('debe rechazar suspender socio ya suspendido', async () => {
      const mockSocio = {
        id: 123,
        estado: EstadoSocio.SUSPENDIDO,
      };

      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);

      await expect(
        sociosService.suspenderSocio(123, 'Motivo', 1)
      ).rejects.toThrow(/ya está suspendido/i);
    });
  });

  describe('reactivarSocio', () => {
    it('debe reactivar socio SUSPENDIDO', async () => {
      const mockSocio = {
        id: 123,
        codigo: 'SOC-2025-0123',
        estado: EstadoSocio.SUSPENDIDO,
      };

      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);
      (prisma.socio.update as jest.Mock).mockResolvedValue({
        ...mockSocio,
        estado: EstadoSocio.ACTIVO,
      });

      const resultado = await sociosService.reactivarSocio(123, 1);

      expect(resultado.estado).toBe(EstadoSocio.ACTIVO);
    });

    it('debe rechazar reactivar socio ya ACTIVO', async () => {
      const mockSocio = {
        id: 123,
        estado: EstadoSocio.ACTIVO,
      };

      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);

      await expect(sociosService.reactivarSocio(123, 1)).rejects.toThrow(
        /ya está activo/i
      );
    });
  });

  describe('cambiarEtapa', () => {
    it('debe permitir cambio de etapa administrativo', async () => {
      const mockSocio = {
        id: 123,
        etapaActual: 1,
        creditosEtapaActual: 2,
      };

      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);
      (prisma.socio.update as jest.Mock).mockResolvedValue({
        ...mockSocio,
        etapaActual: 2,
        creditosEtapaActual: 0,
      });

      const resultado = await sociosService.cambiarEtapa(
        {
          socioId: 123,
          nuevaEtapa: 2,
          motivoAdministrativo: 'Cambio manual por comportamiento ejemplar',
        },
        1
      );

      expect(resultado.etapaActual).toBe(2);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('debe rechazar etapa inválida', async () => {
      await expect(
        sociosService.cambiarEtapa(
          {
            socioId: 123,
            nuevaEtapa: 5, // Inválida
          },
          1
        )
      ).rejects.toThrow(/etapa.*1.*2.*3/i);
    });
  });
});
