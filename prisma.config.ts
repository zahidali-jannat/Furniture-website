import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

/**
 * Prisma's own configuration, separate from the schema since version 7.
 *
 * The connection URL lives here rather than in schema.prisma because the CLI is
 * the only thing that needs it — the application connects through a driver
 * adapter instead (see src/lib/db.ts). Keeping the two apart is what lets the
 * schema be committed without a credential in it.
 *
 * The CLI no longer reads .env files by itself, so they are loaded here, in the
 * order Next uses them: .env.local first and .env as the fallback, with the
 * first value found winning.
 */
loadEnv({ path: [".env.local", ".env"], quiet: true });

const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: { path: path.join("prisma", "migrations") },
  // Declared only when it is actually set, so `prisma generate` — which needs
  // no database at all — still runs on a machine that has not configured one.
  // `prisma migrate` without it fails with Prisma's own message, which says
  // more than a placeholder URL that cannot connect.
  ...(url ? { datasource: { url } } : {}),
});
