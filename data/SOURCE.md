# Orion Curated Exercise Library

A hand-curated, hypertrophy-focused exercise library that the deterministic prescription
engine selects from. Every entry earns its place as either a distinct movement, a
machine/cable variation, or an equipment/portability alternative. Consistent tagging is
the contract: the engine relies on `e1rm_substitution_group`, `preferred_rank`,
`primary_muscle`, and the equipment taxonomy to pick and swap exercises deterministically.

- **`exercises.json`** — 87 exercise objects (the **core** tier).
- **`exercises_extended.json`** — 96 additional exercise objects (the **extended** tier):
  49 extended-conventional variations plus 47 Overcoming Gravity gymnastics/calisthenics
  progression rungs across 9 difficulty-ordered chains.
- **`README.md`** — this file (schema, taxonomy, tiers, progressions, citations, coverage, seed plan, caveats).

> **Tiers.** `exercises.json` is the curated core the engine prefers by default. `exercises_extended.json`
> is an additive breadth/depth layer — it never modifies or supersedes a core entry, and every entry in it
> carries `"tier": "extended"`. Core entries have no `tier` field (treat absent as `"core"`). All `id`s are
> unique across **both** files. The two new schema fields (`progression_group`, `progression_level`) and two
> new equipment tokens (`gymnastic_rings`, `parallettes`) appear only in the extended file.

---

## Schema

Each object in `exercises.json` has exactly these fields:

| Field | Type | Meaning |
|---|---|---|
| `id` | string | snake_case stable identifier (primary key). |
| `name` | string | Human-readable display name. |
| `primary_muscle` | enum | The target muscle (one of the 16 below). |
| `secondary_muscles` | string[] | Other muscles meaningfully worked (may be empty). |
| `pattern` | enum | Movement pattern (see list below). |
| `equipment` | string[] | **All** equipment truly required, from the controlled vocab. |
| `sfr_class` | `high`/`moderate`/`low` | Stimulus-to-fatigue ratio for the **primary** muscle. Isolation/machine work tends `high`; big spinal-loading compounds tend `moderate`/`low`. |
| `is_gold_standard` | bool | Research/EMG-favorable preferred pick for its muscle. |
| `preferred_rank` | int | 1 = most preferred within its `e1rm_substitution_group` (lower is better). |
| `e1rm_substitution_group` | string | Movements close enough to substitute and share an e1RM series. |
| `default_rep_low` / `default_rep_high` | int | Default hypertrophy rep range (compounds ~6–10, isolations ~10–15; planks/bridges use seconds). |
| `loadable` | bool | External-load progressible (double progression) vs bodyweight-rep progression. |
| `unilateral` | bool | Trained one limb at a time. |
| `home_hotel_friendly` | bool | Doable with minimal/portable equipment (bands, dumbbells, bodyweight, suspension, pull-up bar, ab wheel). |
| `cues` | string | One-line form cue. |

### Extended-tier fields (only in `exercises_extended.json`)

| Field | Type | Meaning |
|---|---|---|
| `tier` | `"extended"` | Marks the entry as part of the additive extended layer. Core entries omit this field. |
| `progression_group` | string \| null | Id of a difficulty-ordered bodyweight progression chain (e.g. `planche_push_line`), or `null` for ordinary (non-progression) movements. |
| `progression_level` | int \| null | 1-based position in that chain (1 = easiest), or `null` when `progression_group` is `null`. Levels within a group are **contiguous** (1..n) and ordered easiest→hardest. |

`progression_group` and `progression_level` are always either both set (a progression rung) or both
`null` (an ordinary extended variation). The 49 extended-conventional variations use `null/null`; the
47 gymnastics rungs carry a group + level.

### Muscle list (controlled — used for `primary_muscle`; secondary may reuse)
`chest, lats, upper_back, traps, front_delts, side_delts, rear_delts, biceps, triceps,
forearms, quads, hamstrings, glutes, calves, abs, lower_back`

### Pattern values (controlled)
`horizontal_press, incline_press, vertical_press, horizontal_pull, vertical_pull, hip_hinge,
squat, lunge, fly, lateral_raise, rear_delt, curl, triceps_extension, leg_extension, leg_curl,
hip_thrust, calf_raise, trunk_flexion, anti_extension, shrug`

---

## Equipment taxonomy (controlled vocabulary)

