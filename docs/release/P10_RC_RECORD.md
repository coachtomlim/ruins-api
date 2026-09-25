# WEB-FLARE-RC1 — Release Candidate Record

- **Release identity**: `WEB-FLARE-RC1` (see `public/flare-s8b/release-identity.mjs`)
- **Branch**: `work/web-flare-p10-deterministic-encounter-advisor-001` (current product authority —
  the earlier `work/web-flare-p10-release-candidate-001` branch, HEAD `7ba24e9`, is **not** current
  authority; it still assumed an external-AI/provider architecture that has since been retired)
- **Source HEAD (as of this record)**: see the final commit on this branch (recorded at push time)
- **Origin sync**: confirmed `local HEAD == origin HEAD` after the final push
- **Base**: this branch's incoming HEAD `0e38d19481809d735bd36f19bf894773974417ea` already carried the
  full P10 §1–§12 lineage (from `work/web-flare-p10-release-candidate-001`) plus the architecture
  change to a deterministic Encounter Advisor; this record covers the reconciliation pass that fixed
  remaining integration defects and completed the deterministic §8 (E2E + mobile rehearsal)
- **Runtime manifest**: `docs/release/WEB-FLARE-RC1-MANIFEST.json`, **50 files** (was 51 under the
  external-AI architecture — one fewer, since the deterministic Advisor needed no separate
  provider-boundary module), deterministic (verified across repeated runs in
  `tests/flare-p10-release-manifest.test.mjs`)
- **Game rules version**: 3 (`public/flare-s7/data/game.json` `.version`)
- **Content version**: `flare-p0-v1.15-stock`
- **Encounter Advisor version**: `p10-deterministic-encounter-advisor-001`
  (`RELEASE_ENCOUNTER_ADVISOR_VERSION` in `release-identity.mjs`; `RELEASE_AI_CONTRACT_VERSION` is
  absent from current release authority)
- **Deployment manifest version**: 1

## Commits in this release

The full P10 §1–§12 lineage (Edge Function hardening, release identity/manifest, deploy lineage,
fallback archive, security review, repo hygiene, failure UX, economy regression, release gate,
external gates) landed on the predecessor branch and is inherited unchanged by this branch's incoming
HEAD `0e38d19`. This branch then replaced the external-AI architecture with the deterministic
Encounter Advisor (21 commits, `db0ef55`..`0e38d19` — retiring `ai-encounter-assist.mjs`,
`ai-encounter-provider.mjs`, and `supabase/functions/suggest-encounter/index.ts`; adding
`encounter-advisor.mjs`; updating the release contract, deploy-helper gate, and all release docs) and
finally the reconciliation pass in this record, which:

- fixed a test false-positive (a source negation-comment tripped its own "no Edge Function" scan);
- fixed the deploy helper's `SOURCE_SHA` (was stale, predating `encounter-advisor.mjs` entirely) and
  its file-count comments/live-smoke list (still referenced the retired AI files);
- fixed a pre-existing CRLF-unsafe test regex;
- regenerated the runtime manifest and both release/rollback archives (50/24/20 files respectively);
- ported the one genuine mobile-layout fix from the retired external-AI P10 §8 branch
  (`practice.css` body-margin reset) and its regression test;
- closed remaining stale AI/provider references in `DEPLOYMENT_FALLBACK_AND_ROLLBACK.md` and
  `P10_FAILURE_UX_AND_RESILIENCE.md`;
- completed §8: a full 20-step E2E rehearsal and 6-width mobile matrix against the deterministic
  product, plus an independent deterministic-search proof against real game data (see
  `P10_E2E_AND_MOBILE_REHEARSAL.md`).

## Feature inventory (this release, on top of the accepted S8B/S9/P9 baseline)

- **Deterministic Encounter Advisor** (`encounter-advisor.mjs`): enumerates every legal encounter
  variation under the current budget (1,078 for the stock catalog), ranks by target-HP closeness then
  fewest control edits then cost, using only the existing deterministic `estimateEncounter()`. No AI
  model, no network call, no Edge Function, no provider credential, no inference cost. Player-facing
  terminology: `ENCOUNTER ADVISOR`, `SUGGEST ADJUSTMENT`, `SUGGESTED ADJUSTMENT`, `APPLY SUGGESTION`,
  `TRY ANOTHER` — no "AI", "provider", "inference", or "LLM" anywhere in the UI.
- New, independent deployment lineage (`hostgator-flare-p10-rc1.py`), now correctly re-traced to the
  24-file/34-frozen-fingerprint deterministic-product closure, entirely separate from the frozen
  Update 006 helper, gated by `deterministic_encounter_advisor_gate()` (not an AI-availability gate).
- Fallback release + rollback archive tooling (`scripts/release/build-release-archive.mjs`), built only
  from committed git content, never the working tree.
- One real security fix (inherited): `ensure_starter_account`/`save_account_goal` hardened to
  `search_path=''`, with a standing regression guard over every SECURITY DEFINER function.
- One real failure-UX fix (inherited): `errorMessage()`'s fallback can no longer leak a raw
  Postgres/network error verbatim to the player.
- One real mobile-layout fix (this pass): `practice.css` now resets the browser's default body
  margin, eliminating a genuine 4px horizontal overflow at mobile widths.
- Repo hygiene: `.gitignore` excludes `__pycache__`/`.pyc`; full-repo credential scan locked in as a
  regression test; confirmed zero AI-provider secret references anywhere in tracked source.
- `npm run gate:p10-rc`: one command chaining focused tests, full suite, frozen verifier, deploy-helper
  offline gates, and manifest/archive regeneration.

## Known external pending gates (see `P10_EXTERNAL_GATES.md`)

- `S9 LIVE ADMIN PROOF`: `PENDING_CREDENTIAL`.
- `HOSTGATOR DEPLOYMENT`: `PENDING_CONNECTIVITY`.
- ~~`AI LIVE PROVIDER PROOF`~~: **retired** — not a gate for a deterministic, network-free feature.

## Test counts (as of the final commit on this branch)

- Full suite: **522/522 passing** (`npm test`) — down from the inherited 560 because the ~530-line
  obsolete external-AI provider test suite was correctly retired along with the architecture it
  tested, not preserved for count continuity.
- Frozen web-tree verifier: **7/7 PASS** (`flare-s2` through `flare-s71`)
- `npm run gate:p10-rc`: **PASS** end-to-end

## Release-manifest hash

The runtime manifest (`docs/release/WEB-FLARE-RC1-MANIFEST.json`) embeds a `generatedAt` timestamp, so
its own file hash is not stable across regenerations by design — each regeneration is instead verified
deterministic **content-wise** (identical `files` array, differing only in `generatedAt`) in
`tests/flare-p10-release-manifest.test.mjs`. The release archive's manifest
(`docs/release/web-flare-p10-rc1-release.manifest.json`) carries per-file SHA-256 for all **24**
shipped files (was 25 under the external-AI architecture), which is the operationally meaningful hash
set (used by the deploy helper's `s8b_gate()` to verify byte-for-byte deployment correctness).
