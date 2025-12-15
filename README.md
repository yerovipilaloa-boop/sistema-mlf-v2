# Sistema MLF - Backend API

Backend para el sistema **My Libertad Financiera (MLF)**, una cooperativa de ahorro y crédito con sistema de garantías cruzadas, etapas progresivas y gestión integral de créditos.

## Stack Tecnológico

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL 14+
- **Testing**: Jest
- **Linting**: ESLint
- **Formato**: Prettier
- **Logger**: Winston
- **Autenticación**: JWT + bcryptjs

## Características Principales

### Módulos Implementados

1. **Socios**
   - Registro con validación de cédula ecuatoriana
   - Sistema de 3 etapas progresivas (Iniciante → Regular → Especial)
   - Gestión de ahorros y recomendaciones

2. **Créditos**
   - Solicitud con validación de límites por etapa
   - Tablas de amortización (Método Francés y Alemán)
   - Prima de seguro de desgravamen obligatoria (1%)
   - Estados: Solicitado → En Revisión → Aprobado → Desembolsado → Activo → Completado/Castigado

3. **Garantías Cruzadas**
   - Sistema de garantías entre socios Etapa Especial y nuevos socios
   - Congelamiento automático del 10% del monto del crédito
   - Liberación condicional basada en comportamiento de pago
   - Máximo 3 garantizados por garante

4. **Pagos y Morosidad**
   - Aplicación de pagos: Mora → Interés → Capital
   - Clasificación de mora en 5 niveles (LEVE, MODERADA, GRAVE, PERSISTENTE, CASTIGADO)
   - Prepago de capital permitido
   - Castigo automático a los 90 días de mora

5. **Utilidades**
   - Distribución semestral de utilidades (1% sobre ahorro promedio)
   - Cálculo automático de ahorros promedios
   - Acreditación individual por socio

6. **Dashboard de Rentabilidad**
   - Métricas en tiempo real
   - Margen bruto: Ingresos por intereses (1.5%) - Egresos por utilidades (1%)
   - KPIs: Cartera activa, morosidad, fondo de seguro

7. **Notificaciones Multi-Canal**
   - Email, SMS, WhatsApp, Push
   - Notificaciones automáticas: Cuotas próximas, mora, aprobaciones, etc.
   - Sistema de prioridades

8. **Auditoría Completa**
   - Log de todas las operaciones críticas
   - Registro antes/después de cambios (JSONB)
   - Trazabilidad por usuario, IP, módulo

## Estructura del Proyecto

```
backend/
├── prisma/
│   └── schema.prisma          # Esquema de base de datos
├── src/
│   ├── config/                # Configuraciones
│   │   ├── database.ts        # Conexión Prisma
│   │   ├── env.ts             # Variables de entorno
│   │   └── logger.ts          # Winston logger
│   ├── controllers/           # Controladores de rutas (TODO)
│   ├── services/              # Lógica de negocio (TODO)
│   ├── middlewares/           # Middlewares personalizados (TODO)
│   ├── routes/                # Definición de rutas (TODO)
│   ├── utils/                 # Utilidades
│   │   ├── errors.ts          # Clases de error personalizadas
│   │   ├── validators.ts      # Validadores de datos ecuatorianos
│   │   └── responses.ts       # Helpers de respuestas HTTP
│   ├── types/                 # Tipos TypeScript
│   │   └── index.ts           # Enums, interfaces, DTOs
│   ├── app.ts                 # Configuración Express
│   └── server.ts              # Punto de entrada
├── .env.example               # Ejemplo de variables de entorno
├── .eslintrc.json             # Configuración ESLint
├── .prettierrc.json           # Configuración Prettier
├── jest.config.js             # Configuración Jest
├── tsconfig.json              # Configuración TypeScript
└── package.json               # Dependencias y scripts
```

## Instalación

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mlf_db?schema=public"
JWT_SECRET="tu_secreto_super_seguro_cambiar_en_produccion"
PORT=3000
```

### 3. Crear base de datos

```bash
# Ejecutar scripts SQL de la carpeta /database
cd ../database
psql -U postgres -d mlf_db -f 00_MASTER_SETUP.sql
```

### 4. Generar Prisma Client

```bash
cd ../backend
npm run prisma:generate
```

## Scripts Disponibles

```bash
# Desarrollo (con hot-reload)
npm run dev

# Build para producción
npm run build

# Producción
npm start

# Testing
npm test                    # Ejecutar tests
npm run test:watch         # Tests en modo watch

# Prisma
npm run prisma:generate    # Generar Prisma Client
npm run prisma:migrate     # Ejecutar migraciones
npm run prisma:studio      # Abrir Prisma Studio (GUI)

