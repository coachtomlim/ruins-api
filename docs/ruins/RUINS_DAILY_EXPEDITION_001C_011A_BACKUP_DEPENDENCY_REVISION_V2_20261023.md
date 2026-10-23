# RUINS 001C — 011A backup dependency revision V2

**Disposition:** `011A_REVISE_HOLD` on 2026-10-23. No remote SQL/migration, role, credential or deployment authorized.

## Preconditions now required

1. **PRE-R2_REAL_BACKUP:** Owner-authorized 010B-1 real read-only backup, encrypted secure custody, successfully rehearsed disposable restore, object and privilege equality, row hash/count checks, and justified coverage exclusions. Current status **NOT DONE**.
2. **POST-R2_BACKUP:** Owner-scoped split dump of `ruins_private` plus standard schema-list-limited dump of all other current user schemas and Auth/Storage data; restore the `ruins_owner` role membership, `extensions` USAGE, default ACLs and migration-history coverage. S2FIX only proved this **synthetically**; operator path is not live-certified.
3. **BACKUP_CUSTODY:** no credentials/real dumps on G:/GitHub/chat; future `principal_proof_key` table contents are signing secrets.
4. **RECOVERY_LIMITS:** Storage file binaries, Vault, Edge Functions/secrets, project settings and Auth continuity require separate decisions. Do not call CLI logical restore a full platform restore.
5. **SOURCE & API:** preserve r2 draft SHA-256 `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57`; the only exposed schemas verified 010A are `graphql_public` and `public`; rerun ACL/Security Advisor before/after any future approved migration.
6. **EXPLICIT 011A OWNER AUTH:** even after backup success, exact project/ref, migration hash, change window, sole executor, independent reviewer and stop/rollback criteria need a *second* authorization. No automatic move into `supabase/migrations/`, no keys or backend login, no Edge deployment.

**Why revision is required:** real PG 17.6 synthetic S2 proved default Supabase CLI backups fail immediately after r2 because the dump role lacks private-schema USAGE. Broad grants are not allowed. S2FIX preserved 182/182 objects and 182/182 effective privileges with split owner-role dumps; 23/25 row hashes matched, the two exclusions being Vault and migration history. This is an offline recovery proof, not a live backup.

References: https://drive.google.com/file/d/1KpIJDIjOxuptekYp2OQEr5pppXDvvDzg/view and https://drive.google.com/file/d/1A5GI26QWXw6DKFQ1hq8GCKfUKIT-RO0c/view
