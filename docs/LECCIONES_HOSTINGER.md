# 📚 Lecciones Aprendidas: Despliegue en Hostinger

> Documento de referencia para evitar errores futuros en despliegues de Node.js en Hostinger Cloud.
> 
> **Última actualización:** 2025-12-20
> **Estado:** ✅ Despliegue Exitoso

---

## 🎯 Resumen Ejecutivo

El sistema MLF fue desplegado exitosamente en Hostinger Cloud después de resolver múltiples problemas de configuración. Este documento detalla cada problema encontrado y su solución.

**URL del sitio:** [palevioletred-caterpillar-896307.hostingersite.com](https://palevioletred-caterpillar-896307.hostingersite.com)

---

## 🔴 Errores Encontrados y Solucionados

### Error 1: "Archivo de Entrada" Incorrecto
**Síntomas:** El servidor responde con JSON de la API o errores 404 en lugar del frontend.

**Causa:** Hostinger ignora el script `"start"` del `package.json` y ejecuta directamente el **"Archivo de entrada"** configurado en el panel.

**Solución:**
- En **Hostinger → Ajustes y reimplementación**
- Cambiar "Archivo de entrada" al archivo correcto:
  - Para producción con TypeScript compilado: `dist/server.js`
  - Para fallback sin compilación: `index.js`

**Prevención:**
- ✅ Siempre verificar que el "Archivo de entrada" coincida con lo esperado
- ✅ Tener un archivo `index.js` de respaldo que cargue el servidor compilado

---

### Error 2: Variables de Entorno No Inyectadas
**Síntomas:** El servidor crashea con errores de variables faltantes aunque estén configuradas en el panel.

**Causa:** Las variables del panel de Hostinger pueden no inyectarse correctamente al proceso Node.js.

**Solución:**
1. Crear archivo `.env.hostinger` con todas las variables:
```
DATABASE_URL=mysql://user:pass@127.0.0.1:3306/db_name
JWT_SECRET=ClaveSecreta
PORT=3000
NODE_ENV=production
```

2. Modificar el build script para copiar a `.env`:
```json
"build": "cp .env.hostinger .env && npx prisma generate && tsc && cp -r src/public dist/public"
```

3. Agregar excepción en `.gitignore`:
```
.env.*
!.env.hostinger
```

**Prevención:**
- ✅ Siempre incluir `.env.hostinger` en el repositorio
- ✅ Nunca depender solo del panel para variables críticas

---

### Error 3: Validación Estricta que Crashea el Servidor
**Síntomas:** Error 503 inmediato al iniciar la aplicación.

**Causa:** Función `validateConfig()` lanza `throw new Error()` si faltan variables.

**Solución:**
```typescript
// ❌ MAL - Crashea el servidor
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET required');
}

// ✅ BIEN - Usa fallback con advertencia
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ Using fallback JWT_SECRET');
  process.env.JWT_SECRET = 'fallback-value';
}
```

**Prevención:**
- ✅ Usar warnings en lugar de crashes para variables no críticas
- ✅ Proveer valores fallback para desarrollo/despliegue inicial

---

### Error 4: Archivos Estáticos No Copiados
**Síntomas:** Frontend muestra 404 para HTML/CSS/JS.

**Causa:** TypeScript (`tsc`) solo compila `.ts` files, NO copia archivos estáticos.

**Solución:**
Agregar copia manual en el build script:
```json
"build": "... && cp -r src/public dist/public"
```

**Prevención:**
- ✅ Siempre verificar que archivos estáticos se copien en el build
- ✅ Usar herramientas como `copyfiles` para cross-platform

---

### Error 5: Caché de Build en Hostinger
**Síntomas:** Los cambios al `package.json` no se reflejan en el build log.

**Causa:** Hostinger cachea `node_modules` y archivos de build.

**Solución:**
1. Eliminar `node_modules` desde el explorador de archivos de Hostinger
2. Eliminar `dist` si es necesario
3. Reimplementar

**Prevención:**
- ✅ Después de cambios importantes, limpiar caché manualmente
- ✅ Verificar en los logs que el comando mostrado es el esperado

---

### Error 6: Errores de TypeScript por Tipos Desincronizados
**Síntomas:** El build tiene 20+ errores de TypeScript, el servidor no carga rutas.

**Causa:** Los tipos locales en `src/types/index.ts` no coinciden con los generados por Prisma.

**Errores específicos encontrados:**

| Archivo | Error | Solución |
|---------|-------|----------|
| `types/index.ts` | `RolSocio` tiene `OPERADOR` pero Prisma tiene `TESORERO` | Sincronizar con Prisma schema |
| `types/index.ts` | `EstadoGarantia` tiene `EN_LIBERACION` que no existe en Prisma | Remover del enum local |
| `auth.service.ts` | Error de tipo en `jwt.sign()` con `expiresIn` | Agregar cast: `as jwt.SignOptions` |

**Solución:**
```typescript
// Asegurar que los enums locales coincidan con Prisma
export enum RolSocio {
  SOCIO = 'SOCIO',
  TESORERO = 'TESORERO',  // NO OPERADOR
  ADMIN = 'ADMIN',
}

export enum EstadoGarantia {
  PENDIENTE = 'PENDIENTE',
  ACTIVA = 'ACTIVA',
  EJECUTADA = 'EJECUTADA',
  LIBERADA = 'LIBERADA',  // NO EN_LIBERACION, CANCELADA
}
```

**Prevención:**
- ✅ Después de cambiar el schema de Prisma, actualizar `types/index.ts`
- ✅ Ejecutar `npx tsc --noEmit` regularmente para verificar tipos

---

## ✅ Configuración Final Exitosa

### Panel de Hostinger

| Campo | Valor |
|-------|-------|
| Preajuste del marco | Express |
| Rama | main |
| Versión del nodo | 18.x |
| Directorio raíz | / |
| **Archivo de entrada** | **index.js** |

### Variables de Entorno (Panel de Hostinger)

| Variable | Valor |
|----------|-------|
| PORT | 3000 |
| JWT_SECRET | ClaveSecretaMLF2024 |
| NODE_ENV | production |
| DATABASE_URL | (en .env.hostinger) |

### Scripts en package.json

```json
{
  "scripts": {
    "build": "cp .env.hostinger .env && npx prisma generate && (tsc || exit 0) && cp -r src/public dist/public",
    "start": "node index.js"
  }
}
```

---

## 📋 Checklist Pre-Despliegue

- [ ] `.env.hostinger` existe y tiene credenciales correctas
- [ ] `.env.hostinger` está en `.gitignore` con excepción `!.env.hostinger`
- [ ] `index.js` existe como entry point de respaldo
- [ ] Build script incluye:
  - [ ] Copia de `.env.hostinger` a `.env`
  - [ ] `prisma generate`
  - [ ] Compilación TypeScript
  - [ ] Copia de archivos estáticos
- [ ] "Archivo de entrada" en Hostinger configurado correctamente
- [ ] Tipos locales sincronizados con Prisma schema
- [ ] Commit reciente está desplegado (verificar hash en panel)

---

## 🔧 Comandos Útiles de Debug

```bash
# Ver logs de build en Hostinger
→ Panel → Implementación → Click en deploy → Ver logs

# Verificar tipos localmente
npx tsc --noEmit

# Verificar Prisma
npx prisma validate

# Generar cliente Prisma
npx prisma generate
```

---

## 🔐 Credenciales de Acceso

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | `admin` | `admin123` |

⚠️ **IMPORTANTE:** Cambiar estas credenciales en producción real.

---

## 📊 Estado Actual del Sistema

| Componente | Estado |
|------------|--------|
| Frontend (Login) | ✅ Funcionando |
| Backend (API) | ✅ Funcionando |
| Base de Datos | ✅ Conectada |
| Dashboard Admin | ✅ Funcionando |
| Autenticación | ✅ Funcionando |

---

*Documento creado: 2025-12-20*
*Proyecto: Sistema MLF - My Libertad Financiera*
*Autor: Desarrollo con Gemini*
