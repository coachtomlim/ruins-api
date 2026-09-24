# P10 §9 — Economy, Challengeability & Frozen-Route Release Regression

Re-proof at RC level, run against the current P10 HEAD (`1f9bc99` at time of this check) via the full
test suite (559/559 passing) and the source-fingerprint frozen verifier (7/7 PASS).

## Economy invariants — all still hold (existing coverage, reconfirmed green)

- Daily Bonus: fixed 5 Gold, 10 Gold day-7 streak bonus (unchanged).
- Daily Trial: exactly +5 Gold / +10 Runner XP per settlement; duplicate settlement of the same run
  is idempotent (0 additional Gold/XP; single ledger row).
- Practice: reward-free — no Gold, XP, or item mutation reachable from `practice-app.mjs` (still
  verified: no `supabase`/`createClient` reference anywhere in the file).
- AI Encounter Assist: reward-free — verified again in this run (`finalizePlan`/provider module never
  reference wallet, XP, Gold ledger, or purchase RPCs); the P10 §1 auth-required change to
  `suggest-encounter` does not add any reward path, only bounds who can trigger the provider call.
- Builder publication: Gold-free and Runner-XP-free — confirmed by the PGlite proof in §5's run
  (`"before"`/`"after"` Runner power state byte-identical across 19 publications) and the existing
  static test asserting the migration source contains no `wallet_ledger`/`runner_xp_event` write.
- Stat prices: Endurance I 20G, Strike I 30G, Guard I 40G — unchanged (existing migration-lock test).
- Leather Hood: 35 Gold, Level-2 gated — unchanged (existing migration-lock test).
- Idempotency: Daily Trial settlement, Daily Login claim, progression purchase, and Builder
  publication are all still covered by unique-idempotency-key constraints and duplicate-safe RPC
  logic (re-verified live in §5's PGlite run: retrying a settled trial, an equip, and 19 republished
  Builder designs all produced zero additional mutation).

## Challengeability — PREFERRED envelope re-proof

`equip_runner_item` still fails closed (`PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE`) for any
projected stat combination outside the nine accepted PREFERRED states — re-exercised live in §5's
PGlite run for both a legal Level-2 equip (100/12/1 → 100/12/2, PREFERRED) and an explicit
outside-envelope rejection case. No migration in this release altered the envelope definition or its
enforcement point.

## Frozen-route / frozen-tree regression

Source-fingerprint verification (`node tools/verify-frozen-web-trees.mjs`): **7/7 PASS** —
`flare-s2` through `flare-s71` byte-identical to their frozen predecessor commits, confirmed at the
current P10 HEAD with no working-tree changes to any of those trees across all of §§1–9.

**Live HTTP route smokes** (`/q/hiS4`, `/q/Rind`, `/g/MsJ9`, `/h/UvVY`, `/j/UvVY`, `/k/UvVY`,
`/m/UvVY?from=Tom` actually resolving on production) were **not** run in this section — they require
reaching `think-2-thrive.com`/HostGator, and the standing instruction is to perform at most one
bounded connectivity check for the whole run, reserved for §12. This section proves the source is
unchanged; §12 (if connectivity is available) or the deploy helper's own `frozen_gate()` (built and
statically verified in §3) is what proves the live routes still serve that unchanged source.
