/**
 * ============================================================================
 * Tests Unitarios - Servicio de Casos Extremos
 * Archivo: src/services/__tests__/casos-extremos.service.test.ts
 * ============================================================================
 */

import casosExtremosService from '../casos-extremos.service';
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

// Mock de notificacionesService
jest.mock('../notificaciones.service', () => ({
  __esModule: true,
  default: {
    enviarNotificacion: jest.fn(),
  },
  TipoNotificacion: {
    GARANTIA_EJECUTADA: 'GARANTIA_EJECUTADA',
    CREDITO_DESEMBOLSADO: 'CREDITO_DESEMBOLSADO',
  },
  CanalNotificacion: {
    EMAIL: 'EMAIL',
    SMS: 'SMS',
  },
  PrioridadNotificacion: {
    URGENTE: 'URGENTE',
  },
}));

describe('CasosExtremosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('procesarFallecimientoDeudor', () => {
    const mockSocio = {
      id: 123,
      codigo: 'SOC-2025-0123',
      nombreCompleto: 'Juan Pérez',
      estado: EstadoSocio.ACTIVO,
      creditos: [
        {
          id: 45,
          codigo: 'CRE-2025-0045',
          estado: EstadoCredito.ACTIVO,
          montoTotal: { toNumber: () => 5000 },
          saldoCapital: { toNumber: () => 3000 },
          primaSeguro: { toNumber: () => 50 },
        },
      ],
    };

    const mockFallecimientoData = {
      socioId: 123,
      creditoId: 45,
      fechaFallecimiento: new Date('2025-01-01'),
      certificadoDefuncion: 'CERT-2025-001',
    };

    it('debe procesar fallecimiento y aplicar seguro de vida', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockSocio);
      (prisma.socio.update as jest.Mock).mockResolvedValue({});
      (prisma.fondoSeguro.create as jest.Mock).mockResolvedValue({});
      (prisma.credito.update as jest.Mock).mockResolvedValue({});
      (prisma.garantia.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.auditoria.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await casosExtremosService.procesarFallecimientoDeudor(
        mockFallecimientoData,
        1
      );

      expect(resultado).toBeDefined();
      expect(resultado.montoCubierto).toBe(3000);
      expect(resultado.saldoRestante).toBe(0);
      expect(resultado.estadoCredito).toBe(EstadoCredito.COMPLETADO);

      // Verificar que se suspendió el socio
      expect(prisma.socio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoSocio.SUSPENDIDO,
          }),
        })
      );

      // Verificar que se registró en fondo de seguro
      expect(prisma.fondoSeguro.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: 'EGRESO_FALLECIMIENTO',
            monto: 3000,
          }),
        })
      );
    });

    it('debe ejecutar garantías si seguro no cubre todo', async () => {
      const mockSocioSaldoAlto = {
        ...mockSocio,
        creditos: [
          {
            ...mockSocio.creditos[0],
            saldoCapital: { toNumber: () => 6000 }, // Mayor que montoTotal (5000)
          },
        ],
      };

      const mockGarantias = [
        {
          id: 1,
          creditoId: 45,
          garanteId: 78,
          montoCongelado: { toNumber: () => 500 },
          estado: EstadoGarantia.ACTIVA,
          garante: {
            id: 78,
            nombreCompleto: 'Garante 1',
          },
        },
        {
          id: 2,
          creditoId: 45,
          garanteId: 92,
          montoCongelado: { toNumber: () => 500 },
          estado: EstadoGarantia.ACTIVA,
          garante: {
            id: 92,
            nombreCompleto: 'Garante 2',
          },
        },
      ];

      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(
        mockSocioSaldoAlto
      );
      (prisma.garantia.findMany as jest.Mock).mockResolvedValue(mockGarantias);
      (prisma.garantia.update as jest.Mock).mockResolvedValue({});
      (prisma.socio.update as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await casosExtremosService.procesarFallecimientoDeudor(
        mockFallecimientoData,
        1
      );

      // Seguro cubre $5000, quedan $1000
      expect(resultado.montoCubierto).toBe(5000);
      expect(resultado.saldoRestante).toBe(1000);
      expect(resultado.garantiasEjecutadas).toBe(true);

      // Verificar que se ejecutaron las garantías
      expect(prisma.garantia.update).toHaveBeenCalledTimes(2);
    });

    it('debe liberar garantías si seguro cubre todo', async () => {
      const mockSocioSaldoBajo = {
        ...mockSocio,
        creditos: [
          {
            ...mockSocio.creditos[0],
            saldoCapital: { toNumber: () => 2000 }, // Menor que montoTotal
          },
        ],
      };

      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(
        mockSocioSaldoBajo
      );
      (prisma.garantia.findMany as jest.Mock).mockResolvedValue([
        { id: 1, montoCongelado: { toNumber: () => 200 }, garanteId: 78 },
      ]);
      (prisma.garantia.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await casosExtremosService.procesarFallecimientoDeudor(
        mockFallecimientoData,
        1
      );

      expect(resultado.saldoRestante).toBe(0);
      expect(resultado.garantiasEjecutadas).toBe(false);

      // Verificar que se liberaron las garantías
      expect(prisma.garantia.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoGarantia.LIBERADA,
          }),
        })
      );
    });

    it('debe rechazar si socio no existe', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        casosExtremosService.procesarFallecimientoDeudor(
          mockFallecimientoData,
          1
        )
      ).rejects.toThrow(/no encontrado/i);
    });
  });

  describe('procesarFallecimientoGarante', () => {
    const mockGarante = {
      id: 78,
      codigo: 'SOC-2025-0078',
      nombreCompleto: 'Garante Principal',
      estado: EstadoSocio.ACTIVO,
      garantiasOtorgadas: [
        {
          id: 1,
          creditoId: 45,
          montoCongelado: { toNumber: () => 500 },
          estado: EstadoGarantia.ACTIVA,
          credito: {
            id: 45,
            codigo: 'CRE-2025-0045',
            socio: {
              id: 123,
              nombreCompleto: 'Deudor 1',
            },
          },
        },
        {
          id: 2,
          creditoId: 46,
          montoCongelado: { toNumber: () => 300 },
          estado: EstadoGarantia.ACTIVA,
          credito: {
            id: 46,
            codigo: 'CRE-2025-0046',
            socio: {
              id: 124,
              nombreCompleto: 'Deudor 2',
            },
          },
        },
      ],
    };

    it('debe liberar todas las garantías del garante fallecido', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockGarante);
      (prisma.socio.update as jest.Mock).mockResolvedValue({});
      (prisma.garantia.update as jest.Mock).mockResolvedValue({});
      (prisma.credito.update as jest.Mock).mockResolvedValue({});
      (prisma.auditoria.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await casosExtremosService.procesarFallecimientoGarante(
        {
          garanteId: 78,
          fechaFallecimiento: new Date('2025-01-01'),
          certificadoDefuncion: 'CERT-2025-002',
        },
        1
      );

      expect(resultado).toBeDefined();
      expect(resultado.garantiasLiberadas).toHaveLength(2);
      expect(resultado.totalLiberado).toBe(800); // 500 + 300

      // Verificar que se liberaron las garantías
      expect(prisma.garantia.update).toHaveBeenCalledTimes(2);

      // Verificar que se marcaron créditos como "requiere garantes"
      expect(prisma.credito.update).toHaveBeenCalledTimes(2);
    });

    it('debe suspender al garante fallecido', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(mockGarante);
      (prisma.socio.update as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      await casosExtremosService.procesarFallecimientoGarante(
        {
          garanteId: 78,
          fechaFallecimiento: new Date('2025-01-01'),
          certificadoDefuncion: 'CERT-2025-002',
        },
        1
      );

      expect(prisma.socio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoSocio.SUSPENDIDO,
          }),
        })
      );
    });
  });

  describe('detectarFraude', () => {
    const mockSocioFraude = {
      id: 150,
      codigo: 'SOC-2025-0150',
      nombreCompleto: 'Sospechoso',
      estado: EstadoSocio.ACTIVO,
      creditos: [
        {
          id: 50,
          codigo: 'CRE-2025-0050',
          estado: EstadoCredito.ACTIVO,
        },
      ],
    };

    it('debe suspender socio y créditos por fraude detectado', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(
        mockSocioFraude
      );
      (prisma.socio.update as jest.Mock).mockResolvedValue({});
      (prisma.credito.update as jest.Mock).mockResolvedValue({});
      (prisma.auditoria.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await casosExtremosService.detectarFraude(
        {
          socioId: 150,
          tipo: 'DOCUMENTACION',
          descripcion: 'Documentos falsificados detectados',
          evidencias: ['DOC-001.pdf', 'DOC-002.pdf'],
          gravedad: 'GRAVE',
        },
        1
      );

      expect(resultado).toBeDefined();
      expect(resultado.creditosSuspendidos).toHaveLength(1);

      // Verificar suspensión
      expect(prisma.socio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoSocio.SUSPENDIDO,
          }),
        })
      );

      // Verificar que se castigaron los créditos
      expect(prisma.credito.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoCredito.CASTIGADO,
          }),
        })
      );
    });

    it('debe registrar evidencias en auditoría', async () => {
      (prisma.socio.findUnique as jest.Mock).mockResolvedValue(
        mockSocioFraude
      );
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      await casosExtremosService.detectarFraude(
        {
          socioId: 150,
          tipo: 'IDENTIDAD',
          descripcion: 'Suplantación de identidad',
          evidencias: ['FOTO-001.jpg'],
          gravedad: 'GRAVE',
        },
        1
      );

      expect(prisma.auditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            datosNuevos: expect.objectContaining({
              tipoFraude: 'IDENTIDAD',
              gravedad: 'GRAVE',
              evidencias: ['FOTO-001.jpg'],
            }),
          }),
        })
      );
    });
  });

  describe('refinanciarCredito', () => {
    const mockCredito = {
      id: 45,
      codigo: 'CRE-2025-0045',
      estado: EstadoCredito.ACTIVO,
      socioId: 123,
      saldoCapital: { toNumber: () => 3000 },
      plazoMeses: 24,
      tasaInteresAnual: { toNumber: () => 18 },
      cuotas: [],
    };

    it('debe refinanciar crédito con nuevo plazo', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.cuota.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.credito.update as jest.Mock).mockResolvedValue({});
      (prisma.auditoria.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await casosExtremosService.refinanciarCredito(
        {
          creditoId: 45,
          nuevoPlazoMeses: 36,
          motivoRefinanciamiento: 'Dificultades económicas temporales',
        },
        1
      );

      expect(resultado).toBeDefined();
      expect(resultado.nuevoPlazosaldo).toBe(36);

      // Verificar que se cancelaron cuotas antiguas
      expect(prisma.cuota.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: 'CANCELADA',
          }),
        })
      );
    });

    it('debe aplicar quitas si se especifican', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await casosExtremosService.refinanciarCredito(
        {
          creditoId: 45,
          nuevoPlazoMeses: 30,
          motivoRefinanciamiento: 'Acuerdo especial',
          quitas: 500, // Condonar $500
        },
        1
      );

      expect(resultado.quitas).toBe(500);
      expect(resultado.nuevoSaldo).toBe(2500); // 3000 - 500
    });

    it('debe rechazar refinanciar crédito no ACTIVO', async () => {
      const creditoCompletado = {
        ...mockCredito,
        estado: EstadoCredito.COMPLETADO,
      };

      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(
        creditoCompletado
      );

      await expect(
        casosExtremosService.refinanciarCredito(
          {
            creditoId: 45,
            nuevoPlazoMeses: 36,
            motivoRefinanciamiento: 'Test',
          },
          1
        )
      ).rejects.toThrow(/ACTIVO/i);
    });
  });

  describe('condonarDeuda', () => {
    const mockCredito = {
      id: 45,
      codigo: 'CRE-2025-0045',
      socioId: 123,
      saldoCapital: { toNumber: () => 1000 },
      socio: {
        nombreCompleto: 'Juan Pérez',
      },
    };

    it('debe condonar deuda con autorización válida', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);
      (prisma.credito.update as jest.Mock).mockResolvedValue({});
      (prisma.auditoria.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const adminId = 1;
      const resultado = await casosExtremosService.condonarDeuda(
        {
          creditoId: 45,
          montoCondonado: 300,
          motivo: 'Situación de emergencia familiar',
          autorizadoPor: adminId,
        },
        adminId // Usuario debe coincidir con autorizadoPor
      );

      expect(resultado).toBeDefined();
      expect(resultado.montoCondonado).toBe(300);
      expect(resultado.nuevoSaldo).toBe(700); // 1000 - 300
    });

    it('debe rechazar si autorización no coincide', async () => {
      await expect(
        casosExtremosService.condonarDeuda(
          {
            creditoId: 45,
            montoCondonado: 300,
            motivo: 'Test',
            autorizadoPor: 2,
          },
          1 // Usuario diferente a autorizadoPor
        )
      ).rejects.toThrow(/autorizada por un administrador/i);
    });

    it('debe rechazar si monto excede saldo', async () => {
      (prisma.credito.findUnique as jest.Mock).mockResolvedValue(mockCredito);

      await expect(
        casosExtremosService.condonarDeuda(
          {
            creditoId: 45,
            montoCondonado: 1500, // Mayor que saldo de 1000
            motivo: 'Test',
            autorizadoPor: 1,
          },
          1
        )
      ).rejects.toThrow(/no puede exceder/i);
    });
  });

  describe('procesarCatastrofe', () => {
    it('debe extender plazos de créditos afectados', async () => {
      const sociosAfectados = [123, 124, 125];

      (prisma.credito.findMany as jest.Mock).mockResolvedValue([
        { id: 45, plazoMeses: 24, codigo: 'CRE-2025-0045' },
        { id: 46, plazoMeses: 12, codigo: 'CRE-2025-0046' },
      ]);
      (prisma.credito.update as jest.Mock).mockResolvedValue({});
      (prisma.cuota.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.auditoria.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma)
      );

      const resultado = await casosExtremosService.procesarCatastrofe(
        'Terremoto 7.8 - Zona Norte',
        sociosAfectados,
        3, // 3 meses de gracia
        1
      );

      expect(resultado).toBeDefined();
      expect(resultado.sociosAfectados).toBe(3);
      expect(resultado.mesesGracia).toBe(3);

      // Verificar que se llamó credito.update para cada crédito encontrado
      expect(prisma.credito.update).toHaveBeenCalled();
    });
  });
});
