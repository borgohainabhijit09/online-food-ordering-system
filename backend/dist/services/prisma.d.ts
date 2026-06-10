import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
declare const prismaClientSingleton: () => PrismaClient<{
    adapter: PrismaPg;
    log: ("warn" | "error")[];
}, "warn" | "error", import("@prisma/client/runtime/client").DefaultArgs>;
declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}
declare const prisma: PrismaClient<{
    adapter: PrismaPg;
    log: ("warn" | "error")[];
}, "warn" | "error", import("@prisma/client/runtime/client").DefaultArgs>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map