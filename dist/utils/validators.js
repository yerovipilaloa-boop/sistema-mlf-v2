"use strict";
/**
 * ============================================================================
 * Sistema MLF - Validadores de Datos
 * Archivo: src/utils/validators.ts
 * Descripción: Funciones de validación de datos ecuatorianos
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarUsernameOrThrow = exports.validarPasswordOrThrow = exports.validarPlazoMesesOrThrow = exports.validarRangoMontoOrThrow = exports.validarMontoPositivoOrThrow = exports.validarMayorEdadOrThrow = exports.validarTelefonoOrThrow = exports.validarEmailOrThrow = exports.validarCedulaOrThrow = exports.validarUsername = exports.validarPassword = exports.validarArrayNoVacio = exports.sanitizarNombre = exports.validarTasaInteres = exports.validarPlazoMeses = exports.validarRangoMonto = exports.validarMontoPositivo = exports.validarFechaNacimientoMayorEdad = exports.validarTelefonoEcuatoriano = exports.validarEmail = exports.validarCedulaEcuatoriana = void 0;
const errors_1 = require("./errors");
/**
 * Validar cédula ecuatoriana (10 dígitos)
 * Implementa algoritmo de verificación de cédula ecuatoriana
 */
const validarCedulaEcuatoriana = (cedula) => {
    // Verificar formato
    if (!cedula || cedula.length !== 10) {
        return false;
    }
    // Verificar que solo contenga números
    if (!/^\d{10}$/.test(cedula)) {
        return false;
    }
    // Verificar que los primeros 2 dígitos correspondan a una provincia válida (01-24)
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) {
        return false;
    }
    // Algoritmo de verificación
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const digitoVerificador = parseInt(cedula.charAt(9), 10);
    let suma = 0;
    for (let i = 0; i < coeficientes.length; i++) {
        let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
        if (valor >= 10) {
            valor -= 9;
        }
        suma += valor;
    }
    const resultado = suma % 10 === 0 ? 0 : 10 - (suma % 10);
    return resultado === digitoVerificador;
};
exports.validarCedulaEcuatoriana = validarCedulaEcuatoriana;
/**
 * Validar email
 */
const validarEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validarEmail = validarEmail;
/**
 * Validar teléfono ecuatoriano
 * Formatos válidos: +593999999999, 0999999999, 999999999
 */
const validarTelefonoEcuatoriano = (telefono) => {
    // Remover espacios y guiones
    const telefonoLimpio = telefono.replace(/[\s-]/g, '');
    // Verificar formatos válidos
    const formatoInternacional = /^\+593[0-9]{9}$/; // +593999999999
    const formatoNacional = /^0[0-9]{9}$/; // 0999999999
    const formatoCorto = /^[0-9]{9}$/; // 999999999
    return (formatoInternacional.test(telefonoLimpio) ||
        formatoNacional.test(telefonoLimpio) ||
        formatoCorto.test(telefonoLimpio));
};
exports.validarTelefonoEcuatoriano = validarTelefonoEcuatoriano;
/**
 * Validar fecha de nacimiento (debe ser mayor de edad)
 */
const validarFechaNacimientoMayorEdad = (fechaNacimiento, edadMinima = 18) => {
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesActual = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mesActual < 0 || (mesActual === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        return edad - 1 >= edadMinima;
    }
    return edad >= edadMinima;
};
exports.validarFechaNacimientoMayorEdad = validarFechaNacimientoMayorEdad;
/**
 * Validar monto positivo
 */
const validarMontoPositivo = (monto) => {
    return typeof monto === 'number' && monto > 0 && !isNaN(monto);
};
exports.validarMontoPositivo = validarMontoPositivo;
/**
 * Validar rango de monto
 */
const validarRangoMonto = (monto, minimo, maximo) => {
    return (0, exports.validarMontoPositivo)(monto) && monto >= minimo && monto <= maximo;
};
exports.validarRangoMonto = validarRangoMonto;
/**
 * Validar plazo en meses
 */
const validarPlazoMeses = (plazo, minimo = 6, maximo = 60) => {
    return (Number.isInteger(plazo) &&
        plazo >= minimo &&
        plazo <= maximo);
};
exports.validarPlazoMeses = validarPlazoMeses;
/**
 * Validar tasa de interés
 */
