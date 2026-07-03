# ExerciseAPI — Launch Checklist

Remaining work, organized by phase (companion to [PLAN.md](PLAN.md)).
**Last updated:** 2026-07-03

## Done so far

- ✅ **P0** — Next.js app, `Exercise` contract (`src/lib/schema.ts`), `data:check`,
  licenses, CHANGELOG, dataset v1.0.0
- ✅ **P1** — `/v1` read API (all filters, envelopes, CORS, CDN caching,
  `X-Dataset-Version`), OpenAPI 3.1 generated from code, 29-test suite
- ✅ Landing page implemented from the Claude Design prototype; `/docs` stub
- ✅ Positioning locked: "first 100 calls/day free", no permanence promises
- ✅ `exercise-api.com` live (DNS + TLS), canonical in all examples

## 🚀 Launch gate — minimum to announce publicly

The plan (PLAN.md "Sequencing") requires P3 before any announcement. The honest
minimum bar:

- [ ] **`/llms.txt` + `/llms-full.txt`** — advertised on the landing page but not
  yet served. Quickest win; generate from the docs/spec content.
- [ ] **Anonymous rate limiting** — the site *says* "first 100 calls/day free";
  nothing enforces it. 100/day per IP + ~60/min burst (Vercel WAF rule or
  Upstash/KV token bucket in middleware), `RateLimit-*` headers, `429` error
  envelope + `Retry-After`.
- [ ] **Docs site v1** — field dictionary (19 fields), query-param tables,
  controlled-vocab reference, versioning & rate-limit policy. Rendered OpenAPI
  (Scalar) on the docs site.
- [ ] **GitHub repo public + Git integration** — deploys are currently CLI-only
  from one machine; wire Vercel Git integration so pushes deploy. Enables the
  footer "GitHub" link and snapshot releases.
- [ ] **Dataset snapshot release** — immutable `exercises@1.0.0.json` GitHub
  Release (P6 prerequisite, and what consumers pin).

## P2 — developer product surface (remainder)

- [ ] Full docs site (above)
- [ ] Scalar/Swagger UI rendering `/openapi.json`
- [ ] `llms.txt` / `llms-full.txt` (above)
- [ ] OG image — concept exists in the design prototype; implement with `next/og`
- [ ] SEO pass: `sitemap.xml`, `robots.txt`, canonical URLs
- [ ] www → apex 308 redirect (Vercel dashboard toggle)

## P3 — rate limiting & API keys (remainder)

- [ ] Anonymous per-IP limiting (above, launch gate)
- [ ] Free API key tier: self-serve issuance form, KV/Postgres storage, higher
  daily allowance, minimal usage counters (also: the email relationship)
- [ ] Pre-provision stricter buckets for chat/suggestions namespaces
- [ ] Load test: confirm `429` + headers behave under burst

## P4 — chat & suggestions

- [ ] `POST /v1/suggestions` — validation, persistent store (KV/Postgres or
  auto-filed GitHub issue), moderation/triage workflow. Footer currently says
  "(soon)".
- [ ] `POST /v1/chat` — catalog-grounded retrieval, Vercel AI Gateway
  (default Claude), BotID, per-IP token bucket, hard daily spend cap,
  graceful `503` when unconfigured
- [ ] `/chat` streaming UI on the site

## P5 — monetization

- [ ] Apply to Carbon / EthicalAds; set `NEXT_PUBLIC_AD_PROVIDER` and wire the
  real ad unit (slot is env-gated and hidden until then)
- [ ] Buy-me-a-coffee link, env-gated (design has header/footer affordances)
- [ ] Document revenue vs. hosting/AI cost tracking

## P6 — Orion migration

- [ ] Publish pinned snapshot release (launch gate item)
- [ ] Point Orion's seed/build at the pinned version; delete duplicated JSON in
  Orion (`data/` + `knowledgebase/`)
- [ ] Verify every existing `id` resolves (soft-reference integrity for
  `session_exercise.exercise_id`)
- [ ] Update Orion docs

## P7 — MCP server (fast-follow)

- [ ] First-party MCP server: `search_exercises`, `get_exercise`, `list_meta`
  over the same query engine; host on Vercel; document connection on docs site

## New features (post-launch-gate)

- [ ] **`POST /v1/generate-workout`** — "generate me a workout" endpoint.
  The dataset was built for exactly this (SFR ratings, `preferred_rank`,
  gold-standard flags, substitution groups, rep ranges, equipment taxonomy),
  so a **deterministic** generator is feasible without any AI cost.
  - Inputs (sketch): `style` (`lift` | `hiit`), `available_equipment`, target
    muscles or split (push/pull/legs/full-body), time budget or exercise count,
    experience/`tier` preference, optional `home_hotel_friendly`.
  - **`style=lift`** — straight-sets hypertrophy session: ordered exercise
    list with sets × rep ranges (from `default_rep_low/high`), compound-first
    ordering via `preferred_rank`/pattern, SFR-aware selection.
  - **`style=hiit`** — circuit/interval session: rounds of work/rest intervals
    (e.g. 40s on / 20s off) instead of rep ranges, alternating movement
    patterns and muscle groups for sustainable pacing; selection biased to
    low-setup exercises (bodyweight, dumbbells, bands; skip barbell/rack-bound
    lifts, `unilateral` used for density). Styles share one selection engine
    with different scoring + output shapes, so adding future styles (e.g.
    `circuit`, `mobility`) is cheap.
  - **Dataset note for HIIT:** the catalog is hypertrophy-curated — it has no
    classic conditioning moves (burpees, mountain climbers, jump rope) and no
    field marking conditioning suitability. v1 of HIIT can work from
    equipment/pattern heuristics; a proper `conditioning_suitable` field (or a
    small conditioning exercise set) would be a dataset MINOR release.
  - Output (both styles): each entry carries the full record + why-picked
    metadata (rank, SFR, gold standard).
  - **Decision needed first:** PRODUCT.md §3/§13 currently lists program
    generation as an explicit non-goal ("that's Orion's job") and §12 warns
    against becoming a workout-programming API. Adding this means revising
    that stance — e.g. scoping it as a *single-session showcase generator*
    (stateless, no programming/periodization/user accounts) that demos the
    dataset's value, while multi-week programming stays Orion's territory.
    Update PRODUCT.md before building.
  - Rate-limit consideration: more compute-shaped than the read API but still
    cheap and cacheable per input combination; keep it inside the free tier.

## Infrastructure & housekeeping

- [ ] CI (GitHub Actions): `data:check` + tests + typecheck on every PR
- [ ] Vercel Analytics (or similar) — the §11 success metric is the
  landing → docs → first-request funnel; currently unmeasured
- [ ] Uptime monitoring on `/health`
- [ ] Custom 404 page for site routes (API already returns JSON envelopes)

## Open product questions (PRODUCT.md §12)

- [ ] Suggestion moderation: who reviews, and how accepted suggestions become a
  dataset `MINOR`/`PATCH` bump + new snapshot release
- [ ] Licensing reach: do future premium fields stay CC BY 4.0 or become
  API-only?
