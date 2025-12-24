"use strict";
/**
 * ============================================================================
 * Sistema MLF - Servidor Principal
 * Archivo: src/server.ts
 * Descripción: Punto de entrada de la aplicación
 * ============================================================================
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
const app_1 = __importDefault(require("./app"));
const env_1 = __importStar(require("./config/env"));
const logger_1 = __importDefault(require("./config/logger"));
const database_1 = require("./config/database");
/**
 * Iniciar servidor
 */
const startServer = async () => {
    try {
        // 1. Validar configuración
        logger_1.default.info('='.repeat(70));
        logger_1.default.info('Sistema MLF - My Libertad Financiera');
        logger_1.default.info('Iniciando servidor...');
        logger_1.default.info('='.repeat(70));
        (0, env_1.validateConfig)();
        // 2. Conectar a base de datos
        await (0, database_1.connectDatabase)();
        // 3. Iniciar servidor Express
        // Hostinger a veces requiere 8080 o 3000. Forzamos un puerto seguro si no viene definido.
        const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
        const server = app_1.default.listen(PORT, '0.0.0.0', () => {
            logger_1.default.info(`✓ Servidor corriendo en puerto ${PORT}`);
            logger_1.default.info(`✓ Entorno: ${env_1.default.nodeEnv}`);
            logger_1.default.info(`✓ API Version: ${env_1.default.apiVersion}`);
            logger_1.default.info(`✓ Health check: http://localhost:${PORT}/health`);
            logger_1.default.info('='.repeat(70));
        });
        // 4. Manejo de señales de terminación
        const gracefulShutdown = async (signal) => {
            logger_1.default.info(`\n${signal} recibido. Cerrando servidor gracefully...`);
            server.close(async () => {
                logger_1.default.info('✓ Servidor HTTP cerrado');
                try {
                    await (0, database_1.disconnectDatabase)();
                    logger_1.default.info('✓ Todas las conexiones cerradas correctamente');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.default.error('Error durante el cierre:', error);
                    process.exit(1);
                }
            });
            // Forzar cierre después de 10 segundos
            setTimeout(() => {
                logger_1.default.error('Forzando cierre después de timeout');
                process.exit(1);
            }, 10000);
        };
        // Escuchar señales de terminación
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Manejo de errores no capturados
        process.on('unhandledRejection', (reason) => {
            logger_1.default.error('Unhandled Rejection:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
    }
    catch (error) {
        logger_1.default.error('Error fatal al iniciar el servidor:', error);
        process.exit(1);
    }
};
// Iniciar servidor
startServer();
//# sourceMappingURL=server.js.map