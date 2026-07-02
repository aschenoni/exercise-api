# ExerciseAPI — Build Plan

Comprehensive, phased implementation plan. Companion to [`../PRODUCT.md`](../PRODUCT.md).
Each phase is independently shippable and has explicit deliverables + acceptance criteria.

**Last updated:** 2026-06-30 · **Owner:** Austin Schenoni

## Decisions locked
- **Repo:** standalone at `/Users/aj/code/exercise-api` (sibling of `orion`).
- **Stack:** Next.js (App Router) — one deploy serving landing + docs + `/v1` API.
- **Data at runtime:** bundled static JSON, in-memory. No DB for the catalog.
- **Hosting:** Vercel (Fluid Compute) + CDN caching.
- **Licensing:** code MIT, data CC BY 4.0.
- **Chat:** keyless in v1, **tightly rate-limited** (per-IP + BotID + daily spend cap).
- **Versioning:** two axes — API contract in the URL path (`/v1`, additive-only); dataset
  content in **semver** (`MAJOR`=shape break, `MINOR`=added exercises/fields, `PATCH`=fixes),
  exposed via `/v1/meta` + `X-Dataset-Version`. See PRODUCT.md §10.
- **Orion consumes a pinned, versioned snapshot** (immutable `exercises@<semver>.json`
  release artifact) — reproducible, no build-time network dependency.
- **Agent readability:** OpenAPI 3.1 (`/openapi.json`, **generated from code/types**) +
  `llms.txt`/`llms-full.txt` in **v1**; first-party **MCP server as a fast-follow** (P7).
  Legacy `/.well-known/ai-plugin.json` skipped. See PRODUCT.md §6.6.
- **Clean start:** earlier exploratory scaffold removed; only `data/exercises.json` +
  `PRODUCT.md` retained. Build from this plan.

## Current state
- ✅ Catalog extracted & merged → `data/exercises.json` (183 records: 87 core, 96 extended,
  all IDs unique, normalized to the 19-field shape).
- ✅ `PRODUCT.md` written.
- ⬜ Everything below.

---

## Phase P0 — Data contract & foundations
**Goal:** lock the public data contract and stand up an empty, deployable Next.js app.

Tasks
- Re-init the Next.js app (TypeScript, App Router), `@/*` path alias, minimal deps.
- Define the `Exercise` TypeScript type (19 fields) as the canonical contract.
- Copy `data/SOURCE.md` provenance from Orion; add `DATA-LICENSE` (CC BY 4.0) + `LICENSE` (MIT).
- Establish versioning scaffolding: a `dataset_version` (semver) stamp on the dataset,
  initial `CHANGELOG.md` (tracks API contract + dataset), and the additive-only `/v1`
  contract written down.
- Add a `data:check` script: assert 183 records, unique IDs, schema conformance, tier counts.
- First deploy to Vercel (blank app + `/health`).

Deliverables: deployable app, `Exercise` type, `dataset_version`, `CHANGELOG.md`, data integrity check in CI.
Acceptance: `data:check` passes; `/health` returns dataset size in production.

## Phase P1 — Core read API
**Goal:** the actual catalog API, versioned and cacheable.

Endpoints
- `GET /v1/exercises` — filters (`muscle`, `secondary_muscle`, `pattern`, `sfr_class`,
  `tier`, `substitution_group`, `progression_group`, booleans, `equipment`,
  `available_equipment`, `q`), `sort`, `limit`/`offset`.
- `GET /v1/exercises/:id` — single record, `404` envelope on miss.
- `GET /v1/meta` — controlled vocabularies + counts + current `dataset_version`.
- `GET /health`.

Versioning surface
- Include `dataset_version` (semver) in `/v1/meta` and an `X-Dataset-Version` response
  header on catalog endpoints.

Agent readability
- Generate the **OpenAPI 3.1 spec from route definitions + the `Exercise` type** (no drift);
  serve at `/openapi.json` with `operationId`s, JSON Schema, LLM-oriented descriptions, and
  `examples`. CI fails if the spec is stale vs. the routes.
- Stable error `code`s + consistent envelopes (already in scope) — reaffirm as agent
  affordances.

Cross-cutting
- Response envelopes (`{ object: "list", data, count, total, limit, offset }`),
  error envelope (`{ error: { code, message } }`), CORS, `Cache-Control` (`s-maxage`).
- In-memory query engine over the frozen dataset (Map for id lookups).
- Tests: filter combinations, pagination bounds, `available_equipment` subset logic,
  404 path, meta correctness.

Deliverables: working `/v1` API + test suite.
Acceptance: documented query examples return expected results; responses are CDN-cached;
test suite green.

## Phase P2 — Developer product surface (landing + docs)
**Goal:** make it a product, not just an endpoint.

