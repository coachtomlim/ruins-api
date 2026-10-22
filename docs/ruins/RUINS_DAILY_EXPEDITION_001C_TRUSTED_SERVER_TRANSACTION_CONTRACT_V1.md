# RUINS Daily Expedition 001C: Trusted Server and Atomic Transaction Contract V1

**Date:** 2026-10-22 (Asia/Singapore)  
**Authority:** Dungeon Bravo Dev4, Project Manager and Design Authority  
**Disposition:** `001C_ARCHITECTURE_CONTRACT: DESIGN_READY / MIGRATION_NOT_AUTHORIZED`  
**Source:** `coachtomlim/ruins-api`, branch `work/ruins-daily-expedition-001`, reviewed base `92283ae37e9e4da5c3ac6f4183bb4ac109b10c3f`  
**Staging target for later approval:** Supabase `Dungeon Runner S8B Staging` (`qpgwqmduqtqidmhbuclw`), NOT production.  
**Dependencies:** `docs/ruins/RUINS_DAILY_EXPEDITION_001A_AUTHORITY_AND_STATE.md`; the approved 001B local prototype; 2026-10-21 shared-Supabase security notice; `RUINS_DAILY_EXPEDITION_001C_SECURITY_GOVERNANCE_AND_ACCESS_MATRIX_PREFLIGHT_20261021.md` on G:.

## 1. Decision and hard boundary

1. Implement **a separate authenticated-user-only, non-transferable staging** RUINS expedition authority for Day 1/Rooms 1-2 as the next bounded technical slice. No guest server entitlement and no real wallet/XP minting in the first staging cut. Anonymous local 001B stays a visibly separate **LOCAL PREVIEW** and cannot claim server or cross-device results.
2. Prefer a **Supabase Edge Function** as the trusted HTTPS request handler and a **non-exposed PostgreSQL schema `ruins_private`** for the transactional state. This is a design selection, not a deployed endpoint or configured connection. Actual Edge Function runtime, allowed Auth setup, DB connection/pool, CORS origin and the project's Data API exposed-schema setting MUST be verified before applying migration or deploying a function. If unavailable, return `ARCHITECTURE_REVISE`; do not substitute a browser RPC or service-role key.
3. The Edge Function verifies the user's Supabase Auth access token **on every request** (provider `auth.getUser(token)` or equivalent identity-verifying provider check; do not infer authorization from `user_metadata`, `authenticated` role alone, email address, client-supplied principal ID or JWT payload decoded without verification). It passes the verified `auth.users.id` as a parameter to ONE private DB transaction routine.
4. For DB access prefer a **dedicated least-privilege `ruins_backend` login / pooler** (subject to staging feasibility) with USAGE only on `ruins_private` and EXECUTE on named, non-exposed entry routines. The routines own access to private data and independently verify principal/instance/entitlement ownership. Their implementation may require carefully controlled `SECURITY DEFINER` within the non-exposed schema with `SET search_path = ''` and all relations qualified. Never grant `anon`/`authenticated` direct table or routine access; never expose the private schema in PostgREST. Do not assume Edge Functions can reach a private schema via `.schema().from()` without exposing it; use reviewed direct Postgres connection instead. DB credentials, passwords, secret keys and bearer tokens are not committed, logged or returned.
5. Keep the existing S8B **Daily Trial** (`public.daily_trial_run`) and **Friend** (`public.builder_challenge*`, related RPCs) separate. Do not rename, mutate, migrate or share their entitlements/reward identifiers with RUINS. Do not touch the 12 client-denied legacy SL-SIM tables. Existing Gold wallet `public.wallet_ledger` is **read-only/out-of-scope** for 001C staging. The current +30 Gold/+2 XP are local fixtures, not bankable balances.
6. Do not change the accepted Gate C topology, Day 1 presentation, frozen Friend/Audio refs, `main`, release deployments, or Owner-owned `START_QUICK_DUNGEON_OWNER_REVIEW.bat`. No SQL DDL/DML, grant, Edge Function deployment or security setting modification is authorized by this design document.

