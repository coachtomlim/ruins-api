# RUINS Daily Expedition 001C — Dev4 Independent Adjudication of Offline Integration 009

**Date:** 2026-10-23, Singapore.  
**Authority:** Dungeon Bravo Dev4 PM.  
**Disposition:** `RUINS_DAILY_EXPEDITION_001C_OFFLINE_INTEGRATION_009: PASS_WITH_STAGING_GATES`.  
**Staging migration/deployment:** `NOT_AUTHORIZED`; **production:** `NOT_AUTHORIZED`.

## Source, trace and reconciliation

- Codex's tested candidate: `coachtomlim/ruins-api`, `work/ruins-001c-offline-integration-009-codex` @ `70b7cd4fca084bd6611cefc210f623017cf395b7`.
- Original 009 governance branch @ `cb862ad9666b4f023b52aef3fdf0b859e314e04e` was separately created from accepted 008 @ `4039da028984bd155baf1c0c8b239d0a4c3116dd`.
- **Branch discrepancy independently detected:** Codex's candidate was based directly on 008, so it omitted four 009 governance files while implementing the two source changes. Comparison `cb862ad..70b7cd` was `ahead 1 / behind 1`; this was not simply a fast-forward of the 009 design branch.
- **Reconciled safely:** new `work/ruins-001c-integration-009-dev4-reconciled` @ `5ef0c9a05ee2d62821422acfaae51e6ad1f2c81f`, whose parent is Codex's tested `70b7cd4`. The single reconciler commit adds the four *exact Git blob* documents from `cb862ad`, and changes **zero runtime, test or migration source lines**. Original 008, 009 design and Codex branches remain intact. Reconciled code equivalence is demonstrated by the compare listing of only four `docs/ruins/` paths.
- Private r2 migration source remains `supabase/drafts/ruins_001c/20261022200000_ruins_001c_private_expedition_r2_principal_binding_DRAFT.sql`; canonical SHA-256 `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57`. It remains *outside* active `supabase/migrations/`.
- Machine-readable private contract r2: `docs/ruins/RUINS_DAILY_EXPEDITION_001C_PRIVATE_DB_CONTRACT_R2.json`, same exact Git blob as 009 design; eight private tables, three permitted backend routines, twelve signed fields.

## Scope of accepted PASS

Codex's report and associated receipts were read from the Google Drive `OFFLINE_INTEGRATION_009` evidence directory; source commit, parent, diff, feature branch and reconciled documentation were independently checked through GitHub. Dev4 did **not** personally rerun the Windows-local Deno/PG test harness; numerical execution results below remain Codex evidence supported by saved receipts.

| Gate | Codex execution evidence | Dev4 assessment |
|---|---|---|
| Deno 2.5.4 typecheck | PASS after resolving seven type-boundary errors | Accepted for offline typecheck only |
| Deno WebCrypto, fake Auth + disposable PG 17.6 | 12/12 | Accepted for fake-Auth/offline integration, not real Supabase Auth |
| P01–P21 and C01–C13 PG adversarial/security | 34/34 | Accepted as local proof of DB credential-alone boundary |
| Focused RUINS | 55/55 | PASS (executor record) |
| Scanner / Friend / frozen verifier | 5/5, 35/35, 7/7 | PASS (executor record) |
| Full repo suite (same machine) | 951 total / 944 pass / 5 fail / 2 skip | **Not a clean full-suite PASS**; identical five baseline failures; zero new |
| Centralized limiter offline model | 6/6 | Offline algorithm only; no deployed distributed provider |
| SQL changes | None | r2 SHA retained |

Code-specific changes relative to accepted 008: `handler.mjs` adds explicit type documentation for the Deno boundary; `index.ts` types JSON values and configures `postgres` with `max:1`, `prepare:false`, `ssl:'require'`. No live server or authenticated production traffic tested.

## Staging safety boundary and outstanding conditions

**NOT_OBSERVED / CONDITIONAL:** genuine Supabase `auth.getUser` with a staging test account, custom `ruins_backend` LOGIN through the actual pooler, separate operator key provisioning and rotation, host clock skew, provider-backed distributed rate limiting and nonce budget, the managed migration role's *actual execution* of the owner/role/shared-extension-grant steps, and Security Advisor after DDL.

Read-only Supabase inspection (2026-10-23) of project `qpgwqmduqtqidmhbuclw` corroborates: no `ruins_private` schema, no `ruins_owner`/`ruins_backend` roles, `postgres` has CREATEROLE, `pgcrypto` is installed in `extensions` with HMAC routines, and only the unrelated `sl-sim-seat-router` Edge Function exists. Security Advisor remains INFO 15 `rls_enabled_no_policy`; WARN 1 `function_search_path_mutable`, WARN 3 `anon_security_definer_function_executable`, WARN 17 `authenticated_security_definer_function_executable`, WARN 1 `auth_leaked_password_protection`; no new critical/error classification. SQL `current_setting('pgrst.db_schemas',true)` returned NULL, not proof of exact API configuration. Codex 007's earlier dashboard inspection reported exposed `graphql_public` and `public`, and automatic exposure of new tables; reconfirm before any DDL.

The r2 threat claim is **limited**: stolen DB credential *alone* without the separate signing key cannot authorize any expedition player. It does not protect against stolen signing key, compromised Edge runtime, Owner/superuser/backup key access, a valid user's Auth bearer credential, or malformed operator provisioning. Private owner-only key storage is not the same as external KMS/Vault protection. Read calls now write nonce records; release requires central limiter, nonce retention and incident/rollback policy.

## Decision

**Accept 009 OFFLINE integration as completed**, based on Codex execution receipts and direct GitHub review. The reconciled branch is the source-governance successor and can be used for later *read-only review* and offline planning. **Do not merge, deploy, move draft SQL into active migrations, create/login roles, provision keys, change Supabase settings, touch Friend/SL-SIM, or credit wallets** without a separate approved staging work package and post-DDL security controls.

Next: Dev4 drafts and verifies `001C_STAGING_READINESS_010` as a read-only authorization preflight and a least-privilege staging migration rehearsal plan. Owner approval is required only after the scope is explicitly prepared; no live staging changes are implicitly authorized by this 009 PASS.

Links:
- Codex 009 evidence: https://drive.google.com/file/d/15YsbPwoPz24hf1iU5cuJBKol9sdNHgb0/view
- Evidence index: https://drive.google.com/file/d/1JDGOXtJOLGVVFJi0vKqJT4ubK2zCn2Lw/view
- Source: https://github.com/coachtomlim/ruins-api/commit/70b7cd4fca084bd6611cefc210f623017cf395b7
- Reconciled governance: https://github.com/coachtomlim/ruins-api/commit/5ef0c9a05ee2d62821422acfaae51e6ad1f2c81f