const validarTasaInteres = (tasa) => {
    return (0, exports.validarMontoPositivo)(tasa) && tasa <= 100;
};
exports.validarTasaInteres = validarTasaInteres;
/**
 * Sanitizar nombre (remover caracteres especiales excepto espacios, tildes, ñ)
 */
const sanitizarNombre = (nombre) => {
    return nombre
        .trim()
        .replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g, '')
        .replace(/\s+/g, ' ');
};
exports.sanitizarNombre = sanitizarNombre;
/**
 * Validar que un array no esté vacío
 */
const validarArrayNoVacio = (array) => {
    return Array.isArray(array) && array.length > 0;
};
exports.validarArrayNoVacio = validarArrayNoVacio;
/**
 * Validar password
 * Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
 */
const validarPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
exports.validarPassword = validarPassword;
/**
 * Validar username
 * Solo letras, números, guiones y guiones bajos. Entre 3 y 50 caracteres
 */
const validarUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    return usernameRegex.test(username);
};
exports.validarUsername = validarUsername;
// ============================================================================
// VALIDADORES CON THROW DE ERRORES (Para uso en servicios)
// ============================================================================
const validarCedulaOrThrow = (cedula) => {
    if (!(0, exports.validarCedulaEcuatoriana)(cedula)) {
        throw new errors_1.BadRequestError(`Cédula de identidad inválida: ${cedula}. ` +
            'Debe ser una cédula ecuatoriana válida de 10 dígitos.');
    }
};
exports.validarCedulaOrThrow = validarCedulaOrThrow;
const validarEmailOrThrow = (email) => {
    if (!(0, exports.validarEmail)(email)) {
        throw new errors_1.BadRequestError(`Email inválido: ${email}`);
    }
};
exports.validarEmailOrThrow = validarEmailOrThrow;
const validarTelefonoOrThrow = (telefono) => {
    if (!(0, exports.validarTelefonoEcuatoriano)(telefono)) {
        throw new errors_1.BadRequestError(`Teléfono inválido: ${telefono}. ` +
            'Debe ser un número de teléfono ecuatoriano válido.');
    }
};
exports.validarTelefonoOrThrow = validarTelefonoOrThrow;
const validarMayorEdadOrThrow = (fechaNacimiento, edadMinima = 18) => {
    if (!(0, exports.validarFechaNacimientoMayorEdad)(fechaNacimiento, edadMinima)) {
        throw new errors_1.BadRequestError(`El socio debe tener al menos ${edadMinima} años de edad.`);
    }
};
exports.validarMayorEdadOrThrow = validarMayorEdadOrThrow;
const validarMontoPositivoOrThrow = (monto, nombreCampo = 'Monto') => {
    if (!(0, exports.validarMontoPositivo)(monto)) {
        throw new errors_1.BadRequestError(`${nombreCampo} debe ser un número positivo válido.`);
    }
};
exports.validarMontoPositivoOrThrow = validarMontoPositivoOrThrow;
const validarRangoMontoOrThrow = (monto, minimo, maximo, nombreCampo = 'Monto') => {
    if (!(0, exports.validarRangoMonto)(monto, minimo, maximo)) {
        throw new errors_1.BadRequestError(`${nombreCampo} debe estar entre $${minimo.toFixed(2)} y $${maximo.toFixed(2)}.`);
    }
};
exports.validarRangoMontoOrThrow = validarRangoMontoOrThrow;
const validarPlazoMesesOrThrow = (plazo, minimo = 6, maximo = 60) => {
    if (!(0, exports.validarPlazoMeses)(plazo, minimo, maximo)) {
        throw new errors_1.BadRequestError(`El plazo debe ser un número entero entre ${minimo} y ${maximo} meses.`);
    }
};
exports.validarPlazoMesesOrThrow = validarPlazoMesesOrThrow;
const validarPasswordOrThrow = (password) => {
    if (!(0, exports.validarPassword)(password)) {
        throw new errors_1.BadRequestError('La contraseña debe tener al menos 8 caracteres, ' +
            'una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).');
    }
};
exports.validarPasswordOrThrow = validarPasswordOrThrow;
const validarUsernameOrThrow = (username) => {
    if (!(0, exports.validarUsername)(username)) {
        throw new errors_1.BadRequestError('El nombre de usuario debe tener entre 3 y 50 caracteres, ' +
            'y solo puede contener letras, números, guiones y guiones bajos.');
    }
};
exports.validarUsernameOrThrow = validarUsernameOrThrow;
//# sourceMappingURL=validators.js.map