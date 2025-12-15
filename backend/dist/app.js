"use strict";
/**
 * ============================================================================
 * Sistema MLF - Aplicación Express
 * Archivo: src/app.ts
 * Descripción: Configuración principal de Express con middlewares
 * ============================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = __importDefault(require("./config/env"));
const logger_1 = __importDefault(require("./config/logger"));
// Crear aplicación Express
const app = (0, express_1.default)();
// ============================================================================
// MIDDLEWARES DE SEGURIDAD
// ============================================================================
// Helmet: Headers de seguridad
app.use((0, helmet_1.default)());
// CORS: Control de acceso
app.use((0, cors_1.default)({
    origin: env_1.default.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ============================================================================
// MIDDLEWARES DE PARSING
// ============================================================================
// Body parser
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ============================================================================
// MIDDLEWARES DE LOGGING
// ============================================================================
// Morgan HTTP logger
const morganFormat = env_1.default.nodeEnv === 'development' ? 'dev' : 'combined';
app.use((0, morgan_1.default)(morganFormat, {
    stream: {
        write: (message) => logger_1.default.http(message.trim()),
    },
}));
// ============================================================================
// RUTAS DE SALUD Y ESTADO
// ============================================================================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env_1.default.nodeEnv,
    });
});
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'API Sistema MLF - My Libertad Financiera',
        version: env_1.default.apiVersion,
        documentation: `/api/${env_1.default.apiVersion}/docs`,
    });
});
// ============================================================================
// RUTAS DE LA API
// ============================================================================
// Importar rutas
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const socios_routes_1 = __importDefault(require("./routes/socios.routes"));
const creditos_routes_1 = __importDefault(require("./routes/creditos.routes"));
const garantias_routes_1 = __importDefault(require("./routes/garantias.routes"));
const pagos_routes_1 = __importDefault(require("./routes/pagos.routes"));
const utilidades_routes_1 = __importDefault(require("./routes/utilidades.routes"));
const casos_extremos_routes_1 = __importDefault(require("./routes/casos-extremos.routes"));
const notificaciones_routes_1 = __importDefault(require("./routes/notificaciones.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const metricas_routes_1 = __importDefault(require("./routes/metricas.routes"));
const gastos_routes_1 = __importDefault(require("./routes/gastos.routes"));
// Registrar rutas
app.use(`/api/${env_1.default.apiVersion}/auth`, auth_routes_1.default);
app.use(`/api/${env_1.default.apiVersion}/socios`, socios_routes_1.default);
app.use(`/api/${env_1.default.apiVersion}/creditos`, creditos_routes_1.default);
app.use(`/api/${env_1.default.apiVersion}/garantias`, garantias_routes_1.default);
app.use(`/api/${env_1.default.apiVersion}/pagos`, pagos_routes_1.default);
app.use(`/api/${env_1.default.apiVersion}/utilidades`, utilidades_routes_1.default);
app.use(`/api/${env_1.default.apiVersion}/metricas`, metricas_routes_1.default);
app.use(`/api/${env_1.default.apiVersion}/gastos`, gastos_routes_1.default);
app.use(`/api/${env_1.default.apiVersion}/casos-extremos`, casos_extremos_routes_1.default);
app.use(`/api/${env_1.default.apiVersion}/notificaciones`, notificaciones_routes_1.default);
app.use(`/api/${env_1.default.apiVersion}/dashboard`, dashboard_routes_1.default);
// ============================================================================
// MANEJO DE ERRORES 404
// ============================================================================
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.path,
        method: req.method,
    });
});
app.use((err, req, res, next) => {
    // Log del error
    logger_1.default.error(`Error: ${err.message}`, {
        stack: err.stack,
        url: req.url,
        method: req.method,
    });
    // Determinar código de estado
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;
    // Respuesta de error
    res.status(statusCode).json({
        error: {
            message: isOperational ? err.message : 'Error interno del servidor',
            ...(env_1.default.nodeEnv === 'development' && {
                stack: err.stack,
                details: err,
            }),
        },
        timestamp: new Date().toISOString(),
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map