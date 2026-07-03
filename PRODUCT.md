# ExerciseAPI — Product Doc

> A free, public REST API for a hand-curated, hypertrophy-focused exercise library —
> packaged as a real developer product (landing page + docs + API), in the mold of
> OpenWeather, Stripe, or Resend.

**Status:** Draft / pre-launch · **Owner:** Austin Schenoni · **Last updated:** 2026-06-30

---

## 1. Summary

ExerciseAPI takes the exercise library that currently lives inside the **Orion** app
and lifts it out into a standalone, publicly available service. Orion becomes the
**first consumer** of its own data via the API instead of bundling local JSON.

The dataset is not a generic exercise dump. It is a **hand-curated, evidence-informed,
hypertrophy-focused** catalog with opinionated metadata you can't get from typical free
lists: stimulus-to-fatigue ratings, "gold standard" flags backed by EMG/research, e1RM
substitution groups, and calisthenics progression chains. That curation is the product's
moat.

## 2. Problem & opportunity

- App and tool builders who need structured exercise data either scrape it, hand-roll a
  spreadsheet, or pull from generic open datasets that lack training-quality metadata.
- Existing free datasets (wger, free-exercise-db) are broad but shallow — no SFR, no
  substitution logic, no curated rep ranges or coaching cues.
- There is room for a **small, clean, well-documented, opinionated** API that is pleasant
  to integrate in five minutes — "the OpenWeather of exercises."

## 3. Goals / non-goals

**Goals**
- Publish a stable, versioned, read-only REST API for the exercise catalog.
- Ship a polished developer-product surface: marketing landing page + docs site.
- Make Orion the first production consumer (dogfooding).
- Provide a chat assistant to answer catalog questions and collect community suggestions.
- Sustain the project with light monetization (ads + donations) without paywalling v1.

**Non-goals (v1)**
- User accounts, workout logging, or program generation (that's Orion's job).
- Write access to the catalog from the public (suggestions are proposals, not edits).
- Heavy enterprise features (SLAs, SSO, private datasets).

## 4. Audience / personas

1. **Indie fitness-app developer** — wants a drop-in exercise catalog with good metadata.
2. **Orion (internal)** — consumes the catalog as its source of truth.
3. **Hobbyist / hackathon builder** — wants a free, no-signup API to prototype with.
4. **Coaches / data nerds** — browse the catalog and suggest missing exercises/fields.

## 5. The dataset

| Property | Value |
|---|---|
| Total exercises | **183** (87 `core`, 96 `extended`) |
| Identifier | stable, URL-safe slug (`barbell_bench_press`) — unique across the catalog |
| Fields per record | 20 (normalized; nullable fields filled with `null` / `[]`) |
| Source | hand-curated original work by the Orion team (no upstream dataset to inherit) |
| Provenance doc | `data/SOURCE.md` — cites ACE EMG studies, Contreras, Steven Low's *Overcoming Gravity*, etc. |

**Record shape (20 fields):**
`id`, `name`, `primary_muscle`, `secondary_muscles[]`, `pattern`, `equipment[]`,
`sfr_class` (high/moderate/low, nullable), `is_gold_standard`, `preferred_rank`
(nullable), `e1rm_substitution_group` (nullable), `default_rep_low` /
`default_rep_high` (nullable), `loadable`, `unilateral`, `home_hotel_friendly`,
`tier` (core/extended), `modality` (hypertrophy/conditioning/calisthenics/mobility),
`progression_group`, `progression_level`, `cues`.

The hypertrophy-shaped fields are nullable by contract (pre-launch decision,
2026-07-03) so future `conditioning`/`mobility` records don't fake values;
every current record is non-null.

**Controlled vocabularies:** 16 primary muscles, ~20 movement patterns, an equipment
token set, SFR classes, modalities, and named substitution/progression groups.
Exposed via `/v1/meta`.

### Data licensing
- **Code:** MIT.
- **Data:** **CC BY 4.0** — free to use with attribution. This lets others build on the
  catalog while keeping the project's credit, and is compatible with monetizing the
  *service* (hosting, docs, chat) rather than the data itself.

## 6. The product surfaces

ExerciseAPI is one deployment serving three audiences (the "OpenWeather topography"):

### 6.1 The API (machines)
Versioned under `/v1`. JSON only. Public, read-only, CORS-enabled, CDN-cached.

| Endpoint | Purpose |
|---|---|
| `GET /v1/exercises` | List & filter (muscle, pattern, equipment, tier, sfr_class, gold_standard, search, sort, pagination) |
| `GET /v1/exercises/:id` | Fetch one exercise by slug |
| `GET /v1/meta` | Controlled vocabularies + counts (for building filter UIs) |
| `GET /health` | Liveness + dataset size |
| `POST /v1/suggestions` | Submit a missing exercise / field / correction |
| `POST /v1/chat` | Catalog-grounded assistant (see 6.4) |
| `GET /openapi.json` | OpenAPI 3.1 machine contract (see 6.6) |
| `GET /llms.txt` · `/llms-full.txt` | Agent-readable docs map (see 6.6) |

