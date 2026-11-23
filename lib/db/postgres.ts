import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Client } from "pg";
import { getAyureHyperdriveConnectionString } from "./postgres-config";

function requireAyureHyperdriveConnectionString(): string {
  const { env } = getCloudflareContext();
  return getAyureHyperdriveConnectionString(env);
}

export function isDatabaseConfigured(): boolean {
  try {
    requireAyureHyperdriveConnectionString();
    return true;
  } catch {
    return false;
  }
}

/**
 * OpenNext exposes the Worker binding through getCloudflareContext().
 * Hyperdrive owns the shared upstream pool, so create and close one pg Client
 * per request instead of caching a process-global Pool in a Worker isolate.
 */
export async function withAyurePostgresClient<T>(
  operation: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    connectionString: requireAyureHyperdriveConnectionString(),
    application_name: "ayure-worker",
    connectionTimeoutMillis: 5_000,
  });

  try {
    await client.connect();
    return await operation(client);
  } finally {
    // Also attempt cleanup after a failed connect; do not mask the original error.
    await client.end().catch(() => undefined);
  }
}
