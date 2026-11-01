import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { sanitizeDatabaseUrl } from "../lib/db/postgres-config";

// Set ONLY for an isolated, freshly migrated disposable PostgreSQL test DB.
const url = process.env.AYURE_PG_TEST_DATABASE_URL;
test.skip(!url, "Needs a fresh migrated PostgreSQL test database (not production)");
test("node-postgres TLS proof and runtime least privilege", async () => {
  const pool = new Pool({ connectionString: sanitizeDatabaseUrl(url!), ssl: {}, max: 1 });
  const client = await pool.connect();
  try {
    const proof = await client.query<{ ssl: boolean }>("SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()");
    expect(proof.rows[0]?.ssl).toBe(true);
    const receipt = `ayure-join-${randomUUID()}`;
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO public.ayure_leads (role,name,email,goal,receipt) VALUES ($1,$2,$3,$4,$5) RETURNING receipt,status,created_at",
      ["operator", "Test Operator", "test-operator@example.com", "Improve property operations", receipt],
    );
    expect(result.rows[0].receipt).toBe(receipt);
    expect(result.rows[0].status).toBe("received");
    const granted = await client.query("SELECT receipt,status,created_at FROM public.ayure_leads WHERE receipt=$1", [receipt]);
    expect(granted.rows).toHaveLength(1);
    for (const restricted of [
      "SELECT name,email,goal,id FROM public.ayure_leads",
      "UPDATE public.ayure_leads SET status='reviewed' WHERE receipt=$1",
      "DELETE FROM public.ayure_leads WHERE receipt=$1",
    ]) {
      await client.query("SAVEPOINT privilege_probe");
      await expect(client.query(restricted, [receipt])).rejects.toThrow();
      await client.query("ROLLBACK TO SAVEPOINT privilege_probe");
      await client.query("RELEASE SAVEPOINT privilege_probe");
    }
    await client.query("ROLLBACK");
  } finally {
    client.release();
    await pool.end();
  }
});
test("DB-unavailable is detected from a separate Node process", () => {
  const child = spawnSync(process.execPath, ["-e", `
    const { Pool } = require('pg');
    const pool = new Pool({connectionString:'postgresql://localhost:1/ayure',ssl:{},connectionTimeoutMillis:1000});
    pool.query('SELECT 1').then(()=>process.exit(2)).catch(()=>process.exit(0));
  `], { timeout: 5_000 });
  expect(child.status).toBe(0);
});