**Response conventions**
- Lists: `{ object: "list", data: [...], count, total, limit, offset }`.
- Errors: `{ error: { code, message } }` with appropriate HTTP status.
- Filtering highlight: `available_equipment=...` returns only exercises doable with the
  gear you have (subset match) — a power feature that showcases the dataset's value.

### 6.2 Landing page (humans evaluating)
Marketing site: value prop, live example request/response, dataset stats, quickstart,
links to docs. Hosts monetization surfaces (see 6.5).

### 6.3 Docs site (developers integrating)
Endpoint reference, query-param tables, field dictionary, controlled-vocabulary reference,
copy-paste examples (curl / JS / Python), versioning & rate-limit policy.

### 6.4 Chat & suggestions
- **Chat** (`/chat` + `POST /v1/chat`): a catalog-grounded assistant. It does lightweight
  retrieval over the catalog and answers from that context; when something is missing it
  points the user to submit a suggestion. Powered via the **Vercel AI Gateway**
  (`provider/model` string, default a current Claude model). Degrades to `503` when no AI
  key is configured so the rest of the API runs key-free.
- **Suggestions** (`POST /v1/suggestions`): community input for missing exercises/fields
  and corrections. v1 acknowledges + records; needs a real store before launch
  (Postgres / Vercel KV / auto-filed GitHub issue) and light moderation.

### 6.5 Monetization
Free to start; funded lightly now, priced later.
- **Positioning (decided):** never promise "always free" or "never a key" — that
  forecloses the keyed and paid tiers in §7. Model OpenWeather's framing: a concrete
  free allowance ("**your first 100 calls each day are free**") presented as the entry
  point, with paid scale as the natural progression. Our DX edge over OpenWeather —
  the first request works instantly with **no key** — is framed as *friction removed*
  ("no key required to try it"), not *policy forever*.
- **Licensing is a footer trust signal, not a headline.** Don't tout MIT/CC BY in the
  hero — it advertises self-hosting. (And be precise: MIT is the code; the data is
  CC BY 4.0. Future premium fields need not inherit CC BY — see §12.)
- **Display ads** on the **marketing/docs site only** (never in API responses). Config-driven
  `AdSlot` component; prefer a developer-friendly network (Carbon/EthicalAds) or AdSense.
- **"Buy me a coffee"** donation button in the header/footer of the site.
- Both are env-gated and render as harmless placeholders until configured.
- **Paid tier (planned, post-v1):** higher rate limits, commercial use assurances / SLA (see §7).

### 6.6 Agent & machine readability
First-class support for AI agents and codegen tools consuming the API. Three layers, one
source of truth (the route definitions + `Exercise` type + dataset):

- **OpenAPI 3.1 spec** (`GET /openapi.json`) — **v1**. The canonical machine contract.
  **Generated from code/types** so it can never drift from actual behavior. Carries rich,
  LLM-oriented `description`s, a stable `operationId` per endpoint, request/response
  **JSON Schema**, and `examples` — everything an agent/SDK needs to auto-generate callable
  tools and self-correct against the schema. A Swagger/Scalar reference UI renders it.
- **`llms.txt`** (`/llms.txt` + `/llms-full.txt`) — **v1**. A concise, curated markdown map
  of the API for doc-reading agents, generated from the docs content.
- **MCP server** — **fast-follow**. A first-party Model Context Protocol server exposing
  native tools (`search_exercises`, `get_exercise`, `list_meta`) so Claude and other agents
  call the catalog directly without HTTP knowledge. Thin wrapper over the same query layer;
  hostable on Vercel. (Legacy `/.well-known/ai-plugin.json` is intentionally skipped —
  superseded by MCP.)
- **Agent-friendly response design** (cross-cutting): stable slug IDs, consistent envelopes,
  machine-readable error `code`s, predictable pagination, and the self-describing
  `/v1/meta` + `dataset_version` — the affordances that let agents reason and recover.

## 7. API keys & rate limiting

**v1 launch posture:** keyless to try, with a concrete free allowance — **the first
100 calls each day are free** (per IP), enforced by anonymous rate limiting. This is
the public framing (see §6.5): free-to-start, not free-forever.

- **Anonymous tier:** **100 calls/day per IP** free allowance + a burst limit
  (e.g. 60 req/min); over the daily allowance → `429` pointing at the free key tier.
  Implemented at the edge (Vercel WAF rate-limit rules or an Upstash/Vercel KV token
  bucket in middleware).
- **Keyed tier (fast follow):** optional free API key (`Authorization: Bearer` or
  `?api_key=`) for a meaningfully higher daily allowance and basic usage analytics —
  and, importantly, an email relationship with integrators. Keys issued via a simple
  self-serve form; stored in KV/Postgres.
- **Paid tier (later):** higher limits + commercial use assurances / SLA for teams.
- **Headers:** return `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`; respond
  `429` with a clear error envelope and `Retry-After`.
