# RUINS Daily Expedition 001C — 010B-2 cloud-first backup pivot

**Dev4 PM decision:** `CLOUD_FIRST_DESIGN: ACCEPTED`; `CLOUD_RUNNER: NOT_PROVEN`; `010B-1_ASUS_RUNTIME: PAUSED/SUPERSEDED`; `010B-2_LIVE_EXPORT: NOT_AUTHORIZED`; `011A_STAGING_MIGRATION: HOLD`.

**Date:** 2026-10-24 (SGT). This is a design and proof authorization only. It does not purchase services, transfer secrets, create infrastructure, extract real database rows, write to staging, change game deployments or alter ASUS storage.

## Why the architecture changes

The project is a browser game. Its existing source/release authority is GitHub `coachtomlim/ruins-api`, its live browser surface is independent of the backup workflow, and the accepted 001C private backend is intended for Supabase. A player or owner PC is neither the game's database server nor the proper operational root of trust for backups. The prior 010B-1 host-security work (ASUS VeraCrypt R:, E: container ACL, C: paging/BitLocker, offline external-media/header rehearsals) is preserved as evidence but is **not required for a separate cloud backup design**. Do not mutate C:, E:, R:, or the accepted Owner checkout.

## Confirmed existing provider inventory and limitations

- Supabase shared staging project: `qpgwqmduqtqidmhbuclw`, `Dungeon Runner S8B Staging`, PostgreSQL 17.6 on Free tier. Its dashboard reported no included managed backups; original 010B synthetic rehearsal confirmed pre-r2 CLI-style logical exports/restore work offline, and **standard whole-project dumps fail after r2**. S2FIX owner-scoped private-schema split dump passed offline only. Never claim this is a full managed Supabase disaster recovery.
- Hostinger account was *actually inspected* on 2026-10-13 for SL-SIM: **Business Web Hosting**, existing paid plan expiring 2027-11-04, 200 GB plan disk, SSH, cron, Node.js web applications, PHP/MySQL; **no VPS active and no PostgreSQL runtime support** on that plan. This finding is account-specific and should be refreshed before a later change. Hostinger official documentation confirms VPS is required for PostgreSQL tooling. Its web hosting may be an alternate game front door; do not assume it can safely run `pg_dump`/PostgreSQL 17 or hold arbitrary encrypted vault archives without confirming supported binary/usage policies.
- HostGator shared hosting likewise does **not** support PostgreSQL. Current cPanel login browser tab is not proof of a VPS/dedicated server. Hosting the static web game is distinct from running database maintenance.
- Google Drive G: may contain public docs, source governance, sanitized evidence, and **encrypted backup ciphertext only**. No SQL dumps, Auth password hashes, user records, private HMAC signing keys, DB credentials or age/restic decryption keys in plaintext may be stored there. G: sync may keep ciphertext copies on local disks; avoid direct plaintext Google Drive mount.

## Recommended one-time Free-plan proof: Ephemeral Google Cloud Shell → encrypted G:

**Candidate, not yet verified on Owner account:** Google Cloud Shell browser-based **ephemeral mode** `https://shell.cloud.google.com/?ephemeral=true` provides a short-lived Linux VM without a retained home directory. It is suited to an interactive, bounded proof, not a persistent or unattended scheduler. Confirm access, privileges, storage, outbound Supabase session-pooler TLS access and egress/usage limits without any live credential. No assumption of preauthorized Google Cloud billing or account access.

