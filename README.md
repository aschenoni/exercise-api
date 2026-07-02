# ExerciseAPI

A free, public, read-only REST API for a hand-curated, hypertrophy-focused
exercise library — 183 exercises with training-quality metadata: stimulus-to-fatigue
ratings, research-backed gold-standard flags, e1RM substitution groups, calisthenics
progression chains, curated rep ranges, and coaching cues.

- **Product doc:** [PRODUCT.md](PRODUCT.md)
- **Build plan:** [docs/PLAN.md](docs/PLAN.md)
- **Data provenance:** [data/SOURCE.md](data/SOURCE.md)
- **License:** code MIT ([LICENSE](LICENSE)), data CC BY 4.0 ([DATA-LICENSE](DATA-LICENSE))

## API

Versioned under `/v1`. JSON-only, keyless, CORS-enabled, CDN-cached.

| Endpoint | Purpose |
|---|---|
| `GET /v1/exercises` | List & filter (muscle, pattern, equipment, `available_equipment` subset match, tier, sfr_class, booleans, `q` search, sort, pagination) |
| `GET /v1/exercises/{id}` | One exercise by stable slug |
| `GET /v1/meta` | Controlled vocabularies + counts + `dataset_version` |
| `GET /health` | Liveness + dataset size |
| `GET /openapi.json` | OpenAPI 3.1 spec, generated from the code it describes |

```bash
# Everything you can do with dumbbells and a bench, best stimulus first
curl "http://localhost:3000/v1/exercises?available_equipment=dumbbells,flat_bench&sfr_class=high"
```

## Development

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # vitest suite
pnpm data:check   # dataset integrity gate (count, ids, schema, semver)
pnpm typecheck
```

The data contract lives in [`src/lib/schema.ts`](src/lib/schema.ts) — the
`Exercise` type, controlled vocabularies, and per-field specs. The dataset
check, query validation, and OpenAPI document are all generated from that one
module, so the published contract cannot drift from the code.

Versioning policy (API contract vs. dataset semver): see
[CHANGELOG.md](CHANGELOG.md) and PRODUCT.md §10.
