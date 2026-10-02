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
- Cloudflare D1 persistence for founding-network Join submissions through the `AYURE_DB` Worker binding
- prepared D1 statements and bounded server-side validation
- a credential-free application database boundary: no database password or URL ships with AYURE
- responsive desktop/mobile UI
- Playwright verification for search, join state, and mobile overflow

The checked-in catalog is **example data only**. It is deliberately labeled Example in the interface and must not be presented as real marketplace inventory, customers, ratings, revenue, or partnerships.

The historical Supabase migration under `supabase/migrations/` is retained as schema history only. AYURE's active Join runtime does not depend on Supabase.

## Local setup

```bash
npm install
npm run dev
```

Regular `next dev` intentionally has no production D1 binding. The Join API therefore reports `backend_not_configured` locally unless the app is run through a Cloudflare/OpenNext preview with an `AYURE_DB` binding.

## Cloudflare runtime

AYURE targets Cloudflare Workers through OpenNext while it remains on Next.js 15.

```bash
npm run cf:preview
npm run cf:deploy
```

`npm run build` is the OpenNext Worker build (it runs `next build` through `build:next`, set as `buildCommand` in `open-next.config.ts`). Cloudflare Workers Builds can therefore use build command `npm run build` and deploy command `npx wrangler deploy` unchanged. `.node-version` pins Node 22 for Workers Builds.

The Worker configuration is `wrangler.jsonc`. Production persistence uses a D1 database named `ayure-prod` with binding name `AYURE_DB`.

Create the D1 database once from an authenticated Cloudflare environment:

```bash
npm run cf:d1:create
```

Wrangler returns the database ID and can add the binding configuration. The production binding must resolve to:

```text
binding: AYURE_DB
database: ayure-prod
```

Then apply the checked-in D1 migrations:

```bash
npm run cf:d1:migrate
```

D1 migrations live under `migrations/`. The Join-only v0 schema stores the opaque receipt as the primary external handle and enforces AYURE's role, status, and input-length invariants in the database.

There is no `DATABASE_URL`, database password, service-role key, or TLS secret in AYURE's application environment. D1 access is granted through the Worker binding capability.

## Verification

Application gate:

```bash
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Cloudflare runtime gate after D1 creation:

```bash
npm run cf:preview
```

The production canary is not complete until a real Join submission returns an opaque receipt and the corresponding record is verified in `ayure-prod` without reading unrelated lead PII.

GitHub Actions runs typecheck, the production Next.js build, and Playwright on `main`. Cloudflare resource creation and production D1 migration are intentionally separate control-plane actions.

## Truth rules

1. No fake marketplace scale.
2. No dead CTA masquerading as functionality.
3. No outcome number without an explicit evidence state.
4. Anonymous continuity cookies store only a deterministic fingerprint, not the raw query or email.
5. Search can be useful before AYURE has marketplace liquidity, but example catalog results remain visibly labeled.
6. Public inventory comes from published records, not fabricated seed data.
7. Persistence is an AYURE contract; Cloudflare D1 is the current storage adapter, not the product identity.
8. D1 does not provide PostgreSQL RLS semantics; authorization stays in AYURE's application/query boundary.

## Current fingerprint

- authoritative repo: `jussray/Ayure-`
- branch: `main`
- product architecture: `AYURE Backend V10`
- active Join persistence: Cloudflare D1 via `AYURE_DB`
- runtime target: Cloudflare Workers via OpenNext
- visual canon: cream + orange↔green ombré, editorial property imagery, deep green structure
- first wedge: property/STR professionals + people seeking properties, operators, transformation, investment paths, or services
