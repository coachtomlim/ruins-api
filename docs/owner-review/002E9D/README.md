# FRIEND FEEDBACK 002E9D — V18 + full Friend run clickthrough

Acceptance automation: `tools/flare-friend-run-acceptance.mjs` (system Chrome via playwright-core, 390 x 844, fresh session,
Builder Level 2 earned by the first completed run). It asserts 53 steps and records the page with the Chrome screencast,
encoded to H.264 / yuv420p with ffmpeg.

```
node tools/flare-s8a-preview-server.mjs
PLAYWRIGHT_CORE=<path to playwright-core> node tools/flare-friend-run-acceptance.mjs <outDir>
```

The video and README for the Owner live in
`G:\My Drive\Quick Dungeon\Owner Review\FRIEND_REWARD_JOURNEY_001\FINAL_FRIEND_RUN_ACCEPTANCE\`.

New migration prepared (NOT applied): `supabase/migrations/20261005_friend_challenge_feedback_002e9d_eight_guard_receipts.sql`
with the PM proof script `supabase/staging-proofs/20261005_002e9d_eight_guard_receipts_proof.sql`.
Until PM proves it, ordinary Level 2 builds with more than three guards still play normally but their result stays on
the device (honest message); flip `RECEIPT_SERVER_ORDINARY_MAX_ENEMIES` to 8 in `public/flare-s8a/level2-content.mjs` afterwards.
