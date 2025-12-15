# Guía de Despliegue en Hostinger (2025 Actualizada) 🚀

Esta guía aprovecha las nuevas funciones de Hostinger (hPanel) para un despliegue rápido y sin comandos complejos.

## 1. Preparación del Entorno (En el Panel de Hostinger)

Antes de subir nada, asegúrate de tener esto configurado en tu hPanel:

1.  **Base de Datos**:
    *   Ve a **Base de Datos MySQL** y crea una nueva (anota Nombre, Usuario y Contraseña).
    *   Importante: El "Host" suele ser `localhost` o `127.0.0.1`.

2.  **Configuración Node.js (App)**:
    *   Ve a la sección **Sitio Web** -> **Node.js**.
    *   **Versión Node.js**: Selecciona **v18** o **v20** (LTS).
    *   **Application Startup File**: Escribe `dist/server.js`.
        *   *¿Por qué?* Porque el código real (compilado) vive en la carpeta `dist`.
    *   **Application Root**: Déjalo como está (normalmente `domains/tudominio.com/public_html`).

3.  **Variables de Entorno (Crucial)**:
    *   En la misma pantalla de Node.js, busca la sección de **Variables de Entorno**.
    *   Agrega una por una las mismas que tienes en tu `.env` local, pero con los datos de **Producción** (usando la BD que creaste en el paso 1):
        *   `PORT`: `8080` (o dejalo vacío si Hostinger lo asigna, pero `3000` NO funcionará).
        *   `DATABASE_URL`: `mysql://USUARIO_DB:PASSWORD_DB@localhost:3306/NOMBRE_DB`
        *   `JWT_SECRET`: (Tu secreto largo y seguro)

## 2. Flujo de Despliegue (Día a Día) 🔄

### Paso 1: En tu PC (Subir cambios)
1.  Haz tus cambios en el código.
2.  Ejecuta: `npm run build` (para verificar que no hay errores graves).
3.  Sube a GitHub:
    ```bash
    git add .
    git commit -m "Mejoras listas"
    git push origin main
    ```

### Paso 2: En Hostinger (Actualizar)
1.  Ve a **Sitio Web** -> **GIT**.
2.  Busca tu repositorio y dale al botón **"DEPLOY"** (o "Actualizar Archivos").
    *   *Esto baja lo último de GitHub.*
3.  Ve a **Sitio Web** -> **Node.js**.
4.  Haz clic en **"NPM INSTALL"** (solo si instalaste librerías nuevas).
5.  Haz clic en **"RESTART"**.

**¡Listo!** En unos segundos tu sitio debería estar actualizado.

---

## 3. ¿La Base de Datos cambió? (Prisma)
Si modificaste el archivo `schema.prisma` (nuevas tablas o columnas), el botón "Deploy" NO actualiza la BD automáticamente.

**Solución Rápida (SSH):**
Solo en este caso necesitas la terminal (o "Terminal SSH" en el panel):
1.  Entra a la terminal.
2.  Ve a tu carpeta: `cd domains/tudominio.com/public_html` (aprox).
3.  Ejecuta: `npx prisma db push`
4.  Reinicia el servidor Node.js desde el panel.
