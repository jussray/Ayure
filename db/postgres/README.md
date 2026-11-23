# AYURE Join — staged PostgreSQL migration

**Status: staged dual-adapter code only; NOT cut over.** AYURE currently writes Join leads to Cloudflare D1 `AYURE_DB`. The old Supabase schema is historical; it is NOT the active Join writer. Preserve D1 and any Supabase history until source inventory and rollback are explicitly approved. Never point production at an empty PostgreSQL table.

## Release gates (tasks 0–10)

0. Read-only inventory: query `SELECT count(*), count(DISTINCT receipt) FROM ayure_leads` against production D1 with Wrangler; separately inspect historical Supabase only if it actually contains leads. D1's active table has a receipt PK but NO `id`; do not invent source IDs. Identify writer and snapshot time; protect lead PII.
1. Create a **dedicated** PostgreSQL 16+ database and run `0000_bootstrap.sql` as an authorized provider admin. Configure unique credentials for `ayure_migrator` and `ayure_app` out of band. Scope database access via provider network and pooler; database-level revocations on a shared provider database can break unrelated apps.
2. Connect **as `ayure_migrator`**. Run `SELECT version(), current_user; SELECT gen_random_uuid();` and verify PostgreSQL 16+ and schema CREATE privilege. No `pgcrypto` line is needed: UUID generation is core. On a **fresh empty DB**, run `0001_create_ayure_leads.sql` exactly once as migrator; never apply 0001 over existing lead rows. `receipt UNIQUE` is explicit.
3. Connect **as `ayure_app`** to a disposable migrated test database. Verify INSERT + RETURNING, SELECT on receipt/status/created_at, and expected failures for PII SELECT, UPDATE, and DELETE. Failure of permission checks blocks release. Do not remove the RETURNING column-grant to make tests pass.
4. **Worker runtime uses Cloudflare Hyperdrive, not a process-global `pg.Pool`.** Access the `AYURE_HYPERDRIVE` binding through `getCloudflareContext().env`; create and close one `pg.Client` per request. Hyperdrive owns the shared upstream connection pool. Store the runtime `ayure_app` connection in the Hyperdrive configuration, separate from the migration credential. Configure upstream TLS as `verify-full` with certificate/hostname validation at Hyperdrive; do not disable verification. The direct-URL sanitizer and `ssl: {}` checks remain only for isolated Node/CI tests, not the Worker binding.
5–6. Repository performs parameterized INSERT and returns only opaque receipt/status/date; /api/join enforces role, input bounds, true body-byte cap and honeypot. Node.js runtime.
7. Against a newly migrated disposable database, run `AYURE_PG_TEST_DATABASE_URL=... npm run test:e2e` and verify least privilege and TLS. This direct Node CI test does NOT prove the Cloudflare runtime path. A real Cloudflare Worker preview using the selected provider through the actual `AYURE_HYPERDRIVE` binding is a separate mandatory gate; verify the receipt write and `pg_stat_ssl.ssl=true` at the database, plus a negative certificate/hostname configuration test.
8. If D1 has rows: establish snapshot and repeatable export as authorized migrator, map D1 receipt/role/name/email/goal/status/created_at to PG, generate new UUID ids, reconcile counts, distinct receipts and new distinct ids. Use unique receipt to guard repeated imports. Quiesce D1 writer for final delta and reconcile again. If historical Supabase rows exist, separately classify and deduplicate before importing. **No automated export of personal information is included.**
9. Deploy only after the migration is validated; bind the provisioned Hyperdrive configuration as `AYURE_HYPERDRIVE` in `wrangler.jsonc`, then explicitly set non-secret `AYURE_LEADS_STORAGE=postgres` only at the approved cutover. The default writer stays D1 even when the binding exists, to prevent accidental split-brain. Retire the D1 adapter only in a separately approved release. Canary from the actual production UI, verify receipt persisted in PG using scoped migrator readback, and monitor failures.
10. Cut over only with founder authorization, verified rollback and restorability, volume + 5xx alerts, edge/API rate limiting, and incident plan. Preserve the old source read-only at least seven days. Archive and delete ONLY with separate explicit approval after backup/restore proof.

## Privilege and capacity warnings

The `ayure_app` grant is column-scoped, not row-scoped: it can SELECT receipt/status/created_at across all rows. It cannot read name/email/goal/id. Future tables must get explicit grants: NEVER set default table-wide SELECT privileges. `0000` uses `FOR ROLE ayure_migrator IN SCHEMA public` to avoid configuring the administrator's default grants.

Hyperdrive owns the shared upstream pool. The Worker must not create a global `pg.Pool` or claim that a per-isolate `max` is a deployment-wide cap. Confirm the provider's connection budget against Hyperdrive's configured limits and observed concurrency before promotion.

## Pending release infrastructure

- Source D1 count/receipt readback and whether the historical Supabase table contains rows.
- Provider, host, PG version and certificate chain; Hyperdrive configuration ID and verified upstream TLS mode.
- CI disposable PG 16 TLS, least-privilege and migration tests (see `postgres-migration` workflow); this is NOT proof against the target production provider.
- Worker canary using the actual Hyperdrive binding, certificate-negative test, provider connection budget.
- Edge/API rate limit, volume/5xx alerting and recovery drills. Form must not be promoted publicly before these are verified.
- Old-source deletion is NOT authorized by this migration branch.

**Audit rule:** Capture UTC timestamp, repo/branch/commit, object fingerprint, actors, commands/tests, source counts, actual observed outcomes, and separate unverified requirements; do not record PII or credentials in GitHub issues/logs.

## CI disposable database

The `postgres-migration` workflow runs `scripts/verify-postgres-ci.sh` against an isolated PostgreSQL 16 Docker container created on the GitHub runner with a temporary IP-scoped TLS certificate. It runs bootstrap as the provider administrator, migrates as `ayure_migrator`, then verifies through node-postgres logged in as `ayure_app`: positive `INSERT ... RETURNING`, negative PII reads/UPDATE/DELETE, `pg_stat_ssl.ssl=true`, certificate-hostname rejection, and unavailable database handling. CI dummy passwords are for ephemeral localhost only; no production database is accessed. The test script cleans up the temporary container and certificates. This proof does NOT establish the production DB's PG version/privileges/certificate chain or Cloudflare runtime compatibility.