Use **only** these strings in `equipment`. List everything truly required: a barbell bench
press needs `barbell` + `flat_bench` (+ `power_rack` for safe loading); a dumbbell incline
press needs `dumbbells` + `adjustable_bench`.

**Free weights & benches:** `barbell, ez_curl_bar, dumbbells, kettlebell, adjustable_bench,
flat_bench, power_rack, preacher_bench`

**Cables & machines:** `cable_stack, lat_pulldown, seated_row_machine, chest_press_machine,
pec_deck, shoulder_press_machine, leg_press, hack_squat_machine, leg_extension_machine,
leg_curl_machine, standing_calf_machine, seated_calf_machine, hip_thrust_machine,
assisted_pullup_machine, smith_machine, t_bar_row`

**Bodyweight, minimal & portable:** `pullup_bar, dip_station, bench_or_box, resistance_bands,
suspension_trainer, ab_wheel, landmine, dip_belt, none_bodyweight`

**New in the extended tier:** `gymnastic_rings, parallettes`

- `gymnastic_rings` — a pair of gymnastic rings hung from a bar/anchor. Drives the ring-dip and
  full-front-lever-row rungs and the ring support hold. Portable, so `home_hotel_friendly: true`.
- `parallettes` — low parallel handles (or push-up bars). Used for pseudo-planche / planche holds,
  L-sit progressions, and deficit handstand push-ups. Portable, so `home_hotel_friendly: true`.

Items tagged `resistance_bands`, `suspension_trainer`, `none_bodyweight`, `pullup_bar`,
`ab_wheel`, `gymnastic_rings`, `parallettes`, and most `dumbbells`-only movements are what drive
`home_hotel_friendly: true`. Floor-only, `pullup_bar`, `gymnastic_rings`, `parallettes`, and
`dip_station` progression rungs are all flagged home/hotel-friendly.

---

## Gold-standard rationale and citations

`is_gold_standard: true` flags the research/EMG-favorable preferred pick for a muscle. The
heuristic combines three signals: (1) high surface-EMG activation for the target muscle,
(2) favorable mechanics — loaded-stretch position, a resistance profile that challenges the
muscle through range, and stability that keeps fatigue on the target rather than stabilizers,
and (3) long-standing training practice. Where the literature and mechanics agree, the pick
is well supported. Citations below.

| Muscle group | Gold-standard pick(s) | Evidence basis |
|---|---|---|
| Chest (horizontal) | Barbell Bench Press | ACE-sponsored EMG study ranked barbell bench press top among common chest movements. |
| Chest (incline) | Incline Barbell Press | Bench inclination ~30 deg maximizes upper-pec EMG before deltoid takes over. |
| Chest (fly) | Pec Deck / Cable Fly | High pec EMG with strong stretch tension; fly mechanics isolate the pec. |
| Lats / back width | Pull-up & Lat Pulldown | Boeckh-Behrens and later EMG work show pulldowns/pull-ups maximize lat activation. |
| Upper back (row) | Barbell Bent-Over Row | High mid-back/lat EMG; heavy-loadable horizontal pull. |
| Front delts | Standing Overhead Press | Overhead press generates greater deltoid activation than most shoulder movements. |
| Side delts | Cable / Dumbbell Lateral Raise | Lateral raise is the targeted side-delt movement; cable gives constant tension. |
| Rear delts | Reverse Pec Deck | Isolated horizontal abduction with constant tension; high rear-delt EMG. |
| Biceps | Concentration & Incline Curl | ACE EMG study ranked concentration curl #1 for biceps activation; incline curl adds loaded stretch. |
| Triceps | Overhead Extension / Skullcrusher | Diamond push-up topped ACE's triceps EMG ranking; overhead/skullcruncher add the stretched (long-head) position favored for hypertrophy. |
| Quads (squat) | Back Squat / Hack Squat | Squats produce the highest quad MVC among compound leg movements. |
| Quads (isolation) | Leg Extension | Isolated knee extension, peak quad tension, high SFR. |
| Hamstrings (hinge) | Romanian Deadlift | Loaded-stretch eccentric; the premier hinge for hamstring hypertrophy. |
| Hamstrings (curl) | Lying / Seated Leg Curl | Highest hamstring EMG via isolated knee flexion; seated biases the stretched position. |
| Glutes | Barbell Hip Thrust | Contreras et al. found markedly higher glute-max EMG vs back squat at matched load. |
| Calves (gastroc) | Standing Calf Raise | Standing (knee-extended) drove >2x gastrocnemius growth vs seated in a hypertrophy trial. |
| Calves (soleus) | Seated Calf Raise | Bent-knee position biases the soleus, which standing raises under-stimulate. |
| Abs | Hanging Leg Raise / Cable Crunch / Ab Wheel | High rectus-abdominis EMG; ab wheel is the anti-extension benchmark. |
| Lower back | Back Extension / Deadlift | Loaded spinal extension / hip hinge; the foundational posterior-chain builders. |

