# ExerciseAPI — Status & Remaining Work

Companion to [PLAN.md](PLAN.md). **Last updated:** 2026-07-03 (P4 shipped)

## ✅ Shipped

- **P0/P1** — Next.js app, canonical contract (`src/lib/schema.ts`), `data:check`,
  full `/v1` read API (filters, envelopes, CORS, CDN caching, `X-Dataset-Version`),
  OpenAPI 3.1 generated from code, test suite (43 tests)
- **Pre-launch contract revision** — nullable hypertrophy fields + `modality`
  axis + filter (dataset 1.1.0). From launch onward /v1 is strictly additive.
- **P2** — designed landing page (Claude Design), docs site v1 (`/docs`: param
  tables, field dictionary from FIELD_SPECS, vocabularies, policies), Scalar
  reference (`/docs/api`), `/llms.txt` + `/llms-full.txt`, brand mark
  (favicon/apple-icon/header/avatar kit)
- **P3 (anonymous tier)** — middleware rate limiting on `/v1/*`: 100/day +
  60/min burst per IP, `RateLimit-*` headers, `429` envelope; stricter buckets
  for chat (20/day, 5/min) and suggestions (5/day, 2/min); degrades open
- **P4** — `POST /v1/suggestions` (validated → GitHub issue, 202 envelope,
  503 until token configured) · `POST /v1/chat` (catalog-grounded via keyword
  retrieval, streaming through Vercel AI Gateway, global daily budget cap,
  503 degrade) · `/chat` streaming UI
- **Launch gate complete (2026-07-03)** — site is announceable
- **Infra** — exercise-api.com (DNS+TLS), GitHub repo public + Git integration
  (push-to-deploy), dataset snapshot release `dataset-v1.1.0`, Vercel
  Analytics component installed
- **Monetization/positioning** — "first 100 calls/day free" everywhere,
  attribution requirement in DATA-LICENSE + `/v1/meta` `license` object,
  Buy Me a Coffee live, ad slot env-gated

## 🔑 Owner actions (Austin — small, unblock shipped features)

- [ ] **Suggestions token**: create a fine-grained GitHub PAT (repo:
  `aschenoni/exercise-api`, permission: Issues read+write, nothing else) →
  add as `GITHUB_ISSUES_TOKEN` in Vercel env. Until then the endpoint 503s
  with a pointer to the issue tracker.
- [ ] **Enable Web Analytics** in the Vercel dashboard (project → Analytics
  tab → Enable). The component is deployed; it no-ops until enabled.
- [ ] **Verify chat billing**: chat uses Vercel AI Gateway via OIDC on the
  deployment. Confirm usage/credits in the dashboard (AI Gateway tab) and
  adjust `CHAT_GLOBAL_DAILY_CAP` (default 300 msgs/day) to taste.
- [ ] Optional hardening: provision **Upstash Redis** (Vercel Marketplace) so
  rate limits are exact across instances; env vars are already wired.
- [ ] Optional: www → apex redirect (dashboard toggle), EthicalAds application
  once traffic ≥ ~50k views/mo (see ADS-SETUP.md).

## 📋 Remaining work, by phase

### P3 remainder — free API key tier
- [ ] Self-serve key issuance (simple form), storage (Upstash/Postgres),
  `Authorization: Bearer` / `?api_key=` recognition in middleware,
  higher daily allowance, minimal usage counters
- [ ] Docs: key tier policy page; keep read API keyless

### P4 remainder — hardening
- [ ] Bot protection on chat/suggestions (Vercel BotID) if abuse appears
- [ ] Suggestion triage workflow doc: label conventions → accepted suggestions
  become dataset MINOR/PATCH releases (who reviews: Austin)

### P5 — monetization remainder
- [ ] EthicalAds (traffic-gated; wire provider client into the env-gated slot)
- [ ] Revenue vs. hosting/AI cost tracking doc

### P6 — Orion migration
- [ ] Point Orion's seed/build at the pinned `exercises@1.1.0.json` snapshot;
  remove duplicated JSON from Orion; verify every `id` resolves; update docs

### P7 — MCP server
- [ ] First-party MCP server (`search_exercises`, `get_exercise`, `list_meta`)
  over the same query engine; host on Vercel; document in docs site

### New features
- [ ] **`POST /v1/generate-workout`** — `style: lift | hiit`, equipment/split/
  time inputs, deterministic selection engine, why-picked metadata.
  *Prereq: revise PRODUCT.md §3/§13 non-goal (single-session showcase
  generator vs. Orion's multi-week programming).*
- [ ] **Dataset modality expansion** — author conditioning + mobility record
  sets (schema is ready; purely additive dataset MINOR + snapshot release).
  Decide single-primary vs. tag-array classification for overlaps (leaning
  single-primary).

### P2 polish (non-blocking)
- [ ] OG image (concept in the brand design project; implement via next/og)
- [ ] sitemap.xml + robots.txt
- [ ] Custom 404 page for site routes

### Housekeeping
- [ ] CI on PRs (GitHub Actions: data:check + test + typecheck) — pushes
  currently deploy without a gate
- [ ] Uptime monitoring on /health
- [ ] CHANGELOG: cut the "Unreleased" section into a dated launch entry when
  you announce

## Open product questions (PRODUCT.md §12)
- [ ] Premium-field licensing (future fields CC BY vs. API-only)
- [ ] Suggestion acceptance flow details (review cadence, release batching)
