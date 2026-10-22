# RUINS Daily Expedition 001C: Offline Backend Proof 006

**Owner:** Dungeon Bravo Dev4 PM. **Executor:** ONE selected local executor, Claude Code or Codex, not both. **Status:** Prepared only; no backend execution or staging DDL is authorized. **Source base:** the committed 001C contract on `work/ruins-daily-expedition-001`, whose SHA must be checked when execution begins.

## Task

Build a **local/disposable/offline-only** proof of the contract in `docs/ruins/RUINS_DAILY_EXPEDITION_001C_TRUSTED_SERVER_TRANSACTION_CONTRACT_V1.md`, its access matrix and versioned JSON. Do not reinterpret the product policy or replace the approved architecture with a quick public RPC. Use a dedicated feature branch/worktree from the latest verified `work/ruins-daily-expedition-001`; **no concurrent executor** on this feature.

1. Confirm actual Git/remote HEAD and worktree; inspect existing S8B account adapters, Daily Trial/Builder RPCs, 001B state reference reducer, approved Gate C source. Preserve frozen route families, the Owner BAT and unrelated local folders.
2. Produce a *migration draft in source only* for `ruins_private`, six private authority tables, unique entitlement+scope / claim+source / operation+ID / settlement+day constraints, table RLS, explicit grants, default privileges, private routines and fixed search_path. Apply only to disposable local Postgres if available, never the Supabase shared staging DB. Do not silently default to `public`. If DDL tooling demands an authorized live apply, STOP and report BLOCKED.
3. Produce a bounded Edge Function handler **candidate in source only**, identity verification through Supabase Auth and one trusted private transaction call. Do not deploy the function, configure secrets, or embed secret keys. If direct Postgres/role feasibility is unproven, isolate behind a seam and explicitly mark CONDITIONAL rather than fake a live connection.
4. Implement a minimal server-authoritative state/command validator for **Day 1 only**. Browser sends intent not claimed outcomes. Use pinned source maps/rules and stable rewards. Staging Gold/XP remain non-transferable and must never touch `public.wallet_ledger` or `runner_xp_event`. Do not implement guest conversion or next-day unlock, and do not alter 001B UI without PM authorization.
5. Build a disposable local proof harness with fake account A and B: identity isolation, bootstrap concurrency, same-op replay, changed-op payload, same-source different-op collision, lost response, stale revision, inventory/claim atomic rollback, tamper payload, denied next-day/room3, direct-role negative permissions, routine EXECUTE grants, clean error projection. Prefer actual local Postgres; any mock-only tests must be explicitly separate and cannot claim a DB-security PASS.
6. Run new focused tests, existing RUINS/Friend regressions, frozen verifier, and full suite; compare the pre-existing 15 known full-suite failures, report *new* failures separately. Save logs, migration hashes and receipts in G:.
7. Before completion, inspect the resulting diff, source SHA and freeze refs. Commit normal non-force to the isolated branch only, push if permitted, and return an exact disposition. Do not merge or release.

## Storage SOP

GitHub is canonical code; use a normal local worktree on whatever local non-synced scratch disk is practical. **Never put live `.git` objects or `node_modules` in G:**; Git operations on a synced folder are prohibited. Minimize durable C: storage; delete only newly created temporary task files after complete, hash-verified transfer to G:. Save full source commit hashes and every run receipt to `G:\My Drive\Quick Dungeon\Owner Review\RUINS_DAILY_EXPEDITION_001C\OFFLINE_BACKEND_PROOF_006\` (create as needed). Do not move or delete the Owner's existing C: checkout.

## Hard boundaries

NO staging/prod DDL, NO Supabase migration apply, NO Edge Function deployment, NO Auth configuration modification, NO service key handling, NO public GRANT weakening, NO Friend/SL-SIM changes, NO `main`, NO frozen-ref mutations, NO public release. Read-only Supabase observation requires exact project/ref and no table data exfiltration.

## Required return

`RUINS_DAILY_EXPEDITION_001C_OFFLINE_BACKEND_PROOF_006: PASS | REVISE | BLOCKED`

Return: branch, base/final SHA, worktree, changed files, migration *draft* hash and applied=NO on shared staging, local DB version and tests, identity/entitlement/claim/replay/concurrency/rollback proofs, backend auth and privileges negative tests, advisor status `NOT_APPLICABLE` because no shared staging DDL, full/regression test counts, G: evidence folder, provisional role/pooler obstacles, and next proposed smallest package. DO NOT claim `SECURITY_ADVISOR: PASS` without a future authorized DDL application and advisor review. If any security assumption requires opening `public` or use of browser service keys, return REVISE and STOP.

**PM adjudicates before any later staging-only migration authorization.**
