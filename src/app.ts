/**
 * ============================================================================
 * Sistema MLF - Aplicación Express
 * Archivo: src/app.ts
 * Descripción: Configuración principal de Express con middlewares
 * ============================================================================
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/env';
import logger from './config/logger';

// Crear aplicación Express
const app: Application = express();

// ============================================================================
// MIDDLEWARES DE SEGURIDAD
// ============================================================================

// Helmet: Headers de seguridad
app.use(helmet());

// CORS: Control de acceso
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ============================================================================
// MIDDLEWARES DE PARSING
// ============================================================================

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// MIDDLEWARES DE LOGGING
// ============================================================================

// Morgan HTTP logger
const morganFormat = config.nodeEnv === 'development' ? 'dev' : 'combined';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  })
);

// ============================================================================
// ARCHIVOS ESTÁTICOS DEL FRONTEND
// ============================================================================

import path from 'path';
import fs from 'fs';

// Servir archivos estáticos desde la carpeta public
// En producción, __dirname es dist/, así que public debe estar en dist/public
const publicPath = path.join(__dirname, 'public');

// Debug: Log del path de archivos estáticos
console.log('📁 Static files path:', publicPath);
console.log('📁 __dirname:', __dirname);
console.log('📁 Public folder exists:', fs.existsSync(publicPath));
if (fs.existsSync(publicPath)) {
  console.log('📁 Contents:', fs.readdirSync(publicPath));
}

app.use(express.static(publicPath));

// Servir login.html por defecto en la raíz
app.get('/', (req, res) => {
  const loginPath = path.join(publicPath, 'login.html');
  console.log('📄 Serving login.html from:', loginPath);
  console.log('📄 File exists:', fs.existsSync(loginPath));
  if (fs.existsSync(loginPath)) {
    res.sendFile(loginPath);
  } else {
    res.status(200).json({
      message: 'API Sistema MLF - Frontend not found',
      publicPath: publicPath,
      loginPath: loginPath,
      dirExists: fs.existsSync(publicPath),
    });
  }
});

// ============================================================================
// RUTAS DE SALUD Y ESTADO
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// API info endpoint (movido a /api para no conflictar con frontend)
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'API Sistema MLF - My Libertad Financiera',
    version: config.apiVersion,
    documentation: `/api/${config.apiVersion}/docs`,
  });
});

// ============================================================================
// RUTAS DE LA API
// ============================================================================

// Importar rutas
import authRoutes from './routes/auth.routes';
import sociosRoutes from './routes/socios.routes';
import creditosRoutes from './routes/creditos.routes';
import garantiasRoutes from './routes/garantias.routes';
import pagosRoutes from './routes/pagos.routes';
import utilidadesRoutes from './routes/utilidades.routes';
import casosExtremosRoutes from './routes/casos-extremos.routes';
import notificacionesRoutes from './routes/notificaciones.routes';
import dashboardRoutes from './routes/dashboard.routes';
import metricasRoutes from './routes/metricas.routes';
import gastosRoutes from './routes/gastos.routes';

// Registrar rutas
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/socios`, sociosRoutes);
app.use(`/api/${config.apiVersion}/creditos`, creditosRoutes);
app.use(`/api/${config.apiVersion}/garantias`, garantiasRoutes);
app.use(`/api/${config.apiVersion}/pagos`, pagosRoutes);
app.use(`/api/${config.apiVersion}/utilidades`, utilidadesRoutes);
app.use(`/api/${config.apiVersion}/metricas`, metricasRoutes);
app.use(`/api/${config.apiVersion}/gastos`, gastosRoutes);
app.use(`/api/${config.apiVersion}/casos-extremos`, casosExtremosRoutes);
app.use(`/api/${config.apiVersion}/notificaciones`, notificacionesRoutes);
app.use(`/api/${config.apiVersion}/dashboard`, dashboardRoutes);

// ============================================================================
// MANEJO DE ERRORES 404
// ============================================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method,
  });
});

// ============================================================================
// MIDDLEWARE GLOBAL DE MANEJO DE ERRORES
// ============================================================================

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  // Log del error
  logger.error(`Error: ${err.message}`, {
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
      ...(config.nodeEnv === 'development' && {
        stack: err.stack,
        details: err,
      }),
    },
    timestamp: new Date().toISOString(),
  });
});

export default app;
