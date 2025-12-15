/**
 * ============================================================================
 * Sistema MLF - Configuración de Variables de Entorno
 * Archivo: src/config/env.ts
 * Descripción: Validación y exportación de variables de entorno
 * ============================================================================
 */

import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validar que una variable de entorno exista
 */
const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (!value) {
    throw new Error(`❌ Variable de entorno "${key}" no está definida`);
  }

  return value;
};

/**
 * Configuración de la aplicación
 */
export const config = {
  // Servidor
  nodeEnv: getEnvVariable('NODE_ENV', 'development'),
  port: parseInt(getEnvVariable('PORT', '3000'), 10),
  apiVersion: getEnvVariable('API_VERSION', 'v1'),

  // Base de datos
  databaseUrl: getEnvVariable('DATABASE_URL'),

  // JWT
  jwt: {
    secret: getEnvVariable('JWT_SECRET'),
    expiresIn: getEnvVariable('JWT_EXPIRES_IN', '24h'),
    refreshExpiresIn: getEnvVariable('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  // Bcrypt
  bcryptRounds: parseInt(getEnvVariable('BCRYPT_ROUNDS', '10'), 10),

  // CORS
  corsOrigin: getEnvVariable('CORS_ORIGIN', 'http://localhost:8081'),

  // Logs
  logLevel: getEnvVariable('LOG_LEVEL', 'debug'),

  // Tasas por defecto (pueden ser sobrescritas desde DB)
  tasas: {
    interesNormal: parseFloat(getEnvVariable('TASA_INTERES_NORMAL', '1.5')),
    interesCastigo: parseFloat(getEnvVariable('TASA_INTERES_CASTIGO', '3.0')),
    interesMoraDiario: parseFloat(getEnvVariable('TASA_INTERES_MORA_DIARIO', '1.0')),
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(getEnvVariable('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    maxRequests: parseInt(getEnvVariable('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  },

  // Uploads
  uploads: {
    maxFileSize: parseInt(getEnvVariable('MAX_FILE_SIZE', '5242880'), 10), // 5MB
    uploadDir: getEnvVariable('UPLOAD_DIR', './uploads'),
  },

  // Email (opcional)
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  // WhatsApp (opcional)
  whatsapp: {
    apiKey: process.env.WHATSAPP_API_KEY,
    phoneNumber: process.env.WHATSAPP_PHONE_NUMBER,
  },
};

// Secrets que NO deben usarse en produccion (inseguros)
const INSECURE_SECRETS = [
  'mlf_jwt_secret_key_development',
  'tu_secreto_super_seguro',
  'secret',
  'password',
  'admin123',
  'test_secret',
  'change_me',
  'cambiar_en_produccion',
];

// Validar configuración crítica
export const validateConfig = (): void => {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  const missing = requiredVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Variables de entorno requeridas faltantes: ${missing.join(', ')}\n` +
      `Por favor, copia .env.example a .env y configura las variables.`
    );
  }

  // Validaciones de seguridad SOLO en produccion
  if (config.nodeEnv === 'production') {
    // Verificar que JWT_SECRET no sea inseguro
    const jwtSecret = config.jwt.secret.toLowerCase();
    const isInsecureSecret = INSECURE_SECRETS.some(insecure =>
      jwtSecret.includes(insecure.toLowerCase())
    );

    if (isInsecureSecret || config.jwt.secret.length < 32) {
      console.warn(
        `⚠️ ADVERTENCIA: JWT_SECRET es inseguro para produccion.\n` +
        `Genera uno nuevo con: openssl rand -base64 64`
      );
    }

    // Verificar que CORS no sea *
    if (config.corsOrigin === '*') {
      console.warn(
        `⚠️ ADVERTENCIA: CORS_ORIGIN es '*' en produccion.\n` +
        `Configura el dominio especifico de tu frontend.`
      );
    }

    // Verificar que DEBUG este desactivado
    if (process.env.DEBUG === 'true') {
      console.warn('⚠️ ADVERTENCIA: DEBUG=true en produccion. Se recomienda desactivarlo.');
    }

    console.log('✓ Validaciones de seguridad para produccion completadas');
  }

  console.log('✓ Variables de entorno validadas correctamente');
};

export default config;
