# RUINS 001C / 010B2 — Dev4 C2.5 Adjudication and Bounded C2.5R Repair

**Date:** 2026-10-24 SGT  
**Owner:** Dungeon Bravo Dev4, reviewer of DB Dev Work5 execution  
**Verdict:** `010B2_C2_5_PRELIVE_PACK: REVISE_ACCEPTED` (the REVISE result is accepted, not a PASS); `C2_5R: READY_FOR_FAKE_ONLY_WORK`; `C3_LIVE_EXPORT: HOLD`; `011A: HOLD`.  
**Operating constraints:** Supabase Free; no ASUS C/E/R or VeraCrypt work; no real staging connection, credentials, migrations, new paid cloud services, GitHub Actions, production or customer-data export. Work5 executes directly, Codex/Claude idle.

## Verified basis and independent findings

- Work5 branch `work/ruins-001c-010b2-c25-prelive-001` at `f508163655acdbb433bcd6b072bf697572602457` verified from GitHub; report at `docs/ruins/RUINS_010B2_C25_WORK5_RETURN_20261024.md`. Drive report `https://drive.google.com/file/d/1cd75JYKZVrxLcyO7XnV3mby1poS2qHnI/view`, folder `https://drive.google.com/drive/folders/1Epe8xGSpL4Big-wEKWgywj_iDMoQLnvA`.
- Independently reviewed `tools/ruins-010b2/c25/probe.py`, `stream.py`, `recover.py`, `restore.py`, and the source diagnostics. The 18-check fake-role diagnostic, streaming encryption, independently retrieved ciphertext, simulated separate key recovery, and 7-table/14-row disposable restore demonstrate genuine progress but **not** the complete pre-r2 capture/restore contract.
- Read-only live Supabase catalog check of `qpgwqmduqtqidmhbuclw` found 107 tables across `public`, three `sl_sim*` schemas, `auth`, `storage`, and `supabase_migrations`. The effective `postgres` role had SELECT for all 107; only 91 have MAINTAIN/UPDATE/DELETE/TRUNCATE, sufficient for an explicit SHARE lock. Specifically, `sl_sim_basic1_postpilot` has 12/12 SELECT but zero qualifying stronger privileges; `auth` is 26/27, `storage` is 5/8. **This is catalog evidence, not a live backup or even a proof of a live lock.**
- PostgreSQL 17's `LOCK TABLE SHARE` needs stronger privileges than SELECT, and it blocks writers. Do not grant new privileges merely for backup testing. `pg_dump --snapshot` imports the exported MVCC snapshot in synchronized pg_dump sessions; it does **not** make global roles, sequences or later-added relations transactional. A genuine no-writer/no-DDL/no-role-change window or equivalent externally governed fence is necessary if those exact invariants are required.
- Work5's pre-r2 fake data schemas were represented by one generic table each (7 tables / 14 rows). That is less representative than the already accepted 24-table C0–C2 proof, and does not prove actual managed Auth/Storage object definitions. Avoid claiming regression-complete acceptance.
- Restoring to a fresh **disposable PG17 with a privileged local bootstrap administrator** is a legitimate way to verify physical reconstructability; the target need not reproduce the source application's least-privilege credential. Preserve correct effective ACLs, ownership/RLS and negative tests, and separately declare that *managed Supabase target restoration and Auth continuity* are **not proven**.
- The second fake recovery key was held in ephemeral Work scratch. This is a synthetic cryptographic check, not production-grade Owner-controlled durable key custody. Real private-key custody remains a specific future Owner decision.
- Previous C0–C2 `CLOUD_SHELL_SYNTHETIC_PASS` remains accepted; no benefit in repeating its settled portions. Source baseline `d0d534a592dd5a3395f7dfee830d710e812e2a45` retained.

## Work5's next execution: precisely bounded C2.5R

### R1 — Replace the inappropriate table-wide SHARE-lock design

