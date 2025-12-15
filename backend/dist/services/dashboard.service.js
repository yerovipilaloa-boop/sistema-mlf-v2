"use strict";
/**
 * ============================================================================
 * Service: Dashboard de Rentabilidad
 * ============================================================================
 * Genera métricas financieras y estadísticas en tiempo real
 *
 * Métricas incluidas:
 * - Resumen general (socios, créditos, ahorros)
 * - Cartera de créditos (activa, vencida, mora)
 * - Rentabilidad (ingresos vs egresos)
 * - Indicadores de riesgo (morosidad, castigos)
 * - Proyecciones y tendencias
 *
 * @author Sistema MLF
 * @version 1.0.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = void 0;
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../config/logger"));
const client_1 = require("@prisma/client");
/**
 * ============================================================================
 * CLASE DASHBOARD SERVICE
 * ============================================================================
 */
class DashboardService {
    /**
     * Obtener dashboard completo con todas las métricas
     */
    async obtenerDashboardCompleto() {
        try {
            logger_1.default.info('[Dashboard] Generando dashboard completo...');
            logger_1.default.info('[Dashboard] Obteniendo resumen general...');
            const resumen = await this.obtenerResumenGeneral();
            logger_1.default.info('[Dashboard] ✓ Resumen general OK');
            logger_1.default.info('[Dashboard] Obteniendo cartera de créditos...');
            const cartera = await this.obtenerCarteraCreditos();
            logger_1.default.info('[Dashboard] ✓ Cartera OK');
            logger_1.default.info('[Dashboard] Calculando rentabilidad...');
            const rentabilidad = await this.calcularRentabilidad();
            logger_1.default.info('[Dashboard] ✓ Rentabilidad OK');
            logger_1.default.info('[Dashboard] Calculando indicadores de riesgo...');
            const indicadores = await this.calcularIndicadoresRiesgo();
            logger_1.default.info('[Dashboard] ✓ Indicadores OK');
            logger_1.default.info('[Dashboard] Generando proyecciones...');
            const proyecciones = await this.generarProyecciones();
            logger_1.default.info('[Dashboard] ✓ Proyecciones OK');
            logger_1.default.info('[Dashboard] Dashboard generado exitosamente');
            return {
                resumen,
                cartera,
                rentabilidad,
                indicadores,
                proyecciones,
                fechaGeneracion: new Date(),
            };
        }
        catch (error) {
            logger_1.default.error('[Dashboard] Error al generar dashboard:', error);
            throw new Error(`Error al generar dashboard: ${error.message}`);
        }
    }
    /**
     * Resumen general de socios, créditos y ahorros
     */
    async obtenerResumenGeneral() {
        try {
            // Socios
            logger_1.default.info('[Dashboard] Contando total socios...');
            const totalSocios = await database_1.prisma.socio.count();
            logger_1.default.info(`[Dashboard] Total socios: ${totalSocios}`);
            logger_1.default.info('[Dashboard] Contando socios activos...');
            const sociosActivos = await database_1.prisma.socio.count({
                where: { estado: client_1.EstadoSocio.ACTIVO },
            });
            logger_1.default.info(`[Dashboard] Socios activos: ${sociosActivos}`);
            logger_1.default.info('[Dashboard] Contando socios suspendidos...');
            const sociosSuspendidos = await database_1.prisma.socio.count({
                where: { estado: client_1.EstadoSocio.SUSPENDIDO },
            });
            logger_1.default.info(`[Dashboard] Socios suspendidos: ${sociosSuspendidos}`);
            logger_1.default.info('[Dashboard] Contando socios inactivos...');
            const sociosInactivos = await database_1.prisma.socio.count({
                where: { estado: client_1.EstadoSocio.INACTIVO },
            });
            logger_1.default.info(`[Dashboard] Socios inactivos: ${sociosInactivos}`);
            const primerDiaMes = new Date();
            primerDiaMes.setDate(1);
            primerDiaMes.setHours(0, 0, 0, 0);
            logger_1.default.info('[Dashboard] Contando nuevos socios este mes...');
            const nuevosEsteMes = await database_1.prisma.socio.count({
                where: {
                    fechaRegistro: { gte: primerDiaMes },
                },
            });
            logger_1.default.info(`[Dashboard] Nuevos este mes: ${nuevosEsteMes}`);
            // Contar socios por etapa (solo socios, excluyendo admin)
            logger_1.default.info('[Dashboard] Contando socios por etapa...');
            const sociosEtapa1 = await database_1.prisma.socio.count({
                where: {
                    rol: 'SOCIO',
                    etapaActual: 1
                },
            });
            const sociosEtapa2 = await database_1.prisma.socio.count({
                where: {
                    rol: 'SOCIO',
                    etapaActual: 2
                },
            });
            const sociosEtapa3 = await database_1.prisma.socio.count({
                where: {
                    rol: 'SOCIO',
                    etapaActual: 3
                },
            });
            logger_1.default.info(`[Dashboard] Socios por etapa - Etapa 1: ${sociosEtapa1}, Etapa 2: ${sociosEtapa2}, Etapa 3: ${sociosEtapa3}`);
            // Créditos
            logger_1.default.info('[Dashboard] Contando total créditos...');
            const totalCreditos = await database_1.prisma.credito.count();
            logger_1.default.info(`[Dashboard] Total créditos: ${totalCreditos}`);
            logger_1.default.info('[Dashboard] Contando créditos activos...');
            const creditosActivos = await database_1.prisma.credito.count({
                where: { estado: client_1.EstadoCredito.DESEMBOLSADO },
            });
            logger_1.default.info(`[Dashboard] Créditos activos: ${creditosActivos}`);
            logger_1.default.info('[Dashboard] Contando créditos completados...');
            const creditosCompletados = await database_1.prisma.credito.count({
                where: { estado: client_1.EstadoCredito.COMPLETADO },
            });
            logger_1.default.info(`[Dashboard] Créditos completados: ${creditosCompletados}`);
            logger_1.default.info('[Dashboard] Contando créditos castigados...');
            const creditosCastigados = await database_1.prisma.credito.count({
                where: { estado: client_1.EstadoCredito.CASTIGADO },
            });
            logger_1.default.info(`[Dashboard] Créditos castigados: ${creditosCastigados}`);
            logger_1.default.info('[Dashboard] Agregando suma de créditos...');
            const sumaCreditos = await database_1.prisma.credito.aggregate({
                _sum: {
                    montoTotal: true,
                },
            });
            logger_1.default.info(`[Dashboard] Suma créditos: ${sumaCreditos._sum.montoTotal}`);
            logger_1.default.info('[Dashboard] Buscando créditos desembolsados...');
            const creditosDesembolsados = await database_1.prisma.credito.findMany({
                where: {
                    estado: {
                        in: [client_1.EstadoCredito.DESEMBOLSADO, client_1.EstadoCredito.COMPLETADO],
                    },
                },
                select: {
                    montoTotal: true,
                    saldo_capital: true,
                },
            });
            logger_1.default.info(`[Dashboard] Créditos desembolsados encontrados: ${creditosDesembolsados.length}`);
            const montoDesembolsado = creditosDesembolsados.reduce((acc, c) => acc + c.montoTotal.toNumber(), 0);
            const saldoPendiente = creditosDesembolsados.reduce((acc, c) => acc + c.saldo_capital.toNumber(), 0);
            // Ahorros
            logger_1.default.info('[Dashboard] Buscando socios con ahorro...');
            const sociosConAhorro = await database_1.prisma.socio.findMany({
                select: {
                    ahorroActual: true,
                    ahorroCongelado: true,
                    rol: true,
                },
            });
            logger_1.default.info(`[Dashboard] Socios con ahorro: ${sociosConAhorro.length}`);
            const totalAhorrado = sociosConAhorro.reduce((acc, s) => acc + s.ahorroActual.toNumber(), 0);
            const totalCongelado = sociosConAhorro.reduce((acc, s) => acc + s.ahorroCongelado.toNumber(), 0);
            const ahorroPromedio = totalAhorrado / (sociosConAhorro.length || 1);
            // Obtener el aporte del administrador
            logger_1.default.info('[Dashboard] Obteniendo aporte del administrador...');
            const administrador = await database_1.prisma.socio.findFirst({
                where: {
                    rol: 'ADMIN'
                },
                select: {
                    ahorroActual: true,
                },
            });
            const aporteAdministrador = administrador?.ahorroActual.toNumber() || 0;
            logger_1.default.info(`[Dashboard] Aporte del administrador: $${aporteAdministrador.toFixed(2)}`);
            // Garantías
            logger_1.default.info('[Dashboard] Contando garantías activas...');
            const garantiasActivas = await database_1.prisma.garantia.count({
                where: { estado: client_1.EstadoGarantia.ACTIVA },
            });
            logger_1.default.info(`[Dashboard] Garantías activas: ${garantiasActivas}`);
            logger_1.default.info('[Dashboard] Contando garantías ejecutadas...');
            const garantiasEjecutadas = await database_1.prisma.garantia.count({
                where: { estado: client_1.EstadoGarantia.EJECUTADA },
            });
            logger_1.default.info(`[Dashboard] Garantías ejecutadas: ${garantiasEjecutadas}`);
            logger_1.default.info('[Dashboard] Contando garantías liberadas...');
            const garantiasLiberadas = await database_1.prisma.garantia.count({
                where: { estado: client_1.EstadoGarantia.LIBERADA },
            });
            logger_1.default.info(`[Dashboard] Garantías liberadas: ${garantiasLiberadas}`);
            logger_1.default.info('[Dashboard] Buscando garantías activas con monto...');
            const garantiasActivasData = await database_1.prisma.garantia.findMany({
                where: { estado: client_1.EstadoGarantia.ACTIVA },
                select: { montoCongelado: true },
            });
            logger_1.default.info(`[Dashboard] Garantías activas encontradas: ${garantiasActivasData.length}`);
            const montoCongelado = garantiasActivasData.reduce((acc, g) => acc + g.montoCongelado.toNumber(), 0);
            return {
                socios: {
                    total: totalSocios,
                    activos: sociosActivos,
                    suspendidos: sociosSuspendidos,
                    inactivos: sociosInactivos,
                    nuevosEsteMes,
                    porEtapa: {
                        etapa1: sociosEtapa1,
                        etapa2: sociosEtapa2,
                        etapa3: sociosEtapa3,
                    },
                },
                creditos: {
                    total: totalCreditos,
                    activos: creditosActivos,
                    completados: creditosCompletados,
                    castigados: creditosCastigados,
                    montoTotal: sumaCreditos._sum.montoTotal?.toNumber() || 0,
                    montoDesembolsado,
                    saldoPendiente,
                },
                ahorros: {
                    totalAhorrado,
                    totalCongelado,
                    ahorroPromedio,
                    sociosConAhorro: sociosConAhorro.length,
                    aporteAdministrador,
                },
                garantias: {
                    activas: garantiasActivas,
                    ejecutadas: garantiasEjecutadas,
                    liberadas: garantiasLiberadas,
                    montoCongelado,
                },
            };
        }
        catch (error) {
            logger_1.default.error('[Dashboard] Error al obtener resumen general:', error);
            throw error;
        }
    }
    /**
     * Cartera de créditos con clasificación
     */
    async obtenerCarteraCreditos() {
        try {
            // Cartera activa
            const creditosActivos = await database_1.prisma.credito.findMany({
                where: { estado: client_1.EstadoCredito.DESEMBOLSADO },
                include: {
                    cuotas: {
                        where: { estado: 'PENDIENTE' },
                    },
                    socio: {
                        select: { etapaActual: true },
                    },
                },
            });
            const montoCarteraActiva = creditosActivos.reduce((acc, c) => acc + c.saldo_capital.toNumber(), 0);
            const promedioMonto = montoCarteraActiva / (creditosActivos.length || 1);
            // Clasificación por mora
            const clasificacionMora = {
                alDia: { cantidad: 0, monto: 0 },
                moraLeve: { cantidad: 0, monto: 0 },
                moraModerarda: { cantidad: 0, monto: 0 },
                moraGrave: { cantidad: 0, monto: 0 },
                moraPersistente: { cantidad: 0, monto: 0 },
                castigado: { cantidad: 0, monto: 0 },
            };
            const hoy = new Date();
            creditosActivos.forEach((credito) => {
                const cuotasVencidas = credito.cuotas.filter((c) => new Date(c.fechaVencimiento) < hoy);
                if (cuotasVencidas.length === 0) {
                    clasificacionMora.alDia.cantidad++;
                    clasificacionMora.alDia.monto += credito.saldo_capital.toNumber();
                }
                else {
                    // Calcular días de mora de la cuota más antigua
                    const cuotaMasAntigua = cuotasVencidas.sort((a, b) => new Date(a.fechaVencimiento).getTime() -
                        new Date(b.fechaVencimiento).getTime())[0];
                    const diasMora = Math.floor((hoy.getTime() -
                        new Date(cuotaMasAntigua.fechaVencimiento).getTime()) /
                        (1000 * 60 * 60 * 24));
                    const monto = credito.saldo_capital.toNumber();
                    if (diasMora >= 90) {
                        clasificacionMora.castigado.cantidad++;
                        clasificacionMora.castigado.monto += monto;
                    }
                    else if (diasMora >= 61) {
                        clasificacionMora.moraPersistente.cantidad++;
                        clasificacionMora.moraPersistente.monto += monto;
                    }
                    else if (diasMora >= 31) {
                        clasificacionMora.moraGrave.cantidad++;
                        clasificacionMora.moraGrave.monto += monto;
                    }
                    else if (diasMora >= 16) {
                        clasificacionMora.moraModerarda.cantidad++;
                        clasificacionMora.moraModerarda.monto += monto;
                    }
                    else {
                        clasificacionMora.moraLeve.cantidad++;
                        clasificacionMora.moraLeve.monto += monto;
                    }
                }
            });
            // Cartera vencida (mora > 30 días)
            const montoCarteraVencida = clasificacionMora.moraGrave.monto +
                clasificacionMora.moraPersistente.monto +
                clasificacionMora.castigado.monto;
            const cantidadCarteraVencida = clasificacionMora.moraGrave.cantidad +
                clasificacionMora.moraPersistente.cantidad +
                clasificacionMora.castigado.cantidad;
            const porcentajeCartera = (montoCarteraVencida / (montoCarteraActiva || 1)) * 100;
            // Por etapa
            const porEtapa = {
                etapa1: { cantidad: 0, monto: 0 },
                etapa2: { cantidad: 0, monto: 0 },
                etapa3: { cantidad: 0, monto: 0 },
            };
            creditosActivos.forEach((credito) => {
                const etapa = credito.socio.etapaActual;
                const monto = credito.saldo_capital.toNumber();
                if (etapa === 1) {
                    porEtapa.etapa1.cantidad++;
                    porEtapa.etapa1.monto += monto;
                }
                else if (etapa === 2) {
                    porEtapa.etapa2.cantidad++;
                    porEtapa.etapa2.monto += monto;
                }
                else if (etapa === 3) {
                    porEtapa.etapa3.cantidad++;
                    porEtapa.etapa3.monto += monto;
                }
            });
            return {
                carteraActiva: {
                    montoTotal: montoCarteraActiva,
                    cantidadCreditos: creditosActivos.length,
                    promedioMonto,
                },
                carteraVencida: {
                    montoTotal: montoCarteraVencida,
                    cantidadCreditos: cantidadCarteraVencida,
                    porcentajeCartera,
                },
                clasificacionMora,
                porEtapa,
            };
        }
        catch (error) {
            logger_1.default.error('[Dashboard] Error al obtener cartera de créditos:', error);
            throw error;
        }
    }
    /**
     * Calcular rentabilidad (ingresos vs egresos)
     */
    async calcularRentabilidad() {
        try {
            // Ingresos por intereses (cuotas pagadas)
            const cuotasPagadas = await database_1.prisma.cuota.findMany({
                where: { estado: 'PAGADA' },
                select: {
                    monto_interes: true,
                    interes_mora: true,
                },
            });
            const interesesCobrados = cuotasPagadas.reduce((acc, c) => acc + c.monto_interes.toNumber(), 0);
            const morasCobradas = cuotasPagadas.reduce((acc, c) => acc + (c.interes_mora?.toNumber() || 0), 0);
            // Primas de seguro (1% de cada crédito desembolsado)
            const primasSeguro = await database_1.prisma.fondoSeguro.aggregate({
                where: { tipo: 'INGRESO_PRIMA' },
                _sum: { monto: true },
            });
            const totalIngresos = interesesCobrados +
                morasCobradas +
                (primasSeguro._sum.monto?.toNumber() || 0);
            // Egresos: Utilidades distribuidas
            const utilidadesDistribuidas = await database_1.prisma.utilidadDetalle.aggregate({
                _sum: { montoUtilidad: true },
            });
            // Egresos: Fondo de seguro utilizado
            const fondoSeguroUtilizado = await database_1.prisma.fondoSeguro.aggregate({
                where: { tipo: 'EGRESO_FALLECIMIENTO' },
                _sum: { monto: true },
            });
            const totalEgresos = (utilidadesDistribuidas._sum.montoUtilidad?.toNumber() || 0) +
                (fondoSeguroUtilizado._sum.monto?.toNumber() || 0);
            const utilidadNeta = totalIngresos - totalEgresos;
            const margenRentabilidad = (utilidadNeta / (totalIngresos || 1)) * 100;
            // ROI basado en capital (ahorro total)
            const ahorroTotal = await database_1.prisma.socio.aggregate({
                _sum: { ahorroActual: true },
            });
            const capitalBase = ahorroTotal._sum.ahorroActual?.toNumber() || 1;
            const roi = (utilidadNeta / capitalBase) * 100;
            return {
                ingresos: {
                    interesesCobrados,
                    morasCobradas,
                    primasSeguro: primasSeguro._sum.monto?.toNumber() || 0,
                    total: totalIngresos,
                },
                egresos: {
                    utilidadesDistribuidas: utilidadesDistribuidas._sum.montoUtilidad?.toNumber() || 0,
                    fondoSeguroUtilizado: fondoSeguroUtilizado._sum.monto?.toNumber() || 0,
                    gastosOperativos: 0, // TODO: Implementar si se registran
                    total: totalEgresos,
                },
                utilidadNeta,
                margenRentabilidad,
                roi,
            };
        }
        catch (error) {
            logger_1.default.error('[Dashboard] Error al calcular rentabilidad:', error);
            throw error;
        }
    }
    /**
     * Calcular indicadores de riesgo
     */
    async calcularIndicadoresRiesgo() {
        try {
            const cartera = await this.obtenerCarteraCreditos();
            // Tasa de morosidad (cartera vencida / cartera total)
            const tasaMorosidad = cartera.carteraVencida.porcentajeCartera;
            // Índice de cartera en riesgo (mora > 30 días)
            const carteraRiesgo = cartera.clasificacionMora.moraGrave.monto +
                cartera.clasificacionMora.moraPersistente.monto;
            const indiceCarteraRiesgo = (carteraRiesgo / (cartera.carteraActiva.montoTotal || 1)) * 100;
            // Provisión requerida (5% cartera en riesgo + 100% castigados)
            const provisionRequerida = carteraRiesgo * 0.05 + cartera.clasificacionMora.castigado.monto;
            // Créditos problema (mora > 60 días)
            const creditosProblema = cartera.clasificacionMora.moraPersistente.cantidad +
                cartera.clasificacionMora.castigado.cantidad;
            // Garantías insuficientes (garantías activas con mora > 60 días)
            const garantiasInsuficientes = await database_1.prisma.garantia.count({
                where: {
                    estado: client_1.EstadoGarantia.ACTIVA,
                    credito: {
                        cuotas: {
                            some: {
                                estado: 'PENDIENTE',
                                fechaVencimiento: {
                                    lte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                                },
                            },
                        },
                    },
                },
            });
            // Generar alertas
            const alertas = [];
            if (tasaMorosidad > 5) {
                alertas.push(`⚠️ Tasa de morosidad alta: ${tasaMorosidad.toFixed(1)}%`);
            }
            if (cartera.clasificacionMora.castigado.cantidad > 0) {
                alertas.push(`🚨 ${cartera.clasificacionMora.castigado.cantidad} créditos castigados`);
            }
            if (garantiasInsuficientes > 0) {
                alertas.push(`⚠️ ${garantiasInsuficientes} garantías requieren revisión`);
            }
            if (creditosProblema > 10) {
                alertas.push(`📉 ${creditosProblema} créditos en situación crítica`);
            }
            return {
                tasaMorosidad,
                indiceCarteraRiesgo,
                provisionRequerida,
                creditosProblema,
                garantiasInsuficientes,
                alertas,
            };
        }
        catch (error) {
            logger_1.default.error('[Dashboard] Error al calcular indicadores de riesgo:', error);
            throw error;
        }
    }
    /**
     * Generar proyecciones de los próximos meses
     */
    async generarProyecciones() {
        try {
            // Obtener cuotas pendientes por mes
            const cuotasPendientes = await database_1.prisma.cuota.findMany({
                where: {
                    estado: 'PENDIENTE',
                    fechaVencimiento: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 meses
                    },
                },
                select: {
                    fechaVencimiento: true,
                    monto_interes: true,
                    monto_capital: true,
                },
            });
            // Agrupar por mes
            const proyeccionesPorMes = {};
            cuotasPendientes.forEach((cuota) => {
                const fecha = new Date(cuota.fechaVencimiento);
                const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                if (!proyeccionesPorMes[mesKey]) {
                    proyeccionesPorMes[mesKey] = { ingreso: 0, egreso: 0 };
                }
                proyeccionesPorMes[mesKey].ingreso += cuota.monto_interes.toNumber();
            });
            // Convertir a array
            const proximosMeses = Object.entries(proyeccionesPorMes).map(([mes, datos]) => ({
                mes,
                ingresoProyectado: datos.ingreso,
                egresoProyectado: datos.egreso,
                utilidadProyectada: datos.ingreso - datos.egreso,
            }));
            // Metas vs reales (mes actual)
            const mesActual = new Date();
            mesActual.setDate(1);
            mesActual.setHours(0, 0, 0, 0);
            const cuotasPagadasMes = await database_1.prisma.cuota.findMany({
                where: {
                    estado: 'PAGADA',
                    fechaPago: { gte: mesActual },
                },
                select: { monto_interes: true },
            });
            const realIngresos = cuotasPagadasMes.reduce((acc, c) => acc + c.monto_interes.toNumber(), 0);
            // Meta: 5% sobre cartera activa mensual
            const cartera = await this.obtenerCarteraCreditos();
            const metaIngresos = cartera.carteraActiva.montoTotal * 0.05;
            const cumplimiento = (realIngresos / (metaIngresos || 1)) * 100;
            return {
                proximosMeses,
                metasVsReales: {
                    metaIngresos,
                    realIngresos,
                    cumplimiento,
                },
            };
        }
        catch (error) {
            logger_1.default.error('[Dashboard] Error al generar proyecciones:', error);
            throw error;
        }
    }
    /**
     * Obtener métricas específicas por período
     */
    async obtenerMetricasPorPeriodo(fechaInicio, fechaFin) {
        try {
            // Pagos en el período
            const pagos = await database_1.prisma.pago.findMany({
                where: {
                    fecha: {
                        gte: fechaInicio,
                        lte: fechaFin,
                    },
                },
                select: {
                    monto: true,
                    fecha: true,
                },
            });
            const totalPagos = pagos.reduce((acc, p) => acc + p.monto.toNumber(), 0);
            // Créditos desembolsados en el período
            const creditosDesembolsados = await database_1.prisma.credito.count({
                where: {
                    fechaDesembolso: {
                        gte: fechaInicio,
                        lte: fechaFin,
                    },
                },
            });
            // Nuevos socios en el período
            const nuevosSocios = await database_1.prisma.socio.count({
                where: {
                    fechaIngreso: {
                        gte: fechaInicio,
                        lte: fechaFin,
                    },
                },
            });
            return {
                periodo: { fechaInicio, fechaFin },
                totalPagos,
                cantidadPagos: pagos.length,
                creditosDesembolsados,
                nuevosSocios,
            };
        }
        catch (error) {
            logger_1.default.error('[Dashboard] Error al obtener métricas por período:', error);
            throw error;
        }
    }
}
// Exportar instancia singleton
exports.dashboardService = new DashboardService();
//# sourceMappingURL=dashboard.service.js.map