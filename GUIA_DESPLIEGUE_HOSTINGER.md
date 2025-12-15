# Guía de Despliegue en Hostinger (Plan Cloud Startup) ☁️🚀

Esta guía es específica para tu plan **Cloud Startup**, que soporta aplicaciones Node.js de forma nativa.

## ⚠️ IMPORTANTE: El "Truco" del Tipo de Sitio
No puedes usar un sitio web "Estándar" (PHP). Debes crear una "Web App".
Si ya creaste `proyectomlf.com` como sitio normal, es posible que debas borrarlo y recrearlo, O usar la opción de "Crear Nuevo Sitio" y seleccionar el tipo correcto.

---

## 1. Crear la Aplicación Node.js (Correctamente)

1.  Ve al **Inicio** (Home) de Hostinger.
2.  Haz clic en **Sitios web** -> **Agregar sitio web** (Add Website).
3.  Tipo de sitio: Elige **"Business"** o **"Web App"** (Busca la opción que diga **Node.js** explícitamente en el asistente).
    *   *Si te pregunta "¿Qué deseas crear?", elige "Aplicación Web".*
4.  Conecta tu dominio (`proyectomlf.com`).

## 2. Configuración del Entorno (Panel de la App)

Una vez creada como Web App, verás opciones diferentes. Busca **"Configuración de Node.js"**:

1.  **Versión Node.js**: Selecciona **v18** o **v20**.
2.  **App Startup File**: `dist/server.js` (¡Muy importante!).
3.  **Build Command**: `npm run build`
4.  **Package Manager**: `npm`.

## 3. Variables de Entorno (.env)

En la misma sección de configuración, busca **"Environment Variables"** y pega tus claves:
*   `PORT`: `8080` (Hostinger suele asignar este, o el `3000`).
*   `DATABASE_URL`: Tu conexión MySQL `mysql://usuario:pass@localhost:3306/db`.
*   `JWT_SECRET`: Tu clave secreta.

## 4. Despliegue con un Clic (Git)

1.  Ve a la sección **"Deployment"** o **"Git"**.
2.  Conecta tu repositorio: `yerovipilaloa-boop/sistema-mlf-v2`.
    *   Rama: `main`.
3.  Activa "Auto-Deploy" si está disponible.
4.  Haz clic en **"Deploy"**.

Hostinger se encargará de:
1.  Clonar el código.
2.  Instalar dependencias (`npm install`).
3.  Compilar (`npm run build`).
4.  Iniciar el servidor (`dist/server.js`).

---

## Solución de Problemas Comunes

*   **Error 404 / 502**: Significa que el servidor no inició. Revisa la pestaña "Logs" o "Monitor".
*   **Database Error**: Verifica que la `DATABASE_URL` sea correcta y que la IP de la base de datos sea accesible (normalmente `localhost` o `127.0.0.1` en planes Cloud).

