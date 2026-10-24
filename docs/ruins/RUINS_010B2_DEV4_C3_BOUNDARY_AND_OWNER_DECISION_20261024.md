# RUINS Daily Expedition / 010B-2 — Dev4 C3 scope and Owner decision

**Date:** 2026-10-24 (Asia/Singapore)

**Author:** Dungeon Bravo Dev4, independent of DB Dev Work5

**Status:** `C2_5R_SYNTHETIC_ACCEPTED / C3_LIVE_EXPORT_HOLD / 011A_HOLD / OWNER_DECISIONS_PENDING`

**No paid product, app/database mutation, actual export, credential entry, remote executor dispatch, ASUS disk access, schema migration or production action is authorized by this document.**

## 1. Grounded evidence

- Work5's synthetic C2.5R evidence at GitHub branch `work/ruins-001c-010b2-c25r-corrective-001`, HEAD `6050dc5efff780f92ac2e0ac18cd77775956fe0e`: final state `RESTORE_VERIFIED`, 32 fake tables / 35 fake rows, 13 inventory categories, 19 effective behavior checks, 13/13 protocol tests, 8/8 producer failure tests, private Drive transfer and replayable idempotent journal. Original fake ciphertext SHA-256 `7fe9463f6451d6139308bbf47f5cf580170d562c61a709f34b080a6768c04734`. No real cloud staging connection.
- Dev4's independent recovery/adjudication: `afb31cb4e59d39b6da9f00c9b340053ae9423aec` (docs only); G: evidence [folder](https://drive.google.com/drive/folders/1Fxmap3GdNSfuP4orOTwaHtTNBmG4lEO6) and [report](https://drive.google.com/file/d/1N35MqkVazbxr_VK4ZI6fln2KVc_mj5TH/view).
- Read-only Supabase metadata for `qpgwqmduqtqidmhbuclw`, `Dungeon Runner S8B Staging`, PostgreSQL 17.6: `ruins_private` schema **absent**; `ruins_owner` role **absent**; **107 relevant tables** across `public`, `sl_sim`, `sl_sim_basic1_hosted_poc`, `sl_sim_basic1_postpilot`, `auth`, `storage`, `supabase_migrations`. At an isolated observation, zero other active transactions; this **does not** establish future quiescence or a maintenance freeze.
- Source role `postgres` has table SELECT privileges across those 107 tables but cannot explicitly SHARE-lock all of them without broader grants; expanding permissions just to back up the project is rejected. Current CLI stock whole dump after proposed r2 must fail on `ruins_private` (historical S2), with separately gated `ruins_owner` split backup (S2FIX).
- PostgreSQL 17 `pg_dump` offers a coherent MVCC snapshot of transactional database content without blocking ordinary concurrent writes; exported synchronized snapshots allow multiple `pg_dump` invocations to share that transactional view. **Global role definitions, nontransactional sequence behavior, newly occurring DDL and provider-managed state are not automatically pinned**. Source: https://www.postgresql.org/docs/17/app-pgdump.html and https://www.postgresql.org/docs/17/functions-admin.html.
- Supabase recommends manual off-site logical exports for Free-tier projects; PostgreSQL logical dumps do not contain Storage object binaries or full platform state. Sources: https://supabase.com/docs/guides/platform/backups and https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore.

## 2. Architecture decision: avoid global service shutdown for the *initial* scoped baseline

**Dev4 recommends a bounded, low-disruption, pre-r2 SQL recovery baseline** as a staging rollback safeguard; **not** an all-services disaster recovery guarantee. The first real capture goal is:

1. One read-only source preflight of exact project/ref, TLS CA and hostname, provider PG version, role/grants, schema presence/absence and tool artifact pins; reject if r2 appears.
2. One coordinated exported MVCC snapshot for four app schema families, Auth/Storage table rows and migration-history data, with passwordless role/catalog metadata captured under a **short administrative change freeze**. No broad SELECT/LOCK grants or source mutations.
3. Streaming encryption **before uploading ciphertext to a dedicated private Google Drive folder**; unique run ID, hashes, owner-only permissions, authenticated re-download, no plaintext dump on G:/GitHub/ASUS. No log/shell-history secret exposure.
4. Fresh disposable PostgreSQL 17 reconstruction and role/ACL/RLS/row/sequence/history validation. Target-admin privileges are allowed in the throwaway database, never borrowed on staging. Verifying a logical restore **does not demonstrate managed Supabase restoration or working Auth sessions**.
5. Final outcome is `PRE_R2_STAGING_SQL_BASELINE_VERIFIED` or failure, **not** `FULL_PROJECT_RECOVERY_PASS`. No promotion of 011A until the specific private-schema migration rollback/backup requirements are independently signed off.

### Administrative change freeze, not a database outage

