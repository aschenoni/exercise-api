import type { Metadata } from "next";
import { DATASET_VERSION, getMeta } from "@/lib/dataset";
import { EXERCISE_FIELDS, FIELD_SPECS, SORT_KEYS } from "@/lib/schema";
import { DEFAULT_LIMIT, MAX_LIMIT } from "@/lib/query";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { CodeView, JsonView } from "@/components/highlight";
import { isChatEnabled, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Docs — ExerciseAPI",
  description:
    "ExerciseAPI reference: endpoints, query parameters, the 20-field dictionary, controlled vocabularies, conventions, rate limits, and versioning policy.",
};

const NAV = [
  ["endpoints", "Endpoints"],
  ["parameters", "Parameters"],
  ["fields", "Field dictionary"],
  ["vocabularies", "Vocabularies"],
  ["conventions", "Conventions"],
  ["rate-limits", "Rate limits"],
  ["versioning", "Versioning"],
  ["license", "License"],
] as const;

const ENDPOINTS: [string, string, string][] = [
  ["GET /v1/exercises", "/v1/exercises?limit=5", "List & filter the catalog. All filters below; sort + pagination."],
  ["GET /v1/exercises/{id}", "/v1/exercises/barbell_bench_press", "One exercise by stable slug."],
  ["GET /v1/meta", "/v1/meta", "Vocabularies with counts, dataset_version, license + attribution."],
  ["GET /health", "/health", "Liveness + dataset size."],
  ["GET /openapi.json", "/openapi.json", "OpenAPI 3.1 spec — the canonical machine contract."],
  ["GET /llms.txt", "/llms.txt", "Concise API map for doc-reading agents (llms-full.txt = everything)."],
  ["POST /v1/suggestions", "/openapi.json", "Suggest a missing exercise / correction — filed to the public issue tracker for review. 5/day per IP."],
  ...(isChatEnabled()
    ? ([["POST /v1/chat", "/chat", "Catalog-grounded assistant (streaming). Try it at /chat. 20/day per IP."]] as [string, string, string][])
    : []),
];

const PARAMS: [string, string, string][] = [
  ["muscle", "enum (16 muscles)", "Primary muscle. Comma-separated = any-of."],
  ["secondary_muscle", "same vocabulary", "Meaningful secondary involvement."],
  ["pattern", "enum (20 patterns)", "Movement pattern."],
  ["sfr_class", "high · moderate · low", "Stimulus-to-fatigue class."],
  ["tier", "core · extended", "Catalog tier."],
  ["modality", "hypertrophy · conditioning · calisthenics · mobility", "Training purpose."],
  ["substitution_group", "see /v1/meta", "e1RM substitution group."],
  ["progression_group", "see /v1/meta", "Calisthenics progression chain."],
  ["equipment", "equipment tokens", "Exercises that require this token."],
  [
    "available_equipment",
    "equipment tokens",
    "Subset match: only exercises whose entire equipment list is covered by your tokens. none_bodyweight (your body) is always implied.",
  ],
  ["gold_standard · loadable · unilateral · home_hotel_friendly", "true · false", "Boolean filters."],
  ["q", "free text", "Case-insensitive substring search over name and id."],
  ["sort", SORT_KEYS.flatMap((k) => [k, `-${k}`]).join(" · "), "Stable sort with id tiebreak — pagination-safe."],
  ["limit", `1–${MAX_LIMIT} (default ${DEFAULT_LIMIT})`, `Page size. limit=${MAX_LIMIT} fits the whole catalog in one page.`],
  ["offset", "≥ 0", "Zero-based offset into the filtered set."],
];

function VocabBlock({ title, items }: { title: string; items: { value: string; count: number }[] }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="panel-label">{title}</div>
      <p style={{ fontSize: 13.5, lineHeight: 1.9, color: "var(--muted)" }}>
        {items.map((i, idx) => (
          <span key={i.value}>
            <code className="inline-code">{i.value}</code>
            <span style={{ color: "var(--faint)", fontSize: 11.5 }}> {i.count}</span>
            {idx < items.length - 1 ? "  " : ""}
          </span>
        ))}
      </p>
    </div>
  );
}

