"use strict";
/**
 * ============================================================================
 * Sistema MLF - Configuración de Base de Datos
 * Archivo: src/config/database.ts
 * Descripción: Configuración y conexión con PostgreSQL via Prisma
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.checkDatabaseHealth = exports.disconnectDatabase = exports.connectDatabase = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("./logger"));
// Singleton de Prisma Client
const prismaClientSingleton = () => {
    return new client_1.PrismaClient({
        log: [
            {
                emit: 'event',
                level: 'query',
            },
            {
                emit: 'event',
                level: 'error',
            },
            {
                emit: 'event',
                level: 'warn',
            },
        ],
    });
};
const prisma = globalThis.prisma ?? prismaClientSingleton();
exports.prisma = prisma;
// Log de queries en desarrollo
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        try {
            logger_1.default.debug(`Query: ${e.query}`);
            logger_1.default.debug(`Duration: ${e.duration}ms`);
        }
        catch (err) {
            // Ignorar errores de logging
        }
    });
}
prisma.$on('error', (e) => {
    logger_1.default.error('Prisma Error:', e);
});
prisma.$on('warn', (e) => {
    logger_1.default.warn('Prisma Warning:', e);
});
// Prevenir múltiples instancias en desarrollo
if (process.env.NODE_ENV !== 'production')
    globalThis.prisma = prisma;
/**
 * Conectar a la base de datos
 */
const connectDatabase = async () => {
    try {
        await prisma.$connect();
        logger_1.default.info('✓ Conexión a PostgreSQL establecida exitosamente');
    }
    catch (error) {
        logger_1.default.error('✗ Error al conectar con PostgreSQL:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
/**
 * Desconectar de la base de datos
 */
const disconnectDatabase = async () => {
    try {
        await prisma.$disconnect();
        logger_1.default.info('✓ Desconexión de PostgreSQL exitosa');
    }
    catch (error) {
        logger_1.default.error('✗ Error al desconectar de PostgreSQL:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
/**
 * Verificar salud de la base de datos
 */
const checkDatabaseHealth = async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        logger_1.default.error('Database health check failed:', error);
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.default = prisma;
//# sourceMappingURL=database.js.map