# 🌐 MLF - Frontend Web Application

Interfaz web para el Sistema My Libertad Financiera.

## 📁 Estructura del Proyecto

```
frontend/
├── index.html              # Página de login
├── css/
│   └── styles.css         # Estilos globales
├── js/
│   ├── api.js             # Cliente API
│   ├── socios.js          # Módulo de socios
│   ├── creditos.js        # Módulo de créditos
│   └── pagos.js           # Módulo de pagos
└── pages/
    └── dashboard.html     # Dashboard principal
```

## 🚀 Cómo Usar

### 1. Asegúrate que el Backend esté corriendo

```bash
cd C:\CLAUDEMLF\backend
npm run dev
```

El backend debe estar corriendo en http://localhost:3000

### 2. Abrir la Aplicación Web

Simplemente abre el archivo `index.html` en tu navegador:

```bash
# Opción 1: Doble clic en el archivo
C:\CLAUDEMLF\frontend\index.html

# Opción 2: Desde línea de comandos
start C:\CLAUDEMLF\frontend\index.html
```

### 3. Iniciar Sesión

**Credenciales de prueba:**
- Usuario: `admin`
- Contraseña: `admin123`

## ✨ Funcionalidades

### Dashboard Principal
- Estadísticas en tiempo real
  - Total de socios activos
  - Créditos activos
  - Total de ahorros
  - Capital prestado
- Navegación intuitiva por módulos

### Módulo de Socios
- ✅ Ver lista de socios
- ✅ Buscar socios (por código, nombre, email)
- ✅ Ver detalle de socio
- ✅ Depositar ahorro
- ✅ Retirar ahorro
- ✅ Crear nuevo socio (ADMIN/TESORERO)
- ✅ Ver historial de transacciones

### Módulo de Créditos
- ✅ Ver lista de créditos
- ✅ Filtrar por estado
- ✅ Buscar créditos
- ✅ Ver detalle de crédito con cuotas
- ✅ Solicitar nuevo crédito
- ✅ Aprobar crédito (ADMIN/TESORERO)
- ✅ Desembolsar crédito (ADMIN/TESORERO)
- ✅ Ver tabla de amortización

### Módulo de Pagos
- ✅ Registrar pagos de cuotas
- ✅ Distribución automática (Mora → Interés → Capital)
- ✅ Ver información del crédito seleccionado
- ✅ Ver historial de pagos
- ✅ Resultado detallado del pago
- ✅ Notificación cuando se completa un crédito

## 🎨 Características de la Interfaz

### Diseño Responsivo
- Adaptable a diferentes tamaños de pantalla
- Grid system flexible
- Mobile-friendly

### Componentes UI
- Tarjetas (Cards)
- Tablas responsivas
- Formularios validados
- Modales dinámicos
- Badges de estado
- Alertas
- Botones con estados

### Navegación
- Sidebar fijo
- Topbar con título de página
- Navegación entre módulos sin recargar página
- Breadcrumbs visuales

## 🔐 Seguridad

- Autenticación con JWT
- Token almacenado en localStorage
- Verificación de autenticación en cada página
- Control de acceso por roles (ADMIN, TESORERO, SOCIO)
- Redirección automática si no está autenticado

## 🛠️ Tecnologías

- **HTML5** - Estructura
- **CSS3** - Estilos (Variables CSS, Flexbox, Grid)
- **JavaScript (Vanilla)** - Lógica de negocio
- **Fetch API** - Comunicación con backend
- **LocalStorage** - Almacenamiento de token

## 📊 Flujos de Trabajo

### Flujo: Depositar Ahorro
1. Ir a "Socios"
2. Buscar al socio
3. Clic en "Depositar"
4. Ingresar monto y método
5. Confirmar

### Flujo: Solicitar y Desembolsar Crédito
1. Ir a "Créditos"
2. Clic en "+ Solicitar Crédito"
3. Llenar formulario (socio, monto, plazo)
4. Enviar solicitud → Estado: SOLICITADO
5. En la lista, clic en "Aprobar" → Estado: APROBADO
6. Clic en "Desembolsar" → Estado: DESEMBOLSADO
7. Se generan cuotas automáticamente

### Flujo: Registrar Pago
1. Ir a "Pagos"
2. Seleccionar crédito activo
3. Ver información y próxima cuota
4. Ingresar monto a pagar
5. Registrar pago
6. Ver distribución automática
7. Si saldo = 0 → Crédito COMPLETADO

## 🐛 Solución de Problemas

### Error: "Failed to fetch"
**Problema:** El backend no está corriendo
**Solución:**
```bash
cd C:\CLAUDEMLF\backend
npm run dev
```

### Error: "Token inválido o expirado"
**Problema:** Sesión expirada
**Solución:** Cerrar sesión y volver a iniciar

### No se ven los datos
**Problema:** Base de datos vacía
**Solución:** Crear socios y créditos de prueba desde la interfaz

## 📝 Notas de Desarrollo

### Agregar Nuevo Módulo

1. Crear archivo JS en `/js/`
2. Agregar opción en sidebar del dashboard
3. Crear div de contenedor en dashboard.html
4. Implementar función `loadXxxPage()` en dashboard.html

### API Client

El archivo `api.js` contiene todos los métodos para interactuar con el backend:

```javascript
// Ejemplo de uso
const socios = await api.getSocios({ page: 1, limit: 10 });
const credito = await api.getCredito(123);
await api.registrarPago({ creditoId: 123, montoPagado: 50.00, ... });
```

## 🎯 Próximas Mejoras

- [ ] Reportes PDF
- [ ] Gráficas y estadísticas avanzadas
- [ ] Notificaciones en tiempo real
- [ ] Búsqueda avanzada con filtros
- [ ] Exportar a Excel
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)

## 📞 Soporte

Para problemas o preguntas, consulta la documentación del backend en:
- `C:\CLAUDEMLF\LEEME-PRIMERO.md`
- `C:\CLAUDEMLF\SISTEMA-FUNCIONAL-COMPLETO.md`

---

**Sistema MLF v1.0**
**Fecha:** 2025-11-09
**Estado:** Funcional ✅
