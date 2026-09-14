import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * One Prisma client for the process.
 *
 * Since Prisma 7 the client connects through a driver adapter rather than its
 * own engine, so this is node-postgres underneath — a normal pool, with normal
 * pool settings, which is what makes it behave predictably behind a serverless
 * platform or a connection pooler.
 *
 * Next's dev server reloads modules on every edit; without the global handle
 * each reload would open a fresh pool and Postgres would refuse connections
 * after a few dozen saves. In production the module is evaluated once and the
 * global is never touched.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it at a Postgres " +
        "database — `docker compose up -d db` starts one locally. See the README."
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? create();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
