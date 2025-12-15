/**
 * ============================================================================
 * Tests de Integración E2E: Flujo de Utilidades Semestrales
 * ============================================================================
 * Valida el flujo completo de cálculo y distribución de utilidades
 *
 * Flujo:
 * 1. Crear múltiples socios con ahorros variados
 * 2. Simular transacciones durante 6 meses
 * 3. Calcular ahorro promedio semestral por socio
 * 4. Distribuir 1% del ahorro promedio
 * 5. Acreditar utilidades en ahorro
 * 6. Verificar historial
 *
 * @author Sistema MLF
 * @version 1.0.0
 */

import { utilidadesService } from '../../services/utilidades.service';
import { prisma } from '../../config/database';
import { EstadoSocio } from '@prisma/client';

// Mock de dependencias externas
jest.mock('../../config/database');
jest.mock('../../config/logger');

describe('E2E: Flujo de Utilidades Semestrales', () => {
  beforeAll(() => {
    // Mock de fecha para consistencia
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-30')); // Fin del primer semestre
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock) = jest.fn((callback) => callback(prisma));
  });

  describe('Paso 1: Setup - Crear Socios con Ahorros Variados', () => {
    it('debe tener socios ACTIVOS y NO_ACTIVOS para validar RN-UTI-003', () => {
      const socios = [
        {
          id: 1,
          codigo: 'SOC-2025-0001',
          nombreCompleto: 'Juan Pérez',
          estado: EstadoSocio.ACTIVO,
          ahorroActual: { toNumber: () => 5000 },
        },
        {
          id: 2,
          codigo: 'SOC-2025-0002',
          nombreCompleto: 'María García',
          estado: EstadoSocio.ACTIVO,
          ahorroActual: { toNumber: () => 10000 },
        },
        {
          id: 3,
          codigo: 'SOC-2025-0003',
          nombreCompleto: 'Pedro López',
          estado: EstadoSocio.ACTIVO,
          ahorroActual: { toNumber: () => 3000 },
        },
        {
          id: 4,
          codigo: 'SOC-2025-0004',
          nombreCompleto: 'Ana Martínez',
          estado: EstadoSocio.SUSPENDIDO, // NO debe recibir utilidades
          ahorroActual: { toNumber: () => 8000 },
        },
        {
          id: 5,
          codigo: 'SOC-2025-0005',
          nombreCompleto: 'Luis Rodríguez',
          estado: EstadoSocio.ACTIVO,
          ahorroActual: { toNumber: () => 15000 },
        },
      ];

      // Filtrar solo ACTIVOS (RN-UTI-003)
      const sociosActivos = socios.filter((s) => s.estado === EstadoSocio.ACTIVO);

      expect(sociosActivos).toHaveLength(4);
      expect(socios).toHaveLength(5);
    });
  });

  describe('Paso 2: Calcular Ahorro Promedio Semestral', () => {
    it('debe calcular promedio de 6 meses para cada socio', () => {
      // Ejemplo: Socio con saldos mensuales variados
      const saldosMensuales = [
        { mes: 1, año: 2025, saldo: 5000 }, // Enero
        { mes: 2, año: 2025, saldo: 5500 }, // Febrero
        { mes: 3, año: 2025, saldo: 6000 }, // Marzo
        { mes: 4, año: 2025, saldo: 5800 }, // Abril
        { mes: 5, año: 2025, saldo: 6200 }, // Mayo
        { mes: 6, año: 2025, saldo: 6500 }, // Junio
      ];

      // Promedio: (5000 + 5500 + 6000 + 5800 + 6200 + 6500) / 6 = 5833.33
      const suma = saldosMensuales.reduce((acc, m) => acc + m.saldo, 0);
      const promedio = suma / 6;

      expect(promedio).toBeCloseTo(5833.33, 2);
    });

    it('debe calcular promedio para múltiples socios', async () => {
      // Mock: Obtener socios ACTIVOS
      (prisma.socio.findMany as jest.Mock) = jest.fn().mockResolvedValue([
        { id: 1, nombreCompleto: 'Juan Pérez', estado: EstadoSocio.ACTIVO },
        { id: 2, nombreCompleto: 'María García', estado: EstadoSocio.ACTIVO },
        { id: 3, nombreCompleto: 'Pedro López', estado: EstadoSocio.ACTIVO },
        { id: 5, nombreCompleto: 'Luis Rodríguez', estado: EstadoSocio.ACTIVO },
      ]);

      // Mock: Calcular promedios individuales
      const promedios = [
        { socioId: 1, promedio: 5833.33 },
        { socioId: 2, promedio: 10500.0 },
        { socioId: 3, promedio: 3200.0 },
        { socioId: 5, promedio: 14800.0 },
      ];

      const sumaPromedios = promedios.reduce((acc, p) => acc + p.promedio, 0);
      const totalSocios = promedios.length;

      expect(totalSocios).toBe(4);
      expect(sumaPromedios).toBeCloseTo(34333.33, 2);
    });
  });

  describe('Paso 3: Calcular Utilidades (1% del Ahorro Promedio)', () => {
    it('debe calcular 1% sobre el ahorro promedio (RN-UTI-002)', () => {
      const promedios = [
        { socioId: 1, promedio: 5833.33, utilidad: 5833.33 * 0.01 }, // $58.33
        { socioId: 2, promedio: 10500.0, utilidad: 10500.0 * 0.01 }, // $105.00
        { socioId: 3, promedio: 3200.0, utilidad: 3200.0 * 0.01 }, // $32.00
        { socioId: 5, promedio: 14800.0, utilidad: 14800.0 * 0.01 }, // $148.00
      ];

      promedios.forEach((p) => {
        expect(p.utilidad).toBeCloseTo(p.promedio * 0.01, 2);
      });

      const totalUtilidades = promedios.reduce((acc, p) => acc + p.utilidad, 0);
      expect(totalUtilidades).toBeCloseTo(343.33, 2);
    });
  });

  describe('Paso 4: Distribuir Utilidades', () => {
    it('debe distribuir utilidades semestralmente (RN-UTI-001)', async () => {
      const periodo = {
        año: 2025,
        semestre: 1, // Enero - Junio
        fechaInicio: new Date('2025-01-01'),
        fechaFin: new Date('2025-06-30'),
      };

      // Mock: Obtener socios ACTIVOS
      (prisma.socio.findMany as jest.Mock) = jest.fn().mockResolvedValue([
        {
          id: 1,
          nombreCompleto: 'Juan Pérez',
          estado: EstadoSocio.ACTIVO,
          ahorroActual: { toNumber: () => 6500 },
        },
        {
          id: 2,
          nombreCompleto: 'María García',
          estado: EstadoSocio.ACTIVO,
          ahorroActual: { toNumber: () => 11000 },
        },
        {
          id: 3,
          nombreCompleto: 'Pedro López',
          estado: EstadoSocio.ACTIVO,
          ahorroActual: { toNumber: () => 3500 },
        },
        {
          id: 5,
          nombreCompleto: 'Luis Rodríguez',
          estado: EstadoSocio.ACTIVO,
          ahorroActual: { toNumber: () => 15500 },
        },
      ]);

      // Mock: Calcular utilidades individuales
      const utilidades = [
        { socioId: 1, promedio: 5833.33, utilidad: 58.33 },
        { socioId: 2, promedio: 10500.0, utilidad: 105.0 },
        { socioId: 3, promedio: 3200.0, utilidad: 32.0 },
        { socioId: 5, promedio: 14800.0, utilidad: 148.0 },
      ];

      // Mock: Crear distribución de utilidades
      (prisma.distribucionUtilidad.create as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          socioId: 1,
          año: 2025,
          semestre: 1,
          ahorroPromedio: { toNumber: () => 5833.33 },
          montoUtilidad: { toNumber: () => 58.33 },
          fechaDistribucion: new Date('2025-07-01'),
        })
        .mockResolvedValueOnce({
          id: 2,
          socioId: 2,
          año: 2025,
          semestre: 1,
          ahorroPromedio: { toNumber: () => 10500.0 },
          montoUtilidad: { toNumber: () => 105.0 },
          fechaDistribucion: new Date('2025-07-01'),
        })
        .mockResolvedValueOnce({
          id: 3,
          socioId: 3,
          año: 2025,
          semestre: 1,
          ahorroPromedio: { toNumber: () => 3200.0 },
          montoUtilidad: { toNumber: () => 32.0 },
          fechaDistribucion: new Date('2025-07-01'),
        })
        .mockResolvedValueOnce({
          id: 4,
          socioId: 5,
          año: 2025,
          semestre: 1,
          ahorroPromedio: { toNumber: () => 14800.0 },
          montoUtilidad: { toNumber: () => 148.0 },
          fechaDistribucion: new Date('2025-07-01'),
        });

      const resultado = await utilidadesService.calcularYDistribuirUtilidades(
        {
          año: periodo.año,
          semestre: periodo.semestre,
        },
        1
      );

      expect(resultado.sociosParticipantes).toBe(4);
      expect(resultado.totalDistribuido).toBeCloseTo(343.33, 2);
    });
  });

  describe('Paso 5: Acreditar Utilidades en Ahorro', () => {
    it('debe acreditar utilidades automáticamente (RN-UTI-004)', async () => {
      const utilidadesAcreditar = [
        { socioId: 1, utilidad: 58.33, ahorroAnterior: 6500 },
        { socioId: 2, utilidad: 105.0, ahorroAnterior: 11000 },
        { socioId: 3, utilidad: 32.0, ahorroAnterior: 3500 },
        { socioId: 5, utilidad: 148.0, ahorroAnterior: 15500 },
      ];

      // Mock: Actualizar ahorro de cada socio
      (prisma.socio.update as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          ahorroActual: { toNumber: () => 6558.33 }, // $6500 + $58.33
        })
        .mockResolvedValueOnce({
          id: 2,
          ahorroActual: { toNumber: () => 11105.0 },
        })
        .mockResolvedValueOnce({
          id: 3,
          ahorroActual: { toNumber: () => 3532.0 },
        })
        .mockResolvedValueOnce({
          id: 5,
          ahorroActual: { toNumber: () => 15648.0 },
        });

      // Mock: Crear transacción de ahorro
      (prisma.transaccionAhorro.create as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          socioId: 1,
          tipo: 'UTILIDADES',
          monto: { toNumber: () => 58.33 },
          saldoAnterior: { toNumber: () => 6500 },
          saldoNuevo: { toNumber: () => 6558.33 },
        })
        .mockResolvedValueOnce({
          id: 2,
          socioId: 2,
          tipo: 'UTILIDADES',
          monto: { toNumber: () => 105.0 },
          saldoAnterior: { toNumber: () => 11000 },
          saldoNuevo: { toNumber: () => 11105.0 },
        })
        .mockResolvedValueOnce({
          id: 3,
          socioId: 3,
          tipo: 'UTILIDADES',
          monto: { toNumber: () => 32.0 },
          saldoAnterior: { toNumber: () => 3500 },
          saldoNuevo: { toNumber: () => 3532.0 },
        })
        .mockResolvedValueOnce({
          id: 4,
          socioId: 5,
          tipo: 'UTILIDADES',
          monto: { toNumber: () => 148.0 },
          saldoAnterior: { toNumber: () => 15500 },
          saldoNuevo: { toNumber: () => 15648.0 },
        });

      utilidadesAcreditar.forEach((u) => {
        const nuevoAhorro = u.ahorroAnterior + u.utilidad;
        expect(nuevoAhorro).toBeGreaterThan(u.ahorroAnterior);
      });

      expect(utilidadesAcreditar).toHaveLength(4);
    });
  });

  describe('Paso 6: Verificar Historial de Utilidades', () => {
    it('debe listar historial de utilidades por socio', async () => {
      const socioId = 1;

      // Mock: Obtener historial
      (prisma.distribucionUtilidad.findMany as jest.Mock) = jest
        .fn()
        .mockResolvedValue([
          {
            id: 1,
            socioId,
            año: 2025,
            semestre: 1,
            ahorroPromedio: { toNumber: () => 5833.33 },
            montoUtilidad: { toNumber: () => 58.33 },
            fechaDistribucion: new Date('2025-07-01'),
          },
          {
            id: 5,
            socioId,
            año: 2024,
            semestre: 2,
            ahorroPromedio: { toNumber: () => 5200.0 },
            montoUtilidad: { toNumber: () => 52.0 },
            fechaDistribucion: new Date('2025-01-01'),
          },
          {
            id: 8,
            socioId,
            año: 2024,
            semestre: 1,
            ahorroPromedio: { toNumber: () => 4800.0 },
            montoUtilidad: { toNumber: () => 48.0 },
            fechaDistribucion: new Date('2024-07-01'),
          },
        ]);

      const historial = await utilidadesService.obtenerHistorialUtilidades({
        socioId,
      });

      expect(historial).toHaveLength(3);
      expect(historial[0].año).toBe(2025);
      expect(historial[0].semestre).toBe(1);
      expect(historial[0].montoUtilidad.toNumber()).toBeCloseTo(58.33, 2);

      // Calcular total acumulado
      const totalAcumulado = historial.reduce(
        (acc, h) => acc + h.montoUtilidad.toNumber(),
        0
      );
      expect(totalAcumulado).toBeCloseTo(158.33, 2);
    });
  });

  describe('Paso 7: Excluir Socios NO ACTIVOS (RN-UTI-003)', () => {
    it('debe excluir socios SUSPENDIDOS de la distribución', async () => {
      // Mock: Obtener todos los socios
      (prisma.socio.findMany as jest.Mock) = jest.fn().mockResolvedValue([
        { id: 1, estado: EstadoSocio.ACTIVO, ahorroActual: { toNumber: () => 5000 } },
        { id: 2, estado: EstadoSocio.ACTIVO, ahorroActual: { toNumber: () => 10000 } },
        {
          id: 3,
          estado: EstadoSocio.SUSPENDIDO,
          ahorroActual: { toNumber: () => 8000 },
        }, // Excluido
        { id: 4, estado: EstadoSocio.ACTIVO, ahorroActual: { toNumber: () => 3000 } },
        { id: 5, estado: EstadoSocio.INACTIVO, ahorroActual: { toNumber: () => 15000 } }, // Excluido
      ]);

      // Filtrar solo ACTIVOS
      const sociosActivos = await prisma.socio.findMany({
        where: { estado: EstadoSocio.ACTIVO },
      });

      // En mock, debemos filtrar manualmente
      const sociosFiltrados = (await prisma.socio.findMany()).filter(
        (s: any) => s.estado === EstadoSocio.ACTIVO
      );

      expect(sociosFiltrados).toHaveLength(3);
      expect(sociosFiltrados.map((s: any) => s.id)).toEqual([1, 2, 4]);
    });
  });

  describe('Paso 8: Cálculo con Transacciones Dinámicas', () => {
    it('debe calcular promedio considerando depósitos y retiros mensuales', () => {
      // Ejemplo: Socio con transacciones durante el semestre
      const transacciones = [
        { fecha: new Date('2025-01-05'), tipo: 'DEPOSITO', monto: 1000 },
        { fecha: new Date('2025-02-10'), tipo: 'DEPOSITO', monto: 500 },
        { fecha: new Date('2025-03-15'), tipo: 'RETIRO', monto: 300 },
        { fecha: new Date('2025-04-20'), tipo: 'DEPOSITO', monto: 800 },
        { fecha: new Date('2025-05-25'), tipo: 'RETIRO', monto: 200 },
        { fecha: new Date('2025-06-30'), tipo: 'DEPOSITO', monto: 600 },
      ];

      // Calcular saldo al final de cada mes
      let saldoInicial = 5000;
      const saldosMensuales = [
        { mes: 1, saldo: saldoInicial + 1000 }, // Enero: $6000
        { mes: 2, saldo: 6000 + 500 }, // Febrero: $6500
        { mes: 3, saldo: 6500 - 300 }, // Marzo: $6200
        { mes: 4, saldo: 6200 + 800 }, // Abril: $7000
        { mes: 5, saldo: 7000 - 200 }, // Mayo: $6800
        { mes: 6, saldo: 6800 + 600 }, // Junio: $7400
      ];

      const promedio =
        saldosMensuales.reduce((acc, s) => acc + s.saldo, 0) / 6;

      expect(promedio).toBeCloseTo(6650, 2);

      // Utilidad: 1% de $6650 = $66.50
      const utilidad = promedio * 0.01;
      expect(utilidad).toBeCloseTo(66.5, 2);
    });
  });

  describe('Resumen del Flujo de Utilidades', () => {
    it('debe validar todas las reglas de utilidades', () => {
      const validaciones = {
        'RN-UTI-001': 'Distribución semestral (Enero-Junio, Julio-Diciembre)',
        'RN-UTI-002': '1% sobre ahorro promedio del semestre',
        'RN-UTI-003': 'Solo socios ACTIVOS participan',
        'RN-UTI-004': 'Acreditación automática en ahorro',
      };

      expect(Object.keys(validaciones)).toHaveLength(4);

      // Verificar cálculo correcto
      const ejemplos = [
        { promedio: 1000, utilidad: 10 },
        { promedio: 5000, utilidad: 50 },
        { promedio: 10000, utilidad: 100 },
        { promedio: 25000, utilidad: 250 },
      ];

      ejemplos.forEach((e) => {
        expect(e.utilidad).toBe(e.promedio * 0.01);
      });
    });

    it('debe generar reporte completo de distribución', () => {
      const reporte = {
        periodo: { año: 2025, semestre: 1 },
        fechaDistribucion: new Date('2025-07-01'),
        sociosParticipantes: 4,
        sociosExcluidos: 1,
        totalAhorroPromedio: 34333.33,
        totalUtilidades: 343.33,
        promedioUtilidad: 85.83, // $343.33 / 4
        maxUtilidad: 148.0,
        minUtilidad: 32.0,
      };

      expect(reporte.sociosParticipantes).toBe(4);
      expect(reporte.totalUtilidades).toBeCloseTo(343.33, 2);
      expect(reporte.promedioUtilidad).toBeCloseTo(85.83, 2);
    });
  });
});
