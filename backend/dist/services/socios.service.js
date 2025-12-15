"use strict";
/**
 * ============================================================================
 * Sistema MLF - Servicio de Gestión de Socios
 * Archivo: src/services/socios.service.ts
 * Descripción: Lógica de negocio para gestión de socios
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const env_1 = __importDefault(require("../config/env"));
const logger_1 = __importDefault(require("../config/logger"));
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
// ============================================================================
// SERVICIO DE SOCIOS
// ============================================================================
class SociosService {
    /**
     * Crear nuevo socio
     * Implementa RN-SOC-001 a RN-SOC-008
     */
    async crearSocio(data, creadorId) {
        const { nombreCompleto, documentoIdentidad, fechaNacimiento, direccion, ciudad, telefono, email, depositoInicial, recomendadores, usuario, password, etapaActual, } = data;
        // ============================================================================
        // VALIDACIONES DE DATOS
        // ============================================================================
        // Validar cédula ecuatoriana (RN-SOC-001)
        (0, validators_1.validarCedulaOrThrow)(documentoIdentidad);
        // Validar formato de datos
        (0, validators_1.validarEmailOrThrow)(email);
        (0, validators_1.validarTelefonoOrThrow)(telefono);
        (0, validators_1.validarMayorEdadOrThrow)(fechaNacimiento, 18); // RN-SOC-002
        // Validar depósito inicial mínimo (RN-SOC-005)
        const depositoMinimo = await this.obtenerConfiguracion('AHORRO_DEPOSITO_INICIAL_MINIMO', 50);
        if (depositoInicial < depositoMinimo) {
            throw new errors_1.SocioBusinessError(`El depósito inicial debe ser al menos $${depositoMinimo.toFixed(2)}`);
        }
        // ============================================================================
        // VERIFICAR DUPLICADOS
        // ============================================================================
        // Verificar documento único (RN-SOC-001)
        const documentoExiste = await database_1.default.socio.findUnique({
            where: { documentoIdentidad },
        });
        if (documentoExiste) {
            throw new errors_1.DocumentoDuplicadoError(documentoIdentidad);
        }
        // Verificar email único
        const emailExiste = await database_1.default.socio.findFirst({
            where: { email },
        });
        if (emailExiste) {
            throw new errors_1.EmailDuplicadoError(email);
        }
        // Validar usuario único
        (0, validators_1.validarUsernameOrThrow)(usuario);
        const usuarioExiste = await database_1.default.socio.findUnique({
            where: { usuario },
        });
        if (usuarioExiste) {
            throw new errors_1.UsuarioDuplicadoError(usuario);
        }
        // ============================================================================
        // VALIDAR RECOMENDADORES (RN-SOC-007, RN-SOC-008)
        // ============================================================================
        // Verificar si el creador es ADMIN
        let esAdmin = false;
        if (creadorId) {
            const creador = await database_1.default.socio.findUnique({
                where: { id: creadorId },
                select: { rol: true },
            });
            esAdmin = creador?.rol === 'ADMIN';
        }
        // Log de la etapa que se va a asignar
        if (etapaActual && esAdmin) {
            logger_1.default.info(`Admin asignando etapa ${etapaActual} al crear socio ${nombreCompleto}`);
        }
        const recomendadoresRequeridos = await this.obtenerConfiguracion('RECOMENDADORES_REQUERIDOS', 2);
        // Si es ADMIN, permitir flexibilidad en recomendadores
        if (!esAdmin) {
            // Para usuarios no-admin, aplicar validación estricta
            if (!recomendadores || recomendadores.length < recomendadoresRequeridos) {
                throw new errors_1.SocioBusinessError(`Se requieren al menos ${recomendadoresRequeridos} recomendadores`);
            }
        }
        else {
            // Para ADMIN, permitir menos recomendadores o recomendadores duplicados
            logger_1.default.info(`Admin creando socio - validación de recomendadores relajada`);
        }
        // Verificar que recomendadores existan
        const recomendadoresUnicos = [...new Set(recomendadores)]; // Eliminar duplicados para validación
        for (const recomendadorId of recomendadoresUnicos) {
            const recomendador = await database_1.default.socio.findUnique({
                where: { id: recomendadorId },
            });
            if (!recomendador) {
                throw new errors_1.NotFoundError(`Recomendador ID ${recomendadorId} no encontrado`);
            }
            // Si no es ADMIN, validar Etapa 3 y estado ACTIVO estrictamente
            if (!esAdmin) {
                if (recomendador.etapaActual !== 3) {
                    throw new errors_1.SocioBusinessError(`El recomendador ${recomendador.nombreCompleto} debe estar en Etapa Especial (3)`);
                }
                if (recomendador.estado !== 'ACTIVO') {
                    throw new errors_1.SocioBusinessError(`El recomendador ${recomendador.nombreCompleto} debe estar ACTIVO`);
                }
            }
            else {
                // Para ADMIN, solo validar que esté ACTIVO (puede ser cualquier etapa)
                if (recomendador.estado !== 'ACTIVO') {
                    throw new errors_1.SocioBusinessError(`El recomendador ${recomendador.nombreCompleto} debe estar ACTIVO`);
                }
            }
            // Validar límite de 3 recomendados (RN-SOC-008)
            // Esta validación reemplaza al trigger 'after_insert_socio_validar_recomendadores'
            const recomendacionesDadas = await database_1.default.recomendacion.count({
                where: { socioRecomendadorId: recomendadorId },
            });
            if (recomendacionesDadas >= 3) {
                throw new errors_1.SocioBusinessError(`El recomendador ${recomendador.nombreCompleto} ha alcanzado el límite de 3 recomendaciones permitidas (RN-SOC-008)`);
            }
        }
        // ============================================================================
        // GENERAR CÓDIGO ÚNICO
        // ============================================================================
        const codigo = await this.generarCodigoSocio();
        // Generar hash del password
        const passwordHash = await bcryptjs_1.default.hash(password, env_1.default.bcryptRounds);
        // ============================================================================
        // CREAR SOCIO EN TRANSACCIÓN
        // ============================================================================
        const nuevoSocio = await database_1.default.$transaction(async (tx) => {
            // 0. Deshabilitar temporalmente triggers problemáticos
            // 0. Triggers deshabilitados (Manejado por lógica de aplicación)
            // 1. Crear socio
            // Si el admin especificó una etapa, usarla; si no, por defecto Etapa 1 (Iniciante)
            const etapaInicial = etapaActual && [1, 2, 3].includes(etapaActual) ? etapaActual : 1;
            const socio = await tx.socio.create({
                data: {
                    codigo,
                    nombreCompleto: (0, validators_1.sanitizarNombre)(nombreCompleto),
                    documentoIdentidad,
                    fechaNacimiento: new Date(fechaNacimiento),
                    direccion,
                    ciudad,
                    telefono,
                    email,
                    usuario,
                    passwordHash,
                    rol: 'SOCIO', // Por defecto rol SOCIO
                    ahorroActual: depositoInicial,
                    ahorroCongelado: 0,
                    etapaActual: etapaInicial, // Respeta la etapa seleccionada por el admin
                    creditosEtapaActual: 0,
                    estado: 'ACTIVO',
                },
            });
            // 2. Registrar recomendaciones (solo únicos, ya que hay constraint UNIQUE)
            const recomendadoresUnicos = [...new Set(recomendadores)];
            for (const recomendadorId of recomendadoresUnicos) {
                await tx.recomendacion.create({
                    data: {
                        socioRecomendadoId: socio.id,
                        socioRecomendadorId: recomendadorId,
                    },
                });
            }
            // 3. Registrar transacción de depósito inicial
            await tx.transaccion.create({
                data: {
                    codigo: await this.generarCodigoTransaccion(socio.id, tx),
                    socioId: socio.id,
                    tipo: 'DEPOSITO',
                    monto: depositoInicial,
                    saldoAnterior: 0,
                    saldoNuevo: depositoInicial,
                    metodo: 'EFECTIVO', // Asumir efectivo por defecto
                    concepto: 'Depósito inicial de nuevo socio',
                },
            });
            // 4. Registrar auditoría
            await tx.auditoria.create({
                data: {
                    usuarioId: creadorId,
                    entidad: 'socios',
                    entidadId: socio.id,
                    accion: 'CREAR',
                    descripcion: `Nuevo socio registrado: ${socio.codigo} - ${nombreCompleto}`,
                    datosNuevos: {
                        codigo: socio.codigo,
                        nombreCompleto,
                        email,
                        etapa: 1,
                        depositoInicial,
                    },
                    exitosa: true,
                },
            });
            // 5. Rehabilitar triggers
            // 5. Triggers rehabilitados (Manejado por lógica de aplicación)
            return socio;
        });
        logger_1.default.info(`Socio creado exitosamente: ${nuevoSocio.codigo} - ${nombreCompleto}`);
        // Retornar con recomendadores
        return await this.obtenerSocioPorId(nuevoSocio.id);
    }
    /**
     * Obtener socio por ID
     */
    async obtenerSocioPorId(id) {
        const socio = await database_1.default.socio.findUnique({
            where: { id },
            include: {
                recomendacionesRecibidas: {
                    include: {
                        socioRecomendador: {
                            select: {
                                id: true,
                                codigo: true,
                                nombreCompleto: true,
                                etapaActual: true,
                            },
                        },
                    },
                },
                creditos: {
                    select: {
                        id: true,
                        codigo: true,
                        montoTotal: true,
                        saldo_capital: true,
                        estado: true,
                        fechaSolicitud: true,
                    },
                    orderBy: {
                        fechaSolicitud: 'desc',
                    },
                    take: 5, // Últimos 5 créditos
                },
            },
        });
        if (!socio) {
            throw new errors_1.NotFoundError(`Socio con ID ${id} no encontrado`);
        }
        // Calcular ahorro comprometido (RN-AHO-001)
        // Suma del saldo_capital de todos los créditos DESEMBOLSADOS
        const ahorroComprometido = socio.creditos
            .filter((c) => c.estado === 'DESEMBOLSADO')
            .reduce((sum, c) => sum + (c.saldo_capital ? parseFloat(c.saldo_capital.toString()) : 0), 0);
        // Calcular ahorro disponible (RN-AHO-002)
        const ahorroDisponible = socio.ahorroActual.toNumber() - ahorroComprometido - socio.ahorroCongelado.toNumber();
        const socioFormateado = this.formatearSocio(socio);
        return {
            ...socioFormateado,
            ahorroComprometido,
            ahorroDisponible,
        };
    }
    /**
     * Obtener socio por código
     */
    async obtenerSocioPorCodigo(codigo) {
        const socio = await database_1.default.socio.findUnique({
            where: { codigo },
            include: {
                recomendacionesRecibidas: {
                    include: {
                        socioRecomendador: {
                            select: {
                                id: true,
                                codigo: true,
                                nombreCompleto: true,
                                etapaActual: true,
                            },
                        },
                    },
                },
            },
        });
        if (!socio) {
            throw new errors_1.NotFoundError(`Socio con código ${codigo} no encontrado`);
        }
        return this.formatearSocio(socio);
    }
    /**
     * Listar socios con filtros y paginación
     */
    async listarSocios(filtros) {
        const { page = 1, limit = 20, estado, etapa, busqueda } = filtros;
        // Construir filtros
        const where = {};
        if (estado) {
            where.estado = estado;
        }
        if (etapa) {
            where.etapaActual = etapa;
        }
        if (busqueda) {
            where.OR = [
                { nombreCompleto: { contains: busqueda, mode: 'insensitive' } },
                { codigo: { contains: busqueda, mode: 'insensitive' } },
                { documentoIdentidad: { contains: busqueda } },
                { email: { contains: busqueda, mode: 'insensitive' } },
            ];
        }
        // Contar total
        const total = await database_1.default.socio.count({ where });
        // Obtener socios
        const socios = await database_1.default.socio.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                fechaRegistro: 'desc',
            },
            select: {
                id: true,
                codigo: true,
                nombreCompleto: true,
                documentoIdentidad: true,
                email: true,
                telefono: true,
                ahorroActual: true,
                etapaActual: true,
                estado: true,
                creditosEtapaActual: true,
                fechaRegistro: true,
            },
        });
        return {
            socios,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    /**
     * Actualizar información del socio
     */
    async actualizarSocio(id, data, usuarioId) {
        // Verificar que el socio existe
        const socioExistente = await database_1.default.socio.findUnique({
            where: { id },
        });
        if (!socioExistente) {
            throw new errors_1.NotFoundError(`Socio con ID ${id} no encontrado`);
        }
        // Preparar datos para actualización
        const updateData = {};
        // Validaciones y preparación de datos
        if (data.nombreCompleto !== undefined) {
            updateData.nombreCompleto = (0, validators_1.sanitizarNombre)(data.nombreCompleto);
        }
        if (data.email !== undefined) {
            (0, validators_1.validarEmailOrThrow)(data.email);
            // Verificar email único
            const emailExiste = await database_1.default.socio.findFirst({
                where: {
                    email: data.email,
                    NOT: { id },
                },
            });
            if (emailExiste) {
                throw new errors_1.EmailDuplicadoError(data.email);
            }
            updateData.email = data.email;
        }
        if (data.telefono !== undefined) {
            (0, validators_1.validarTelefonoOrThrow)(data.telefono);
            updateData.telefono = data.telefono;
        }
        if (data.direccion !== undefined) {
            updateData.direccion = data.direccion;
        }
        if (data.ciudad !== undefined) {
            updateData.ciudad = data.ciudad;
        }
        if (data.documentoIdentidad !== undefined) {
            (0, validators_1.validarCedulaOrThrow)(data.documentoIdentidad);
            // Verificar documento único
            const documentoExiste = await database_1.default.socio.findFirst({
                where: {
                    documentoIdentidad: data.documentoIdentidad,
                    NOT: { id },
                },
            });
            if (documentoExiste) {
                throw new errors_1.DocumentoDuplicadoError(data.documentoIdentidad);
            }
            updateData.documentoIdentidad = data.documentoIdentidad;
        }
        if (data.fechaNacimiento !== undefined) {
            const fechaNac = typeof data.fechaNacimiento === 'string'
                ? new Date(data.fechaNacimiento)
                : data.fechaNacimiento;
            (0, validators_1.validarMayorEdadOrThrow)(fechaNac, 18);
            updateData.fechaNacimiento = fechaNac;
        }
        if (data.estado !== undefined) {
            updateData.estado = data.estado;
        }
        if (data.usuario !== undefined) {
            (0, validators_1.validarUsernameOrThrow)(data.usuario);
            // Verificar usuario único
            const usuarioExiste = await database_1.default.socio.findFirst({
                where: {
                    usuario: data.usuario,
                    NOT: { id },
                },
            });
            if (usuarioExiste) {
                throw new errors_1.UsuarioDuplicadoError(data.usuario);
            }
            updateData.usuario = data.usuario;
        }
        if (data.password !== undefined && data.password !== '') {
            // Hash de la contraseña
            const hashedPassword = await bcryptjs_1.default.hash(data.password, env_1.default.bcryptRounds);
            updateData.passwordHash = hashedPassword;
        }
        // Manejar cambio de etapa
        if (data.etapaActual !== undefined && data.etapaActual !== socioExistente.etapaActual) {
            // Validar que la etapa sea válida (1, 2, o 3)
            if (![1, 2, 3].includes(data.etapaActual)) {
                throw new errors_1.BadRequestError('La etapa debe ser 1, 2 o 3');
            }
            logger_1.default.info(`Cambio de etapa para socio ${socioExistente.codigo}: ` +
                `Etapa ${socioExistente.etapaActual} → Etapa ${data.etapaActual}`);
            updateData.etapaActual = data.etapaActual;
            // Resetear contador de créditos al cambiar de etapa
            updateData.creditosEtapaActual = 0;
            logger_1.default.info(`Contador de créditos reseteado a 0 para socio ${socioExistente.codigo}`);
        }
        // Actualizar
        const socioActualizado = await database_1.default.$transaction(async (tx) => {
            const socio = await tx.socio.update({
                where: { id },
                data: updateData,
            });
            // Preparar descripción detallada de auditoría
            let descripcionAuditoria = `Información del socio ${socio.codigo} actualizada`;
            if (data.etapaActual !== undefined && data.etapaActual !== socioExistente.etapaActual) {
                descripcionAuditoria += ` | Cambio de etapa: ${socioExistente.etapaActual} → ${data.etapaActual} (contador reseteado a 0)`;
            }
            // Registrar auditoría
            await tx.auditoria.create({
                data: {
                    usuarioId,
                    entidad: 'socios',
                    entidadId: id,
                    accion: 'ACTUALIZAR',
                    descripcion: descripcionAuditoria,
                    datosAnteriores: socioExistente,
                    datosNuevos: updateData,
                    exitosa: true,
                },
            });
            return socio;
        });
        logger_1.default.info(`Socio actualizado: ${socioActualizado.codigo}`);
        return await this.obtenerSocioPorId(id);
    }
    /**
     * Depositar ahorro
     * Implementa RN-AHO-001
     */
    async depositarAhorro(data, usuarioId) {
        const { socioId, monto, metodo, numeroReferencia, concepto } = data;
        (0, validators_1.validarMontoPositivoOrThrow)(monto, 'Monto de depósito');
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
        });
        if (!socio) {
            throw new errors_1.NotFoundError(`Socio con ID ${socioId} no encontrado`);
        }
        if (socio.estado !== 'ACTIVO') {
            throw new errors_1.SocioBusinessError('Solo socios ACTIVOS pueden depositar ahorros');
        }
        // Realizar depósito en transacción
        const resultado = await database_1.default.$transaction(async (tx) => {
            // Registrar transacción (el trigger actualiza el saldo automáticamente)
            const transaccion = await tx.transaccion.create({
                data: {
                    codigo: await this.generarCodigoTransaccion(socioId, tx),
                    socioId,
                    tipo: 'DEPOSITO',
                    monto,
                    saldoAnterior: socio.ahorroActual,
                    saldoNuevo: 0, // El trigger lo calculará
                    metodo,
                    referencia_externa: numeroReferencia,
                    concepto: concepto || 'Depósito de ahorro',
                },
            });
            // Obtener socio actualizado después del trigger
            const socioActualizado = await tx.socio.findUnique({
                where: { id: socioId },
            });
            // Auditoría
            await tx.auditoria.create({
                data: {
                    usuarioId,
                    entidad: 'transacciones',
                    entidadId: transaccion.id,
                    accion: 'CREAR',
                    descripcion: `Depósito de $${monto.toFixed(2)} para socio ${socio.codigo}`,
                    datosNuevos: {
                        socio: socio.codigo,
                        monto,
                        nuevoSaldo: socioActualizado?.ahorroActual.toNumber(),
                    },
                    exitosa: true,
                },
            });
            return { socioActualizado, transaccion };
        });
        logger_1.default.info(`Depósito exitoso: ${socio.codigo} - $${monto.toFixed(2)} - Nuevo saldo: $${resultado.socioActualizado.ahorroActual.toFixed(2)}`);
        return resultado.transaccion;
    }
    /**
     * Retirar ahorro
     * Implementa RN-AHO-002, RN-AHO-003
     */
    async retirarAhorro(data, usuarioId) {
        const { socioId, monto, metodo, numeroReferencia, concepto } = data;
        (0, validators_1.validarMontoPositivoOrThrow)(monto, 'Monto de retiro');
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
        });
        if (!socio) {
            throw new errors_1.NotFoundError(`Socio con ID ${socioId} no encontrado`);
        }
        if (socio.estado !== 'ACTIVO') {
            throw new errors_1.SocioBusinessError('Solo socios ACTIVOS pueden retirar ahorros');
        }
        // Verificar ahorro disponible (RN-AHO-002)
        const ahorroDisponible = socio.ahorroActual.toNumber() - socio.ahorroCongelado.toNumber();
        if (monto > ahorroDisponible) {
            throw new errors_1.AhorroInsuficienteError(ahorroDisponible, monto);
        }
        // Verificar saldo mínimo (RN-AHO-003)
        const ahorroMinimo = await this.obtenerConfiguracion('AHORRO_MINIMO_ACTIVO', 10);
        const nuevoSaldo = socio.ahorroActual.toNumber() - monto;
        if (nuevoSaldo < ahorroMinimo) {
            throw new errors_1.SocioBusinessError(`El saldo no puede ser menor a $${ahorroMinimo.toFixed(2)} (RN-AHO-003)`);
        }
        // Realizar retiro en transacción
        const resultado = await database_1.default.$transaction(async (tx) => {
            // Registrar transacción (el trigger actualiza el saldo automáticamente y valida)
            const transaccion = await tx.transaccion.create({
                data: {
                    codigo: await this.generarCodigoTransaccion(socioId, tx),
                    socioId,
                    tipo: 'RETIRO',
                    monto,
                    saldoAnterior: socio.ahorroActual,
                    saldoNuevo: 0, // El trigger lo calculará
                    metodo,
                    referencia_externa: numeroReferencia,
                    concepto: concepto || 'Retiro de ahorro',
                },
            });
            // Obtener socio actualizado después del trigger
            const socioActualizado = await tx.socio.findUnique({
                where: { id: socioId },
            });
            // Auditoría
            await tx.auditoria.create({
                data: {
                    usuarioId,
                    entidad: 'transacciones',
                    entidadId: transaccion.id,
                    accion: 'CREAR',
                    descripcion: `Retiro de $${monto.toFixed(2)} para socio ${socio.codigo}`,
                    datosNuevos: {
                        socio: socio.codigo,
                        monto,
                        nuevoSaldo: socioActualizado?.ahorroActual.toNumber(),
                    },
                    exitosa: true,
                },
            });
            return { socioActualizado, transaccion };
        });
        logger_1.default.info(`Retiro exitoso: ${socio.codigo} - $${monto.toFixed(2)} - Nuevo saldo: $${resultado.socioActualizado.ahorroActual.toFixed(2)}`);
        return resultado.transaccion;
    }
    /**
     * Cambiar etapa del socio (manual por administrador)
     */
    async cambiarEtapa(data, usuarioId) {
        const { socioId, nuevaEtapa, motivoAdministrativo } = data;
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
        });
        if (!socio) {
            throw new errors_1.NotFoundError(`Socio con ID ${socioId} no encontrado`);
        }
        if (![1, 2, 3].includes(nuevaEtapa)) {
            throw new errors_1.BadRequestError('Etapa debe ser 1, 2 o 3');
        }
        if (socio.etapaActual === nuevaEtapa) {
            throw new errors_1.BadRequestError('El socio ya está en esa etapa');
        }
        // Cambiar etapa en transacción
        const socioActualizado = await database_1.default.$transaction(async (tx) => {
            const actualizado = await tx.socio.update({
                where: { id: socioId },
                data: {
                    etapaActual: nuevaEtapa,
                    creditosEtapaActual: 0, // Reiniciar contador de créditos en etapa
                },
            });
            // Auditoría
            await tx.auditoria.create({
                data: {
                    usuarioId,
                    entidad: 'socios',
                    entidadId: socioId,
                    accion: 'ACTUALIZAR',
                    descripcion: `Cambio de etapa: ${socio.etapaActual} → ${nuevaEtapa} | Motivo: ${motivoAdministrativo || 'Cambio administrativo'}`,
                    datosAnteriores: { etapa: socio.etapaActual },
                    datosNuevos: { etapa: nuevaEtapa, motivo: motivoAdministrativo },
                    exitosa: true,
                },
            });
            return actualizado;
        });
        logger_1.default.info(`Etapa cambiada: ${socio.codigo} - ${socio.etapaActual} → ${nuevaEtapa}`);
        return await this.obtenerSocioPorId(socioId);
    }
    /**
     * Suspender socio
     */
    async suspenderSocio(socioId, motivo, usuarioId) {
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
        });
        if (!socio) {
            throw new errors_1.NotFoundError(`Socio con ID ${socioId} no encontrado`);
        }
        if (socio.estado === 'INACTIVO') {
            throw new errors_1.BadRequestError('El socio ya está suspendido');
        }
        // Verificar que no tenga créditos activos (Desembolsados y no pagados)
        const creditosActivos = await database_1.default.credito.count({
            where: {
                socioId,
                estado: 'DESEMBOLSADO', // O cualquier estado que implique deuda viva
            },
        });
        if (creditosActivos > 0) {
            throw new errors_1.SocioBusinessError('No se puede suspender un socio con créditos activos');
        }
        const socioActualizado = await database_1.default.$transaction(async (tx) => {
            const actualizado = await tx.socio.update({
                where: { id: socioId },
                data: {
                    estado: 'INACTIVO',
                    // fechaSuspension y motivoSuspension no existen en el modelo Socio actual
                    // La auditoría registra el motivo
                },
            });
            await tx.auditoria.create({
                data: {
                    usuarioId,
                    entidad: 'socios',
                    entidadId: socioId,
                    accion: 'ACTUALIZAR',
                    descripcion: `Socio ${socio.codigo} suspendido. Motivo: ${motivo}`,
                    datosAnteriores: { estado: socio.estado },
                    datosNuevos: { estado: 'INACTIVO', motivo },
                    exitosa: true,
                },
            });
            return actualizado;
        });
        logger_1.default.warn(`Socio suspendido: ${socio.codigo} - Motivo: ${motivo}`);
        return socioActualizado;
    }
    /**
     * Reactivar socio
     */
    async reactivarSocio(socioId, usuarioId) {
        const socio = await database_1.default.socio.findUnique({
            where: { id: socioId },
        });
        if (!socio) {
            throw new errors_1.NotFoundError(`Socio con ID ${socioId} no encontrado`);
        }
        if (socio.estado !== 'INACTIVO') {
            throw new errors_1.BadRequestError('Solo se pueden reactivar socios suspendidos');
        }
        const socioActualizado = await database_1.default.$transaction(async (tx) => {
            const actualizado = await tx.socio.update({
                where: { id: socioId },
                data: {
                    estado: 'ACTIVO',
                    // Campos de suspensión removidos del modelo
                },
            });
            await tx.auditoria.create({
                data: {
                    usuarioId,
                    entidad: 'socios',
                    entidadId: socioId,
                    accion: 'ACTUALIZAR',
                    descripcion: `Socio ${socio.codigo} reactivado`,
                    datosAnteriores: { estado: 'INACTIVO' },
                    datosNuevos: { estado: 'ACTIVO' },
                    exitosa: true,
                },
            });
            return actualizado;
        });
        logger_1.default.info(`Socio reactivado: ${socio.codigo}`);
        return socioActualizado;
    }
    // ============================================================================
    // MÉTODOS AUXILIARES PRIVADOS
    // ============================================================================
    async generarCodigoSocio() {
        const year = new Date().getFullYear();
        const ultimoSocio = await database_1.default.socio.findFirst({
            where: {
                codigo: {
                    startsWith: `SOC-${year}`,
                },
            },
            orderBy: {
                codigo: 'desc',
            },
        });
        let secuencial = 1;
        if (ultimoSocio) {
            const ultimoSecuencial = parseInt(ultimoSocio.codigo.split('-')[2]);
            secuencial = ultimoSecuencial + 1;
        }
        return `SOC-${year}-${secuencial.toString().padStart(4, '0')}`;
    }
    async generarCodigoTransaccion(socioId, tx) {
        // Usar timestamp corto (últimos 8 dígitos) + random para evitar colisiones
        const timestamp = Date.now().toString().slice(-8); // Últimos 8 dígitos del timestamp
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        // Formato: TRX-{timestamp}{random} = TRX-1234567890 (máx 14 caracteres, cabe en VARCHAR(30))
        return `TRX-${timestamp}${random}`;
    }
    formatearSocio(socio) {
        return {
            ...socio,
            recomendadores: socio.recomendacionesRecibidas?.map((r) => r.socioRecomendador),
            recomendacionesRecibidas: undefined,
        };
    }
    async obtenerConfiguracion(clave, valorPorDefecto) {
        const config = await database_1.default.configuracion.findUnique({
            where: { clave },
        });
        if (!config) {
            return valorPorDefecto;
        }
        return parseFloat(config.valor);
    }
    /**
     * Obtener historial de transacciones de un socio
     */
    async obtenerHistorialTransacciones(socioId, page = 1, limit = 20) {
        // Verificar que el socio existe
        const socio = await this.obtenerSocioPorId(socioId);
        const skip = (page - 1) * limit;
        const [transacciones, total] = await Promise.all([
            database_1.default.transaccion.findMany({
                where: {
                    socioId,
                },
                orderBy: {
                    fechaTransaccion: 'desc',
                },
                skip,
                take: limit,
                select: {
                    id: true,
                    codigo: true,
                    tipo: true,
                    monto: true,
                    saldoAnterior: true,
                    saldoNuevo: true,
                    concepto: true,
                    metodo: true,
                    fechaTransaccion: true,
                    createdAt: true,
                },
            }),
            database_1.default.transaccion.count({
                where: {
                    socioId,
                },
            }),
        ]);
        // Mapear campos para compatibilidad con frontend
        const transaccionesFormateadas = transacciones.map((t) => ({
            id: t.id,
            codigo: t.codigo,
            tipo: t.tipo,
            monto: t.monto,
            saldoAnterior: t.saldoAnterior,
            saldoNuevo: t.saldoNuevo,
            concepto: t.concepto,
            metodo: t.metodo,
            fechaTransaccion: t.fechaTransaccion,
            fechaRegistro: t.createdAt,
            fecha: t.fechaTransaccion,
        }));
        return {
            transacciones: transaccionesFormateadas,
            total,
            page,
            limit,
        };
    }
}
exports.default = new SociosService();
//# sourceMappingURL=socios.service.js.map