**Recommended:** during a short named capture interval, stop **intentional operator/admin changes** (migrations, schema creation/ALTER/DROP, role and grant changes, deploys that run database DDL, SQL-editor/admin modifications, and scheduled administrative schema migrations) across the shared staging project. Ordinary game and Auth data writes **may continue** and are represented as of the MVCC snapshot. Do not assert exact sequence state/role continuity without checks. No forced suspension of users, Auth refresh, Storage service or classroom sessions has been approved; prefer a naturally quiet period with no class running. If any uncontrolled DDL/role change or snapshot/capture failure occurs, mark the run invalid and restart under a new approved run identity.

**Residual caveats:** a role/DDL change-and-revert cannot be excluded by catalog pre/post hashes alone; a catalog-only observation cannot guarantee no provider-managed writes; sequence values can race with concurrent writes, requiring explicit **post-restore sequence reconciliation and constraints checks** on a disposable target. If the Owner requires an exact entire-cluster point-in-time image or all Auth/Storage/session and Storage-binary continuity, this lightweight method is insufficient; choose managed backups or a separate full-platform recovery project. Do not expand into paid services automatically.

### Alternative explicitly not recommended now

A full global writer freeze of all 107 tables and all shared Friend/Daily Trial/SL-SIM/Auth/Storage pathways is disruptive, difficult to enforce for managed services, and still would not back up Storage binaries, Edge configuration or managed platform secrets. **Do not require it merely to gather a useful pre-migration SQL baseline.** Do not claim the relaxed plan qualifies as identical exact global consistency.

## 3. Encryption-key custody decision (needed before live C3)

**Recommended:** retain the synthetic-tested public-recipient model (`age`), with only an Owner-supplied public recipient in the capture VM. The private decryption identity **must never enter GitHub, Google Drive, this chat, Work scratch or Cloud Shell capture VM**. The Owner chooses an existing reputable password manager/secure vault for the primary recoverable identity and a truly independent, separately protected recovery copy (e.g. physical offline recovery envelope or a second independently controlled encrypted custody account). A synced second folder in the same Google account is **not** independent custody. No new subscription is presumed.

**Required private check:** encrypt a nonsecret challenge using the public recipient; Owner independently opens the secondary recovery copy and validates the challenge without exposing the identity to the AI or capture runner. Save only the recipient fingerprint, challenge digest, success receipt and custody labels. Explicitly document retention/rotation: retain old identities while matching backup archives exist; otherwise ciphertext may be permanently unrecoverable.

**Important:** actual public recipient generation and Owner-managed custody have **not** occurred. No owner secret is requested in chat. If the Owner cannot provide two independent recoverable copies, **live C3 stays HOLD** and no real data export is attempted.

## 4. Separate permission decisions, in order

**Decision A — scope/risk:** Does Owner authorize planning the **non-disruptive pre-r2 encrypted SQL baseline**, subject to the administrative schema/role-change freeze and the candid incomplete whole-platform guarantees above? This does **not** authorize a live connection/export yet. On approval, pin exact interval, schema inventory, accountable admin-change freeze owner, and stop conditions.

**Decision B — recovery key:** Does Owner accept an Owner-controlled public age recipient and two separately recoverable private custody copies, with one offline or otherwise truly independent failure domain? Owner will choose actual existing vault/custodian privately. No private material is supplied to ChatGPT.

**Decision C — live one-time capture:** Only after A/B and final source/tool/connection/recipient/restore review, obtain a **new explicit** authorization for one read-only cloud ephemeral export of `qpgwqmduqtqidmhbuclw`, ciphertext-only Drive storage, one independent disposable restore and no other operations. Earlier ASUS-local 010B-1 approval **does not** authorize this. Session pooler endpoint `aws-0-ap-southeast-1.pooler.supabase.com:5432`, `sslmode=verify-full`, pinned CA and project-scoped role are verify-before-execution criteria, not credentials or preapproval.

**Decision D — 011A:** Even after successful C3 scoped baseline, private r2 schema release and post-r2 split-backup require their **own bounded approval**. No automatic migration, Edge function activation, reward wallet change or production access.

## 5. Immediate responsibility and execution boundary

- **Dungeon Bravo Dev4 (current thread)** independently handles evidence, policy, design, provider status, GitHub/Drive documentation, owner decision packet, and later technical adjudication. **Do not delegate tasks that Dev4 tools can perform.**
- **DB Dev Work5:** Owner is stopping the stalled/overlong thread. Do **not** ask it to restart, rerun 32-table fake fixtures or finish work that already reached `RESTORE_VERIFIED`.
- **Codex/Claude:** no tasks. No ASUS C/E/R or VeraCrypt operations.
- **Owner:** only the two high-level decisions A/B when ready. No subscription, credentials, PC changes or login requested now.

`C2_5R_SYNTHETIC_ACCEPTED / C3_LIVE_EXPORT_HOLD / 011A_HOLD`
