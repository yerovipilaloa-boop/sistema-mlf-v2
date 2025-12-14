# DOCUMENTO MAESTRO MLF COMPLETO v2.0
**Fecha de Actualización:** 14 de Diciembre, 2025
**Estado del Sistema:** Pre-Producción / Fase de Refinamiento
**Versión:** 2.0.0

---

## 1. Visión General del Proyecto
El sistema **My Libertad Financiera (MLF)** es una plataforma web integral para la gestión de "banca comunal" o cajas de ahorro colaborativas. Permite a los socios gestionar sus ahorros, solicitar créditos, ver su estado de cuenta y recibir utilidades, mientras que ofrece a los administradores herramientas para la aprobación de transacciones, gestión de usuarios y generación de reportes financieros.

El objetivo principal es proveer una interfaz moderna, segura y fácil de usar, emulando la experiencia de una entidad bancaria profesional, pero adaptada a las reglas de negocio de una caja de ahorro privada.

---

## 2. Arquitectura del Sistema
El sistema sigue una arquitectura cliente-servidor tradicional con una API RESTful.

### 2.1 Backend (`/backend`)
*   **Lenguaje:** TypeScript (ejecutado en Node.js v18+)
*   **Framework:** Express.js
*   **Base de Datos:** PostgreSQL
*   **ORM:** Prisma
*   **Autenticación:** JWT (JSON Web Tokens) con roles (ADMIN, SOCIO).
*   **Estructura de Carpetas:**
    *   `src/controllers`: Lógica de entrada/salida de la API.
    *   `src/services`: Lógica de negocio pura.
    *   `src/routes`: Definición de endpoints.
    *   `src/middleware`: Validaciones y autenticación.
    *   `prisma/schema.prisma`: Definición del modelo de datos.

### 2.2 Frontend (`/frontend`)
*   **Tecnología:** HTML5, CSS3, JavaScript (Vanilla ES6+).
*   **Librerías:** Bootstrap 5.3 (UI), Google Fonts (Inter).
*   **Estructura:**
    *   `dashboard-socio.html`: Interfaz principal del socio.
    *   `js/dashboard-socio.js`: Lógica del cliente, manejo del DOM y consumo de API.
    *   `css/dashboard-pichincha.css`: Estilos personalizados (tema institucional).

---

## 3. Funcionalidades Actuales (Estado Real)

### 3.1 Módulo de Socios (Dashboard)
El dashboard del socio ha sido recientemente refinado para mejorar la usabilidad y estética:

*   **Resumen Financiero:**
    *   Visualización de Ahorro Total, Ahorro Comprometido y Disponible.
    *   Indicador de Balance Neto (Ahorros vs Deudas).
    *   Visualización de Utilidades Proyectadas (1% semestral).

*   **Gestión de Créditos:**
    *   **Simulador de Crédito:** Herramienta interactiva para calcular cuotas.
        *   *Nueva Funcionalidad:* Botón "Solicitar este Crédito" que transfiere los datos de la simulación directamente al formulario de solicitud.
    *   **Solicitud de Créditos:** Formulario validado para nuevos préstamos (Amortización Francesa/Alemana).
    *   **Tabla de Amortización:** Visualización detallada de cuotas y saldos.
    *   **Próximas Cuotas:** Lista compacta de las 5 cuotas más próximas a vencer, ordenadas cronológicamente con indicadores visuales de estado (al día, próximo, vencido).

*   **Historial de Transacciones:**
    *   Diseño tipo "Estado de Cuenta Bancario".
    *   Muestra los últimos 10 movimientos.
    *   Iconos y colores distintivos para cada tipo de transacción (Depósito, Retiro, Pago, Desembolso).
    *   Corrección de etiquetas: Los retiros ahora se identifican correctamente como "RETIRO" y no "AHORRO".

*   **Operaciones de Caja:**
    *   Solicitud de Depósitos (con comprobante).
    *   Solicitud de Retiros (validado contra saldo disponible).
    *   Reporte de Pagos de Cuotas.

### 3.2 Módulo de Administración (Backend)
*   **Gestión de Solicitudes:** Aprobación/Rechazo de créditos, depósitos y retiros.
*   **Contabilidad:** Cálculo automático de moras, intereses y distribución de pagos.
*   **Usuarios:** Creación y gestión de perfiles de socios.
*   **Seguridad:** Hashing de contraseñas con bcrypt, protección de rutas con JWT.

---

## 4. Cambios Recientes y Mejoras (vs v1.0)
Esta sección detalla las discrepancias y evoluciones desde el plan original:

1.  **Refinamiento de UI/UX:**
    *   Se implementó un diseño visual inspirado en banca comercial ("Pichincha Style").
    *   Se optimizó el espacio en pantalla limitando listas largas (5 cuotas, 10 movimientos).

2.  **Correcciones de Lógica Crítica:**
    *   **Transacciones:** Se solucionó un bug donde los retiros se etiquetaban como depósitos en el historial.
    *   **Sesiones:** Se identificó y documentó el comportamiento de `localStorage` en entornos de desarrollo compartidos (cambio de usuario al recargar).
    *   **Flujo de Solicitud:** Se corrigió el error `null` en el formulario de crédito y se conectó el simulador con la solicitud real.

3.  **Base de Datos:**
    *   Eliminación del concepto obsoleto de tabla `Usuario` separada; ahora todo se maneja en el modelo `Socio` para simplificar la autenticación.
    *   Ajustes en los tipos de datos de `Transaccion` para soportar explícitamente `DEPOSITO` y `RETIRO`.

---

## 5. Requisitos para Despliegue (Deploy)
Para llevar el sistema a producción (Hostinger Cloud Startup), se deben considerar:

### 5.1 Variables de Entorno (.env)
*   `DATABASE_URL`: String de conexión a PostgreSQL producción.
*   `JWT_SECRET`: Clave segura para tokens.
*   `PORT`: Puerto de escucha (generalmente 3000 o definido por el host).
*   `NODE_ENV`: Debe establecerse en `production`.

### 5.2 Scripts de Build
*   Backend requiere transpilación de TypeScript a JavaScript (`npm run build`).
*   Los archivos estáticos del Frontend deben ser servidos por el backend o un servidor web (Nginx/Apache).

### 5.3 Base de Datos
*   Ejecutar migraciones de Prisma en producción (`npx prisma migrate deploy`).
*   Sembrado inicial de datos (Admin user) si es una instalación limpia.

---

## 6. Próximos Pasos Inmediatos
1.  **Preparación de Repositorio:** Limpieza de logs, archivos temporales y configuración de `.gitignore`.
2.  **Configuración de CI/CD (Opcional):** O subir manualmente a GitHub.
3.  **Configuración de Hostinger:**
    *   Crear base de datos PostgreSQL.
    *   Configurar entorno Node.js.
    *   Desplegar código y conectar variables.

Este documento reemplaza a todas las versiones anteriores y debe ser considerado la **Fuente de Verdad** actual del proyecto.
