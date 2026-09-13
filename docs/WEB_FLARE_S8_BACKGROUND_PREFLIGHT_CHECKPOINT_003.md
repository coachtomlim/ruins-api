# WEB-FLARE S8 Background Development Checkpoint 003

Branch: `work/web-flare-s8a-rewards-replay-001`

Live baseline remains S7.1. No HostGator deployment has been executed. Vercel automatic Git deployment remains disabled for this branch through `vercel.json`.

## New prepared S8A development since checkpoint 002

- isolated `/m/XXXX` invite flow: `public/flare-s8a/flow.mjs`
- invite-flow tests: `tests/flare-s8a-flow.test.mjs`
- dungeon build-budget view model and tests
- mobile mission view model and tests
- ready-to-run view model and tests
- panel-based customization view model and tests
- mobile error/recovery view model and tests
- explicit registration action boundary and tests
- registration view model now exposes disabled S8A account action rather than pretending an account service exists
- receiver screen-shell state and focus policy plus tests
- portrait mobile policy and tests
- in-memory receiver session model preserving room/encounter across replay/edit/registration plus tests
- invitation view model and tests
- runtime HUD view model clarifying `HERO GOLD` versus future Builder reward plus tests
- shallow-clone-safe frozen predecessor tree manifest and verifier, covering S2 through S7.1
- prepared S8A module barrel: `public/flare-s8a/prepared.mjs`
- explicit versioned `FINISH_HP_PERCENT` goal model and tests
- compact clear-first reward teaser and governed reward-tier fixture
- golden L3/60 end-to-end view-model journey test
- challenge share copy that explains the precision-clear goal before the receiver opens the link

## Frozen predecessor tree fingerprints

The new verifier compares current `HEAD:<path>` tree identities against the accepted S7.1 authority, so it does not require the old accepted commit object to exist in a shallow checkout.

Tool:

`tools/verify-frozen-web-trees.mjs`

Manifest:

`tools/frozen-web-trees.json`

This addresses the earlier cloud-build false failure caused by missing historical Git objects while preserving byte-for-byte predecessor verification intent.

## Safety boundaries remain

- no live S7.1 mutation
- no HostGator deployment
- no Vercel deployment
- no real auth/account service
- no database mutation
- no browser wallet persistence
- no gameplay rebalance
- no production telemetry transmission

## Recovery

All changes were committed incrementally. Git history on this branch is the recovery source. Codex should consume the prepared modules rather than recreate equivalent inline logic during the one-go S8A integration build.
