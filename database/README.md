# 🗄️ Sistema MLF - Base de Datos PostgreSQL

## 📋 Tabla de Contenidos
- [Resumen](#resumen)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Estructura de Tablas](#estructura-de-tablas)
- [Reglas de Negocio Implementadas](#reglas-de-negocio-implementadas)
- [Triggers y Validaciones](#triggers-y-validaciones)
- [Datos de Prueba](#datos-de-prueba)
- [Mantenimiento](#mantenimiento)

---

## 📊 Resumen

La base de datos del Sistema MLF (My Libertad Financiera) está diseñada para soportar una cooperativa de ahorro y crédito con las siguientes características principales:

- **18 tablas** organizadas en 5 módulos funcionales
- **50+ reglas de negocio** implementadas mediante constraints y triggers
- **Sistema de 3 etapas progresivas** para socios (Iniciante → Regular → Especial)
- **Garantías cruzadas** entre socios
- **Seguro de desgravamen** obligatorio (1%)
- **Distribución semestral** de utilidades (1%)
- **Control de morosidad** con castigos automáticos
- **Auditoría completa** de todas las operaciones

---

## 🏗️ Arquitectura

### Módulos del Sistema

```
📦 BASE DE DATOS MLF
├── 👥 Módulo Socios (2 tablas)
│   ├── socios
│   └── recomendaciones
│
├── 💰 Módulo Créditos (4 tablas)
│   ├── creditos
│   ├── cuotas
│   ├── pagos
│   └── moras
│
├── 🔒 Módulo Garantías (2 tablas)
│   ├── garantias
│   └── liberaciones_garantia
│
├── 📊 Módulo Financiero (5 tablas)
│   ├── transacciones
│   ├── utilidades
│   ├── utilidades_detalle
│   ├── fondo_seguro
│   └── comprobantes
│
└── ⚙️ Módulo Sistema (6 tablas)
    ├── configuraciones
    ├── notificaciones
    ├── auditoria
    ├── sesiones
    ├── cambios_documento
    └── dashboard_metricas
```

### Diagrama Entidad-Relación (Principales)

```
┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│   SOCIOS    │ 1     N  │   CREDITOS   │ 1     N  │   CUOTAS    │
│             │──────────│              │──────────│             │
│ - codigo    │          │ - codigo     │          │ - numero    │
│ - etapa     │          │ - monto      │          │ - monto     │
│ - ahorros   │          │ - tasa       │          │ - fecha     │
└─────────────┘          └──────────────┘          └─────────────┘
       │                        │
       │ 1                      │ N
       │                        │
       │ N                      │ 1
       │                 ┌──────────────┐
       └─────────────────│   GARANTIAS  │
                         │              │
                         │ - monto      │
                         │ - congelado  │
                         └──────────────┘
```

---

## 🚀 Instalación

### Prerequisitos

- PostgreSQL 14 o superior
- Usuario con permisos de creación de base de datos

### Instalación Rápida

```bash
# 1. Crear base de datos
createdb -U postgres mlf_db

# 2. Ejecutar script maestro
psql -U postgres -d mlf_db -f 00_MASTER_SETUP.sql
```

### Instalación Manual (paso a paso)

```bash
# Conectarse a PostgreSQL
psql -U postgres -d mlf_db

# Ejecutar scripts en orden:
\i 01_schema_core.sql
\i 02_schema_financiero.sql
\i 03_schema_sistema.sql
\i 04_triggers_validaciones.sql
\i 05_seed_data.sql
```

### Verificación

```sql
-- Verificar cantidad de tablas
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Debe retornar: 18 tablas

-- Verificar triggers
SELECT COUNT(DISTINCT trigger_name) FROM information_schema.triggers
WHERE trigger_schema = 'public';
-- Debe retornar: 15+ triggers

-- Verificar datos de prueba
SELECT COUNT(*) FROM socios;
-- Debe retornar: 6 socios (2 admin/operador + 3 especiales + 1 iniciante)
```

---

## 📚 Estructura de Tablas

### 👥 MÓDULO SOCIOS

#### Tabla: `socios`
**Descripción:** Información completa de todos los socios del sistema

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | SERIAL | PK | Identificador único |
| codigo | VARCHAR(20) | UNIQUE, NOT NULL | Formato: SOC-YYYY-NNNN |
| nombre_completo | VARCHAR(200) | NOT NULL | Nombre y apellidos |
| documento_identidad | VARCHAR(10) | UNIQUE, NOT NULL | 10 dígitos numéricos |
| fecha_nacimiento | DATE | NOT NULL | Fecha de nacimiento |
| ahorro_actual | DECIMAL(12,2) | DEFAULT 0 | Saldo de ahorros |
| ahorro_congelado | DECIMAL(12,2) | DEFAULT 0 | Por garantías otorgadas |
| etapa_actual | INT | CHECK IN (1,2,3) | 1=Iniciante, 2=Regular, 3=Especial |
| creditos_etapa_actual | INT | DEFAULT 0 | Créditos consecutivos sin mora |
| estado | VARCHAR(20) | CHECK IN (...) | ACTIVO/INACTIVO/EXPULSADO |
| rol | VARCHAR(20) | DEFAULT 'SOCIO' | ADMIN/OPERADOR/SOCIO |

**Reglas implementadas:** RN-SOC-001 a RN-SOC-008

#### Tabla: `recomendaciones`
**Descripción:** Sistema de referidos (2 recomendadores por socio nuevo)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| socio_recomendado_id | INT | Nuevo socio |
| socio_recomendador_id | INT | Socio Especial que recomienda |

**Reglas implementadas:** RN-SOC-007

---

### 💰 MÓDULO CRÉDITOS

#### Tabla: `creditos`
**Descripción:** Todos los créditos otorgados a socios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| codigo | VARCHAR(20) | CRE-YYYY-NNNN |
| monto_solicitado | DECIMAL(12,2) | Monto que recibe el socio |
| prima_seguro | DECIMAL(12,2) | 1% obligatorio |
| monto_total | DECIMAL(12,2) | monto + prima (lo que debe devolver) |
| plazo_meses | INT | 6-60 meses |
| tasa_interes_mensual | DECIMAL(5,2) | 1.5% normal, 3% castigo |
| metodo_amortizacion | VARCHAR(20) | FRANCES/ALEMAN |
| saldo_capital | DECIMAL(12,2) | Capital pendiente |
| estado | VARCHAR(20) | SOLICITADO/APROBADO/ACTIVO/COMPLETADO/CASTIGADO |
| estado_mora | VARCHAR(30) | AL_DIA/MORA_LEVE/.../MORA_PERSISTENTE |
| dias_mora | INT | Días acumulados de mora |

**Reglas implementadas:** RN-CRE-001 a RN-CRE-010

#### Tabla: `cuotas`
**Descripción:** Tabla de amortización generada automáticamente

| Campo | Tipo | Descripción |
|-------|------|-------------|
| credito_id | INT | Referencia al crédito |
| numero_cuota | INT | Número de cuota (1, 2, 3...) |
| fecha_vencimiento | DATE | Fecha límite de pago |
| monto_cuota | DECIMAL(12,2) | Cuota mensual total |
| monto_capital | DECIMAL(12,2) | Porción de capital |
| monto_interes | DECIMAL(12,2) | Porción de interés |
| saldo_capital_despues | DECIMAL(12,2) | Saldo después de pagar |
| monto_pagado | DECIMAL(12,2) | Total pagado a esta cuota |
| estado | VARCHAR(20) | PENDIENTE/PAGADA/VENCIDA/ADELANTADO |
| interes_mora | DECIMAL(12,2) | 1% diario sobre cuota vencida |

**Reglas implementadas:** RN-CRE-010, RN-MOR-002

#### Tabla: `pagos`
**Descripción:** Registro detallado de todos los pagos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| codigo | VARCHAR(30) | PAG-CREXXXX-NNN |
| credito_id | INT | Crédito al que aplica |
| monto_pago | DECIMAL(12,2) | Monto total del pago |
| monto_a_mora | DECIMAL(12,2) | Aplicado a mora |
| monto_a_interes | DECIMAL(12,2) | Aplicado a intereses |
| monto_a_capital | DECIMAL(12,2) | Aplicado a capital |
| es_abono_capital | BOOLEAN | TRUE si excede cuota |
| tipo_abono | VARCHAR(20) | REDUCIR_PLAZO / REDUCIR_CUOTA |

**Reglas implementadas:** RN-PAG-001 a RN-PAG-007

---

### 🔒 MÓDULO GARANTÍAS

#### Tabla: `garantias`
**Descripción:** Garantías cruzadas entre socios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| codigo | VARCHAR(20) | GAR-YYYY-NNNN |
| credito_id | INT | Crédito garantizado |
| socio_garantizado_id | INT | Socio que recibe el crédito |
| socio_garante_id | INT | Socio Especial que garantiza |
| monto_garantizado | DECIMAL(12,2) | Monto del crédito |
| monto_congelado | DECIMAL(12,2) | 10% del crédito |
| estado | VARCHAR(20) | ACTIVA/LIBERADA/EJECUTADA |

**Reglas implementadas:** RN-GAR-001 a RN-GAR-008

---

### 📊 MÓDULO FINANCIERO

#### Tabla: `transacciones`
**Descripción:** Depósitos y retiros de ahorros

| Campo | Tipo | Descripción |
|-------|------|-------------|
| tipo | VARCHAR(20) | DEPOSITO / RETIRO |
| monto | DECIMAL(12,2) | Monto de la transacción |
| saldo_anterior | DECIMAL(12,2) | Saldo antes |
| saldo_nuevo | DECIMAL(12,2) | Saldo después |

**Reglas implementadas:** RN-AHO-001 a RN-AHO-005

#### Tabla: `utilidades`
**Descripción:** Distribución semestral de utilidades

| Campo | Tipo | Descripción |
|-------|------|-------------|
| codigo | VARCHAR(20) | UTI-YYYY-SEMN |
| año | INT | Año de distribución |
| semestre | INT | 1 o 2 |
| total_utilidades_distribuidas | DECIMAL(15,2) | Total distribuido |

**Reglas implementadas:** RN-UTI-001 a RN-UTI-004

#### Tabla: `fondo_seguro`
**Descripción:** Fondo de seguro de desgravamen

| Campo | Tipo | Descripción |
|-------|------|-------------|
| tipo | VARCHAR(20) | INGRESO_PRIMA / PAGO_COBERTURA / APORTE_PROYECTO |
| monto | DECIMAL(12,2) | Monto del movimiento |
| saldo_anterior | DECIMAL(15,2) | Balance anterior |
| saldo_nuevo | DECIMAL(15,2) | Balance nuevo |

**Reglas implementadas:** RN-SEG-001 a RN-SEG-005

---

### ⚙️ MÓDULO SISTEMA

#### Tabla: `configuraciones`
**Descripción:** Configuraciones del sistema con 3 niveles de seguridad

| Campo | Tipo | Descripción |
|-------|------|-------------|
| clave | VARCHAR(100) | Nombre de la configuración |
| valor | TEXT | Valor actual |
| tipo_dato | VARCHAR(20) | STRING/INTEGER/DECIMAL/BOOLEAN/JSON |
| nivel_seguridad | INT | 1=Admin, 2=Aprobación múltiple, 3=Backup antes |

**Configuraciones cargadas por defecto:**
- Tasas de interés (1.5%, 3%)
- Límites por etapa (125%-300%)
- Días de mora (15, 30, 60, 90)
- Prima de seguro (1%)
- Porcentaje congelado garantías (10%)

#### Tabla: `auditoria`
**Descripción:** Log completo de todas las acciones

| Campo | Tipo | Descripción |
|-------|------|-------------|
| usuario_id | INT | Usuario que realizó la acción |
| entidad | VARCHAR(50) | Tabla afectada |
| accion | VARCHAR(50) | CREAR/ACTUALIZAR/ELIMINAR/etc |
| datos_anteriores | JSONB | Estado antes del cambio |
| datos_nuevos | JSONB | Estado después del cambio |
| fecha_accion | TIMESTAMP | Timestamp de la acción |

---

## 🔐 Reglas de Negocio Implementadas

### Sistema de Etapas (RN-ETA-XXX)

```sql
-- Progresión automática de etapas
-- Etapa 1 → 2: 3 créditos consecutivos sin mora
-- Etapa 2 → 3: 5 créditos consecutivos sin mora

-- Límites de crédito por etapa:
-- Etapa 1: 125%-200% del ahorro
-- Etapa 2: 200% del ahorro
-- Etapa 3: 300% del ahorro
```

### Garantías (RN-GAR-XXX)

```sql
-- Solo Socios Especiales (Etapa 3) pueden garantizar
-- Máximo 3 garantizados por garante
-- Se congela 10% del monto del crédito
-- Liberación al 50% con comportamiento excelente
-- Ejecución automática al día 91 de mora
```

### Morosidad (RN-MOR-XXX)

```sql
-- Clasificación:
-- MORA_LEVE: 1-15 días
-- MORA_MODERADA: 16-30 días
-- MORA_GRAVE: 31-60 días
-- MORA_PERSISTENTE: 61-89 días
-- CASTIGADO: 90+ días

-- Interés de mora: 1% diario sobre cuota vencida
-- Castigo automático al día 90
-- Tasa cambia de 1.5% a 3% al castigar
```

---

## ⚡ Triggers y Validaciones

### Triggers Automáticos

1. **`trigger_generar_codigo_socio`**
   - Auto-genera código SOC-YYYY-NNNN

2. **`trigger_validar_recomendadores`**
   - Valida 2 recomendadores Etapa 3 ACTIVOS

3. **`trigger_validar_limite_credito`**
   - Valida límite basado en ahorro × multiplicador de etapa

4. **`trigger_bloquear_credito_con_mora`**
   - Bloquea nuevos créditos si tiene mora activa

5. **`trigger_actualizar_saldo_socio`**
   - Actualiza saldo al depositar/retirar
   - Valida ahorro disponible
   - Valida mínimo $10

6. **`trigger_validar_maximo_garantizados`**
   - Valida máximo 3 garantizados por garante

7. **`trigger_congelar_ahorro_garantia`**
   - Congela automáticamente 10% al crear garantía

8. **`trigger_liberar_ahorro_garantia`**
   - Libera automáticamente al cambiar estado

9. **`trigger_registrar_auditoria`**
   - Registra automáticamente todas las operaciones críticas

---

## 🧪 Datos de Prueba

### Usuarios del Sistema

| Usuario | Email | Rol | Contraseña (temporal) |
|---------|-------|-----|----------------------|
| admin | admin@mylf.com | ADMIN | Admin123! |
| operador | operador@mylf.com | OPERADOR | Operador123! |

### Socios de Prueba

| Código | Nombre | Etapa | Ahorros | Puede Recomendar |
|--------|--------|-------|---------|------------------|
| SOC-2025-0003 | Carlos Pérez | 3 | $5,000 | ✅ Sí |
| SOC-2025-0004 | María González | 3 | $8,000 | ✅ Sí |
| SOC-2025-0005 | Juan Rodríguez | 3 | $12,000 | ✅ Sí |
| SOC-2025-0006 | Ana Martínez | 1 | $500 | ❌ No |

---

## 🛠️ Mantenimiento

### Backups Recomendados

```bash
# Backup completo
pg_dump -U postgres mlf_db > backup_mlf_$(date +%Y%m%d).sql

# Backup solo esquema
pg_dump -U postgres -s mlf_db > backup_schema_mlf.sql

# Backup solo datos
pg_dump -U postgres -a mlf_db > backup_data_mlf.sql
```

### Limpieza de Datos de Prueba

```sql
-- SOLO EJECUTAR EN PRODUCCIÓN - Elimina datos de prueba
DELETE FROM recomendaciones WHERE socio_recomendado_id > 2;
DELETE FROM transacciones WHERE socio_id > 2;
DELETE FROM socios WHERE id > 2;
```

### Consultas Útiles de Mantenimiento

```sql
-- Ver tamaño de tablas
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver triggers activos
SELECT
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Ver índices
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 📞 Soporte

Para dudas sobre el esquema de base de datos:
1. Revisar el Documento Maestro MLF v1.0
2. Revisar comentarios en los archivos SQL
3. Consultar este README

---

## 📄 Licencia

Sistema MLF - My Libertad Financiera v1.0
Confidencial - Uso interno exclusivo

---

**Última actualización:** Noviembre 2025
**Versión de BD:** 1.0
**Compatible con:** PostgreSQL 14+