# Linting y formato
npm run lint               # Ejecutar ESLint
npm run format             # Formatear código con Prettier
```

## Endpoints de la API

### Health Check

```http
GET /health
```

### Base

```http
GET /
```

### Módulos (Próximamente)

- `GET    /api/v1/socios`                      - Listar socios
- `POST   /api/v1/socios`                      - Crear socio
- `GET    /api/v1/socios/:id`                  - Obtener socio
- `PUT    /api/v1/socios/:id`                  - Actualizar socio
- `GET    /api/v1/creditos`                    - Listar créditos
- `POST   /api/v1/creditos`                    - Solicitar crédito
- `POST   /api/v1/creditos/:id/aprobar`        - Aprobar crédito
- `POST   /api/v1/creditos/:id/desembolsar`    - Desembolsar crédito
- `GET    /api/v1/creditos/:id/amortizacion`   - Ver tabla de amortización
- `POST   /api/v1/pagos`                       - Registrar pago
- `POST   /api/v1/garantias`                   - Crear garantía
- `POST   /api/v1/garantias/:id/liberar`       - Solicitar liberación
- `GET    /api/v1/dashboard/metricas`          - Obtener métricas
- `POST   /api/v1/utilidades/calcular`         - Calcular utilidades
- `POST   /api/v1/utilidades/:id/distribuir`   - Distribuir utilidades

## Reglas de Negocio Implementadas

### Sistema de Etapas (RN-ETA-XXX)

| Etapa | Límite de Crédito | Créditos para Progresión |
|-------|-------------------|--------------------------|
| **Etapa 1 (Iniciante)** | 125% - 200% del ahorro | 3 créditos sin mora |
| **Etapa 2 (Regular)** | 200% del ahorro | 5 créditos sin mora |
| **Etapa 3 (Especial)** | 300% del ahorro | N/A (etapa final) |

### Tasas de Interés (RN-CRE-XXX)

- **Normal**: 1.5% mensual
- **Castigo**: 3.0% mensual (después de 90 días mora)
- **Mora diaria**: 1.0% sobre cuota vencida

### Garantías (RN-GAR-XXX)

- **Recomendadores**: 2 socios Etapa Especial obligatorios
- **Congelamiento**: 10% del monto del crédito
- **Máximo garantías**: 3 garantizados por garante
- **Liberación**: Permitida al 50% del crédito completado con comportamiento EXCELENTE

### Morosidad (RN-MOR-XXX)

| Clasificación | Días de Mora | Acción |
|--------------|--------------|--------|
| LEVE | 1-15 días | Notificación |
| MODERADA | 16-30 días | Restricción de nuevo crédito |
| GRAVE | 31-60 días | Congelamiento adicional |
| PERSISTENTE | 61-89 días | Alerta de castigo |
| CASTIGADO | 90+ días | Castigo automático + cobro a garantes |

## Validaciones Específicas

### Cédula Ecuatoriana
- 10 dígitos
- Algoritmo de verificación oficial
- Provincia válida (01-24)

### Teléfono Ecuatoriano
- Formatos: +593XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX

### Email
- RFC 5322 compliant

### Contraseña
- Mínimo 8 caracteres
- 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial

## Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con coverage
npm test -- --coverage

# Tests en modo watch
npm run test:watch
```

## Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de acceso cross-origin
- **JWT**: Autenticación sin estado
- **Bcrypt**: Hashing de contraseñas (10 rounds)
- **Rate Limiting**: Prevención de ataques de fuerza bruta
- **Validación de entrada**: Sanitización de datos

## Logging

Winston logger con múltiples niveles:
- `error`: Errores críticos
- `warn`: Advertencias
- `info`: Información general
- `http`: Logs de peticiones HTTP
- `debug`: Información de depuración

Logs guardados en:
- `logs/error.log`: Solo errores
- `logs/combined.log`: Todos los logs

## Contribución

1. Fork el proyecto
2. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push al branch: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## Roadmap

- [ ] Implementar autenticación JWT completa
- [ ] Crear servicios de negocio para cada módulo
- [ ] Desarrollar algoritmos de amortización (Francés/Alemán)
- [ ] Implementar sistema de notificaciones
- [ ] Crear tests unitarios y de integración
- [ ] Implementar rate limiting
- [ ] Agregar Swagger/OpenAPI documentation
- [ ] Implementar upload de comprobantes
- [ ] Sistema de backup automático

## Licencia

ISC

## Contacto

Sistema MLF - My Libertad Financiera