1. **Synthetic Gate C0:** Open an Owner-approved ephemeral Cloud Shell session. Verify Linux `pg_dump`/`pg_dumpall`/`psql` PostgreSQL 17.x, or install tools only inside the disposable VM subject to the provider's permitted environment. Pin the repo's accepted 010B command source and verify SHA-256. Test only fake PostgreSQL accounts/tables including app schemas, Auth/Storage shape, migration history, explicit roles, RLS, ACL and the 011A private-schema edge cases. No staging URL/token/password; no Supabase database port contact. Do not use GitHub Actions minutes or a paid VPS.
2. **Encryption Gate C1:** Using only synthetic SQL dumps, test a streaming encryption path (`pg_dump` family → compressor → authenticated encryption, e.g. `age` passphrase/recipient with an independently retained secret) **before** writing to Drive. Confirm no plaintext archive, process log or notebook output reaches G:. Validate checksum, completeness, error exit codes, and encrypted upload/download to a dedicated private Drive folder. Decryption key/passphrase is held outside Google Drive and outside repo/chat; its custody and recovery must be tested. No encryption key in a checked-in notebook, shell history or captured logs. Google Cloud Shell ephemeral VM is still a cloud host; do not call it zero-risk or guaranteed memory-only without auditing temporary storage and subprocess handling.
3. **Restore Gate C2:** Restore from the *encrypted uploaded copy*, in a fresh disposable remote PostgreSQL 17 sandbox, and check inventory, role/ACL/RLS, unique keys, all expected in-scope table row counts/private hashes, migration state and negative authorization tests. Reject any zero-byte dump or partial archive, and explicitly list exclusions (Storage **file binaries**, Vault secret/root key, Edge code/secrets, provider configuration, real Auth continuity). Delete ephemeral runtime after verifying no sensitive residue is durably persisted.
4. **One-time live Gate C3 — requires *new, explicit* scope authorization:** Only after C0–C2 pass and Dev4 reviews the exact scripts + G ciphertext custody may an Owner-operated ephemeral job connect to staging `qpgwqmduqtqidmhbuclw` with `sslmode=verify-full` and the independently pinned Supabase CA, using the exact session pooler host `aws-0-ap-southeast-1.pooler.supabase.com:5432` (as already observed). Owner enters password privately; no model receives it. Read-only catalog preflight proves project/ref, all expected schemas, pre-r2 absence, role identity and no unsanctioned changes. Encrypt before any Drive upload. Restore and compare without exposing rows or keys. This replaces the ASUS-local one-time capture procedure; **the earlier 010B-1 Owner authorization did not authorize a new external cloud processor or G ciphertext destination**, so seek a specifically bounded 010B-2 authorization before any live export.
5. **After 011A:** Do NOT reuse the ordinary CLI whole-project dump. The private `ruins_owner` schema requires a separately audited split owner-role procedure, with preserved schema-grant/default-privilege/migration-history metadata and encryption of the HMAC signing-key table. No automatic 011A activation or production wallet writes.

## Platform architecture separation

- **Web game assets/UI:** existing approved publicly accessible browser hosting. Hostinger Business Web or HostGator can be considered for static assets/HTTPS based on existing live contracts, *without moving the backend*.
- **Authoritative game state/Auth/rewards:** Supabase private database and tightly scoped Edge handler, still gated separately. No game sessions rely on ASUS C/E/R.
- **Source and test contracts:** GitHub repo, no new GitHub Actions usage without Owner approval; no Vercel/Hostinger purchase required for synthetic proof.
- **Cloud backup runner:** short-lived interactive Google Cloud Shell *for one-time proof*. If it cannot support the complete secure PG17 workflow, stop and evaluate an explicitly approved small VPS/managed backup instead; do not force Hostinger shared hosting to act as a VPS.
- **Backup vault:** encrypted ciphertext + manifest in a dedicated **private** Google Drive folder. Keep the decryption secret outside Drive and maintain at least one independent encrypted second copy when the retention/recovery policy is approved. Store sanitized receipt and hashes in the canonical G: Owner Review vault.

## Stop conditions

Any unavailable Cloud Shell session, unverified tool version, read-only violation, plaintext artifact outside the isolated runtime, incomplete export, encryption failure, missing decryption key recovery, Drive upload mismatch, restore mismatch, inappropriate permission grant, schema drift, secrets in logs or unapproved costs => STOP. Never disable TLS verification or weaken the private role. No 011A DDL until a satisfactory **actual** recovery gate is proven and separately authorized.

## Immediate Dev4-owned work and next execution boundary

1. Dev4 files this decision in GitHub and Google Drive, and preserves previous Codex Windows scripts/evidence without any more C:/VeraCrypt changes.
2. Dev4 drafts/reviews the C0–C2 synthetic plan, static backup contract, encrypted Drive file format, owner-only key custody and explicit 010B-2 approval language. This portion belongs to Dev4 rather than requiring Codex.
3. **Only if a real browser/VM setup is needed**, one executor (Codex/Work) performs the bounded cloud-shell synthetic proof. The Owner may need to open/authorize their Google Cloud Shell and Drive accounts. Do not delegate the planning, literature lookup or governance document preparation.
4. Return `CLOUD_SHELL_SYNTHETIC_PASS / REVISE / BLOCKED`, not a claim of live recovery. Owner action for real Auth data export comes later under 010B-2, not under the earlier ASUS 010B-1 approval.

## Primary references

- Original Hostinger account audit: `https://drive.google.com/file/d/1UxpD4kSIO4jswB8kPRcCpF_M5A2kvOOv/view`.
- Supabase Free-plan backup recommendations: `https://supabase.com/docs/guides/platform/backups`.
- Supabase logical backup guidance: `https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore`.
- Supabase database connection options: `https://supabase.com/docs/guides/database/connecting-to-postgres`.
- Google Cloud Shell ephemeral mode and data lifetime: `https://docs.cloud.google.com/shell/docs/using-cloud-shell`, `https://docs.cloud.google.com/shell/docs/how-cloud-shell-works`.
- Hostinger shared-vs-VPS database features: `https://www.hostinger.com/support/which-databases-and-data-tools-are-supported-at-hostinger/`.
- HostGator PostgreSQL supported tiers: `https://www.hostgator.com/help/article/postgresql`.

**No infrastructure or storage changes are authorized or reported by this document.**
