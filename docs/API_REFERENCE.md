# Sistema MLF - Referencia Completa de APIs

## Información General

**Base URL:** `http://localhost:3000/api/v1`
**Autenticación:** JWT Bearer Token
**Content-Type:** `application/json`

---

## 📋 Índice

1. [Autenticación](#autenticación)
2. [Gestión de Socios](#gestión-de-socios)
3. [Gestión de Créditos](#gestión-de-créditos)
4. [Sistema de Garantías](#sistema-de-garantías)
5. [Pagos y Morosidad](#pagos-y-morosidad)
6. [Utilidades](#utilidades)
7. [Casos Extremos](#casos-extremos)
8. [Notificaciones](#notificaciones)
9. [Dashboard de Rentabilidad](#dashboard-de-rentabilidad)

---

## 🔐 Autenticación

### 1. Login
```http
POST /api/v1/auth/login
```

**Request:**
```json
{
  "usuario": "admin@mlf.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "codigo": "SOC-2025-0001",
      "nombreCompleto": "Administrador Sistema",
      "email": "admin@mlf.com",
      "rol": "ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "24h"
  }
}
```

### 2. Registro (ADMIN)
```http
POST /api/v1/auth/register
Authorization: Bearer {token}
```

**Request:**
```json
{
  "email": "operador@mlf.com",
  "password": "SecurePass123!",
  "nombreCompleto": "Operador Sistema",
  "rol": "OPERADOR"
}
```

### 3. Refresh Token
```http
POST /api/v1/auth/refresh
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 4. Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

### 5. Cambiar Contraseña
```http
POST /api/v1/auth/change-password
Authorization: Bearer {token}
```

**Request:**
```json
{
  "passwordActual": "OldPass123",
  "passwordNueva": "NewPass456!"
}
```

---

## 👥 Gestión de Socios

### 1. Crear Socio
```http
POST /api/v1/socios
Authorization: Bearer {token}
Rol requerido: ADMIN, OPERADOR
```

**Request:**
```json
{
  "nombreCompleto": "Juan Pérez García",
  "documentoIdentidad": "1234567890",
  "fechaNacimiento": "1990-05-15",
  "genero": "MASCULINO",
  "direccion": "Av. Principal 123",
  "ciudad": "Quito",
  "provincia": "Pichincha",
  "telefono": "0987654321",
  "email": "juan.perez@email.com",
  "depositoInicial": 500.00,
  "recomendadores": [3, 5]
}
```

**Reglas:**
- RN-SOC-001: Cédula válida (10 dígitos)
- RN-SOC-002: Mayor de 18 años
- RN-SOC-005: Depósito mínimo $50
- RN-SOC-007: Requiere 2 recomendadores
- RN-SOC-008: Recomendadores deben ser Etapa 3 ACTIVOS

### 2. Listar Socios
```http
GET /api/v1/socios?page=1&limit=20&estado=ACTIVO&etapa=3&busqueda=Juan
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 20)
- `estado`: ACTIVO | SUSPENDIDO | INACTIVO
- `etapa`: 1 | 2 | 3
- `busqueda`: Buscar por nombre, código o cédula

### 3. Obtener Socio por ID
```http
GET /api/v1/socios/123
Authorization: Bearer {token}
```

### 4. Buscar por Código
```http
GET /api/v1/socios/codigo/SOC-2025-0123
Authorization: Bearer {token}
```

### 5. Actualizar Socio
```http
PUT /api/v1/socios/123
Authorization: Bearer {token}
```

**Request:**
```json
{
  "telefono": "0999888777",
  "email": "nuevo@email.com",
  "direccion": "Nueva Dirección 456"
}
```

### 6. Depositar Ahorro
```http
POST /api/v1/socios/123/depositar
Authorization: Bearer {token}
Rol requerido: ADMIN, OPERADOR
```

**Request:**
```json
{
  "monto": 200.00,
  "metodo": "EFECTIVO",
  "numeroReferencia": "DEP-12345",
  "concepto": "Ahorro mensual"
}
```

**Métodos de pago:** EFECTIVO | TRANSFERENCIA | DEPOSITO | OTRO

### 7. Retirar Ahorro
```http
POST /api/v1/socios/123/retirar
Authorization: Bearer {token}
Rol requerido: ADMIN, OPERADOR
```

**Request:**
```json
{
  "monto": 100.00,
  "metodo": "EFECTIVO",
  "concepto": "Retiro por emergencia"
}
```

**Reglas:**
- RN-AHO-002: Ahorro mínimo $10
- RN-AHO-003: No se puede retirar ahorro congelado

### 8. Cambiar Etapa (ADMIN)
```http
POST /api/v1/socios/123/cambiar-etapa
Authorization: Bearer {token}
Rol requerido: ADMIN
```

**Request:**
```json
{
  "nuevaEtapa": 2,
  "motivoAdministrativo": "Cambio manual por comportamiento ejemplar"
}
```

### 9. Suspender Socio (ADMIN)
```http
POST /api/v1/socios/123/suspender
Authorization: Bearer {token}
Rol requerido: ADMIN
```

**Request:**
```json
{
  "motivo": "Incumplimiento de políticas"
}
```

### 10. Reactivar Socio (ADMIN)
```http
POST /api/v1/socios/123/reactivar
Authorization: Bearer {token}
Rol requerido: ADMIN
```

---

## 💰 Gestión de Créditos

### 1. Solicitar Crédito
```http
POST /api/v1/creditos
Authorization: Bearer {token}
Rol requerido: ADMIN, OPERADOR
```

**Request:**
```json
{
  "socioId": 123,
  "montoSolicitado": 5000.00,
  "plazoMeses": 24,
  "metodoAmortizacion": "FRANCES",
  "proposito": "Capital de trabajo para negocio",
  "observaciones": "Socio con buen historial"
}
```

**Métodos de amortización:**
- `FRANCES`: Cuota fija (más común)
- `ALEMAN`: Capital fijo (cuota decreciente)

**Reglas:**
- RN-CRE-002: Límite según etapa y ahorro
  - Etapa 1: 125% - 200% del ahorro
  - Etapa 2: 200% del ahorro
  - Etapa 3: 300% del ahorro
- RN-CRE-003: No puede tener mora activa
- RN-CRE-005: Se agrega 1% de prima de seguro

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "codigo": "CRE-2025-0045",
    "socioId": 123,
    "montoSolicitado": 5000.00,
    "primaSeguro": 50.00,
    "montoTotal": 5050.00,
    "plazoMeses": 24,
    "estado": "SOLICITADO",
    "limiteDisponible": 6000.00
  }
}
```

### 2. Aprobar Crédito
```http
POST /api/v1/creditos/45/aprobar
Authorization: Bearer {token}
Rol requerido: ADMIN, OPERADOR
```

**Request:**
```json
{
  "observaciones": "Aprobado por comité de crédito"
}
```

### 3. Desembolsar Crédito
```http
POST /api/v1/creditos/45/desembolsar
Authorization: Bearer {token}
Rol requerido: ADMIN, OPERADOR
```

**Request:**
```json
{
  "tasaInteresAnual": 18.0,
  "fechaDesembolso": "2025-01-15",
  "observaciones": "Desembolsado vía transferencia"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "credito": {
      "id": 45,
      "codigo": "CRE-2025-0045",
      "estado": "ACTIVO",
      "saldoCapital": 5000.00
    },
    "tablaAmortizacion": {
      "resumen": {
        "montoTotal": 5000.00,
        "totalInteres": 967.84,
        "totalPagar": 5967.84,
        "cuotaMensual": 248.66
      },
      "cuotas": [
        {
          "numeroCuota": 1,
          "fechaVencimiento": "2025-02-15",
          "montoCuota": 248.66,
          "capital": 173.66,
          "interes": 75.00,
          "saldoRestante": 4826.34
        }
        // ... 23 cuotas más
      ]
    }
  }
}
```

### 4. Rechazar Crédito
```http
POST /api/v1/creditos/45/rechazar
Authorization: Bearer {token}
Rol requerido: ADMIN, OPERADOR
```

**Request:**
```json
{
  "motivoRechazo": "Capacidad de pago insuficiente"
}
```

### 5. Listar Créditos
```http
GET /api/v1/creditos?page=1&limit=20&estado=ACTIVO&socioId=123
Authorization: Bearer {token}
```

**Query Parameters:**
- `estado`: SOLICITADO | APROBADO | ACTIVO | COMPLETADO | CASTIGADO | RECHAZADO
- `socioId`: Filtrar por socio
- `metodoAmortizacion`: FRANCES | ALEMAN

### 6. Obtener Tabla de Amortización
```http
GET /api/v1/creditos/45/amortizacion
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resumen": {
      "creditoId": 45,
      "codigo": "CRE-2025-0045",
      "montoTotal": 5000.00,
      "plazoMeses": 24,
      "tasaInteresAnual": 18.0,
      "metodoAmortizacion": "FRANCES",
      "totalCuotas": 24,
      "cuotasPagadas": 5,
      "cuotasPendientes": 19
    },
    "totales": {
      "totalCapital": 5000.00,
      "totalInteres": 967.84,
      "totalPagar": 5967.84,
      "totalPagado": 1243.30
    },
    "cuotas": [ /* array de 24 cuotas */ ]
  }
}
```

### 7. Obtener Estado de Cuenta
```http
GET /api/v1/creditos/45/estado-cuenta
Authorization: Bearer {token}
```

---

## 🛡️ Sistema de Garantías

### 1. Crear Garantías
```http
POST /api/v1/garantias
Authorization: Bearer {token}
Rol requerido: ADMIN, OPERADOR
```

**Request:**
```json
{
  "creditoId": 45,
  "garantesIds": [78, 92]
}
```

**Reglas:**
- RN-GAR-002: Requiere exactamente 2 garantes
- RN-GAR-003: Solo Etapa 3 ACTIVOS pueden garantizar
- RN-GAR-004: Se congela 10% del monto en ahorro del garante
- RN-GAR-005: Máximo 3 garantizados por garante

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 89,
      "creditoId": 45,
      "garanteId": 78,
      "montoGarantizado": 5000.00,
      "montoCongelado": 500.00,
      "estado": "ACTIVA"
    },
    {
      "id": 90,
      "creditoId": 45,
      "garanteId": 92,
      "montoGarantizado": 5000.00,
      "montoCongelado": 500.00,
      "estado": "ACTIVA"
    }
  ]
}
```

### 2. Solicitar Liberación
```http
POST /api/v1/garantias/89/solicitar-liberacion
Authorization: Bearer {token}
```

**Request:**
```json
{
  "motivoSolicitud": "Crédito completado al 75% sin mora"
}
```

**Reglas:**
- RN-GAR-006: Requiere 50%+ del crédito completado
- Sin historial de mora
- Comportamiento de pago excelente

### 3. Aprobar Liberación
```http
POST /api/v1/garantias/liberaciones/12/aprobar
Authorization: Bearer {token}
Rol requerido: ADMIN, OPERADOR
```

**Request:**
```json
{
  "observaciones": "Aprobado por buen comportamiento"
}
```

### 4. Rechazar Liberación
```http
POST /api/v1/garantias/liberaciones/12/rechazar
Authorization: Bearer {token}
```

**Request:**
```json
{
  "motivoRechazo": "Aún no cumple el 50% del crédito"
}
```

### 5. Ejecutar Garantía (Mora 90+ días)
```http
POST /api/v1/garantias/89/ejecutar
Authorization: Bearer {token}
Rol requerido: ADMIN
```

**Request:**
```json
{
  "motivoEjecucion": "Crédito castigado - Mora 91 días"
}
```

**Regla RN-GAR-008:** Ejecución automática al día 91 de mora

---

## 💳 Pagos y Morosidad

### 1. Registrar Pago
```http
POST /api/v1/pagos
Authorization: Bearer {token}
Rol requerido: ADMIN, OPERADOR
```

**Request:**
```json
{
  "creditoId": 45,
  "montoPagado": 250.00,
  "metodoPago": "TRANSFERENCIA",
  "numeroReferencia": "TRF-001234",
  "concepto": "Pago cuota enero 2025",
  "fechaPago": "2025-01-15T10:30:00Z"
}
```

**Distribución automática (RN-PAG-001):**
1. Mora (si existe)
2. Intereses
3. Capital
4. Prepago (sobrante)

**Response:**
```json
{
  "success": true,
  "data": {
    "pago": {
      "id": 234,
      "creditoId": 45,
      "monto": 250.00,
      "montoCuota": 248.66,
      "montoMora": 0,
      "montoPrepago": 1.34
    },
    "distribucion": {
      "totalPagado": 250.00,
      "totalAplicadoCuotas": 248.66,
      "totalAplicadoMora": 0,
      "totalSobrante": 1.34,
      "cuotasActualizadas": [
        {
          "cuotaId": 156,
          "numeroCuota": 1,
          "montoAplicado": 248.66,
          "distribucion": {
            "aplicadoMora": 0,
            "aplicadoInteres": 75.00,
            "aplicadoCapital": 173.66
          }
        }
      ]
    }
  }
}
```

### 2. Estado de Pagos de Crédito
```http
GET /api/v1/pagos/credito/45
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "credito": {
      "id": 45,
      "codigo": "CRE-2025-0045",
      "estado": "ACTIVO",
      "montoTotal": 5000.00,
      "saldoCapital": 4826.34
    },
    "resumen": {
      "totalPagado": 248.66,
      "cuotasPagadas": 1,
      "cuotasPendientes": 23,
      "cuotasVencidas": 0,
      "totalMora": 0,
      "moraActiva": null
    },
    "cuotas": [ /* array de cuotas */ ],
    "pagos": [ /* array de pagos */ ]
  }
}
```

### 3. Actualizar Mora
```http
POST /api/v1/pagos/credito/45/actualizar-mora
Authorization: Bearer {token}
```

**Cálculo de mora (RN-MOR-001):**
- Tasa: 1% diario sobre monto adeudado
- Fórmula: `montoAdeudado × 0.01 × diasMora`

**Clasificación (RN-MOR-002):**
- 1-15 días: MORA_LEVE
- 16-30 días: MORA_MODERADA
- 31-60 días: MORA_GRAVE
- 61-89 días: MORA_PERSISTENTE
- 90+ días: CASTIGADO

---

## 📊 Utilidades

### 1. Calcular Utilidades Semestrales
```http
POST /api/v1/utilidades/calcular
Authorization: Bearer {token}
Rol requerido: ADMIN
```

**Request:**
```json
{
  "año": 2025,
  "semestre": 1
}
```

**Períodos:**
- Semestre 1: Enero - Junio (distribuye en Julio)
- Semestre 2: Julio - Diciembre (distribuye en Enero)

**Reglas:**
- RN-UTI-002: 1% sobre ahorro promedio del semestre
- RN-UTI-003: Solo socios ACTIVOS participan
- Ahorro promedio = Suma de saldos al final de cada mes / 6

**Response:**
```json
{
  "success": true,
  "data": {
    "codigo": "UTI-2025-SEM1",
    "periodo": "2025-S1",
    "totalSocios": 45,
    "totalAhorrosPromedio": 125000.00,
    "totalUtilidades": 1250.00,
    "estado": "CALCULADA",
    "detalles": [
      {
        "socioId": 123,
        "nombreCompleto": "Juan Pérez",
        "ahorroPromedioSemestre": 3500.00,
        "montoUtilidad": 35.00,
        "etapa": 2
      }
      // ... más socios
    ]
  }
}
```

### 2. Distribuir Utilidades
```http
POST /api/v1/utilidades/67/distribuir
Authorization: Bearer {token}
Rol requerido: ADMIN
```

**Acción (RN-UTI-004):**
- Acredita utilidades automáticamente al ahorro de cada socio
- Genera transacciones individuales
- Marca como COMPLETADA

**Response:**
```json
{
  "success": true,
  "data": {
    "utilidadId": 67,
    "codigo": "UTI-2025-SEM1",
    "acreditados": 45,
    "montoTotalAcreditado": 1250.00
  }
}
```

### 3. Listar Utilidades
```http
GET /api/v1/utilidades?año=2025&semestre=1&estado=COMPLETADA
Authorization: Bearer {token}
```

### 4. Obtener Utilidad por ID
```http
GET /api/v1/utilidades/67
Authorization: Bearer {token}
```

### 5. Historial de Utilidades de Socio
```http
GET /api/v1/utilidades/socio/123/historial
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "socio": {
      "id": 123,
      "codigo": "SOC-2025-0123",
      "nombreCompleto": "Juan Pérez"
    },
    "totalPeriodos": 6,
    "totalRecibido": 210.50,
    "historial": [
      {
        "periodo": "2025-S1",
        "codigo": "UTI-2025-SEM1",
        "ahorroPromedio": 3500.00,
        "montoUtilidad": 35.00,
        "acreditada": true,
        "fechaAcreditacion": "2025-07-01T00:00:00Z"
      }
      // ... más períodos
    ]
  }
}
```

---

## 🔒 Autenticación y Autorización

### Headers Requeridos

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Roles y Permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **ADMIN** | Administrador del sistema | Acceso completo a todas las operaciones |
| **OPERADOR** | Operador de créditos | Gestión de socios, créditos, garantías, pagos (no puede modificar usuarios ni configuraciones) |
| **SOCIO** | Socio del sistema | Solo lectura de su propia información |

### Códigos de Error HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Error en validación de datos
- `401 Unauthorized`: Token inválido o expirado
- `403 Forbidden`: Rol insuficiente
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto de negocio (ej: mora activa)
- `500 Internal Server Error`: Error del servidor

---

## 📝 Formato de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "data": { /* ... datos ... */ },
  "message": "Operación exitosa"
}
```

### Respuesta con Paginación
```json
{
  "success": true,
  "data": [ /* ... array de elementos ... */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Respuesta de Error
```json
{
  "error": {
    "message": "No se puede solicitar crédito con mora activa (RN-CRE-003)",
    "code": "MORA_ACTIVA_ERROR"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## 🧪 Ejemplos de Uso

### Flujo Completo: Crear Socio → Crédito → Pago

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin@mlf.com","password":"password123"}'

# Guardar token en variable
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# 2. Crear Socio
curl -X POST http://localhost:3000/api/v1/socios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombreCompleto": "María González",
    "documentoIdentidad": "1723456789",
    "fechaNacimiento": "1988-03-20",
    "depositoInicial": 1000.00,
    "recomendadores": [3, 5],
    ...
  }'

# 3. Solicitar Crédito
curl -X POST http://localhost:3000/api/v1/creditos \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "socioId": 150,
    "montoSolicitado": 2000.00,
    "plazoMeses": 12,
    "metodoAmortizacion": "FRANCES"
  }'

# 4. Aprobar Crédito
curl -X POST http://localhost:3000/api/v1/creditos/89/aprobar \
  -H "Authorization: Bearer $TOKEN"

# 5. Asignar Garantías
curl -X POST http://localhost:3000/api/v1/garantias \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"creditoId": 89, "garantesIds": [10, 15]}'

# 6. Desembolsar
curl -X POST http://localhost:3000/api/v1/creditos/89/desembolsar \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tasaInteresAnual": 18.0}'

# 7. Registrar Pago
curl -X POST http://localhost:3000/api/v1/pagos \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "creditoId": 89,
    "montoPagado": 180.00,
    "metodoPago": "TRANSFERENCIA"
  }'
```

---

## 📚 Reglas de Negocio Clave

### Socios
- **RN-SOC-001 a RN-SOC-008:** Validaciones de creación
- **RN-ETA-004:** Límites de crédito según etapa

### Créditos
- **RN-CRE-002:** Límites progresivos por etapa
- **RN-CRE-003:** Bloqueo con mora activa
- **RN-CRE-005:** Prima de seguro 1%

### Garantías
- **RN-GAR-002:** 2 garantes obligatorios
- **RN-GAR-004:** Congelación 10% del monto
- **RN-GAR-008:** Ejecución automática día 91

### Pagos
- **RN-PAG-001:** Distribución Mora → Interés → Capital

### Morosidad
- **RN-MOR-001:** 1% diario
- **RN-MOR-002:** 5 niveles de clasificación
- **RN-MOR-003:** Castigo automático día 90

### Utilidades
- **RN-UTI-002:** 1% sobre ahorro promedio
- **RN-UTI-003:** Solo ACTIVOS participan

---

## 🚨 Casos Extremos

### 1. Procesar Fallecimiento de Deudor
```http
POST /api/v1/casos-extremos/fallecimiento-deudor
Authorization: Bearer {token}
```

**Request:**
```json
{
  "socioId": 123,
  "creditoId": 45,
  "fechaFallecimiento": "2025-01-15",
  "certificadoDefuncion": "CERT-2025-001234",
  "observaciones": "Fallecimiento por causas naturales"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "socioId": 123,
    "creditoId": 45,
    "montoCubierto": 5000.00,
    "saldoRestante": 0,
    "garantiasEjecutadas": false,
    "estadoCredito": "COMPLETADO",
    "mensaje": "Seguro de vida aplicado exitosamente"
  },
  "message": "Fallecimiento procesado exitosamente. Seguro aplicado."
}
```

**Reglas:**
- Aplica seguro de vida (1% prima cobrada en desembolso)
- Si saldo > cobertura, ejecuta garantías proporcionalmente
- Suspende al socio automáticamente
- Notifica a garantes y familiares

---

### 2. Procesar Fallecimiento de Garante
```http
POST /api/v1/casos-extremos/fallecimiento-garante
Authorization: Bearer {token}
```

**Request:**
```json
{
  "garanteId": 78,
  "fechaFallecimiento": "2025-01-15",
  "certificadoDefuncion": "CERT-2025-001235",
  "observaciones": "Garante fallecido"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "garanteId": 78,
    "garantiasLiberadas": 3,
    "creditosAfectados": [45, 67, 89],
    "montoDescongelado": 1500.00,
    "requierenNuevosGarantes": true
  },
  "message": "Fallecimiento de garante procesado. Garantías liberadas."
}
```

**Reglas:**
- Libera todas las garantías del garante
- Descongela ahorro retenido
- Marca créditos que requieren nuevos garantes
- Notifica a deudores afectados

---

### 3. Detectar y Registrar Fraude
```http
POST /api/v1/casos-extremos/fraude
Authorization: Bearer {token}
```

**Request:**
```json
{
  "socioId": 123,
  "tipo": "DOCUMENTOS_FALSOS",
  "descripcion": "Cédula falsificada detectada en verificación",
  "evidencias": [
    "Documento escaneado: fraud_001.pdf",
    "Reporte policial: #2025-FR-001"
  ],
  "gravedad": "ALTA"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "socioId": 123,
    "tipo": "DOCUMENTOS_FALSOS",
    "gravedad": "ALTA",
    "socioSuspendido": true,
    "creditosSuspendidos": 2,
    "casoRegistrado": true,
    "numeroReferencia": "FRAUD-2025-001"
  },
  "message": "🚨 Fraude registrado. Socio suspendido automáticamente."
}
```

**Tipos de fraude:**
- `DOCUMENTOS_FALSOS`: Documentación falsificada
- `INFORMACION_FALSA`: Datos financieros falsos
- `SUPLANTACION`: Suplantación de identidad
- `GARANTIAS_FRAUDULENTAS`: Garantes inválidos
- `OTRO`: Otros tipos de fraude

**Gravedad:**
- `BAJA`: Fraude menor, revisión requerida
- `MEDIA`: Fraude moderado, suspensión temporal
- `ALTA`: Fraude grave, suspensión inmediata
- `CRITICA`: Fraude crítico, denuncia legal

---

### 4. Refinanciar Crédito
```http
POST /api/v1/casos-extremos/creditos/:id/refinanciar
Authorization: Bearer {token}
```

**Request:**
```json
{
  "nuevoPlazoMeses": 36,
  "nuevaTasaAnual": 15.0,
  "porcentajeQuita": 10.0,
  "motivoRefinanciacion": "Dificultades económicas temporales por pandemia",
  "requiereAprobacion": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "creditoId": 45,
    "creditoAnterior": {
      "saldoPendiente": 3000.00,
      "plazoOriginal": 24,
      "tasaOriginal": 18.0
    },
    "creditoRefinanciado": {
      "nuevoSaldo": 2700.00,
      "nuevoPlazo": 36,
      "nuevaTasa": 15.0,
      "quita": 300.00,
      "nuevaCuota": 93.32
    },
    "tablaAmortizacion": { /* Nueva tabla */ }
  },
  "message": "Crédito refinanciado exitosamente. Nueva tabla de amortización generada."
}
```

**Reglas:**
- Puede modificar plazo, tasa o ambos
- Opcionalmente aplica quita (condonación parcial)
- Genera nueva tabla de amortización
- Requiere aprobación de ADMIN por defecto
- Registra motivo y autorización

---

### 5. Condonar Deuda
```http
POST /api/v1/casos-extremos/condonar
Authorization: Bearer {token}
```

**Request:**
```json
{
  "creditoId": 45,
  "porcentajeCondonacion": 50.0,
  "motivo": "Catástrofe natural - Terremoto 2025",
  "autorizadoPor": "Directorio MLF - Acta #025-2025"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "creditoId": 45,
    "saldoAnterior": 5000.00,
    "montoCondonado": 2500.00,
    "nuevoSaldo": 2500.00,
    "porcentaje": 50.0,
    "motivo": "Catástrofe natural - Terremoto 2025",
    "autorizadoPor": "Directorio MLF - Acta #025-2025"
  },
  "message": "Deuda condonada exitosamente (50.0%)"
}
```

**Reglas:**
- Solo ADMIN puede ejecutar
- Porcentaje entre 0-100%
- Requiere motivo y autorización formal
- Registra auditoría completa
- Notifica al socio

---

### 6. Procesar Catástrofe Natural
```http
POST /api/v1/casos-extremos/catastrofe
Authorization: Bearer {token}
```

**Request:**
```json
{
  "tipo": "TERREMOTO",
  "descripcion": "Terremoto 7.8 - Zona costera afectada",
  "fechaEvento": "2025-01-15",
  "sociosAfectadosIds": [123, 145, 167, 189, 201],
  "mesesGracia": 6,
  "condonarIntereses": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tipo": "TERREMOTO",
    "sociosAfectados": 5,
    "creditosAfectados": 12,
    "mesesGracia": 6,
    "interesesCondonados": true,
    "fechaReanudacion": "2025-07-15",
    "casoRegistrado": "CATASTROFE-2025-001"
  },
  "message": "Catástrofe procesada. 5 socios beneficiados con 6 meses de gracia."
}
```

**Tipos de catástrofe:**
- `TERREMOTO`: Terremoto
- `INUNDACION`: Inundación
- `INCENDIO`: Incendio masivo
- `PANDEMIA`: Pandemia o crisis sanitaria
- `OTRO`: Otra catástrofe

**Reglas:**
- Suspende pagos por meses de gracia especificados
- Opcionalmente condona intereses del período
- No genera mora durante período de gracia
- Notifica a todos los socios afectados
- Registra evento para reportes

---

### 7. Historial de Casos Extremos
```http
GET /api/v1/casos-extremos/historial/:socioId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "socioId": 123,
    "casos": [
      {
        "id": 1,
        "tipo": "REFINANCIACION",
        "creditoId": 45,
        "fecha": "2024-06-15T10:30:00Z",
        "detalle": "Refinanciación por dificultades económicas",
        "montoAfectado": 5000.00
      },
      {
        "id": 2,
        "tipo": "CONDONACION",
        "creditoId": 67,
        "fecha": "2025-01-15T14:00:00Z",
        "detalle": "Condonación 20% por catástrofe natural",
        "montoAfectado": 1000.00
      }
    ],
    "totalCasos": 2
  },
  "message": "Historial de casos extremos obtenido exitosamente"
}
```

---

## 🔔 Notificaciones

### 1. Enviar Notificación Manual
```http
POST /api/v1/notificaciones
Authorization: Bearer {token}
```

**Request:**
```json
{
  "socioId": 123,
  "tipo": "RECORDATORIO_CUOTA",
  "canal": ["EMAIL", "SMS"],
  "prioridad": "ALTA",
  "datos": {
    "numeroCuota": 5,
    "montoCuota": 250.00,
    "fechaVencimiento": "2025-01-20"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificacionId": 456,
    "socioId": 123,
    "tipo": "RECORDATORIO_CUOTA",
    "canalesEnviados": ["EMAIL", "SMS"],
    "estadoEnvio": {
      "EMAIL": "ENVIADO",
      "SMS": "ENVIADO"
    },
    "fechaEnvio": "2025-01-17T09:00:00Z"
  },
  "message": "Notificación enviada exitosamente por EMAIL, SMS"
}
```

**Tipos de notificación:**
- `SOCIO_NUEVO`: Bienvenida a nuevo socio
- `CREDITO_APROBADO`: Crédito aprobado
- `CREDITO_RECHAZADO`: Crédito rechazado
- `CREDITO_DESEMBOLSADO`: Crédito desembolsado
- `CUOTA_PROXIMA_VENCER`: Cuota próxima a vencer (3 días)
- `CUOTA_VENCIDA`: Cuota vencida
- `MORA_LEVE`: Mora leve (1-15 días)
- `MORA_GRAVE`: Mora grave (31+ días)
- `GARANTIA_EJECUTADA`: Garantía ejecutada
- `UTILIDADES_ACREDITADAS`: Utilidades acreditadas
- `AHORRO_DEPOSITADO`: Depósito de ahorro
- `AHORRO_RETIRADO`: Retiro de ahorro
- `FRAUDE_DETECTADO`: Fraude detectado
- `CATASTROFE_REGISTRADA`: Catástrofe registrada

**Canales:**
- `EMAIL`: Correo electrónico
- `SMS`: Mensaje de texto
- `IN_APP`: Notificación in-app
- `PUSH`: Notificación push

**Prioridades:**
- `BAJA`: Informativa
- `MEDIA`: Recordatorio estándar
- `ALTA`: Acción requerida
- `URGENTE`: Crítica, requiere atención inmediata

---

### 2. Listar Notificaciones de Socio
```http
GET /api/v1/notificaciones/socio/:socioId?soloNoLeidas=true&tipo=RECORDATORIO_CUOTA
Authorization: Bearer {token}
```

**Query params:**
- `soloNoLeidas` (boolean): Solo no leídas
- `tipo` (string): Filtrar por tipo
- `fechaDesde` (date): Desde fecha
- `fechaHasta` (date): Hasta fecha

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "tipo": "RECORDATORIO_CUOTA",
      "asunto": "⏰ Recordatorio: Cuota próxima a vencer",
      "mensaje": "Hola Juan, tu cuota #5 vence en 3 días...",
      "canales": ["EMAIL", "SMS"],
      "prioridad": "ALTA",
      "leida": false,
      "fechaEnvio": "2025-01-17T09:00:00Z"
    }
  ],
  "message": "1 notificaciones encontradas"
}
```

---

### 3. Marcar Notificación como Leída
```http
PATCH /api/v1/notificaciones/:id/leida
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "leida": true,
    "fechaLeida": "2025-01-17T15:30:00Z"
  },
  "message": "Notificación marcada como leída"
}
```

---

### 4. Enviar Recordatorios Automáticos
```http
POST /api/v1/notificaciones/recordatorios/cuotas
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ejecutado": true,
    "recordatoriosEnviados": 25,
    "cuotasProximasVencer": 15,
    "cuotasVencidas": 10,
    "fechaEjecucion": "2025-01-17T08:00:00Z"
  },
  "message": "Recordatorios de cuotas enviados exitosamente"
}
```

**Uso:**
- Ejecutar diariamente via cron job (8:00 AM)
- Envía recordatorio 3 días antes de vencimiento
- Envía alerta diaria para cuotas vencidas

---

### 5. Estadísticas de Notificaciones
```http
GET /api/v1/notificaciones/estadisticas?fechaDesde=2025-01-01&fechaHasta=2025-01-31
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "desde": "2025-01-01",
      "hasta": "2025-01-31"
    },
    "totalEnviadas": 1250,
    "porCanal": {
      "EMAIL": 850,
      "SMS": 650,
      "IN_APP": 1200,
      "PUSH": 400
    },
    "porTipo": {
      "RECORDATORIO_CUOTA": 450,
      "CUOTA_VENCIDA": 200,
      "CREDITO_APROBADO": 150,
      "UTILIDADES_ACREDITADAS": 100,
      "OTROS": 350
    },
    "tasaLectura": {
      "EMAIL": 75.5,
      "IN_APP": 92.3,
      "promedio": 83.9
    },
    "errorEnvio": 15
  },
  "message": "Estadísticas obtenidas exitosamente"
}
```

---

### 6. Enviar Notificación de Bienvenida
```http
POST /api/v1/notificaciones/bienvenida
Authorization: Bearer {token}
```

**Request:**
```json
{
  "socioId": 123
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificacionId": 789,
    "socioId": 123,
    "canalesEnviados": ["EMAIL", "SMS"]
  },
  "message": "Notificación de bienvenida enviada"
}
```

---

### 7. Enviar Alerta de Mora
```http
POST /api/v1/notificaciones/alerta-mora
Authorization: Bearer {token}
```

**Request:**
```json
{
  "creditoId": 45
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enviado": true,
    "creditoId": 45,
    "diasMora": 10,
    "clasificacion": "MORA_LEVE"
  },
  "message": "Alerta de mora enviada exitosamente"
}
```

---

## 📊 Dashboard de Rentabilidad

### 1. Dashboard Completo
```http
GET /api/v1/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resumen": {
      "socios": {
        "total": 150,
        "activos": 120,
        "suspendidos": 5,
        "inactivos": 25,
        "nuevosEsteMes": 8
      },
      "creditos": {
        "total": 85,
        "activos": 60,
        "completados": 20,
        "castigados": 5,
        "montoTotal": 425000.00,
        "montoDesembolsado": 400000.00,
        "saldoPendiente": 250000.00
      },
      "ahorros": {
        "totalAhorrado": 180000.00,
        "totalCongelado": 5000.00,
        "ahorroPromedio": 1200.00,
        "sociosConAhorro": 145
      },
      "garantias": {
        "activas": 50,
        "ejecutadas": 2,
        "liberadas": 15,
        "montoCongelado": 5000.00
      }
    },
    "cartera": { /* Ver endpoint /cartera */ },
    "rentabilidad": { /* Ver endpoint /rentabilidad */ },
    "indicadores": { /* Ver endpoint /riesgo */ },
    "proyecciones": { /* Ver endpoint /proyecciones */ },
    "fechaGeneracion": "2025-01-20T10:30:00Z"
  },
  "message": "Dashboard generado exitosamente"
}
```

---

### 2. Resumen General
```http
GET /api/v1/dashboard/resumen
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "socios": {
      "total": 150,
      "activos": 120,
      "suspendidos": 5,
      "inactivos": 25,
      "nuevosEsteMes": 8
    },
    "creditos": {
      "total": 85,
      "activos": 60,
      "completados": 20,
      "castigados": 5,
      "montoTotal": 425000.00,
      "montoDesembolsado": 400000.00,
      "saldoPendiente": 250000.00
    },
    "ahorros": {
      "totalAhorrado": 180000.00,
      "totalCongelado": 5000.00,
      "ahorroPromedio": 1200.00,
      "sociosConAhorro": 145
    },
    "garantias": {
      "activas": 50,
      "ejecutadas": 2,
      "liberadas": 15,
      "montoCongelado": 5000.00
    }
  },
  "message": "Resumen general obtenido exitosamente"
}
```

---

### 3. Cartera de Créditos
```http
GET /api/v1/dashboard/cartera
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "carteraActiva": {
      "montoTotal": 250000.00,
      "cantidadCreditos": 60,
      "promedioMonto": 4166.67
    },
    "carteraVencida": {
      "montoTotal": 15000.00,
      "cantidadCreditos": 5,
      "porcentajeCartera": 6.0
    },
    "clasificacionMora": {
      "alDia": { "cantidad": 45, "monto": 200000.00 },
      "moraLeve": { "cantidad": 8, "monto": 25000.00 },
      "moraModerarda": { "cantidad": 4, "monto": 12000.00 },
      "moraGrave": { "cantidad": 2, "monto": 8000.00 },
      "moraPersistente": { "cantidad": 1, "monto": 5000.00 },
      "castigado": { "cantidad": 0, "monto": 0 }
    },
    "porEtapa": {
      "etapa1": { "cantidad": 20, "monto": 60000.00 },
      "etapa2": { "cantidad": 25, "monto": 120000.00 },
      "etapa3": { "cantidad": 15, "monto": 70000.00 }
    }
  },
  "message": "Cartera de créditos obtenida exitosamente"
}
```

**Clasificación de mora:**
- **Al día**: Sin cuotas vencidas
- **Mora Leve**: 1-15 días
- **Mora Moderada**: 16-30 días
- **Mora Grave**: 31-60 días
- **Mora Persistente**: 61-89 días
- **Castigado**: 90+ días

---

### 4. Rentabilidad
```http
GET /api/v1/dashboard/rentabilidad
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ingresos": {
      "interesesCobrados": 45000.00,
      "morasCobradas": 3500.00,
      "primasSeguro": 4000.00,
      "total": 52500.00
    },
    "egresos": {
      "utilidadesDistribuidas": 2000.00,
      "fondoSeguroUtilizado": 5000.00,
      "gastosOperativos": 0,
      "total": 7000.00
    },
    "utilidadNeta": 45500.00,
    "margenRentabilidad": 86.67,
    "roi": 25.28
  },
  "message": "Rentabilidad calculada exitosamente"
}
```

**Indicadores:**
- **Utilidad Neta**: Ingresos - Egresos
- **Margen de Rentabilidad**: (Utilidad / Ingresos) × 100
- **ROI**: (Utilidad / Capital Base) × 100

---

### 5. Indicadores de Riesgo
```http
GET /api/v1/dashboard/riesgo
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tasaMorosidad": 6.0,
    "indiceCarteraRiesgo": 5.2,
    "provisionRequerida": 650.00,
    "creditosProblema": 3,
    "garantiasInsuficientes": 1,
    "alertas": [
      "⚠️ Tasa de morosidad alta: 6.0%",
      "⚠️ 1 garantías requieren revisión"
    ]
  },
  "message": "Indicadores de riesgo calculados exitosamente"
}
```

**Indicadores:**
- **Tasa de Morosidad**: (Cartera Vencida / Cartera Total) × 100
- **Índice de Cartera en Riesgo**: (Cartera Mora > 30 días / Cartera Total) × 100
- **Provisión Requerida**: 5% cartera en riesgo + 100% castigados
- **Créditos Problema**: Mora > 60 días
- **Garantías Insuficientes**: Garantías activas con mora > 60 días

**Alertas automáticas:**
- ⚠️ Tasa de morosidad > 5%
- 🚨 Créditos castigados detectados
- ⚠️ Garantías que requieren revisión
- 📉 Más de 10 créditos en situación crítica

---

### 6. Proyecciones
```http
GET /api/v1/dashboard/proyecciones
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "proximosMeses": [
      {
        "mes": "2025-02",
        "ingresoProyectado": 18000.00,
        "egresoProyectado": 2000.00,
        "utilidadProyectada": 16000.00
      },
      {
        "mes": "2025-03",
        "ingresoProyectado": 17500.00,
        "egresoProyectado": 1800.00,
        "utilidadProyectada": 15700.00
      },
      {
        "mes": "2025-04",
        "ingresoProyectado": 19000.00,
        "egresoProyectado": 2100.00,
        "utilidadProyectada": 16900.00
      }
    ],
    "metasVsReales": {
      "metaIngresos": 20000.00,
      "realIngresos": 18500.00,
      "cumplimiento": 92.5
    }
  },
  "message": "Proyecciones generadas exitosamente"
}
```

**Cálculos:**
- **Ingresos Proyectados**: Suma de intereses de cuotas pendientes por mes
- **Meta Ingresos**: 5% sobre cartera activa mensual
- **Cumplimiento**: (Real / Meta) × 100

---

### 7. Métricas por Período
```http
GET /api/v1/dashboard/metricas-periodo?fechaInicio=2025-01-01&fechaFin=2025-01-31
Authorization: Bearer {token}
```

**Query Parameters:**
- `fechaInicio` (required): Fecha inicio (YYYY-MM-DD)
- `fechaFin` (required): Fecha fin (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "fechaInicio": "2025-01-01",
      "fechaFin": "2025-01-31"
    },
    "totalPagos": 45000.00,
    "cantidadPagos": 120,
    "creditosDesembolsados": 15,
    "nuevosSocios": 8
  },
  "message": "Métricas por período obtenidas exitosamente"
}
```

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 3. Configurar base de datos
cd ../database
psql -U postgres -f 00_MASTER_SETUP.sql

# 4. Generar Prisma Client
cd ../backend
npx prisma generate

# 5. Iniciar servidor
npm run dev
```

**Servidor corriendo en:** `http://localhost:3000`

---

**Documentación generada para:** Sistema MLF v1.0
**Fecha:** 2025-01-15
**Contacto:** support@mlf.com
