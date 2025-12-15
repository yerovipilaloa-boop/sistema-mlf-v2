# Guía de Testing - Sistema MLF

## 📋 Índice

1. [Estrategia de Testing](#estrategia-de-testing)
2. [Tests Unitarios](#tests-unitarios)
3. [Tests de Integración](#tests-de-integración)
4. [Ejecución de Tests](#ejecución-de-tests)
5. [Cobertura](#cobertura)
6. [Best Practices](#best-practices)

---

## 🎯 Estrategia de Testing

### Pirámide de Testing

```
        /\
       /  \    E2E Tests (10%)
      /____\   - Flujos completos
     /      \  Integration Tests (30%)
    /________\ - APIs + Base de datos
   /          \
  /____________\ Unit Tests (60%)
                 - Servicios + Lógica de negocio
```

### Objetivos

- **Cobertura mínima:** 80%
- **Tests unitarios:** Todas las reglas de negocio
- **Tests de integración:** Flujos críticos
- **Tests E2E:** Casos de uso principales

---

## 🧪 Tests Unitarios

### Estructura

```
backend/src/services/__tests__/
├── amortization.service.test.ts  ✅ 50+ tests
├── socios.service.test.ts        ✅ 30+ tests
├── creditos.service.test.ts      ✅ 25+ tests
├── garantias.service.test.ts     ✅ 20+ tests
├── pagos.service.test.ts         ✅ 15+ tests
└── utilidades.service.test.ts    ⏳ Pendiente
```

### Servicios Testeados

#### 1. AmortizationService ✅ (Completo)

**Tests:** 50+
**Cobertura:** ~95%

**Casos cubiertos:**
- Método Francés (cuota fija)
- Método Alemán (capital fijo)
- Cálculo de mora
- Distribución de pagos
- Prepagos
- Casos extremos

**Ejemplo:**
```typescript
describe('Método Francés', () => {
  it('debe calcular cuota fija correctamente', () => {
    const tabla = amortizationService.calcularTablaAmortizacion({
      montoTotal: 1000,
      tasaInteresAnual: 18,
      plazoMeses: 12,
      metodo: 'FRANCES',
    });

    expect(tabla.cuotas[0].montoCuota).toBeCloseTo(91.68, 2);
    expect(tabla.resumen.totalCapital).toBe(1000);
  });
});
```

#### 2. SociosService ✅ (Completo)

**Tests:** 30+
**Cobertura estimada:** ~85%

**Casos cubiertos:**
- **Creación de socios:**
  - ✅ RN-SOC-001: Validación de cédula
  - ✅ RN-SOC-002: Mayor de 18 años
  - ✅ RN-SOC-003: No duplicados
  - ✅ RN-SOC-005: Depósito mínimo
  - ✅ RN-SOC-007: 2 recomendadores
  - ✅ RN-SOC-008: Recomendadores Etapa 3 ACTIVOS

- **Gestión de ahorros:**
  - ✅ RN-AHO-001: Depósitos válidos
  - ✅ RN-AHO-002: Ahorro mínimo $10
  - ✅ RN-AHO-003: No retirar ahorro congelado

- **Gestión de estado:**
  - ✅ Suspender/reactivar
  - ✅ Cambio de etapas
  - ✅ Listar con filtros

**Ejemplo:**
```typescript
describe('crearSocio', () => {
  it('debe rechazar cédula inválida (RN-SOC-001)', async () => {
    await expect(
      sociosService.crearSocio({
        ...mockData,
        documentoIdentidad: '1234567890', // Inválida
      })
    ).rejects.toThrow(/cédula.*inválida/i);
  });
});
```

#### 3. CreditosService ✅ (Completo)

**Tests:** 25+
**Cobertura estimada:** ~80%

**Casos cubiertos:**
- **Solicitud:**
  - ✅ RN-CRE-002: Límites por etapa
  - ✅ RN-CRE-003: Bloqueo con mora
  - ✅ RN-CRE-005: Prima de seguro 1%
  - ✅ RN-ETA-004: Límites progresivos Etapa 1

- **Aprobación/Desembolso:**
  - ✅ Generación de tabla de amortización
  - ✅ Creación de cuotas
  - ✅ Registro en fondo de seguro
  - ✅ Incremento de contador

- **Rechazo:**
  - ✅ Validación de motivo

**Ejemplo:**
```typescript
it('debe rechazar si excede límite (RN-CRE-002)', async () => {
  await expect(
    creditosService.solicitarCredito({
      socioId: 123,
      montoSolicitado: 11000, // Excede 200% = $10,000
      ...
    })
  ).rejects.toThrow(/límite.*excedido/i);
});
```

#### 4. GarantiasService ✅ (Completo)

**Tests:** 20+
**Cobertura estimada:** ~85%

**Casos cubiertos:**
- **Creación:**
  - ✅ RN-GAR-002: Exactamente 2 garantes
  - ✅ RN-GAR-003: Solo Etapa 3 ACTIVOS
  - ✅ RN-GAR-004: Congelación 10%
  - ✅ RN-GAR-005: Máximo 3 garantizados

- **Liberación:**
  - ✅ RN-GAR-006: 50%+ completado sin mora
  - ✅ RN-GAR-007: Aprobación/rechazo

- **Ejecución:**
  - ✅ RN-GAR-008: Ejecución al día 91

**Ejemplo:**
```typescript
it('debe congelar 10% del monto (RN-GAR-004)', async () => {
  await garantiasService.crearGarantias({
    creditoId: 45,
    garantesIds: [78, 92],
  });

  expect(prisma.garantia.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        montoCongelado: 500, // 10% de $5000
      }),
    })
  );
});
```

#### 5. PagosService ✅ (Completo)

**Tests:** 15+
**Cobertura estimada:** ~75%

**Casos cubiertos:**
- **Registro de pagos:**
  - ✅ RN-PAG-001: Distribución Mora → Interés → Capital
  - ✅ Actualización de estado de cuotas
  - ✅ Detección de completitud

- **Morosidad:**
  - ✅ RN-MOR-001: Cálculo 1% diario
  - ✅ RN-MOR-002: Clasificación en 5 niveles
  - ✅ RN-MOR-003: Castigo día 90

**Ejemplo:**
```typescript
it('debe clasificar mora en niveles (RN-MOR-002)', () => {
  expect(clasificarMora(10)).toBe('MORA_LEVE');
  expect(clasificarMora(20)).toBe('MORA_MODERADA');
  expect(clasificarMora(45)).toBe('MORA_GRAVE');
  expect(clasificarMora(75)).toBe('MORA_PERSISTENTE');
  expect(clasificarMora(95)).toBe('CASTIGADO');
});
```

#### 6. UtilidadesService ⏳ (Pendiente)

**Tests recomendados:**
- Cálculo de ahorro promedio semestral
- Distribución 1% correcto
- Solo socios ACTIVOS participan
- Acreditación automática
- Historial por socio

---

## 🔗 Tests de Integración

### ✅ Tests E2E Implementados

#### 1. Flujo Completo: Socio → Crédito → Pago

**Archivo:** `src/__tests__/integration/flujo-completo.test.ts`
**Descripción:** Valida el flujo completo desde creación de socio hasta completar crédito

**Pasos testeados:**
1. ✅ Crear recomendadores (Etapa 3 ACTIVOS)
2. ✅ Crear garantes (Etapa 3 ACTIVOS)
3. ✅ Crear nuevo socio con validaciones (RN-SOC-001 a RN-SOC-008)
4. ✅ Depositar ahorro adicional (RN-AHO-001)
5. ✅ Solicitar crédito con límite por etapa (RN-CRE-002, RN-ETA-004)
6. ✅ Aprobar crédito
7. ✅ Asignar 2 garantías con 10% congelado (RN-GAR-002, RN-GAR-004)
8. ✅ Desembolsar crédito y generar tabla de amortización
9. ✅ Registrar pagos mensuales (24 cuotas)
10. ✅ Verificar crédito COMPLETADO y garantías liberadas

**Reglas de negocio validadas:**
- RN-SOC-001 a RN-SOC-008 (Creación de socios)
- RN-AHO-001 (Depósitos válidos)
- RN-CRE-002, RN-CRE-005 (Límites y prima de seguro)
- RN-GAR-002, RN-GAR-003, RN-GAR-004, RN-GAR-006 (Garantías)
- RN-PAG-001 (Distribución de pagos)

**Ejemplo:**
```typescript
describe('E2E: Flujo Completo Socio → Crédito → Pago', () => {
  it('debe completar flujo completo con todas las validaciones', async () => {
    // 1. Crear socio con recomendadores
    const socio = await sociosService.crearSocio({
      documentoIdentidad: '1712345678',
      nombreCompleto: 'Juan Pérez López',
      depositoInicial: 500,
      recomendadoresIds: [recomendador1Id, recomendador2Id],
    });

    // 2. Depositar ahorro adicional
    await sociosService.depositarAhorro({
      socioId: socio.id,
      monto: 2000,
    });

    // 3-8. Solicitar, aprobar, garantías, desembolsar...
    // 9. Registrar pagos hasta completar
    // 10. Verificar estado final

    expect(credito.estado).toBe(EstadoCredito.COMPLETADO);
    expect(garantias[0].estado).toBe('LIBERADA');
  });
});
```

---

#### 2. Flujo de Morosidad y Ejecución de Garantías

**Archivo:** `src/__tests__/integration/flujo-morosidad.test.ts`
**Descripción:** Valida cálculo de mora, clasificación y ejecución de garantías

**Escenarios testeados:**
1. ✅ Mora Leve (1-15 días) - Cálculo 1% diario (RN-MOR-001)
2. ✅ Mora Moderada (16-30 días)
3. ✅ Mora Grave (31-60 días)
4. ✅ Mora Persistente (61-89 días)
5. ✅ Castigo al día 90 (RN-MOR-003)
6. ✅ Ejecución de garantías al día 91 (RN-GAR-008)
7. ✅ Pago parcial con distribución Mora → Interés → Capital (RN-PAG-001)
8. ✅ Pago total con mora acumulada

**Reglas de negocio validadas:**
- RN-MOR-001: Mora 1% diario sobre monto adeudado
- RN-MOR-002: Clasificación en 5 niveles
- RN-MOR-003: Castigo automático día 90
- RN-GAR-008: Ejecución automática día 91
- RN-PAG-001: Distribución correcta de pagos

**Ejemplo:**
```typescript
describe('E2E: Flujo de Morosidad', () => {
  it('debe calcular mora 1% diario y ejecutar garantías día 91', async () => {
    // Mora día 10: $250 * 0.01 * 10 = $25
    const diasMora = 10;
    const montoMora = montoCuota * 0.01 * diasMora;
    expect(montoMora).toBeCloseTo(25, 2);

    // Clasificación
    expect(clasificacion).toBe(ClasificacionMora.MORA_LEVE);

    // Día 91: Ejecutar garantías
    const resultado = await garantiasService.ejecutarGarantias({
      creditoId,
      motivo: 'Ejecución automática por mora día 91',
    });

    expect(resultado.garantiasEjecutadas).toBe(2);
    expect(resultado.montoTotalEjecutado).toBeCloseTo(500, 2);
  });
});
```

---

#### 3. Flujo de Utilidades Semestrales

**Archivo:** `src/__tests__/integration/flujo-utilidades.test.ts`
**Descripción:** Valida cálculo y distribución de utilidades semestrales

**Pasos testeados:**
1. ✅ Crear múltiples socios con ahorros variados
2. ✅ Simular transacciones durante 6 meses
3. ✅ Calcular ahorro promedio semestral por socio
4. ✅ Calcular 1% sobre ahorro promedio (RN-UTI-002)
5. ✅ Distribuir solo a socios ACTIVOS (RN-UTI-003)
6. ✅ Acreditar utilidades automáticamente (RN-UTI-004)
7. ✅ Verificar historial de utilidades
8. ✅ Excluir socios NO ACTIVOS

**Reglas de negocio validadas:**
- RN-UTI-001: Distribución semestral
- RN-UTI-002: 1% sobre ahorro promedio
- RN-UTI-003: Solo socios ACTIVOS
- RN-UTI-004: Acreditación automática

**Ejemplo:**
```typescript
describe('E2E: Flujo de Utilidades', () => {
  it('debe calcular promedio de 6 meses y distribuir 1%', async () => {
    // Saldos mensuales: [5000, 5500, 6000, 5800, 6200, 6500]
    const promedio = 5833.33;
    const utilidad = promedio * 0.01; // $58.33

    const resultado = await utilidadesService.calcularYDistribuirUtilidades({
      año: 2025,
      semestre: 1,
    });

    expect(resultado.sociosParticipantes).toBe(4);
    expect(resultado.totalDistribuido).toBeCloseTo(343.33, 2);

    // Verificar acreditación
    const socio = await prisma.socio.findUnique({ where: { id: 1 } });
    expect(socio.ahorroActual).toBeCloseTo(6558.33, 2);
  });
});
```

---

## ▶️ Ejecución de Tests

### Comandos Disponibles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar con cobertura
npm run test

# Modo watch (desarrollo)
npm run test:watch

# Ejecutar tests de un archivo específico
npm test socios.service.test

# Ejecutar con verbose
npm test -- --verbose

# Ver cobertura en HTML
npm test -- --coverage --coverageReporters=html
# Abrir: coverage/index.html
```

### Configuración Jest

**jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## 📊 Cobertura

### Estado Actual

| Módulo | Tests | Cobertura Estimada | Estado |
|--------|-------|-------------------|--------|
| **AmortizationService** | 50+ | ~95% | ✅ Completo |
| **SociosService** | 30+ | ~85% | ✅ Completo |
| **CreditosService** | 25+ | ~80% | ✅ Completo |
| **GarantiasService** | 20+ | ~85% | ✅ Completo |
| **PagosService** | 15+ | ~75% | ✅ Completo |
| **CasosExtremosService** | 10+ | ~80% | ✅ Completo |
| **NotificacionesService** | - | Mock | ⚠️ Básico |
| **UtilidadesService** | - | Mock | ⚠️ Básico |
| **AuthService** | - | Mock | ⚠️ Básico |

**Tests Unitarios:** ~150 tests | **Cobertura estimada:** ~75%

**Tests E2E:** 3 suites completas
- ✅ Flujo Completo (Socio → Crédito → Pago): 10 pasos validados
- ✅ Flujo Morosidad (5 niveles + ejecución): 8 escenarios
- ✅ Flujo Utilidades (cálculo semestral): 8 validaciones

**Total general:** ~150+ tests | **Cobertura global:** ~75%

### Meta

- **Cobertura objetivo:** 85%+
- **Tests faltantes:** ~50
- **Tiempo estimado:** 1-2 días

---

## ✅ Best Practices

### 1. Estructura de Tests

```typescript
describe('NombreServicio', () => {
  // Setup común
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('nombreMetodo', () => {
    it('debe hacer X cuando Y', async () => {
      // Arrange
      const input = { ... };
      mockDependency.method.mockResolvedValue(...);

      // Act
      const resultado = await service.method(input);

      // Assert
      expect(resultado).toBeDefined();
      expect(mockDependency.method).toHaveBeenCalledWith(...);
    });

    it('debe rechazar cuando Z', async () => {
      // Arrange
      const inputInvalido = { ... };

      // Act & Assert
      await expect(
        service.method(inputInvalido)
      ).rejects.toThrow(/mensaje esperado/i);
    });
  });
});
```

### 2. Nomenclatura

- **Describe:** `describe('NombreServicio', ...)`
- **Método:** `describe('nombreMetodo', ...)`
- **Caso:** `it('debe [acción] cuando [condición]', ...)`

### 3. Mocking

```typescript
// Mock de dependencias externas
jest.mock('../../config/database');
jest.mock('../../config/logger');

// Mock de servicios
jest.mock('../otro.service', () => ({
  method: jest.fn(),
}));
```

### 4. Assertions Comunes

```typescript
// Valores
expect(valor).toBe(5);
expect(valor).toEqual({ a: 1 });
expect(valor).toBeDefined();
expect(valor).toBeNull();

// Números
expect(valor).toBeCloseTo(10.5, 2);
expect(valor).toBeGreaterThan(5);

// Strings
expect(string).toMatch(/regex/i);
expect(string).toContain('substring');

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);

// Excepciones
await expect(fn()).rejects.toThrow();
await expect(fn()).rejects.toThrow(/mensaje/i);

// Mocks
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(3);
expect(mockFn).toHaveBeenCalledWith(...args);
expect(mockFn).toHaveBeenCalledWith(
  expect.objectContaining({ ... })
);
```

### 5. Tests de Reglas de Negocio

```typescript
// Nombrar con el código de regla
it('debe rechazar cédula inválida (RN-SOC-001)', async () => {
  // Test específico de RN-SOC-001
});

it('debe calcular prima 1% (RN-CRE-005, RN-SEG-001)', async () => {
  // Test que valida múltiples reglas relacionadas
});
```

### 6. Datos de Prueba

```typescript
// Crear mocks reutilizables
const mockSocioActivo = {
  id: 123,
  estado: EstadoSocio.ACTIVO,
  etapaActual: 2,
  ahorroActual: { toNumber: () => 5000 },
};

const mockCreditoAprobado = {
  id: 45,
  estado: EstadoCredito.APROBADO,
  montoTotal: 5000,
};
```

---

## 🐛 Debugging Tests

### Ver output detallado

```bash
npm test -- --verbose --no-coverage
```

### Ejecutar un solo test

```typescript
it.only('debe testear esto específicamente', () => {
  // ...
});
```

### Skip temporal

```typescript
it.skip('test a arreglar después', () => {
  // ...
});
```

### Console.log en tests

```typescript
it('test con debug', () => {
  console.log('Debug info:', value);
  expect(value).toBe(5);
});
```

---

## 📝 Checklist de Testing

### Antes de Commit

- [ ] Todos los tests pasan
- [ ] Cobertura > 80% en archivos modificados
- [ ] No hay tests skipped (.skip)
- [ ] No hay tests only (.only)
- [ ] Mocks limpiados en beforeEach
- [ ] Tests nombrados descriptivamente
- [ ] Reglas de negocio referenciadas (RN-XXX-YYY)

### Antes de PR

- [ ] Suite completa de tests pasa
- [ ] Cobertura global > 80%
- [ ] Tests de integración actualizados
- [ ] Documentación de testing actualizada

---

## 🚀 Próximos Pasos

### ✅ Completado
1. ✅ Completar tests unitarios de servicios principales (150+ tests)
2. ✅ Completar tests de CasosExtremosService
3. ✅ Tests de integración E2E (3 suites completas)
4. ✅ Alcanzar 75%+ de cobertura

### Mediano Plazo (1-2 semanas)
5. ⏳ Tests de NotificacionesService (unitarios)
6. ⏳ Tests de UtilidadesService (unitarios completos)
7. ⏳ Tests de AuthService (unitarios)
8. ⏳ Alcanzar 85%+ de cobertura global

### Largo Plazo
9. ⏳ Tests de performance (carga de 1000+ socios)
10. ⏳ Tests de seguridad (OWASP Top 10)
11. ⏳ Tests de carga y stress
12. ⏳ CI/CD con tests automáticos en GitHub Actions

---

## 📈 Progreso de Testing

**Estado actual:**
- ✅ Tests unitarios: 150+ tests (~75% cobertura)
- ✅ Tests E2E: 3 suites completas (26+ escenarios)
- ✅ Documentación completa
- ⏳ CI/CD: Pendiente

**Próxima meta:** 85%+ cobertura con tests de servicios faltantes

---

**Documentación actualizada:** 2025-01-20
**Versión:** 2.0.0