Use **no new grants** and do not call `LOCK TABLE ... SHARE` across managed schemas. Test `pg_export_snapshot` as keeper and `pg_dump --snapshot=<id>` for schema/data/migration-history export families under an explicitly SELECT-compatible non-superuser role. Preserve native ACCESS SHARE behavior of pg_dump. Include fake managed ownership / RLS / ACL constraints and all four application schema names. Test concurrent DML and DDL, added relation, sequence `nextval`, role/membership changes, keeper death and snapshot expiration. Distinguish properties actually protected by the snapshot from those needing a **manual change-freeze**. If no credible no-writer/no-DDL/role-change fence can be designed without touching live services, return `NEEDS_OWNER_MAINTENANCE_WINDOW_AUTH`; never elevate read permissions or claim a complete snapshot.

### R2 — Restorable, representative fixture

Bring the pre-r2 fixture to **at least the previously accepted 24-table richness**, including realistic fake Auth/Storage tables, project migration history, Friend/Daily Trial/SL-SIM tables and cross-relations, types, views, functions, policies, sequences, permissions/default ACLs and managed ownership. Use a **disposable local PostgreSQL 17 administrative bootstrap** to recreate provider-managed baseline objects. Verify all intended in-scope objects, roles/memberships, rows/hashes, sequence state and effective privileges. Prove clearly that *restore into an actual Supabase-managed target is a separate, unobserved requirement*, not a failure just because the disposable bootstrap admin was used.

### R3 — Fail-closed completion and durable-key-custody proposal

Implement a synthetic **idempotent capture state machine**: `STARTED` → `DUMPS_OK` → `ENCRYPTED` → `DRIVE_UPLOADED_VERIFIED` → `DRIVE_REDOWNLOADED_VERIFIED` → `RESTORE_VERIFIED`; no prior state permits a `PASS` or releases any plaintext. Test missing/empty/partial/aborted producer, Drive ambiguous/lost acknowledgement, stale artifact, duplicate retry, wrong key, wrong recipient, corrupted ciphertext, role/ACL drift and incomplete history. A lost Drive upload acknowledgement must be resolved by **list/checksum verification** or fail closed, not by blindly duplicating or treating as success. Use fake keys to rehearse loss of the capture environment and recovery using an independent synthetic copy. Produce a production key-custody **decision proposal** with separate Owner-managed copies; do not create/request/store live secrets.

### R4 — Acceptance and explicit limitations

Deliver a concrete **pre-r2** command manifest, evidence and hash inventory, true-to-scope negative tests, a tested restore procedure, the manual maintenance-freeze prerequisites, and an exclusion register for Storage binaries, Vault/root keys, managed-schema config, Auth continuity, Edge functions/secrets, Realtime, role passwords, project settings and migration history. Separate **database logical recovery** from entire-project disaster recovery. Do not present an owner authorization for C3 unless R1–R4 are demonstrably accepted and the planned live window/custody policy is reviewable.

**Stop early** with `C2_5R: REVISE/BLOCKED` if an essential feasibility issue cannot be closed in the synthetic environment; never consume iteration cycles reconstructing impossible guarantees. Do not overstate the 24-table fake fixture as a simulation of all 107 actual shared tables.

## Authority and handback

DB Dev Work5 performs source changes, fake-only tests, verification, GitHub commits and G: proof receipts **directly in its current Work thread**, saving checkpoints. Codex/Claude receive **no tasks** unless Work demonstrably lacks an execution capability. Owner action **none now**. Return `010B2_C2_5R_PRELIVE: PASS / REVISE / BLOCKED`, with exact newly closed gates and any needed separate maintenance-window/key-custody decision. **C3 and 011A remain HOLD.**

Reference: PostgreSQL 17 documentation `https://www.postgresql.org/docs/17/sql-lock.html`, `https://www.postgresql.org/docs/17/app-pgdump.html`, `https://www.postgresql.org/docs/17/functions-admin.html`.
