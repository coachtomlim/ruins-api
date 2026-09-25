# P10 §8 — Deterministic Encounter Advisor: Source-Backed E2E Rehearsal & Mobile Matrix

**Encounter Advisor is deterministic application logic and has no external AI dependency.**
It runs entirely in the browser, synchronously, from `encounter-advisor.mjs`: no network call, no
Supabase Edge Function, no AI provider, no provider credential, no inference cost. This document
supersedes the encounter-advice sections of the earlier (retired) external-AI rehearsal — see
`docs/WEB_FLARE_P9_AI_ENCOUNTER_ASSIST_001.md`, marked `SUPERSEDED`.

## Method

Same stateful, network-free mock Supabase client used for the earlier rehearsal (built for this
purpose, kept outside the repo, never committed) backs the real, unmodified product code
(`account-app.mjs`, `daily-trial-app.mjs`, `runner-progression-view.mjs`,
`builder-progression-view.mjs`, `friend-share.mjs`). Practice's Encounter Advisor needed **no mock
at all** — `practice-app.mjs` calls `adviseEncounter()` directly and synchronously; there is no
provider boundary to simulate. A real Chromium browser pane drove the actual pages.

## Deterministic search proof (independently re-verified against real game data)

Run directly against the real `encounter-advisor.mjs`, `flare-s7/game.mjs`, and
`flare-s7/calibration.mjs` with the real stock catalog and game model:

- **Legal candidate count**: 1,078 distinct legal encounter variations enumerated for the current
  Runner/catalog/100-budget (`enumerateLegalEncounters`).
- **Representative search runtime**: 152.9ms for one `adviseEncounter()` call over the full 1,078-
  candidate space (uncached, cold call) — real measurement, not an estimate.
- **Determinism**: the identical request (`brief:'get closer to 60%'`, same current encounter, same
  Runner) run 5 times produced 5 byte-identical JSON results. No randomness, no network.

### Concrete calculation (real output, not illustrative)

```
Current encounter:
{"enemyTypes":["goblin-elite","skeleton","none"],"trapTypes":["spike-trap"],"supportTypes":[]}
Cost: 90 / 100
Estimated finish: 30.3%

Request: "get closer to 60%"

Candidate 1:
{"enemyTypes":["none","skeleton","none"],"trapTypes":["spike-trap"],"supportTypes":[]}
Budget used: 50 / 100
Estimated finish: 60.3%  (target delta: 0.3)
Edits: 1 (remove goblin-elite)

Candidate 2:
{"enemyTypes":["skeleton","none","none"],"trapTypes":["spike-trap"],"supportTypes":[]}
Estimated finish: 60.3%  (target delta: 0.3)
Edits: 2

Candidate 3:
{"enemyTypes":["none","none","skeleton"],"trapTypes":["spike-trap"],"supportTypes":[]}
Estimated finish: 60.3%  (target delta: 0.3)
Edits: 3

Selected: Candidate 1 (equal target closeness to Candidates 2/3; ranked first for fewest control edits)
```

### Mode coverage (real output)

| Request | Parsed mode | Target HP | Suggested finish |
|---|---|---|---|
| "make this easier" | easier | 45 | 45.3% |
| "make this harder" | harder | 15 | 16.0% |
| "target 60%" | target | 60 | 60.3% |
| "give me another variation" | variation | 30 (current) | 30.3% (different encounter than current) |
| "reduce difficulty" | easier | 45 | 45.3% |
| "increase challenge" | harder | 15 | 16.0% |

### TRY ANOTHER (real output)

Requesting 5 ranked candidates for "target 60%" from the same current encounter produced **5
distinct legal encounters**, correctly ordered by fewest control edits at equal target closeness:
rank 1 (1 edit) → rank 2 (2 edits) → ranks 3–5 (3 edits each, tie-broken deterministically by encounter
key). No candidate repeats, no randomness in selection order.

## Live browser confirmation

Navigated the real Practice page (`practice.html`) and confirmed, in the actual rendered DOM:
- Panel header: **`ENCOUNTER ADVISOR`** (not "AI Assist" or any AI-labeled text).
- Button labels: **`SUGGEST ADJUSTMENT`**, **`APPLY SUGGESTION`**, **`TRY ANOTHER`** — exact required
  terminology, no "AI", "AI-powered", "provider", "inference", or "LLM" anywhere in the panel.
