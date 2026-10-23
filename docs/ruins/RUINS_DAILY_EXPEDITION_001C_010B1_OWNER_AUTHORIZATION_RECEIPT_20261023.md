# RUINS Daily Expedition 001C — 010B-1 Owner authorization receipt

**Owner instruction, 2026-10-23 SGT:** “use Free plan. authorize 010B-1 backup-and-local-restore only.”

**Status:** `010B1_AUTHORIZED / LIVE_BACKUP_NOT_YET_EXECUTED / 011A_HOLD`.

## Precisely authorized

- **Source:** Supabase project `Dungeon Runner S8B Staging`, project ref **`qpgwqmduqtqidmhbuclw`**, Thrive Consulting **Free** organisation. No production database or other Supabase projects.
- **One read-only, pre-r2 logical database backup session**, including the user schema definitions/data, applicable custom role definitions, permitted managed `auth`/`storage` **data rows**, and one **separate migration-history export**. Current application schema names known from read-only catalog inspection: `public`, `sl_sim`, `sl_sim_basic1_hosted_poc`, and `sl_sim_basic1_postpilot`; re-enumerate just before capture. No RUINS private schema or roles exist now.
- **One restoration rehearsal onto a new disposable local PostgreSQL 17.6 instance**, never staging, with synthetic and actual backup **confined to encrypted Owner-controlled, non-synced storage**. Restore must verify in-scope schema/objects, RLS, effective ACLs, required grants, nonzero dump sizes, source-versus-restore row counts and equality of privately computed per-table hashes. No real rows, Auth hashes, backup files, connection strings, tokens, keys or raw dump stdout/stderr sent to any AI model, chat, GitHub or Google Drive.
- **Human credential boundary:** Owner is the authorized credential-entering human operator (or may explicitly name another trusted human). The database password is entered directly in a protected local interactive terminal; the assistant/executor never reads or logs it. Dev4 provides independent read-only oversight using **sanitized metadata** only.
- **Operator tooling:** preferentially use checksum-verified Supabase CLI 2.121.0 through supported Docker/Linux. For the ASUS without Docker, approve *conditional* use of verified native PostgreSQL 17.6 client tools and the exact CLI 2.121.0 dry-run-derived command families, subject to the previously documented Windows quoting/spelling adjustments, fresh synthetic replay, schema-scope reconciliation and independent sanitized command review. No installation of Docker or paid services is authorized.
- **Protect outputs:** no dumps or restored PGDATA on unsynced but unencrypted storage. Require verified encryption **before** reading live data, including temporary files and local target database. A default maximum **14 days from capture** applies to the encrypted snapshot unless Owner separately extends it for an approved staging migration; the operator records deletion metadata afterwards. Do not automatically delete unverified/sole recovery evidence after a failed restore; stop and request the Owner's decision.

## Explicitly *not* authorized

**NO** remote DDL/DML, RUINS r2 migration (`011A`), `CREATE ROLE`/`ALTER ROLE` or privilege change on shared staging, real Auth setting or login mutation, live REST/Edge request testing, staging restore, Production access, project creation, Pro/billing upgrade, new secret, published function, wallet/XP credit, Friend/SL-SIM modification, or data uploads into G:/GitHub/chat. Do not change any source branch to perform the backup.

### Fail-closed STOP conditions

Wrong target/project; no verified encrypted workspace; human credential not available; new app schemas omitted; unreviewed command/SQL changes; unauthorised elevated roles; nonzero export exit; empty/truncated dumps; forbidden data in receipts/logs; unexpected role/RLS/ACL changes; incomplete Auth/Storage/migration-history coverage; mismatched objects/permissions/row counts/hashes; inaccessible disposable PG target; or inability to rehearse a credible restore. Record `BLOCKED` with metadata only. Do not retry with weaker grants, sudo, service_role, live schema changes or new passwords.

**Recovery limitations acknowledged:** This logical export is *not* a full Supabase project backup. Storage object binaries, Vault secrets/root key, provider-managed schema definitions, role passwords, real Auth login/session continuity, Edge Functions and secrets, realtime publications and project configuration require separate consideration. They are not newly authorized by this receipt.

**Stage dependency:** A `010B1: PASS` would prove only the *specified* recovery scope. The post-r2 stock Supabase CLI dump failure shown by synthetic S2 remains a `011A` blocking finding: the split `ruins_owner` S2FIX procedure must be approved separately. No `011A` authorization is implied by `010B1` success.

**Canonical source:** `coachtomlim/ruins-api` governance branch `work/ruins-001c-staging-readiness-010-dev4`, pin `23506bf97acb6d3c61628f2126c3403acd2b3650`. Migration hash still `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57`; **r2 unapplied**.
