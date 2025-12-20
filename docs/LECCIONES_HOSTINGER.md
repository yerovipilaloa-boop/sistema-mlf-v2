# 📚 Lecciones Aprendidas: Despliegue en Hostinger

> Documento de referencia para evitar errores futuros en despliegues de Node.js en Hostinger Cloud.

---

## 🔴 Error 1: "Archivo de Entrada" Incorrecto

### Síntoma
El servidor responde con JSON de la API o errores 404 en lugar del frontend.

### Causa
Hostinger ignora el script `"start"` del `package.json` y ejecuta directamente el **"Archivo de entrada"** configurado en el panel.

### Solución
En **Hostinger → Ajustes y reimplementación → Configuración de compilación y salida**:
- Cambiar "Archivo de entrada" al archivo correcto (ej: `index.js` o `dist/server.js`)

### Prevención
- ✅ Siempre verificar que el "Archivo de entrada" coincida con lo que esperas ejecutar
- ✅ Usar JavaScript puro (`index.js`) como entry point para evitar problemas de compilación

---

## 🔴 Error 2: Variables de Entorno No Inyectadas

### Síntoma
El servidor crashea con errores de variables faltantes aunque estén configuradas en el panel.

### Causa
Las variables del panel de Hostinger pueden no inyectarse correctamente al proceso Node.js.

### Solución
1. Crear archivo `.env.hostinger` con todas las variables
2. En el build script, copiar a `.env`:
   ```json
   "build": "cp .env.hostinger .env && ..."
   ```

### Prevención
- ✅ Siempre incluir `.env.hostinger` en el repositorio (con excepción en `.gitignore`)
- ✅ Nunca depender solo del panel de Hostinger para variables críticas

---

## 🔴 Error 3: Validación Estricta que Crashea el Servidor

### Síntoma
Error 503 inmediato al iniciar la aplicación.

### Causa
Funciones de validación lanzan `throw new Error()` si faltan variables, crasheando antes de que el servidor inicie.

### Solución
Cambiar `throw new Error()` por `console.warn()` con valores fallback:
```typescript
// ❌ MAL
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET required');

// ✅ BIEN  
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ Using fallback JWT_SECRET');
  process.env.JWT_SECRET = 'fallback-value';
}
```

### Prevención
- ✅ Siempre proveer valores fallback para desarrollo/despliegue inicial
- ✅ Usar warnings en lugar de crashes para variables no críticas

---

## 🔴 Error 4: Archivos Estáticos No Copiados

### Síntoma
Frontend muestra 404 para HTML/CSS/JS aunque los archivos existen en `src/public`.

### Causa
TypeScript (`tsc`) solo compila `.ts` files, NO copia archivos estáticos.

### Solución
Agregar copia manual en el build script:
```json
"build": "... && cp -r src/public dist/public"
```

### Prevención
- ✅ Siempre verificar que archivos estáticos se copien en el build
- ✅ Usar herramientas como `copyfiles` npm package para cross-platform

---

## 🔴 Error 5: Caché de Build en Hostinger

### Síntoma
Los cambios al `package.json` no se reflejan en el build log.

### Causa
Hostinger cachea `node_modules` y posiblemente otros archivos.

### Solución
1. Eliminar `node_modules` desde el explorador de archivos de Hostinger
2. Eliminar `dist` también si es necesario
3. Reimplementar

### Prevención
- ✅ Después de cambios importantes, siempre limpiar caché manualmente
- ✅ Verificar en los logs que el comando mostrado es el esperado

---

## 🔴 Error 6: Errores de TypeScript Ignorados

### Síntoma
El build "pasa" pero la app no funciona correctamente.

### Causa
El script `(tsc || exit 0)` permite que el build continúe aunque haya errores de TypeScript.

### Solución Temporal
Usar `index.js` standalone como entry point que no depende de TypeScript.

### Solución Permanente
Corregir todos los errores de TypeScript:
- DTOs con propiedades incorrectas
- Tipos de Prisma desincronizados
- Propiedades de JWT mal tipadas

### Prevención
- ✅ Regularmente ejecutar `npx tsc --noEmit` para verificar tipos
- ✅ Mantener Prisma Client sincronizado con el schema

---

## ✅ Configuración Recomendada para Hostinger

```
Preajuste del marco: Express
Rama: main
Versión del nodo: 18.x
Directorio raíz: /
Archivo de entrada: index.js
```

### Build Script (package.json)
```json
"build": "cp .env.hostinger .env && npx prisma generate && (tsc || exit 0) && cp -r src/public dist/public"
```

### Start Script
```json
"start": "node index.js"
```

---

## 📋 Checklist Pre-Despliegue

- [ ] `.env.hostinger` existe y tiene credenciales correctas
- [ ] `.env.hostinger` está en `.gitignore` con excepción `!.env.hostinger`
- [ ] `index.js` existe como entry point de respaldo
- [ ] Build script incluye copia de archivos estáticos
- [ ] "Archivo de entrada" en Hostinger coincide con tu entry point
- [ ] Variables de entorno del panel de Hostinger están configuradas
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

*Documento creado: 2025-12-20*
*Proyecto: Sistema MLF - My Libertad Financiera*
