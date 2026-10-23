# RUINS 001C — Dev4 010A Dashboard Adjudication and 010B Recovery Gate

Date: 2026-10-23 SGT. Owner: Dungeon Bravo Dev4.
Status: `DATA_API_EXPOSURE: PASS_PRE_DDL`; `BACKUP_RESTORE_READINESS: NOT_PROVEN`; `011A_STAGING_DB_ONLY: HOLD`.
Project: `qpgwqmduqtqidmhbuclw`, Dungeon Runner S8B Staging, Thrive Consulting, Free plan.
Migration draft (NOT APPLIED): `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57`.

## Verified provider facts

Claude's read-only dashboard 010A result on 2026-10-23 10:58–11:00 SGT: Data API ON; exposed schemas exactly `graphql_public` and `public`; listed but unexposed `sl_sim`, `sl_sim_basic1_hosted_poc`, `sl_sim_basic1_postpilot`; no `ruins_private`; extra search path `public, extensions`; automatically expose new tables ON. Evidence: https://drive.google.com/drive/folders/1gGhRS6PkC1u6Qy1fb5kXDVNa5aZj8Rr8

Connected Supabase organisation check independently verified Free plan. Supabase dashboard reported Free Plan does not include project backups, PITR is a paid add-on, restore-to-new-project requires Pro. No backup recovery point or restore rehearsal exists. Official vendor backup guidance: https://supabase.com/docs/guides/platform/backups . Security Advisor remains baseline INFO 15 / WARN 22, with no ERROR/CRITICAL, and unrelated Friend/SL-SIM application data must be protected.

## Decisive STOP

Do **not** apply r2, create roles, configure passwords, provision HMAC signing keys, deploy Edge, alter Data API auto-exposure globally or charge a subscription while no recoverable shared-staging baseline is established. A transactional additive migration and a RUINS-only rollback script do not recover Friend, Daily Trial or SL-SIM data.

## Preferred next package: 010B noncredentialed recovery readiness

1. Dev4 catalog-only survey of existing schemas/sizes, backup scope, client tooling, exclusions and restoration dependencies; no table contents, connection passwords, exports or migration.
2. Use fake data in disposable PostgreSQL 17.6 to rehearse a logical backup and restore, including roles, schemas, data, ACL/RLS, extensions and negative access tests.
3. Prepare a separate bounded **backup-only** operator authorization for a confidential encrypted staging export and an actual isolated restore rehearsal. Owner handles credentials privately. No user records, raw archives, role secrets or connection strings in G:/GitHub/chat.
4. Supabase CLI default `db dump` excludes managed `auth`, `storage` and extension schemas. Inventory these exceptions and any Storage object bytes separately. A partial dump cannot be declared a complete project backup. If critical existing services lack a credible restoration method, 011A stays HOLD.
5. Alternative if Owner chooses: upgrade to paid managed backup and verify a real recovery point and safe restore. Do not assume subscription itself proves recovery. Schema-only compensating rollback is not an acceptable sole backup.

Read-only PostgreSQL catalog allocation on 2026-10-23 was ~8 MB across relevant schemas, **excluding stored binary objects**; this is only a rough tooling-feasibility indicator, not a dump/restore size or backup receipt.

Detailed owner-facing adjudication, backup planning and recovery gate matrix: https://drive.google.com/drive/folders/19gG0nck46_r9HWrp_f7QB7TsStOsad2z
Zip package: https://drive.google.com/file/d/1xRmjKCgvcVEMOHgJ7wu8YrIpRHjxcvE9/view

## Permission and next actor

`DATA_EXPORTS=0`, `STAGING_MUTATIONS=0`, `PROD_MUTATIONS=0`, `UPGRADES=0`, `MIGRATION_APPLIED=0`, `EDGE_DEPLOYMENT=0`.
Dev4 next: complete 010B offline/noncredentialed feasibility and propose an explicit backup-only authorization. Owner: no immediate task. Claude/Codex: only if local tools unavailable, never concurrent. DOT: no visual change.
