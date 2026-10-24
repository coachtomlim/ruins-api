# C2.5R pre-r2 command manifest and coverage

Synthetic logical-database recovery rehearsal. Not an execution authorization for live Supabase and not whole-project disaster recovery.

## Tool/source pins and commands

PG clients/server 17.6, official image postgres@sha256:00bc86618629af00d2937fdc5a5d63db3ff8450acf52f0636ec813c7f4902929. age 1.1.1 in Cloud Shell; pyrage 1.3.0 only in Work external synthetic recovery context. The capture code accepts no remote endpoint or real credentials.

Keeper SQL, as SELECT-compatible nonsuperuser postgres:

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT pg_export_snapshot();
-- Keep this exact session alive until every synchronized dump finishes.
```

The harness supplies local Docker connection context, never a staging endpoint. The prospective command family, with environment-specific connection handling still requiring separate authorization, is:

```sh
pg_dumpall -U postgres --roles-only --no-role-passwords
pg_dump -U postgres -d postgres -Fc --snapshot="$SNAPSHOT" --schema-only \
  -n public -n sl_sim -n sl_sim_basic1_hosted_poc -n sl_sim_basic1_postpilot
pg_dump -U postgres -d postgres -Fc --snapshot="$SNAPSHOT" --data-only \
  -n public -n sl_sim -n sl_sim_basic1_hosted_poc -n sl_sim_basic1_postpilot -n auth -n storage
pg_dump -U postgres -d postgres -Fc --snapshot="$SNAPSHOT" -n supabase_migrations
```

Roles require the manual freeze and are not covered by pg_dump --snapshot. Sequence values and later-added relation/catalog changes also require the freeze. No explicit SHARE locks are used. No grant-broadening operation is part of capture. Source version, recipient, fixture/schema scope, run identity and freeze attestation are pinned before STARTED. The source preflight rejects ruins_private; the negative fixture confirms the private-owner whole dump still fails without grants.

The synthetic harness validates custom archive headers/TOCs and producer status, uses bounded small fake outputs in Python memory, then gzip/age pipes into ciphertext members. It encrypts a manifest containing member hashes and inventory, then packs only ciphertext members into the outer artifact. No plaintext SQL dump file is created. This is memory-buffered synthetic code, not an unbounded streaming live-backup service. The state machine enforces stage order and artifact lineage, and no pre-restore state permits PASS.

## Restoring the disposable fixture

1. Verify outer artifact against independent pre-upload size/SHA-256. Reconcile ambiguous upload by unique-name listing plus downloaded checksum or fail closed. A second independent Drive download supplies the recovery input.
2. After capture environment loss, independent synthetic key B decrypts and validates all members in Work memory. For private-key containment, it reencrypts a validated recovery envelope to the NEW restore VM's public recipient; original private identity never enters either Cloud Shell VM. Every relay member retains original authenticated hashes and original artifact lineage.
3. Start a fresh PG17.6 disposable target with bootstrap administrator. Recreate captured roles/memberships (skip only CREATE ROLE bootstrap, which initdb already supplied), then restore the source-pinned fake managed baseline. This is allowed target administration, not source-credential elevation.
4. Restore application schema pre-data, history pre-data, application/managed data, history data, then post-data sections. --exit-on-error and --single-transaction apply per command. A target is disposable on any failure; separate section transactions do not imply an atomic managed-platform restore.
5. Independently compare schema/object ownership, relation/column attributes, constraints, indexes, RLS policies, views, functions, enum values, default ACLs, roles/memberships, all table row counts/hashes, actual sequence state and history. Re-run effective role tests and constraint tests. Deliberate ACL/role/history tampering must be detected. Compare the original inventory hash with the journal before RESTORE_VERIFIED.

The 32-table fixture has five public Friend/Daily Trial/reward tables; twelve sl_sim tables; three hosted-poc tables; four postpilot tables; four Auth tables; three Storage tables; one project migration-history table. It contains 35 fake rows. It does not impersonate all 107 shared live tables. SQL baseline is a representative fake, not a dump of managed Supabase definitions.

## Scope/exclusion register

| Recovery item | Disposition before live work |
|---|---|
| Four application schema families, custom objects, data, ACLs/RLS, sequences | In-scope logical recovery. Inventory exact real scope only under separate authority; fixture is representative. |
| Roles/memberships | In-scope passwordless export; global freeze needed. Managed-target reconciliation remains separate. Never blindly replay privileged platform roles into Supabase. |
| Auth/Storage row data | In-scope sensitive SQL data; fake shapes tested. Actual managed definitions/versions/configuration must be reconciled separately. |
| Project migration history | Required, in-scope separate snapshot-linked dump with independent row/hash comparison. Missing/incomplete history blocks PASS. |
| Storage binaries | Not contained in SQL metadata. Separate object inventory/binary backup is required if used; blocks whole-project recovery otherwise. |
| Vault/root encryption keys | Separate protected custody/continuity decision if used; absent keys can block decryptability. Do not export keys to evidence. |
| Auth/JWT/session config and user continuity | Managed-target and application validation required. No working-login/session continuity claim follows from fake SQL restoration. |
| Managed schema versions/definitions/config | Target prerequisites, not restored by application schema dumps. Fake baseline is supplied only for disposable tests. |
| Role passwords | Deliberately excluded; approved reset/provisioning and connection checks required. |
| Edge functions and secrets | Separate source/deployment and secret-custody evidence if used. |
| Realtime/publications | Separate inventory/recreation and subscription tests if used. |
| Project/API settings, extensions, webhooks, scheduled integrations | Separate configuration inventory and recovery procedure if used. |
| Post-r2 ruins_owner split recovery | Future gated S2FIX package; current process must not run against post-r2. |

No exclusions are silently accepted for whole-project recovery. Presence/absence and recovery treatments must be reviewed before a real proposal; each dependency can block its associated service even when a logical database archive restores successfully.

## Reference basis

PostgreSQL 17 pg_dump and snapshot synchronization documentation:
https://www.postgresql.org/docs/17/app-pgdump.html
https://www.postgresql.org/docs/17/functions-admin.html
Dev4 governance 394b46d487ea1ec1cfaaaebc3ae6c055f7d6c524 supplies the read-only live catalog findings; Work5 made no real Supabase connection.
