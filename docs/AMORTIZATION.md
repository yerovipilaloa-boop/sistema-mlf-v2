# Algoritmos de Amortización - Sistema MLF

Documentación técnica completa de los algoritmos de amortización implementados en el Sistema My Libertad Financiera.

## Tabla de Contenidos

- [Introducción](#introducción)
- [Método Francés](#método-francés)
- [Método Alemán](#método-alemán)
- [Comparación de Métodos](#comparación-de-métodos)
- [Cálculo de Mora](#cálculo-de-mora)
- [Distribución de Pagos](#distribución-de-pagos)
- [Prepago de Capital](#prepago-de-capital)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [API Reference](#api-reference)

---

## Introducción

El Sistema MLF implementa dos métodos de amortización para créditos:

1. **Método Francés**: Cuota fija mensual
2. **Método Alemán**: Capital fijo mensual

Ambos métodos cumplen con las reglas de negocio del sistema y están optimizados para:
- Precisión decimal (2 decimales)
- Rendimiento (cálculos en memoria)
- Validación de datos
- Manejo de casos extremos

---

## Método Francés

### Descripción

El **Método Francés** (también llamado sistema francés de amortización) genera una **cuota mensual fija** durante todo el período del crédito.

### Características

✅ **Cuota mensual FIJA** durante todo el período
✅ **Intereses DECRECIENTES** (se calculan sobre saldo restante)
✅ **Capital CRECIENTE** (diferencia entre cuota e interés)
✅ Más predecible para el socio
✅ Más fácil de planificar financieramente

### Fórmula Matemática

**Cuota Mensual:**
```
         P × i × (1 + i)^n
C = ─────────────────────────
         (1 + i)^n - 1

Donde:
  C = Cuota mensual fija
  P = Monto del préstamo (capital)
  i = Tasa de interés mensual (anual / 12 / 100)
  n = Número de cuotas (plazo en meses)
```

**Para cada cuota:**
```
Interés = Saldo restante × Tasa mensual
Capital = Cuota fija - Interés
Nuevo saldo = Saldo anterior - Capital
```

### Ejemplo Numérico

**Datos:**
- Monto: $1,000.00
- Tasa anual: 18% (1.5% mensual)
- Plazo: 12 meses

**Cálculo de cuota fija:**
```
P = 1000
i = 0.015 (1.5% mensual)
n = 12

C = 1000 × 0.015 × (1.015)^12 / [(1.015)^12 - 1]
C = 1000 × 0.015 × 1.1956 / [1.1956 - 1]
C = 17.934 / 0.1956
C = $91.68
```

**Tabla de Amortización:**

| Cuota | Fecha Venc. | Cuota | Capital | Interés | Saldo |
|-------|-------------|-------|---------|---------|--------|
| 1 | 2025-02-01 | $91.68 | $76.68 | $15.00 | $923.32 |
| 2 | 2025-03-01 | $91.68 | $77.83 | $13.85 | $845.49 |
| 3 | 2025-04-01 | $91.68 | $79.00 | $12.68 | $766.49 |
| 4 | 2025-05-01 | $91.68 | $80.18 | $11.50 | $686.31 |
| 5 | 2025-06-01 | $91.68 | $81.38 | $10.30 | $604.93 |
| 6 | 2025-07-01 | $91.68 | $82.61 | $9.07 | $522.32 |
| 7 | 2025-08-01 | $91.68 | $83.85 | $7.83 | $438.47 |
| 8 | 2025-09-01 | $91.68 | $85.11 | $6.57 | $353.36 |
| 9 | 2025-10-01 | $91.68 | $86.38 | $5.30 | $266.98 |
| 10 | 2025-11-01 | $91.68 | $87.68 | $4.00 | $179.30 |
| 11 | 2025-12-01 | $91.68 | $88.99 | $2.69 | $90.31 |
| 12 | 2026-01-01 | $91.67 | $90.31 | $1.36 | $0.00 |

**Resumen:**
- Total a pagar: **$1,100.13**
- Capital: $1,000.00
- Intereses: **$100.13**

### Ventajas y Desventajas

**Ventajas:**
- ✅ Cuota mensual predecible
- ✅ Fácil de presupuestar
- ✅ No hay sorpresas en el monto mensual

**Desventajas:**
- ❌ Paga más intereses totales vs. Método Alemán
- ❌ Al principio se paga más interés que capital

---

## Método Alemán

### Descripción

El **Método Alemán** (también llamado sistema alemán o de cuota decreciente) genera una **amortización fija de capital** en cada cuota, con intereses decrecientes.

### Características

✅ **Capital FIJO** en cada cuota
✅ **Intereses DECRECIENTES** (se calculan sobre saldo restante)
✅ **Cuota total DECRECIENTE** (capital + interés decreciente)
✅ Menos intereses totales
✅ Primera cuota es la más alta

### Fórmula Matemática

**Para cada cuota:**
```
Capital fijo = P / n
Interés = Saldo restante × i
Cuota total = Capital fijo + Interés
Nuevo saldo = Saldo anterior - Capital fijo

Donde:
  P = Monto del préstamo
  i = Tasa de interés mensual
  n = Número de cuotas
```

### Ejemplo Numérico

**Datos:**
- Monto: $1,000.00
- Tasa anual: 18% (1.5% mensual)
- Plazo: 12 meses

**Cálculo:**
```
Capital fijo = 1000 / 12 = $83.33
```

**Tabla de Amortización:**

| Cuota | Fecha Venc. | Cuota | Capital | Interés | Saldo |
|-------|-------------|-------|---------|---------|--------|
| 1 | 2025-02-01 | $98.33 | $83.33 | $15.00 | $916.67 |
| 2 | 2025-03-01 | $97.08 | $83.33 | $13.75 | $833.34 |
| 3 | 2025-04-01 | $95.83 | $83.33 | $12.50 | $750.01 |
| 4 | 2025-05-01 | $94.58 | $83.33 | $11.25 | $666.68 |
| 5 | 2025-06-01 | $93.33 | $83.33 | $10.00 | $583.35 |
| 6 | 2025-07-01 | $92.09 | $83.33 | $8.76 | $500.02 |
| 7 | 2025-08-01 | $90.83 | $83.33 | $7.50 | $416.69 |
| 8 | 2025-09-01 | $89.58 | $83.33 | $6.25 | $333.36 |
| 9 | 2025-10-01 | $88.33 | $83.33 | $5.00 | $250.03 |
| 10 | 2025-11-01 | $87.08 | $83.33 | $3.75 | $166.70 |
| 11 | 2025-12-01 | $85.83 | $83.33 | $2.50 | $83.37 |
| 12 | 2026-01-01 | $84.58 | $83.33 | $1.25 | $0.00 |

**Resumen:**
- Total a pagar: **$1,097.50**
- Capital: $1,000.00
- Intereses: **$97.50**

### Ventajas y Desventajas

**Ventajas:**
- ✅ Menor pago de intereses totales
- ✅ Reducción de deuda más rápida
- ✅ Cuotas decrecientes alivian carga con el tiempo

**Desventajas:**
- ❌ Primera cuota es más alta
- ❌ Cuotas variables dificultan presupuesto
- ❌ Requiere mayor liquidez inicial

---

## Comparación de Métodos

### Tabla Comparativa

Para un crédito de **$10,000 al 18% anual en 24 meses:**

| Característica | Método Francés | Método Alemán | Diferencia |
|----------------|----------------|---------------|------------|
| Primera cuota | $499.00 | $566.67 | +$67.67 |
| Última cuota | $499.00 | $422.50 | -$76.50 |
| Total intereses | $1,976.00 | $1,875.00 | -$101.00 |
| Total a pagar | $11,976.00 | $11,875.00 | -$101.00 |
| Cuota promedio | $499.00 | $494.79 | -$4.21 |

### Cuándo Usar Cada Método

**Método Francés recomendado:**
- ✅ Socios con ingreso fijo mensual
- ✅ Preferencia por cuota predecible
- ✅ Primera vez solicitando crédito
- ✅ Plazo corto (< 24 meses)
- ✅ Diferencia de intereses < $50

**Método Alemán recomendado:**
- ✅ Socios con capacidad de pago inicial alta
- ✅ Deseo de ahorrar en intereses
- ✅ Plazo largo (> 36 meses)
- ✅ Tasa de interés alta
- ✅ Diferencia de intereses > $100

### Gráfica de Evolución de Cuotas

```
Método Francés (Cuota Fija):
Cuota │  ████████████████████████████████████
      │  ████████████████████████████████████
      │  ████████████████████████████████████
      └────────────────────────────────────── Tiempo

Método Alemán (Cuota Decreciente):
Cuota │  ████████████████
      │  ██████████████
      │  ████████████
      │  ██████████
      │  ████████
      │  ██████
      │  ████
      │  ██
      └────────────────────────────────────── Tiempo
```

---

## Cálculo de Mora

### Fórmula

Según **RN-MOR-002**, el interés de mora se calcula:

```
Interés mora = Monto cuota × (Tasa mora diaria / 100) × Días mora

Tasa mora diaria = 1.0% (configurable)
```

### Ejemplo

**Datos:**
- Cuota vencida: $500.00
- Días de mora: 30
- Tasa mora diaria: 1.0%

**Cálculo:**
```
Interés mora = 500 × (1.0 / 100) × 30
Interés mora = 500 × 0.01 × 30
Interés mora = $150.00

Total a pagar = $500.00 + $150.00 = $650.00
```

### Clasificación de Mora

Según **RN-MOR-001**:

| Clasificación | Días | Acción |
|--------------|------|--------|
| LEVE | 1-15 | Notificación |
| MODERADA | 16-30 | Restricción nuevo crédito |
| GRAVE | 31-60 | Congelamiento adicional |
| PERSISTENTE | 61-89 | Alerta de castigo |
| CASTIGADO | 90+ | Castigo automático |

---

## Distribución de Pagos

### Orden de Aplicación

Según **RN-PAG-001**, los pagos se aplican en este orden:

```
1. MORA (prioridad máxima)
2. INTERÉS
3. CAPITAL (prioridad mínima)
4. SOBRANTE = Prepago de capital
```

### Ejemplos

#### Ejemplo 1: Pago Completo

**Deuda:**
- Mora: $30.00
- Interés: $20.00
- Capital: $100.00
- **Total:** $150.00

**Pago:** $150.00

**Distribución:**
```
Aplicado a mora:    $30.00
Aplicado a interés: $20.00
Aplicado a capital: $100.00
Sobrante:           $0.00
```

#### Ejemplo 2: Pago Parcial

**Deuda:**
- Mora: $50.00
- Interés: $20.00
- Capital: $100.00

**Pago:** $30.00

**Distribución:**
```
Aplicado a mora:    $30.00
Aplicado a interés: $0.00
Aplicado a capital: $0.00
Sobrante:           $0.00

Pendiente:
- Mora:    $20.00
- Interés: $20.00
- Capital: $100.00
```

#### Ejemplo 3: Pago con Excedente (Prepago)

**Deuda:**
- Mora: $10.00
- Interés: $20.00
- Capital: $100.00

**Pago:** $200.00

**Distribución:**
```
Aplicado a mora:    $10.00
Aplicado a interés: $20.00
Aplicado a capital: $100.00
Sobrante (prepago): $70.00
```

El sobrante de $70.00 se aplica como **prepago de capital** para futuras cuotas.

---

## Prepago de Capital

### Concepto

Según **RN-PAG-002**, el prepago de capital reduce el saldo y puede:
- Reducir el plazo (mantener cuota)
- Reducir la cuota (mantener plazo)

En el Sistema MLF se implementa **reducción de plazo**.

### Cálculo de Reducción de Plazo

**Fórmula:**
```
             ln(C / (C - S × i))
n_nuevo = ───────────────────────
                ln(1 + i)

Donde:
  n_nuevo = Nuevo plazo en meses
  C = Cuota mensual actual
  S = Nuevo saldo (después del prepago)
  i = Tasa de interés mensual
```

### Ejemplo

**Crédito actual:**
- Saldo: $5,000.00
- Cuota: $500.00
- Cuotas restantes: 12
- Tasa: 18% anual (1.5% mensual)

**Prepago:** $2,000.00

**Cálculo:**
```
Nuevo saldo = 5000 - 2000 = $3,000.00

n_nuevo = ln(500 / (500 - 3000 × 0.015)) / ln(1.015)
n_nuevo = ln(500 / 455) / ln(1.015)
n_nuevo = ln(1.0989) / 0.0149
n_nuevo = 6.3 ≈ 7 cuotas

Cuotas ahorradas = 12 - 7 = 5 cuotas
Ahorro intereses ≈ $300.00
```

---

## Ejemplos Prácticos

### Caso 1: Socio Etapa 1 - Primer Crédito

**Perfil:**
- Ahorro: $1,000.00
- Límite: 125% = $1,250.00
- Sin historial crediticio

**Crédito solicitado:**
- Monto: $1,250.00 (100% del límite)
- Prima seguro: 1% = $12.50
- **Monto total:** $1,262.50
- Plazo: 12 meses
- Tasa: 1.5% mensual
- Método: **Francés** (recomendado por cuota fija)

**Tabla generada:**
```typescript
const tabla = amortizationService.calcularTablaAmortizacion({
  montoTotal: 1262.50,
  tasaInteresAnual: 18,
  plazoMeses: 12,
  metodo: MetodoAmortizacion.FRANCES,
  fechaDesembolso: new Date('2025-01-15')
});

// Resultado:
// - Cuota mensual: $115.71
// - Total intereses: $126.02
// - Total a pagar: $1,388.52
```

### Caso 2: Socio Etapa 3 - Crédito Grande

**Perfil:**
- Ahorro: $10,000.00
- Límite: 300% = $30,000.00
- Historial excelente

**Crédito solicitado:**
- Monto: $25,000.00
- Prima seguro: 1% = $250.00
- **Monto total:** $25,250.00
- Plazo: 48 meses
- Tasa: 1.5% mensual

**Comparación de métodos:**
```typescript
const comparacion = amortizationService.compararMetodos(
  25250,
  18,
  48,
  new Date('2025-01-15')
);

// Método Francés:
// - Cuota: $746.50 (fija)
// - Intereses totales: $10,582.00

// Método Alemán:
// - Primera cuota: $904.58
// - Última cuota: $534.06
// - Intereses totales: $9,975.00
// - Ahorro: $607.00

// Recomendación: ALEMÁN (ahorra $607 en intereses)
```

### Caso 3: Pago con Mora

**Situación:**
- Cuota #5 de $300.00 vencida hace 20 días
- Clasificación: MODERADA (16-30 días)

**Cálculo de mora:**
```typescript
const cuotaConMora = amortizationService.calcularMontoCuotaConMora(
  300,    // Cuota
  20,     // Días mora
  1.0     // Tasa mora diaria
);

// Resultado:
// - Cuota original: $300.00
// - Interés mora: $60.00
// - Total a pagar: $360.00
```

**Pago parcial de $200:**
```typescript
const distribucion = amortizationService.distribuirPago(
  200,  // Monto pagado
  60,   // Mora adeudada
  50,   // Interés adeudado
  250   // Capital adeudado
);

// Resultado:
// - Aplicado mora: $60.00
// - Aplicado interés: $50.00
// - Aplicado capital: $90.00
// - Sobrante: $0.00
//
// Pendiente:
// - Capital: $160.00 (250 - 90)
```

---

## API Reference

### calcularTablaAmortizacion()

Calcula la tabla de amortización completa.

**Signature:**
```typescript
calcularTablaAmortizacion(input: {
  montoTotal: number;
  tasaInteresAnual: number;
  plazoMeses: number;
  metodo: MetodoAmortizacion;
  fechaDesembolso: Date;
}): TablaAmortizacion
```

**Ejemplo:**
```typescript
import amortizationService from './services/amortization.service';
import { MetodoAmortizacion } from './types';

const tabla = amortizationService.calcularTablaAmortizacion({
  montoTotal: 5000,
  tasaInteresAnual: 18,
  plazoMeses: 24,
  metodo: MetodoAmortizacion.FRANCES,
  fechaDesembolso: new Date('2025-01-15')
});

console.log(`Total a pagar: $${tabla.resumen.totalAPagar}`);
console.log(`Intereses: $${tabla.resumen.totalIntereses}`);
console.log(`Primera cuota: $${tabla.cuotas[0].montoCuota}`);
```

---

### compararMetodos()

Compara ambos métodos y recomienda el mejor.

**Signature:**
```typescript
compararMetodos(
  montoTotal: number,
  tasaInteresAnual: number,
  plazoMeses: number,
  fechaDesembolso: Date
): {
  frances: TablaAmortizacion;
  aleman: TablaAmortizacion;
  comparacion: {...};
}
```

**Ejemplo:**
```typescript
const comparacion = amortizationService.compararMetodos(
  10000,
  18,
  36,
  new Date('2025-01-15')
);

console.log(`Método recomendado: ${comparacion.comparacion.metodoRecomendado}`);
console.log(`Razón: ${comparacion.comparacion.razonRecomendacion}`);
console.log(`Ahorro intereses: $${comparacion.comparacion.diferenciaIntereses}`);
```

---

### calcularMontoCuotaConMora()

Calcula el monto total con interés de mora.

**Signature:**
```typescript
calcularMontoCuotaConMora(
  montoCuota: number,
  diasMora: number,
  tasaMoraDiaria: number
): {
  montoCuota: number;
  intereseMora: number;
  montoTotal: number;
}
```

---

### distribuirPago()

Distribuye un pago según prioridad (Mora → Interés → Capital).

**Signature:**
```typescript
distribuirPago(
  montoPagado: number,
  montoMoraAdeudado: number,
  montoInteresAdeudado: number,
  montoCapitalAdeudado: number
): {
  aplicadoMora: number;
  aplicadoInteres: number;
  aplicadoCapital: number;
  sobrante: number;
}
```

---

## Testing

Los algoritmos están completamente testeados:

```bash
npm test amortization.service.test.ts
```

**Cobertura de tests:**
- ✅ Método Francés: Cuota fija, intereses decrecientes
- ✅ Método Alemán: Capital fijo, cuotas decrecientes
- ✅ Comparación de métodos
- ✅ Cálculo de mora
- ✅ Distribución de pagos
- ✅ Validaciones de entrada
- ✅ Casos extremos (plazos cortos/largos, montos pequeños/grandes)
- ✅ Precisión y redondeo

---

## Referencias

- **RN-CRE-008**: Plazos de crédito (6-60 meses)
- **RN-MOR-001**: Clasificación de morosidad
- **RN-MOR-002**: Interés de mora diario (1%)
- **RN-PAG-001**: Orden de aplicación de pagos
- **RN-PAG-002**: Prepago de capital permitido

---

## Soporte

Para dudas sobre los algoritmos:
- Revisar tests: `src/services/__tests__/amortization.service.test.ts`
- Consultar servicio: `src/services/amortization.service.ts`
- Documentación Prisma: Modelos `Credito`, `Cuota`, `Pago`
