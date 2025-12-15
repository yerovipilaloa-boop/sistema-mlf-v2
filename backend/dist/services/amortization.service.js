"use strict";
/**
 * ============================================================================
 * Sistema MLF - Servicio de Amortización
 * Archivo: src/services/amortization.service.ts
 * Descripción: Algoritmos de amortización Francés y Alemán
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
// ============================================================================
// SERVICIO DE AMORTIZACIÓN
// ============================================================================
class AmortizationService {
    /**
     * Calcular tabla de amortización completa
     */
    calcularTablaAmortizacion(input) {
        const { montoTotal, tasaInteresMensual, plazoMeses, metodo, fechaDesembolso } = input;
        // Validaciones
        (0, validators_1.validarMontoPositivoOrThrow)(montoTotal, 'Monto del crédito');
        (0, validators_1.validarPlazoMesesOrThrow)(plazoMeses);
        if (tasaInteresMensual <= 0 || tasaInteresMensual > 100) {
            throw new errors_1.BadRequestError('Tasa de interés mensual debe estar entre 0 y 100');
        }
        // Calcular cuotas según método
        let cuotas;
        if (metodo === types_1.MetodoAmortizacion.FRANCES) {
            cuotas = this.calcularMetodoFrances(montoTotal, tasaInteresMensual, plazoMeses, fechaDesembolso);
        }
        else if (metodo === types_1.MetodoAmortizacion.ALEMAN) {
            cuotas = this.calcularMetodoAleman(montoTotal, tasaInteresMensual, plazoMeses, fechaDesembolso);
        }
        else {
            throw new errors_1.BadRequestError(`Método de amortización no válido: ${metodo}`);
        }
        // Calcular resumen
        const totalAPagar = cuotas.reduce((sum, cuota) => sum + cuota.montoCuota, 0);
        const totalCapital = cuotas.reduce((sum, cuota) => sum + cuota.capital, 0);
        const totalIntereses = cuotas.reduce((sum, cuota) => sum + cuota.interes, 0);
        // Mapear a formato de respuesta
        const cuotasFormateadas = cuotas.map((cuota) => ({
            numeroCuota: cuota.numeroCuota,
            fechaVencimiento: cuota.fechaVencimiento,
            montoCuota: this.redondear(cuota.montoCuota),
            capital: this.redondear(cuota.capital),
            interes: this.redondear(cuota.interes),
            saldoRestante: this.redondear(cuota.saldoRestante),
        }));
        return {
            credito: {
                codigo: '', // Se asignará al crear el crédito
                montoTotal: this.redondear(montoTotal),
                tasaInteres: tasaInteresMensual, // CAMBIADO: Ahora retorna tasa mensual
                plazoMeses,
                metodo,
            },
            cuotas: cuotasFormateadas,
            resumen: {
                totalAPagar: this.redondear(totalAPagar),
                totalCapital: this.redondear(totalCapital),
                totalIntereses: this.redondear(totalIntereses),
            },
        };
    }
    /**
     * ========================================================================
     * MÉTODO FRANCÉS (Cuota Fija)
     * ========================================================================
     *
     * Características:
     * - Cuota mensual FIJA durante todo el período
     * - Intereses DECRECIENTES (se calculan sobre saldo restante)
     * - Capital CRECIENTE (diferencia entre cuota e interés)
     *
     * Fórmula de cuota:
     * C = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
     *
     * Donde:
     * - C = Cuota mensual
     * - P = Monto del préstamo
     * - i = Tasa de interés mensual (anual / 12 / 100)
     * - n = Número de cuotas
     *
     * Ejemplo: $1,000 al 18% anual (1.5% mensual) en 12 meses
     * - Cuota fija: $91.68
     * - Total intereses: $100.13
     * - Total a pagar: $1,100.13
     */
    calcularMetodoFrances(montoTotal, tasaInteresMensual, plazoMeses, fechaDesembolso) {
        const cuotas = [];
        // Tasa de interés mensual (decimal) - YA VIENE COMO MENSUAL, solo convertir a decimal
        const tasaMensual = tasaInteresMensual / 100;
        // Calcular cuota fija usando la fórmula de amortización francesa
        const cuotaFija = this.calcularCuotaFrancesa(montoTotal, tasaMensual, plazoMeses);
        let saldoRestante = montoTotal;
        for (let numeroCuota = 1; numeroCuota <= plazoMeses; numeroCuota++) {
            // Interés del período = Saldo restante * Tasa mensual
            const interes = saldoRestante * tasaMensual;
            // Capital = Cuota fija - Interés del período
            const capital = cuotaFija - interes;
            // Actualizar saldo restante
            saldoRestante -= capital;
            // Ajuste para última cuota (evitar residuos de redondeo)
            if (numeroCuota === plazoMeses) {
                const capitalAjustado = capital + saldoRestante;
                const cuotaAjustada = capitalAjustado + interes;
                saldoRestante = 0;
                cuotas.push({
                    numeroCuota,
                    fechaVencimiento: this.calcularFechaVencimiento(fechaDesembolso, numeroCuota),
                    montoCuota: cuotaAjustada,
                    capital: capitalAjustado,
                    interes,
                    saldoRestante: 0,
                });
            }
            else {
                cuotas.push({
                    numeroCuota,
                    fechaVencimiento: this.calcularFechaVencimiento(fechaDesembolso, numeroCuota),
                    montoCuota: cuotaFija,
                    capital,
                    interes,
                    saldoRestante,
                });
            }
        }
        return cuotas;
    }
    /**
     * Calcular cuota fija del método francés
     * Fórmula: C = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
     */
    calcularCuotaFrancesa(monto, tasaMensual, plazoMeses) {
        if (tasaMensual === 0) {
            // Si no hay interés, la cuota es simplemente monto / plazo
            return monto / plazoMeses;
        }
        const potencia = Math.pow(1 + tasaMensual, plazoMeses);
        const cuota = monto * (tasaMensual * potencia) / (potencia - 1);
        return cuota;
    }
    /**
     * ========================================================================
     * MÉTODO ALEMÁN (Capital Fijo)
     * ========================================================================
     *
     * Características:
     * - Capital FIJO en cada cuota (monto / plazo)
     * - Intereses DECRECIENTES (se calculan sobre saldo restante)
     * - Cuota total DECRECIENTE (capital fijo + interés decreciente)
     *
     * Fórmulas:
     * - Capital fijo = P / n
     * - Interés = Saldo restante * i
     * - Cuota = Capital fijo + Interés
     *
     * Donde:
     * - P = Monto del préstamo
     * - i = Tasa de interés mensual
     * - n = Número de cuotas
     *
     * Ejemplo: $1,000 al 18% anual (1.5% mensual) en 12 meses
     * - Capital fijo: $83.33
     * - Primera cuota: $98.33 (83.33 + 15.00)
     * - Última cuota: $84.58 (83.33 + 1.25)
     * - Total intereses: $97.50
     * - Total a pagar: $1,097.50
     */
    calcularMetodoAleman(montoTotal, tasaInteresMensual, plazoMeses, fechaDesembolso) {
        const cuotas = [];
        // Tasa de interés mensual (decimal) - YA VIENE COMO MENSUAL, solo convertir a decimal
        const tasaMensual = tasaInteresMensual / 100;
        // Capital fijo = Monto total / Número de cuotas
        const capitalFijo = montoTotal / plazoMeses;
        let saldoRestante = montoTotal;
        for (let numeroCuota = 1; numeroCuota <= plazoMeses; numeroCuota++) {
            // Interés del período = Saldo restante * Tasa mensual
            const interes = saldoRestante * tasaMensual;
            // Capital = Fijo en todas las cuotas
            const capital = capitalFijo;
            // Cuota total = Capital fijo + Interés
            const montoCuota = capital + interes;
            // Actualizar saldo restante
            saldoRestante -= capital;
            // Ajuste para última cuota (evitar residuos de redondeo)
            if (numeroCuota === plazoMeses) {
                saldoRestante = 0;
            }
            cuotas.push({
                numeroCuota,
                fechaVencimiento: this.calcularFechaVencimiento(fechaDesembolso, numeroCuota),
                montoCuota,
                capital,
                interes,
                saldoRestante,
            });
        }
        return cuotas;
    }
    /**
     * Calcular fecha de vencimiento de una cuota
     * La primera cuota vence 1 mes después del desembolso
     * CORRECCIÓN: Preservar el día correcto evitando problemas de zona horaria
     * VERSIÓN: 2.0 - CORREGIDA
     */
    calcularFechaVencimiento(fechaDesembolso, numeroCuota) {
        // Extraer año, mes y día en hora local (no UTC)
        const year = fechaDesembolso.getFullYear();
        const month = fechaDesembolso.getMonth();
        const day = fechaDesembolso.getDate();
        // CRÍTICO: Crear nueva fecha preservando el día exacto
        // Esto evita problemas de zona horaria que causan que el día cambie
        const fechaVencimiento = new Date(year, month + numeroCuota, day, 12, 0, 0);
        // Log para debugging (solo en desarrollo)
        if (numeroCuota === 1 && process.env.NODE_ENV === 'development') {
            console.log(`[AMORTIZATION] Calculando vencimiento cuota ${numeroCuota}:`);
            console.log(`  Desembolso: ${fechaDesembolso.toLocaleDateString()} (día ${day})`);
            console.log(`  Vencimiento: ${fechaVencimiento.toLocaleDateString()} (día ${fechaVencimiento.getDate()})`);
            console.log(`  ✅ MÉTODO CORREGIDO V2.0 ACTIVO`);
        }
        return fechaVencimiento;
    }
    /**
     * Redondear a 2 decimales
     */
    redondear(valor) {
        return Math.round(valor * 100) / 100;
    }
    // ============================================================================
    // MÉTODOS AUXILIARES PARA CÁLCULOS DE PAGOS
    // ============================================================================
    /**
     * Calcular monto de pago para una cuota específica (con mora)
     */
    calcularMontoCuotaConMora(montoCuota, diasMora, tasaMoraDiaria) {
        (0, validators_1.validarMontoPositivoOrThrow)(montoCuota, 'Monto de cuota');
        // Interés de mora = Monto cuota * (Tasa mora diaria / 100) * Días mora
        const intereseMora = montoCuota * (tasaMoraDiaria / 100) * diasMora;
        return {
            montoCuota,
            intereseMora: this.redondear(intereseMora),
            montoTotal: this.redondear(montoCuota + intereseMora),
        };
    }
    /**
     * Calcular distribución de pago según prioridad: Mora → Interés → Capital
     */
    distribuirPago(montoPagado, montoMoraAdeudado, montoInteresAdeudado, montoCapitalAdeudado) {
        (0, validators_1.validarMontoPositivoOrThrow)(montoPagado, 'Monto pagado');
        let restante = montoPagado;
        // 1. Aplicar a mora (prioridad máxima)
        const aplicadoMora = Math.min(restante, montoMoraAdeudado);
        restante -= aplicadoMora;
        // 2. Aplicar a interés
        const aplicadoInteres = Math.min(restante, montoInteresAdeudado);
        restante -= aplicadoInteres;
        // 3. Aplicar a capital
        const aplicadoCapital = Math.min(restante, montoCapitalAdeudado);
        restante -= aplicadoCapital;
        return {
            aplicadoMora: this.redondear(aplicadoMora),
            aplicadoInteres: this.redondear(aplicadoInteres),
            aplicadoCapital: this.redondear(aplicadoCapital),
            sobrante: this.redondear(restante), // Si sobra, es prepago
        };
    }
    /**
     * Calcular reducción de plazo por prepago de capital
     */
    calcularReduccionPlazoPorPrepago(cuotasRestantes, montoPrepago, tasaInteresMensual) {
        const cuotasOriginales = cuotasRestantes.length;
        // Calcular nuevo saldo después del prepago
        const saldoActual = cuotasRestantes[0].saldoRestante;
        const nuevoSaldo = saldoActual - montoPrepago;
        if (nuevoSaldo <= 0) {
            // El prepago cubre todo el saldo
            return {
                cuotasOriginales,
                cuotasNuevas: 0,
                cuotasAhorradas: cuotasOriginales,
                ahorroIntereses: cuotasRestantes.reduce((sum, c) => sum + c.interes, 0),
            };
        }
        // Recalcular tabla con nuevo saldo (método Francés) - tasa YA ES MENSUAL
        const tasaMensual = tasaInteresMensual / 100;
        const cuotaMensual = cuotasRestantes[0].montoCuota;
        // Calcular nuevo plazo: n = log(C / (C - P*i)) / log(1 + i)
        const numerador = Math.log(cuotaMensual / (cuotaMensual - nuevoSaldo * tasaMensual));
        const denominador = Math.log(1 + tasaMensual);
        const nuevoPlazoCuotas = Math.ceil(numerador / denominador);
        const cuotasAhorradas = cuotasOriginales - nuevoPlazoCuotas;
        // Calcular intereses totales originales vs nuevos
        const interesesOriginales = cuotasRestantes.reduce((sum, c) => sum + c.interes, 0);
        const interesesNuevos = cuotaMensual * nuevoPlazoCuotas - nuevoSaldo;
        const ahorroIntereses = interesesOriginales - interesesNuevos;
        return {
            cuotasOriginales,
            cuotasNuevas: nuevoPlazoCuotas,
            cuotasAhorradas,
            ahorroIntereses: this.redondear(ahorroIntereses > 0 ? ahorroIntereses : 0),
        };
    }
    /**
     * Comparar métodos de amortización
     */
    compararMetodos(montoTotal, tasaInteresMensual, plazoMeses, fechaDesembolso) {
        // Calcular ambos métodos
        const frances = this.calcularTablaAmortizacion({
            montoTotal,
            tasaInteresMensual,
            plazoMeses,
            metodo: types_1.MetodoAmortizacion.FRANCES,
            fechaDesembolso,
        });
        const aleman = this.calcularTablaAmortizacion({
            montoTotal,
            tasaInteresMensual,
            plazoMeses,
            metodo: types_1.MetodoAmortizacion.ALEMAN,
            fechaDesembolso,
        });
        // Comparación
        const diferenciaIntereses = frances.resumen.totalIntereses - aleman.resumen.totalIntereses;
        const diferenciaPrimeraCuota = frances.cuotas[0].montoCuota - aleman.cuotas[0].montoCuota;
        const diferenciaUltimaCuota = frances.cuotas[plazoMeses - 1].montoCuota - aleman.cuotas[plazoMeses - 1].montoCuota;
        // Recomendación
        let metodoRecomendado;
        let razonRecomendacion;
        if (Math.abs(diferenciaIntereses) < 10) {
            metodoRecomendado = types_1.MetodoAmortizacion.FRANCES;
            razonRecomendacion = 'Cuota fija facilita planificación financiera (diferencia de intereses mínima)';
        }
        else if (diferenciaIntereses > 50) {
            metodoRecomendado = types_1.MetodoAmortizacion.ALEMAN;
            razonRecomendacion = `Ahorra $${this.redondear(diferenciaIntereses)} en intereses totales`;
        }
        else {
            metodoRecomendado = types_1.MetodoAmortizacion.FRANCES;
            razonRecomendacion = 'Cuota fija más predecible para el socio';
        }
        return {
            frances,
            aleman,
            comparacion: {
                diferenciaIntereses: this.redondear(diferenciaIntereses),
                diferenciaPrimeraCuota: this.redondear(diferenciaPrimeraCuota),
                diferenciaUltimaCuota: this.redondear(diferenciaUltimaCuota),
                metodoRecomendado,
                razonRecomendacion,
            },
        };
    }
}
exports.default = new AmortizationService();
//# sourceMappingURL=amortization.service.js.map