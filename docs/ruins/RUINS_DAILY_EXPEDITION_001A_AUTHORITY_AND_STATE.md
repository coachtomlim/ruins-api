# RUINS_DAILY_EXPEDITION_001A — Authority, State Contract and Day 1 Plan
Date: 2026-10-20
Successor PM / Development Lead: Dungeon Bravo Dev4
Result: RUINS_DAILY_EXPEDITION_001A_AUTHORITY_AND_STATE: PASS
Scope of PASS: source authority recovered and verified; proposed persistence contract and first-slice plan complete. No gameplay implementation, database application, browser acceptance or deployment is claimed.

## 1. Succession and verified source
The Owner's supplied Dev4 handoff and direct instructions are the current succession authority. Dev4 accepts responsibility for Quick Dungeon / Dungeon Runner / WEB-FLARE, preserving Build & Challenge as a separate product loop.

| Authority | Directly verified value |
|---|---|
| Development repository | coachtomlim/ruins-api |
| Starting development branch | work/ruins-daily-expedition-001 |
| Starting remote and new cloud-local clone HEAD | b7d5af4a7276583dd87950276d7fb311c97aa36d |
| Frozen Friend ref | release/friend-feedback-002e9g-live-accepted at 7a436176a13cde60ab7a1a900511ff711aaf7e4e |
| Frozen Audio ref | release/flare-audio-integration-002-accepted at 80a17c3186962fa1d8e978544164b8edfb271cce |
| main, read only | ce7968a056a0a5c42584da6b4265f3729adaac8c |
| Audio ancestry | Friend to Audio: ahead 3, behind 0; merge base equals frozen Friend SHA |
| Starting branch ancestry | Audio to b7d5af4: ahead 1, behind 0; only audio freeze record added |

Both freeze records were read in full:
- docs/WEB_FLARE_FRIEND_FEEDBACK_002E9G_LIVE_ACCEPTED_FREEZE.md
- docs/FLARE_AUDIO_INTEGRATION_002_ACCEPTED_FREEZE.md

Audio 002 is accepted source, not publicly deployed. Frozen refs were read only. This environment is a new Linux cloud workspace, not the Owner's Windows worktree. The Owner's untracked START_QUICK_DUNGEON_OWNER_REVIEW.bat cannot be inspected here and was not accessed, removed or added.

## 2. Exact Gate C source recovered
The historical commit is in a DIFFERENT repository:
https://github.com/coachtomlim/xyz-aia-sim/commit/add02bd9bc98e26cad95ae5ac00a5da1a255e0cd

Exact mod directory:
project-control/flare-pc2-bootstrap/artifacts/flare-gate-c-015-mod/

Exact accepted mod tree: 83de9e7c81961b5d619d188e318f57beeca290fb.
All 18 text files were fetched at that exact commit, materialized and checked against Git blob SHA-1 and byte length: 18/18 PASS. The original validate_gate_c_source.py was run unchanged: 10 rooms, three 64-value layers each, zero failures, exit 0. This validates recovered source structure, not current browser playability.

Historical acceptance read in full:
https://drive.google.com/file/d/1YS6f5Jaf_49sLPSjwgM59j6GgqVgiEP0/view
PM03-FLARE-GATE-C-015-RECONCILIATION.md identifies the exact tested commit/tree and FLARE_PASS. Local evidence FLARE-GATE-C-015.md was also read in full:
https://drive.google.com/file/d/12NUTTzuhcWTPaNiIdOkGuBcec0jdTbgK/view

Historical evidence proves ten-room traversal, shortcut/reconvergence and elite/secret/boss/completion persistence after restart. Limitations remain: vendor Talk/Trade was shown but purchase was not separately proven; the final Room 8 rerun proved distinct rendering and active combat, not a kill. This report does not elevate those into stronger claims.

Source files are ten maps, spawn override, two enemy definitions, quartermaster NPC, settings, README, SOURCE_DESIGN and validator. The historical repository and its unrelated projects remain read only.

## 3. Recovered authored content
All rooms are compact 8×8 functional proof geometry, using stock cave/dungeon tiles. They are not a production-quality visual remake. Default map hero_pos is (2,4); intermap arrivals are (1,4), except initial spawn enters Room 1 at (2,4). Coordinates below are source coordinates.