## 2. Verified and unverified external preconditions

**Read-only verified, 2026-10-22:** Supabase staging is ACTIVE_HEALTHY; PostgreSQL 17.6; public `player_profile`, `player_runner`, `wallet_ledger`, `reward_claim` and existing `daily_trial_run` tables are present; `ruins_private` does not exist; existing S8B signed-in browser adapter uses Supabase Auth. The 12 legacy SL-SIM public tables have RLS enabled, and `anon` / `authenticated` lack direct SELECT/INSERT/UPDATE/DELETE privileges. Security Advisor shows INFO/WARN but no CRITICAL/ERROR class at the time checked. Existing `public` Daily Trial routines exist. There is only a static repository `api/display-room.js` route: no already-governed RUINS secret-bearing trusted API identified.

**Not yet independently verified:** Supabase Data API's exact dashboard Exposed Schemas list; Edge deployment/permission and selected project function configuration; dedicated DB role & connection pooler feasibility without using privileged `postgres`/service-role credentials in runtime; token/session-revocation needs; allowed CORS origins and rate-limit infrastructure. `current_setting('pgrst.db_schemas',true)` returned NULL in the SQL session, which is **not** evidence that no schema is exposed; inspect the Data API project setting explicitly. Until verified, the **connection implementation is CONDITIONAL**, not a blanket GO.

## 3. Versioned, closed-scope server API

Static baseline contract: `docs/ruins/RUINS_DAILY_EXPEDITION_001C_STAGING_PROTOCOL_V1.json` (machine-readable, tests validate invariant presence). HTTP path is provisional until the Edge Function is configured; canonical request/response semantics below must be preserved.

- `GET /functions/v1/ruins-expedition/state` : authenticated, read own sanitized state; does not create an entitlement, advance a day or mutate a claim. Returns `{contractVersion,scope,expedition,revision,day,room,status,heroPublic,visibleFlags,claimedPublic,availableActions,policyStatus}`. No hidden seed/loot, bearer credentials, other player records or internal event payloads. Guest request => 401 with local-preview guidance.
- `POST /functions/v1/ruins-expedition/commands` : authenticated; JSON `{contractVersion,operationId,expectedRevision,type,parameters}`. **Do not accept** caller-supplied `playerId`, `gold`, `xp`, `hp`, `loot`, `claimSourceId`, `rewardAmount`, `roomState`, `serverTime` or `policy` overrides. Bounds: `operationId` UUID; bounded body size (e.g. <= 8 KiB, to validate before parser), command allowlist, strict per-command parameters.
- A separate authenticated **bootstrap** command (not anonymous automatic browser load) allocates/retrieves the single scoped entitlement and one instance. Request IDs are idempotent and attached to the entitlement. Later `BEGIN_NEXT_DAY` is **not** allowed while policy is unresolved. Only Day1 commands are recognized in the initial staging implementation.
- All accepted commands return a bounded receipt `{operationId,revision,status,events,publicState,duplicate,serverRecordedAt}`; duplicate requests return the original receipt. Server authoritative state changes are committed before sending success. Errors return stable safe codes (`AUTH_REQUIRED`, `UNSUPPORTED_VERSION`, `BAD_COMMAND`, `COMMAND_TOO_LARGE`, `ENTITLEMENT_CONFLICT`, `REVISION_CONFLICT`, `OPERATION_ID_REUSE_MISMATCH`, `NOT_YET_UNLOCKED`, `DAY_ALREADY_SETTLED`, `OUT_OF_RANGE`, `INTERNAL_RETRY_SAFE`) without revealing private IDs or SQL diagnostics. For `REVISION_CONFLICT`, the client must GET own state and reconcile; no automatic reward replay with a newly minted operation ID.
- CORS: exact staging-origin allowlist; OPTIONS responds without privileged state; CSRF assumptions recorded by actual auth delivery method. Rate limits and connection limits must be verified in local/staging tests. Deny unauthenticated, invalid/expired/revoked user sessions where the chosen security model requires revocation checks. No browser service-role keys.

