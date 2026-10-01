import "server-only";
import { Pool, type PoolConfig } from "pg";

const TLS_QUERY_PARAMETERS = ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert"] as const;
const MAX_POOL_SIZE = 1;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured");
    this.name = "DatabaseNotConfiguredError";
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function databaseUrlWithoutTlsParameters(rawUrl: string): string {
  const url = new URL(rawUrl);

  for (const key of TLS_QUERY_PARAMETERS) {
    url.searchParams.delete(key);
  }

  return url.toString();
}

function databaseSslConfig(): PoolConfig["ssl"] {
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n").trim();
  return ca ? { ca } : {};
}

function createPool() {
  const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
  if (!rawDatabaseUrl) {
    throw new DatabaseNotConfiguredError();
  }

  return new Pool({
    connectionString: databaseUrlWithoutTlsParameters(rawDatabaseUrl),
    ssl: databaseSslConfig(),
    max: MAX_POOL_SIZE,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 5_000,
  });
}

declare global {
  // eslint-disable-next-line no-var
  var ayurePgPool: Pool | undefined;
}

export function getDb() {
  global.ayurePgPool ??= createPool();
  return global.ayurePgPool;
}
