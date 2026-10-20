# CODEX TASK: RUINS_DAILY_EXPEDITION_001B-LIVE-BROWSER-AND-INTEGRATION-VALIDATION

You are the bounded Windows/PC local executor under Dungeon Bravo Dev4 PM authority. **Do not own the roadmap or improvise Days 2–5.**

## Intake and git verification

Repository: `coachtomlim/ruins-api`.
Target branch: `work/ruins-daily-expedition-001`. Before changes, fetch and report actual remote and local HEAD, worktree state, untracked files and any concurrent changes. Only proceed on the verified branch; no reset, cherry-pick or force push. If branch advanced beyond the specified handoff commit, inspect and reconcile; never overwrite.

Read in full:
1. `docs/ruins/RUINS_DAILY_EXPEDITION_001A_AUTHORITY_AND_STATE.md`
2. `docs/ruins/GATE_C_015_SOURCE_AUTHORITY.json`
3. `docs/WEB_FLARE_FRIEND_FEEDBACK_002E9G_LIVE_ACCEPTED_FREEZE.md`
4. `docs/FLARE_AUDIO_INTEGRATION_002_ACCEPTED_FREEZE.md`
5. `docs/ruins/RUINS_DAILY_EXPEDITION_001B_README.md` (once present)
6. New `public/ruins-expedition/` source and `tests/ruins-expedition-day1.test.mjs`.

Gate C exact historical source (READ ONLY): `coachtomlim/xyz-aia-sim@add02bd9bc98e26cad95ae5ac00a5da1a255e0cd`, mod tree `83de9e7c81961b5d619d188e318f57beeca290fb`. Do not recreate from memory.

## Bounded assignment

A. In a disposable worktree/browser profile, run `node --test tests/ruins-expedition-day1.test.mjs`, `npm test`, and `npm run verify:frozen`. Report exact counts, failures and regression diffs; do not weaken tests.

B. Serve repository `public/` locally via HTTP using the ordinary existing preview workflow. Open `/ruins-expedition/index.html` at 320x568, 360x800, 390x844, 430x932, 768x1024, desktop. Capture screenshots and DOM overflow metrics. Verify no document scroll and controls always visible/readable. Use the actual accepted Audio 002 module/assets, not a shim.

C. Perform genuine player actions: Room 1 altar discovery, transition via the authored exit, approach Room 2 zombie, defeat it, claim the once-only chest, settle Day 1, close/reopen at intermediate checkpoints and after settlement. Repeated claim, two-tab stale revision, operation replay, bad local storage, browser Back/Forward and refresh must not mint duplicate proof rewards. Verify music EXPLORE→COMBAT→SAFE, zombie/door/gold SFX, Sound toggle, mobile audio unlock, zero page errors, and the blocked licence-pending audio URLs never requested.

D. Review whether 001B's basic isometric canvas is technically adequate only as a *state-prototype*. Do not claim that colored circles equal final Flare visual fidelity or that the fixed combat fixture equals native combat. Where necessary, make bounded additive revisions in `public/ruins-expedition/` and focused tests to integrate appropriate existing stock Flare renderer/actors without rewriting accepted Friend runtime or map coordinates. Report content/engine parity limits explicitly. Do not transform this into a procedural Quick Run or add Days 2–5.

E. Threat review: local IndexedDB is not authoritative. Do not create a live Supabase migration, account entitlement, or real gold/XP credits. Provide a precise recommendation for staging-only persistence and server-side encounter validation after the local slice is sound. Keep owner calendar/rest/death/missed-day decisions unresolved; local test fixtures are allowed.

F. Save local browser evidence under `G:\My Drive\Quick Dungeon\Owner Review\RUINS_DAILY_EXPEDITION_001B\` if this drive is mounted and writable. Otherwise use a named project-local evidence directory and report exact absolute path. Make bounded commits on target branch after verification, normal push only. No deployment.

## Hard boundaries

- Do not touch `main`, either frozen release ref, HostGator, production Supabase, SL_SIM, existing `/q/`, `/g/`, `/h/`, `/j/`, `/k/`, `/m/` routes, accepted Builder/Friend behavior, or older Daily Trial.
- Preserve Owner-local intentionally untracked `START_QUICK_DUNGEON_OWNER_REVIEW.bat` without staging, deleting, rewriting or moving.
- Do not integrate licence-unresolved Flare audio, no credentials or secret output, no deployment.
- Do not broaden to Days 2–5, new lore, random maps, multiplayer or new art.
- Do not claim live acceptance or browser proof from unit tests alone.

## Return format

`RUINS_DAILY_EXPEDITION_001B_LOCAL_BROWSER: PASS | REVISE | BLOCKED`

Include: exact starting/final branch and SHA, files changed, 001B focused test count, full suite/frozen verifier results, per-viewport overflow metrics and screenshots, actual complete Day 1 replay/refresh evidence, audio evidence, known limitations, claim ledger replays, whether any code was committed/pushed, exact evidence path, and explicit **NO DEPLOYMENT / NO PRODUCTION DB MUTATION**. Explain what is still required to make the rewards truly server authoritative.