### Day 1 command allowlist and source adapter

`BOOTSTRAP`, `MOVE`, `DISCOVER_ALTAR`, `ENTER_ROOM2`, `ATTACK_ZOMBIE`, `CLAIM_ROOM2_CHEST`, `SETTLE_DAY1` only. Keep the accepted local semantic behavior, but translate client intent through a *server* adapter that validates collision map, altar/exit/chest adjacency, zombie HP, encounter/XP award and day-state preconditions. Preserve authored Room 1 discovery and Room 2 zombie/treasure; document the web adaptation which gates chest/settlement on defeat (not a gate in original native Room 2 map).

**Critical:** Client-side `day1-state.mjs` is a **reference/test oracle**, not callable reward authority. Never simply trust a client snapshot or run a client-provided reducer result at the backend. The pinned reference content must be server-loaded from trusted versioned assets. Original native Gate C maps stay exact. Set a dedicated server rules version and content hash, distinct from the current local-proof UI version; the server rejects mismatched/unknown rules and never silently reinitializes a saved expedition.

## 4. Atomic authority transaction and lock order

**Single ACID commit per command**, not chained client-side REST writes. Required transaction procedure:

1. Handler validates method, origin, body, Auth token and verified user; produces `verified_player_id` and a checked command envelope. No client-chosen authoritative principal.
2. Invoke an internal non-PostgREST-exposed private routine under a dedicated role. Transaction obtains the player's **scope-entitlement lock**, then expedition row lock, in that fixed order; a missing entitlement on BOOTSTRAP is resolved with unique-insert/on-conflict plus row lock. Do not use a stale read-before-insert race.
3. Look up receipt by **unique `(entitlement_id, operation_id)` before checking the expected revision**. If found with the exact canonical request fingerprint, return the persisted receipt, `duplicate:true`, without increment, award or effect. If the same operation ID has a different canonical payload, fail `OPERATION_ID_REUSE_MISMATCH`, with no side effect.
4. Otherwise compare `expectedRevision` with the locked instance revision. Stale operations fail `REVISION_CONFLICT`. Check `ACTIVE`/day/room gates, source versions, map collision and authoritative encounter state. Reject speculative Day2 and Room3 transitions.
5. Resolve reward `source_id` on the SERVER from immutable content mapping. The reward claim key is **`(entitlement_id, reward_source_id)`**, not just per instance, making even an accidental instance recreation unable to re-award. For a source already claimed under a *different* operation ID, return the existing claim's public outcome as a no-grant result, not a new wallet credit or random reroll. Stable source IDs survive retry/content-version changes.
6. For a new claim calculate its quantity/content from the pinned authoritative rules, once. Insert claim and inventory/XP/local-staging-currency event (and actual quantity/equipment delta), update encounter, checkpoint, flags, day settlement, and append operation receipt **in the same transaction**. An inventory-capacity or validation failure rolls back every affected row. Use unique indexes as final safeguards; no swallowing unique exceptions after partial commits.
7. Commit before returning receipt. In a lost-response scenario the client resends the *same* operation ID and identical payload. The first receipt is returned. The server never mints from a screenshot, browser cache, friend challenge, replay, or copied local save.

Do not use random loot values from the Day1 30-Gold fixture as real values. For the staging proof, fix approved **non-transferable test reward source** `ruins-gate-c-015:room02:chest:01` and `ruins-gate-c-015:room02:zombie:01:defeat`. Store the awarded payload in the private claim ledger and mark `STAGING_ONLY`, but never insert into `public.wallet_ledger`, `runner_xp_event`, or other real account progression tables. A future real-wallet integration requires a separate design, migration and Owner approval.

### Correct order and failure handling

