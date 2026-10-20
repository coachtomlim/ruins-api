# RUINS Daily Expedition 001B: local Day 1 state and interaction proof

Status: **SOURCE / NODE TEST PROOF**. NOT accepted game visuals, NOT production anti-farming, NOT a deployable public release.

## Source authority

- Primary: `coachtomlim/xyz-aia-sim@add02bd9bc98e26cad95ae5ac00a5da1a255e0cd`, exact Gate C mod subtree `83de9e7c81961b5d619d188e318f57beeca290fb`.
- The two `.txt` files in `public/ruins-expedition/authority/` must remain byte identical to Gate C accepted source and are SHA-256 gated at runtime.
- Existing WEB-FLARE Audio 002 source is imported unchanged from `../flare-s8a/audio-manager.mjs`.
- Current authoritative design: `docs/ruins/RUINS_DAILY_EXPEDITION_001A_AUTHORITY_AND_STATE.md`.

## What 001B does

- Dedicated, additive, unlinked preview at `public/ruins-expedition/index.html`, separate from Builder/Friend/Daily Trial.
- Draws source-authored 8×8 room geometry and collision in an intentionally basic isometric canvas, not stock sprite fidelity.
- Room 1 discovery trigger, gated exit to Room 2, Room 2 stock-source zombie identity and HP60, combat fixture, chest claim, and day-complete checkpoint.
- Exactly-once XP/loot-source ledger and per-operation receipts inside an IndexedDB transaction, guarded by revision checks.
- Reopen/refresh restores the state and claimed sources. Past day settlement is terminal. Day 2 and Room 3 remain locked.
- Prototype mobile bounded UI, accepted Audio 002 semantic music/SFX import and Sound toggle.

## Critical integrity boundary

This is a **client-side local reference authority**, not secure against browser tampering or site-data deletion. The 30-gold reward is a labelled test fixture inside a range guaranteed by the pinned Flare chest definition, not an authoritative Flare roll or account-credit reward. No XP, Gold, item, consumable or progression here may sync into real accounts or the Friend product. Death/retry and next-day unlock remain intentionally disabled until the Owner locks policy. Current prototype movement and combat are NOT equivalent to native Flare v1.15 combat.

Before release, port the operation/claim contract to a server-authoritative, transactional backend with unique `(expedition_id,reward_source_id)`, durable guest/account ownership, trusted encounter outcomes, and proper staging migration proof. Do not claim replay security from IndexedDB.

## Test

`node --test tests/ruins-expedition-day1.test.mjs`

Expected: 15/15 PASS with source hashes and nonduplication tests.

For a private browser preview, serve the repository `public/` root from `http://localhost` and open `/ruins-expedition/index.html`. Open only on a disposable browser profile or isolated origin because the prototype persists a local IndexedDB test session. Test 320x568, 360x800, 390x844, 430x932, 768x1024 and desktop. Use exact accepted audio assets from the real repository when testing, not any local audio shim.

## Evidence limits

Node tests completed 15/15 PASS in isolated container. A Chromium automation attempt was blocked by browser network administrator policy before navigation (both local HTTP and intercepted synthetic origin). Therefore no mobile browser, actual sound playback, or full preexisting repository regression PASS is asserted by this commit. Codex/local executor receives an exact bounded instruction for those tasks. No production deployment, Supabase mutation or Owner acceptance is implied.