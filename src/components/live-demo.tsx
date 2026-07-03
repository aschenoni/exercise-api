"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";

/**
 * The interactive `available_equipment` demo — runs against the real API on
 * the same origin. This is the product demo, so failures degrade to a static
 * offline preview rather than an empty panel.
 */

const EQUIP: [string, string][] = [
  ["dumbbells", "Dumbbells"],
  ["flat_bench", "Flat bench"],
  ["adjustable_bench", "Adjustable bench"],
  ["cable_stack", "Cables"],
  ["barbell", "Barbell"],
  ["pullup_bar", "Pull-up bar"],
  ["resistance_bands", "Bands"],
  ["none_bodyweight", "Bodyweight"],
];

interface Row {
  name: string;
  primary_muscle: string;
  sfr_class: "high" | "moderate" | "low";
  is_gold_standard: boolean;
}

const FALLBACK: Row[] = [
  { name: "Dumbbell Bench Press", primary_muscle: "chest", sfr_class: "high", is_gold_standard: true },
  { name: "Incline Dumbbell Press", primary_muscle: "chest", sfr_class: "high", is_gold_standard: true },
  { name: "One-Arm Dumbbell Row", primary_muscle: "upper_back", sfr_class: "high", is_gold_standard: true },
  { name: "Dumbbell Romanian Deadlift", primary_muscle: "hamstrings", sfr_class: "moderate", is_gold_standard: false },
  { name: "Bulgarian Split Squat", primary_muscle: "quads", sfr_class: "high", is_gold_standard: true },
];

export function LiveDemo() {
  const [equip, setEquip] = useState<string[]>(["dumbbells", "flat_bench"]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  const query = `/v1/exercises?available_equipment=${equip.join(",")}&sfr_class=high`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(false);
    fetch(`${query}&limit=6`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setRows((d.data ?? []).slice(0, 6));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRows(null);
        setErr(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const toggle = (tok: string) => {
    track("demo_equipment_toggled", { token: tok });
    setEquip((prev) => {
      const next = prev.includes(tok) ? prev.filter((t) => t !== tok) : [...prev, tok];
      return next.length === 0 ? ["dumbbells"] : next;
    });
  };

  const shown = rows ?? (err ? FALLBACK : []);
  const header = loading
    ? "fetching…"
    : `${shown.length} match${shown.length === 1 ? "" : "es"} · top ${Math.min(shown.length, 6)}`;
  const footer = err
    ? "offline preview — the live page fetches from the real API"
    : loading
      ? ""
      : "subset match: every result runs on the gear you selected.";

  return (
    <div className="demo-grid">
      <div className="panel panel-pad">
        <div className="panel-label">YOUR EQUIPMENT</div>
        <div className="chips">
          {EQUIP.map(([tok, label]) => (
            <button
              key={tok}
              type="button"
              className="chip"
              aria-pressed={equip.includes(tok)}
              onClick={() => toggle(tok)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="query-line">
          <span className="method">GET</span> {query}
        </div>
      </div>

      <div className="panel results">
        <div className="results-head">
          <span aria-live="polite">{header}</span>
          <span className="results-status">200 OK</span>
        </div>
        {shown.map((ex) => (
          <div key={ex.name} className="result-row">
            <span className={`sfr-badge sfr-${ex.sfr_class}`}>
              SFR {ex.sfr_class[0].toUpperCase()}
            </span>
            <span className="result-name">{ex.name}</span>
            <span className="result-muscle">{ex.primary_muscle.replace(/_/g, " ")}</span>
            <span className="gold-flag">{ex.is_gold_standard ? "★ gold" : ""}</span>
          </div>
        ))}
        <div className="results-foot">{footer}</div>
      </div>
    </div>
  );
}
