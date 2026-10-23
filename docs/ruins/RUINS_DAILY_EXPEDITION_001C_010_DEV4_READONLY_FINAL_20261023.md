# RUINS Daily Expedition 001C — Dev4 Staging Readiness 010, Final Read-only Assessment

**As of:** 2026-10-23 SGT. **Authority:** Dungeon Bravo Dev4 PM.  
**Verdict:** `READINESS_010: CONDITIONAL / GATE_A_SOURCE_AND_LIVE_ACL_REVIEW_PASS / GATE_B_OFFLINE_009_PASS / GATE_C_NOT_AUTHORIZED`.  
**Source of truth:** `coachtomlim/ruins-api` branch `work/ruins-001c-integration-009-dev4-reconciled`, reviewed HEAD `f6ffc53ceb7e654515001abe194b9cb686af721a`.  
**Live project, READ ONLY:** `Dungeon Runner S8B Staging`, Supabase ref `qpgwqmduqtqidmhbuclw` (`ap-southeast-1`, PostgreSQL 17.6).  
**Production:** NOT AUTHORIZED. **Shared staging DDL, role changes, secrets, Edge deployment, account/wallet mutation:** NONE performed by Dev4.

## Decision

Dev4 accepts the 009 offline proof for its stated scope: Deno 2.5.4 typecheck, 12/12 fake-Auth/Deno/disposable-Postgres integration, 34/34 PostgreSQL adversarial tests, 55/55 focused RUINS, 5/5 hygiene, 35/35 Friend, 7/7 frozen, 6/6 disposable limiter model; full suite 944 pass/5 baseline failures/2 skipped, zero new failure titles. These counts are from Codex's linked evidence, not an independent rerun of the local harness by Dev4.

This review does not promote a fake-Auth proof into live Supabase Auth acceptance and does not treat local PostgreSQL role provisioning as proof the managed pooler works. The pre-migration read-only checks below were repeated by Dev4.

## Verified live staging preconditions (Dev4, 2026-10-23)

| Precondition | Direct observation | Interpretation |
|---|---|---|
| Project | `ACTIVE_HEALTHY`, `qpgwqmduqtqidmhbuclw`, PostgreSQL 17.6 | Correct targeted *staging* environment; not a deployment approval |
| Existing RUINS | `ruins_private` count 0; `ruins_owner`/`ruins_backend` count 0 | No private schema or roles installed |
| Managed role | `postgres` has CREATEROLE | Supports planned role creation in principle, but the entire managed role/SET sequence is not proven |
| Shared crypto schema | `extensions` owned by `postgres`; `postgres` has USAGE/CREATE with grant option | The exact contemplated USAGE grant appears permitted; not tested by changing it |
| Crypto functions | `pgcrypto` installed in `extensions`, HMAC overloads present | Source prerequisite exists |
| Protected SL-SIM | 12 named `public` tables RLS on; `anon` and `authenticated` SELECT, INSERT, UPDATE, DELETE false for all 12 | Previous security remediation remains intact |
| Edge Functions | Only unrelated `sl-sim-seat-router` v4 active; no `ruins-expedition` | No RUINS deployment |
| Data API | Prior Codex 007 dashboard read: enabled; exposed `graphql_public`, `public`; auto-expose new tables enabled | Must recheck immediately before DDL; `pgrst.db_schemas` SQL setting is NULL and cannot verify the project-level config |
| Security Advisor | 15 INFO (`rls_enabled_no_policy`); 1 WARN (`function_search_path_mutable`); 3 WARN anonymous definer executable; 17 WARN authenticated definer executable; 1 WARN leaked-password protection. No ERROR/CRITICAL | **37** baseline security findings across 5 classes, not an advisor PASS after migration |
| Performance Advisor | 6 INFO unindexed foreign keys; 10 INFO unused index | **16** baseline performance findings across 2 classes; not a new 001C finding |

**Coverage qualification:** These are catalog/ACL and advisor reads, not a penetrative security audit, staged migration execution, recovery drill, test-account login, paid-capacity review, or backup verification. The PostgreSQL SQL user has no reliable `pgrst.db_schemas` session setting. The exact exposed-schema dashboard evidence comes from Codex 007, not Dev4's current read-only SQL call.

## Source-bound migration inventory

