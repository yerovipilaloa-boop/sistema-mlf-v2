/**
 * ============================================================================
 * Sistema MLF - Configuración de Base de Datos
 * Archivo: src/config/database.ts
 * Descripción: Configuración y conexión con PostgreSQL via Prisma
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Singleton de Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient({
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

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Log de queries en desarrollo
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    try {
      logger.debug(`Query: ${e.query}`);
      logger.debug(`Duration: ${e.duration}ms`);
    } catch (err) {
      // Ignorar errores de logging
    }
  });
}

prisma.$on('error', (e: any) => {
  logger.error('Prisma Error:', e);
});

prisma.$on('warn', (e: any) => {
  logger.warn('Prisma Warning:', e);
});

// Prevenir múltiples instancias en desarrollo
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

/**
 * Conectar a la base de datos
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✓ Conexión a PostgreSQL establecida exitosamente');
  } catch (error) {
    logger.error('✗ Error al conectar con PostgreSQL:', error);
    process.exit(1);
  }
};

/**
 * Desconectar de la base de datos
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('✓ Desconexión de PostgreSQL exitosa');
  } catch (error) {
    logger.error('✗ Error al desconectar de PostgreSQL:', error);
  }
};

/**
 * Verificar salud de la base de datos
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

export { prisma };
export default prisma;