| Day | Room and source title | Exact authored behavior |
|---|---|---|
| 1 | 01 Discovery Altar | Discovery trigger (2,3,3,3), one-shot gate_c_discovery. Message: altar answers and sealed route opens. Exit (6,1,1,6) to 02 requires discovery. No enemy or loot. |
| 1 | 02 First Blood | One level-1 zombie at (4,4), wander 1. Chest object (5,4), reward trigger (4,3,2,3). One loot/chest_level_1.txt roll; gate_c_r2_reward suppresses reissue. Opens tile 161 to 177 and collision to 0. Exit to 03 at (6,1,1,6). |
| 2 | 03 Lost Cache | Chest (4,4), trigger (3,3,2,3), one chest_level_1 roll, gate_c_r3_cache. Opens object/collision. No enemy. Exit to 04. |
| 2 | 04 Crossfire | Level-1 zombie (3,3) and level-1 skeleton (5,5), wander 1. Exit to 05. No authored chest. |
| 3 | 05 Elite Secret | Elite at (4,4), wander 1. Stock lvl1_zombie_rotting include; HP 90, XP 4; gate_c_elite_defeated suppresses respawn. Chest (5,5), trigger (4,4,2,2), requires elite defeated and no gate_c_secret_found. One chest_level_1 roll and persistent secret flag. Exit to 06. |
| 3 | 06 Forked Passage | No enemy/reward. Hazard Route exit (6,1,1,3) to 07; Risky Shortcut (6,4,1,3) directly to 08. |
| 4 | 07 Hazard Hall | Scorched Floor (3,3,2,2), power 178, damage 5–10, repeat true, cooldown 3s. Exit to 08. Optional via accepted shortcut. |
| 4 | 08 Major Encounter | Level-3 skeleton_knight at (4,2), level-1 zombie at (5,5), wander 1. Do not regress knight to unsupported level 1. Exit to 09. |
| 5 | 09 Quartermaster | NPC (4,4), stock guild_man2 animation. Talk sets gate_c_vendor_ready. Vendor constant_stock=2:10,3:10,750:20; random trader_martigan stock count 5–8. Exit to 10. Talk text suggests rest but implements no HP restoration. |
| 5 | 10 Final Guardian | Boss (4,4), wander 0, stock lvl3_skeleton_knight include, HP 150, XP 16. gate_c_boss_defeated suppresses respawn. Reliquary (5,4), trigger (4,3,2,3) requires defeat and no gate_c_complete; one chest_level_1 roll, persistent completion and opened object/collision. No next-room exit. |

Source namespace: gate_c_discovery, gate_c_r2_reward, gate_c_r3_cache, gate_c_elite_defeated, gate_c_secret_found, gate_c_vendor_ready, gate_c_boss_defeated, gate_c_complete.

Primary route: 01→02→03→04→05→06→07→08→09→10.
Alternative: 06→08→09. There are no reverse intermap edges in this source.

### Adaptation differences that must remain explicit
1. Room 2 reward and exit have no enemy-defeat predicate. Ordinary combat rooms also have no completion predicate. For the requested Day 1 encounter/reward proof, the web adaptation will require zombie defeat before chest claim/day settlement. This is a documented new rule, not a claim about Gate C.
2. Ordinary enemy defeats/drops are not persistently suppressed in these map declarations. Browser expedition persistence must cover every enemy reward source, not only four chests.
3. Flare status gating plus a world loot drop is not an atomic web inventory transaction. A persisted claim must include its actual awarded item payload.
4. No calendar, five-day schedule, guest identity, web journal or cross-device state exists in this native mod.
5. Preserve the shortcut: Day 3 settles at Room 6's fork before crossing either exit. Day 4 resumes there, then selects 07→08 or 08 directly. Room 7 is recorded SKIPPED_BY_BRANCH on the shortcut; Room 8 remains required. Do not silently delete the branch or award skipped-room objectives.
6. Each day ends at its final room checkpoint before the next intermap transition. At Day 1 completion, Room 2→3 is replaced by a camp/checkpoint action, not access to Room 3.
7. Resolve stock loot table contents and inherited enemy stats from the pinned stock source before defining web reward payloads. No reward amount, stock item meaning or combat balance is invented in 001A.

## 4. Browser reuse and implementation boundary
Inspected current public/flare-s7/rooms.mjs, public/flare-s8a/runtime-controller.mjs, governed-encounter.mjs, audio-manager.mjs, public/flare-s8b/account-adapter.mjs and the persistence contract.

Reusable, by imports/adapters: map parser/stock tile handling, Renderer, actor packs, camera controls, accepted AudioManager and semantic events, existing account/session boundary.