- r2 source draft stays outside active migrations: `supabase/drafts/ruins_001c/20261022200000_ruins_001c_private_expedition_r2_principal_binding_DRAFT.sql`; **canonical SHA-256** `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57`; Git blob `5799d0548339d3ceb012a2d72f463f445949437f`.
- `CREATE ROLE ruins_owner NOLOGIN` and `ruins_backend NOLOGIN`; no login/password provisioning. The draft includes a **persistent membership grant** `GRANT ruins_owner TO <migration executor> WITH INHERIT FALSE, SET TRUE`, constructed with SQL `format(..., current_user)` for the managed executor. This is a cluster role-membership alteration and needs explicit review.
- `GRANT USAGE ON SCHEMA extensions TO ruins_owner` is a **shared-schema ACL alteration**, distinct from a private-schema-only change. No extension installation/modification is proposed. Source uses `extensions.hmac`.
- `CREATE SCHEMA ruins_private AUTHORIZATION ruins_owner`; eight tables: `expedition_entitlement`, `expedition_instance`, `expedition_operation`, `expedition_claim`, `expedition_inventory_event`, `expedition_day_settlement`, `principal_proof_key`, `principal_proof_nonce`.
- Eight RLS-enabled tables with **zero policies** and no browser role or backend direct table rights. No sequences. No public tables, wallet, XP, Daily Trial, Friend or SL-SIM objects are added/updated.
- Twelve private functions; **three** SECURITY DEFINER entry routines executable by `ruins_backend` only: `bootstrap_account_expedition(uuid,jsonb,jsonb)`, `get_account_expedition(uuid,jsonb)`, `apply_account_expedition_command(uuid,jsonb,jsonb)`. Nine helpers including `verify_principal_proof` and nonce purge are owner-only; all pin `search_path=''`, no dynamic SQL. Privileges are fail-closed checked by migration.
- New owner-only HMAC key table has **zero key rows after migration** by enforced self-check. A separate authorization is required to provision any key.
- `ruins_backend` is deliberately **NOLOGIN**: simply applying this database migration does not create a usable application database credential or allow the Edge function to connect. That is desirable in the first controlled phase.
- The current Edge candidate source has `max:1, prepare:false, ssl:'require'`; it is a conditional source candidate and not a deployment. Supabase docs note SSL `require` encrypts but does **not** verify server identity; require a verified-CA/hostname TLS strategy before release or accept the residual risk explicitly for staging.

## 010 gate status and staging policy

| Gate | Status | Required treatment |
|---|---|---|
| A1 Source inventory and additive DDL scope | PASS, source-only | Keep r2 SHA pinned; any text change creates a NEW verification candidate |
| A2 Catalog/role baseline | PASS, read-only | Record fresh before/after at change window |
| A3 Exposed API configuration | CONDITIONAL | Recheck provider setting on day of DDL; never add `ruins_private` to exposed schemas |
| A4 Managed migration permissions | CONDITIONAL | Dry-run only in disposable Postgres proved; real `CREATE ROLE`/`GRANT ... WITH SET`/`SET ROLE` sequence is unproven |
| A5 Backups and restore | NOT OBSERVED | Require an operator-confirmed restorable checkpoint, tested procedure and retention before write authorization |
| A6 Signing-key custody | CONDITIONAL | Owner-only DB table is accepted for isolated staging TEST ONLY, not approved for production. Superuser/backups can access keys. No key in first DDL phase |
| A7 Custom pooler login | NOT OBSERVED | Defer login, password and connectivity to separately approved phase |
| A8 Real `auth.getUser` | NOT OBSERVED | Defer to isolated provider Auth phase; fake-Auth proof does not satisfy |
| A9 Shared atomic limiter | CONDITIONAL | Provider unselected; current 6/6 SQLite test proves only model; no exposed authenticated runtime before this is resolved |
| A10 Clock/nonce operation | CONDITIONAL | 30-second proof max TTL and +5 s issued-at skew require measured real hosts; operator-only purge scheduled only after later approval |
| B Offline full security rehearsal | PASS_WITH_BOUNDARIES | 009 disposable PG tests 34/34 and Deno/fake Auth 12/12; baseline full-suite 5 failures, zero new; no live system is certified |
| C Live staging apply and provider-backed checks | NOT AUTHORIZED | **STOP** until written owner authorization with explicit scope and safeguards |

## Two-phase staging principle

**Phase 011A, DB-only proposal:** one approved transactional additive r2 DDL in the named staging project, NOLOGIN roles only, eight empty private tables and twelve private functions, grants exactly as source, one shared `extensions` USAGE grant, no secret or Edge deployment. Immediately run Security Advisor and read-only ACL/privilege verification. No test account progression is possible without separately provisioned signing keys and a dedicated login. Abort/hold if the source hash, exposed-schema config, backup/restore readiness or grant diff differs.

**Phase 011B, separately approved later:** controlled login/secret ceremony, independently held HMAC key, genuine test-only Supabase Auth, trusted Edge entry, distributed rate-limiter service, clock-skew/nonce cleanup and admission-path proof. No real wallet writes. No public traffic until this phase succeeds. **Phase 011A approval never implies 011B approval.**

## External documentation consulted

- Supabase current connection guide: https://supabase.com/docs/guides/database/connecting-to-postgres (edge/serverless transaction pooling, `max:1`, `prepare:false`, `ssl:'require'`; `require` does not authenticate server certificate).
- Supabase JWT documentation: https://supabase.com/docs/guides/auth/jwts (user JWT verification semantics).
- Supabase Edge/Auth references: https://supabase.com/docs/guides/functions/auth-headers ; https://supabase.com/docs/guides/functions/secrets ; https://supabase.com/docs/guides/api/securing-your-api .

**Final 010 decision:** `CONDITIONAL`; **no staging or production changes performed**. Owner approval is required only for a narrowly specified later database-only phase, *after* pre-approval backup and exposed-schema checks are satisfied. Do not claim migration-ready without those operator-confirmed gates.
