# RUINS 001C / 010B — Dev4 independent recovery adjudication

**2026-10-23 SGT · Disposition:** `010B_OFFLINE_RECOVERY: PASS_WITH_FINDING`; `011A_STAGING_DB: REVISE/HOLD`; `LIVE_BACKUP_RESTORE: NOT_PROVEN`.

**Source authority:** `coachtomlim/ruins-api`, branch `work/ruins-001c-staging-readiness-010-dev4` at parent `abe36d5ff3018dec7a137e4b384458e9d7fa0971`. Accepted r2 migration SHA-256 `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57`. Shared staging target: `qpgwqmduqtqidmhbuclw` (Free organisation). No staging mutations or real data exports performed.

## Verified machine-readable synthetic receipts

| Case | Finding | Status |
|---|---|---|
| S1 pre-r2 | Synthetic Supabase CLI dump restored 96/96 objects; 54/54 effective privileges; 15/17 row hashes match, excluding Vault and migration history | PASS_OFFLINE, **not** full Supabase restore |
| S2 post-r2 standard CLI | Role dump succeeded; schema and data dumps exited 1 because `postgres` could not `LOCK TABLE` in `ruins_private`; restore correctly not attempted | REVISE |
| S2FIX post-r2 split dump | Owner-scoped private dump plus public/application dump and omitted grants restored 182/182 objects, 182/182 privileges, 23/25 row hashes; restored principal-proof call worked | PASS_OFFLINE only |

Dev4 directly reviewed the full Claude report and S1/S2/S2FIX JSON receipts and verified their Google Drive availability. Dev4 did not personally rerun PG 17.6 on Windows. Original 010B source at parent SHA was verified from GitHub. Claude used CLI 2.121.0 dry-run scripts (native Windows required documented spelling/quoting corrections); disposable PG 17.6 and synthetic data only; no Docker or live staging connection. Twelve Claude files were G:-hash-read-back and cloud results are retrievable.

## Critical security conclusion

r2 deliberately creates `ruins_owner` as a separate, non-inherited private-schema owner; `postgres` can `SET ROLE ruins_owner` but does not inherit schema USAGE. The stock CLI's whole-project schema/data export fails **for all user schemas** after r2. **Never weaken the private schema wall or grant browser/backend roles access to fix backups.** Approve a reviewed split-backup runbook instead.

S2FIX requires: explicitly include **all actual** user schemas (`public`, `sl_sim`, `sl_sim_basic1_hosted_poc`, `sl_sim_basic1_postpilot`, etc.) while excluding `ruins_private` from normal dumps; separately dump private schema and data with owner authority; restore the CLI-omitted role membership, `extensions` USAGE, schema ownership and global default privileges. A separate migration-history export remains necessary. After future key provisioning, the private data dump contains HMAC signing key material and must be treated as a highly privileged signing-key backup.

Fail closed on every nonzero dump exit, zero/unexpected bytes, missing object, ACL/RLS or row mismatch, failed verification, or unknown include/exclude scope. A restore exit 0 on an empty dump is **not proof**.

## Current recovery limitation

The Supabase Free project has no managed backups/PITR or provider restore checkpoints. A standard CLI logical export excludes or does not fully recover: Storage file binaries, Vault secrets/root key, certain managed schema definitions, role passwords, migration history (unless separately exported), Realtime publications, Edge Functions and secrets, provider settings and Auth runtime login semantics. Sensitive Auth hashes and private player data in exported rows **must never be put in G:, GitHub or chat**. Restoration of synthetic Auth rows is not live Auth continuity.

**Disposition:** Accept synthetic 010B; revise 011A; prepare `010B-1` as a separate read-only, human-operated backup + disposable local restore permission. Only then return to 011A; **do not infer Owner authorization**.

## Evidence links

- Report: https://drive.google.com/file/d/1KpIJDIjOxuptekYp2OQEr5pppXDvvDzg/view
- S1: https://drive.google.com/file/d/1HHS53BcQJCB_2tHqWqdEZblQbVNRjeMU/view
- S2: https://drive.google.com/file/d/1A9H3hcX2tRk1QQb1sMuSjmaalWK7V9ca/view
- S2FIX: https://drive.google.com/file/d/1A5GI26QWXw6DKFQ1hq8GCKfUKIT-RO0c/view
