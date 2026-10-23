# RUINS 001C — Proposed Owner Authorization, 011A Staging Database Foundation Only

**Prepared by:** Dev4 PM, 2026-10-23 SGT. **Current authorization:** `NOT_GRANTED`.  
**Decision requested from Owner after safety prerequisites:** approve or decline ONLY the exact bounded staging DB structural operation below. **Do not treat "proceed" on planning work as staging write approval.**

## 1. Proposed approval scope

| Field | Exact requested bound |
|---|---|
| Repository | `coachtomlim/ruins-api` |
| Candidate branch | `work/ruins-001c-integration-009-dev4-reconciled` |
| Audited HEAD | `f6ffc53ceb7e654515001abe194b9cb686af721a` (pin again immediately before execution) |
| Target | Supabase `Dungeon Runner S8B Staging` `qpgwqmduqtqidmhbuclw` ONLY |
| Migration file | `supabase/drafts/ruins_001c/20261022200000_ruins_001c_private_expedition_r2_principal_binding_DRAFT.sql` (copy exactly once into a controlled staging migration artifact ONLY if approved; no source edits without fresh hash/testing) |
| Pinned migration SHA-256 | `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57` |
| Primary structural actions | Create schema `ruins_private`; 2 NOLOGIN roles; 8 private tables; 12 private functions; RLS on all 8 with no browser policies; grants/revokes/default ACLs exactly as pinned SQL; 3 narrowly callable backend routines |
| Shared-object action | `GRANT USAGE ON SCHEMA extensions TO ruins_owner` (no pgcrypto update); `GRANT ruins_owner TO <migration-current_user> WITH INHERIT FALSE, SET TRUE` required to create owned objects; document the durable role-membership effect |
| No role secrets | Both new roles stay NOLOGIN; no `ALTER ROLE LOGIN`, passwords or connection strings |
| No key secrets | Key table created empty; no key import, no Vault writes, no key rotation/activation |
| No running service | No Edge Function deployment, no routes enabled, no distributed limiter, no Auth test users, no progress/claim calls |
| No unrelated mutations | No Friend, Daily Trial, SL-SIM, wallet, XP, main, frozen refs, GitHub merges or production |

## 2. Pre-approval STOP gates — must be evidenced before Owner authorizes execution

1. Confirm current provider dashboard Data API `Exposed schemas` excludes `ruins_private`, and check automatic table exposure. Do not modify global API settings as part of 011A. Retain proof screenshot/metadata without secret values.
2. Confirm current staging backup/restore capability, retention, latest recoverable baseline, rollback controller and restore procedure without exporting sensitive database records to G:/GitHub. If no credible restore exists, **HOLD**, not apply.
3. Confirm source commit and exact raw SQL SHA; repeat permissions/advisor pre-snapshot and show *all* new schema/role/default ACL/shared-grant effects to a second reviewer. No unknown DDL or out-of-scope GRANT.
4. Confirm staging change window with a designated sole executor, an independent reviewer and no simultaneous SL-SIM/Friend writes or migrations. If owners of the shared staging project cannot rule out collision, HOLD.
5. Confirm r2 draft is tested in disposable PG17.6 and only owner-approved modifications are possible. The 009 proof is acceptable unless the SQL changes.

## 3. Proposed executable sequence — only after fresh explicit Owner approval

1. Capture timestamped `BEFORE` evidence: target/ref/HEAD/hash, pg_extension/role/schema inventory, RLS/privilege matrix for the protected 12 legacy tables, Friend-function access posture and Security Advisor findings. Record current public Data API exposed schemas and backup status.
2. Using the authorized Supabase migration mechanism, apply the **single pinned r2 migration** exactly once. It is transactional with internal fail-closed checks and includes role and shared-extension-schema grants. Do not "fix" unexpected privilege errors by assigning `service_role`, superuser powers, `PUBLIC` grants, or another schema; STOP and request a revised design.
3. Immediately inspect `ruins_private`: 8 tables, RLS true, 0 policies, 0 keys, all required unique keys, 12 functions/3 expected SECURITY DEFINER entry routines, empty `search_path`, exact backend EXECUTE and zero backend/browser table rights. Confirm no roles have LOGIN.
4. Recheck legacy SL-SIM 12-table ACLs and Friend/Wallet/Daily Trial interfaces. Confirm Data API does not expose `ruins_private`; test denied direct-role access where supported without touching real users.
5. Run Security Advisor AFTER DDL and produce `SECURITY_ADVISOR: PASS | REVISE`, comparing before/after **individual findings** (not just totals). Any new CRITICAL/ERROR, privilege escalation, unexpected exposed routine, service-role grant or changed shared integration means **STOP, REVISE**.
6. Record migration applied status, migration SHA, role grants, `extensions` grant, membership footprint, before/after advisor, evidence hash index, and rollback readiness in G:. No 011B action from this approval.

## 4. Failure handling and restoration

- If migration fails before commit, expect transactional rollback but independently verify schema, roles and shared `extensions` ACL against the BEFORE baseline. If any residue exists, STOP and initiate authorized restoration, never ad-hoc DDL.
- If it commits but an authorization/ACL/advisor check fails, **do not enable any RUINS service or provision any key**. Preserve evidence; prepare a separate least-privilege compensating migration or approved restore. Do not casually DROP roles/tables if data or dependencies now exist.
- No `ruins_backend` LOGIN and zero signing keys means the private request path remains intentionally unusable after this stage. Treat this as an isolation control, not a failure to deploy.
- An unchanged baseline of INFO/WARN advisory findings does not equal zero risk; only a documented no-new-dangerous-finding and privilege-check gate can pass.

## 5. Explicit EXCLUSIONS / subsequent authorization

**011B is NOT approved by 011A:** operator login and password provisioning; independent HMAC signing-key custody/rotation; real `auth.getUser` with dedicated nonproduction accounts; rate-limiter provider and ingress config; latency and clock skew; nonce purge scheduler; Edge deployment; browser UI integration; any wallet or transferable XP; any production or public launch. The current full suite also has five pre-existing Windows/environment failures and is not globally clean.

A live gateway must separately address 429 compatibility and rate limits; `ssl:'require'` protects transport encryption but does not verify the server identity without CA/hostname configuration. Resolve or explicitly accept this security exposure before production.

## 6. Owner decision (not yet solicited as authorization)

Suggested narrow wording **only after all five pre-approval STOP gates have documented PASS**:

> I authorize **011A staging DB foundation only** on Supabase project `qpgwqmduqtqidmhbuclw`, using `coachtomlim/ruins-api` audited commit `f6ffc53ceb7e654515001abe194b9cb686af721a` and exact r2 migration SHA-256 `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57`, creating two NOLOGIN roles, eight empty private tables, twelve private functions and only the listed schema/role ACL changes. **No real credentials, key provisioning, Edge deployment, real accounts, public access, wallet writes or production.** Stop on any discrepancy and return evidence for adjudication.

**Prepared proposal only.** No approval has been issued or inferred in this conversation. Recommend **CONDITIONAL GO FOR 011A PREPARATION**, not permission to apply now. **Owner decision remains pending after backup and exposed-API gates.**
