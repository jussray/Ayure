import { randomUUID } from "node:crypto";
import { setDefaultResultOrder } from "node:dns";
import { spawnSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { sanitizeDatabaseUrl } from "../lib/db/postgres-config";

// Set ONLY for an isolated, freshly migrated disposable PostgreSQL test DB.
const url = process.env.AYURE_PG_TEST_DATABASE_URL;
test("node-postgres TLS proof and runtime least privilege", async () => {
  test.skip(!url, "Needs a freshly migrated isolated PostgreSQL test database (not production)");
  const pool = new Pool({ connectionString: sanitizeDatabaseUrl(url!), ssl: {}, max: 1 });
  const client = await pool.connect();
  try {
    const proof = await client.query<{ ssl: boolean }>("SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()");
    expect(proof.rows[0]?.ssl).toBe(true);
    const identity = await client.query<{ role: string }>("SELECT current_user AS role");
    expect(identity.rows[0]?.role).toBe("ayure_app");
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
      "SELECT name FROM public.ayure_leads WHERE receipt=$1",
      "SELECT email FROM public.ayure_leads WHERE receipt=$1",
      "SELECT goal FROM public.ayure_leads WHERE receipt=$1",
      "SELECT id FROM public.ayure_leads WHERE receipt=$1",
      "UPDATE public.ayure_leads SET status='reviewed' WHERE receipt=$1",
      "DELETE FROM public.ayure_leads WHERE receipt=$1",
    ]) {
      await client.query("SAVEPOINT privilege_probe");
      await expect(client.query(restricted, [receipt])).rejects.toMatchObject({ code: "42501" });
      await client.query("ROLLBACK TO SAVEPOINT privilege_probe");
      await client.query("RELEASE SAVEPOINT privilege_probe");
    }
    await client.query("ROLLBACK");
  } finally {
    client.release();
    await pool.end();
  }
});
test("TLS hostname mismatch fails closed", async () => {
  const mismatch = process.env.AYURE_PG_CI_HOSTNAME_MISMATCH_URL;
  test.skip(!mismatch, "Needs the short-lived CI certificate and trusted test CA");
  setDefaultResultOrder("ipv4first");
  const pool = new Pool({
    connectionString: sanitizeDatabaseUrl(mismatch!),
    ssl: { servername: "unauthorized-hostname.ayure.invalid" },
    connectionTimeoutMillis: 5_000,
  });
  try {
    await expect(pool.query("SELECT 1")).rejects.toMatchObject({ code: "ERR_TLS_CERT_ALTNAME_INVALID" });
  } finally {
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
