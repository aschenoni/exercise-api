# ExerciseAPI — Landing Page Design Spec

**Phase:** P2 (see `docs/PLAN.md`) · **Author:** Austin Schenoni · **Date:** 2026-07-02
**Live product (current placeholder):** https://exercise-api-five.vercel.app
**Live API to design against:** `GET /v1/exercises`, `GET /v1/exercises/{id}`, `GET /v1/meta`, `GET /openapi.json` — all public, no key.

## 1. What this page is

The marketing front door for a **free, public REST API** serving a hand-curated,
hypertrophy-focused exercise library (183 exercises, 19 fields each). Positioning:
**"the OpenWeather of exercises"** — a small, clean, opinionated API you can integrate
in five minutes. Reference class: OpenWeather, Stripe, Resend — developer-product
landing pages, not fitness-brand pages.

The page must sell **the dataset's curation** as the moat, not generic exercise data:
stimulus-to-fatigue (SFR) ratings, research/EMG-backed "gold standard" flags, e1RM
substitution groups, calisthenics progression chains, curated rep ranges, coaching cues.

## 2. Audience (in priority order)

1. **Indie fitness-app developer** — evaluating: "is this data good, and how fast can I integrate?"
2. **Hobbyist / hackathon builder** — wants zero-friction: no signup, no key, copy-paste and go.
3. **Coaches / data nerds** — curious about the catalog itself; will browse and suggest additions.

Success = a developer goes landing → docs → first successful request **unaided, in minutes**.

## 3. Page structure (proposed sections, top to bottom)

1. **Hero** — one-line value prop + subline. Primary CTA: "Read the docs".
   Secondary CTA: copyable `curl` one-liner (the real API works from the hero — use it).
   Free-tier framing in the hero: **"Your first 100 calls each day are free — no key
   required to try it."** Do NOT use "always free", "free forever", "never a key", or
   any license name in the hero (positioning: free-to-start with a paid ramp later,
   à la OpenWeather — see PRODUCT.md §6.5/§7).
2. **Live example** — request/response pair, ideally interactive: a real request to
   `/v1/exercises` with a filter, and the actual JSON response. This is the product demo.
   Highlight the killer filter: `available_equipment=dumbbells,flat_bench` (subset match —
   "only exercises you can actually do with the gear you have").
3. **Why this dataset** — 3–4 cards on the curation moat: SFR ratings · gold-standard
   flags (EMG/research-backed) · e1RM substitution groups · calisthenics progression
   chains. Short, concrete, no fitness-influencer tone.
4. **Dataset stats strip** — 183 exercises · 87 core / 96 extended · 16 muscles ·
   20 movement patterns · 34 equipment tokens · dataset v1.0.0. (Pull live from
   `/v1/meta` if feasible; static is acceptable.)
5. **Quickstart** — three tabs or columns: `curl` / JS `fetch` / Python `requests`.
   Copy buttons. Each ends with "that's it — no key needed to start."
6. **Agent-ready** — small section: OpenAPI 3.1 (`/openapi.json`), `llms.txt`, stable
   slugs + machine-readable errors. Audience: people building AI tools.
7. **Pricing posture** — small section, three steps: try it keyless (100 free
   calls/day) → free API key for higher limits (fast follow) → commercial tier
   for teams (coming). Design this as a simple ladder, not a pricing table —
   there are no prices yet. Plus a link to suggestions (community input) once
   it ships.
8. **Footer** — docs, OpenAPI, GitHub (coming), changelog, licenses (data CC BY 4.0,
   code MIT — the footer is the ONLY place licensing appears on this page).

Monetization surfaces (P5, design now, ship later): one **ad slot** placement that
degrades to invisible/harmless when unconfigured (Carbon/EthicalAds style — a small
sidebar/footer unit, never interrupting content), and a **"Buy me a coffee"** affordance
in header or footer. Never inside API examples or docs content.

## 4. Content & tone

- Voice: precise, technical, a little dry; humor allowed in example data, not in claims.
- **Never promise permanence**: no "always free", "free forever", "never a key",
  "100% free". The offer is a concrete daily allowance ("first 100 calls/day free")
  and instant keyless trial. Keys and paid tiers are roadmap; copy must not
  contradict them.
- No stock fitness photography, no gym-bro aesthetics. This is a developer tool.
- All example requests/responses must be **real** — copyable and working against the
  live API. No fabricated fields.
- SEO basics: title, meta description, OG image (design one — likely a terminal-style
  request/response card with the wordmark).

## 5. Visual direction (open to proposals)

Current placeholder is a dark, terminal-adjacent single column (background `#0b0d10`,
green accent `#4ade80`, monospace accents) — it works but is generic. Open questions
for design:

- Keep dark-only, or dark/light with system preference?
- A distinctive accent direction that isn't "default green terminal" is welcome;
  must keep AA contrast for code samples and muted text.
- Typography: system stack today; a distinctive display face for headings is on the
  table if it stays fast (self-hosted, subset).
- JSON syntax highlighting style is a brand surface — treat response blocks as the
  hero image of the page.

## 6. Constraints

- **Stack:** Next.js 16 App Router, React 19. Prefer zero new runtime deps for the
  landing page; CSS is plain (no Tailwind currently — adopting it is negotiable if
  design system warrants).
- **Performance:** static/prerendered; no client JS beyond copy buttons + (optional)
  live example fetch. Lighthouse ≥ 95 across the board.
- **Responsive:** single breakpoint strategy fine; code blocks must scroll, never wrap
  the page.
- **Accessibility:** AA contrast, keyboard-reachable copy buttons/tabs, semantic headings.
- The `/docs` site (endpoint reference, field dictionary) is a separate P2 deliverable;
  the landing links into it. Shared header/footer between the two is expected.

## 7. Deliverables requested from design

1. Landing page layout (desktop + mobile) covering sections in §3.
2. Color/type tokens (dark mode at minimum) incl. JSON syntax-highlight palette.
3. Component specs: stat chip, feature card, code block w/ copy, quickstart tabs,
   ad-slot placeholder treatment, header/footer.
4. OG image concept.