Not directly reusable as expedition authority:
- Current Friend controller resets its simulation on begin/runAgain.
- Friend governed challenge construction derives placements on a spawn-to-exit path, with precision-target/budget rules.
- Neither is an authored multi-room quest event interpreter or persistent inventory/checkpoint service.
- Existing account adapter offers Daily Trial/account operations but no Expedition operations.
Use a separate expedition controller/state module and explicit authored coordinates. Do not edit the frozen S7/S71 trees or route Friend receipt settlement through expedition logic. Do not present the web combat model as native Flare stat parity without a separate comparison.

## 5. Proposed persistent state contract v1
This is a reviewable contract, not an applied schema. Policy fields are explicit and versioned. Four Owner policy choices remain OPEN.

| Entity | Required fields / invariant |
|---|---|
| expedition_definition | definition_id=ruins-gate-c, content_version, source commit/tree, immutable content manifest/hash, rules_version, policy_version, five-day room mapping, reward catalog version |
| expedition_entitlement | principal_id + campaign/reward_scope unique; at most one reward-bearing expedition for that scope. Server mints instance; client cannot create fresh IDs to reset claims. Content patch is not a new reward entitlement. No automatic replay/new-season awards. |
| expedition_instance | id UUID, principal_id, guest/account kind, definition/version pins, status ACTIVE/AWAITING_DAY/DEAD/COMPLETE, current_day 1–5, current_room, checkpoint_id, monotonically increasing revision, created/updated_at |
| checkpoint | checkpoint_id, room, position, phase, last accepted action sequence, hero HP/maxHP, inventory revision, equipment instance IDs, combat snapshot or deterministic replay cursor, branch flags, content/rules pins |
| room_state | room_id, NOT_ENTERED/ACTIVE/CLEARED/SKIPPED_BY_BRANCH; interaction flags, defeated spawn IDs, checkpoint revision. Cleared is never reset by reopening. |
| day_state | day 1–5, LOCKED/AVAILABLE/ACTIVE/SETTLED, started_at, settled_at, settlement_id, next_unlock_at, policy_version. Settlement is terminal and idempotent. |
| claim_ledger | immutable claim_id, expedition_id, reward_source_id, rolled payload, payload hash, inventory transaction IDs, accepted revision/time. UNIQUE(expedition_id,reward_source_id). |
| inventory and equipment | stable instance IDs, quantities, acquisition claim IDs, equipped slots and validity checks. Carry across rooms/days. Expedition inventory isolated from Friend budget/wallet until separately authorized integration. |
| consumable_ledger | action_id, item instance/type, quantity delta, effect, checkpoint revision. Use is atomic with HP/effect; committed consumption survives close/death. Never refund by loading a prior snapshot. |
| branch_state | fork selection, secret found, elite/boss defeat, vendor ready, room7 skipped marker. Immutable once committed where it determines route/reward eligibility. |
| failure_state | death_id, attempt_id, room/tick, last accepted checkpoint, retry_count, retry_policy, death acknowledgement. Disconnect is not automatically death. |
| action_receipt | expedition_id + operation_id unique, request hash, expected revision, authoritative result/revision, timestamp. Same operation/payload returns original result; changed payload with same ID rejected. |
| encounter_attempt | stable encounter/spawn IDs, seed, rules/content hash, accepted input sequence, outcome, death/clear status. Attempt IDs never change reward-source IDs. |
| vendor_state (future) | fixed generated stock and seed, purchase/sale receipts, quantity/balance deltas. Reopening does not reroll stock or duplicate purchase. No free resale loop. |

current_day remains the last active/settled day while awaiting unlock. Advance only in an accepted begin-next-day transaction after evaluating server time and previous settlement. After Day 5, status COMPLETE and current_day stays 5. Room/day completion is distinct from reward claim.

### Server/client responsibilities
Server owns identity, entitlement, time/gating, valid progression, inventory/equipment, consumption, claims, deaths and settlement. Commands submit intent, never client-proposed gold/XP/drop quantity or arbitrary HP. Combat acceptance needs pinned deterministic server replay or server simulation before durable rewards. A client assertion such as enemyDead=true is insufficient.

Client renders maps, sends sequenced actions, plays audio, stores a recovery cache and pending operation IDs, and reconciles receipts. Offline UI cannot grant transferable rewards. The Day 1 local proof uses the same command interface with a local reference authority and is labeled LOCAL PROOF, not secure durable production persistence.

### Atomicity and non-farmability
A claim transaction:
1. Authenticate principal and entitlement; lock/version-check expedition.
2. Validate room/day accessibility, interaction and encounter prerequisites against accepted state.
3. Resolve reward_source_id from the pinned manifest, for example room02/chest/first-reward or room02/enemy/zombie-01/defeat.
4. If claim already exists, return original payload/receipt with no inventory effect, even if operation_id differs.
5. Roll once under authority, append claim and inventory/XP/currency effects, update checkpoint/revision and store receipt in ONE transaction.
6. Return committed state. No success animation before confirmation.

