"use strict";
/**
 * ============================================================================
 * Sistema MLF - Servicio de Métricas Financieras
 * Archivo: src/services/metricas.service.ts
 * Descripción: Cálculo de métricas e indicadores financieros del sistema
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
// ============================================================================
// SERVICIO
// ============================================================================
class MetricasService {
    /**
     * Obtener métricas completas del dashboard
     */
    async obtenerMetricasCompletas(periodo) {
        const { fechaInicio, fechaFin } = periodo || this.obtenerPeriodoActual();
        const [ingresos, egresos, reservas, utilidades, cartera, resumen] = await Promise.all([
            this.calcularMetricasIngresos(fechaInicio, fechaFin),
            this.calcularMetricasEgresos(fechaInicio, fechaFin),
            this.calcularMetricasReservas(fechaInicio, fechaFin),
            this.calcularMetricasUtilidades(fechaInicio, fechaFin),
            this.calcularMetricasCartera(),
            this.calcularResumenGeneral(),
        ]);
        return {
            periodo: {
                inicio: fechaInicio.toISOString(),
                fin: fechaFin.toISOString(),
            },
            ingresos,
            egresos,
            reservas,
            utilidades,
            cartera,
            resumen,
        };
    }
    /**
     * Calcular métricas de ingresos
     */
    async calcularMetricasIngresos(fechaInicio, fechaFin) {
        // Obtener todos los pagos del período
        const pagos = await database_1.default.pago.findMany({
            where: {
                fechaPago: {
                    gte: fechaInicio,
                    lte: fechaFin,
                },
            },
            select: {
                monto_pago: true,
                monto_a_interes: true,
                monto_a_capital: true,
                monto_a_mora: true,
            },
        });
        const totalInteresesCobrados = pagos.reduce((sum, p) => sum + (p.monto_a_interes?.toNumber() || 0) + (p.monto_a_mora?.toNumber() || 0), 0);
        const totalCapitalRecuperado = pagos.reduce((sum, p) => sum + (p.monto_a_capital?.toNumber() || 0), 0);
        const totalPagosRecibidos = pagos.reduce((sum, p) => sum + p.monto_pago.toNumber(), 0);
        // Calcular tasa de recuperación (capital recuperado / capital prestado total)
        const creditosActivos = await database_1.default.credito.findMany({
            where: { estado: client_1.EstadoCredito.DESEMBOLSADO },
            select: { montoTotal: true },
        });
        const capitalPrestadoTotal = creditosActivos.reduce((sum, c) => sum + c.montoTotal.toNumber(), 0);
        const tasaRecuperacion = capitalPrestadoTotal > 0
            ? (totalCapitalRecuperado / capitalPrestadoTotal) * 100
            : 0;
        return {
            totalInteresesCobrados: this.redondear(totalInteresesCobrados),
            totalCapitalRecuperado: this.redondear(totalCapitalRecuperado),
            totalPagosRecibidos: this.redondear(totalPagosRecibidos),
            tasaRecuperacion: this.redondear(tasaRecuperacion),
        };
    }
    /**
     * Calcular métricas de egresos (SIN incluir Fondo de Seguro - eso va en Reservas)
     */
    async calcularMetricasEgresos(fechaInicio, fechaFin) {
        // Obtener gastos operativos del período
        const gastos = await database_1.default.gastoOperativo.findMany({
            where: {
                fechaGasto: {
                    gte: fechaInicio,
                    lte: fechaFin,
                },
            },
            select: {
                monto: true,
                categoria: true,
            },
        });
        const totalGastosOperativos = gastos.reduce((sum, g) => sum + g.monto.toNumber(), 0);
        // Agrupar por categoría
        const gastosPorCategoria = {};
        gastos.forEach((g) => {
            const categoria = g.categoria;
            if (!gastosPorCategoria[categoria]) {
                gastosPorCategoria[categoria] = 0;
            }
            gastosPorCategoria[categoria] += g.monto.toNumber();
        });
        // Calcular utilidades pendientes a pagar (1% sobre ahorros totales)
        const socios = await database_1.default.socio.findMany({
            where: { estado: client_1.EstadoSocio.ACTIVO },
            select: { ahorroActual: true },
        });
        const totalAhorros = socios.reduce((sum, s) => sum + s.ahorroActual.toNumber(), 0);
        // Provisión de utilidades: 1% sobre total de ahorros
        const utilidadesPendientesPagar = totalAhorros * 0.01;
        return {
            totalGastosOperativos: this.redondear(totalGastosOperativos),
            gastosPorCategoria,
            utilidadesPendientesPagar: this.redondear(utilidadesPendientesPagar),
        };
    }
    /**
     * Calcular métricas de reservas (Fondo de Seguro de Desgravamen)
     *
     * CONTABILIDAD CORRECTA:
     * - El seguro se financia junto con el crédito (1% del monto solicitado)
     * - Se va cobrando dentro de las cuotas (parte del capital)
     * - Es una RESERVA/PASIVO, no un egreso
     * - Solo se convierte en INGRESO cuando el crédito se liquida completamente
     * - Solo se convierte en GASTO si hay un siniestro (fallecimiento)
     */
    async calcularMetricasReservas(_fechaInicio, _fechaFin) {
        // Obtener todos los movimientos del fondo de seguro
        const movimientosFondo = await database_1.default.fondoSeguro.findMany({
            select: {
                monto: true,
                tipo: true,
            },
        });
        // Calcular totales por tipo
        let fondoSeguroAcumulado = 0; // INGRESO_PRIMA
        let fondoSeguroUtilizado = 0; // PAGO_SINIESTRO
        let fondoSeguroLiberado = 0; // LIBERACION (cuando crédito se liquida)
        movimientosFondo.forEach((m) => {
            const monto = m.monto.toNumber();
            switch (m.tipo) {
                case 'INGRESO_PRIMA':
                    fondoSeguroAcumulado += monto;
                    break;
                case 'PAGO_SINIESTRO':
                    fondoSeguroUtilizado += monto;
                    break;
                case 'LIBERACION':
                    fondoSeguroLiberado += monto;
                    break;
            }
        });
        // Fondo disponible = Acumulado - Utilizado - Liberado
        const fondoSeguroDisponible = fondoSeguroAcumulado - fondoSeguroUtilizado - fondoSeguroLiberado;
        // Calcular primas pendientes de cobro (seguro financiado en créditos activos)
        // Es la diferencia entre prima_seguro del crédito y lo que ya se ha cobrado
        const creditosActivos = await database_1.default.credito.findMany({
            where: { estado: client_1.EstadoCredito.DESEMBOLSADO },
            select: {
                primaSeguro: true,
                montoTotal: true,
                saldo_capital: true,
            },
        });
        // Aproximación: proporción del seguro pendiente basado en saldo vs monto total
        let primasPendientesCobro = 0;
        creditosActivos.forEach((c) => {
            const primaTotal = c.primaSeguro?.toNumber() || 0;
            const montoTotal = c.montoTotal.toNumber();
            const saldoCapital = c.saldo_capital?.toNumber() || 0;
            if (montoTotal > 0) {
                // Proporción de capital pendiente = proporción de prima pendiente
                const proporcionPendiente = saldoCapital / montoTotal;
                primasPendientesCobro += primaTotal * proporcionPendiente;
            }
        });
        return {
            fondoSeguroAcumulado: this.redondear(fondoSeguroAcumulado),
            fondoSeguroUtilizado: this.redondear(fondoSeguroUtilizado),
            fondoSeguroDisponible: this.redondear(fondoSeguroDisponible),
            fondoSeguroLiberado: this.redondear(fondoSeguroLiberado),
            primasPendientesCobro: this.redondear(primasPendientesCobro),
        };
    }
    /**
     * Calcular métricas de utilidades
     *
     * NOTA: El Fondo de Seguro NO se incluye en egresos porque:
     * - Es una RESERVA/PASIVO, no un gasto
     * - Solo se convierte en ingreso cuando el crédito se liquida
     * - Solo se convierte en gasto si hay un siniestro
     */
    async calcularMetricasUtilidades(fechaInicio, fechaFin) {
        const ingresos = await this.calcularMetricasIngresos(fechaInicio, fechaFin);
        const egresos = await this.calcularMetricasEgresos(fechaInicio, fechaFin);
        const reservas = await this.calcularMetricasReservas(fechaInicio, fechaFin);
        // Ingresos = Intereses + Mora + Seguro Liberado (de créditos liquidados)
        const ingresosTotal = ingresos.totalInteresesCobrados + reservas.fondoSeguroLiberado;
        // Egresos operativos (sin incluir reservas de seguro)
        const egresosOperativos = egresos.totalGastosOperativos;
        // UTILIDAD BRUTA = Ingresos - Gastos Operativos
        const utilidadBruta = ingresosTotal - egresosOperativos;
        // UTILIDAD NETA = Utilidad Bruta - Utilidades pendientes a pagar
        const utilidadNeta = utilidadBruta - egresos.utilidadesPendientesPagar;
        // Egresos totales = operativos + utilidades a pagar
        const egresosTotal = egresosOperativos + egresos.utilidadesPendientesPagar;
        // Márgenes
        const margenBruto = ingresosTotal > 0 ? (utilidadBruta / ingresosTotal) * 100 : 0;
        const margenNeto = ingresosTotal > 0 ? (utilidadNeta / ingresosTotal) * 100 : 0;
        return {
            ingresosTotal: this.redondear(ingresosTotal),
            egresosTotal: this.redondear(egresosTotal),
            utilidadBruta: this.redondear(utilidadBruta),
            utilidadNeta: this.redondear(utilidadNeta),
            margenBruto: this.redondear(margenBruto),
            margenNeto: this.redondear(margenNeto),
        };
    }
    /**
     * Calcular métricas de cartera
     */
    async calcularMetricasCartera() {
        // Obtener todos los créditos desembolsados
        const creditos = await database_1.default.credito.findMany({
            where: { estado: client_1.EstadoCredito.DESEMBOLSADO },
            include: {
                cuotas: {
                    select: {
                        fechaVencimiento: true,
                        montoCuota: true,
                        montoPagado: true,
                        estado: true,
                    },
                },
            },
        });
        let carteraVigente = 0;
        let carteraVencida = 0;
        let creditosEnMora = 0;
        let montoDeMora = 0;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        creditos.forEach((credito) => {
            let tieneMora = false;
            credito.cuotas.forEach((cuota) => {
                const saldoCuota = cuota.montoCuota.toNumber() - (cuota.montoPagado?.toNumber() || 0);
                if (saldoCuota > 0) {
                    const fechaVenc = new Date(cuota.fechaVencimiento);
                    fechaVenc.setHours(0, 0, 0, 0);
                    if (fechaVenc < hoy) {
                        // Cuota vencida
                        carteraVencida += saldoCuota;
                        montoDeMora += saldoCuota;
                        tieneMora = true;
                    }
                    else {
                        // Cuota vigente
                        carteraVigente += saldoCuota;
                    }
                }
            });
            if (tieneMora) {
                creditosEnMora++;
            }
        });
        // Calcular provisiones (ejemplo: 5% de cartera vencida)
        const provisionesNecesarias = carteraVencida * 0.05;
        return {
            carteraVigente: this.redondear(carteraVigente),
            carteraVencida: this.redondear(carteraVencida),
            creditosEnMora,
            montoDeMora: this.redondear(montoDeMora),
            provisionesNecesarias: this.redondear(provisionesNecesarias),
        };
    }
    /**
     * Calcular resumen general (sin filtro de período)
     */
    async calcularResumenGeneral() {
        // Socios activos
        const sociosActivos = await database_1.default.socio.count({
            where: { estado: client_1.EstadoSocio.ACTIVO },
        });
        // Créditos activos
        const creditosActivos = await database_1.default.credito.count({
            where: { estado: client_1.EstadoCredito.DESEMBOLSADO },
        });
        // Total ahorros y aporte del administrador
        const socios = await database_1.default.socio.findMany({
            select: {
                ahorroActual: true,
                rol: true,
            },
        });
        const totalAhorros = socios.reduce((sum, s) => sum + s.ahorroActual.toNumber(), 0);
        // Obtener aporte del administrador
        const administrador = socios.find(s => s.rol === 'ADMIN');
        const aporteAdministrador = administrador ? administrador.ahorroActual.toNumber() : 0;
        // Contar socios por etapa (solo socios, excluir admin y tesorero)
        const sociosEtapa1 = await database_1.default.socio.count({
            where: {
                rol: 'SOCIO',
                etapaActual: 1,
            },
        });
        const sociosEtapa2 = await database_1.default.socio.count({
            where: {
                rol: 'SOCIO',
                etapaActual: 2,
            },
        });
        const sociosEtapa3 = await database_1.default.socio.count({
            where: {
                rol: 'SOCIO',
                etapaActual: 3,
            },
        });
        // Capital prestado (saldo pendiente)
        const creditos = await database_1.default.credito.findMany({
            where: { estado: client_1.EstadoCredito.DESEMBOLSADO },
            select: { saldo_capital: true },
        });
        const capitalPrestado = creditos.reduce((sum, c) => sum + (c.saldo_capital?.toNumber() || 0), 0);
        return {
            sociosActivos,
            creditosActivos,
            totalAhorros: this.redondear(totalAhorros),
            aporteAdministrador: this.redondear(aporteAdministrador),
            capitalPrestado: this.redondear(capitalPrestado),
            sociosPorEtapa: {
                etapa1: sociosEtapa1,
                etapa2: sociosEtapa2,
                etapa3: sociosEtapa3,
            },
        };
    }
    /**
     * Obtener período actual (mes actual)
     */
    obtenerPeriodoActual() {
        const hoy = new Date();
        const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 0, 0);
        const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
        return { fechaInicio, fechaFin };
    }
    /**
     * Obtener períodos predefinidos
     */
    obtenerPeriodo(tipo) {
        const hoy = new Date();
        let fechaInicio;
        const fechaFin = new Date();
        switch (tipo) {
            case 'dia':
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
                fechaFin.setHours(23, 59, 59, 999);
                break;
            case 'semana':
                const diaSemana = hoy.getDay();
                fechaInicio = new Date(hoy);
                fechaInicio.setDate(hoy.getDate() - diaSemana);
                fechaInicio.setHours(0, 0, 0, 0);
                break;
            case 'mes':
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 0, 0);
                break;
            case 'año':
                fechaInicio = new Date(hoy.getFullYear(), 0, 1, 0, 0, 0);
                break;
        }
        return { fechaInicio, fechaFin };
    }
    /**
     * Redondear a 2 decimales
     */
    redondear(valor) {
        return Math.round(valor * 100) / 100;
    }
}
exports.default = new MetricasService();
//# sourceMappingURL=metricas.service.js.map