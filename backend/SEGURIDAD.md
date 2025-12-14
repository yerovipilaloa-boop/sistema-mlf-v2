# Guia de Seguridad - Sistema MLF

## Checklist Antes de Desplegar a Produccion

### 1. Variables de Entorno (CRITICO)

- [ ] **JWT_SECRET**: Genera uno nuevo y seguro
  ```bash
  # En Linux/Mac:
  openssl rand -base64 64

  # En Windows PowerShell:
  [Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
  ```

- [ ] **JWT_REFRESH_SECRET**: Genera otro diferente al anterior

- [ ] **DATABASE_URL**: Railway te proporcionara esta URL automaticamente

- [ ] **CORS_ORIGIN**: Configura el dominio exacto de tu frontend
  ```
  # Ejemplo:
  CORS_ORIGIN=https://mlf-frontend.up.railway.app
  ```

- [ ] **DEBUG=false**: Asegurate que este desactivado

- [ ] **ENABLE_SQL_LOGGING=false**: Desactiva logs de SQL

- [ ] **LOG_LEVEL=info**: Usa 'info' o 'warn', nunca 'debug'

---

### 2. Contrasenas de Usuarios

- [ ] Cambia la contrasena del usuario `admin` antes de produccion
- [ ] Asegurate que todas las contrasenas tengan minimo 8 caracteres
- [ ] Nunca uses contrasenas como: admin123, password, 123456

---

### 3. Base de Datos

- [ ] Railway crea la base de datos automaticamente
- [ ] El backup automatico esta incluido en Railway
- [ ] Nunca expongas DATABASE_URL publicamente

---

### 4. Archivos que NUNCA deben subirse a Git

```
.env                    # Variables locales
.env.production         # Variables de produccion
.env.local              # Variables locales
*.log                   # Logs
node_modules/           # Dependencias
```

El archivo `.gitignore` ya esta configurado correctamente.

---

### 5. Headers de Seguridad (Ya Configurados)

El sistema ya incluye:
- [x] Helmet (headers de seguridad)
- [x] CORS configurado
- [x] Rate limiting preparado
- [x] JWT con expiracion

---

### 6. Protecciones Incluidas

| Vulnerabilidad | Proteccion | Estado |
|----------------|------------|--------|
| SQL Injection | Prisma ORM | ✅ |
| XSS | Helmet + no renderiza HTML | ✅ |
| CSRF | API REST + JWT | ✅ |
| Fuerza bruta | Rate limiting | ✅ |
| Tokens expuestos | No se loguean | ✅ |

---

## Pasos para Desplegar en Railway

### Paso 1: Preparar el Proyecto
```bash
# Asegurate que no hay errores de TypeScript
npm run build
```

### Paso 2: En Railway
1. Crea un nuevo proyecto
2. Conecta tu repositorio de GitHub
3. Agrega un servicio de PostgreSQL
4. Configura las variables de entorno (ver seccion 1)

### Paso 3: Variables en Railway
En el dashboard de Railway, ve a "Variables" y agrega:

```
NODE_ENV=production
JWT_SECRET=tu_secret_seguro_generado
JWT_REFRESH_SECRET=otro_secret_seguro
CORS_ORIGIN=https://tu-dominio.up.railway.app
BCRYPT_ROUNDS=12
LOG_LEVEL=info
DEBUG=false
```

Railway configura automaticamente:
- DATABASE_URL (la base de datos)
- PORT (el puerto)

### Paso 4: Ejecutar Migraciones
Railway ejecutara automaticamente el build. Para las migraciones:
```bash
npx prisma migrate deploy
```

---

## Contacto de Emergencia

Si detectas una vulnerabilidad o brecha de seguridad:
1. No lo publiques en GitHub
2. Cambia inmediatamente los secrets
3. Revisa los logs de acceso

---

## Actualizaciones de Seguridad

Regularmente ejecuta:
```bash
npm audit
npm update
```

Para ver vulnerabilidades conocidas en dependencias.