- Entitlement uniqueness: `(principal_kind, principal_id, campaign_reward_scope)` unique, with `principal_kind = ACCOUNT` in staging v1.
- One instance per entitlement; instance has foreign key and unique entitlement ID. No alternative instance resets entitlement/claims.
- Claims unique `(entitlement_id, reward_source_id)`; never key solely to browser, day or attempt ID.
- Receipts unique `(entitlement_id, operation_id)` and store canonical request hash plus original bounded receipt; command ID reuse with different expectedRevision counts as a different payload.
- Inventory deltas indexed by `(entitlement_id, operation_id, item_instance_id_or_source)`; no item duplication by replay.
- Day settlement uniqueness `(entitlement_id, day_number)` and terminal `SETTLED` records; Day1 reward and day settlement are separate sources/events, so settlement itself does not repeat the chest award.
- Locking: all write paths use the same entitlement→instance→source order. Deadlock retries are bounded by the trusted handler without changing operation ID or weakening authority.
- Input ordering: a room transition cannot be committed before the prior discovery/encounter command. The accepted movement sequence and hero/checkpoint state must exist before a reward is eligible.

## 5. Table and routine contract (no DDL in this package)

Private schema proposed `ruins_private` (must not be added to Data API exposed schemas):

| Proposed entity | Minimum authority | Uniqueness/security rule |
|---|---|---|
| `expedition_entitlement` | verified account UUID, `campaign_reward_scope`, `definition`, content/rules/policy pins, created_at | UNIQUE(principal_kind, principal_id, campaign_reward_scope), with principal_kind = ACCOUNT. NO client table grants. |
| `expedition_instance` | one entitlement, revision, status, day/room/checkpoint, current state JSON with validated schema and versions | UNIQUE(entitlement_id); revision monotonic; validated invariants. |
| `expedition_claim` | entitlement, instance, stable source, immutable payload, claim receipt/op and timestamp | UNIQUE(entitlement_id, source_id); no double award on any replay. |
| `expedition_operation` | entitlement, op_id, canonical hash, expected revision, original response receipt, committed_at | UNIQUE(entitlement_id, operation_id); fingerprint mismatch fails. |
| `expedition_inventory_event` | entitlement, accepted op/claim, item, delta, effect, committed revision | UNIQUE for one effect per accepted op/source; no unrelated wallet writes. |
| `expedition_day_settlement` | entitlement, day 1..5, checkpoint, settlement record/time | UNIQUE(entitlement_id, day); no settlement reopening. |

Any additional runtime-only attempt/replay/event table requires the same access classification and protection in its **creation migration**. Data fields holding hidden encounters, private flags, tokens, internal hashes or debug logs never appear in unauthenticated/public projections. For first staging cut, `guest_credential` and account attachment tables are **not created**.

Access and roles are detailed in `RUINS_DAILY_EXPEDITION_001C_STAGING_ACCESS_MATRIX_V1.md`. Default all private tables RLS-enabled for defense in depth; revoke direct rights from `PUBLIC`, `anon`, `authenticated`. Do not add broad policies to satisfy the UI. Private routines must revoke default `PUBLIC EXECUTE`, use pinned `search_path` and fully qualified references; grant narrowly to dedicated server role. Verify backend role ownership and RLS bypass behavior in staging; do not assume RLS covers routines running under elevated owners.

## 6. Branches, day boundaries and unresolved policy

Five-day structure is fixed 01–02 / 03–04 / 05–06 / 07–08 / 09–10; the authored Room06→08 shortcut may skip Room07 and must mark `SKIPPED_BY_BRANCH`. Day3 settles at Room06 fork; Day4 chooses the route, Room08 remains mandatory. Server's content/rules version pins must preserve that graph; this project is **not** S8B Daily Trial's rotating six-room feature.

Four owner decisions remain **OPEN** and are **not** inserted as implied defaults: Singapore-calendar vs rolling 24h gating; between-day full-rest vs HP carry; death/retry checkpoint semantics; missed-day expiry/skip. Initial staging only proves Day1 and does not expose `BEGIN_NEXT_DAY`, open Room3 or compute live next-day unlock. Server returns `policyStatus:"UNRESOLVED"` and an unavailable next-chapter projection until the policy is explicitly locked and tested. The local proof's `LOCAL PREVIEW` stays non-transferable.

