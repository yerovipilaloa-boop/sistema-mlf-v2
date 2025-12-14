# Sistema de Autenticación - MLF

Documentación completa del sistema de autenticación y autorización del Sistema My Libertad Financiera.

## Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Endpoints](#endpoints)
- [Roles y Permisos](#roles-y-permisos)
- [Flujos de Autenticación](#flujos-de-autenticación)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Seguridad](#seguridad)

---

## Arquitectura

### Stack Tecnológico
- **JWT (JSON Web Tokens)**: Para autenticación sin estado
- **bcryptjs**: Para hashing de contraseñas (10 rounds)
- **Sesiones en DB**: Control de sesiones activas y logout
- **Auditoría**: Registro completo de eventos de autenticación

### Componentes

```
┌─────────────────────────────────────────────────────────┐
│                   Cliente (Frontend)                     │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Request
                           │ Authorization: Bearer <token>
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Express Middleware Layer                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. authenticate()                                │  │
│  │     - Verificar token JWT                         │  │
│  │     - Decodificar payload                         │  │
│  │     - Adjuntar user a request                     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  2. authorize(roles)                              │  │
│  │     - Verificar rol del usuario                   │  │
│  │     - Permitir o denegar acceso                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Auth Controller                         │
│  - login()                                               │
│  - register()                                            │
│  - refresh()                                             │
│  - logout()                                              │
│  - changePassword()                                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Auth Service                           │
│  - Generación de tokens                                  │
│  - Verificación de credenciales                          │
│  - Gestión de sesiones                                   │
│  - Auditoría de eventos                                  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│  - socios (usuarios)                                     │
│  - sesiones                                              │
│  - auditoria                                             │
└─────────────────────────────────────────────────────────┘
```

---

## Endpoints

### Base URL
```
/api/v1/auth
```

### 1. Login

**POST** `/login`

Autenticar usuario y obtener tokens.

**Request:**
```json
{
  "usuario": "admin",
  "password": "Admin123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "codigo": "SOC-2025-0001",
      "usuario": "admin",
      "email": "admin@mylf.com",
      "rol": "ADMIN",
      "nombreCompleto": "Administrador Sistema"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "message": "Login exitoso",
  "timestamp": "2025-11-02T10:00:00.000Z"
}
```

**Errores:**
- `401 Unauthorized`: Credenciales inválidas
- `401 Unauthorized`: Usuario sin credenciales configuradas

---

### 2. Register

**POST** `/register`

Registrar nuevo usuario (solo ADMIN).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "usuario": "nuevo.operador",
  "password": "Password123!",
  "email": "operador@mylf.com",
  "nombreCompleto": "Nuevo Operador",
  "documentoIdentidad": "1234567890",
  "rol": "OPERADOR"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 7,
      "codigo": "SOC-2025-0007",
      "usuario": "nuevo.operador",
      "email": "operador@mylf.com",
      "rol": "OPERADOR",
      "nombreCompleto": "Nuevo Operador"
    },
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": "24h"
  },
  "message": "Usuario registrado exitosamente",
  "timestamp": "2025-11-02T10:00:00.000Z"
}
```

**Errores:**
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: No tiene rol ADMIN
- `409 Conflict`: Usuario o email ya existe
- `422 Validation Error`: Datos inválidos

---

### 3. Refresh Token

**POST** `/refresh`

Renovar access token usando refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token renovado exitosamente",
  "timestamp": "2025-11-02T10:00:00.000Z"
}
```

**Errores:**
- `401 Unauthorized`: Token inválido o expirado
- `401 Unauthorized`: Sesión no encontrada

---

### 4. Logout

**POST** `/logout`

Cerrar sesión activa.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": null,
  "message": "Sesión cerrada exitosamente",
  "timestamp": "2025-11-02T10:00:00.000Z"
}
```

---

### 5. Change Password

**POST** `/change-password`

Cambiar contraseña del usuario autenticado.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "currentPassword": "Admin123!",
  "newPassword": "NuevoPassword123!",
  "confirmPassword": "NuevoPassword123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": null,
  "message": "Contraseña cambiada exitosamente",
  "timestamp": "2025-11-02T10:00:00.000Z"
}
```

