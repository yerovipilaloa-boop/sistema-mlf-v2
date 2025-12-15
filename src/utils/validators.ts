/**
 * ============================================================================
 * Sistema MLF - Validadores de Datos
 * Archivo: src/utils/validators.ts
 * Descripción: Funciones de validación de datos ecuatorianos
 * ============================================================================
 */

import { BadRequestError } from './errors';

/**
 * Validar cédula ecuatoriana (10 dígitos)
 * Implementa algoritmo de verificación de cédula ecuatoriana
 */
export const validarCedulaEcuatoriana = (cedula: string): boolean => {
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

/**
 * Validar email
 */
export const validarEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar teléfono ecuatoriano
 * Formatos válidos: +593999999999, 0999999999, 999999999
 */
export const validarTelefonoEcuatoriano = (telefono: string): boolean => {
  // Remover espacios y guiones
  const telefonoLimpio = telefono.replace(/[\s-]/g, '');

  // Verificar formatos válidos
  const formatoInternacional = /^\+593[0-9]{9}$/; // +593999999999
  const formatoNacional = /^0[0-9]{9}$/;          // 0999999999
  const formatoCorto = /^[0-9]{9}$/;              // 999999999

  return (
    formatoInternacional.test(telefonoLimpio) ||
    formatoNacional.test(telefonoLimpio) ||
    formatoCorto.test(telefonoLimpio)
  );
};

/**
 * Validar fecha de nacimiento (debe ser mayor de edad)
 */
export const validarFechaNacimientoMayorEdad = (
  fechaNacimiento: Date,
  edadMinima: number = 18
): boolean => {
  const hoy = new Date();
  const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mesActual = hoy.getMonth() - fechaNacimiento.getMonth();

  if (mesActual < 0 || (mesActual === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    return edad - 1 >= edadMinima;
  }

  return edad >= edadMinima;
};

/**
 * Validar monto positivo
 */
export const validarMontoPositivo = (monto: number): boolean => {
  return typeof monto === 'number' && monto > 0 && !isNaN(monto);
};

/**
 * Validar rango de monto
 */
export const validarRangoMonto = (
  monto: number,
  minimo: number,
  maximo: number
): boolean => {
  return validarMontoPositivo(monto) && monto >= minimo && monto <= maximo;
};

/**
 * Validar plazo en meses
 */
export const validarPlazoMeses = (
  plazo: number,
  minimo: number = 6,
  maximo: number = 60
): boolean => {
  return (
    Number.isInteger(plazo) &&
    plazo >= minimo &&
    plazo <= maximo
  );
};

/**
 * Validar tasa de interés
 */
export const validarTasaInteres = (tasa: number): boolean => {
  return validarMontoPositivo(tasa) && tasa <= 100;
};

/**
 * Sanitizar nombre (remover caracteres especiales excepto espacios, tildes, ñ)
 */
export const sanitizarNombre = (nombre: string): string => {
  return nombre
    .trim()
    .replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g, '')
    .replace(/\s+/g, ' ');
};

/**
 * Validar que un array no esté vacío
 */
export const validarArrayNoVacio = <T>(array: T[]): boolean => {
  return Array.isArray(array) && array.length > 0;
};

/**
 * Validar password
 * Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
 */
export const validarPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validar username
 * Solo letras, números, guiones y guiones bajos. Entre 3 y 50 caracteres
 */
export const validarUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return usernameRegex.test(username);
};

// ============================================================================
// VALIDADORES CON THROW DE ERRORES (Para uso en servicios)
// ============================================================================

export const validarCedulaOrThrow = (cedula: string): void => {
  if (!validarCedulaEcuatoriana(cedula)) {
    throw new BadRequestError(
      `Cédula de identidad inválida: ${cedula}. ` +
      'Debe ser una cédula ecuatoriana válida de 10 dígitos.'
    );
  }
};

export const validarEmailOrThrow = (email: string): void => {
  if (!validarEmail(email)) {
    throw new BadRequestError(`Email inválido: ${email}`);
  }
};

export const validarTelefonoOrThrow = (telefono: string): void => {
  if (!validarTelefonoEcuatoriano(telefono)) {
    throw new BadRequestError(
      `Teléfono inválido: ${telefono}. ` +
      'Debe ser un número de teléfono ecuatoriano válido.'
    );
  }
};

export const validarMayorEdadOrThrow = (
  fechaNacimiento: Date,
  edadMinima: number = 18
): void => {
  if (!validarFechaNacimientoMayorEdad(fechaNacimiento, edadMinima)) {
    throw new BadRequestError(
      `El socio debe tener al menos ${edadMinima} años de edad.`
    );
  }
};

export const validarMontoPositivoOrThrow = (
  monto: number,
  nombreCampo: string = 'Monto'
): void => {
  if (!validarMontoPositivo(monto)) {
    throw new BadRequestError(`${nombreCampo} debe ser un número positivo válido.`);
  }
};

export const validarRangoMontoOrThrow = (
  monto: number,
  minimo: number,
  maximo: number,
  nombreCampo: string = 'Monto'
): void => {
  if (!validarRangoMonto(monto, minimo, maximo)) {
    throw new BadRequestError(
      `${nombreCampo} debe estar entre $${minimo.toFixed(2)} y $${maximo.toFixed(2)}.`
    );
  }
};

export const validarPlazoMesesOrThrow = (
  plazo: number,
  minimo: number = 6,
  maximo: number = 60
): void => {
  if (!validarPlazoMeses(plazo, minimo, maximo)) {
    throw new BadRequestError(
      `El plazo debe ser un número entero entre ${minimo} y ${maximo} meses.`
    );
  }
};

export const validarPasswordOrThrow = (password: string): void => {
  if (!validarPassword(password)) {
    throw new BadRequestError(
      'La contraseña debe tener al menos 8 caracteres, ' +
      'una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).'
    );
  }
};

export const validarUsernameOrThrow = (username: string): void => {
  if (!validarUsername(username)) {
    throw new BadRequestError(
      'El nombre de usuario debe tener entre 3 y 50 caracteres, ' +
      'y solo puede contener letras, números, guiones y guiones bajos.'
    );
  }
};