Enemy XP, gold, random drops and healing pickups each belong to stable sources. Repeated kills cannot bypass the chest ledger. Choice rewards use one source ID across all options. A full inventory must preserve an escrowed claim payload or fail the whole transaction; never mark claimed while losing the item. Receipt retries must not reroll loot.

Day settlement requires all mandatory rooms/actions, Room 2 kill and resolved reward disposition, no unresolved action, and a live valid checkpoint. Write day terminal state and next unlock schedule atomically. Reward already granted in a room is not granted again at day settlement. If a future chapter bonus is added, it has its own once-only source ID.

Past settled days are journal/map view only in v1, with no combat, reward, XP or consumable reset. Current-day retries cannot erase claims. Creating another instance for the same principal/reward scope is rejected. Renaming a source/content version must not renew reward eligibility.

### Close/reopen, concurrency and uncertainty
- Persist before accepting room transition, pickup, consumption, choice, death or day completion.
- On reopen fetch authority first. A stale local snapshot cannot overwrite it.
- Retain pending operation ID before send; after lost response reload receipt/state, then retry the SAME operation.
- Multiple tabs use expected revision and a single accepted command order. Stale writes get conflict plus fresh state.
- Mid-combat reconnect resumes a persisted snapshot or deterministic replay from the accepted cursor. Stop accepting new inputs during authority loss; no rewarded offline branch.
- Local reference adapter uses IndexedDB transactions for state, claims and receipts together. Storage unavailable/quota errors visibly block commit. No autosave promise based only on unload.
- A newer unsupported schema/version offers recovery/export, never silent reset. Upgrade migrations preserve stable reward IDs and ledger provenance.
- Audio never participates in transaction success and cannot block progress.

### Guest versus signed-in
Proposed durable guest: server-issued unguessable guest credential/principal, persisted securely by the browser, with identical server claim/entitlement constraints. Use a dedicated guest session boundary; do not assume existing Friend guest state or publicly enabled anonymous authentication already provides this. Verify available capability before implementation.
Signed-in: account subject owns the same expedition instance and can resume across devices.

Guest→account attachment is an authenticated atomic ownership transfer preserving instance/claims, not replay/import of a client snapshot. If the account already has that reward entitlement, do not merge duplicate rewards; return an explicit conflict/recovery choice.

Browser-only local proof guests persist on that browser but cannot guarantee anti-tampering or survival after site-data deletion. They earn no transferable account rewards. Even a durable anonymous guest cannot be proven to be the same human after all credentials are erased; the promise is once per durable principal/entitlement, not universal person identification. Do not claim account-grade recovery for cleared guest storage.

## 6. Four Owner decisions still OPEN
Recommendations below are proposals, not locked runtime defaults. Day 1 state/UX work can proceed using explicitly labeled test policy fixtures; production policy must be selected before live acceptance.

| Decision | Recommended proposal | Alternative / consequence |
|---|---|---|
| Calendar/day gating, including first entry | Day 1 immediate; sequential chapters, next local calendar date after settlement; server time, Asia/Singapore pinned for v1 | Rolling 24h avoids near-midnight quick unlock; global scheduled days reduce flexibility. Device clock must never unlock. |
| HP/rest between days | One full HP rest when a new chapter begins, recorded once; equipment/inventory/consumption persist | Exact HP carry creates a harder expedition and can leave an unwinnable checkpoint. No source-backed automatic rest exists. |
| Death/retry | Retry current room with entry checkpoint HP, same seed, current committed inventory/consumption and all claims retained; replayed kills pay nothing | Whole-chapter retry or permanent expedition death are harsher. Need room-entry recovery to avoid restart-for-heal abuse; retry requires accepted death, not a voluntary rollback. |
| Missed days | No expiry/no chapter skipping; unlock waits until player returns, then at most one new chapter per calendar date | Catch-up chapters shorten cadence; reset/expiry discards continuity. Missed days never mint new reward scope. |

Policy objects include calendar_rule, timezone, first_day_rule, rest_rule, retry_rule and missed_day_rule. Until Owner selection, next-day live release stays disabled; no client-clock placeholders.