**Nota:** Todas las sesiones activas se cierran al cambiar la contraseña.

---

### 6. Get Me

**GET** `/me`

Obtener información del usuario autenticado.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "codigo": "SOC-2025-0001",
    "email": "admin@mylf.com",
    "rol": "ADMIN",
    "nombreCompleto": "Administrador Sistema"
  },
  "message": "Información de usuario obtenida exitosamente",
  "timestamp": "2025-11-02T10:00:00.000Z"
}
```

---

### 7. Verify Token

**GET** `/verify`

Verificar si el token es válido.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": 1,
      "codigo": "SOC-2025-0001",
      "email": "admin@mylf.com",
      "rol": "ADMIN",
      "nombreCompleto": "Administrador Sistema"
    }
  },
  "message": "Token válido",
  "timestamp": "2025-11-02T10:00:00.000Z"
}
```

---

## Roles y Permisos

### Jerarquía de Roles

```
┌─────────────────────────────────────────────────┐
│                     ADMIN                        │
│  - Acceso total al sistema                      │
│  - Crear/editar/eliminar cualquier recurso      │
│  - Registrar nuevos usuarios                     │
│  - Cambiar configuraciones críticas              │
│  - Ver todos los reportes y auditoría            │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                   OPERADOR                       │
│  - Gestionar socios                              │
│  - Aprobar/rechazar créditos                     │
│  - Registrar pagos                               │
│  - Ver reportes y dashboard                      │
│  - NO puede cambiar configuraciones críticas     │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                    SOCIO                         │
│  - Ver su propia información                     │
│  - Solicitar créditos                            │
│  - Ver su historial de pagos                     │
│  - Ver sus utilidades                            │
│  - NO puede acceder a información de otros       │
└─────────────────────────────────────────────────┘
```

### Uso de Middlewares

```typescript
import { authenticate, authorize, requireAdmin, requireAdminOrOperator, requireOwnerOrAdmin } from './middlewares/auth.middleware';

// Requiere autenticación solamente
router.get('/me', authenticate, controller.getMe);

// Requiere autenticación + rol específico
router.post('/socios', authenticate, authorize(RolSocio.ADMIN, RolSocio.OPERADOR), controller.crearSocio);

// Solo ADMIN
router.post('/configuraciones', authenticate, requireAdmin, controller.actualizarConfig);

// ADMIN u OPERADOR
router.get('/dashboard', authenticate, requireAdminOrOperator, controller.getDashboard);

// Dueño del recurso o ADMIN/OPERADOR
router.get('/socios/:id', authenticate, requireOwnerOrAdmin('id'), controller.getSocio);
```

---

## Flujos de Autenticación

### Flujo de Login

```
┌──────────┐                                           ┌──────────┐
│ Cliente  │                                           │ Servidor │
└──────────┘                                           └──────────┘
     │                                                       │
     │  POST /api/v1/auth/login                             │
     │  { usuario, password }                               │
     ├──────────────────────────────────────────────────────►
     │                                                       │
     │                             Verificar credenciales   │
     │                             bcrypt.compare()         │
     │                                                       │
     │                             Generar JWT tokens       │
     │                             Crear sesión en DB       │
     │                             Registrar auditoría      │
     │                                                       │
     │  200 OK                                              │
     │  { user, accessToken, refreshToken }                 │
     ◄──────────────────────────────────────────────────────┤
     │                                                       │
     │  Guardar tokens en localStorage/sessionStorage       │
     │                                                       │
```

### Flujo de Request Autenticado

```
┌──────────┐                                           ┌──────────┐
│ Cliente  │                                           │ Servidor │
└──────────┘                                           └──────────┘
     │                                                       │
     │  GET /api/v1/socios                                  │
     │  Authorization: Bearer <accessToken>                 │
     ├──────────────────────────────────────────────────────►
     │                                                       │
     │                             authenticate()           │
     │                             - Verificar token        │
     │                             - Decodificar payload    │
     │                             - Adjuntar user          │
     │                                                       │
     │                             authorize()              │
     │                             - Verificar rol          │
     │                                                       │
     │                             Ejecutar controller      │
     │                                                       │
     │  200 OK                                              │
     │  { data }                                            │
     ◄──────────────────────────────────────────────────────┤
     │                                                       │
```

