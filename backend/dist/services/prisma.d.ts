import { PrismaClient } from '@prisma/client';
declare const prismaClientSingleton: () => PrismaClient<{
    log: ("info" | "query" | "warn" | "error")[];
}, "info" | "query" | "warn" | "error", import("@prisma/client/runtime/client").DefaultArgs>;
declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}
declare const prisma: PrismaClient<{
    log: ("info" | "query" | "warn" | "error")[];
}, "info" | "query" | "warn" | "error", import("@prisma/client/runtime/client").DefaultArgs>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map