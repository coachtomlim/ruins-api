# WEB-FLARE-RC1 — Deployment Runbook

## Pre-deployment checklist

1. `npm run gate:p10-rc` passes (full test suite + frozen verifier + offline deploy-helper gates +
   deterministic manifest/archive regeneration).
2. `git status --short` is clean on `work/web-flare-p10-release-candidate-001`; `origin` HEAD matches
   local HEAD (`git ls-remote origin refs/heads/work/web-flare-p10-release-candidate-001`).
3. `main` has not been touched by this release.
4. Required migrations (see "Migration checklist" below) are confirmed applied on staging.
5. `S8B_SUPABASE_URL` / `S8B_SUPABASE_PUBLISHABLE_KEY` are set in the deploying environment (never a
   `service_role`/`sb_secret_` value — `build_config_js()` in the deploy helper refuses those).

## Path A — automated (preferred, requires HostGator cPanel reachability)

```bash
CPANEL_API_TOKEN=... S8B_SUPABASE_URL=... S8B_SUPABASE_PUBLISHABLE_KEY=... \
  python scripts/deploy/hostgator-flare-p10-rc1.py auth
```
If `AUTH PASS` (and the AI-availability-honesty static gate passes):
```bash
python scripts/deploy/hostgator-flare-p10-rc1.py probe
```
If `PROBE PASS` (baseline + frozen-fingerprint gates both green):
```bash
python scripts/deploy/hostgator-flare-p10-rc1.py deploy
```
`deploy` re-runs the baseline/frozen gates, writes the 25 `flare-s8b` files plus a freshly-generated
`config.js`, then re-verifies byte-for-byte correctness (`s8b_gate()`) and re-checks every frozen
fingerprint and route smoke before printing `TEST PASS`.

**If `auth` fails for a connectivity reason** (as it has on every attempt since Update 006 —
`WinError 10060`): stop. Do not retry repeatedly. Fall through to Path B.

## Path B — manual fallback (cPanel File Manager)

See `docs/release/DEPLOYMENT_FALLBACK_AND_ROLLBACK.md` for the full step-by-step: back up first,
upload+extract `docs/release/web-flare-p10-rc1-release.zip`, hand-recreate `config.js`, smoke-test.

## Supabase checks (both paths)

- The two S9 migrations (`20260924_s9_progression_xp_levels.sql`,
  `20260924_s9_builder_progression_challenge_journal.sql`) and the P10 hardening migration
  (`20260924_p10_security_definer_search_path_hardening.sql`, staging version `20260924075609`) are
  all **applied to S8B staging** as of the PM's direct confirmation during this run — not merely
  planned. Post-apply verification confirmed both `ensure_starter_account` and `save_account_goal`
  now have `security definer`, `search_path=''`, `anon EXECUTE: NO`, `authenticated EXECUTE: YES`,
  `PUBLIC EXECUTE: NO`. **Production Supabase is not claimed to have this migration** — only staging
  was confirmed, and that confirmation was read-only (not re-verified independently by this session;
  it was not reapplied).
- If deploying the Edge Function (only if a rotated `AI_ENCOUNTER_PROVIDER_KEY` is available — see
  `P10_EXTERNAL_GATES.md`): `supabase functions deploy suggest-encounter`, then confirm
  `GET .../suggest-encounter` returns `{available:true,version:"s9-ai-encounter-plan-001"}`.

## Edge Function / AI provider setup (optional — feature degrades gracefully if skipped)

1. Set `AI_ENCOUNTER_PROVIDER_KEY` in the function's own Supabase secrets store — never in
   `public/**`, never in a commit, never printed to a terminal.
2. `supabase functions deploy suggest-encounter`.
3. Confirm the GET probe reports `available:true`; confirm Practice's AI Assist panel switches from
   "AI ASSIST UNAVAILABLE / USE CALIBRATED SUGGESTION" to live mode.
4. If this step is skipped or fails, Practice remains fully usable in calibrated-only mode — this is
   an accepted, honestly-labeled degraded state, not a blocker.

## Post-deployment smoke tests

1. `https://think-2-thrive.com/quick-dungeon/flare-s8b/` loads, shows `RUNNER HUB`, and the footer
   shows `WEB-FLARE-RC1 · <7-char sha>`.
2. Sign in with an existing test account → Hub renders LEVEL/XP, equipment, history, Builder
   progression, Challenge Journal.
3. Daily Trial: start → settle → confirm +5 Gold / +10 Runner XP.
4. Practice → AI Assist panel shows either a live suggestion or "AI ASSIST UNAVAILABLE / USE
   CALIBRATED SUGGESTION" (never a false "AI SUGGESTION" claim on a fallback result) → apply → run.
5. Friend Share → generate link → confirm `/m/<code>?from=<name>` loads for a signed-out visitor.
6. Frozen routes: `/q/hiS4`, `/q/Rind`, `/g/MsJ9`, `/h/UvVY`, `/j/UvVY`, `/k/UvVY` all still load.

## Rollback

See `docs/release/DEPLOYMENT_FALLBACK_AND_ROLLBACK.md`'s rollback section. Not executed as part of
this release; prepared and reviewed only.

## Migration checklist

| Migration | Required | Reversible | Notes |
|---|---|---|---|
| `20260914_s8b_account_foundation*.sql` (6 files) | Yes | No down-migration | Already applied (S8B baseline) |
| `20260915_s8b_*.sql` (7 files) | Yes | No down-migration | Already applied (S8B baseline) |
| `20260919_s8b_solo_economy_floor.sql` | Yes | No down-migration | Already applied |
| `20260921_s8b_daily_trial_001.sql` | Yes | No down-migration | Already applied |
| `20260924_s9_progression_xp_levels.sql` | Yes | No down-migration | Already applied (S9) |
| `20260924_s9_builder_progression_challenge_journal.sql` | Yes | No down-migration | Already applied (S9) |
| `20260924_p10_security_definer_search_path_hardening.sql` | Yes (new in P10) | `create or replace` is itself reversible by re-applying the pre-P10 function bodies, but no down-migration file exists | **Applied to S8B staging** (version `20260924075609`); additive-only, changes no return type, no grant, no behavior |

**No down-migrations exist for any of these.** Rollback of client code does not roll back the
database. This is the same limitation already documented for the client-only rollback path.
