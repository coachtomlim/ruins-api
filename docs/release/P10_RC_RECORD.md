# WEB-FLARE-RC1 — Release Candidate Record

- **Release identity**: `WEB-FLARE-RC1` (see `public/flare-s8b/release-identity.mjs`)
- **Branch**: `work/web-flare-p10-release-candidate-001`
- **Source HEAD (as of this record)**: `0642df8860e737aa0edd8734fcf9332d86731f6d`
- **Origin sync**: every commit §1–§10 pushed and confirmed `local HEAD == origin HEAD` after each push
- **Base**: created from the exact P9 acceptance HEAD `a8903886eb1070ad2b4fdc7f2a2a7a35fb2ed1cc`
- **Runtime manifest**: `docs/release/WEB-FLARE-RC1-MANIFEST.json`, 51 files, deterministic
  (verified across repeated runs in `tests/flare-p10-release-manifest.test.mjs`)
- **Game rules version**: 3 (`public/flare-s7/data/game.json` `.version`)
- **Content version**: `flare-p0-v1.15-stock`
- **AI contract version**: `s9-ai-encounter-plan-001`
- **Deployment manifest version**: 1

## Commits in this release (§1–§10)

| § | Commit | Summary |
|---|--------|---------|
| 4/5 (pre-run) | `68f4465` | AI availability honesty (checkpoint inherited from prior session) |
| §1 | `e8c5093` | Edge Function bounded-access + Content-Type hardening |
| §2 | `4c3d9bf` | Release identity + deterministic runtime manifest |
| §3 | `7641700` | New deployment lineage — `hostgator-flare-p10-rc1.py` |
| §4 | `f89f596` | Fallback deployment archive + rollback package |
| §5 | `45d9348` | Database/auth/credential security review (1 defect fixed) |
| §6 | `d8a81e1` | Repository and artifact hygiene audit |
| §7 | `1f9bc99` | Failure UX, resilience, performance, accessibility (1 defect fixed) |
| §9 | `bbf8b8b` | Economy/challengeability/frozen-route regression re-proof |
| §10 | `0642df8` | Consolidated `npm run gate:p10-rc` release gate |

## Feature inventory (this release, on top of the accepted S8B/S9/P9 baseline)

- AI Encounter Assist honesty model: live-vs-calibrated mode is probed at bootstrap and never
  misrepresented (`isAiGenerated`, `checkAiAvailability`, unavailable-mode UI).
- `suggest-encounter` Edge Function: bounded to authenticated callers, Content-Type-checked,
  provider-call-timeout-bounded (504), request/response-size-bounded (413), CORS-restricted.
- New, independent deployment lineage (`hostgator-flare-p10-rc1.py`) with a re-traced 25-file/34-frozen-
  fingerprint gate set, entirely separate from the frozen Update 006 helper.
- Fallback release + rollback archive tooling (`scripts/release/build-release-archive.mjs`), built only
  from committed git content, never the working tree.
- One real security fix: `ensure_starter_account`/`save_account_goal` hardened to `search_path=''`,
  with a standing regression guard over every SECURITY DEFINER function in the migration set.
- One real failure-UX fix: `errorMessage()`'s fallback can no longer leak a raw Postgres/network error
  verbatim to the player.
- Repo hygiene: `.gitignore` now excludes `__pycache__`/`.pyc`; full-repo credential scan locked in as
  a regression test.
- `npm run gate:p10-rc`: one command chaining focused tests, full suite, frozen verifier, deploy-helper
  offline gates, and manifest/archive regeneration.

## Known external pending gates (see `P10_EXTERNAL_GATES.md`)

- `S9 LIVE ADMIN PROOF`: status recorded in the external-gates check.
- `AI LIVE PROVIDER PROOF`: status recorded in the external-gates check.
- `HOSTGATOR DEPLOYMENT`: status recorded in the external-gates check.

## Test counts (as of `0642df8`)

- Full suite: **559/559 passing** (`npm test`)
- Frozen web-tree verifier: **7/7 PASS** (`flare-s2` through `flare-s71`)
- `npm run gate:p10-rc`: **PASS** end-to-end

## Release-manifest hash

The runtime manifest (`docs/release/WEB-FLARE-RC1-MANIFEST.json`) embeds a `generatedAt` timestamp, so
its own file hash is not stable across regenerations by design — each regeneration is instead verified
deterministic **content-wise** (identical `files` array, differing only in `generatedAt`) in
`tests/flare-p10-release-manifest.test.mjs`. The release archive's manifest
(`docs/release/web-flare-p10-rc1-release.manifest.json`) carries per-file SHA-256 for all 25 shipped
files, which is the operationally meaningful hash set (used by the deploy helper's `s8b_gate()` to
verify byte-for-byte deployment correctness).
