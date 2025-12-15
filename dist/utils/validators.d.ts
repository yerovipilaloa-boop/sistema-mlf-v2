/**
 * ============================================================================
 * Sistema MLF - Validadores de Datos
 * Archivo: src/utils/validators.ts
 * Descripción: Funciones de validación de datos ecuatorianos
 * ============================================================================
 */
/**
 * Validar cédula ecuatoriana (10 dígitos)
 * Implementa algoritmo de verificación de cédula ecuatoriana
 */
export declare const validarCedulaEcuatoriana: (cedula: string) => boolean;
/**
 * Validar email
 */
export declare const validarEmail: (email: string) => boolean;
/**
 * Validar teléfono ecuatoriano
 * Formatos válidos: +593999999999, 0999999999, 999999999
 */
export declare const validarTelefonoEcuatoriano: (telefono: string) => boolean;
/**
 * Validar fecha de nacimiento (debe ser mayor de edad)
 */
export declare const validarFechaNacimientoMayorEdad: (fechaNacimiento: Date, edadMinima?: number) => boolean;
/**
 * Validar monto positivo
 */
export declare const validarMontoPositivo: (monto: number) => boolean;
/**
 * Validar rango de monto
 */
export declare const validarRangoMonto: (monto: number, minimo: number, maximo: number) => boolean;
/**
 * Validar plazo en meses
 */
export declare const validarPlazoMeses: (plazo: number, minimo?: number, maximo?: number) => boolean;
/**
 * Validar tasa de interés
 */
export declare const validarTasaInteres: (tasa: number) => boolean;
/**
 * Sanitizar nombre (remover caracteres especiales excepto espacios, tildes, ñ)
 */
export declare const sanitizarNombre: (nombre: string) => string;
/**
 * Validar que un array no esté vacío
 */
export declare const validarArrayNoVacio: <T>(array: T[]) => boolean;
/**
 * Validar password
 * Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
 */
export declare const validarPassword: (password: string) => boolean;
/**
 * Validar username
 * Solo letras, números, guiones y guiones bajos. Entre 3 y 50 caracteres
 */
export declare const validarUsername: (username: string) => boolean;
export declare const validarCedulaOrThrow: (cedula: string) => void;
export declare const validarEmailOrThrow: (email: string) => void;
export declare const validarTelefonoOrThrow: (telefono: string) => void;
export declare const validarMayorEdadOrThrow: (fechaNacimiento: Date, edadMinima?: number) => void;
export declare const validarMontoPositivoOrThrow: (monto: number, nombreCampo?: string) => void;
export declare const validarRangoMontoOrThrow: (monto: number, minimo: number, maximo: number, nombreCampo?: string) => void;
export declare const validarPlazoMesesOrThrow: (plazo: number, minimo?: number, maximo?: number) => void;
export declare const validarPasswordOrThrow: (password: string) => void;
export declare const validarUsernameOrThrow: (username: string) => void;
//# sourceMappingURL=validators.d.ts.map