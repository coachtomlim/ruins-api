# RUINS Daily Expedition 001C: Explicit Staging Access Matrix V1

**State:** DESIGN ONLY. For every new schema/table/routine, grant and RLS posture must be implemented in the *same authorized DDL migration*. No migration has been approved or run. 2026-10-22 read-only basis: Supabase staging `qpgwqmduqtqidmhbuclw`, Postgres 17.6; `ruins_private` absent; existing S8B `public` account and ledger present. `pgrst.db_schemas` is not readable in this SQL session; verify project Data API settings before DDL. `public` must be presumed exposed.

## Role terms

- `anon`: anonymous browser/Data API (NO direct RUINS authority).
- `authenticated`: signed-in browser/Data API (NO direct RUINS authority; token forwarded to trusted handler).
- `ruins_backend`: **proposed dedicated Postgres connection role**, minimum USAGE on non-exposed schema and EXECUTE only on explicitly named internal routines; actual feasibility to verify. Must not have LOGIN bypass RLS outside intended schema, broad access to `public`/SL-SIM, or `CREATE` on exposed schemas.
- `ruins_owner`: **proposed no-login owner** of private tables/routines; tightly controlled role lifecycle; SECURITY DEFINER justified only for internal routines. Do not assume provider implements these names or capabilities; migration executor must validate.
- `service_role`: existing Supabase high-privilege key/role. Do not use as browser key or default RUINS runtime role. Existing unrelated privilege is preserved, never advertised as least privilege.

## Tables and direct rights

| Object (proposed `ruins_private`) | Category | anon SELECT/DML | authenticated SELECT/DML | backend SELECT/DML | Backend function access | RLS | Safe outward projection |
|---|---|---|---|---|---|---|---|
| `expedition_entitlement` | SERVER-ONLY | NO/NO | NO/NO | preferably NO/NO | narrow private bootstrap/lookup | ON, no browser policies | own entitlement exists + version |
| `expedition_instance` | RPC-MEDIATED | NO/NO | NO/NO | preferably NO/NO | own state + command routine | ON | own day/room/public HP/checkpoint/revision |
| `expedition_claim` | SERVER-ONLY | NO/NO | NO/NO | preferably NO/NO | command routine only | ON | own claim status + public award, no secret roll |
| `expedition_operation` | SERVER-ONLY | NO/NO | NO/NO | preferably NO/NO | command receipt lookup/commit | ON | own result by operation ID, no others |
| `expedition_inventory_event` | RPC-MEDIATED | NO/NO | NO/NO | preferably NO/NO | command routine only | ON | own valid equipment/inventory summary |
| `expedition_day_settlement` | SERVER-ONLY | NO/NO | NO/NO | preferably NO/NO | command routine only | ON | own settled day + next unavailable |
| Static public room names/art/credits | CATALOG/PUBLIC-READ | static files, not new DB | static files, not new DB | n/a | none | n/a | approved immutable content manifest only |

**Explicit permissions in first DDL:** create schema, revoke `USAGE/CREATE` from `PUBLIC`, `anon`, `authenticated`; revoke ALL on each new table and sequence from browser roles and PUBLIC; enable RLS on private tables, create **no blanket browser-access policies**; grant named private routine EXECUTE to backend only after revoking inherited PUBLIC EXECUTE. Review ALTER DEFAULT PRIVILEGES for future private tables/functions/sequences. All privileges/owners/routine execution are reviewed with `has_*_privilege`, `pg_proc`, `pg_roles`, `pg_policy` and dynamic negative tests. A private-schema wall is primary; RLS and narrow GRANTs are defense in depth.

**Same-migration decision rule for any `public` additions:** none planned. If executor proposes a `public` projection/RPC/table, STOP and return `ACCESS_DESIGN_REVISION_REQUIRED` before coding. Classify CLIENT-DIRECT / SERVER-ONLY / RPC-MEDIATED / CATALOG/PUBLIC-READ and specify RLS, per-role SELECT/INSERT/UPDATE/DELETE/EXECUTE, ownership checks and sensitive outputs in that migration. Do not add `public` RLS policies to legacy SL-SIM tables.

## Internal routines (not Data API RPC)

| Routine intent | Exposure | Auth / input | Required security properties |
|---|---|---|---|
| `ruins_private.bootstrap_account_expedition` | dedicated backend role ONLY | server-verified account UUID, scope, content manifest, operation ID | UNIQUE entitlement/scope; immutable pins; single row lock; safe output |
| `ruins_private.get_account_expedition` | backend ONLY | server-verified account UUID | ownership check; sanitized projection; no mutation |
| `ruins_private.apply_account_expedition_command` | backend ONLY | server-verified account UUID + validated command | row locks, request hash, stable claim source, atomic effects + receipt |

Decide whether routine must be SECURITY DEFINER and **why**. Prefer SECURITY INVOKER with only the necessary table grants if it can preserve the boundary. If using SECURITY DEFINER, owner must not be a broadly callable privileged endpoint, routine remains non-exposed, EXECUTE narrowly granted, `SET search_path = ''`, all names schema-qualified, dynamic SQL/argument injection avoided, table ownership scopes checked internally. SQL function grants to PUBLIC are a default hazard. Function semantics and ownership authorization are as important as schema location.

## Caller boundary and trust

Browser sends a user JWT and an idempotent command to a trusted Edge Function. Edge function verifies token against Supabase Auth and never accepts an arbitrary account UUID or reward quantity. It maps the Auth-subject ID to the transaction caller. Direct Postgres connection/secret is held in the function environment and scoped to private internal routines. CORS restricts origins but is not authorization. No secret/DB connection string ever appears in browser build; audit build artifacts and logs.

### Cross-project boundaries

- `public.games`, `class_sessions`, `rooms`, `role_seats`, `network_tests`, `role_sessions`, `events`, `deliveries`, `control_state`, `branch_state`, `turn_states`, `control_snapshots`: legacy SL-SIM, RLS ON and no anon/authenticated CRUD, strictly no mutation.
- `public.daily_trial_*`, Friend `public.builder_challenge*`, their RPCs, wallet `public.wallet_ledger`, XP/progression: excluded from RUINS 001C implementation. Existing privilege models must not be weakened.
- Staging is a shared project. Any new advisor CRITICAL or ERROR following DDL blocks advancement even if a different workstream owns it; report the delta and ownership without improvised cross-project fixes.

## Required security review receipt (after future authorized DDL)

`SECURITY_ADVISOR: PASS | REVISE` plus exact project ref, migration name/hash and applied status, exposed-schema dashboard check, inventory of new objects, table RLS, policies, grants, sequences, routine owners/definer/search_path/EXECUTE, negative anon/auth/other-user tests, backend success tests, ID replay/claim concurrency tests, unchanged Friend/SL-SIM permissions and Security Advisor before/after classes. Any new CRITICAL/ERROR or failed privilege test: STOP, no promotion. Existing INFO-only no-policy notices on intentionally client-denied tables are not automatically a vulnerability.

Useful current documentation: https://supabase.com/docs/guides/database/secure-data ; https://supabase.com/docs/guides/api/using-custom-schemas ; https://supabase.com/docs/guides/functions/connect-to-postgres ; https://supabase.com/docs/guides/functions/auth-headers .
