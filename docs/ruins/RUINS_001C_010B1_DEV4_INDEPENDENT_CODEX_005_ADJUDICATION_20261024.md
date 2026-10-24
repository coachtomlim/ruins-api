# RUINS 001C — Dev4 Independent Codex 005 Adjudication and SOP Correction

**Date:** 2026-10-24 (SGT)  
**Verdict:** `CODEX_005: ACCEPT_OFFLINE_SCOPE`; `DEV4_GATE_0_5: HOLD_PENDING_OWNER_HOST_APPROVAL`; `010B1_LIVE_BACKUP: NOT_STARTED`; `011A: HOLD`.

## SOP correction

The Dev4 PM had unnecessarily delegated some review and cloud verification steps to Codex. Dev4 has now independently performed GitHub source verification, complete source review of the three new PowerShell files, Drive evidence review, and Supabase management health and security-advisor reads. Do not send another Codex programming task for these accepted offline checks. Local Windows/elevated actions remain executor-only when actually authorized.

## Independently verified evidence

- Candidate branch `work/ruins-001c-010b1-codex-powershell-preflight-005` @ `af7520af8bb23b5793807705e95ab562e00a8641` confirmed using the GitHub connector. Commit tree `6eacab35a12ebec85ec18e3fc6a4d0a108b708f6`; changes relative to Dev4 governance `f625282848e0c8920c3a8f74a2d9d63a74246642` show three PowerShell dev/test files and one report, with expected isolated-branch divergence (not a direct fast-forward).
- Reviewed GitHub files: `tools/ruins-010b1/dev/AclPreflight.Common.ps1`, `Invoke-ContainerAclPreflight.ps1`, `Test-ContainerAclPreflight.ps1`, and report `docs/ruins/RUINS_001C_010B1_CODEX_005_POWERSHELL_AND_HEALTH_EVIDENCE_20261024.md`. SHA-256 conversion now uses Windows PowerShell 5.1-compatible `SHA256.Create().ComputeHash()` and `BitConverter` conversion; path/owner/ACL preconditions, authorizing switch and exact-file rollback are explicit.
- Codex executed PowerShell Desktop 5.1.26100.9711 disposable-file tests, reporting `POWERSHELL_5_1_ACL_TEST_PASS`, three hash vectors, no authorized live mutation, wrong file/owner/hash denial, apply, rollback and negative controls. Dev4 **reviewed the test source and saved receipts, but did not rerun the Windows harness**. Treat the pass strictly as Codex-executed synthetic evidence.
- Cloud evidence from `G:\My Drive\Quick Dungeon\Owner Review\RUINS_DAILY_EXPEDITION_001C\STAGING_READINESS_010\RECOVERY_010B\BACKUP_010B1\CODEX_INDEPENDENT_001\POWERSHELL_PREFLIGHT_005\` is available; report https://drive.google.com/file/d/1c1v4RyKjnXRkswE_TmqdH8K7v9fyn7Sb/view, machine inventory https://drive.google.com/file/d/1YiJ03KR5FXAAQUAl3EAqPjhZZbhjQV4u/view. The saved SHA256SUMS lists the report hash `0a7c2862a98f9a525e24a6cba07f721afb7e2f954a127d756acbd9e9e753fb5c`.
- Project `qpgwqmduqtqidmhbuclw` Supabase management read currently reports `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.166. Security advisor unchanged from prior baseline: INFO 15 RLS no policies, WARN 1 mutable path, WARN 3 anon and WARN 17 authenticated SECURITY DEFINER function execute, WARN 1 leaked-password protection. Historical dashboard `Unhealthy` root cause remains undetermined; latest Codex dashboard reports `Healthy`. No basis to claim incident or outage.
- Accepted TLS candidate: exact session pooler `aws-0-ap-southeast-1.pooler.supabase.com:5432`, CA PEM `700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7`, DER `807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`, `sslmode=verify-full`. No real network handshake to DB and no credentials.
- R: VeraCrypt `\\Device\\VeraCryptVolumeR`, serial `04E4F605` association verified by Codex. E: live container inherited `Authenticated Users Modify` / `Users ReadAndExecute` remains unchanged. C: Windows OS encryption cannot be observed without elevated read-only command; active paging/hibernation/dump/TEMP exposure on C:. A separate encrypted, non-synced offline physical disk with about 20 GiB free is not connected. No consistent live-container/header recovery rehearsal done.

## Owner authorizations needed before live execution

**Phase 1 (safe, small):** Authorize **elevated status-only inspection of C: BitLocker / Device Encryption** via the three fixed read-only commands in Codex 005 report. Do not view recovery keys, encrypt/decrypt/suspend, disable paging/hibernation or change OS settings. Return only `ProtectionStatus`, `VolumeStatus`, `EncryptionMethod`, `EncryptionPercentage`, `LockStatus`, and contradictions. If encryption is not active and fully protecting spill surfaces, live backup stays HOLD.

**Phase 2 (only after Phase 1 PASS):** Owner separately approves correcting ACL of the *single pinned E: VeraCrypt container file* (not root or parent), using exact pre/post ACL hash, encrypted R: rollback descriptor, Owner-controlled clean dismount/remount and fail-closed verification. The test script has already been reviewed; the live operation is not approved yet.

**Phase 3:** Owner supplies independent offline encrypted physical storage (around 20 GiB free) and authorizes a consistent dismounted full-container copy and **disposable-only** external and embedded header rehearsals, never touching live-source header. Keep header and live container in separate trusted custody and never sync to G:/GitHub/chat. No media present, so this cannot be done in the current chat.

**Phase 4:** Dev4 re-adjudicates and authorizes execution of the already Owner-approved 010B-1 *read-only backup + disposable local restore* only after all host controls PASS. Owner privately enters DB credential; application secrets and backup data remain encrypted on R: only. Any remaining r2 staging migration `011A` needs completely separate authorization.

## Role assignment

- **Dev4:** Cloud source, evidence, ACL policy and staging state reviews; authorization governance; no repetitive dispatch to Codex for work Dev4 can do directly.
- **Codex:** Actual ASUS-local elevated/status-only queries **after** Owner authorization; exact-file ACL/volume operations and Windows-local backup procedure after separately bounded approvals.
- **Claude:** Paused.
- **Owner:** The authorizations and physical offline media; credential entered privately later.

**No live backup, host ACL/OS mutation, database write, 011A or production deployment has occurred in this Dev4 review.**
