# AYURE

AYURE is an intent-first property network: one place to discover properties, professionals, services, businesses, and opportunities around what a user is trying to make happen.

## Product spine

`Intent → Search → Match → Evidence → Connection → Action → Outcome proof`

The user-facing design source of truth is the approved warm cream + orange↔green ombré destination UI. The backend source of truth is the intent graph and proof-state model.

## V10 backend slice

Current source implements:

- natural-language + explicit intent parsing
- intent-aware matching across multiple entity types
- visible match reasons instead of a mystery score
- privacy-safe intent fingerprints and a bounded continuity cookie
- proof states: `example`, `projected`, `reported`, `verified`
- a provider-neutral PostgreSQL Join repository that only claims success after the database confirms persistence
- a least-privilege runtime database contract for founding-network leads
- provider-neutral PostgreSQL migration/proof SQL under `db/`
- responsive desktop/mobile UI
- Playwright verification for search, join state, and mobile overflow

The checked-in catalog is **example data only**. It is deliberately labeled Example in the interface and must not be presented as real marketplace inventory, customers, ratings, revenue, or partnerships.

The historical Supabase migration under `supabase/migrations/` is retained as schema history. AYURE's active Join runtime no longer depends on Supabase.

## Local setup

```bash
npm install
npm run dev
```

For real founding-network submissions, provision PostgreSQL roles `ayure_migrator` and `ayure_app`, harden the runtime role with `db/admin/runtime-role.sql`, apply `db/migrations/0001_create_ayure_leads.sql` as `ayure_migrator`, then configure the server-only runtime connection:

```bash
DATABASE_URL=postgresql://ayure_app:...@host:5432/ayure
```

Do not place database credentials in any `NEXT_PUBLIC_*` variable. The application strips TLS query parameters from `DATABASE_URL` and defines TLS behavior through the explicit `pg` SSL object. If a provider uses a private CA, configure `DATABASE_CA_CERT`; do not disable certificate verification.

The runtime role is deliberately narrow: it may insert a lead and select only `receipt`, `status`, and `created_at`. It must not inherit another role or read lead PII, update rows, delete rows, create schema objects, or switch into the migrator role.

## Verification

Application gate:

```bash
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Database gate, run only from a trusted admin/developer environment with separate runtime and migrator credentials:

```bash
DATABASE_URL=... MIGRATION_DATABASE_URL=... npm run verify:db
```

`verify:db` proves runtime identity, zero role memberships, TLS through `pg_catalog.pg_stat_ssl`, exact `INSERT ... RETURNING` behavior, denied access to `id`/PII, denied `UPDATE`/`DELETE`, and migrator cleanup.

GitHub Actions runs the build + Playwright gate on `main`. The database proof is intentionally not run in repository CI until a production PostgreSQL provider and protected database credentials are provisioned.

## Truth rules

1. No fake marketplace scale.
2. No dead CTA masquerading as functionality.
3. No outcome number without an explicit evidence state.
4. Anonymous continuity cookies store only a deterministic fingerprint, not the raw query or email.
5. Search can be useful before AYURE has marketplace liquidity, but example catalog results remain visibly labeled.
6. Public inventory comes from published records, not fabricated seed data.
7. Persistence is an AYURE contract; the PostgreSQL hosting provider is replaceable infrastructure.

## Current fingerprint

- authoritative repo: `jussray/Ayure-`
- branch: `main`
- product architecture: `AYURE Backend V10`
- active Join persistence: provider-neutral PostgreSQL repository
- visual canon: cream + orange↔green ombré, editorial property imagery, deep green structure
- first wedge: property/STR professionals + people seeking properties, operators, transformation, investment paths, or services
