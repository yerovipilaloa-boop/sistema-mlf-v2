# Guía de Instalación - Backend MLF

Guía paso a paso para configurar y ejecutar el backend del Sistema My Libertad Financiera.

## Requisitos Previos

### Software Requerido

- **Node.js**: v18.0.0 o superior
- **npm**: v9.0.0 o superior
- **PostgreSQL**: v14 o superior
- **Git**: Para control de versiones

### Verificar Instalaciones

```bash
node --version   # Debe ser >= 18.0.0
npm --version    # Debe ser >= 9.0.0
psql --version   # Debe ser >= 14.0
```

---

## Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone <repository_url>
cd CLAUDEMLF/backend
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias especificadas en `package.json`:
- Express, Prisma, JWT, bcrypt, Winston, etc.

### 3. Configurar Base de Datos PostgreSQL

#### 3.1 Crear Base de Datos

```bash
# Opción 1: Usando psql
psql -U postgres
CREATE DATABASE mlf_db;
\q

# Opción 2: Usando createdb
createdb -U postgres mlf_db
```

#### 3.2 Ejecutar Scripts SQL

```bash
cd ../database
psql -U postgres -d mlf_db -f 00_MASTER_SETUP.sql
```

Esto creará:
- 18 tablas
- 15+ triggers
- 50+ reglas de negocio
- Datos de prueba (admin, operador, socios de ejemplo)

**Usuarios de prueba creados:**
- Usuario: `admin` | Email: `admin@mylf.com`
- Usuario: `operador` | Email: `operador@mylf.com`

### 4. Configurar Variables de Entorno

```bash
cd ../backend
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Base de datos
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/mlf_db?schema=public"

# JWT (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET="tu_secreto_super_seguro_minimo_32_caracteres_cambiar_en_produccion"

# Puerto
PORT=3000

# CORS (ajustar según tu frontend)
CORS_ORIGIN=http://localhost:5173
```

**IMPORTANTE:**
- Reemplaza `tu_password` con la contraseña de PostgreSQL
- Genera un JWT_SECRET seguro para producción:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

### 5. Generar Prisma Client

```bash
npm run prisma:generate
```

Esto genera el cliente TypeScript de Prisma basado en el schema.

### 6. Verificar Configuración

```bash
npm run prisma:studio
```

Esto abrirá Prisma Studio (GUI) en `http://localhost:5555` donde puedes ver:
- Todas las tablas
- Datos de prueba cargados
- Relaciones entre tablas

---

## Ejecución

### Modo Desarrollo (con hot-reload)

```bash
npm run dev
```

El servidor iniciará en: `http://localhost:3000`

**Verificar que funciona:**
```bash
curl http://localhost:3000/health
```

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "2025-11-02T...",
  "uptime": 10.5,
  "environment": "development"
}
```

### Modo Producción

```bash
# 1. Build
npm run build

# 2. Ejecutar
npm start
```

---

## Testing

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests con coverage
npm test -- --coverage

# Tests en modo watch
npm run test:watch
```

---

## Primeros Pasos

### 1. Probar Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin",
    "password": "Admin123!"
  }'
```

**Nota:** La contraseña `Admin123!` es temporal. Los hashes en `05_seed_data.sql` son ejemplos. Deberás:

1. Actualizar los password_hash con hashes reales:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Admin123!', 10));"
   ```

2. O crear un script de seed personalizado

### 2. Guardar Access Token

Del resultado anterior, copia el `accessToken`.

### 3. Probar Endpoint Autenticado

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <tu_access_token>"
```

### 4. Explorar API

Endpoints disponibles:
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registrar usuario (solo ADMIN)
- `POST /api/v1/auth/refresh` - Renovar token
- `POST /api/v1/auth/logout` - Cerrar sesión
- `POST /api/v1/auth/change-password` - Cambiar contraseña
- `GET /api/v1/auth/me` - Info del usuario
- `GET /api/v1/auth/verify` - Verificar token

Ver documentación completa en: [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md)

---

## Troubleshooting

### Error: "Cannot connect to database"

**Solución:**
1. Verificar que PostgreSQL esté corriendo:
   ```bash
   # Windows
   services.msc -> buscar PostgreSQL

   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Verificar credenciales en `.env`
3. Verificar que la base de datos `mlf_db` existe:
   ```bash
   psql -U postgres -l | grep mlf_db
   ```

### Error: "JWT_SECRET no está definida"

**Solución:**
1. Verificar que `.env` existe
2. Verificar que `JWT_SECRET` está configurado en `.env`
3. Reiniciar el servidor

### Error: "Table 'socios' does not exist"

**Solución:**
Ejecutar los scripts SQL:
```bash
cd ../database
psql -U postgres -d mlf_db -f 00_MASTER_SETUP.sql
```

### Error al ejecutar Prisma

**Solución:**
```bash
npm run prisma:generate
```

### Logs no se generan

**Solución:**
Crear directorio de logs:
```bash
mkdir logs
```

---

## Scripts Útiles

```bash
# Desarrollo
npm run dev              # Servidor con hot-reload

# Build
npm run build            # Compilar TypeScript

# Producción
npm start                # Ejecutar build

# Testing
npm test                 # Ejecutar tests
npm run test:watch       # Tests en modo watch

# Prisma
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio (GUI)

# Código
npm run lint             # Ejecutar ESLint
npm run format           # Formatear con Prettier
```

---

## Estructura de Logs

```
logs/
├── error.log       # Solo errores
└── combined.log    # Todos los logs
```

Ver logs en tiempo real:
```bash
# Linux/Mac
tail -f logs/combined.log

# Windows PowerShell
Get-Content logs\combined.log -Wait
```

---

## Siguiente Paso

Una vez el backend esté funcionando:

1. **Revisar documentación de autenticación:** [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md)
2. **Explorar Prisma Studio:** `npm run prisma:studio`
3. **Leer README principal:** [README.md](README.md)
4. **Comenzar desarrollo de módulos de negocio**

---

## Soporte

Si encuentras problemas:
1. Revisar logs: `logs/error.log`
2. Verificar configuración: `.env`
3. Consultar documentación de Prisma: https://www.prisma.io/docs
4. Consultar documentación de Express: https://expressjs.com/

---

## Seguridad en Producción

Antes de desplegar a producción:

✅ Cambiar `JWT_SECRET` por uno seguro de 64+ caracteres
✅ Cambiar contraseñas de usuarios admin/operador
✅ Configurar `NODE_ENV=production`
✅ Habilitar HTTPS
✅ Configurar CORS correctamente
✅ Implementar rate limiting
✅ Configurar firewall de base de datos
✅ Habilitar backups automáticos
✅ Configurar monitoring y alertas
✅ Revisar logs de seguridad regularmente
