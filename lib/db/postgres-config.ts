/** PostgreSQL 16+ via node-postgres 8.x. TLS is configured only by Pool.ssl. */
export const PG_POOL_MAX_PER_ISOLATE = 2;

const prohibitedQueryKeys = new Set([
  "ssl", "sslmode", "sslcert", "sslkey", "sslrootcert", "uselibpqcompat",
]);

export function sanitizeDatabaseUrl(raw: string): string {
  if (!raw || !raw.trim()) throw new Error("DATABASE_URL is missing");
  const parsed = new URL(raw);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error("DATABASE_URL must be a PostgreSQL URL with a hostname");
  }
  // A query-string host could redirect the socket while TLS checks the URL host.
  if (Array.from(parsed.searchParams.keys()).some((key) => key.toLowerCase() === "host")) {
    throw new Error("DATABASE_URL must not override the host in query parameters");
  }
  for (const key of Array.from(parsed.searchParams.keys())) {
    if (prohibitedQueryKeys.has(key.toLowerCase())) parsed.searchParams.delete(key);
  }
  parsed.hash = "";
  return parsed.toString();
}
