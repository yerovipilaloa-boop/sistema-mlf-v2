"use strict";
/**
 * ============================================================================
 * Sistema MLF - Servicio de Casos Extremos
 * Archivo: src/services/casos-extremos.service.ts
 * Descripción: Gestión de situaciones excepcionales (fallecimientos, fraude, etc.)
 * ============================================================================
 *
 * CASOS MANEJADOS:
 * 1. Fallecimiento de socio deudor
 * 2. Fallecimiento de garante
 * 3. Detección de fraude
 * 4. Refinanciamiento de créditos
 * 5. Condonación excepcional
 * 6. Emergencias naturales/catástrofes
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoCasoExtremo = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../config/logger"));
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
const notificaciones_service_1 = __importStar(require("./notificaciones.service"));
// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================
var TipoCasoExtremo;
(function (TipoCasoExtremo) {
    TipoCasoExtremo["FALLECIMIENTO_DEUDOR"] = "FALLECIMIENTO_DEUDOR";
    TipoCasoExtremo["FALLECIMIENTO_GARANTE"] = "FALLECIMIENTO_GARANTE";
    TipoCasoExtremo["FRAUDE_DETECTADO"] = "FRAUDE_DETECTADO";
    TipoCasoExtremo["REFINANCIAMIENTO"] = "REFINANCIAMIENTO";
    TipoCasoExtremo["CONDONACION"] = "CONDONACION";
    TipoCasoExtremo["CATASTROFE_NATURAL"] = "CATASTROFE_NATURAL";
})(TipoCasoExtremo || (exports.TipoCasoExtremo = TipoCasoExtremo = {}));
// ============================================================================
// SERVICIO DE CASOS EXTREMOS
// ============================================================================
class CasosExtremosService {
    /**
     * Procesar fallecimiento de socio deudor
     * Se ejecuta el seguro de vida (1% prima) para cubrir deuda
     */
    async procesarFallecimientoDeudor(data, usuarioId) {
        const { socioId, creditoId, fechaFallecimiento, certificadoDefuncion, observaciones, } = data;
        // Verificar socio
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
            include: {
                creditos: {
                    where: {
                        id: creditoId,
                        estado: {
                            in: [types_1.EstadoCredito.DESEMBOLSADO, types_1.EstadoCredito.CASTIGADO],
                        },
                    },
                },
            },
        });
        if (!socio) {
            throw new errors_1.NotFoundError('Socio', socioId);
        }
        const credito = socio.creditos[0];
        if (!credito) {
            throw new errors_1.NotFoundError('Crédito activo', creditoId);
        }
        logger_1.default.warn(`⚠️ Procesando fallecimiento de socio ${socio.codigo} - Crédito ${credito.codigo}`);
        // Procesar en transacción
        const resultado = await database_1.default.$transaction(async (tx) => {
            // 1. Suspender socio
            await tx.socio.update({
                where: { id: socioId },
                data: {
                    estado: types_1.EstadoSocio.INACTIVO,
                    // observaciones: observaciones ?? undefined, // Campo no existe
                },
            });
            // 2. Calcular saldo pendiente del crédito
            const saldoPendiente = credito.saldo_capital.toNumber();
            // 3. Verificar si el seguro cubre el saldo
            const montoCubierto = Math.min(saldoPendiente, credito.montoTotal.toNumber());
            const saldoRestante = Math.max(0, saldoPendiente - montoCubierto);
            // 4. Registrar uso del fondo de seguro
            await tx.fondoSeguro.create({
                data: {
                    tipo: 'EGRESO_FALLECIMIENTO',
                    monto: montoCubierto,
                    creditoId,
                    socioId,
                    concepto: `Cobertura por fallecimiento - ${socio.nombreCompleto} - Ref: ${certificadoDefuncion}`,
                },
            });
            // 5. Actualizar crédito
            const nuevoEstado = saldoRestante === 0
                ? types_1.EstadoCredito.COMPLETADO
                : types_1.EstadoCredito.CASTIGADO;
            await tx.credito.update({
                where: { id: creditoId },
                data: {
                    estado: nuevoEstado,
                    saldo_capital: saldoRestante,
                    // observaciones: `Fallecimiento deudor...` // Campo no existe
                },
            });
            // 6. Si hay saldo restante, notificar a garantes
            if (saldoRestante > 0) {
                const garantias = await tx.garantia.findMany({
                    where: {
                        creditoId,
                        estado: types_1.EstadoGarantia.ACTIVA,
                    },
                    include: {
                        garante: true,
                    },
                });
                // Ejecutar garantías proporcionalmente
                for (const garantia of garantias) {
                    const montoEjecutar = Math.min(garantia.montoCongelado.toNumber(), saldoRestante / garantias.length);
                    await tx.garantia.update({
                        where: { id: garantia.id },
                        // @ts-ignore
                        data: {
                            estado: types_1.EstadoGarantia.EJECUTADA,
                            fechaEjecucion: new Date(),
                            monto_ejecutado: montoEjecutar, // snake_case confirmado
                            motivoEjecucion: `Fallecimiento deudor - Saldo no cubierto por seguro`,
                        },
                    });
                    await tx.socio.update({
                        where: { id: garantia.socio_garante_id }, // snake_case confirmado
                        data: {
                            ahorroCongelado: { decrement: montoEjecutar },
                            ahorroActual: { decrement: montoEjecutar },
                        },
                    });
                    // Notificar garante
                    await notificaciones_service_1.default.enviarNotificacion({
                        socioId: garantia.socio_garante_id,
                        tipo: notificaciones_service_1.TipoNotificacion.GARANTIA_EJECUTADA,
                        canal: [notificaciones_service_1.CanalNotificacion.EMAIL, notificaciones_service_1.CanalNotificacion.SMS],
                        prioridad: notificaciones_service_1.PrioridadNotificacion.URGENTE,
                        datos: {
                            codigoCredito: credito.codigo,
                            nombreDeudor: socio.nombreCompleto,
                            montoEjecutado: montoEjecutar,
                        },
                    });
                }
            }
            else {
                // Liberar garantías si el seguro cubrió todo
                await tx.garantia.updateMany({
                    where: {
                        creditoId,
                        estado: types_1.EstadoGarantia.ACTIVA,
                    },
                    data: {
                        estado: types_1.EstadoGarantia.LIBERADA,
                        fechaLiberacion: new Date(),
                    },
                });
                // Liberar ahorros congelados
                const garantias = await tx.garantia.findMany({
                    where: { creditoId },
                });
                for (const garantia of garantias) {
                    await tx.socio.update({
                        where: { id: garantia.socio_garante_id },
                        data: {
                            ahorroCongelado: { decrement: garantia.montoCongelado.toNumber() },
                        },
                    });
                }
            }
            // 7. Auditoría
            await tx.auditoria.create({
                data: {
                    entidad: 'Socio',
                    accion: 'ACTUALIZAR',
                    entidadId: socioId,
                    usuarioId: usuarioId || null,
                    datosAnteriores: {
                        estado: socio.estado,
                        creditoEstado: credito.estado,
                    },
                    datosNuevos: {
                        estado: types_1.EstadoSocio.INACTIVO,
                        creditoEstado: nuevoEstado,
                        montoCubierto,
                        saldoRestante,
                    },
                    descripcion: `Fallecimiento procesado: ${socio.nombreCompleto} - Seguro: $${montoCubierto}`,
                },
            });
            return {
                socioId,
                creditoId,
                montoCubierto,
                saldoRestante,
                estadoCredito: nuevoEstado,
                garantiasEjecutadas: saldoRestante > 0,
            };
        });
        logger_1.default.info(`✅ Fallecimiento procesado: Socio ${socio.codigo}, Cubierto: $${resultado.montoCubierto}, Restante: $${resultado.saldoRestante}`);
        return resultado;
    }
    /**
     * Procesar fallecimiento de garante
     * Se liberan garantías y se buscan nuevos garantes
     */
    async procesarFallecimientoGarante(data, usuarioId) {
        const { garanteId, fechaFallecimiento, certificadoDefuncion, observaciones } = data;
        const garante = await database_1.default.socio.findUnique({
            where: { id: garanteId },
            include: {
                garantiasOtorgadas: {
                    where: {
                        estado: {
                            in: [types_1.EstadoGarantia.ACTIVA, types_1.EstadoGarantia.EN_LIBERACION],
                        },
                    },
                    include: {
                        credito: {
                            include: {
                                socio: true,
                            },
                        },
                    },
                },
            },
        }); // Cast to any to avoid type error with relations
        if (!garante) {
            throw new errors_1.NotFoundError('Garante', garanteId);
        }
        logger_1.default.warn(`⚠️ Procesando fallecimiento de garante ${garante.codigo} - ${garante.garantiasOtorgadas.length} garantías activas`);
        const resultado = await database_1.default.$transaction(async (tx) => {
            // 1. Suspender garante
            await tx.socio.update({
                where: { id: garanteId },
                data: {
                    estado: types_1.EstadoSocio.INACTIVO,
                    // observaciones: eliminado
                },
            });
            // 2. Liberar todas las garantías
            const garantiasLiberadas = [];
            for (const garantia of garante.garantiasOtorgadas) {
                await tx.garantia.update({
                    where: { id: garantia.id },
                    data: {
                        estado: types_1.EstadoGarantia.LIBERADA,
                        fechaLiberacion: new Date(),
                    },
                });
                // Liberar ahorro congelado
                await tx.socio.update({
                    where: { id: garanteId },
                    data: {
                        ahorroCongelado: { decrement: garantia.montoCongelado.toNumber() },
                    },
                });
                garantiasLiberadas.push({
                    creditoId: garantia.creditoId,
                    codigoCredito: garantia.credito.codigo,
                    deudor: garantia.credito.socio.nombreCompleto,
                    montoLiberado: garantia.montoCongelado.toNumber(),
                });
                // 3. Marcar crédito
                await tx.credito.update({
                    where: { id: garantia.creditoId },
                    data: {
                    // observaciones no existe
                    },
                });
            }
            // 4. Auditoría
            await tx.auditoria.create({
                data: {
                    entidad: 'Socio',
                    accion: 'ACTUALIZAR',
                    entidadId: garanteId,
                    usuarioId: usuarioId || null,
                    datosNuevos: {
                        estado: types_1.EstadoSocio.INACTIVO,
                        garantiasLiberadas: garantiasLiberadas.length,
                    },
                    descripcion: `Fallecimiento garante: ${garante.nombreCompleto} - ${garantiasLiberadas.length} garantías liberadas`,
                },
            });
            return {
                garanteId,
                nombreGarante: garante.nombreCompleto,
                garantiasLiberadas,
                totalLiberado: garantiasLiberadas.reduce((sum, g) => sum + g.montoLiberado, 0),
            };
        });
        logger_1.default.info(`✅ Fallecimiento garante procesado: ${garante.codigo}, ${resultado.garantiasLiberadas.length} garantías liberadas`);
        return resultado;
    }
    /**
     * Detectar y marcar posible fraude
     */
    async detectarFraude(data, usuarioId) {
        const { socioId, tipo, descripcion, evidencias = [], gravedad } = data;
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
            include: {
                creditos: {
                    where: {
                        estado: {
                            in: [types_1.EstadoCredito.DESEMBOLSADO, types_1.EstadoCredito.APROBADO],
                        },
                    },
                },
            },
        });
        if (!socio) {
            throw new errors_1.NotFoundError('Socio', socioId);
        }
        logger_1.default.warn(`🚨 FRAUDE DETECTADO: Socio ${socio.codigo}, Tipo: ${tipo}, Gravedad: ${gravedad}`);
        const resultado = await database_1.default.$transaction(async (tx) => {
            // 1. Suspender socio inmediatamente
            await tx.socio.update({
                where: { id: socioId },
                data: {
                    estado: types_1.EstadoSocio.INACTIVO,
                    // observaciones: descripcion,
                },
            });
            // 2. Suspender créditos activos
            const creditosSuspendidos = [];
            for (const credito of socio.creditos) {
                await tx.credito.update({
                    where: { id: credito.id },
                    data: {
                        estado: types_1.EstadoCredito.CASTIGADO,
                        // observaciones: `SUSPENDIDO POR FRAUDE: ${tipo}`,
                    },
                });
                creditosSuspendidos.push(credito.codigo);
            }
            // 3. Auditoría de fraude
            await tx.auditoria.create({
                data: {
                    entidad: 'Socio',
                    accion: 'ACTUALIZAR',
                    entidadId: socioId,
                    usuarioId: usuarioId || null,
                    datosAnteriores: { estado: 'ACTIVO' },
                    datosNuevos: {
                        estado: types_1.EstadoSocio.INACTIVO,
                        tipoFraude: tipo,
                        gravedad,
                    },
                    descripcion: `🚨 FRAUDE: ${tipo} - ${descripcion}`,
                },
            });
            // 4. Notificar a administradores
            // TODO: Implementar notificación
            return {
                socioId,
                nombreSocio: socio.nombreCompleto,
                codigoSocio: socio.codigo,
                tipo,
                gravedad,
                creditosSuspendidos,
                mensaje: 'Socio y créditos suspendidos por fraude detectado',
            };
        });
        return resultado;
    }
    /**
     * Refinanciar crédito
     */
    async refinanciarCredito(data, usuarioId) {
        const { creditoId, nuevoPlazoMeses, nuevaTasaInteres, motivoRefinanciamiento, quitas = 0, } = data;
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            include: {
                socio: true,
                cuotas: true,
            },
        });
        if (!credito) {
            throw new errors_1.NotFoundError('Crédito', creditoId);
        }
        if (credito.estado !== types_1.EstadoCredito.DESEMBOLSADO) {
            throw new errors_1.BusinessRuleError('Solo se pueden refinanciar créditos DESEMBOLSADOS');
        }
        logger_1.default.info(`Refinanciando crédito ${credito.codigo}: Plazo ${nuevoPlazoMeses} meses, Quita $${quitas}`);
        const resultado = await database_1.default.$transaction(async (tx) => {
            // 1. Calcular nuevo saldo (saldo actual - quitas)
            const saldoActual = credito.saldo_capital.toNumber();
            const nuevoSaldo = saldoActual - quitas;
            if (nuevoSaldo <= 0) {
                throw new errors_1.ValidationError('Las quitas no pueden ser mayores al saldo');
            }
            // 2. Marcar cuotas antiguas como CANCELADAS
            await tx.cuota.updateMany({
                where: {
                    creditoId,
                    estado: {
                        in: ['PENDIENTE', 'VENCIDA'],
                    },
                },
                data: {
                    estado: 'CANCELADA',
                    // observaciones no existe en Cuota
                },
            });
            // 3. Actualizar crédito
            const tasaFinal = nuevaTasaInteres || credito.tasa_interes_mensual.toNumber();
            await tx.credito.update({
                where: { id: creditoId },
                data: {
                    saldo_capital: nuevoSaldo,
                    plazoMeses: nuevoPlazoMeses,
                    tasa_interes_mensual: tasaFinal, // Nota: Convertir si es necesario, pero manteniendo tipo
                    // observaciones: `Refinanciado: ${motivoRefinanciamiento}${quitas > 0 ? ` - Quita: $${quitas}` : ''}`,
                },
            });
            // 4. Generar nueva tabla de amortización
            // TODO: Llamar a amortizationService para generar nuevas cuotas
            // 5. Si hay quitas, registrar en auditoría
            if (quitas > 0) {
                await tx.auditoria.create({
                    data: {
                        entidad: 'Credito',
                        accion: 'ACTUALIZAR',
                        entidadId: creditoId,
                        usuarioId: usuarioId || null,
                        datosAnteriores: {
                            saldo: saldoActual,
                            plazo: credito.plazoMeses,
                        },
                        datosNuevos: {
                            saldo: nuevoSaldo,
                            plazo: nuevoPlazoMeses,
                            quitas,
                        },
                        descripcion: `Refinanciamiento: ${motivoRefinanciamiento}`,
                    },
                });
            }
            return {
                creditoId,
                codigoCredito: credito.codigo,
                saldoAnterior: saldoActual,
                nuevoSaldo,
                quitas,
                nuevoPlazosaldo: nuevoPlazoMeses,
                nuevaTasa: tasaFinal,
            };
        });
        // Notificar al socio
        await notificaciones_service_1.default.enviarNotificacion({
            socioId: credito.socioId,
            tipo: notificaciones_service_1.TipoNotificacion.CREDITO_DESEMBOLSADO, // Reutilizar o crear nuevo tipo
            canal: [notificaciones_service_1.CanalNotificacion.EMAIL],
            datos: {
                codigoCredito: credito.codigo,
                mensaje: `Tu crédito ha sido refinanciado. Nuevo plazo: ${nuevoPlazoMeses} meses${quitas > 0 ? `. Quita aplicada: $${quitas}` : ''}`,
            },
        });
        return resultado;
    }
    /**
     * Condonar deuda (casos excepcionales)
     */
    async condonarDeuda(data, usuarioId) {
        const { creditoId, montoCondonado, motivo, autorizadoPor } = data;
        if (!usuarioId || usuarioId !== autorizadoPor) {
            throw new errors_1.ValidationError('La condonación debe ser autorizada por un administrador');
        }
        const credito = await database_1.default.credito.findUnique({
            where: { id: creditoId },
            include: { socio: true },
        });
        if (!credito) {
            throw new errors_1.NotFoundError('Crédito', creditoId);
        }
        const saldoActual = credito.saldo_capital.toNumber();
        if (montoCondonado > saldoActual) {
            throw new errors_1.ValidationError('El monto a condonar no puede exceder el saldo del crédito');
        }
        logger_1.default.warn(`⚠️ CONDONACIÓN: Crédito ${credito.codigo}, Monto: $${montoCondonado}, Motivo: ${motivo}`);
        const resultado = await database_1.default.$transaction(async (tx) => {
            const nuevoSaldo = saldoActual - montoCondonado;
            await tx.credito.update({
                where: { id: creditoId },
                data: {
                    saldo_capital: nuevoSaldo,
                    // observaciones: `Condonación: $${montoCondonado} - ${motivo}`,
                },
            });
            // Auditoría detallada
            await tx.auditoria.create({
                data: {
                    entidad: 'Credito',
                    accion: 'ACTUALIZAR',
                    entidadId: creditoId,
                    usuarioId,
                    datosAnteriores: { saldo: saldoActual },
                    datosNuevos: { saldo: nuevoSaldo, condonacion: montoCondonado },
                    descripcion: `⚠️ CONDONACIÓN: $${montoCondonado} - ${motivo} - Autorizado por ID ${autorizadoPor}`,
                },
            });
            return {
                creditoId,
                codigoCredito: credito.codigo,
                saldoAnterior: saldoActual,
                nuevoSaldo,
                montoCondonado,
                motivo,
            };
        });
        return resultado;
    }
    /**
     * Procesar catástrofe natural (suspensión masiva de pagos)
     */
    async procesarCatastrofe(descripcion, sociosAfectados, mesesGracia, usuarioId) {
        logger_1.default.warn(`🌪️ CATÁSTROFE: ${descripcion} - ${sociosAfectados.length} socios afectados`);
        const resultado = await database_1.default.$transaction(async (tx) => {
            const creditosExtendidos = [];
            for (const socioId of sociosAfectados) {
                const creditos = await tx.credito.findMany({
                    where: {
                        socioId,
                        estado: types_1.EstadoCredito.DESEMBOLSADO,
                    },
                });
                for (const credito of creditos) {
                    // Extender plazo
                    await tx.credito.update({
                        where: { id: credito.id },
                        data: {
                            plazoMeses: credito.plazoMeses + mesesGracia,
                            // observaciones no existe
                        },
                    });
                    // Postergar cuotas pendientes
                    await tx.cuota.updateMany({
                        where: {
                            creditoId: credito.id,
                            estado: {
                                in: ['PENDIENTE', 'VENCIDA'],
                            },
                        },
                        data: {
                        // Mover fechas de vencimiento
                        // observaciones no existe
                        },
                    });
                    creditosExtendidos.push(credito.codigo);
                }
            }
            // Auditoría masiva
            await tx.auditoria.create({
                data: {
                    entidad: 'Credito',
                    accion: 'ACTUALIZAR',
                    entidadId: 0, // No aplica un solo ID
                    usuarioId: usuarioId || null,
                    datosNuevos: {
                        catastrofe: descripcion,
                        sociosAfectados: sociosAfectados.length,
                        mesesGracia,
                    },
                    descripcion: `🌪️ CATÁSTROFE: ${descripcion} - ${sociosAfectados.length} socios, ${creditosExtendidos.length} créditos extendidos`,
                },
            });
            return {
                sociosAfectados: sociosAfectados.length,
                creditosExtendidos: creditosExtendidos.length,
                mesesGracia,
                descripcion,
            };
        });
        return resultado;
    }
}
exports.default = new CasosExtremosService();
//# sourceMappingURL=casos-extremos.service.js.map