# 🛡️ Guía de Despliegue Seguro - Sistema MLF

## Estado Actual
✅ **v1.0.0** - Primera versión estable en producción (21 Dic 2024)

---

## Estrategia de Ramas (Branches)

```
main ────────────── 📦 PRODUCCIÓN (lo que ven los usuarios)
  │
  └── develop ───── 🔧 DESARROLLO (donde haces cambios nuevos)
        │
        └── feature/xxx ── 🌱 Funcionalidades específicas
```

### Flujo de Trabajo Seguro

1. **main** → Solo código probado y estable. Hostinger despliega desde aquí.
2. **develop** → Donde desarrollas nuevas mejoras
3. **feature/xxx** → Ramas temporales para cada funcionalidad

---

## Comandos Esenciales

### Crear rama de desarrollo (UNA VEZ)
```bash
git checkout -b develop
git push -u origin develop
```

### Empezar nueva funcionalidad
```bash
git checkout develop
git checkout -b feature/nueva-mejora
# Hacer cambios...
git add -A
git commit -m "Descripción del cambio"
git push origin feature/nueva-mejora
```

### Cuando la mejora esté lista y probada
```bash
# Fusionar a develop
git checkout develop
git merge feature/nueva-mejora
git push origin develop

# Probar en develop...
# Si todo funciona, fusionar a main
git checkout main
git merge develop
git push origin main
```

### 🚨 Si algo sale MAL en producción (ROLLBACK)
```bash
# Volver a la última versión estable
git checkout main
git reset --hard v1.0.0
git push -f origin main
```

---

## Tags de Versión (Puntos de Restauración)

| Tag | Descripción | Fecha |
|-----|-------------|-------|
| `v1.0.0` | Primera versión estable | 21 Dic 2024 |

### Crear nuevo tag (después de cambios importantes)
```bash
git tag -a v1.1.0 -m "Descripción de lo nuevo"
git push origin v1.1.0
```

### Ver todos los tags
```bash
git tag -l
```

---

## Configuración de Hostinger

### Opción A: Deploy Manual (Actual)
- Hostinger hace pull de `main` automáticamente o manualmente
- Solo fusionas a `main` cuando estés 100% seguro

### Opción B: Deploy desde Release (Más Seguro)
En el panel de Hostinger:
1. Ve a `Git` → `Configuración`
2. Cambia la rama a un tag específico: `v1.0.0`
3. Solo cambia el tag cuando tengas una nueva versión probada

---

## Checklist Antes de Subir a Producción

- [ ] ¿El código funciona localmente?
- [ ] ¿Probaste todos los flujos principales? (login, depósito, retiro, crédito)
- [ ] ¿Hiciste commit y push a `develop` primero?
- [ ] ¿Creaste un nuevo tag antes de fusionar a main?
- [ ] ¿Tienes forma de probar en Hostinger sin afectar usuarios? (ej: horario de bajo uso)

---

## Resumen Visual

```
[Tu PC] ──push──▶ [GitHub] ──pull──▶ [Hostinger/Producción]
                     │
                     ├── main (producción)
                     ├── develop (pruebas)
                     └── v1.0.0 (respaldo)
```

**Regla de Oro:** 
> Nunca trabajes directamente en `main`. 
> Siempre desarrolla en `develop` y solo fusiona a `main` cuando estés 100% seguro.