### Flujo de Refresh Token

```
┌──────────┐                                           ┌──────────┐
│ Cliente  │                                           │ Servidor │
└──────────┘                                           └──────────┘
     │                                                       │
     │  accessToken expirado (401)                          │
     │                                                       │
     │  POST /api/v1/auth/refresh                           │
     │  { refreshToken }                                    │
     ├──────────────────────────────────────────────────────►
     │                                                       │
     │                             Verificar refreshToken   │
     │                             Verificar sesión activa  │
     │                             Generar nuevo accessToken│
     │                             Actualizar último acceso │
     │                                                       │
     │  200 OK                                              │
     │  { accessToken }                                     │
     ◄──────────────────────────────────────────────────────┤
     │                                                       │
     │  Reintentar request original con nuevo token         │
     │                                                       │
```

---

## Ejemplos de Uso

### Login y uso de token

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin",
    "password": "Admin123!"
  }'

# Guardar accessToken de la respuesta

# 2. Request autenticado
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"

# 3. Refresh token
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'

# 4. Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
```

### Uso en JavaScript/TypeScript

```typescript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    usuario: 'admin',
    password: 'Admin123!',
  }),
});

const { data } = await loginResponse.json();
const { accessToken, refreshToken } = data;

// Guardar tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// 2. Request autenticado
const getMe = await fetch('http://localhost:3000/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const userData = await getMe.json();

// 3. Interceptor de axios para refresh automático
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post('/api/v1/auth/refresh', { refreshToken });

      const { accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);

      originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
      return axios(originalRequest);
    }

    return Promise.reject(error);
  }
);
```

---

## Seguridad

### Configuración de Contraseñas

**Requisitos:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Al menos 1 carácter especial (@$!%*?&)

**Ejemplo:** `Admin123!`

### Hashing

- **Algoritmo:** bcrypt
- **Rounds:** 10 (configurable vía `BCRYPT_ROUNDS`)
- **Salt:** Generado automáticamente por bcrypt

### Tokens JWT

**Access Token:**
- **Duración:** 24 horas (configurable vía `JWT_EXPIRES_IN`)
- **Uso:** Autenticación de requests
- **Storage:** sessionStorage (recomendado)

**Refresh Token:**
- **Duración:** 7 días (configurable vía `JWT_REFRESH_EXPIRES_IN`)
- **Uso:** Renovar access tokens
- **Storage:** httpOnly cookie (recomendado en producción)

**Payload:**
```json
{
  "id": 1,
  "codigo": "SOC-2025-0001",
  "usuario": "admin",
  "email": "admin@mylf.com",
  "rol": "ADMIN",
  "nombreCompleto": "Administrador Sistema",
  "iat": 1699000000,
  "exp": 1699086400
}
```

### Sesiones

- Almacenadas en PostgreSQL
- Incluyen: token, usuario, IP, user-agent, geolocalización
- Se cierran automáticamente al:
  - Logout explícito
  - Cambio de contraseña
  - Expiración (7 días de inactividad)

### Auditoría

Todos los eventos de autenticación se registran en la tabla `auditoria`:
- Login exitoso/fallido
- Registro de nuevo usuario
- Cambio de contraseña
- Logout

### Best Practices

1. **Nunca enviar tokens en URL**
2. **Usar HTTPS en producción**
3. **Rotar refresh tokens regularmente**
4. **Invalidar sesiones al cambiar password**
5. **Implementar rate limiting**
6. **Verificar fortaleza de contraseñas**
7. **Registrar intentos de acceso fallidos**

---

## Usuarios de Prueba

Los siguientes usuarios están pre-cargados en la base de datos después de ejecutar `05_seed_data.sql`:

| Usuario | Email | Password (ejemplo) | Rol |
|---------|-------|-------------------|-----|
| `admin` | admin@mylf.com | `Admin123!` | ADMIN |
| `operador` | operador@mylf.com | `Operador123!` | OPERADOR |

**IMPORTANTE:** Cambiar estas contraseñas en producción.
