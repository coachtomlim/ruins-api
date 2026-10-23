# RUINS Daily Expedition 001C — 009 Offline Integration and Preflight Work Order

**Dev4 PM. Status: READY FOR SINGLE EXECUTOR, OFFLINE ONLY.** Date 2026-10-22 SGT.

Source `coachtomlim/ruins-api`, accepted parent `work/ruins-001c-principal-binding-008` @ `4039da028984bd155baf1c0c8b239d0a4c3116dd`. The accepted r2 SQL draft has SHA-256 `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57`. Work from a fresh isolated non-synced clone/branch. Do not change historical accepted branch, 006 draft or the r2 SQL merely for convenience.

Read the preceding Dev4 adjudication and the machine-readable `RUINS_DAILY_EXPEDITION_001C_PRIVATE_DB_CONTRACT_R2.json`, both in the same G: folder. Read the feature source and Claude 008 evidence. This package does **not** authorize shared staging DDL or any deployment.

## Required, bounded local work

1. **Deno proof**: Verify Deno locally using an already installed runtime or a disposable, pinned installation outside the project worktree; if unavailable, return `DENO_NOT_OBSERVED` with a precise blocker, not fake a PASS. Typecheck `supabase/functions/ruins-expedition/index.ts` and its imports. Run actual Deno WebCrypto `createPrincipalProofSigner` with disposable random 32-byte keys; reproduce the database's canonical MAC bytes and verify with disposable PostgreSQL 17.6 + pgcrypto 1.3. Never log test key bytes or raw signed assertions. Distinguish WebCrypto-only from Edge Function network integration.
2. **Auth boundary**: Exercise the actual Deno handler with a fake verified Supabase Auth service and a local DB seam: valid A/B tokens, invalid/expired/revoked token, stale Auth, missing Authorization, and malicious body principal/proof injection. This is **not** a real live Supabase Auth verification. A real provider authentication proof remains `NOT_OBSERVED` without separate staging-safe authorization. A malicious DB credential with no signing key must continue to fail raw access.
3. **Private DB contract r2**: Compare the new eight-table document to the real source and prove no changes to public browser API or six-table v1 historical spec. Confirm all three r2 signatures, verifier/purge owner-only and no backend table grants. Reject any source/schema deviation; do not modify accepted SQL unless PM authorizes a revised proof.
4. **Provisioning tabletop proof (NO real credentials)**: Produce an operator runbook for generating, transporting, activating, overlapping and retiring independent proof signing keys. Include separate signing-secret and DB-credential custody, safe rollback, incident response and `not_before`, clock skew and nonce-retention strategy. Test against only fake short-lived keys and a disposable local database. Do not place plaintext keys, MACs, tokens, connection strings or logs containing them in G:/GitHub.
5. **Rate-limit design/proof**: Present a centralized or distributed limiter/gateway contract for unauthenticated requests and separately for authenticated STATE reads/commands; no process-local counter as release guarantee. Include 429 semantics, nonces/day growth projection, pruning interval and concurrent limit tests against an offline/disposable limiter if practical. Do not silently introduce an external paid service or new database table on shared staging.
6. **Pooler feasibility**: Use existing Supabase docs and read-only project settings to document the exact prerequisites for authorized `ruins_backend` LOGIN and role lifecycle; do not test a live custom login unless credentials/role provisioning have been separately authorized. Do not read or copy any current password. Report `POOLER_CUSTOM_ROLE: CONDITIONAL` if still untested.
7. **Regression**: Run real disposable PG adversarial P01–P21/C01–C13; 001C, scanner, Friend, frozen and full suite. Compare same-machine baseline. Report any new failures; do not call a baseline failure new simply because another machine has a different count. Keep main and frozen refs untouched.

## Hard security rules

- Browser sends intent only; DB credential alone cannot select an arbitrary principal. Every database entry verifies short-lived, purpose/command-bound proof independently.
- Shared project `qpgwqmduqtqidmhbuclw` read-only only. No migration apply, no role creation or ALTER, no secret provisioning, no Edge deployment, no Supabase Auth setting edits, no new `public` tables/RPCs/GRANTs.
- Preserve 12 legacy SL-SIM client-denied tables, Friend live receiver flows, existing Daily Trial and local-only Gold/XP. No wallet ledger changes.
- Keep the current branch head and Owner C: checkout untouched; new branch only for actual bounded source fixes/additions. Save logs/reports to `G:\My Drive\Quick Dungeon\Owner Review\RUINS_DAILY_EXPEDITION_001C\OFFLINE_INTEGRATION_009\evidence\`, never synchronize an active `.git` directory through G:. Remove only task-owned disposable scratch files after evidence is durably saved and hashed.
- If local verification needs live DDL or production credentials, STOP and return BLOCKED/CONDITIONAL with a safer offline substitute. Do not broaden the work package.

## Return contract

`RUINS_DAILY_EXPEDITION_001C_OFFLINE_INTEGRATION_009: PASS | REVISE | BLOCKED` with sub-verdicts `DENO_EXECUTION`, `AUTH_SEAM`, `DB_CREDENTIAL_ONLY`, `PRIVATE_CONTRACT_R2`, `OPERATOR_KEYS`, `RATE_LIMIT`, `POOLER_CUSTOM_ROLE`, `STAGING_AUTH`, `SECURITY_ADVISOR` (last two must remain NOT_APPLICABLE/NOT_OBSERVED if no shared mutation). Return exact SHA, diff, tests, 8-table private matrix, hashes and G: evidence links. PM adjudicates before any authorization to move r2 draft into active migrations.
