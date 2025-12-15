/**
 * ============================================================================
 * Sistema MLF - Configuración de Base de Datos
 * Archivo: src/config/database.ts
 * Descripción: Configuración y conexión con PostgreSQL via Prisma
 * ============================================================================
 */
import { PrismaClient } from '@prisma/client';
declare const prismaClientSingleton: () => PrismaClient<{
    log: ({
        emit: "event";
        level: "query";
    } | {
        emit: "event";
        level: "error";
    } | {
        emit: "event";
        level: "warn";
    })[];
}, "error" | "warn" | "query", import("@prisma/client/runtime/library").DefaultArgs>;
declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}
declare const prisma: PrismaClient<{
    log: ({
        emit: "event";
        level: "query";
    } | {
        emit: "event";
        level: "error";
    } | {
        emit: "event";
        level: "warn";
    })[];
}, "error" | "warn" | "query", import("@prisma/client/runtime/library").DefaultArgs>;
/**
 * Conectar a la base de datos
 */
export declare const connectDatabase: () => Promise<void>;
/**
 * Desconectar de la base de datos
 */
export declare const disconnectDatabase: () => Promise<void>;
/**
 * Verificar salud de la base de datos
 */
export declare const checkDatabaseHealth: () => Promise<boolean>;
export { prisma };
export default prisma;
//# sourceMappingURL=database.d.ts.map