**Citations**

- ACE chest study (barbell bench press most effective): [ACE press release](https://www.acefitness.org/about-ace/press-room/press-releases/2930/ace-study-tests-common-chest-exercises-finds-barbell-bench-press-most-effective/), [ACE Best Chest Exercises PDF](https://contentcdn.eacefitness.com/certifiednews/images/article/pdfs/ACE_BestChestExercises.pdf)
- Bench inclination & pec/deltoid EMG (~30 deg optimal): [Rodriguez-Ridao et al., 2020 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7579505/)
- Lat pulldown / pull-up lat activation (Boeckh-Behrens & later EMG): [SuppVersity EMG series — Latissimus](https://suppversity.blogspot.com/2011/07/suppversity-emg-series-latissimus.html), [Lat pulldown grip EMG (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12452428/)
- ACE biceps study (concentration curl #1): [ACE ProSource — Best Biceps Exercises](https://www.acefitness.org/continuing-education/prosource/august-2014/4933/ace-study-reveals-best-biceps-exercises/), [ACE Biceps Study PDF](https://acewebcontent.azureedge.net/certifiednews/images/article/pdfs/ACE%20BicepsStudy.pdf)
- ACE triceps study (triangle/diamond push-up top, kickback/overhead high): [ACE Best Triceps Exercises](https://www.acefitness.org/certifiednewsarticle/3008/ace-study-identifies-best-triceps-exercises/)
- Hip thrust vs squat glute EMG (Contreras et al.): [A Comparison of Gluteus Maximus... EMG (PubMed)](https://pubmed.ncbi.nlm.nih.gov/26695353/), [Bret Contreras — Squats vs Hip Thrusts EMG](https://bretcontreras.com/squats-versus-hip-thrusts-emg-activity/)
- Standing vs seated calf-raise hypertrophy (gastroc vs soleus): [Kinoshita et al., 2023 — Frontiers in Physiology](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1272106/full), [PMC mirror](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10753835/)
- Hamstring leg-curl vs hip-extension EMG: [Hegyi et al. — PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0245838)
- RDL loaded-stretch hamstring rationale (mechanics/practice): [SuppVersity EMG series — legs](https://suppversity.blogspot.com/2011/08/suppversity-emg-series-gluteaus-maximus.html)

### Honest caveat: EMG is not hypertrophy

Surface EMG measures electrical activation during a movement, not long-term muscle growth.
Higher acute EMG does **not** prove more hypertrophy — growth depends on mechanical tension
through range (especially the lengthened position), effective reps near failure, and
accumulated volume over time. The "gold standard" label here is a defensible heuristic:
EMG-favorable picks that are also corroborated by mechanics and decades of training practice.
It is a starting prior for the prescription engine, **not** a claim of proven superiority.
Where the EMG is mixed (e.g. dumbbell vs barbell bench), we defer to mechanics, loadability,
and SFR rather than EMG alone, and rank substitutions accordingly.

---

## Coverage summary

**Core tier: 87 exercises** across all 16 muscles. Every muscle has **at least one gold-standard
pick, at least one variation, and at least one `home_hotel_friendly` option** in its substitution
group(s). The per-muscle table below reflects the core file only.

**Extended tier: 96 exercises** (183 total across both files): 49 extended-conventional variations
that deepen the existing core substitution groups, plus 47 gymnastics-progression rungs across the
9 new chains documented above. The extended tier adds new `e1rm_substitution_group`s for the
gymnastics chains (`planche_horizontal_push`, `handstand_vertical_push`, `dip_vertical_push`,
`front_lever_horizontal_pull`, `vertical_pull_progression`, `single_leg_squat_progression`,
`nordic_curl_progression`, `core_anti_extension_progression`, `lsit_flexion_progression`) and slots
its conventional variations into the existing core groups.

| Muscle | # movements | Gold-standard | Home/hotel option |
|---|---|---|---|
| chest | 10 | yes (3) | yes (push-up, decline push-up, band fly) |
| lats | 5 | yes (2) | yes (bodyweight pull-up, band pulldown) |
| upper_back | 6 | yes (1) | yes (band row, suspension row) |
| traps | 3 | yes (1) | yes (dumbbell shrug) |
| front_delts | 4 | yes (1) | yes (band overhead press) |
| side_delts | 4 | yes (2) | yes (dumbbell & band lateral raise) |
| rear_delts | 4 | yes (1) | yes (dumbbell & band rear delt fly) |
| biceps | 6 | yes (2) | yes (concentration curl, band curl) |
| triceps | 7 | yes (2) | yes (diamond push-up, db overhead, band pushdown) |
| forearms | 4 | yes (1) | yes (db wrist curl, hammer curl, band wrist curl) |
| quads | 8 | yes (3) | yes (goblet squat, lunges, split squat) |
| hamstrings | 6 | yes (3) | yes (db RDL, band RDL, Nordic curl) |
| glutes | 5 | yes (1) | yes (db hip thrust, band bridge, band abduction) |
| calves | 5 | yes (2) | yes (db & bodyweight calf raise) |
| abs | 6 | yes (3) | yes (hanging raise, weighted/lying raise, ab wheel, plank) |
| lower_back | 4 | yes (2) | yes (bird dog, band good morning) |

### Substitution groups

Groups span gold-standard → machine/cable → dumbbell → home/hotel (band/bodyweight) with
sensible `preferred_rank` ordering, so the engine can degrade gracefully from a fully-equipped
gym to a hotel room:

`chest_horizontal_press, chest_incline_press, chest_fly, lats_vertical_pull,
back_horizontal_row, traps_shrug, shoulder_vertical_press, side_delt_raise, rear_delt_fly,
biceps_curl, triceps_extension, forearm_flexion, quad_squat, quad_extension, quad_lunge,
hamstring_hinge, hamstring_curl, glute_hip_thrust, glute_abduction, calf_standing, calf_seated,
abs_flexion, abs_anti_extension, lower_back_extension`

Note: `calf_standing` (gastrocnemius) and `calf_seated` (soleus) are deliberately separate
groups — bent vs straight knee trains different muscles and they should not substitute for
each other. Likewise `quad_squat`, `quad_extension`, and `quad_lunge` are distinct because
they load the quad differently and aren't true e1RM swaps.

---

## Overcoming Gravity progression model (extended tier)

The gymnastics/calisthenics rungs in `exercises_extended.json` are organized into
**difficulty-ordered chains** modeled on Steven Low's *Overcoming Gravity: A Systematic Approach
to Gymnastics and Bodyweight Strength (2nd ed.)*. The premise: for bodyweight strength skills,
**progress is leverage, not external load** — you advance by moving to a harder body position
(tuck → advanced tuck → straddle → full), not by adding weight. Accordingly these rungs are
`loadable: false` (except where a variation is naturally weightable, of which there are none in
the current chains), and the engine should advance a trainee by stepping `progression_level`
within a `progression_group` rather than running double-progression on load.

Each chain is tied to a muscle/pattern via its own `e1rm_substitution_group` so the engine can
pick the right rung for the trainee's current level and substitute laterally only within the same
family. Holds (planche, lever, L-sit, plank, hollow, ring support) reuse `default_rep_low/high`
as a **seconds** range, exactly like the core `plank`; the engine must special-case isometric rungs.

### Chains added (group → ordered rungs)

| `progression_group` | `e1rm_substitution_group` | Depth | Rungs (level 1 → n, easiest → hardest) |
|---|---|---|---|
| `planche_push_line` | `planche_horizontal_push` | 7 | incline push-up → full push-up → pseudo-planche push-up → tuck planche → adv. tuck planche → straddle planche → full planche |
| `handstand_push_line` | `handstand_vertical_push` | 5 | pike push-up → feet-elevated pike push-up → wall HSPU → deficit wall HSPU → freestanding HSPU |
| `dip_line` | `dip_vertical_push` | 6 | bench dip → parallel-bar dip → ring support hold → ring dip → ring dip RTO → wide/Bulgarian ring dip |
| `front_lever_pull_line` | `front_lever_horizontal_pull` | 6 | inverted row → tuck FL row → adv. tuck FL hold → straddle FL hold → full FL hold → full FL row |
| `vertical_pull_line` | `vertical_pull_progression` | 7 | negative pull-up → band-assisted pull-up → full pull-up → L-sit pull-up → archer pull-up → one-arm negative → one-arm pull-up |
| `pistol_squat_line` | `single_leg_squat_progression` | 6 | assisted squat → split squat → BW Bulgarian split squat → box pistol → shrimp squat → full pistol |
| `nordic_curl_line` | `nordic_curl_progression` | 3 | band-assisted nordic → eccentric-only nordic → full nordic |
| `core_anti_extension_line` | `core_anti_extension_progression` | 4 | front plank → hollow body hold → kneeling ab-wheel → standing ab-wheel |
| `lsit_line` | `lsit_flexion_progression` | 3 | foot-supported L-sit → tuck L-sit → full L-sit |

9 chains, 47 rungs total. Levels are contiguous (1..n) and verified. The chains cover the major
OG categories: horizontal push (planche line), vertical push (handstand line), dips, horizontal
pull (front-lever line), vertical pull, single-leg squat, hamstring eccentric (nordic), core
anti-extension, and core flexion (L-sit). `is_gold_standard` is left `false` across all rungs —
within a chain, `progression_level` ordering carries selection, not the gold-standard prior.

### Extended-conventional variations (`progression_group: null`)

49 less-common but genuinely useful movements that add variety and substitution depth across all
16 muscles, slotted into the **existing** `e1rm_substitution_group`s with `preferred_rank`s that
continue the core ordering (e.g. `seal_row`, `pendlay_row`, `meadows_row`; `jm_press`, `tate_press`,
`close_grip_bench_press`; `spider_curl`, `bayesian_cable_curl`; `front_squat`, `belt_squat`,
`reverse_hack_squat`, `sissy_squat`; `cable_pull_through`, `reverse_hyper`, `single_leg_hip_thrust`;
`face_pull`, `arnold_press`, `push_press`, `pallof_press`, `good_morning`, etc.). These are ordinary
loadable/bodyweight movements with no progression chain.

### Overcoming Gravity sources

- Steven Low, *Overcoming Gravity 2nd Edition & Progression Charts*: <https://stevenlow.org/overcoming-gravity/>
- *Overcoming Gravity* 2nd-ed. preview (TOC / Ch.1–3): <https://stevenlow.org/wp-content/uploads/2018/09/OG2-preview-TOC-Intro-Ch1-3.pdf>
- *Overcoming Gravity 2nd Edition* exercise/progression charts (PDF): <https://stevenlow.org/wp-content/uploads/2017/02/OG2ChartsPrint.pdf>; community mirror: <https://www.calisthenics-101.co.uk/wp-content/uploads/2020/05/Overcoming-Gravity-2nd-Edition-Exercise-Charts.pdf>
- *Overcoming Gravity* 2nd-ed. progression charts (Google Sheets): <https://docs.google.com/spreadsheets/d/19l4tVfdTJLheLMwZBYqcw1oeEBPRh8mxngqrCz2YnVg/htmlview>
- Front-lever tuck/adv-tuck/straddle/full ordering (reputable summary corroborating OG): Worked Out Fitness — *Front Lever Progression*: <https://www.workedoutfitness.com/search/article/front-lever-progression>
- HSPU pike → elevated pike → wall → freestanding ordering (corroborating summary): Performance Plus Programming — *Handstand Pushup Strength Progression*: <https://performanceplusprogramming.com/handstand-pushup-strength-progression/>; Antranik — *HSPU journey*: <https://antranik.org/hspu-journey/>
- One-arm pull-up (archer → assisted/negative → one-arm) corroborating summary: The Hybrid Athlete — *One Arm Pull-up Progression*: <https://thehybridathlete.com/one-arm-pull-up-progression/>
- Pistol/shrimp progression (assisted → box → shrimp → full) corroborating summaries: GMB — *Shrimp vs Pistol*: <https://gmb.io/shrimp-squats-vs-pistol-squats/>; Apex School of Movement: <https://apexmovement.com/shrimp-pistol>
- Nordic curl band-assisted → eccentric → full: Mirafit — *Nordic Curl Progression and Regression*: <https://mirafit.co.uk/blog/nordic-curl-progression-and-regression/>

**Verification caveat.** The exact rung **ordering** for each chain is corroborated by Low's public
progression-chart pages and multiple reputable summaries, and the within-chain ordering (tuck →
advanced tuck → straddle → full, etc.) is unambiguous and consistent across sources. What could
**not** be fully verified from open web pages is the precise *numeric difficulty index* OG assigns
each rung (those live in the book/paid charts), and the OG charts interleave more intermediate
sub-steps (e.g. one-leg tucks, frog stands, multiple ring-turnout angles) than we encode here.
Our chains are a faithful, slightly coarsened subset suitable for engine selection, not a 1:1
reproduction of every OG sub-level. SFR classes and rep/second ranges on these rungs are
practice-based judgment, not measured.

---

## Intended use as a Supabase seed

This file is the source of truth for an `exercises` table. Suggested column mapping (snake_case
matches Postgres conventions):

```sql
create table exercises (
  id                       text primary key,
  name                     text not null,
  primary_muscle           text not null,
  secondary_muscles        text[] not null default '{}',
  pattern                  text not null,
  equipment                text[] not null,
  sfr_class                text not null check (sfr_class in ('high','moderate','low')),
  is_gold_standard         boolean not null,
  preferred_rank           int not null,
  e1rm_substitution_group  text not null,
  default_rep_low          int not null,
  default_rep_high         int not null,
  loadable                 boolean not null,
  unilateral               boolean not null,
  home_hotel_friendly      boolean not null,
  tier                     text not null default 'core' check (tier in ('core','extended')),
  progression_group        text,
  progression_level        int,
  cues                     text,
  check ((progression_group is null) = (progression_level is null))
);
```

The three extended-tier columns (`tier`, `progression_group`, `progression_level`) are nullable /
defaulted so core rows (which omit them) load cleanly: treat a missing `tier` as `'core'` and
missing progression fields as `null`. The CHECK enforces that the two progression fields are set or
null together.

Load options:

- **Idempotent upsert (recommended):** read **both** `exercises.json` and `exercises_extended.json`
  in a seed script (`supabase/seed.ts` or a Node script under `scripts/`) and `upsert` on `id` so
  re-running the seed updates existing rows rather than duplicating. `id` is a stable natural key and
  is unique across both files. When loading the core file, default `tier` to `'core'` and the
  progression fields to `null`.
- Consider a CHECK constraint or FK to a `muscles` lookup table on `primary_muscle`, and a
  lookup/enum for `equipment` values, to enforce the controlled vocab at the DB layer.
- `secondary_muscles` and `equipment` map cleanly to `text[]`; the prescription engine can
  filter on `equipment <@ available_equipment` to find gym- or hotel-feasible options, then
  order by `preferred_rank` within an `e1rm_substitution_group`.

---

## Caveats

- **EMG ≠ hypertrophy** (see above). Treat gold-standard flags as priors, not proof.
- **Some gold-standard picks are citation-backed; others are practice-based judgment.**
  Citation-backed: chest barbell bench (ACE), biceps concentration curl (ACE), triceps
  ranking (ACE), glute hip thrust (Contreras), standing-vs-seated calf raise (Frontiers
  2023), lat pulldown/pull-up (Boeckh-Behrens + later EMG), incline-angle pec activation
  (PMC 2020), hamstring leg-curl EMG (PLOS). Practice-based / mechanics-based (defensible but
  not pinned to a single trial here): RDL for hamstring hinge, leg extension for quad
  isolation, reverse pec deck for rear delts, back extension/deadlift for lower back, ab
  wheel/hanging leg raise for abs, overhead/skullcrusher for the triceps long-head stretch.
- **`sfr_class` is a coarse, judgment-based 3-bucket label**, not a measured ratio. It exists
  to nudge the engine away from over-fatiguing the lifter, not as a precise number.
- **Rep ranges are starting defaults**, not prescriptions. Planks/bridges that use seconds
  reuse the `default_rep_*` fields as a seconds range — the engine must special-case
  non-loadable isometric patterns (`plank`).
- **Home/hotel coverage was hardest for `traps` and `front_delts`** — the portable options
  (dumbbell shrug, band overhead press) assume the traveler has at least bands or adjustable
  dumbbells. There is no pure-bodyweight option for direct trap or vertical-press loading, so
  if a lifter has literally no equipment those muscles fall back to incidental work from
  rows/pull-ups and push-ups respectively.
- This is a **curated, opinionated** library, not exhaustive. It deliberately omits redundant
  near-duplicates; add entries only when they introduce a meaningful new stimulus or a new
  equipment/portability tier within a substitution group.
```
