# AYURE Join — staged PostgreSQL migration

**Status: staged dual-adapter code only; NOT cut over.** AYURE currently writes Join leads to Cloudflare D1 `AYURE_DB`. The old Supabase schema is historical; it is NOT the active Join writer. Preserve D1 and any Supabase history until source inventory and rollback are explicitly approved. Never point production at an empty PostgreSQL table.

## Release gates (tasks 0–10)

0. Read-only inventory: query `SELECT count(*), count(DISTINCT receipt) FROM ayure_leads` against production D1 with Wrangler; separately inspect historical Supabase only if it actually contains leads. D1's active table has a receipt PK but NO `id`; do not invent source IDs. Identify writer and snapshot time; protect lead PII.
1. Create a **dedicated** PostgreSQL 16+ database and run `0000_bootstrap.sql` as an authorized provider admin. Configure unique credentials for `ayure_migrator` and `ayure_app` out of band. Scope database access via provider network and pooler; database-level revocations on a shared provider database can break unrelated apps.
2. Connect **as `ayure_migrator`**. Run `SELECT version(), current_user; SELECT gen_random_uuid();` and verify PostgreSQL 16+ and schema CREATE privilege. No `pgcrypto` line is needed: UUID generation is core. On a **fresh empty DB**, run `0001_create_ayure_leads.sql` exactly once as migrator; never apply 0001 over existing lead rows. `receipt UNIQUE` is explicit.
3. Connect **as `ayure_app`** to a disposable migrated test database. Verify INSERT + RETURNING, SELECT on receipt/status/created_at, and expected failures for PII SELECT, UPDATE, and DELETE. Failure of permission checks blocks release. Do not remove the RETURNING column-grant to make tests pass.
4. Runtime reads only `DATABASE_URL`, never `DATABASE_URL_MIGRATIONS`. node-postgres **8.x pinned**; TLS from explicit `ssl: {}` only. URL TLS query options are stripped, never `rejectUnauthorized:false`. Verify both a valid CA/hostname connection and rejection of a bad hostname/certificate. Native `pg` sockets on Cloudflare Workers require a validated end-to-end Worker preview against the selected provider; do not assume Node local proof transfers.
5–6. Repository performs parameterized INSERT and returns only opaque receipt/status/date; /api/join enforces role, input bounds, true body-byte cap and honeypot. Node.js runtime.
7. Against a newly migrated disposable database, run `AYURE_PG_TEST_DATABASE_URL=... npm run test:e2e` and verify `SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()` returns `true` through node-postgres. This proves encryption, not identity checking, which requires the separate certificate rejection test. Bad-URL DB outage must fail closed. A real Cloudflare Worker preview + production-compatible database pooler is a distinct mandatory gate.
8. If D1 has rows: establish snapshot and repeatable export as authorized migrator, map D1 receipt/role/name/email/goal/status/created_at to PG, generate new UUID ids, reconcile counts, distinct receipts and new distinct ids. Use unique receipt to guard repeated imports. Quiesce D1 writer for final delta and reconcile again. If historical Supabase rows exist, separately classify and deduplicate before importing. **No automated export of personal information is included.**
9. Deploy only after the migration is validated; configure `DATABASE_URL` as a **Cloudflare Worker secret** and explicitly set non-secret `AYURE_LEADS_STORAGE=postgres` only at the approved cutover. The default writer stays D1 even when a URL is present, to prevent accidental split-brain. Retire the D1 adapter only in a separately approved release. Canary from the actual production UI, verify receipt persisted in PG using scoped migrator readback, and monitor failures.
10. Cut over only with founder authorization, verified rollback and restorability, volume + 5xx alerts, edge/API rate limiting, and incident plan. Preserve the old source read-only at least seven days. Archive and delete ONLY with separate explicit approval after backup/restore proof.

## Privilege and capacity warnings

The `ayure_app` grant is column-scoped, not row-scoped: it can SELECT receipt/status/created_at across all rows. It cannot read name/email/goal/id. Future tables must get explicit grants: NEVER set default table-wide SELECT privileges. `0000` uses `FOR ROLE ayure_migrator IN SCHEMA public` to avoid configuring the administrator's default grants.

Connection pool `max=2` is **per warm isolate**, not a global cap. Estimate max isolates × 2 and verify against the actual provider's connection budget. E.g., 10 isolates → up to 20 connections; 50 → 100; 100 → 200. Use a managed pooler or Cloudflare-appropriate database connection service when required; do not set limits by undocumented environment flags. Confirm real Cloudflare TLS support and throughput before promotion.

## Pending release infrastructure

- Source D1 count/receipt readback and whether the historical Supabase table contains rows.
- Provider, host, PG version and pgcrypto decision (no extension line in 0001).
- CI disposable PG 16 TLS, least-privilege and migration tests (see `postgres-migration` workflow); this is NOT proof against the target production provider.
- Worker canary, certificate-negative test, production pool budget.
- Edge/API rate limit, volume/5xx alerting and recovery drills. Form must not be promoted publicly before these are verified.
- Old-source deletion is NOT authorized by this migration branch.

**Audit rule:** Capture UTC timestamp, repo/branch/commit, object fingerprint, actors, commands/tests, source counts, actual observed outcomes, and separate unverified requirements; do not record PII or credentials in GitHub issues/logs.

## CI disposable database

The `postgres-migration` workflow runs `scripts/verify-postgres-ci.sh` against an isolated PostgreSQL 16 Docker container created on the GitHub runner with a temporary IP-scoped TLS certificate. It runs bootstrap as the provider administrator, migrates as `ayure_migrator`, then verifies through node-postgres logged in as `ayure_app`: positive `INSERT ... RETURNING`, negative PII reads/UPDATE/DELETE, `pg_stat_ssl.ssl=true`, certificate-hostname rejection, and unavailable database handling. CI dummy passwords are for ephemeral localhost only; no production database is accessed. The test script cleans up the temporary container and certificates. This proof does NOT establish the production DB's PG version/privileges/certificate chain or Cloudflare runtime compatibility.
