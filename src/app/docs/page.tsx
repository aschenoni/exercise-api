import type { Metadata } from "next";
import { DATASET_VERSION, getMeta } from "@/lib/dataset";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { CodeView } from "@/components/highlight";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Docs — ExerciseAPI",
  description:
    "Endpoint reference for ExerciseAPI. Full documentation site is in progress — the OpenAPI 3.1 spec is the canonical contract.",
};

const ENDPOINTS: [string, string][] = [
  ["GET /v1/exercises", "List & filter — muscle, pattern, equipment, available_equipment (subset match), tier, modality, sfr_class, booleans, q search, sort, limit/offset."],
  ["GET /v1/exercises/{id}", "One exercise by stable slug, e.g. barbell_bench_press."],
  ["GET /v1/meta", "Controlled vocabularies with counts + current dataset_version."],
  ["GET /health", "Liveness + dataset size."],
  ["GET /openapi.json", "OpenAPI 3.1 spec — the canonical machine contract."],
];

export default function Docs() {
  const meta = getMeta();
  return (
    <>
      <SiteHeader />
      <main className="container docs-main">
        <div className="eyebrow">DOCS · EARLY</div>
        <h1 className="h2" style={{ fontSize: 34 }}>
          Endpoint reference
        </h1>
        <p className="section-lede">
          The full documentation site (field dictionary, vocabulary reference, rendered
          OpenAPI) is in progress. Until then: every endpoint below is live, and{" "}
          <a href="/openapi.json" style={{ color: "var(--accent)" }}>
            /openapi.json
          </a>{" "}
          carries the complete request/response schemas with examples.
        </p>
        <table>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map(([ep, desc]) => (
              <tr key={ep}>
                <td>
                  <a href={ep.replace("GET ", "").replace("{id}", "barbell_bench_press")}>
                    {ep}
                  </a>
                </td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="section-lede" style={{ marginTop: 28, marginBottom: 12 }}>
          First request — your first 100 calls each day are free, no key needed to start:
        </p>
        <div className="quickstart-panel" style={{ maxWidth: "none" }}>
          <pre>
            <CodeView
              code={`curl "${SITE_URL}/v1/exercises?muscle=chest&sfr_class=high"`}
            />
          </pre>
        </div>
        <p className="section-lede" style={{ marginTop: 28 }}>
          The catalog currently holds {meta.counts.total} exercises (dataset v
          {DATASET_VERSION}). The /v1 contract is additive-only: fields and enum values
          are added, never removed or retyped.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
