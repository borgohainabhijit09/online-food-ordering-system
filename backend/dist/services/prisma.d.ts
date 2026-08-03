import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
declare const prismaClientSingleton: () => PrismaClient<{
    adapter: PrismaPg;
    log: ("warn" | "error")[];
}, "warn" | "error", import("@prisma/client/runtime/client").DefaultArgs>;
declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
    var pgPoolGlobal: undefined | Pool;
}
declare const prisma: PrismaClient<{
    adapter: PrismaPg;
    log: ("warn" | "error")[];
}, "warn" | "error", import("@prisma/client/runtime/client").DefaultArgs>;
/**
 * Cleanly disconnects Prisma and closes the underlying pg connection pool.
 * Called by the graceful shutdown hooks in index.ts.
 */
export declare const disconnectPrisma: () => Promise<void>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map