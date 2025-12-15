/**
 * ============================================================================
 * Sistema MLF - Setup de Tests
 * Archivo: src/__tests__/setup.ts
 * Descripción: Configuración inicial para Jest
 * ============================================================================
 */
// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/mlf_test';
process.env.JWT_SECRET = 'test_secret_key_for_testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BCRYPT_ROUNDS = '4'; // Menor para tests más rápidos
// Mock de logger para tests
jest.mock('../config/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
}));
// Configurar timeout global
jest.setTimeout(10000);
// Limpiar mocks después de cada test
afterEach(() => {
    jest.clearAllMocks();
});
//# sourceMappingURL=setup.js.map