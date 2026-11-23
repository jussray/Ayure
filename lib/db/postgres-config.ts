/**
 * Runtime PostgreSQL connections use the Cloudflare AYURE_HYPERDRIVE binding.
 * Hyperdrive owns upstream pooling and TLS verification. Do not override its
 * connection settings in the Worker driver.
 */
export type AyureHyperdriveEnv = {
  AYURE_HYPERDRIVE?: {
    connectionString?: string;
  };
};

export function getAyureHyperdriveConnectionString(env: unknown): string {
  if (!env || typeof env !== "object") {
    throw new Error("AYURE_HYPERDRIVE binding is unavailable");
  }
  const binding = (env as AyureHyperdriveEnv).AYURE_HYPERDRIVE;
  const raw = binding?.connectionString;
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("AYURE_HYPERDRIVE binding is unavailable");
  }

  const parsed = new URL(raw);
  if (![ "postgres:", "postgresql:" ].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error("AYURE_HYPERDRIVE returned an invalid PostgreSQL connection string");
  }
  return raw;
}

/**
 * Direct node-postgres URL sanitizer retained for isolated Node/CI TLS tests.
 * It is not used by the Cloudflare Worker runtime adapter.
 */
const prohibitedQueryKeys = new Set([
  "ssl", "sslmode", "sslcert", "sslkey", "sslrootcert", "uselibpqcompat",
]);

export function sanitizeDatabaseUrl(raw: string): string {
  if (!raw || !raw.trim()) throw new Error("DATABASE_URL is missing");
  const parsed = new URL(raw);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error("DATABASE_URL must be a PostgreSQL URL with a hostname");
  }
  if (Array.from(parsed.searchParams.keys()).some((key) => key.toLowerCase() === "host")) {
    throw new Error("DATABASE_URL must not override the host in query parameters");
  }
  for (const key of Array.from(parsed.searchParams.keys())) {
    if (prohibitedQueryKeys.has(key.toLowerCase())) parsed.searchParams.delete(key);
  }
  parsed.hash = "";
  return parsed.toString();
}
