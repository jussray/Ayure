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
- a real Join API adapter that only claims success after Supabase confirms persistence
- Supabase schema for profiles, properties, services, opportunities, intents, connections, and founding-network leads
- responsive desktop/mobile UI
- Playwright verification for search, join state, and mobile overflow

The checked-in catalog is **example data only**. It is deliberately labeled Example in the interface and must not be presented as real marketplace inventory, customers, ratings, revenue, or partnerships.

## Local setup

```bash
npm install
npm run dev
```

For real founding-network submissions, create a Supabase project, apply the migration in `supabase/migrations/20260927010000_ayure_v10.sql`, then configure:

```bash
AYURE_SUPABASE_URL=...
AYURE_SUPABASE_SERVICE_ROLE_KEY=...
```

The service-role key is server-only. Never expose it with a `NEXT_PUBLIC_` prefix.

## Verification

```bash
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs the same build + Playwright gate on `main`.

## Truth rules

1. No fake marketplace scale.
2. No dead CTA masquerading as functionality.
3. No outcome number without an explicit evidence state.
4. Anonymous continuity cookies store only a deterministic fingerprint, not the raw query or email.
5. Search can be useful before AYURE has marketplace liquidity, but example catalog results remain visibly labeled.
6. Public inventory comes from published records, not fabricated seed data.

## Current fingerprint

- authoritative repo: `jussray/Ayure-`
- branch: `main`
- product architecture: `AYURE Backend V10`
- visual canon: cream + orange↔green ombré, editorial property imagery, deep green structure
- first wedge: property/STR professionals + people seeking properties, operators, transformation, investment paths, or services
