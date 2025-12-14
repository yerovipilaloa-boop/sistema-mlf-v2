/**
 * ============================================================================
 * Sistema MLF - Tests del Servicio de Amortización
 * Archivo: src/services/__tests__/amortization.service.test.ts
 * Descripción: Tests unitarios para algoritmos de amortización
 * ============================================================================
 */

import amortizationService from '../amortization.service';
import { MetodoAmortizacion } from '../../types';

describe('AmortizationService', () => {
  describe('Método Francés (Cuota Fija)', () => {
    it('debe calcular correctamente una tabla de amortización con cuota fija', () => {
      const input = {
        montoTotal: 1000,
        tasaInteresAnual: 18, // 1.5% mensual
        plazoMeses: 12,
        metodo: MetodoAmortizacion.FRANCES,
        fechaDesembolso: new Date('2025-01-01'),
      };

      const tabla = amortizationService.calcularTablaAmortizacion(input);

      // Verificar estructura
      expect(tabla.cuotas).toHaveLength(12);
      expect(tabla.resumen.totalCapital).toBe(1000);

      // Verificar que todas las cuotas sean aproximadamente iguales (cuota fija)
      const cuotasUnicas = new Set(tabla.cuotas.map((c) => Math.round(c.montoCuota)));
      expect(cuotasUnicas.size).toBeLessThanOrEqual(2); // Puede haber ajuste en última cuota

      // Verificar que el total pagado = capital + intereses
      expect(tabla.resumen.totalAPagar).toBe(
        tabla.resumen.totalCapital + tabla.resumen.totalIntereses
      );

      // Verificar que saldo final es 0
      expect(tabla.cuotas[11].saldoRestante).toBe(0);

      // Verificar fórmula aproximada de cuota fija
      // Para $1,000 al 1.5% mensual en 12 meses, cuota ≈ $91.68
      expect(tabla.cuotas[0].montoCuota).toBeCloseTo(91.68, 1);
    });

    it('debe tener intereses decrecientes y capital creciente', () => {
      const input = {
        montoTotal: 1000,
        tasaInteresAnual: 18,
        plazoMeses: 12,
        metodo: MetodoAmortizacion.FRANCES,
        fechaDesembolso: new Date('2025-01-01'),
      };

      const tabla = amortizationService.calcularTablaAmortizacion(input);

      // Primera cuota: más interés, menos capital
      const primeraCuota = tabla.cuotas[0];
      const ultimaCuota = tabla.cuotas[11];

      expect(primeraCuota.interes).toBeGreaterThan(ultimaCuota.interes);
      expect(primeraCuota.capital).toBeLessThan(ultimaCuota.capital);
    });

    it('debe calcular correctamente con tasa de interés 0%', () => {
      const input = {
        montoTotal: 1200,
        tasaInteresAnual: 0,
        plazoMeses: 12,
        metodo: MetodoAmortizacion.FRANCES,
        fechaDesembolso: new Date('2025-01-01'),
      };

      const tabla = amortizationService.calcularTablaAmortizacion(input);

      // Con 0% de interés, cada cuota debe ser monto/plazo
      expect(tabla.cuotas[0].montoCuota).toBe(100);
      expect(tabla.cuotas[0].interes).toBe(0);
      expect(tabla.cuotas[0].capital).toBe(100);
      expect(tabla.resumen.totalIntereses).toBe(0);
      expect(tabla.resumen.totalAPagar).toBe(1200);
    });
  });

  describe('Método Alemán (Capital Fijo)', () => {
    it('debe calcular correctamente una tabla de amortización con capital fijo', () => {
      const input = {
        montoTotal: 1000,
        tasaInteresAnual: 18, // 1.5% mensual
        plazoMeses: 12,
        metodo: MetodoAmortizacion.ALEMAN,
        fechaDesembolso: new Date('2025-01-01'),
      };

      const tabla = amortizationService.calcularTablaAmortizacion(input);

      // Verificar estructura
      expect(tabla.cuotas).toHaveLength(12);
      expect(tabla.resumen.totalCapital).toBe(1000);

      // Verificar que el capital sea fijo en todas las cuotas
      const capitalFijo = 1000 / 12; // ≈ 83.33
      tabla.cuotas.forEach((cuota) => {
        expect(cuota.capital).toBeCloseTo(capitalFijo, 2);
      });

      // Verificar que saldo final es 0
      expect(tabla.cuotas[11].saldoRestante).toBe(0);

      // Primera cuota debe ser mayor que última (interés decreciente)
      expect(tabla.cuotas[0].montoCuota).toBeGreaterThan(tabla.cuotas[11].montoCuota);
    });

    it('debe tener cuotas decrecientes (capital fijo + interés decreciente)', () => {
      const input = {
        montoTotal: 1000,
        tasaInteresAnual: 18,
        plazoMeses: 12,
        metodo: MetodoAmortizacion.ALEMAN,
        fechaDesembolso: new Date('2025-01-01'),
      };

      const tabla = amortizationService.calcularTablaAmortizacion(input);

      // Verificar que cuotas sean decrecientes
      for (let i = 0; i < tabla.cuotas.length - 1; i++) {
        expect(tabla.cuotas[i].montoCuota).toBeGreaterThanOrEqual(
          tabla.cuotas[i + 1].montoCuota
        );
      }

      // Verificar que intereses sean decrecientes
      for (let i = 0; i < tabla.cuotas.length - 1; i++) {
        expect(tabla.cuotas[i].interes).toBeGreaterThan(tabla.cuotas[i + 1].interes);
      }
    });
  });

  describe('Comparación de Métodos', () => {
    it('debe comparar correctamente ambos métodos', () => {
      const comparacion = amortizationService.compararMetodos(
        10000,
        18,
        24,
        new Date('2025-01-01')
      );

      // Verificar que ambas tablas se generaron
      expect(comparacion.frances.cuotas).toHaveLength(24);
      expect(comparacion.aleman.cuotas).toHaveLength(24);

      // Método Alemán debe tener menos intereses totales
      expect(comparacion.aleman.resumen.totalIntereses).toBeLessThan(
        comparacion.frances.resumen.totalIntereses
      );

      // Verificar diferencias
      expect(comparacion.comparacion.diferenciaIntereses).toBeGreaterThan(0);
      expect(comparacion.comparacion.diferenciaPrimeraCuota).toBeLessThan(0); // Alemán tiene primera cuota mayor
      expect(comparacion.comparacion.diferenciaUltimaCuota).toBeGreaterThan(0); // Francés tiene última cuota mayor

      // Debe tener una recomendación
      expect(comparacion.comparacion.metodoRecomendado).toBeDefined();
      expect(comparacion.comparacion.razonRecomendacion).toBeTruthy();
    });

    it('método alemán debe ahorrar intereses en créditos largos', () => {
      const comparacion = amortizationService.compararMetodos(
        50000,
        24, // 2% mensual - tasa alta
        60, // 5 años
        new Date('2025-01-01')
      );

      const ahorroIntereses = comparacion.comparacion.diferenciaIntereses;

      // Con tasa alta y plazo largo, el ahorro debe ser significativo
      expect(ahorroIntereses).toBeGreaterThan(1000);

      // Debería recomendar método Alemán
      expect(comparacion.comparacion.metodoRecomendado).toBe(MetodoAmortizacion.ALEMAN);
    });
  });

  describe('Cálculo de Mora', () => {
    it('debe calcular correctamente el interés de mora', () => {
      const resultado = amortizationService.calcularMontoCuotaConMora(
        100, // Monto cuota
        30, // 30 días de mora
        1 // 1% diario
      );

      // Interés mora = 100 * 0.01 * 30 = 30
      expect(resultado.montoCuota).toBe(100);
      expect(resultado.intereseMora).toBe(30);
      expect(resultado.montoTotal).toBe(130);
    });

    it('debe calcular mora con días fraccionados correctamente', () => {
      const resultado = amortizationService.calcularMontoCuotaConMora(
        500,
        15,
        1 // 1% diario
      );

      // Interés mora = 500 * 0.01 * 15 = 75
      expect(resultado.intereseMora).toBe(75);
      expect(resultado.montoTotal).toBe(575);
    });
  });

  describe('Distribución de Pagos', () => {
    it('debe aplicar pago en orden: Mora → Interés → Capital', () => {
      const resultado = amortizationService.distribuirPago(
        100, // Pago
        30, // Mora adeudada
        20, // Interés adeudado
        50 // Capital adeudado
      );

      // Pagar primero mora (30), luego interés (20), luego capital (50)
      expect(resultado.aplicadoMora).toBe(30);
      expect(resultado.aplicadoInteres).toBe(20);
      expect(resultado.aplicadoCapital).toBe(50);
      expect(resultado.sobrante).toBe(0);
    });

    it('debe aplicar pago parcial solo a mora', () => {
      const resultado = amortizationService.distribuirPago(
        20, // Pago parcial
        30, // Mora adeudada
        20, // Interés adeudado
        100 // Capital adeudado
      );

      expect(resultado.aplicadoMora).toBe(20);
      expect(resultado.aplicadoInteres).toBe(0);
      expect(resultado.aplicadoCapital).toBe(0);
      expect(resultado.sobrante).toBe(0);
    });

    it('debe calcular sobrante como prepago de capital', () => {
      const resultado = amortizationService.distribuirPago(
        200, // Pago excedente
        30, // Mora adeudada
        20, // Interés adeudado
        100 // Capital adeudado
      );

      expect(resultado.aplicadoMora).toBe(30);
      expect(resultado.aplicadoInteres).toBe(20);
      expect(resultado.aplicadoCapital).toBe(100);
      expect(resultado.sobrante).toBe(50); // Prepago adicional
    });
  });

  describe('Validaciones', () => {
    it('debe rechazar monto negativo o cero', () => {
      expect(() =>
        amortizationService.calcularTablaAmortizacion({
          montoTotal: 0,
          tasaInteresAnual: 18,
          plazoMeses: 12,
          metodo: MetodoAmortizacion.FRANCES,
          fechaDesembolso: new Date(),
        })
      ).toThrow();

      expect(() =>
        amortizationService.calcularTablaAmortizacion({
          montoTotal: -1000,
          tasaInteresAnual: 18,
          plazoMeses: 12,
          metodo: MetodoAmortizacion.FRANCES,
          fechaDesembolso: new Date(),
        })
      ).toThrow();
    });

    it('debe rechazar plazo inválido', () => {
      expect(() =>
        amortizationService.calcularTablaAmortizacion({
          montoTotal: 1000,
          tasaInteresAnual: 18,
          plazoMeses: 0,
          metodo: MetodoAmortizacion.FRANCES,
          fechaDesembolso: new Date(),
        })
      ).toThrow();

      expect(() =>
        amortizationService.calcularTablaAmortizacion({
          montoTotal: 1000,
          tasaInteresAnual: 18,
          plazoMeses: 100, // Más de 60 (máximo configurado)
          metodo: MetodoAmortizacion.FRANCES,
          fechaDesembolso: new Date(),
        })
      ).toThrow();
    });

    it('debe rechazar tasa de interés inválida', () => {
      expect(() =>
        amortizationService.calcularTablaAmortizacion({
          montoTotal: 1000,
          tasaInteresAnual: -5,
          plazoMeses: 12,
          metodo: MetodoAmortizacion.FRANCES,
          fechaDesembolso: new Date(),
        })
      ).toThrow();

      expect(() =>
        amortizationService.calcularTablaAmortizacion({
          montoTotal: 1000,
          tasaInteresAnual: 150, // Más de 100%
          plazoMeses: 12,
          metodo: MetodoAmortizacion.FRANCES,
          fechaDesembolso: new Date(),
        })
      ).toThrow();
    });
  });

  describe('Casos Extremos', () => {
    it('debe manejar crédito a muy corto plazo (6 meses)', () => {
      const tabla = amortizationService.calcularTablaAmortizacion({
        montoTotal: 500,
        tasaInteresAnual: 18,
        plazoMeses: 6,
        metodo: MetodoAmortizacion.FRANCES,
        fechaDesembolso: new Date('2025-01-01'),
      });

      expect(tabla.cuotas).toHaveLength(6);
      expect(tabla.cuotas[5].saldoRestante).toBe(0);
      expect(tabla.resumen.totalCapital).toBe(500);
    });

    it('debe manejar crédito a muy largo plazo (60 meses)', () => {
      const tabla = amortizationService.calcularTablaAmortizacion({
        montoTotal: 10000,
        tasaInteresAnual: 12,
        plazoMeses: 60,
        metodo: MetodoAmortizacion.FRANCES,
        fechaDesembolso: new Date('2025-01-01'),
      });

      expect(tabla.cuotas).toHaveLength(60);
      expect(tabla.cuotas[59].saldoRestante).toBe(0);
      expect(tabla.resumen.totalCapital).toBe(10000);
    });

    it('debe manejar crédito con monto muy pequeño', () => {
      const tabla = amortizationService.calcularTablaAmortizacion({
        montoTotal: 50,
        tasaInteresAnual: 18,
        plazoMeses: 6,
        metodo: MetodoAmortizacion.FRANCES,
        fechaDesembolso: new Date('2025-01-01'),
      });

      expect(tabla.cuotas).toHaveLength(6);
      expect(tabla.resumen.totalCapital).toBe(50);
    });

    it('debe manejar crédito con monto muy grande', () => {
      const tabla = amortizationService.calcularTablaAmortizacion({
        montoTotal: 1000000,
        tasaInteresAnual: 18,
        plazoMeses: 60,
        metodo: MetodoAmortizacion.FRANCES,
        fechaDesembolso: new Date('2025-01-01'),
      });

      expect(tabla.cuotas).toHaveLength(60);
      expect(tabla.resumen.totalCapital).toBe(1000000);
      expect(tabla.cuotas[59].saldoRestante).toBe(0);
    });
  });

  describe('Redondeo y Precisión', () => {
    it('debe redondear correctamente a 2 decimales', () => {
      const tabla = amortizationService.calcularTablaAmortizacion({
        montoTotal: 1000,
        tasaInteresAnual: 18,
        plazoMeses: 12,
        metodo: MetodoAmortizacion.FRANCES,
        fechaDesembolso: new Date('2025-01-01'),
      });

      // Verificar que todos los montos tienen máximo 2 decimales
      tabla.cuotas.forEach((cuota) => {
        expect(cuota.montoCuota.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
        expect(cuota.capital.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
        expect(cuota.interes.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      });
    });

    it('no debe tener error de redondeo significativo en suma total', () => {
      const tabla = amortizationService.calcularTablaAmortizacion({
        montoTotal: 1000,
        tasaInteresAnual: 18,
        plazoMeses: 12,
        metodo: MetodoAmortizacion.FRANCES,
        fechaDesembolso: new Date('2025-01-01'),
      });

      const sumaCapital = tabla.cuotas.reduce((sum, c) => sum + c.capital, 0);
      const diferencia = Math.abs(sumaCapital - 1000);

      // El error de redondeo debe ser menor a 1 centavo
      expect(diferencia).toBeLessThan(0.01);
    });
  });
});
