# 🔄 Guía: Testing → Producción

## Índice
1. [Conceptos Clave](#conceptos-clave)
2. [Flujo de Trabajo](#flujo-de-trabajo)
3. [Fase de Testing](#fase-de-testing)
4. [Migración a Producción](#migración-a-producción)
5. [Scripts Disponibles](#scripts-disponibles)
6. [Troubleshooting](#troubleshooting)

---

## 📚 Conceptos Clave

### ¿Qué es Seed Data?
**Seed Data** son datos de prueba realistas que te permiten:
- Probar todas las funcionalidades del sistema
- Hacer demos a usuarios
- Entrenar al personal
- Detectar bugs antes de producción

### ¿Qué es un Reset de Base de Datos?
Es el proceso de **limpiar completamente** todos los datos de prueba y dejar la base lista para comenzar con datos reales de producción.

### ¿Por qué es importante?
Si no limpias correctamente, puedes tener:
- ❌ Datos de prueba mezclados con datos reales
- ❌ IDs y códigos desordenados
- ❌ Información inconsistente
- ❌ Problemas de auditoría y cumplimiento

---

## 🔄 Flujo de Trabajo

```
┌─────────────────────────────────────────────────────────┐
│                    DESARROLLO                            │
│  • Crear base de datos inicial                          │
│  • Cargar estructura (00_MASTER_SETUP.sql)              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                 TESTING (2-4 semanas)                    │
│  • Cargar datos de prueba (99_SEED_DATA.sql)            │
│  • Probar todas las funcionalidades                     │
│  • Hacer modificaciones, crear, editar, eliminar        │
│  • Training del personal                                │
│  • Detectar y corregir bugs                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│            PREPARACIÓN PARA PRODUCCIÓN                   │
│  • Ejecutar reset (98_RESET_DATABASE.sql)               │
│  • Verificar que TODO está limpio                       │
│  • Cambiar passwords de administradores                 │
│  • Hacer backup de base limpia                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                    PRODUCCIÓN                            │
│  • Comenzar a ingresar datos reales                     │
│  • ⚠️ NUNCA ejecutar reset en producción                │
│  • Hacer backups regulares                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Fase de Testing

### Paso 1: Configurar Base de Datos Inicial

```bash
# 1. Crear base de datos
cd database

# 2. Ejecutar setup maestro
psql -U postgres -f 00_MASTER_SETUP.sql

# Esto creará:
# ✅ Base de datos mlf_system
# ✅ Todas las tablas (18 tablas)
# ✅ Constraints y validaciones
# ✅ Triggers automáticos
# ✅ Índices optimizados
```

### Paso 2: Cargar Datos de Prueba

```bash
# Cargar seed data
psql -U postgres -d mlf_system -f 99_SEED_DATA.sql

# Esto creará:
# ✅ 16 socios de ejemplo (Etapas 1, 2 y 3)
# ✅ 4 créditos en diferentes estados
# ✅ Garantías activas
# ✅ Transacciones de ahorro
# ✅ Pagos registrados
# ✅ 2 usuarios (admin + operador)
```

### Paso 3: Verificar Datos Cargados

```sql
-- Conectar a la base
psql -U postgres -d mlf_system

-- Verificar socios
SELECT codigo, nombre_completo, etapa_actual, estado, ahorro_actual
FROM socios
ORDER BY id;

-- Verificar créditos
SELECT codigo, estado, monto_total, saldo_capital
FROM creditos
ORDER BY id;

-- Verificar usuarios
SELECT email, rol, activo FROM usuarios;
```

**Usuarios de prueba creados:**
- 📧 `admin@mlf.com` / 🔑 `password123` (ADMIN)
- 📧 `operador@mlf.com` / 🔑 `password123` (OPERADOR)

### Paso 4: Probar el Sistema

Durante 2-4 semanas, realiza todas las pruebas necesarias:

#### ✅ Checklist de Testing

**Módulo Socios:**
- [ ] Crear nuevo socio
- [ ] Validar cédula ecuatoriana
- [ ] Validar edad (mayor 18 años)
- [ ] Asignar recomendadores
- [ ] Depositar ahorro
- [ ] Retirar ahorro (validar congelamiento)
- [ ] Suspender socio
- [ ] Reactivar socio
- [ ] Cambiar de etapa

**Módulo Créditos:**
- [ ] Solicitar crédito
- [ ] Validar límites por etapa
- [ ] Aprobar crédito
- [ ] Rechazar crédito
- [ ] Asignar garantías (2 garantes Etapa 3)
- [ ] Desembolsar crédito
- [ ] Verificar tabla de amortización
- [ ] Verificar prima de seguro (1%)

**Módulo Pagos:**
- [ ] Registrar pago de cuota
- [ ] Verificar distribución (Mora → Interés → Capital)
- [ ] Simular cuota vencida
- [ ] Calcular mora (1% diario)
- [ ] Verificar clasificación de mora (5 niveles)
- [ ] Completar crédito

**Módulo Garantías:**
- [ ] Crear garantías con congelamiento 10%
- [ ] Validar máximo 3 garantizados por garante
- [ ] Solicitar liberación (50%+ pagado, sin mora)
- [ ] Aprobar liberación
- [ ] Simular ejecución de garantía

**Módulo Utilidades:**
- [ ] Calcular utilidades semestrales
- [ ] Verificar 1% sobre ahorro promedio
- [ ] Distribuir solo a socios ACTIVOS
- [ ] Verificar acreditación automática

**Módulo Casos Extremos:**
- [ ] Procesar fallecimiento de deudor
- [ ] Verificar aplicación de seguro
- [ ] Procesar fallecimiento de garante
- [ ] Detectar fraude
- [ ] Refinanciar crédito
- [ ] Condonar deuda
- [ ] Procesar catástrofe natural

**Dashboard:**
- [ ] Ver resumen general
- [ ] Analizar cartera de créditos
- [ ] Verificar rentabilidad
- [ ] Revisar indicadores de riesgo
- [ ] Ver proyecciones

### Paso 5: Si Necesitas Limpiar Durante Testing

Si en la fase de testing cometes errores o quieres volver a empezar:

```bash
# 1. Limpiar todo
psql -U postgres -d mlf_system -f 98_RESET_DATABASE.sql

# 2. Recargar datos de prueba
psql -U postgres -d mlf_system -f 99_SEED_DATA.sql

# ✅ Listo! Base limpia con datos frescos
```

---

## 🚀 Migración a Producción

### ⚠️ IMPORTANTE: Checklist Pre-Producción

Antes de limpiar la base para producción, asegúrate de:

- [ ] ✅ Todas las funcionalidades han sido probadas
- [ ] ✅ No hay bugs críticos pendientes
- [ ] ✅ El personal está entrenado
- [ ] ✅ Tienes backup de la base actual (por si acaso)
- [ ] ✅ Has documentado cualquier ajuste necesario
- [ ] ✅ Los usuarios finales han aprobado el sistema

### Paso 1: Hacer Backup de Seguridad

```bash
# Backup completo (incluye datos de prueba)
pg_dump -U postgres mlf_system > backup_antes_reset_$(date +%Y%m%d).sql

# Guardar en lugar seguro
mkdir -p backups
mv backup_antes_reset_*.sql backups/
```

### Paso 2: Ejecutar Reset de Base de Datos

```bash
# ⚠️ ÚLTIMA OPORTUNIDAD PARA CANCELAR
# Este comando ELIMINARÁ PERMANENTEMENTE todos los datos

psql -U postgres -d mlf_system -f 98_RESET_DATABASE.sql

# El script te pedirá confirmación
# Debes escribir: CONFIRMAR
```

**¿Qué hace este script?**
1. ✅ Elimina TODOS los socios
2. ✅ Elimina TODOS los créditos
3. ✅ Elimina TODOS los pagos
4. ✅ Elimina TODAS las garantías
5. ✅ Elimina TODAS las transacciones
6. ✅ Elimina TODO el historial
7. ✅ Mantiene solo la estructura de tablas
8. ✅ Reinicia todos los contadores (IDs, códigos)
9. ✅ Mantiene usuario admin (configurable)

### Paso 3: Verificar que Todo Está Limpio

```sql
-- Conectar a la base
psql -U postgres -d mlf_system

-- Verificar que todo está en 0
SELECT 'Socios' as tabla, COUNT(*) as total FROM socios
UNION ALL
SELECT 'Creditos', COUNT(*) FROM creditos
UNION ALL
SELECT 'Pagos', COUNT(*) FROM pagos
UNION ALL
SELECT 'Garantias', COUNT(*) FROM garantias
UNION ALL
SELECT 'Transacciones', COUNT(*) FROM transacciones_ahorro;

-- Resultado esperado:
--   tabla         | total
-- ----------------+-------
--   Socios        |     0
--   Creditos      |     0
--   Pagos         |     0
--   Garantias     |     0
--   Transacciones |     0
```

### Paso 4: Configurar Usuario Admin de Producción

```sql
-- Cambiar password del admin
UPDATE usuarios
SET password = crypt('TU_PASSWORD_SEGURO_AQUI', gen_salt('bf'))
WHERE email = 'admin@mlf.com';

-- Cambiar email si es necesario
UPDATE usuarios
SET email = 'admin@tudominio.com'
WHERE email = 'admin@mlf.com';

-- Verificar
SELECT email, rol, activo FROM usuarios;
```

### Paso 5: Hacer Backup de Base Limpia

```bash
# Backup de base limpia (sin datos)
pg_dump -U postgres mlf_system > base_limpia_produccion_$(date +%Y%m%d).sql

# Este backup es tu "punto de partida" para producción
```

### Paso 6: Comenzar con Datos Reales

Ahora puedes comenzar a usar el sistema con datos reales:

1. **Ingresar socios reales** via API
2. **Registrar transacciones reales**
3. **Aprobar créditos reales**
4. **Hacer pagos reales**

**Códigos generados automáticamente:**
- Primer socio: `SOC-2025-0001`
- Primer crédito: `CRE-2025-0001`
- Todo comienza desde cero ✅

---

## 📜 Scripts Disponibles

### 1. Setup Maestro (`00_MASTER_SETUP.sql`)
**Qué hace:** Crea toda la estructura de la base de datos
**Cuándo usar:** Solo una vez al inicio del proyecto
```bash
psql -U postgres -f 00_MASTER_SETUP.sql
```

### 2. Reset Database (`98_RESET_DATABASE.sql`)
**Qué hace:** Limpia TODOS los datos, deja estructura intacta
**Cuándo usar:**
- Al finalizar fase de testing
- Antes de pasar a producción
- Si necesitas empezar de cero durante testing
```bash
psql -U postgres -d mlf_system -f 98_RESET_DATABASE.sql
```

### 3. Seed Data (`99_SEED_DATA.sql`)
**Qué hace:** Carga datos de prueba realistas
**Cuándo usar:**
- Durante fase de testing
- Para demos
- Para entrenamientos
```bash
psql -U postgres -d mlf_system -f 99_SEED_DATA.sql
```

---

## 🔧 Troubleshooting

### Problema: No puedo conectar a la base

```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Iniciar PostgreSQL si está detenido
sudo systemctl start postgresql
```

### Problema: Error de permisos

```bash
# Conectar como superusuario postgres
sudo -u postgres psql

# Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE mlf_system TO tu_usuario;
```

### Problema: El script de reset no elimina todo

```bash
# Conectar a la base
psql -U postgres -d mlf_system

# Ver qué tablas tienen datos
SELECT
    schemaname,
    tablename,
    pg_total_relation_size(schemaname||'.'||tablename) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size DESC;

# Eliminar manualmente si es necesario
TRUNCATE TABLE nombre_tabla CASCADE;
```

### Problema: Quiero mantener algunos datos al hacer reset

Edita el archivo `98_RESET_DATABASE.sql` y comenta las líneas de las tablas que quieres mantener:

```sql
-- Ejemplo: Mantener usuarios
-- DELETE FROM usuarios;  -- <-- Comentar esta línea
```

### Problema: Los códigos no empiezan desde 0001

```sql
-- Reiniciar secuencias manualmente
ALTER SEQUENCE socios_id_seq RESTART WITH 1;
ALTER SEQUENCE creditos_id_seq RESTART WITH 1;
ALTER SEQUENCE pagos_id_seq RESTART WITH 1;
```

---

## 📋 Resumen de Comandos

### Setup Inicial (Una vez)
```bash
cd database
psql -U postgres -f 00_MASTER_SETUP.sql
```

### Cargar Datos de Prueba
```bash
psql -U postgres -d mlf_system -f 99_SEED_DATA.sql
```

### Limpiar y Empezar de Nuevo (Testing)
```bash
psql -U postgres -d mlf_system -f 98_RESET_DATABASE.sql
psql -U postgres -d mlf_system -f 99_SEED_DATA.sql
```

### Preparar para Producción
```bash
# 1. Backup
pg_dump -U postgres mlf_system > backup_$(date +%Y%m%d).sql

# 2. Reset
psql -U postgres -d mlf_system -f 98_RESET_DATABASE.sql

# 3. Verificar
psql -U postgres -d mlf_system -c "SELECT COUNT(*) FROM socios;"

# 4. Backup base limpia
pg_dump -U postgres mlf_system > base_limpia_produccion.sql
```

---

## ✅ Buenas Prácticas

### Durante Testing
- ✅ Experimenta libremente, crea, modifica, elimina
- ✅ Documenta bugs y comportamientos extraños
- ✅ Prueba casos extremos y errores de usuario
- ✅ Haz reset y recarga seed data tantas veces como necesites

### Antes de Producción
- ✅ Haz backup completo
- ✅ Documenta cambios de configuración necesarios
- ✅ Verifica que el personal está entrenado
- ✅ Prepara plan de rollback por si falla algo

### En Producción
- ❌ **NUNCA** ejecutar script de reset
- ❌ **NUNCA** ejecutar script de seed data
- ✅ Hacer backups diarios automáticos
- ✅ Tener plan de recuperación ante desastres
- ✅ Monitorear logs y errores

---

## 🆘 Soporte

Si tienes problemas:

1. **Revisa los logs de PostgreSQL**
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-14-main.log
   ```

2. **Verifica el estado de la base**
   ```sql
   SELECT * FROM pg_stat_activity WHERE datname = 'mlf_system';
   ```

3. **Consulta la documentación completa**
   - `docs/DATABASE.md`
   - `docs/API_REFERENCE.md`
   - `docs/TESTING.md`

---

**Última actualización:** 2025-01-20
**Versión:** 1.0.0
**Autor:** Sistema MLF
