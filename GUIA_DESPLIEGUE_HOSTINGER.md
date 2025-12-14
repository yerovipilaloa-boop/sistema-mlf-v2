# Guía de Despliegue y Actualización en Hostinger

## 1. Configuración Inicial (¡YA COMPLETADA!) ✅
Los pasos difíciles ya están hechos y **NO necesitas repetirlos**:
- [x] Crear Base de Datos y Usuario en Hostinger.
- [x] Configurar el acceso SSH.
- [x] Crear el archivo `.env` manual.
- [x] Conectar GitHub con Hostinger.
- [x] Instalar dependencias (`npm install`) por primera vez.
- [x] Sembrar el usuario administrador (`seed`).

---

## 2. Flujo Diario: ¿Cómo subir nuevos cambios? 🔄
Cuando hagas modificaciones en el código (HTML, CSS, JS, Backend) en tu computadora, solo sigue estos pasos sencillos:

### Paso 1: En tu Computadora (Local)
Sube los cambios a GitHub como siempre:
```bash
git add .
git commit -m "Descripción de lo que cambiaste"
git push origin main
```

### Paso 2: En Hostinger (Nube)
1.  Ve al Panel de Hostinger -> **GIT**.
2.  Haz clic en el botón **"Deploy"** (a veces dice "Update" o muestra un icono de recarga).
    *   *Esto descarga tu código nuevo al servidor.*
3.  Ve a **Website** (o donde aparezca tu dominio) y busca el botón **"Restart"** (Reiniciar) en la sección de Node.js.
    *   *Esto apaga y prende el servidor para que lea los cambios.*

**¡Y listo! Tu cambio está en vivo.**

---

## 3. Casos Especiales (Solo si...) ⚠️

### Si instalas una LIBRERÍA NUEVA (`npm install una-libreria`):
Si agregaste algo nuevo al `package.json`, entonces sí debes:
1.  Hacer el Deploy estándar (Paso 2 arriba).
2.  Entrar por SSH (`ssh -p ...`).
3.  Ejecutar: `npm install`
4.  Luego reiniciar el servidor.

### Si cambias la BASE DE DATOS (schema.prisma):
Si agregaste una tabla o cambiaste un campo:
1.  Hacer el Deploy estándar.
2.  Entrar por SSH.
3.  Ejecutar: `npx prisma db push`
4.  Reiniciar servidor.

---
**Resumen:** Para el 90% de los cambios (texto, colores, lógica simple), solo es **Git Push -> Hostinger Deploy -> Restart**. ¡Muy fácil!
