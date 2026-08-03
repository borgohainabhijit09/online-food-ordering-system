"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectPrisma = void 0;
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ override: true });
// Module-level reference to the pool so we can close it during graceful shutdown.
// Prisma's built-in $disconnect() does NOT close the underlying pg Pool when using
// driver adapters, so we must do it ourselves.
let pgPool = null;
const prismaClientSingleton = () => {
    // IMPORTANT: Keep max:2 for Supabase free tier (hard limit of 15 session connections).
    // We use DIRECT_URL (port 5432) because Prisma 7 with adapter-pg sends prepared statements
    // which can hang in Transaction Mode (port 6543) depending on Supavisor config.
    pgPool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
        max: 2,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 8000,
        allowExitOnIdle: true,
    });
    const adapter = new adapter_pg_1.PrismaPg(pgPool);
    return new client_1.PrismaClient({
        adapter,
        log: ['warn', 'error'],
    });
};
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
globalThis.pgPoolGlobal = globalThis.pgPoolGlobal ?? pgPool ?? undefined;
/**
 * Cleanly disconnects Prisma and closes the underlying pg connection pool.
 * Called by the graceful shutdown hooks in index.ts.
 */
const disconnectPrisma = async () => {
    try {
        await prisma.$disconnect();
        const pool = globalThis.pgPoolGlobal ?? pgPool;
        if (pool) {
            await pool.end();
            console.log('[prisma]: PostgreSQL connection pool closed.');
        }
    }
    catch (err) {
        console.error('[prisma]: Error during database disconnect:', err);
    }
};
exports.disconnectPrisma = disconnectPrisma;
exports.default = prisma;
if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
}
//# sourceMappingURL=prisma.js.map