## 7. Acceptance and adversarial test contract

The next executor's offline staging-plan package must run tests against a **disposable local Postgres / simulated backend** first, using fake identities and zero real rewards. It must not run a migration on the shared Supabase project without **separate explicit migration authorization from Dev4**. Later approved staging tests require:

1. anon and authenticated Data API roles cannot query/write private tables or call internal private routines;
2. identity A cannot GET or command B's instance even with guessed UUID or operation ID;
3. missing/expired/revoked credential handling fails closed; forged playerId/snapshot/HP/reward fields rejected;
4. BOOTSTRAP twice or in concurrent tabs produces one entitlement/instance per account and scope;
5. same operation ID + same canonical payload returns the same receipt without revision/inventory/XP effects;
6. same operation ID + changed payload is rejected, no mutation;
7. two different concurrent operations on same revision produce one accepted revision and one conflict;
8. two different operation IDs claiming the same stable source can never produce two awards;
9. failed inventory/HP/settlement transaction leaves no claim, receipt or partial state;
10. room/quest/encounter validation blocks premature actions and unauthorized Day2/Room3;
11. disconnect/refetch/lost-response, reopen, rollback and two-tab reconciling do not reset claims;
12. any new or altered `SECURITY DEFINER` routine has pinned `search_path`, narrow `EXECUTE`, internal ownership checks and no secret projection;
13. Frontend deployment contains no server role connection strings or keys. Authenticated Edge server path functions; direct Data API remains denied;
14. Friend frozen verifier/regression passes, twelve legacy SL-SIM tables remain RLS-on/client-denied, no changed existing Daily Trial state;
15. After **any** staging DDL migration, run Supabase Security Advisor and record `SECURITY_ADVISOR: PASS | REVISE` with before/after findings, public exposure and executor grants. **Any new CRITICAL/ERROR = STOP; no deployment.** Baseline WARN/INFO findings must be classified and not silently expanded.

Testing must capture exact GH SHA, migration hash/status, actual role grants/policies (including sequences/default privileges), DB routine `SECURITY DEFINER`/search_path, backend API, per-user negative receipts, scoped rollback/unique assertions, successful dedicated backend access, and advisor URL/evidence. Do not call a migration PASS based on advisors alone without cross-identity and replay tests.

## 8. Next sequence and executor selection

**Dev4 completed now:** technical source reconciliation, read-only shared-staging inspection, closed API/state transaction design, access matrix and machine-readable contract with offline structural tests. Commit and mirror these **documentation/tests only** to GitHub/G:. Avoid persisting redundant developer state on ASUS C:.

**Next bounded local executor (one at a time, Claude or Codex based on capacity):** prepare *offline-only* staged migration draft, private routine transaction pseudocode/implementation and API proof harness in a separate worktree/branch, using disposable database and fake accounts. Do not apply DDL on the shared staging Supabase project, mutate Friend/SL-SIM, touch production, or claim real rewards. On return, Dev4 reconciles exact SHA/security proof and decides whether to authorize a later staging-only migration. No simultaneous Claude/Codex implementation of this same work package.

**Release-adjacent separate issue:** current Day1 Flare art loads from `raw.githubusercontent.com` and has shown transient `ERR_CONNECTION_RESET` failures. Before any public release, package governed CC-BY-SA 3.0 assets locally with hashes, credits and offline/retry proof, or use an approved reliable origin. That is a **separate task** and is not fixed by server persistence.

**Owner:** policy decisions are needed before Days 2–5 staging/live unlock; no new credentials or deployment approval requested by this architecture design.

### Current official result

`RUINS_DAILY_EXPEDITION_001C_AUTHORITY_API_AND_TRANSACTION: DESIGN_READY`  
`STAGING_DDL_APPLIED: NO`  
`SECURITY_ADVISOR_POST_DDL: NOT_APPLICABLE`  
`PRODUCTION_MUTATION: NO`
