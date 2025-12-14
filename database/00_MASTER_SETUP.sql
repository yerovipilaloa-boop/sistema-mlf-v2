-- ============================================================================
-- Sistema MLF - Script Maestro de Inicialización
-- Archivo: 00_MASTER_SETUP.sql
-- Descripción: Script principal para crear toda la base de datos
-- Versión: 1.0
-- Fecha: Noviembre 2025
-- ============================================================================

-- ============================================================================
-- INSTRUCCIONES DE USO:
-- 1. Crear una base de datos vacía llamada 'mlf_db'
-- 2. Conectarse a la base de datos
-- 3. Ejecutar este script maestro
--
-- Alternativamente, ejecutar los scripts en este orden:
--   psql -U postgres -d mlf_db -f 01_schema_core.sql
--   psql -U postgres -d mlf_db -f 02_schema_financiero.sql
--   psql -U postgres -d mlf_db -f 03_schema_sistema.sql
--   psql -U postgres -d mlf_db -f 04_triggers_validaciones.sql
--   psql -U postgres -d mlf_db -f 05_seed_data.sql
-- ============================================================================

\echo ''
\echo '=========================================================================='
\echo 'Sistema MLF - My Libertad Financiera'
\echo 'Inicializando Base de Datos...'
\echo '=========================================================================='
\echo ''

-- Configuración inicial
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Extensiones necesarias
\echo '>> Instalando extensiones necesarias...'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- Para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Para búsquedas de texto avanzadas
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- Para índices optimizados

\echo '   ✓ Extensiones instaladas correctamente'
\echo ''

-- ============================================================================
-- PASO 1: Crear esquemas de tablas core
-- ============================================================================
\echo '>> Paso 1/5: Creando tablas core (socios, créditos, garantías)...'
\i 01_schema_core.sql
\echo '   ✓ Tablas core creadas: socios, recomendaciones, creditos, cuotas, pagos, garantias, liberaciones_garantia'
\echo ''

-- ============================================================================
-- PASO 2: Crear esquemas financieros
-- ============================================================================
\echo '>> Paso 2/5: Creando tablas financieras (transacciones, utilidades, seguros)...'
\i 02_schema_financiero.sql
\echo '   ✓ Tablas financieras creadas: transacciones, utilidades, fondo_seguro, comprobantes, moras'
\echo ''

-- ============================================================================
-- PASO 3: Crear esquemas de sistema
-- ============================================================================
\echo '>> Paso 3/5: Creando tablas de sistema (configuraciones, auditoría)...'
\i 03_schema_sistema.sql
\echo '   ✓ Tablas de sistema creadas: configuraciones, notificaciones, auditoria, sesiones, cambios_documento, dashboard_metricas'
\echo ''

-- ============================================================================
-- PASO 4: Crear triggers y validaciones
-- ============================================================================
\echo '>> Paso 4/5: Creando triggers y validaciones automáticas...'
\i 04_triggers_validaciones.sql
\echo '   ✓ Triggers creados: Validaciones de reglas de negocio, auditoría automática, actualizaciones automáticas'
\echo ''

-- ============================================================================
-- PASO 5: Insertar datos iniciales
-- ============================================================================
\echo '>> Paso 5/5: Insertando configuraciones y datos de prueba...'
\i 05_seed_data.sql
\echo '   ✓ Datos iniciales cargados: Configuraciones del sistema, usuarios admin/operador, socios de prueba'
\echo ''

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
\echo '=========================================================================='
\echo 'VERIFICACIÓN FINAL'
\echo '=========================================================================='
\echo ''

-- Contar tablas creadas
SELECT
    schemaname,
    COUNT(*) as total_tablas
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;

\echo ''
\echo 'Resumen de tablas por módulo:'
\echo ''

SELECT 'Módulo Socios' as modulo, COUNT(*) as tablas
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('socios', 'recomendaciones')
UNION ALL
SELECT 'Módulo Créditos', COUNT(*)
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('creditos', 'cuotas', 'pagos', 'moras')
UNION ALL
SELECT 'Módulo Garantías', COUNT(*)
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('garantias', 'liberaciones_garantia')
UNION ALL
SELECT 'Módulo Financiero', COUNT(*)
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('transacciones', 'utilidades', 'utilidades_detalle', 'fondo_seguro', 'comprobantes')
UNION ALL
SELECT 'Módulo Sistema', COUNT(*)
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('configuraciones', 'notificaciones', 'auditoria', 'sesiones', 'cambios_documento', 'dashboard_metricas');

\echo ''
\echo '>> Verificando funciones y triggers...'

SELECT
    COUNT(DISTINCT trigger_name) as total_triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public';

SELECT
    COUNT(*) as total_funciones
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f';

\echo ''
\echo '>> Verificando datos iniciales...'

SELECT 'Configuraciones cargadas: ' || COUNT(*)::TEXT FROM configuraciones;
SELECT 'Socios de prueba: ' || COUNT(*)::TEXT FROM socios;
SELECT 'Usuarios admin/operador: ' || COUNT(*)::TEXT FROM socios WHERE rol IN ('ADMIN', 'OPERADOR');
SELECT 'Socios Especiales (pueden recomendar): ' || COUNT(*)::TEXT FROM socios WHERE etapa_actual = 3;

\echo ''
\echo '=========================================================================='
\echo 'INICIALIZACIÓN COMPLETADA EXITOSAMENTE'
\echo '=========================================================================='
\echo ''
\echo 'Base de datos MLF lista para usar!'
\echo ''
\echo 'Usuarios de prueba creados:'
\echo '  - Admin:    usuario: admin     | email: admin@mylf.com'
\echo '  - Operador: usuario: operador  | email: operador@mylf.com'
\echo ''
\echo 'IMPORTANTE: Cambiar contraseñas en producción!'
\echo ''
\echo 'Siguiente paso: Configurar backend y APIs'
\echo '=========================================================================='
\echo ''

-- ============================================================================
-- FIN DE SCRIPT MAESTRO
-- ============================================================================