## 7. First vertical slice: DAY 1, ROOMS 1–2 ONLY
001B proposed implementation scope:
1. Dedicated private/local expedition entry. Existing Friend and Daily Trial entry remain functional.
2. Room 1 rendered from the accepted map, with physical discovery zone and a clear bounded interact affordance. Persist discovery before enabling exit.
3. Transition to Room 2 using exact authored edge/arrival. Carry runner and inventory; do not call Friend begin/reset.
4. One zombie at authored position. Persist encounter cursor/outcome. Gate reward/day settlement on accepted kill, an explicit web adaptation.
5. Show chest and commit stable once-only reward source plus actual item payload.
6. Settle Day 1 at Room 2 checkpoint; show completion/inventory and next chapter status. Room 3 runtime/content stays unavailable.
7. Close/reopen at discovery, transition, combat, after claim and after settlement. Prove exact authoritative recovery and no duplicate effects.
8. Use Audio 002 by import: entry EXPLORE, combat COMBAT, camp SAFE; accepted door, zombie hit/death, player hit/death and pickup events. Unlock on user gesture, persistent visible Sound toggle. Pending-license melee/secret/ambience remain silent. Do not import historical map music/SFX blindly.
9. Mobile viewport states: entry, room, inventory/journal modal, day-complete. Fixed primary action and readable text; no whole-document scrolling to discover controls. Test 320×568, 360×800, 390×844, 430×932, 768×1024 and desktop, including safe-area and keyboard/modal handling.

The current renderer can be reused only after proving authored spawn/collision/event support. Do not mask unsupported spatial interactions with an unrelated preset room.

### Expected future files, not changed in 001A
- docs/ruins/: source manifest, state contract, Day 1 acceptance evidence.
- public/ruins-expedition/: dedicated index/style/controller, content adapter, state/command authority, IndexedDB recovery adapter and audio bridge.
- data/authority/gate-c-015/: exact original text files with pinned blob manifest, kept separate from adapted web content.
- tests/ruins-expedition-*.test.mjs and tools/ruins-expedition-day1-proof.mjs.
- Later staging-only server adapter/migration generated through established tooling, only after local contract proof and staging readiness. No production schema changes in this package.
- Any later hub entry edit is narrow/additive and follows frozen-route proof. No replacement of live Daily Trial before expedition acceptance.

### Required focused tests
- Source: all 18 hashes/bytes, original ten-room validator, authored coordinates/edges and exact room1/2 mapping.
- State: discovery gates exit; carryover survives transition; cannot enter room3/day2; cannot settle before kill/claim; completed Day 1 reopens at checkpoint.
- Ledger: same request twice; different IDs same source; concurrent claims; disconnect before/after commit; retry after death; repeated enemy kill XP/drop; inventory full; consumable effect atomicity; no create-new-instance reset.
- Recovery: close/reopen every milestone, mid-combat cursor, stale two-tab write, denied storage, quota error and schema-version mismatch.
- Policy: injected server clock at boundary, next-day begin once, each explicit policy fixture, no device-clock authority. No live policy inference.
- Guest/account: stable guest resume, invalid/expired credential, account attachment once, existing-entitlement conflict, untrusted local snapshot cannot mint awards.
- Audio: gesture unlock, toggle persistence, accepted state transitions, no pending-license URLs fetched, audio failure does not change gameplay.
- Browser: every target viewport, action visibility/no document overflow, real interaction/kill/pickup flow and reopen. Capture review evidence only after actual execution.
- Regression: focused Friend/audio tests, frozen-tree verifier, then existing suite; seven preserved route families before any promotion. No live challenge writes merely to test a documentation package.

### Exit gate before Days 2–5
Day 1 must pass source/state/ledger tests, real browser/mobile play and close/reopen proof, accepted audio mapping, and Friend/frozen regression. Local adapter proof alone does not certify server security. Durable staging settlement and recovery need their own proof before public rollout. Owner policy selection is required for live calendar/rest/death behavior.

## 8. Verification and next work
Completed 001A milestones: branch/freeze reconciliation; exact Gate C recovery; content/topology inspection; persistent-state design; Day 1 plan. 5/5, 100%.
Verified now: source hash identity 18/18; original validator 10/10 rooms and zero failures; remote refs/ancestry; full freeze and historical reconciliation reads.
Not executed in 001A: gameplay implementation, new state tests, web browser slice, database migration, public deployment or live acceptance.

Next bounded package: RUINS_DAILY_EXPEDITION_001B, local state/claim reference authority and Room 1–2 adapter, using this contract and explicit test policies. Resolve stock dependencies and authored controller seams first, then prove close/reopen and non-duplicating claims before expanding content.

No main change, release ref movement, production Supabase action, HostGator deployment, SL_SIM action, licence-unresolved audio integration or Owner helper modification occurred.
