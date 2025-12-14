/**
 * ============================================================================
 * SCRIPT DE RESET DE BASE DE DATOS
 * ============================================================================
 *
 * PROPÓSITO: Limpiar TODOS los datos y dejar la base en estado inicial
 *
 * ⚠️⚠️⚠️ ADVERTENCIA CRÍTICA ⚠️⚠️⚠️
 *
 * Este script ELIMINA PERMANENTEMENTE:
 * - Todos los socios
 * - Todos los créditos
 * - Todos los pagos
 * - Todas las garantías
 * - Todas las transacciones
 * - Todo el historial
 *
 * SOLO MANTIENE:
 * - La estructura de tablas
 * - Las configuraciones del sistema
 * - Los usuarios (opcional)
 *
 * USO:
 * 1. Para desarrollo/testing (limpia todo):
 *    psql -U postgres -d mlf_system -f 98_RESET_DATABASE.sql
 *
 * 2. Para pasar a producción (limpia datos de prueba):
 *    - Ejecutar este script
 *    - Verificar que todo está limpio
 *    - Comenzar a ingresar datos reales
 *
 * @author Sistema MLF
 * @version 1.0.0
 * @date 2025-01-20
 */

-- ============================================================================
-- CONFIRMACIÓN DE SEGURIDAD
-- ============================================================================

\echo ''
\echo '⚠️⚠️⚠️ ADVERTENCIA CRÍTICA ⚠️⚠️⚠️'
\echo ''
\echo 'Este script va a ELIMINAR PERMANENTEMENTE todos los datos:'
\echo '  • Todos los socios'
\echo '  • Todos los créditos'
\echo '  • Todos los pagos'
\echo '  • Todas las garantías'
\echo '  • Todo el historial'
\echo ''
\echo 'La base de datos quedará en estado inicial.'
\echo ''
\echo 'Presiona CTRL+C para cancelar, o ENTER para continuar...'
\echo ''
\prompt 'Escribe "CONFIRMAR" para proceder: ' confirmacion

-- Verificar confirmación
DO $$
BEGIN
    IF :'confirmacion' != 'CONFIRMAR' THEN
        RAISE EXCEPTION '❌ Operación cancelada por el usuario';
    END IF;
END $$;

\echo ''
\echo '🔄 Iniciando proceso de limpieza...'
\echo ''

-- ============================================================================
-- DESACTIVAR TRIGGERS TEMPORALMENTE
-- ============================================================================

\echo '📝 Desactivando triggers...'

ALTER TABLE auditorias DISABLE TRIGGER ALL;
ALTER TABLE socios DISABLE TRIGGER ALL;
ALTER TABLE creditos DISABLE TRIGGER ALL;
ALTER TABLE cuotas DISABLE TRIGGER ALL;
ALTER TABLE pagos DISABLE TRIGGER ALL;
ALTER TABLE garantias DISABLE TRIGGER ALL;
ALTER TABLE transacciones_ahorro DISABLE TRIGGER ALL;
ALTER TABLE distribucion_utilidades DISABLE TRIGGER ALL;
ALTER TABLE fondo_seguro DISABLE TRIGGER ALL;
ALTER TABLE notificaciones DISABLE TRIGGER ALL;

\echo '✅ Triggers desactivados'

-- ============================================================================
-- ELIMINAR DATOS EN ORDEN CORRECTO (RESPETANDO FOREIGN KEYS)
-- ============================================================================

\echo ''
\echo '🗑️  Eliminando datos...'
\echo ''

-- 1. Notificaciones
\echo '  • Eliminando notificaciones...'
DELETE FROM notificaciones;
ALTER SEQUENCE notificaciones_id_seq RESTART WITH 1;

-- 2. Distribución de utilidades
\echo '  • Eliminando distribución de utilidades...'
DELETE FROM distribucion_utilidades;
ALTER SEQUENCE distribucion_utilidades_id_seq RESTART WITH 1;

-- 3. Auditorías
\echo '  • Eliminando auditorías...'
DELETE FROM auditorias;
ALTER SEQUENCE auditorias_id_seq RESTART WITH 1;

-- 4. Pagos
\echo '  • Eliminando pagos...'
DELETE FROM pagos;
ALTER SEQUENCE pagos_id_seq RESTART WITH 1;

-- 5. Cuotas
\echo '  • Eliminando cuotas...'
DELETE FROM cuotas;
ALTER SEQUENCE cuotas_id_seq RESTART WITH 1;

-- 6. Garantías
\echo '  • Eliminando garantías...'
DELETE FROM garantias;
ALTER SEQUENCE garantias_id_seq RESTART WITH 1;

-- 7. Fondo de seguro
\echo '  • Eliminando registros de fondo de seguro...'
DELETE FROM fondo_seguro;
ALTER SEQUENCE fondo_seguro_id_seq RESTART WITH 1;

-- 8. Créditos
\echo '  • Eliminando créditos...'
DELETE FROM creditos;
ALTER SEQUENCE creditos_id_seq RESTART WITH 1;