Tasks
- Landing page: value prop, dataset stats, live example request/response, quickstart, CTAs.
- Docs site: endpoint reference, query-param tables, **field dictionary**, controlled-vocab
  reference, copy-paste examples (curl / JS fetch / Python requests), versioning policy.
- Render the OpenAPI spec via a reference UI (Scalar/Swagger) on the docs site.
- Generate `/llms.txt` + `/llms-full.txt` from the docs content for doc-reading agents.
- Basic SEO (title/description/OG), responsive layout.

Deliverables: `/` and `/docs` live; `/openapi.json`, `/llms.txt`, `/llms-full.txt` served.
Acceptance: a new developer (or agent) can go landing → docs/spec → first successful request unaided.

## Phase P3 — Rate limiting & API keys
**Goal:** protect the service; lay groundwork for tiers.

Tasks
- Anonymous per-IP rate limit at the edge (Vercel WAF rule or KV token bucket in middleware).
- `RateLimit-*` headers; `429` + `Retry-After` on limit.
- Optional **free API key** tier (issue via simple form; store in KV/Postgres) with higher
  limits + minimal usage counters. Read API stays usable keyless.
- Stricter limits wired for chat/suggestions namespaces (used in P4).

Deliverables: enforced limits + (optional) key issuance.
Acceptance: load test trips `429` with correct headers; keyed requests get higher ceiling.

## Phase P4 — Chat & suggestions
**Goal:** community input + a grounded assistant.

Tasks
- `POST /v1/suggestions`: validate, persist to a real store (KV/Postgres or auto-filed
  GitHub issue), light moderation/triage workflow.
- `POST /v1/chat`: catalog-grounded (retrieve relevant exercises → feed as context),
  via Vercel AI Gateway (`provider/model`, default current Claude). Keyless but **tightly
  rate-limited** (per-IP token bucket + BotID + daily spend cap); graceful `503` if AI key
  unset.
- `/chat` UI (streaming) on the site.

Deliverables: suggestions pipeline + chat endpoint + UI.
Acceptance: suggestions land in the store and are reviewable; chat answers only from the
catalog and refers misses to suggestions; chat limits enforced.

## Phase P5 — Monetization
**Goal:** sustain the project without paywalling v1.

Tasks
- Site-only ad slots (config-driven; Carbon/EthicalAds or AdSense) — never in API responses.
- "Buy me a coffee" button (header/footer), env-gated.
- Document revenue vs. cost tracking.

Deliverables: env-gated ad + donation surfaces.
Acceptance: render as harmless placeholders when unconfigured; live when env set.

## Phase P6 — Orion migration (first consumer)
**Goal:** make Orion consume ExerciseAPI as the single source of truth.

Tasks
- Publish the catalog as an immutable, semver-tagged snapshot release
  (`exercises@<semver>.json` + GitHub Release).
- Point Orion's seed/build at a **pinned snapshot version** (decided); remove the
  duplicated local JSON (`data/` + `knowledgebase/`). Orion upgrades by bumping the pin.
- Verify every existing `id` still resolves (preserve slugs) so
  `session_exercise.exercise_id` references stay valid as soft references.
- Update Orion docs to note the catalog now lives in ExerciseAPI.

Deliverables: Orion off local JSON.
Acceptance: Orion's exercise table seeds from ExerciseAPI; all referential IDs intact.

## Phase P7 — MCP server (fast-follow)
**Goal:** let Claude and other agents call the catalog as native tools.

Tasks
- First-party MCP server exposing `search_exercises`, `get_exercise`, `list_meta` (typed
  inputs/outputs derived from the same `Exercise` type + query layer as the REST API).
- Host on Vercel; document connection in the docs site.
- Reuse the in-memory query engine — no logic duplication.

Deliverables: connectable MCP server.
Acceptance: an agent (e.g. Claude) can discover + call the tools and get correct results.

---

## Sequencing & dependencies
- P0 → P1 → P2 can proceed largely in series; P2 depends on P1's response shapes.
- OpenAPI spec is generated in P1 (from routes/types); rendered + `llms.txt` shipped in P2.
- P3 should land before any public announcement (abuse protection).
- P4 depends on P3 (rate-limit primitives) and P1 (catalog retrieval).
- P5 is independent once P2 exists.
- P6 can start after P1 (a stable snapshot exists).
- P7 (MCP) is a fast-follow after P1 (reuses the query layer); independent of P2–P6.

## Open questions (carried from PRODUCT.md §12)
- Data licensing reach — CC BY 4.0 for everything, or hold premium fields back?
- Suggestion moderation owner + how accepted suggestions flow back into the dataset
  (and how that triggers a dataset `MINOR`/`PATCH` bump + new snapshot release).

## Explicitly out of scope (v1)
User accounts, public write access to the catalog, program generation, GraphQL, published
SDK packages (npm/pip).
