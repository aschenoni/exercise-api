# Changelog

Two independently versioned axes (see PRODUCT.md §10):

- **API contract** — versioned in the URL path (`/v1`). Additive-only; breaking
  changes require `/v2`.
- **Dataset** — semver (`MAJOR.MINOR.PATCH`), exposed via `GET /v1/meta` and the
  `X-Dataset-Version` header. MAJOR = shape break (lockstep with a `/vN` bump),
  MINOR = exercises/fields added, PATCH = corrections to existing values.

## Unreleased

### API contract (`/v1`)
- Initial public contract: `GET /v1/exercises` (filters, sort, pagination),
  `GET /v1/exercises/{id}`, `GET /v1/meta`, `GET /health`, `GET /openapi.json`.
- Response conventions: list envelope `{ object, data, count, total, limit, offset }`,
  error envelope `{ error: { code, message } }`, CORS on all endpoints,
  CDN caching (`s-maxage`), `X-Dataset-Version` header.
- **Pre-launch contract revision (2026-07-03, deliberate one-time exception to
  additive-only — decided while `/v1` had zero external consumers):**
  `sfr_class`, `preferred_rank`, `e1rm_substitution_group`, `default_rep_low`,
  and `default_rep_high` are **nullable** so future conditioning/mobility
  records don't fake hypertrophy values. All current records remain non-null.
  From launch onward, `/v1` is strictly additive.
- New `modality` field + `modality` filter on `GET /v1/exercises`; `modalities`
  vocabulary in `GET /v1/meta`.
- `license` object in `GET /v1/meta` (additive): data/code license identifiers,
  `attribution_required: true`, and a ready-to-use attribution line.

### Dataset
- **1.1.0** — added `modality` to all 183 records (`hypertrophy` ×136,
  `calisthenics` ×47; classified by `progression_group` presence).
  `conditioning` and `mobility` values are reserved for upcoming releases.
- **1.0.0** — initial catalog: 183 exercises (87 core, 96 extended), 19 fields,
  16 primary muscles, 20 movement patterns, 34 equipment tokens. Provenance in
  `data/SOURCE.md`.