export default function Docs() {
  const meta = getMeta();
  return (
    <>
      <SiteHeader />
      <main className="container docs-main" style={{ maxWidth: 860 }}>
        <div className="eyebrow">DOCS · API v1 · DATASET v{DATASET_VERSION}</div>
        <h1 className="h2" style={{ fontSize: 34 }}>
          API reference
        </h1>
        <p className="section-lede">
          Everything is a GET over JSON — keyless to try, CORS-enabled, CDN-cached.
          Prefer machine contracts? Use{" "}
          <a href="/openapi.json" style={{ color: "var(--accent)" }}>
            /openapi.json
          </a>{" "}
          (rendered at{" "}
          <a href="/docs/api" style={{ color: "var(--accent)" }}>
            /docs/api
          </a>
          ) or{" "}
          <a href="/llms.txt" style={{ color: "var(--accent)" }}>
            /llms.txt
          </a>{" "}
          for agents.
        </p>
        <nav
          style={{ display: "flex", flexWrap: "wrap", gap: 14, margin: "18px 0 8px" }}
          className="mono"
        >
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} style={{ color: "var(--accent)", fontSize: 12.5 }}>
              {label}
            </a>
          ))}
        </nav>

        <h2 className="h2" id="endpoints" style={{ fontSize: 22, marginTop: 40 }}>
          Endpoints
        </h2>
        <table>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map(([ep, href, desc]) => (
              <tr key={ep}>
                <td>
                  <a href={href}>{ep}</a>
                </td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="section-lede" style={{ marginBottom: 8 }}>
          First request — your first 100 calls each day are free, no key needed:
        </p>
        <div className="quickstart-panel" style={{ maxWidth: "none", marginBottom: 8 }}>
          <pre>
            <CodeView code={`curl "${SITE_URL}/v1/exercises?muscle=chest&sfr_class=high"`} />
          </pre>
        </div>

        <h2 className="h2" id="parameters" style={{ fontSize: 22, marginTop: 40 }}>
          Parameters — GET /v1/exercises
        </h2>
        <p className="section-lede" style={{ marginBottom: 4 }}>
          Distinct filters AND together; comma-separated values within one filter OR
          together. Invalid values return a 400 that lists the valid ones.
        </p>
        <table>
          <thead>
            <tr>
              <th>Param</th>
              <th>Values</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {PARAMS.map(([name, values, desc]) => (
              <tr key={name}>
                <td>{name}</td>
                <td style={{ fontSize: 12.5 }}>{values}</td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="h2" id="fields" style={{ fontSize: 22, marginTop: 40 }}>
          Field dictionary
        </h2>
        <p className="section-lede" style={{ marginBottom: 4 }}>
          {EXERCISE_FIELDS.length} fields, all always present — nullable fields use{" "}
          <code className="inline-code">null</code>, never omission. This table is
          generated from the same schema module the API runs on.
        </p>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {EXERCISE_FIELDS.map((f) => {
              const s = FIELD_SPECS[f];
              const type =
                s.kind === "enum_array" ? "enum[]" : s.kind === "enum" ? "enum" : s.kind;
              return (
                <tr key={f}>
                  <td>{f}</td>
                  <td style={{ fontSize: 12.5 }}>
                    {type}
                    {s.nullable ? " | null" : ""}
                  </td>
                  <td>{s.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h2 className="h2" id="vocabularies" style={{ fontSize: 22, marginTop: 40 }}>
          Vocabularies
        </h2>
        <p className="section-lede" style={{ marginBottom: 14 }}>
          Live from the dataset (counts = records using each value). Also served as
          JSON at <a href="/v1/meta" style={{ color: "var(--accent)" }}>/v1/meta</a>.
          New values may be added within /v1; values are never removed or renamed.
        </p>
        <VocabBlock title="PRIMARY MUSCLES" items={meta.primary_muscles} />
        <VocabBlock title="MOVEMENT PATTERNS" items={meta.patterns} />
        <VocabBlock title="EQUIPMENT" items={meta.equipment} />
        <VocabBlock title="SFR CLASSES" items={meta.sfr_classes} />
        <VocabBlock title="MODALITIES" items={meta.modalities} />
        <VocabBlock title="SUBSTITUTION GROUPS" items={meta.substitution_groups} />
        <VocabBlock title="PROGRESSION GROUPS" items={meta.progression_groups} />

        <h2 className="h2" id="conventions" style={{ fontSize: 22, marginTop: 40 }}>
          Conventions
        </h2>
        <p className="section-lede" style={{ marginBottom: 10 }}>
          Lists use a Stripe-style envelope; errors carry a stable machine-readable{" "}
          <code className="inline-code">code</code>:{" "}
          <code className="inline-code">invalid_parameter</code> (400),{" "}
          <code className="inline-code">not_found</code> (404),{" "}
          <code className="inline-code">rate_limited</code> (429),{" "}
          <code className="inline-code">internal_error</code> (500).
        </p>
        <div className="quickstart-panel" style={{ maxWidth: "none", marginBottom: 12 }}>
          <pre>
            <JsonView
              value={{
                object: "list",
                data: ["…exercise records…"],
                count: 20,
                total: 47,
                limit: 20,
                offset: 0,
              }}
            />
          </pre>
        </div>
        <div className="quickstart-panel" style={{ maxWidth: "none" }}>
          <pre>
            <JsonView
              value={{ error: { code: "not_found", message: "No exercise with id …" } }}
            />
          </pre>
        </div>

        <h2 className="h2" id="rate-limits" style={{ fontSize: 22, marginTop: 40 }}>
          Rate limits
        </h2>
        <p className="section-lede">
          Anonymous use is free: <strong style={{ color: "var(--text)" }}>100 requests
          per day per IP</strong>, plus a per-minute burst limit. /v1 responses carry{" "}
          <code className="inline-code">RateLimit-Limit</code>,{" "}
          <code className="inline-code">RateLimit-Remaining</code> and{" "}
          <code className="inline-code">RateLimit-Reset</code>; exceeding a limit
          returns 429 with the error envelope and{" "}
          <code className="inline-code">Retry-After</code>. Since catalog responses are
          CDN-cached, cache hits are cheap — but still budget your calls: fetch{" "}
          <code className="inline-code">limit=200</code> once and work locally, or pin a
          snapshot release for bulk use. A free API key tier with higher limits is
          planned.
        </p>

        <h2 className="h2" id="versioning" style={{ fontSize: 22, marginTop: 40 }}>
          Versioning
        </h2>
        <p className="section-lede">
          Two independent axes. <strong style={{ color: "var(--text)" }}>API contract</strong>:
          versioned in the path (/v1), additive-only — fields and enum values are added,
          never removed, renamed, or retyped; breaking changes would ship as /v2 with a
          12-month /v1 sunset window.{" "}
          <strong style={{ color: "var(--text)" }}>Dataset content</strong>: semver
          (currently v{DATASET_VERSION}), exposed in /v1/meta and the{" "}
          <code className="inline-code">X-Dataset-Version</code> header on every
          response. MINOR = exercises/fields added, PATCH = corrections. Immutable
          snapshots of each dataset release are published on GitHub for consumers who
          need reproducible builds.
        </p>

        <h2 className="h2" id="license" style={{ fontSize: 22, marginTop: 40 }}>
          License &amp; attribution
        </h2>
        <p className="section-lede">
          The data is CC&nbsp;BY&nbsp;4.0 — free to use, including commercially, but
          products using it <strong style={{ color: "var(--text)" }}>must credit
          ExerciseAPI</strong>. A ready-to-use credit line is served in{" "}
          <a href="/v1/meta" style={{ color: "var(--accent)" }}>
            /v1/meta
          </a>{" "}
          (<code className="inline-code">license.attribution</code>):
        </p>
        <div className="quickstart-panel" style={{ maxWidth: "none" }}>
          <pre>
            <CodeView code={meta.license.attribution} />
          </pre>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
