# RUINS Daily Expedition 001C — Dev4 adjudication of Principal Binding 008

Date: 2026-10-22 SGT. Authority: Dungeon Bravo Dev4 (PM/Development Lead).

Disposition: **001C/008 OFFLINE PRINCIPAL-CREDENTIAL THREAT: PASS**; **STAGING SECURITY: HOLD**; **SECURITY_ADVISOR: NOT_APPLICABLE** to 008 (no shared staging DDL).

## Source and independent observations

- Repo: `coachtomlim/ruins-api`, isolated branch `work/ruins-001c-principal-binding-008`, verified HEAD `4039da028984bd155baf1c0c8b239d0a4c3116dd`.
- Parent: unchanged `work/ruins-001c-offline-backend-proof-006` at `1d1a9fd6545543a56c0ffa28b5ef75fb592a2e3c`.
- GitHub compare: exactly 12 paths changed in one new commit. Historical 006 migration draft remains unmodified. New r2 draft: `supabase/drafts/ruins_001c/20261022200000_ruins_001c_private_expedition_r2_principal_binding_DRAFT.sql` with executor-reported canonical SHA-256 `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57`.
- G: evidence and report verified present: `Quick Dungeon/Owner Review/RUINS_DAILY_EXPEDITION_001C/PRINCIPAL_BINDING_008/`; link https://drive.google.com/drive/folders/1AzlMCWbm_Ezi4kM1S6elwqqKxeycszSI.
- Reviewed actual new signer, handler, candidate Edge entry, SQL proof-verification, access checks and Claude full report, not just return summary.
- Reported real PostgreSQL 17.6 adversarial checks: 34/34 PASS (21 retained + 13 new); mutation checks 4/4; 870 differential intents; focused RUINS 55/55, hygiene 5/5, Friend 35/35, frozen 7/7. Full suite 951 total: 945 pass, 4 pre-existing failed, 2 skipped, no new failures vs same-machine base. These are executor test receipts, **not a second independent rerun by Dev4**.

## Decision and exact assurance

A database-credential-only adversary lacking the independent HMAC signing key and a valid short-lived assertion cannot read, bootstrap or mutate another principal by passing an arbitrary UUID to one of the three `ruins_backend` entry routines. R2 verifies proof principal/purpose/exact command; expiry ≤30 seconds, allowed future skew 5 seconds, active key, HMAC-SHA256 and one-time nonce, in the same database transaction. The offline source and negative-test report support this narrow claim. It does not mean a compromised Edge runtime, HMAC key, user bearer token, database owner or superuser is safe.

R2 adds owner-only `principal_proof_key` and `principal_proof_nonce` (eight private tables total), two owner-only functions, three signature changes, and a `GRANT USAGE ON SCHEMA extensions TO ruins_owner`. GET is now VOLATILE and writes nonce audit state. Neither the unchanged public browser protocol nor transferable reward ledgers are altered. The six-table machine-readable 001C v1 private matrix is outdated and must be superseded by a distinct r2 private contract (not silently edited in place).

## Separate staging observations (read-only, 2026-10-22)

- Shared project `qpgwqmduqtqidmhbuclw` (Dungeon Runner S8B Staging), PostgreSQL 17.6. No `ruins_private` schema, `ruins_owner` or `ruins_backend` role currently exists.
- Managed `postgres` has CREATEROLE; **actual exact DDL/SET ROLE/grant feasibility is not proved** without an authorized migration attempt.
- Installed `pgcrypto` 1.3 in `extensions`, with `extensions.hmac(bytea,bytea,text)` present; managed `postgres` has USAGE and CREATE on the `extensions` schema. These do not prove an eventual `ruins_owner` role can be granted USAGE until authorized execution.
- Data API enabled and exposed schemas `graphql_public`, `public`, from Codex 007 dashboard read-only evidence; *not* `ruins_private`.
- Only unrelated `sl-sim-seat-router` Edge Function is deployed. No RUINS function.
- Security Advisor read-only baseline: 15 INFO RLS/no-policy, 1 WARN mutable search_path, 3 WARN anonymous definer RPC, 17 WARN authenticated definer RPC, 1 WARN leaked-password protection; no CRITICAL/ERROR. Warning groups are existing shared-project items; none is a post-008 migration finding.
- The 12 remediated legacy SL-SIM public tables remain out of scope and must remain client-denied.

## Risk register (held for 009/authorized staging)

1. **Deno and real Auth NOT OBSERVED:** `index.ts` was not typechecked or executed in Deno and `auth.getUser()` in the tests is a stub. Offline integration must prove equivalent signed proof bytes in Deno/WebCrypto and negative Auth failures; real Supabase Auth only via a separately authorized staging-safe path.
2. **Credential and role provisioning:** `ruins_backend` is NOLOGIN in the draft; an authorized LOGIN and session/transaction pooler plan are needed. Do not create roles/credentials merely to satisfy this preflight.
3. **Key custody:** currently HMAC key bytes in an owner-only private table and parallel Edge secret, neither created live. Provider superuser/backup access can read the DB copy. Specify dual-secret separation, operator rotations, no key echo in evidence, breach rollback/retirement, and how the owner can provision without exposing the key to the backend role.
4. **Rate limits and nonce writes:** GET now creates a nonce row. Each authenticated request creates transactional write load; Edge in-memory rate limiting is not an adequate distributed guarantee. Need gateway/distributed limit, timeout and retention budget before deployment.
5. **Clock skew:** compare Edge and database clocks in a separate permitted integration proof, with a 30-second proof and 5-second future skew bound. No live clock-skew measurement yet.
6. **Shared `extensions` USAGE grant:** review and test only the new role's USAGE, not broad `PUBLIC` privileges or pgcrypto relocation.
7. **Security semantics:** rejected requests after nonce consumption roll back nonce (as designed); a stolen proof alone is a bounded bearer capability. Preserve exact claim idempotency and no transfer to `public.wallet_ledger`/`runner_xp_event`.

## Governance

No migration moved into `supabase/migrations/`, no shared staging/production DDL, no provider keys, secrets or credentials read, created or configured, no Edge deploy, no Friend, Daily Trial, SL-SIM, main or frozen changes. Do not approve staging from this adjudication. Next: 009 offline Deno/contract/key-operator feasibility proof, with one local executor selected; then independent PM review. Deployment/migration requires a new explicit authorization.
