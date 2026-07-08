import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot-reloads / server modules to avoid
// exhausting the Postgres connection pool in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Re-export generated types + enums (Role, Prisma, etc.) so consumers import from "@repo/db".
export * from "@prisma/client";
