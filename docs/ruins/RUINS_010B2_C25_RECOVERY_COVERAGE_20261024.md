# C2.5 recovery coverage and decision register

This is a synthetic implementation checkpoint, not an Owner authorization proposal.
Decision: REVISE. Do not supply a live endpoint to these harnesses.

## What was implemented and run

The capture command family is PostgreSQL 17.6 pg_dumpall --roles-only --no-role-passwords; pg_dump -Fc --schema-only for public/sl_sim/sl_sim_basic1_hosted_poc/sl_sim_basic1_postpilot; pg_dump -Fc --data-only for those families plus auth/storage; pg_dump -Fc -n supabase_migrations for history. Schema/data/history share --snapshot from one open repeatable-read transaction. Roles do not share that snapshot. This is an explicit remaining consistency gap, not a claim of cross-file atomicity.

All members stream through gzip -n -c then age -r PUBLIC_RECIPIENT. bash -o pipefail checks the entire pipeline; rc71 injection removed its partial output. An encrypted manifest authenticates member byte lengths, hashes and expected inventory. Drive sees only age ciphertext members inside a tar/gzip. A separately recorded SHA-256 pins that outer object. Full authenticated Drive download and independent hash verification passed.

The role postgres has NOSUPERUSER CREATEDB CREATEROLE BYPASSRLS in these fixtures. Managed-like auth/storage owners have separate NOLOGIN roles. Explicit synthetic SELECT permissions enable capture but reject SHARE locks. These grants model a read baseline only; no grants are proposed for live backup convenience. Source setup is bootstrap-only and all databases have no network ports or network access.

## Consistency failure findings

Existing-table SHARE locks block UPDATE and ALTER and coexist with pg_dump's ACCESS SHARE lock. They do not block creation of a new table or nextval. Managed-owner tables reject the capture role's SHARE locks entirely. New-table and sequence drift were detected. No successful live freeze protocol is claimed. Pre/post catalog comparisons cannot prove absence of a change-and-revert (ABA) event. A live proposal must define and test independent writer/DDL/role administration fencing across every shared application, Auth/Storage service and scheduled job. Counts alone are unacceptable. Exported snapshot expiry was rejected.

The current capture bundle is labeled SYNTHETIC_ONLY, not COMPLETE or live-ready. Real interrupted process termination, timeout watchdog, upload lost-response reconciliation and ABA tests remain incomplete. There is no success-state API or COMPLETE promotion implemented, so absence of a marker in the diagnostic is not proof of an adequate production completion state machine.

## Key recovery and plaintext boundary

Pinned pyrage 1.3.0 generated a synthetic age identity outside the capture VM. Only its public recipient entered Cloud Shell. Original custody A was deleted; recovery B authenticated and decrypted the independently downloaded Drive object in memory. B shares the Work host failure domain with A and is temporary. It is NOT durable Owner-controlled key custody. Actual live proposal must pin an Owner public recipient and confirm an independently recoverable, tested private-key copy outside Drive, repository, chat and Cloud Shell without revealing it to the assistant.

Lost key: stop capture; do not claim existing archives recoverable without a tested remaining identity. Rotation: generate a new Owner recipient in the custody system, verify its fingerprint by a separate channel, prove decryption with the recovery copy, then authorize new capture. Keep prior recovery identities for retained old archives; rotating recipients does not retroactively reencrypt archives. Never publish private identities or live connection strings in logs, manifests, chat or code.

No plaintext database dump file was written by streaming capture or external decryption. Plaintext necessarily exists in DB buffers, PGDATA tmpfs, processes and OS pipes. No forensic secure-erasure or swap/core-dump exclusion was proven. The Python harness buffers tiny synthetic inventories/archive members and is not a live-size bounded implementation. `/dev/shm` in Cloud Shell is 64MiB; PGDATA tmpfs has 256MiB cap and source container has 384MiB RAM cap. Docker/container memory, host memory, core dumps and OOM/error handling need an explicit live containment review. Work scratch held ciphertext, source and a synthetic private key, never plaintext dumps.

## Recovery exclusions and disposition before live approval

| Item | Disposition |
|---|---|
| Four application schemas, data, functions, policies, defaults, grants, sequences | Required. Current seven-table records fixture is too small and generic for full acceptance; use realistic prior fixtures and independently inventory all object classes. |
| Custom roles and memberships | Required. Passwordless export passed; replay into a managed target and reconstruction from capture remain unproven. Never replay platform SUPERUSER definitions blindly. |
| Auth and Storage SQL rows | Required if present. Fake records rows captured; actual managed shape/version and restore grants remain unproven. |
| supabase_migrations | Required and captured under shared snapshot; realistic history shape and restore comparison remain required. |
| Storage object binaries | SQL metadata is insufficient. Separate binary backup/inventory evidence required; blocks full project recovery if referenced binaries exist. |
| Vault/encryption root key | Separate controlled root-key continuity required if used. Blocks decryptability if omitted. No root key or secret should enter chat/evidence. |
| Auth/JWT/session configuration and identity continuity | Separate platform configuration and validation required. Blocks claimed full platform/user continuity; database-only restore cannot promise working sessions. |
| Role passwords | Intentionally omitted. Approved reset/reprovision procedure and login verification required; blocks application connectivity until completed. |
| Managed auth/storage schema definitions and versions | Supplied by compatible managed target; version/definition compatibility must be established. Blocks restore until reconciled. |
| Edge functions and secrets | Separate source/deployment/secret custody evidence required if used; blocks corresponding functions. |
| Realtime/publications | Inventory and approved recreation/validation required if used. No continuity claim from current dump scope. |
| Project/API settings, extensions, hooks, webhooks, scheduled services | Separate configuration inventory and restoration evidence required if used. Blocks dependent application paths. |
| Post-r2 ruins_owner/private split recovery | Future separately gated S2FIX package. Current pre-r2 workflow must reject r2/private-schema presence without broad grants. The synthetic whole-dump denial was reproduced. |

No exclusion above has been silently accepted on the Owner's behalf. Until presence/absence and mitigations are established, the proposed result is a scoped database backup, not shared-staging disaster recovery. C3/011A remain HOLD.
