import { DATASET_VERSION, getExerciseById, getMeta } from "@/lib/dataset";
import { EXPECTED_COUNTS } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { JsonView, CodeView } from "@/components/highlight";
import { CopyButton } from "@/components/copy-button";
import { LiveDemo } from "@/components/live-demo";
import { Quickstart } from "@/components/quickstart";

const CURL_SNIPPET = `curl "${SITE_URL}/v1/exercises?available_equipment=dumbbells,flat_bench&sfr_class=high"`;

const JS_SNIPPET = `const res = await fetch(
  "${SITE_URL}/v1/exercises?" +
  new URLSearchParams({
    available_equipment: "dumbbells,flat_bench",
    sfr_class: "high",
  })
);
const { data } = await res.json();
console.log(data[0].name, data[0].sfr_class);`;

const PY_SNIPPET = `import requests

r = requests.get(
    "${SITE_URL}/v1/exercises",
    params={
        "available_equipment": "dumbbells,flat_bench",
        "sfr_class": "high",
    },
)
print(r.json()["data"][0]["name"])`;

export default function Home() {
  const meta = getMeta();
  const heroExercise = getExerciseById("barbell_bench_press");
  // Env-gated (PRODUCT.md §6.5): the ad slot renders nothing until a provider
  // is configured, e.g. NEXT_PUBLIC_AD_PROVIDER=carbon.
  const adConfigured = Boolean(process.env.NEXT_PUBLIC_AD_PROVIDER);

  return (
    <>
      <SiteHeader />
      <main>
        {/* ============ HERO ============ */}
        <section className="container hero">
          <div className="hero-grid">
            <div>
              <div className="eyebrow eyebrow-pill" style={{ marginBottom: 22 }}>
                REST API · 100 FREE CALLS/DAY
              </div>
              <h1>
                The exercise
                <br />
                catalog API
              </h1>
              <p className="hero-lede">
                A hand-curated, hypertrophy-focused library. Stimulus-to-fatigue
                ratings, research-backed gold-standard flags, e1RM substitution
                groups — JSON in five minutes. Your first 100 calls each day are
                free, no key required to try it.
              </p>
              <div className="hero-ctas">
                <a href="/docs" className="btn-hero">
                  Read the docs →
                </a>
                <CopyButton text={CURL_SNIPPET} idle="⧉" copied="✓" className="btn-copy-curl">
                  curl /v1/exercises
                </CopyButton>
              </div>
              <div className="hero-stats">
                <div>
                  <div className="hero-stat-num">{meta.counts.total}</div>
                  <div className="stat-label">Exercises</div>
                </div>
                <div>
                  <div className="hero-stat-num">{meta.primary_muscles.length}</div>
                  <div className="stat-label">Muscles</div>
                </div>
                <div>
                  <div className="hero-stat-num">{meta.equipment.length}</div>
                  <div className="stat-label">Equipment</div>
                </div>
              </div>
            </div>
            <div className="terminal">
              <div className="terminal-bar">
                <span className="terminal-dot" />
                <span className="terminal-dot" />
                <span className="terminal-dot" />
                <span className="terminal-title">
                  <span className="method">GET</span> /v1/exercises/barbell_bench_press
                </span>
              </div>
              <pre>
                <JsonView value={heroExercise} />
              </pre>
            </div>
          </div>
        </section>

        {/* ============ LIVE EXAMPLE ============ */}
        <section className="section section-alt">
          <div className="container section-pad">
            <div className="eyebrow">LIVE · TRY IT</div>
            <h2 className="h2">Matched to the gear you have</h2>
            <p className="section-lede">
              <code className="inline-code">available_equipment</code> does a subset
              match — pick your gear and the catalog narrows to exercises you can do
              right now, best stimulus-to-fatigue first. This runs against the real
              API.
            </p>
            <LiveDemo />
          </div>
        </section>

        {/* ============ WHY THIS DATASET ============ */}
        <section className="section">
          <div className="container section-pad">
            <div className="eyebrow">WHAT&apos;S IN THE DATA</div>
            <h2 className="h2">20 fields per exercise</h2>
            <p className="section-lede" style={{ maxWidth: "60ch" }}>
              Beyond names and muscles, each exercise carries the metadata a training
              app usually has to build by hand. A few of the more useful ones:
            </p>
            <div className="fields-grid">
              <div className="field-card">
                <div className="field-card-head">
                  <span>sfr_class</span>
                  <span className="sfr-pips">
                    <span className="sfr-pip" style={{ background: "var(--green)" }} />
                    <span className="sfr-pip" style={{ background: "var(--accent)" }} />
                    <span className="sfr-pip" style={{ background: "rgba(255,255,255,.12)" }} />
                  </span>
                </div>
                <h3>Stimulus-to-fatigue ratings</h3>
                <p>
                  Every exercise rated <span style={{ color: "var(--green)" }}>high</span> /{" "}
                  <span style={{ color: "var(--accent)" }}>moderate</span> / low. Program the
                  movements that give the most growth for the least recovery cost.
                </p>
              </div>
              <div className="field-card">
                <div className="field-card-head">
                  <span>is_gold_standard</span>
                  <span style={{ color: "var(--purple)" }}>true</span>
                </div>
                <h3>Gold-standard flags</h3>
                <p>
                  EMG- and research-backed picks, ranked one-per-movement. Default to the
                  best-evidence choice without a literature review.
                </p>
              </div>
              <div className="field-card">
                <div className="field-card-head">
                  <span>e1rm_substitution_group</span>
                </div>
                <h3>e1RM substitution groups</h3>
                <p>
                  Swap a barbell bench for a dumbbell press within the same group and keep
                  the estimated-1RM math honest across the swap.
                </p>
              </div>
              <div className="field-card">
                <div className="field-card-head">
                  <span>progression_group · progression_level</span>
                </div>
                <h3>Calisthenics progression chains</h3>
                <p>
                  Ordered skill ladders — tuck → advanced tuck → full front lever — so a
                  bodyweight app knows what comes next.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ STATS STRIP ============ */}
        <section className="section section-alt">
          <div className="container stats-strip" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div className="stats-cell">
              <div className="stats-num">{meta.counts.total}</div>
              <div className="stat-label">Exercises</div>
            </div>
            <div className="stats-cell">
              <div className="stats-num">
                {EXPECTED_COUNTS.core}
                <span className="dim"> / {EXPECTED_COUNTS.extended}</span>
              </div>
              <div className="stat-label">Core / Extended</div>
            </div>
            <div className="stats-cell">
              <div className="stats-num">{meta.primary_muscles.length}</div>
              <div className="stat-label">Muscles</div>
            </div>
            <div className="stats-cell">
              <div className="stats-num">{meta.patterns.length}</div>
              <div className="stat-label">Patterns</div>
            </div>
            <div className="stats-cell">
              <div className="stats-num">{meta.equipment.length}</div>
              <div className="stat-label">Equipment</div>
            </div>
            <div className="stats-cell">
              <div className="stats-num" style={{ color: "var(--accent)" }}>
                v{DATASET_VERSION}
              </div>
              <div className="stat-label">Dataset</div>
            </div>
          </div>
        </section>

        {/* ============ QUICKSTART ============ */}
        <section className="section">
          <div className="container section-pad">
            <div className="eyebrow">QUICKSTART</div>
            <h2 className="h2" style={{ marginBottom: 30 }}>
              One request, no setup
            </h2>
            <Quickstart
              tabs={[
                {
                  id: "curl",
                  label: "curl",
                  code: CURL_SNIPPET,
                  rendered: <CodeView code={CURL_SNIPPET} />,
                  footer: "# that's it — no key needed to start.",
                },
                {
                  id: "js",
                  label: "JavaScript",
                  code: JS_SNIPPET,
                  rendered: <CodeView code={JS_SNIPPET} />,
                  footer: "// that's it — no key needed to start.",
                },
                {
                  id: "python",
                  label: "Python",
                  code: PY_SNIPPET,
                  rendered: <CodeView code={PY_SNIPPET} />,
                  footer: "# that's it — no key needed to start.",
                },
              ]}
            />
          </div>
        </section>

        {/* ============ AGENT-READY ============ */}
        <section className="section section-alt">
          <div className="container section-pad">
            <div className="eyebrow">AGENT-READY</div>
            <h2 className="h2">Built for tools, not just people</h2>
            <p className="section-lede" style={{ maxWidth: "60ch" }}>
              Everything an LLM or codegen agent needs to integrate unattended.
            </p>
            <div className="agent-grid">
              <div className="agent-card">
                <div className="agent-card-title">/openapi.json</div>
                <div className="agent-card-body">
                  OpenAPI 3.1 spec — generate a typed client in seconds.
                </div>
              </div>
              <div className="agent-card">
                <div className="agent-card-title">/llms.txt</div>
                <div className="agent-card-body">
                  Plain-text map of the API for retrieval and agents.
                </div>
              </div>
              <div className="agent-card">
                <div className="agent-card-title">stable slugs</div>
                <div className="agent-card-body">
                  <code>barbell_bench_press</code> never changes — safe to hardcode.
                </div>
              </div>
              <div className="agent-card">
                <div className="agent-card-title">typed errors</div>
                <div className="agent-card-body">
                  Machine-readable error bodies with a stable <code>code</code>.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ PRICING POSTURE ============ */}
        <section className="section">
          <div className={`container section-pad${adConfigured ? " pricing-grid" : ""}`}>
            <div>
              <div className="eyebrow">PRICING</div>
              <h2 className="h2">Free to start. Scale when you ship.</h2>
              <p className="section-lede" style={{ marginBottom: 0, maxWidth: "52ch" }}>
                Try the whole catalog before you write a line of integration code —
                then grow into higher limits as your app does.
              </p>
              <div className="ladder">
                <div className="ladder-step">
                  <span className="ladder-num">01</span>
                  <div>
                    <h3>Try it keyless</h3>
                    <p>
                      Your first 100 calls each day are free. No signup, no token —
                      the hero request above works right now.
                    </p>
                  </div>
                </div>
                <div className="ladder-step">
                  <span className="ladder-num">02</span>
                  <div>
                    <h3>
                      Free API key<span className="ladder-soon">COMING SOON</span>
                    </h3>
                    <p>Higher daily limits and basic usage stats for real projects.</p>
                  </div>
                </div>
                <div className="ladder-step">
                  <span className="ladder-num">03</span>
                  <div>
                    <h3>
                      Commercial tier<span className="ladder-soon">PLANNED</span>
                    </h3>
                    <p>High limits, commercial-use assurance, and an SLA for teams.</p>
                  </div>
                </div>
              </div>
            </div>
            {adConfigured && (
              <div className="ad-slot" aria-hidden="true">
                <div className="ad-slot-label">AD SLOT · 300×250</div>
                <div className="ad-slot-body">
                  Ad unit placeholder — wire the configured provider here.
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
