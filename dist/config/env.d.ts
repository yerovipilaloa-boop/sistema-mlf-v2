/**
 * ============================================================================
 * Sistema MLF - Configuración de Variables de Entorno
 * Archivo: src/config/env.ts
 * Descripción: Validación y exportación de variables de entorno
 * ============================================================================
 */
/**
 * Configuración de la aplicación
 */
export declare const config: {
    nodeEnv: string;
    port: number;
    apiVersion: string;
    databaseUrl: string;
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    bcryptRounds: number;
    corsOrigin: string;
    logLevel: string;
    tasas: {
        interesNormal: number;
        interesCastigo: number;
        interesMoraDiario: number;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    uploads: {
        maxFileSize: number;
        uploadDir: string;
    };
    email: {
        host: string;
        port: number;
        user: string;
        pass: string;
    };
    whatsapp: {
        apiKey: string;
        phoneNumber: string;
    };
};
export declare const validateConfig: () => void;
export default config;
//# sourceMappingURL=env.d.ts.map