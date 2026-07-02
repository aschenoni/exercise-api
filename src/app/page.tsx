import { DATASET_VERSION, EXERCISES, getMeta } from "@/lib/dataset";

export default function Home() {
  const meta = getMeta();
  return (
    <main>
      <span className="tag">exerciseapi · pre-launch</span>
      <h1>The exercise catalog API</h1>
      <p className="lede">
        A free, public REST API for a hand-curated, hypertrophy-focused exercise
        library — stimulus-to-fatigue ratings, research-backed gold standards,
        e1RM substitution groups, calisthenics progression chains, curated rep
        ranges, and coaching cues. Your first 100 calls each day are free — no
        key required to try it.
      </p>

      <div className="stats">
        <span className="stat">
          <strong>{EXERCISES.length}</strong> exercises
        </span>
        <span className="stat">
          <strong>{meta.primary_muscles.length}</strong> muscles
        </span>
        <span className="stat">
          <strong>{meta.patterns.length}</strong> movement patterns
        </span>
        <span className="stat">
          <strong>{meta.equipment.length}</strong> equipment tokens
        </span>
        <span className="stat">
          <strong>v{DATASET_VERSION}</strong> dataset
        </span>
      </div>

      <pre>
        <span className="c"># everything you can do with dumbbells and a bench,</span>
        {"\n"}
        <span className="c"># best stimulus-to-fatigue first</span>
        {"\n"}
        curl <span className="a">
          &quot;/v1/exercises?available_equipment=dumbbells,flat_bench&amp;sfr_class=high&quot;
        </span>
      </pre>

      <div className="links">
        <a href="/v1/exercises?limit=5">GET /v1/exercises</a>
        <a href="/v1/exercises/barbell_bench_press">GET /v1/exercises/:id</a>
        <a href="/v1/meta">GET /v1/meta</a>
        <a href="/openapi.json">openapi.json</a>
        <a href="/health">health</a>
      </div>

      <footer>
        Data licensed CC BY 4.0 · Code MIT · Docs site coming soon
      </footer>
    </main>
  );
}
