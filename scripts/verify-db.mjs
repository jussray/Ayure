import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

const TLS_QUERY_PARAMETERS = ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert"];

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function databaseUrlWithoutTlsParameters(rawUrl) {
  const url = new URL(rawUrl);
  for (const key of TLS_QUERY_PARAMETERS) url.searchParams.delete(key);
  return url.toString();
}

function sslConfig() {
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n").trim();
  return ca ? { ca } : {};
}

function pool(rawUrl) {
  return new Pool({
    connectionString: databaseUrlWithoutTlsParameters(rawUrl),
    ssl: sslConfig(),
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
  });
}

async function expectInsufficientPrivilege(label, operation) {
  try {
    await operation();
  } catch (error) {
    if (error?.code === "42501") {
      console.log(`PASS ${label}: insufficient privilege`);
      return;
    }
    throw error;
  }
  throw new Error(`${label} unexpectedly succeeded`);
}

const runtime = pool(requiredEnv("DATABASE_URL"));
const migrator = pool(requiredEnv("MIGRATION_DATABASE_URL"));
const receipt = `ayure-privilege-${randomUUID()}`;

try {
  const identity = await runtime.query("SELECT current_user, session_user");
  assert.equal(identity.rows[0]?.current_user, "ayure_app");
  assert.equal(identity.rows[0]?.session_user, "ayure_app");
  console.log("PASS runtime identity: ayure_app / ayure_app");

  const tls = await runtime.query(`
    SELECT ssl, version, cipher, bits
    FROM pg_catalog.pg_stat_ssl
    WHERE pid = pg_backend_pid()
  `);
  const tlsRow = tls.rows[0];
  assert.equal(tlsRow?.ssl, true);
  assert.ok(tlsRow?.version);
  assert.ok(tlsRow?.cipher);
  assert.ok(Number(tlsRow?.bits) > 0);
  console.log(`PASS TLS: ${tlsRow.version} ${tlsRow.cipher} ${tlsRow.bits}-bit`);

  const membership = await migrator.query(`
    SELECT 1
    FROM pg_catalog.pg_auth_members membership
    JOIN pg_catalog.pg_roles member_role ON member_role.oid = membership.member
    WHERE member_role.rolname = 'ayure_app'
  `);
  assert.equal(membership.rowCount, 0);
  console.log("PASS role memberships: 0");

  const role = await migrator.query(`
    SELECT
      rolsuper,
      rolinherit,
      rolcreaterole,
      rolcreatedb,
      rolcanlogin,
      rolreplication,
      rolbypassrls
    FROM pg_catalog.pg_roles
    WHERE rolname = 'ayure_app'
  `);
  assert.equal(role.rowCount, 1);
  assert.deepEqual(role.rows[0], {
    rolsuper: false,
    rolinherit: false,
    rolcreaterole: false,
    rolcreatedb: false,
    rolcanlogin: true,
    rolreplication: false,
    rolbypassrls: false,
  });
  console.log("PASS runtime role flags");

  const inserted = await runtime.query(
    `
      INSERT INTO public.ayure_leads (role, name, email, goal, receipt, status)
      VALUES ($1, $2, $3, $4, $5, 'received')
      RETURNING receipt, status, created_at
    `,
    ["buyer", "Privilege Test", "privilege-test@example.com", "Verify runtime restrictions", receipt],
  );
  assert.equal(inserted.rowCount, 1);
  assert.equal(inserted.rows[0]?.receipt, receipt);
  assert.equal(inserted.rows[0]?.status, "received");
  assert.ok(inserted.rows[0]?.created_at);
  console.log("PASS runtime INSERT ... RETURNING");

  const allowedSelect = await runtime.query(
    "SELECT receipt, status, created_at FROM public.ayure_leads WHERE receipt = $1",
    [receipt],
  );
  assert.equal(allowedSelect.rowCount, 1);
  console.log("PASS column-scoped SELECT");

  await expectInsufficientPrivilege("SELECT id", () =>
    runtime.query("SELECT id FROM public.ayure_leads WHERE receipt = $1", [receipt]),
  );

  await expectInsufficientPrivilege("SELECT PII", () =>
    runtime.query("SELECT name, email, goal FROM public.ayure_leads WHERE receipt = $1", [receipt]),
  );

  await expectInsufficientPrivilege("UPDATE", () =>
    runtime.query("UPDATE public.ayure_leads SET status = 'reviewed' WHERE receipt = $1", [receipt]),
  );

  await expectInsufficientPrivilege("DELETE", () =>
    runtime.query("DELETE FROM public.ayure_leads WHERE receipt = $1", [receipt]),
  );

  const cleaned = await migrator.query("DELETE FROM public.ayure_leads WHERE receipt = $1", [receipt]);
  assert.equal(cleaned.rowCount, 1);
  console.log("PASS migrator cleanup");

  console.log("AYURE database proof complete");
} finally {
  await Promise.allSettled([runtime.end(), migrator.end()]);
}
