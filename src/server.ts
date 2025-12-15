/**
 * ============================================================================
 * Sistema MLF - Servidor Principal
 * Archivo: src/server.ts
 * Descripción: Punto de entrada de la aplicación
 * ============================================================================
 */

import app from './app';
import config, { validateConfig } from './config/env';
import logger from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';

/**
 * Iniciar servidor
 */
const startServer = async (): Promise<void> => {
  try {
    // 1. Validar configuración
    logger.info('='.repeat(70));
    logger.info('Sistema MLF - My Libertad Financiera');
    logger.info('Iniciando servidor...');
    logger.info('='.repeat(70));

    validateConfig();

    // 2. Conectar a base de datos
    await connectDatabase();

    // 3. Iniciar servidor Express
    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`✓ Servidor corriendo en puerto ${config.port}`);
      logger.info(`✓ Entorno: ${config.nodeEnv}`);
      logger.info(`✓ API Version: ${config.apiVersion}`);
      logger.info(`✓ Health check: http://localhost:${config.port}/health`);
      logger.info('='.repeat(70));
    });

    // 4. Manejo de señales de terminación
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} recibido. Cerrando servidor gracefully...`);

      server.close(async () => {
        logger.info('✓ Servidor HTTP cerrado');

        try {
          await disconnectDatabase();
          logger.info('✓ Todas las conexiones cerradas correctamente');
          process.exit(0);
        } catch (error) {
          logger.error('Error durante el cierre:', error);
          process.exit(1);
        }
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        logger.error('Forzando cierre después de timeout');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor
startServer();