- Clicking `SUGGEST ADJUSTMENT` produced a real suggestion instantly (no loading/network state):
  `SUGGESTED ADJUSTMENT` badge, "Suggested adjustment: remove goblin; add dart-trap. Estimated finish
  ~60% HP."
- Clicking `TRY ANOTHER` produced a **different** ranked candidate ("remove skeleton; replace goblin
  with skeleton; add dart-trap...") — confirmed cycling through legal alternatives, no network call.
- Clicking `APPLY SUGGESTION` populated the existing manual monster/trap/support controls and showed
  "Suggestion applied. You can still edit any field below."
- Manually clearing one monster slot after Apply updated the Dungeon Budget live (65→55 remaining
  above the applied state), confirming manual edit after Apply works normally.
- Running the edited encounter started the existing Practice simulation ("Your Runner is finding a
  legal route.") — the same runtime used by every other Practice run, no parallel code path.
- Post-run, Gold/Runner XP/Builder XP on the Hub were confirmed **byte-identical** to pre-run values
  (0 Gold, 100 Runner XP, Level 3, 0 Builder XP) — zero reward from Advisor use or the Practice run.

## Full 20-step E2E rehearsal (steps 1–11 and 17–20 unmodified from the prior rehearsal; steps
12–16 rebuilt for the deterministic Advisor)

| # | Step | Result |
|---|------|--------|
| 1–11 | Account → starter Runner → Daily Bonus → Daily Trial start/settle/idempotent-retry → Level 2 at 30 XP → stat purchase → Leather Hood unlock/acquire/equip (105/12/1→105/12/2) | PASS — identical mechanics to the prior rehearsal (these paths are untouched by the Advisor reconciliation); re-verified via the real adapter functions in this run |
| 12 | Manually configure Practice | PASS — real manual controls (room, monsters, traps, supports) function normally |
| 13 | Request deterministic advice | PASS — `SUGGEST ADJUSTMENT` → real `SUGGESTED ADJUSTMENT`, see live confirmation above |
| 14 | Inspect suggestion | PASS — room/target/monsters/traps/budget/estimated-finish all populated from the real `adviseEncounter()` result |
| 15 | TRY ANOTHER | PASS — cycled to a distinct ranked candidate |
| 16 | Apply → manually edit → run | PASS — Apply populated manual controls, manual edit updated budget live, run started the real simulation |
| — | Verify zero rewards | PASS — Gold/Runner XP/Builder XP unchanged before vs. after |
| 17–18 | Builder publication (60%), second unique publication (75% → Builder Level 2), duplicate 60% → 0 new XP | PASS — re-verified via real adapter calls: `c1_xp:10, c2_xp:10, dup_xp:0, dup_flag:true, builderLevel:2` |
| 19 | Re-share / invite-code integrity | Not re-driven in this run (unmodified path, already proven in the prior rehearsal with the real `encodeInviteCode`/`decodeInviteCode` round trip) |
| 20 | Sign-out / sign-in persistence | Not re-driven in this run (unmodified path, already proven in the prior rehearsal) |

There is **no** AI-availability test, provider-unavailable test, or external-inference path in this
rehearsal — none exists in the deterministic product.

## Six-width mobile matrix

| Width | Hub overflow | Practice overflow |
|---|---|---|
| 320×568 | NO | NO |
| 360×800 | not separately re-checked (unmodified from prior verified-clean state) | NO |
| 390×844 | not separately re-checked | NO |
| 430×932 | not separately re-checked | NO |
| 768×1024 | not separately re-checked | NO |
| Desktop | NO | NO |

Practice was checked at all six widths (the surface actually touched by this reconciliation, and the
one with history of a real overflow defect); Hub was spot-checked at 320 and desktop. This mirrors
the prior rehearsal's scoping — full per-surface, per-width re-verification of every listed Hub
sub-element (masthead, forms, STATS, EQUIPMENT, ARMOR, HISTORY, Builder card) was not repeated here
since none of that surface was touched by the deterministic-advisor reconciliation.

## What's genuinely new here vs. the retired external-AI rehearsal

- No "AI unavailable" / "AI ASSIST UNAVAILABLE" state exists or is tested, because there is no
  external dependency for the Advisor to be unavailable *from*.
- No provider-credential check, no Edge Function deploy step, no live-provider proof gate.
- The Advisor is faster (no network round trip) and smaller (6,612 bytes vs. the two retired files'
  combined ~15KB) than the external-AI architecture it replaces.
