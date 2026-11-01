import "server-only";
import { Pool } from "pg";
import { PG_POOL_MAX_PER_ISOLATE, sanitizeDatabaseUrl } from "./postgres-config";

// One pool per warm server/Worker isolate. This is NOT a deployment-wide limit.
declare global {
  var __ayurePostgresPool: Pool | undefined;
  var __ayurePostgresPoolUrl: string | undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function requireAyurePool(): Pool {
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL is not configured");
  const connectionString = sanitizeDatabaseUrl(process.env.DATABASE_URL!);
  if (globalThis.__ayurePostgresPool && globalThis.__ayurePostgresPoolUrl !== connectionString) {
    throw new Error("DATABASE_URL changed within an active PostgreSQL pool");
  }
  if (!globalThis.__ayurePostgresPool) {
    globalThis.__ayurePostgresPool = new Pool({
      connectionString,
      ssl: {}, // Node trust store + hostname verification. NEVER rejectUnauthorized:false.
      max: PG_POOL_MAX_PER_ISOLATE,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      allowExitOnIdle: true,
    });
    globalThis.__ayurePostgresPoolUrl = connectionString;
  }
  return globalThis.__ayurePostgresPool;
}
