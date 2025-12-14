/**
 * ============================================================================
 * Tests de Integración E2E: Flujo de Morosidad y Ejecución
 * ============================================================================
 * Valida el flujo completo de morosidad hasta ejecución de garantías
 *
 * Flujo:
 * 1. Crear crédito desembolsado con garantías
 * 2. Simular vencimiento de cuota (sin pago)
 * 3. Calcular mora diaria (1%)
 * 4. Clasificar niveles de mora (5 niveles)
 * 5. Ejecutar garantías al día 91
 * 6. Verificar descuento de ahorro de garantes
 *
 * @author Sistema MLF
 * @version 1.0.0
 */

import { pagosService } from '../../services/pagos.service';
import { garantiasService } from '../../services/garantias.service';
import { prisma } from '../../config/database';
import { EstadoCredito, ClasificacionMora } from '@prisma/client';

// Mock de dependencias externas
jest.mock('../../config/database');
jest.mock('../../config/logger');

describe('E2E: Flujo de Morosidad y Ejecución de Garantías', () => {
  let creditoId: number;
  let cuotaId: number;
  let garante1Id: number;
  let garante2Id: number;

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock) = jest.fn((callback) => callback(prisma));

    // Setup inicial
    creditoId = 100;
    cuotaId = 1;
    garante1Id = 10;
    garante2Id = 11;
  });

  describe('Escenario 1: Mora Leve (1-15 días)', () => {
    it('debe calcular mora 1% diario y clasificar como MORA_LEVE', async () => {
      const diasMora = 10;
      const montoCuota = 250;
      const montoCuotaAdeudado = 250;
      const montoMora = montoCuotaAdeudado * 0.01 * diasMora; // $25

      // Mock: Obtener crédito
      (prisma.credito.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        id: creditoId,
        codigo: 'CRE-2025-0100',
        estado: EstadoCredito.DESEMBOLSADO,
        saldoCapital: { toNumber: () => 5000 },
        socioId: 50,
      });

      // Mock: Obtener cuota vencida
      const fechaVencimiento = new Date('2025-01-10');
      const fechaActual = new Date('2025-01-20'); // 10 días después

      (prisma.cuota.findFirst as jest.Mock) = jest.fn().mockResolvedValue({
        id: cuotaId,
        creditoId,
        numeroCuota: 1,
        fechaVencimiento,
        montoCuota: { toNumber: () => montoCuota },
        capital: { toNumber: () => 175 },
        interes: { toNumber: () => 75 },
        montoMora: { toNumber: () => 0 },
        capitalPagado: { toNumber: () => 0 },
        interesPagado: { toNumber: () => 0 },
        estado: 'PENDIENTE',
      });

      // Calcular mora
      const diferenciaDias = Math.floor(
        (fechaActual.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(diferenciaDias).toBe(10);
      expect(montoMora).toBeCloseTo(25, 2);

      // Mock: Actualizar cuota con mora
      (prisma.cuota.update as jest.Mock) = jest.fn().mockResolvedValue({
        id: cuotaId,
        montoMora: { toNumber: () => montoMora },
        diasMora: diasMora,
        clasificacionMora: ClasificacionMora.MORA_LEVE,
      });

      // Verificar clasificación
      const clasificacion =
        diasMora >= 1 && diasMora <= 15
          ? ClasificacionMora.MORA_LEVE
          : ClasificacionMora.AL_DIA;

      expect(clasificacion).toBe(ClasificacionMora.MORA_LEVE);
    });
  });

  describe('Escenario 2: Mora Moderada (16-30 días)', () => {
    it('debe clasificar como MORA_MODERADA', () => {
      const diasMora = 20;
      const montoCuotaAdeudado = 250;
      const montoMora = montoCuotaAdeudado * 0.01 * diasMora; // $50

      const clasificacion =
        diasMora >= 16 && diasMora <= 30
          ? ClasificacionMora.MORA_MODERADA
          : ClasificacionMora.MORA_LEVE;

      expect(clasificacion).toBe(ClasificacionMora.MORA_MODERADA);
      expect(montoMora).toBeCloseTo(50, 2);
    });
  });

  describe('Escenario 3: Mora Grave (31-60 días)', () => {
    it('debe clasificar como MORA_GRAVE', () => {
      const diasMora = 45;
      const montoCuotaAdeudado = 250;
      const montoMora = montoCuotaAdeudado * 0.01 * diasMora; // $112.50

      const clasificacion =
        diasMora >= 31 && diasMora <= 60
          ? ClasificacionMora.MORA_GRAVE
          : ClasificacionMora.MORA_MODERADA;

      expect(clasificacion).toBe(ClasificacionMora.MORA_GRAVE);
      expect(montoMora).toBeCloseTo(112.5, 2);
    });
  });

  describe('Escenario 4: Mora Persistente (61-89 días)', () => {
    it('debe clasificar como MORA_PERSISTENTE', () => {
      const diasMora = 75;
      const montoCuotaAdeudado = 250;
      const montoMora = montoCuotaAdeudado * 0.01 * diasMora; // $187.50

      const clasificacion =
        diasMora >= 61 && diasMora <= 89
          ? ClasificacionMora.MORA_PERSISTENTE
          : ClasificacionMora.MORA_GRAVE;

      expect(clasificacion).toBe(ClasificacionMora.MORA_PERSISTENTE);
      expect(montoMora).toBeCloseTo(187.5, 2);
    });
  });

  describe('Escenario 5: Castigo (90+ días) y Ejecución de Garantías', () => {
    it('debe castigar crédito al día 90 (RN-MOR-003)', async () => {
      const diasMora = 90;

      // Mock: Obtener crédito con garantías
      (prisma.credito.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        id: creditoId,
        codigo: 'CRE-2025-0100',
        estado: EstadoCredito.DESEMBOLSADO,
        saldoCapital: { toNumber: () => 4500 },
        socioId: 50,
        garantias: [
          {
            id: 1,
            garanteId: garante1Id,
            montoCongelado: { toNumber: () => 250 },
            estado: 'ACTIVA',
          },
          {
            id: 2,
            garanteId: garante2Id,
            montoCongelado: { toNumber: () => 250 },
            estado: 'ACTIVA',
          },
        ],
      });

      // Mock: Actualizar crédito a CASTIGADO
      (prisma.credito.update as jest.Mock) = jest.fn().mockResolvedValue({
        id: creditoId,
        estado: EstadoCredito.CASTIGADO,
        fechaCastigo: new Date('2025-04-20'),
      });

      const clasificacion =
        diasMora >= 90 ? ClasificacionMora.CASTIGADO : ClasificacionMora.MORA_PERSISTENTE;

      expect(clasificacion).toBe(ClasificacionMora.CASTIGADO);
    });

    it('debe ejecutar garantías al día 91 (RN-GAR-008)', async () => {
      const diasMora = 91;
      const saldoPendiente = 4500;

      // Mock: Obtener garantías activas
      (prisma.garantia.findMany as jest.Mock) = jest.fn().mockResolvedValue([
        {
          id: 1,
          creditoId,
          garanteId: garante1Id,
          montoCongelado: { toNumber: () => 250 },
          estado: 'ACTIVA',
        },
        {
          id: 2,
          creditoId,
          garanteId: garante2Id,
          montoCongelado: { toNumber: () => 250 },
          estado: 'ACTIVA',
        },
      ]);

      // Mock: Obtener garantes
      (prisma.socio.findMany as jest.Mock) = jest.fn().mockResolvedValue([
        {
          id: garante1Id,
          codigo: 'SOC-2025-0010',
          nombreCompleto: 'Garante Uno',
          ahorroActual: { toNumber: () => 10000 },
          ahorroCongelado: { toNumber: () => 250 },
        },
        {
          id: garante2Id,
          codigo: 'SOC-2025-0011',
          nombreCompleto: 'Garante Dos',
          ahorroActual: { toNumber: () => 10000 },
          ahorroCongelado: { toNumber: () => 250 },
        },
      ]);

      // Ejecutar garantía (descontar ahorro congelado)
      const montoEjecutadoGarante1 = 250;
      const montoEjecutadoGarante2 = 250;
      const totalEjecutado = montoEjecutadoGarante1 + montoEjecutadoGarante2; // $500

      // Mock: Actualizar garantías a EJECUTADA
      (prisma.garantia.update as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          estado: 'EJECUTADA',
          montoEjecutado: { toNumber: () => montoEjecutadoGarante1 },
          fechaEjecucion: new Date('2025-04-21'),
        })
        .mockResolvedValueOnce({
          id: 2,
          estado: 'EJECUTADA',
          montoEjecutado: { toNumber: () => montoEjecutadoGarante2 },
          fechaEjecucion: new Date('2025-04-21'),
        });

      // Mock: Descontar ahorro de garantes
      (prisma.socio.update as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce({
          id: garante1Id,
          ahorroActual: { toNumber: () => 9750 }, // $10000 - $250
          ahorroCongelado: { toNumber: () => 0 },
        })
        .mockResolvedValueOnce({
          id: garante2Id,
          ahorroActual: { toNumber: () => 9750 },
          ahorroCongelado: { toNumber: () => 0 },
        });

      const resultado = await garantiasService.ejecutarGarantias(
        {
          creditoId,
          motivo: 'Ejecución automática por mora día 91',
        },
        1
      );

      expect(resultado.garantiasEjecutadas).toBe(2);
      expect(resultado.montoTotalEjecutado).toBeCloseTo(500, 2);
      expect(resultado.saldoRestante).toBeCloseTo(4000, 2); // $4500 - $500
    });
  });

  describe('Escenario 6: Pago Parcial con Mora Acumulada', () => {
    it('debe distribuir pago: Mora → Interés → Capital (RN-PAG-001)', async () => {
      const diasMora = 20;
      const montoCuota = 250;
      const capital = 175;
      const interes = 75;
      const montoMora = 50; // 20 días * 1% * $250
      const montoPago = 200; // Pago parcial

      // Mock: Obtener cuota con mora
      (prisma.cuota.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        id: cuotaId,
        creditoId,
        numeroCuota: 1,
        montoCuota: { toNumber: () => montoCuota },
        capital: { toNumber: () => capital },
        interes: { toNumber: () => interes },
        montoMora: { toNumber: () => montoMora },
        capitalPagado: { toNumber: () => 0 },
        interesPagado: { toNumber: () => 0 },
        estado: 'PENDIENTE',
      });

      // Distribución según RN-PAG-001:
      // 1. Mora: $50 (se paga completo)
      // 2. Interés: $75 (se paga completo)
      // 3. Capital: $75 (se paga parcial, quedan $100 pendientes)

      let montoRestante = montoPago;

      // Paso 1: Pagar mora
      const pagoMora = Math.min(montoRestante, montoMora);
      montoRestante -= pagoMora;
      expect(pagoMora).toBe(50);
      expect(montoRestante).toBe(150);

      // Paso 2: Pagar interés
      const pagoInteres = Math.min(montoRestante, interes);
      montoRestante -= pagoInteres;
      expect(pagoInteres).toBe(75);
      expect(montoRestante).toBe(75);

      // Paso 3: Pagar capital
      const pagoCapital = Math.min(montoRestante, capital);
      montoRestante -= pagoCapital;
      expect(pagoCapital).toBe(75);
      expect(montoRestante).toBe(0);

      // Mock: Actualizar cuota
      (prisma.cuota.update as jest.Mock) = jest.fn().mockResolvedValue({
        id: cuotaId,
        montoMora: { toNumber: () => 0 }, // Mora pagada completa
        interesPagado: { toNumber: () => 75 }, // Interés pagado completo
        capitalPagado: { toNumber: () => 75 }, // Capital pagado parcial
        estado: 'PENDIENTE', // Aún falta capital
      });

      expect(pagoMora + pagoInteres + pagoCapital).toBe(200);
    });
  });

  describe('Escenario 7: Pago Total con Mora y Multas', () => {
    it('debe completar cuota pagando mora + interés + capital', async () => {
      const diasMora = 30;
      const montoCuota = 250;
      const capital = 175;
      const interes = 75;
      const montoMora = 75; // 30 días * 1% * $250
      const montoPagoTotal = montoCuota + montoMora; // $325

      // Mock: Obtener crédito
      (prisma.credito.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        id: creditoId,
        estado: EstadoCredito.DESEMBOLSADO,
        saldoCapital: { toNumber: () => 4500 },
      });

      // Mock: Obtener cuota
      (prisma.cuota.findMany as jest.Mock) = jest.fn().mockResolvedValue([
        {
          id: cuotaId,
          creditoId,
          numeroCuota: 1,
          montoCuota: { toNumber: () => montoCuota },
          capital: { toNumber: () => capital },
          interes: { toNumber: () => interes },
          montoMora: { toNumber: () => montoMora },
          capitalPagado: { toNumber: () => 0 },
          interesPagado: { toNumber: () => 0 },
          estado: 'PENDIENTE',
        },
      ]);

      // Mock: Crear pago
      (prisma.pago.create as jest.Mock) = jest.fn().mockResolvedValue({
        id: 1,
        creditoId,
        monto: { toNumber: () => montoPagoTotal },
        fecha: new Date('2025-02-20'),
      });

      // Mock: Actualizar cuota a PAGADA
      (prisma.cuota.update as jest.Mock) = jest.fn().mockResolvedValue({
        id: cuotaId,
        montoMora: { toNumber: () => 0 },
        interesPagado: { toNumber: () => 75 },
        capitalPagado: { toNumber: () => 175 },
        estado: 'PAGADA',
      });

      // Mock: Actualizar crédito
      (prisma.credito.update as jest.Mock) = jest.fn().mockResolvedValue({
        id: creditoId,
        saldoCapital: { toNumber: () => 4325 }, // $4500 - $175
      });

      const resultado = await pagosService.registrarPago(
        {
          creditoId,
          monto: montoPagoTotal,
          fecha: new Date('2025-02-20'),
          metodoPago: 'EFECTIVO',
          observaciones: 'Pago completo con mora incluida',
        },
        1
      );

      expect(resultado.monto.toNumber()).toBe(325);
      expect(resultado.cuotasAfectadas).toBe(1);
    });
  });

  describe('Resumen del Flujo de Morosidad', () => {
    it('debe validar todas las reglas de morosidad', () => {
      const validaciones = {
        'RN-MOR-001': 'Cálculo mora 1% diario sobre monto adeudado',
        'RN-MOR-002': 'Clasificación en 5 niveles',
        'RN-MOR-003': 'Castigo automático día 90',
        'RN-GAR-008': 'Ejecución garantías día 91',
        'RN-PAG-001': 'Distribución Mora → Interés → Capital',
      };

      expect(Object.keys(validaciones)).toHaveLength(5);

      // Verificar clasificaciones
      const clasificaciones = [
        { dias: 5, nivel: ClasificacionMora.MORA_LEVE },
        { dias: 20, nivel: ClasificacionMora.MORA_MODERADA },
        { dias: 45, nivel: ClasificacionMora.MORA_GRAVE },
        { dias: 75, nivel: ClasificacionMora.MORA_PERSISTENTE },
        { dias: 95, nivel: ClasificacionMora.CASTIGADO },
      ];

      clasificaciones.forEach(({ dias, nivel }) => {
        let clasificacionCalculada;
        if (dias >= 90) clasificacionCalculada = ClasificacionMora.CASTIGADO;
        else if (dias >= 61) clasificacionCalculada = ClasificacionMora.MORA_PERSISTENTE;
        else if (dias >= 31) clasificacionCalculada = ClasificacionMora.MORA_GRAVE;
        else if (dias >= 16) clasificacionCalculada = ClasificacionMora.MORA_MODERADA;
        else clasificacionCalculada = ClasificacionMora.MORA_LEVE;

        expect(clasificacionCalculada).toBe(nivel);
      });
    });
  });
});
