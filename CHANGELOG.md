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

### Dataset
- **1.0.0** — initial catalog: 183 exercises (87 core, 96 extended), 19 fields,
  16 primary muscles, 20 movement patterns, 34 equipment tokens. Provenance in
  `data/SOURCE.md`.