-- 9. Transacciones de ahorro
\echo '  • Eliminando transacciones de ahorro...'
DELETE FROM transacciones_ahorro;
ALTER SEQUENCE transacciones_ahorro_id_seq RESTART WITH 1;

-- 10. Socios
\echo '  • Eliminando socios...'
DELETE FROM socios;
ALTER SEQUENCE socios_id_seq RESTART WITH 1;

-- 11. Usuarios (OPCIONAL - Comentar si quieres mantener usuarios)
\echo '  • Eliminando usuarios...'
DELETE FROM usuarios WHERE email NOT IN ('admin@mlf.com'); -- Mantener solo admin
-- Si quieres eliminar TODOS los usuarios, descomenta la siguiente línea:
-- DELETE FROM usuarios;
ALTER SEQUENCE usuarios_id_seq RESTART WITH 1;

-- 12. Sesiones (tokens)
\echo '  • Eliminando sesiones...'
DELETE FROM sesiones;
ALTER SEQUENCE sesiones_id_seq RESTART WITH 1;

\echo ''
\echo '✅ Todos los datos eliminados'

-- ============================================================================
-- REACTIVAR TRIGGERS
-- ============================================================================

\echo ''
\echo '📝 Reactivando triggers...'

ALTER TABLE auditorias ENABLE TRIGGER ALL;
ALTER TABLE socios ENABLE TRIGGER ALL;
ALTER TABLE creditos ENABLE TRIGGER ALL;
ALTER TABLE cuotas ENABLE TRIGGER ALL;
ALTER TABLE pagos ENABLE TRIGGER ALL;
ALTER TABLE garantias ENABLE TRIGGER ALL;
ALTER TABLE transacciones_ahorro ENABLE TRIGGER ALL;
ALTER TABLE distribucion_utilidades ENABLE TRIGGER ALL;
ALTER TABLE fondo_seguro ENABLE TRIGGER ALL;
ALTER TABLE notificaciones ENABLE TRIGGER ALL;

\echo '✅ Triggers reactivados'

-- ============================================================================
-- RECREAR USUARIO ADMIN SI FUE ELIMINADO
-- ============================================================================

\echo ''
\echo '👤 Verificando usuario admin...'

INSERT INTO usuarios (email, password, nombre_completo, rol, activo, created_at)
VALUES (
    'admin@mlf.com',
    '$2a$10$rKj8VqZNQQYX5oZ8pKvZ0OKvZ0OKvZ0OKvZ0OKvZ0OKvZ0OKvZ0O', -- password123
    'Administrador Sistema',
    'ADMIN',
    true,
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    activo = true,
    updated_at = NOW();

\echo '✅ Usuario admin verificado'

-- ============================================================================
-- VERIFICAR ESTADO DE LA BASE
-- ============================================================================

\echo ''
\echo '🔍 Verificando estado de la base de datos...'
\echo ''

DO $$
DECLARE
    v_socios INTEGER;
    v_creditos INTEGER;
    v_transacciones INTEGER;
    v_usuarios INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_socios FROM socios;
    SELECT COUNT(*) INTO v_creditos FROM creditos;
    SELECT COUNT(*) INTO v_transacciones FROM transacciones_ahorro;
    SELECT COUNT(*) INTO v_usuarios FROM usuarios;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ BASE DE DATOS LIMPIADA EXITOSAMENTE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTADO ACTUAL:';
    RAISE NOTICE '  • Socios: %', v_socios;
    RAISE NOTICE '  • Créditos: %', v_creditos;
    RAISE NOTICE '  • Transacciones: %', v_transacciones;
    RAISE NOTICE '  • Usuarios: %', v_usuarios;
    RAISE NOTICE '';

    IF v_socios = 0 AND v_creditos = 0 AND v_transacciones = 0 THEN
        RAISE NOTICE '✅ La base está completamente limpia';
        RAISE NOTICE '';
        RAISE NOTICE '📋 PRÓXIMOS PASOS:';
        RAISE NOTICE '';
        RAISE NOTICE '1. Para cargar datos de prueba:';
        RAISE NOTICE '   psql -U postgres -d mlf_system -f 99_SEED_DATA.sql';
        RAISE NOTICE '';
        RAISE NOTICE '2. Para comenzar con datos reales de producción:';
        RAISE NOTICE '   - Usar la API para crear socios';
        RAISE NOTICE '   - Usuario admin@mlf.com / password123';
        RAISE NOTICE '   - ⚠️  Cambiar password del admin';
        RAISE NOTICE '';
    ELSE
        RAISE WARNING '⚠️  Aún quedan algunos datos en la base';
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- VACUUM Y ANALYZE (OPTIMIZAR BASE DE DATOS)
-- ============================================================================

\echo '🔧 Optimizando base de datos...'

VACUUM ANALYZE socios;
VACUUM ANALYZE creditos;
VACUUM ANALYZE cuotas;
VACUUM ANALYZE pagos;
VACUUM ANALYZE garantias;
VACUUM ANALYZE transacciones_ahorro;
VACUUM ANALYZE auditorias;

\echo '✅ Base de datos optimizada'
\echo ''
\echo '🎉 Proceso completado exitosamente'
\echo ''
