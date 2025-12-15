"use strict";
/**
 * ============================================================================
 * Sistema MLF - Configuración de Logger
 * Archivo: src/config/logger.ts
 * Descripción: Winston logger para logging estructurado
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
// Definir niveles de log
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Definir colores para cada nivel
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
winston_1.default.addColors(colors);
// Formato personalizado
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`));
// Formato para archivos (sin colores)
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.uncolorize(), winston_1.default.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`));
// Determinar nivel de log según entorno
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'info';
};
// Transports
const transports = [
    // Console
    new winston_1.default.transports.Console({
        format,
    }),
    // Error log file
    new winston_1.default.transports.File({
        filename: path_1.default.join('logs', 'error.log'),
        level: 'error',
        format: fileFormat,
    }),
    // Combined log file
    new winston_1.default.transports.File({
        filename: path_1.default.join('logs', 'combined.log'),
        format: fileFormat,
    }),
];
// Crear logger
const logger = winston_1.default.createLogger({
    level: level(),
    levels,
    transports,
});
exports.default = logger;
//# sourceMappingURL=logger.js.map