- **Caching as defense:** because catalog responses are static and CDN-cached
  (`s-maxage`), most read traffic never hits compute, which makes the free tier cheap.
- **Abuse controls:** chat and suggestions endpoints get *stricter* limits than the
  read API (they cost money / invite spam), plus bot protection (Vercel BotID) and basic
  content validation on suggestions.
- **Chat gating (decided):** `/v1/chat` stays **keyless in v1** but is **tightly
  rate-limited** (aggressive per-IP token bucket + Vercel BotID + a hard daily cap on
  total chat spend). If cost/abuse gets out of hand, the fast-follow is to require a free
  API key for chat specifically — the read API stays keyless regardless.

## 8. Orion as first consumer

- Today Orion bundles the catalog as local JSON (duplicated in `data/` and
  `knowledgebase/`) and seeds a Supabase `exercise` table.
- After launch, Orion's seed/build step consumes a **pinned, versioned snapshot** of the
  catalog (immutable `exercises@<semver>.json` release artifact — see §10.3) so there is
  **one source of truth**, reproducible builds, and no build-time dependency on API uptime.
  Orion upgrades by bumping the pinned `dataset_version` deliberately.
- The only DB coupling is `session_exercise.exercise_id REFERENCES exercise`. Once the
  catalog is external, `exercise_id` becomes a **soft reference** (stable slug) — which is
  exactly the right boundary for a shared public catalog.
- Migration must preserve every existing `id` so Orion's references keep resolving.

## 9. Tech & hosting

- **Stack:** Next.js (App Router) — one app serving landing + docs + `/v1` route handlers.
- **Data at runtime:** bundled static JSON, loaded into memory. No DB for the catalog.
- **Hosting:** Vercel (Fluid Compute); CDN caching for read endpoints.
- **AI:** Vercel AI Gateway for chat.
- **Optional infra:** KV/Postgres only for rate-limit counters, API keys, and suggestions.

## 10. Versioning

There are **two independent axes** to version — keeping them separate avoids treating
"we added exercise #184" as a breaking change.

### 10.1 API contract version — URL path (`/v1`)
The endpoint shapes, query params, and response envelopes are versioned in the path.

- **`/v1` is an additive-only contract.** Clients may rely on: fields are only ever
  *added*, never removed/renamed/retyped; new endpoints, filters, sort options, and new
  enum values in vocabularies may appear.
- **Breaking changes** (remove/rename/retype a field, remove an endpoint, change a
  filter's default behavior) require a new path segment (`/v2`). They do **not** ship
  inside `/v1`.

### 10.2 Dataset version — Semver (`MAJOR.MINOR.PATCH`)
The *content* of the catalog is versioned independently with semver:

- **MAJOR** — breaking change to the data **shape** (only happens alongside a new API
  contract version, e.g. a field removal). Stays in lockstep with the `/vN` bump.
- **MINOR** — exercises or fields **added** (the common case: accepted suggestions,
  new cues). Backwards-compatible.
- **PATCH** — corrections to existing values (fix a wrong `primary_muscle`, typo in cues).

The current `dataset_version` is exposed in `GET /v1/meta` and as an `X-Dataset-Version`
response header, so consumers can detect catalog changes without any API path change.

### 10.3 Versioned snapshots
Every dataset version is published as an **immutable release artifact** (GitHub Release +
`data/exercises@<semver>.json`). This is what consumers pin against (see §8). A
`CHANGELOG.md` tracks both the API contract and the dataset.

### 10.4 Deprecation policy
When `/v2` eventually ships, `/v1` keeps running for a stated window (target: 12 months),
returns `Deprecation` + `Sunset` headers, and the cutover is announced in docs + changelog.

### 10.5 Caching interaction
Read responses are CDN-cached (`s-maxage` + `stale-while-revalidate`). A dataset release
busts/revalidates the cache on deploy; `dataset_version` lets clients revalidate cheaply.

## 11. Success metrics

- Developer adoption: unique API consumers / keys issued; requests/day.
- Docs engagement: landing → docs → first successful request funnel.
- Data quality: suggestions received vs. accepted; catalog growth.
- Sustainability: ad + donation revenue vs. hosting + AI cost.
- Internal: Orion fully migrated off local JSON to the API.

## 12. Risks & open questions

- **Data licensing reach** — is CC BY 4.0 the right call, or hold some fields back as a
  premium tier?
- **Chat cost/abuse** — *(decided: keyless + tight per-IP limits + daily spend cap in v1; key-gate only if needed)*
- **Suggestion moderation** — who reviews, and how do accepted suggestions flow back into
  the dataset (PR? admin UI)?
- **Source-of-truth workflow** — *(decided: Orion pins a versioned semver snapshot; see §8 & §10.3)*
- **Scope creep** — keep v1 read-only; resist becoming a workout-programming API.

## 13. Out of scope for v1

User accounts, write access to the catalog, program generation, GraphQL, SDK packages
(npm/pip) — all candidate fast-follows once the core API and docs prove useful.
