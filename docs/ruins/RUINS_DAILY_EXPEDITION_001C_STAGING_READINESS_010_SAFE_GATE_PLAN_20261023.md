# RUINS 001C — Staging Readiness 010: Read-only Gate Plan

**PM:** Dungeon Bravo Dev4. **Date:** 2026-10-23. **State:** `PRE-MIGRATION_READINESS: HOLD_FOR_AUTHORIZATION`.
**Technical base:** `work/ruins-001c-integration-009-dev4-reconciled` @ `5ef0c9a05ee2d62821422acfaae51e6ad1f2c81f`, functionally equivalent to tested Codex candidate `70b7cd4fca084bd6611cefc210f623017cf395b7`.
**Staging target, only if separately authorized:** `Dungeon Runner S8B Staging`, ref `qpgwqmduqtqidmhbuclw`. **No deployment/DDL, no real credentials, no role creation, no staging API writes are authorized by this document.**

## Current facts (verified read-only)

- `ruins_private` and `ruins_owner`/`ruins_backend` absent.
- `postgres` has `CREATEROLE`; this does **not** prove the complete planned `CREATE ROLE`, `GRANT ... WITH SET`, ownership, `SET ROLE`, `GRANT USAGE ON SCHEMA extensions` sequence will execute in managed staging.
- `pgcrypto` and `extensions.hmac(bytea,bytea,text)` available; extension grant is a **shared-object change** and needs a peer-reviewed grant diff.
- Current project data API is enabled, with 007's dashboard evidence listing exposed `graphql_public`, `public`; SQL `pgrst.db_schemas` NULL cannot independently verify current provider API settings. Recheck in UI before DDL.
- Only `sl-sim-seat-router` is deployed; `ruins-expedition` not deployed.
- Security Advisor baseline has no CRITICAL/ERROR; INFO/WARN entries are pre-existing and must not be waved away. Capture exact before/after findings and check for *new* issues.
- Offline Deno + fake Auth + PG proof is accepted; **live provider Auth and custom-role pooler login remain untested**.

## Hard authorization boundaries

A later staging package must have an Owner-approved statement identifying the exact staging project/ref, candidate SHA, migration draft SHA, files/roles/functions/tables to be added, key handling authorization, expected read/write testing and stop/rollback criteria. Current authorization: **none**. No production rollout ever follows automatically from staging success.

## Gate A — Dev4 read-only contract and change plan

1. Diff the r2 SQL against the original 006 draft. Verify eight private tables, all roles and default privileges, three callable DEFINER entry routines, fixed `search_path = ''`, and owner-only verifier/purge. Independently inspect any `PUBLIC`, `anon`, `authenticated`, `service_role` privileges and grant of `USAGE` on shared schema `extensions`. Confirm no touched SL-SIM/Friend/wallet objects.
2. Decide staging-only HMAC custody posture: the current owner-only private table is a **conditional staging option** with database-superuser/backup access; any Vault/KMS design is separate. Prepare two-person secret-generation/provisioning/rotation SOP without real values in chat, GitHub, G: or test output. Keep DB and signing credentials independently managed, with explicit expiry/rotation/revocation procedure.
3. Record project API exposed-schemas/auto-exposure state, backups, Auth test-identity plan and SQL role/grant permissions via read-only means. Never assume a config default.
4. Confirm whether `ruins_backend` can become an out-of-band login through the transaction pooler and whether connection `max:1`, `prepare:false`, `ssl:'require'` is appropriate. This requires an authorized future role/credential; pure read-only checks cannot prove a live login.
5. Define rate-limiter provider or an equivalent **shared atomic** admission layer (pre-auth network + post-auth per principal, separate STATE/command quotas). 429 semantic additions to the existing browser protocol require explicit compatibility decision; fake SQLite 6/6 is not a deployed limiter.
6. Define DB nonce cleanup schedule/monitoring and a measurable time-skew allowance for the Edge and PG hosts. Do not provision a scheduler or mutate the shared database in preflight.

## Gate B — Offline migration rehearsal (requires no staging DDL)

- Use fresh disposable PostgreSQL 17.6, pinned pgcrypto 1.3 and only fake keys/accounts. Reproduce all r2 SQL privileges, 34 adversarial P/C cases, Deno fake-Auth 12/12, Focused RUINS 55/55, scanner 5/5, Friend 35/35, frozen 7/7 and same-machine full-suite comparison.
- Simulate operator key provisioning/overlap/rotation, rollback under aborted commands, stale and reused assertions, malicious DB-only credential, database disconnection during claim, and schema-version mismatch. Do not claim a real Supabase role feasibility proof from local Postgres.
- Audit every artifact for credentials; output only fake fixture identifiers, hashes, count summaries and sanitized status.

## Gate C — Proposed separately authorized shared-staging package, *not executable now*

1. Capture source/migration hashes, approved Owner authorization, and Security Advisor BEFORE. Confirm existing public table grants/RLS and Friend token receiver unaffected.
2. Run **exactly one approved** migration on `qpgwqmduqtqidmhbuclw` in a controlled window, with backup/restore and fail-closed self-check. Review unexpected `CREATE ROLE`, shared-schema grants, default privileges, and any migration failure. No retry with broader grants.
3. Advisor AFTER must show no new ERROR/CRITICAL and no unapproved grant/RLS/SECURITY DEFINER expansion. Additional negative SQL/API tests: zero browser access; unrelated user isolation; SQL role privileges; direct credential-without-HMAC denial; key/helper privilege denial; idempotency/concurrency/rollback.
4. Under separate restricted operator authorization, activate a test-only database login and a distinct HMAC signing key through protected secret controls. Never use `postgres` or `service_role` for application requests, and never leak keys into repo or proof records. Test Auth with only dedicated staging test users. If pooler or secret lifecycle fails, **STOP**.
5. Only after an approved provider-backed shared limiter is installed, check real Edge Auth, rate limiting, latency, clock skew and nonce cleanup. Never enable real account reward credits: private staging XP/Gold only, no `public.wallet_ledger`/`runner_xp_event`.
6. Recheck Friend/SL-SIM and existing integrations. No public deployment or production promotion is implied by staging tests.

## Dispositions

- `READINESS_010: PASS` requires explicit verified artifacts for A and B; it **does not** authorize C.
- `READINESS_010: CONDITIONAL` if pooler/real Auth/limit provider only become verifiable after staging authorization. This is an expected honest finding, not permission to skip their gates.
- `READINESS_010: REVISE` if any role, identity, exposed-schema, key-custody, signing, limiter or rollback assumption is unsafe.
- `SECURITY_ADVISOR: NOT_APPLICABLE` while no DDL runs; never claim a post-migration PASS in a read-only plan.

## Next responsibility

Dev4 completes the Gate A read-only source/config review, records readiness and publishes a specifically scoped future authorization proposal. If another local harness is required, select **Claude** for one bounded offline-only package following Codex 009; never assign Claude/Codex concurrently to the same source branch. Owner is asked only for an explicit decision on staging mutation after the proposal includes exact safeguards. DOT visual review is not needed unless the user-facing UI changes.
