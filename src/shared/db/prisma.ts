import { PrismaClient } from "@prisma/client";

type HrisPrismaGlobal = typeof globalThis & { __phHrisPrisma?: PrismaClient };
const globalForPrisma = globalThis as HrisPrismaGlobal;
const mode = (process.env.APP_MODE ?? (process.env.NODE_ENV === "production" ? "LIVE" : "DEV")).trim().toUpperCase();

if (mode !== "DEV" && mode !== "LIVE") throw new Error('APP_MODE must be "DEV" or "LIVE".');
if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build" && mode !== "LIVE") {
  throw new Error("Production must run with APP_MODE=LIVE.");
}

function createPrismaClient() {
  const log = process.env.NODE_ENV === "development" ? (["warn", "error"] as const) : (["error"] as const);
  if (mode === "DEV") {
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error("Prisma is disabled in APP_MODE=DEV. Use the in-code demo repository or set APP_MODE=LIVE.");
      },
    });
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("APP_MODE=LIVE requires DATABASE_URL to point to PostgreSQL.");
  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new Error("APP_MODE=LIVE requires DATABASE_URL to use a PostgreSQL connection URL.");
  }

  return new PrismaClient({ log: [...log], datasources: { db: { url: databaseUrl } } });
}

export const prisma = globalForPrisma.__phHrisPrisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.__phHrisPrisma = prisma;
