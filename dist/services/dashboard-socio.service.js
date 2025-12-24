"use strict";
/**
 * ============================================================================
 * Sistema MLF - Servicio de Dashboard del Socio
 * Archivo: src/services/dashboard-socio.service.ts
 * Descripción: Métricas e información personalizada para cada socio
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
class DashboardSocioService {
    /**
     * Obtener dashboard completo del socio
     */
    async obtenerDashboardCompleto(socioId) {
        // Verificar que el socio existe
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
        });
        if (!socio) {
            throw new Error('Socio no encontrado');
        }
        // Obtener métricas con logging detallado para debug
        console.log('[Dashboard] Iniciando obtención de métricas para socio:', socioId);
        let infoPersonal;
        let ahorros;
        let creditos;
        let proximasCuotas;
        let historial;
        let utilidades;
        let estadisticas;
        let garantias;
        try {
            console.log('[Dashboard] Obteniendo info personal...');
            infoPersonal = await this.obtenerInfoPersonal(socioId);
            console.log('[Dashboard] ✓ Info personal OK');
        }
        catch (e) {
            console.error('[Dashboard] ERROR en obtenerInfoPersonal:', e.message);
            throw new Error(`Error en obtenerInfoPersonal: ${e.message}`);
        }
        try {
            console.log('[Dashboard] Obteniendo métricas ahorro...');
            ahorros = await this.obtenerMetricasAhorro(socioId);
            console.log('[Dashboard] ✓ Métricas ahorro OK');
        }
        catch (e) {
            console.error('[Dashboard] ERROR en obtenerMetricasAhorro:', e.message);
            throw new Error(`Error en obtenerMetricasAhorro: ${e.message}`);
        }
        try {
            console.log('[Dashboard] Obteniendo resumen créditos...');
            creditos = await this.obtenerResumenCreditos(socioId);
            console.log('[Dashboard] ✓ Resumen créditos OK');
        }
        catch (e) {
            console.error('[Dashboard] ERROR en obtenerResumenCreditos:', e.message);
            throw new Error(`Error en obtenerResumenCreditos: ${e.message}`);
        }
        try {
            console.log('[Dashboard] Obteniendo próximas cuotas...');
            proximasCuotas = await this.obtenerProximasCuotas(socioId);
            console.log('[Dashboard] ✓ Próximas cuotas OK');
        }
        catch (e) {
            console.error('[Dashboard] ERROR en obtenerProximasCuotas:', e.message);
            throw new Error(`Error en obtenerProximasCuotas: ${e.message}`);
        }
        try {
            console.log('[Dashboard] Obteniendo historial reciente...');
            historial = await this.obtenerHistorialReciente(socioId);
            console.log('[Dashboard] ✓ Historial reciente OK');
        }
        catch (e) {
            console.error('[Dashboard] ERROR en obtenerHistorialReciente:', e.message);
            throw new Error(`Error en obtenerHistorialReciente: ${e.message}`);
        }
        try {
            console.log('[Dashboard] Obteniendo resumen utilidades...');
            utilidades = await this.obtenerResumenUtilidades(socioId);
            console.log('[Dashboard] ✓ Resumen utilidades OK');
        }
        catch (e) {
            console.error('[Dashboard] ERROR en obtenerResumenUtilidades:', e.message);
            throw new Error(`Error en obtenerResumenUtilidades: ${e.message}`);
        }
        try {
            console.log('[Dashboard] Obteniendo estadísticas...');
            estadisticas = await this.obtenerEstadisticas(socioId);
            console.log('[Dashboard] ✓ Estadísticas OK');
        }
        catch (e) {
            console.error('[Dashboard] ERROR en obtenerEstadisticas:', e.message);
            throw new Error(`Error en obtenerEstadisticas: ${e.message}`);
        }
        try {
            console.log('[Dashboard] Obteniendo garantías...');
            garantias = await this.obtenerGarantias(socioId);
            console.log('[Dashboard] ✓ Garantías OK');
        }
        catch (e) {
            console.error('[Dashboard] ERROR en obtenerGarantias:', e.message);
            throw new Error(`Error en obtenerGarantias: ${e.message}`);
        }
        // Obtener lista detallada de créditos (para el panel de estados)
        let creditosDetalle;
        try {
            console.log('[Dashboard] Obteniendo créditos detalle...');
            creditosDetalle = await this.obtenerCreditosDetalle(socioId);
            console.log('[Dashboard] ✓ Créditos detalle OK');
        }
        catch (e) {
            console.error('[Dashboard] ERROR en obtenerCreditosDetalle:', e.message);
            throw new Error(`Error en obtenerCreditosDetalle: ${e.message}`);
        }
        console.log('[Dashboard] Dashboard completo generado exitosamente');
        return {
            socio: infoPersonal,
            ahorros,
            creditos,
            creditosDetalle,
            proximasCuotas,
            historialReciente: historial,
            utilidades,
            estadisticas,
            garantias,
        };
    }
    /**
     * Información personal del socio
     */
    async obtenerInfoPersonal(socioId) {
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
            select: {
                id: true,
                codigo: true,
                nombreCompleto: true,
                email: true,
                etapaActual: true,
                creditosEtapaActual: true,
                fechaRegistro: true,
                estado: true,
            },
        });
        if (!socio) {
            throw new Error('Socio no encontrado');
        }
        // Calcular créditos restantes para pasar a siguiente etapa
        const creditosRequeridos = this.obtenerCreditosRequeridosEtapa(socio.etapaActual);
        const creditosRestantes = Math.max(0, creditosRequeridos - socio.creditosEtapaActual);
        return {
            id: socio.id,
            codigo: socio.codigo,
            nombreCompleto: socio.nombreCompleto,
            email: socio.email,
            etapaActual: socio.etapaActual,
            creditosEnEtapa: socio.creditosEtapaActual,
            creditosRestantesEtapa: creditosRestantes,
            fechaRegistro: socio.fechaRegistro,
            estado: socio.estado,
        };
    }
    /**
     * Métricas de ahorro del socio
     * Incluye cálculo del balance neto (ahorros vs deuda de créditos)
     */
    async obtenerMetricasAhorro(socioId) {
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
            select: {
                ahorroActual: true,
                ahorroCongelado: true,
            },
        });
        if (!socio) {
            throw new Error('Socio no encontrado');
        }
        // Obtener última transacción
        const ultimaTransaccion = await database_1.default.transaccion.findFirst({
            where: { socioId },
            orderBy: { fechaTransaccion: 'desc' },
            select: {
                fechaTransaccion: true,
                tipo: true,
                monto: true,
            },
        });
        // Obtener saldo capital pendiente de créditos DESEMBOLSADOS
        const creditosActivos = await database_1.default.credito.findMany({
            where: {
                socioId,
                estado: client_1.EstadoCredito.DESEMBOLSADO,
            },
            select: {
                saldo_capital: true,
                montoTotal: true, // Capital original del crédito
            },
        });
        // Suma del saldo capital de todos los créditos activos
        const comprometidoEnCreditos = creditosActivos.reduce((sum, c) => sum + (c.saldo_capital?.toNumber() || 0), 0);
        // Calcular progreso del crédito
        const capitalOriginal = creditosActivos.reduce((sum, c) => sum + (c.montoTotal?.toNumber() || 0), 0);
        const capitalPagado = capitalOriginal - comprometidoEnCreditos;
        const porcentajePagado = capitalOriginal > 0
            ? Math.round((capitalPagado / capitalOriginal) * 100)
            : 0;
        // Determinar etapa de progreso (1-8)
        let etapaProgreso = 1;
        if (creditosActivos.length === 0) {
            etapaProgreso = 8; // Sin créditos activos
        }
        else if (porcentajePagado >= 100) {
            etapaProgreso = 7; // Crédito completamente pagado (recuperando ahorros)
        }
        else if (porcentajePagado >= 75) {
            etapaProgreso = 6; // Casi libre (75-99%)
        }
        else if (porcentajePagado >= 50) {
            etapaProgreso = 5; // Pasó la mitad (50-75%)
        }
        else if (porcentajePagado >= 49 && porcentajePagado <= 51) {
            etapaProgreso = 4; // Justo en la mitad (para mensaje especial)
        }
        else if (porcentajePagado >= 25) {
            etapaProgreso = 3; // En camino (25-50%)
        }
        else if (porcentajePagado >= 10) {
            etapaProgreso = 2; // Buen inicio (10-25%)
        }
        else {
            etapaProgreso = 1; // Recién comenzó (0-10%)
        }
        const ahorroActual = socio.ahorroActual.toNumber();
        const ahorroCongelado = socio.ahorroCongelado.toNumber();
        const totalAhorrado = ahorroActual + ahorroCongelado;
        // Balance neto: Ahorros - Deuda de Créditos
        // Si es positivo: el socio tiene ahorros disponibles
        // Si es negativo: el socio debe dinero al proyecto
        const balanceNeto = totalAhorrado - comprometidoEnCreditos;
        const debeAlProyecto = balanceNeto < 0;
        const montoDeudaProyecto = debeAlProyecto ? Math.abs(balanceNeto) : 0;
        // Disponible para retiro: solo si el balance es positivo
        // Si tiene créditos, el disponible es el máximo entre 0 y el balance neto
        const ahorroDisponible = Math.max(0, balanceNeto);
        return {
            ahorroDisponible,
            ahorroCongelado,
            totalAhorrado,
            comprometidoEnCreditos,
            balanceNeto,
            debeAlProyecto,
            montoDeudaProyecto,
            progresoCredito: {
                tieneCreditos: creditosActivos.length > 0,
                capitalOriginal,
                capitalPagado,
                porcentajePagado,
                etapaProgreso,
            },
            ultimoMovimiento: {
                fecha: ultimaTransaccion?.fechaTransaccion || null,
                tipo: ultimaTransaccion?.tipo || null,
                monto: ultimaTransaccion?.monto.toNumber() || 0,
            },
            porcentajeUtilidades: 1.0, // 1% anual sobre ahorros
        };
    }
    /**
     * Resumen de créditos del socio
     */
    async obtenerResumenCreditos(socioId) {
        const creditos = await database_1.default.credito.findMany({
            where: {
                socioId,
                estado: client_1.EstadoCredito.DESEMBOLSADO,
            },
            include: {
                cuotas: {
                    select: {
                        montoCuota: true,
                        monto_capital: true,
                        monto_interes: true,
                        montoPagado: true,
                        fechaVencimiento: true,
                    },
                },
            },
        });
        const creditosActivos = creditos.length;
        let totalPrestado = 0;
        let totalPagado = 0;
        let saldoCapital = 0; // Suma de saldo_capital contable
        let saldoPendiente = 0; // Suma de saldo para liquidar (capital + interés corriente)
        let proximoVencimiento = null;
        let creditoMayorSaldo = null;
        let mayorSaldo = 0;
        creditos.forEach((credito) => {
            // Usar montoTotal (incluye seguro de desgravamen) para ser consistente
            const montoPrestado = credito.montoTotal.toNumber();
            const capitalPendiente = credito.saldo_capital.toNumber();
            // Calcular el saldo para liquidación según política:
            // - Capital total pendiente
            // - + Interés del mes actual (cuota que está corriendo)
            // - + Intereses de cuotas vencidas
            // - NO incluye intereses de meses futuros (se perdonan al liquidar)
            const hoy = new Date();
            let interesesAdeudados = 0;
            credito.cuotas.forEach((cuota) => {
                const fechaVencimiento = new Date(cuota.fechaVencimiento);
                const montoCuota = cuota.montoCuota.toNumber();
                const montoPagado = cuota.montoPagado.toNumber();
                const montoCapital = cuota.monto_capital.toNumber();
                const montoInteres = cuota.monto_interes.toNumber();
                const saldoCuota = montoCuota - montoPagado;
                if (saldoCuota > 0) {
                    // Si la cuota ya venció o vence este mes, incluir su interés
                    if (fechaVencimiento.getFullYear() <= hoy.getFullYear() &&
                        fechaVencimiento.getMonth() <= hoy.getMonth()) {
                        // Calcular cuánto interés falta por pagar de esta cuota
                        const capitalPagadoCuota = Math.min(montoPagado, montoCapital);
                        const interesPagadoCuota = montoPagado - capitalPagadoCuota;
                        const interesPendienteCuota = montoInteres - interesPagadoCuota;
                        interesesAdeudados += interesPendienteCuota;
                    }
                    // Próxima cuota a vencer
                    if (!proximoVencimiento || fechaVencimiento < proximoVencimiento) {
                        proximoVencimiento = fechaVencimiento;
                    }
                }
            });
            const saldoLiquidacion = capitalPendiente + interesesAdeudados;
            totalPrestado += montoPrestado;
            saldoCapital += capitalPendiente;
            saldoPendiente += saldoLiquidacion;
            totalPagado += montoPrestado - capitalPendiente;
            // Crédito con mayor saldo
            if (saldoLiquidacion > mayorSaldo) {
                mayorSaldo = saldoLiquidacion;
                creditoMayorSaldo = {
                    codigo: credito.codigo,
                    saldo: saldoLiquidacion,
                };
            }
        });
        return {
            creditosActivos,
            totalPrestado: this.redondear(totalPrestado),
            totalPagado: this.redondear(totalPagado),
            saldoCapital: this.redondear(saldoCapital),
            saldoPendiente: this.redondear(saldoPendiente),
            proximoVencimiento,
            creditoMayorSaldo,
        };
    }
    /**
     * Próximas cuotas a pagar (todas las pendientes, ordenadas por fecha)
     */
    async obtenerProximasCuotas(socioId) {
        const hoy = new Date();
        const cuotas = await database_1.default.cuota.findMany({
            where: {
                credito: {
                    socioId,
                    estado: client_1.EstadoCredito.DESEMBOLSADO,
                },
                estado: {
                    in: ['PENDIENTE', 'VENCIDA', 'PARCIALMENTE_PAGADA'],
                },
            },
            include: {
                credito: {
                    select: {
                        codigo: true,
                    },
                },
            },
            orderBy: {
                fechaVencimiento: 'asc',
            },
            take: 100, // Aumentado a 100 para permitir precancelación de cuotas futuras con seguridad
        });
        return cuotas.map((cuota) => {
            const montoCuota = cuota.montoCuota.toNumber();
            const montoPagado = cuota.montoPagado.toNumber();
            const saldoPendiente = montoCuota - montoPagado;
            const montoMora = cuota.interes_mora?.toNumber() || 0;
            // Calcular días para vencimiento
            const fechaVenc = new Date(cuota.fechaVencimiento);
            const diasParaVencimiento = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
            return {
                cuotaId: cuota.id,
                creditoCodigo: cuota.credito.codigo,
                numeroCuota: cuota.numeroCuota,
                fechaVencimiento: cuota.fechaVencimiento,
                montoCuota,
                montoPagado,
                saldoPendiente: this.redondear(saldoPendiente),
                diasParaVencimiento,
                estado: cuota.estado,
                tieneMora: montoMora > 0,
                montoMora: this.redondear(montoMora),
            };
        });
    }
    /**
     * Historial reciente de movimientos (últimos 10)
     */
    async obtenerHistorialReciente(socioId) {
        const historial = [];
        // Obtener créditos
        const creditos = await database_1.default.credito.findMany({
            where: { socioId },
            orderBy: { fechaDesembolso: 'desc' },
            take: 3,
            select: {
                id: true,
                codigo: true,
                montoSolicitado: true,
                fechaDesembolso: true,
            },
        });
        creditos.forEach((credito) => {
            if (credito.fechaDesembolso) {
                historial.push({
                    id: credito.id,
                    fecha: credito.fechaDesembolso,
                    tipo: 'CREDITO',
                    descripcion: `Crédito ${credito.codigo} desembolsado`,
                    monto: credito.montoSolicitado.toNumber(),
                    icono: '💳',
                    color: 'primary',
                });
            }
        });
        // Obtener pagos
        const pagos = await database_1.default.pago.findMany({
            where: { socioId },
            orderBy: { fechaPago: 'desc' },
            take: 5,
            select: {
                id: true,
                codigo: true,
                monto_pago: true,
                fechaPago: true,
                credito: {
                    select: {
                        codigo: true,
                    },
                },
            },
        });
        pagos.forEach((pago) => {
            historial.push({
                id: pago.id,
                fecha: pago.fechaPago,
                tipo: 'PAGO',
                descripcion: `Pago ${pago.codigo} - Crédito ${pago.credito.codigo}`,
                monto: pago.monto_pago.toNumber(),
                icono: '💰',
                color: 'success',
            });
        });
        // Obtener transacciones de ahorro
        const transacciones = await database_1.default.transaccion.findMany({
            where: { socioId },
            orderBy: { fechaTransaccion: 'desc' },
            take: 5,
            select: {
                id: true,
                tipo: true,
                monto: true,
                fechaTransaccion: true,
                concepto: true,
            },
        });
        transacciones.forEach((trans) => {
            historial.push({
                id: trans.id,
                fecha: trans.fechaTransaccion,
                tipo: trans.tipo, // 'DEPOSITO' | 'RETIRO'
                descripcion: trans.concepto || `${trans.tipo} en ahorro`,
                monto: trans.monto.toNumber(),
                icono: trans.tipo === 'DEPOSITO' ? '📥' : '📤',
                color: trans.tipo === 'DEPOSITO' ? 'info' : 'warning',
            });
        });
        // Ordenar por fecha descendente y tomar los 10 más recientes
        return historial
            .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
            .slice(0, 10);
    }
    /**
     * Resumen de utilidades recibidas
     */
    async obtenerResumenUtilidades(socioId) {
        const utilidades = await database_1.default.utilidadDetalle.findMany({
            where: { socioId },
            include: {
                utilidad: {
                    select: {
                        a_o: true,
                        semestre: true,
                        fechaDistribucion: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const totalRecibido = utilidades.reduce((sum, u) => sum + u.montoUtilidad.toNumber(), 0);
        const ultimaUtilidad = utilidades[0];
        return {
            totalRecibido: this.redondear(totalRecibido),
            ultimaDistribucion: {
                fecha: ultimaUtilidad?.utilidad.fechaDistribucion || null,
                monto: ultimaUtilidad?.montoUtilidad.toNumber() || 0,
                periodo: ultimaUtilidad
                    ? `${ultimaUtilidad.utilidad.a_o}-S${ultimaUtilidad.utilidad.semestre}`
                    : null,
            },
            proximaDistribucion: this.calcularProximaDistribucion(),
        };
    }
    /**
     * Estadísticas generales del socio
     */
    async obtenerEstadisticas(socioId) {
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
            select: {
                fechaRegistro: true,
            },
        });
        if (!socio) {
            throw new Error('Socio no encontrado');
        }
        // Días como socio
        const hoy = new Date();
        const diasComoSocio = Math.floor((hoy.getTime() - socio.fechaRegistro.getTime()) / (1000 * 60 * 60 * 24));
        // Tasa de cumplimiento (cuotas pagadas a tiempo)
        const cuotasPagadas = await database_1.default.cuota.count({
            where: {
                credito: { socioId },
                estado: 'PAGADA',
                diasMora: 0,
            },
        });
        const cuotasTotales = await database_1.default.cuota.count({
            where: {
                credito: { socioId },
                estado: 'PAGADA',
            },
        });
        const tasaCumplimiento = cuotasTotales > 0 ? (cuotasPagadas / cuotasTotales) * 100 : 100;
        // Promedio de ahorro
        const transacciones = await database_1.default.transaccion.findMany({
            where: { socioId, tipo: 'DEPOSITO' },
            select: { monto: true },
        });
        const promedioAhorro = transacciones.length > 0
            ? transacciones.reduce((sum, t) => sum + t.monto.toNumber(), 0) /
                transacciones.length
            : 0;
        const totalTransacciones = await database_1.default.transaccion.count({
            where: { socioId },
        });
        return {
            diasComoSocio,
            tasaCumplimiento: this.redondear(tasaCumplimiento),
            promedioAhorro: this.redondear(promedioAhorro),
            totalTransacciones,
        };
    }
    // ============================================================================
    // MÉTODOS AUXILIARES
    // ============================================================================
    /**
     * Obtener créditos requeridos por etapa
     */
    obtenerCreditosRequeridosEtapa(etapa) {
        const requerimientos = {
            1: 2, // Etapa 1: 2 créditos
            2: 3, // Etapa 2: 3 créditos
            3: 0, // Etapa 3: sin límite
        };
        return requerimientos[etapa] || 0;
    }
    /**
     * Calcular fecha de próxima distribución de utilidades
     */
    calcularProximaDistribucion() {
        const hoy = new Date();
        const mes = hoy.getMonth() + 1; // 1-12
        if (mes <= 6) {
            return `Junio ${hoy.getFullYear()}`;
        }
        else {
            return `Diciembre ${hoy.getFullYear()}`;
        }
    }
    /**
     * Redondear a 2 decimales
     */
    redondear(valor) {
        return Math.round(valor * 100) / 100;
    }
    // ============================================================================
    // MÉTODOS PÚBLICOS PARA ACCIONES DEL SOCIO
    // ============================================================================
    /**
     * Obtener información del límite de crédito disponible
     */
    async obtenerLimiteCredito(socioId) {
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
            include: {
                creditos: {
                    where: {
                        estado: {
                            in: ['SOLICITADO', 'APROBADO', 'DESEMBOLSADO'],
                        },
                    },
                    include: {
                        moras: {
                            where: { estado: 'ACTIVA' },
                        },
                    },
                },
            },
        });
        if (!socio) {
            throw new Error('Socio no encontrado');
        }
        // Límites por etapa (Topes máximos duros)
        const limitesPorEtapa = {
            1: 500,
            2: 2000,
            3: 10000,
        };
        const etapaActual = socio.etapaActual;
        const topeMaximoEtapa = limitesPorEtapa[etapaActual] || 500;
        // Calcular multiplicador según etapa (Misma lógica que CreditosService)
        let multiplicador = 1.0;
        if (etapaActual === 1) {
            if (socio.creditosEtapaActual === 0)
                multiplicador = 1.25;
            else if (socio.creditosEtapaActual === 1)
                multiplicador = 1.5;
            else if (socio.creditosEtapaActual === 2)
                multiplicador = 1.75;
            else
                multiplicador = 2.0;
        }
        else if (etapaActual === 2) {
            multiplicador = 2.0;
        }
        else if (etapaActual === 3) {
            multiplicador = 3.0;
        }
        // Calcular límite basado en ahorros (Disponible + Congelado)
        const ahorroTotal = socio.ahorroActual.toNumber() + socio.ahorroCongelado.toNumber();
        const limitePorAhorros = ahorroTotal * multiplicador;
        // El límite real es el menor entre el tope de etapa y el cálculo por ahorros
        const limiteReal = Math.min(topeMaximoEtapa, limitePorAhorros);
        // Calcular monto en uso (créditos activos)
        const montoEnUso = socio.creditos.reduce((sum, c) => sum + c.montoTotal.toNumber(), 0);
        const disponible = Math.max(0, limiteReal - montoEnUso);
        // Verificar si tiene moras activas
        const tieneMoras = socio.creditos.some(c => c.moras && c.moras.length > 0);
        let puedesSolicitar = true;
        let razon;
        if (socio.estado !== 'ACTIVO') {
            puedesSolicitar = false;
            razon = 'Tu cuenta no está activa';
        }
        else if (tieneMoras) {
            puedesSolicitar = false;
            razon = 'Tienes mora activa. Regulariza tus pagos primero.';
        }
        else if (disponible <= 0) {
            puedesSolicitar = false;
            razon = 'Has alcanzado el límite de crédito disponible';
        }
        return {
            etapaActual,
            limiteMaximoEtapa: limiteReal, // Devolvemos el límite efectivo para que el frontend muestre el correcto
            creditosActivos: socio.creditos.filter(c => c.estado === 'DESEMBOLSADO').length,
            montoEnUso: this.redondear(montoEnUso),
            disponible: this.redondear(disponible),
            puedesSolicitar,
            razon,
        };
    }
    /**
     * Obtener garantías activas del socio (otorgadas y recibidas)
     */
    async obtenerGarantias(socioId) {
        // Garantías que el socio ha otorgado a otros
        const otorgadas = await database_1.default.garantia.findMany({
            where: {
                socio_garante_id: socioId,
                estado: 'ACTIVA',
            },
            include: {
                credito: { select: { codigo: true } },
                socioGarantizado: {
                    select: { nombreCompleto: true },
                },
            },
        });
        // Garantías que el socio ha recibido de otros
        const recibidas = await database_1.default.garantia.findMany({
            where: {
                socio_garantizado_id: socioId,
                estado: 'ACTIVA',
            },
            include: {
                credito: { select: { codigo: true } },
                garante: {
                    select: { nombreCompleto: true },
                },
            },
        });
        return {
            otorgadas: otorgadas.map(g => ({
                id: g.id,
                creditoCodigo: g.credito?.codigo || '-',
                nombreGarantizado: g.socioGarantizado?.nombreCompleto || 'Socio',
                montoCongelado: g.montoCongelado.toNumber(),
                estado: g.estado,
            })),
            recibidas: recibidas.map(g => ({
                id: g.id,
                creditoCodigo: g.credito?.codigo || '-',
                nombreGarante: g.garante?.nombreCompleto || 'Socio',
                montoCongelado: g.montoCongelado.toNumber(),
                estado: g.estado,
            })),
        };
    }
    /**
     * Obtener lista detallada de créditos del socio
     * Se usa para el panel de estados con timeline
     */
    async obtenerCreditosDetalle(socioId) {
        const creditos = await database_1.default.credito.findMany({
            where: { socioId },
            orderBy: { fechaSolicitud: 'desc' },
            select: {
                id: true,
                codigo: true,
                estado: true,
                montoSolicitado: true,
                montoTotal: true,
                plazoMeses: true,
                fechaSolicitud: true,
                fechaAprobacion: true,
                fechaDesembolso: true,
                saldo_capital: true,
            },
        });
        return creditos.map(credito => ({
            id: credito.id,
            codigo: credito.codigo,
            estado: credito.estado,
            montoSolicitado: credito.montoSolicitado?.toNumber() || 0,
            montoTotal: credito.montoTotal.toNumber(),
            plazoMeses: credito.plazoMeses,
            fechaSolicitud: credito.fechaSolicitud,
            fechaAprobacion: credito.fechaAprobacion,
            fechaDesembolso: credito.fechaDesembolso,
            saldoCapital: credito.saldo_capital?.toNumber() || 0,
        }));
    }
    /**
     * Registrar solicitud de depósito
     * Genera una notificación al administrador para su aprobación
     */
    async registrarSolicitudDeposito(socioId, data) {
        // 1. Validar datos básicos
        if (data.monto <= 0) {
            throw new Error('El monto debe ser mayor a cero');
        }
        // DEBUG: Log the socioId being used to create the notification
        console.log('=== DEBUG registrarSolicitudDeposito ===');
        console.log('socioId recibido (del JWT):', socioId);
        console.log('monto:', data.monto);
        console.log('==========================================');
        // 2. Buscar al administrador para enviarle la notificación
        const admin = await database_1.default.socio.findFirst({
            where: { rol: 'ADMIN' },
        });
        // Si no hay admin, al menos registramos el log, pero no fallamos la request del usuario
        // para no bloquear la UX. Idealmente deberia haber un admin default.
        if (admin) {
            try {
                await database_1.default.notificacion.create({
                    data: {
                        socioId: admin.id,
                        tipo: 'SOLICITUD_DEPOSITO',
                        prioridad: 'ALTA',
                        asunto: 'Nueva Solicitud de Depósito',
                        mensaje: `El socio ${socioId} ha solicitado un depósito de $${data.monto}. Comprobante: ${data.comprobante || 'N/A'}. Observaciones: ${data.observaciones || 'Ninguna'}`,
                        datosAdicionales: {
                            socioId,
                            tipoSolicitud: 'DEPOSITO',
                            monto: data.monto,
                            comprobante: data.comprobante,
                            observaciones: data.observaciones,
                        },
                        canal: 'SISTEMA',
                        estado: 'PENDIENTE',
                        creadaPorId: socioId,
                    },
                });
            }
            catch (error) {
                console.error("Error creando notificacion deposito:", error);
                // No relanzamos para no romper el flujo visual del socio
            }
        }
        else {
            console.warn("ADVERTENCIA: No se encontró usuario ADMIN para notificar depósito.");
        }
        return {
            success: true,
            mensaje: 'Solicitud enviada a revisión',
            fecha: new Date(),
            estado: 'PENDIENTE'
        };
    }
    /**
     * Registrar solicitud de retiro
     * Genera una notificación al administrador
     */
    async registrarSolicitudRetiro(socioId, data) {
        if (data.monto <= 0) {
            throw new Error('El monto debe ser mayor a cero');
        }
        const metricas = await this.obtenerMetricasAhorro(socioId);
        if (metricas.ahorroDisponible < data.monto) {
            throw new Error(`Saldo insuficiente. Disponible: $${metricas.ahorroDisponible}`);
        }
        const admin = await database_1.default.socio.findFirst({ where: { rol: 'ADMIN' } });
        if (admin) {
            try {
                await database_1.default.notificacion.create({
                    data: {
                        socioId: admin.id,
                        tipo: 'SOLICITUD_RETIRO',
                        prioridad: 'ALTA',
                        asunto: 'Nueva Solicitud de Retiro',
                        mensaje: `El socio ${socioId} ha solicitado retirar $${data.monto}. Observaciones: ${data.observaciones || 'Ninguna'}`,
                        datosAdicionales: {
                            socioId,
                            tipoSolicitud: 'RETIRO',
                            monto: data.monto,
                            observaciones: data.observaciones,
                        },
                        canal: 'SISTEMA',
                        estado: 'PENDIENTE',
                        creadaPorId: socioId,
                    },
                });
            }
            catch (error) {
                console.error("Error creando notificacion retiro:", error);
            }
        }
        return {
            success: true,
            mensaje: 'Solicitud de retiro enviada a revisión',
            fecha: new Date(),
            estado: 'PENDIENTE'
        };
    }
    /**
     * Registrar solicitud de PAGO de cuota
     * Genera notificación al admin
     */
    async registrarSolicitudPago(socioId, data) {
        if (data.monto <= 0) {
            throw new Error('El monto debe ser mayor a cero');
        }
        const admin = await database_1.default.socio.findFirst({ where: { rol: 'ADMIN' } });
        if (admin) {
            try {
                await database_1.default.notificacion.create({
                    data: {
                        socioId: admin.id,
                        tipo: 'SOLICITUD_PAGO',
                        prioridad: 'ALTA',
                        asunto: 'Nuevo Pago de Cuota Reportado',
                        mensaje: `El socio ${socioId} ha reportado un pago de $${data.monto}. Comprobante: ${data.comprobante || 'N/A'}.`,
                        datosAdicionales: {
                            socioId,
                            tipoSolicitud: 'PAGO_CUOTA',
                            monto: data.monto,
                            comprobante: data.comprobante,
                            observaciones: data.observaciones,
                        },
                        canal: 'SISTEMA',
                        estado: 'PENDIENTE',
                        creadaPorId: socioId,
                    },
                });
            }
            catch (error) {
                console.error("Error creando notificacion pago:", error);
            }
        }
        return {
            success: true,
            mensaje: 'Pago reportado exitosamente. Pendiente de verificación.',
            fecha: new Date(),
            estado: 'PENDIENTE'
        };
    }
}
exports.default = new DashboardSocioService();
//# sourceMappingURL=dashboard-socio.service.js.map