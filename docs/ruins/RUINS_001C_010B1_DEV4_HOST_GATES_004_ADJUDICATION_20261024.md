# RUINS 001C / 010B-1 — Dev4 adjudication of HOST_GATES_004

**Date:** 2026-10-24 SGT  
**Disposition:** `HOST_GATES_004: REVISE`; `GATE_0_5: HOLD`; `LIVE_BACKUP: NOT_STARTED`; `011A: NOT_AUTHORIZED`.

## Accepted read-only evidence

- Accepted Codex implementation: `coachtomlim/ruins-api`, `work/ruins-001c-010b1-codex-independent-002` at `208b8399409383a4dcf329be8270e8e8a201a101`. Read-only host evidence is saved in G: `Quick Dungeon/Owner Review/RUINS_DAILY_EXPEDITION_001C/STAGING_READINESS_010/RECOVERY_010B/BACKUP_010B1/CODEX_INDEPENDENT_001/HOST_GATES_004/` and is cloud-retrievable.
- VeraCrypt `R:` maps to `\\Device\\VeraCryptVolumeR` and 8 GiB normal AES container on E:, NTFS serial `04E4F605`: **READONLY_PASS**. No independent offline full-copy or header recovery exists.
- Supabase staging session-pooler host read from authenticated Connect panel for project `qpgwqmduqtqidmhbuclw`: `aws-0-ap-southeast-1.pooler.supabase.com`, **ACCEPTED NONSECRET HOST PIN**, port `5432` session pooler. Never infer future pooler host from region.
- Dashboard-downloaded Supabase CA identity matches current encrypted-workspace file: PEM SHA-256 `700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7`; DER SHA-256 `807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`. Candidate requires `sslmode=verify-full`. **CA_PIN: PASS_READONLY**, no actual remote TLS handshake attempted.
- Current connected Supabase management API shows project `ACTIVE_HEALTHY`, PostgreSQL 17.6, while Codex saw dashboard `Unhealthy`. No new advisor critical/error findings. This is **STATUS_DISCREPANCY_UNRESOLVED**, not permission to force restart or claim a service failure. Need a new read-only dashboard check of which service was unhealthy before live execution.
- Accepted synthetic evidence continues to report 410/410 objects, 34/34 data objects, 12/12 SL-SIM protected tables, zero access differences, adversarial negatives PASS. No live staging export, credentials, SQL, ACL write, VeraCrypt header operation or dismount has occurred.

## Remaining gates

**C:** Elevated read-only BitLocker/Device Encryption status was not available to Codex. Active C: pagefile, hibernation, dump destinations and temporary data could expose backup material unless host disk encryption is verified. No encryption or OS settings modifications authorized. Authorize only three *status* checks in an Owner-opened elevated terminal, with output reduced to `VolumeStatus`, `ProtectionStatus`, `EncryptionMethod`, `EncryptionPercentage`, `LockStatus` etc.; redact recovery keys, protectors and secrets.

**E:** E: VeraCrypt ciphertext file currently inherits `Authenticated Users: Modify` and `Users: ReadAndExecute`. That is an unnecessary tampering/access surface. Requires separate exact-file ACL correction with original descriptor securely stored on R: and reversible rollback, not E: parent/root modifications. **New static defect found:** proposed host report's PowerShell repair calls `[Security.Cryptography.SHA256]::HashData()` and `[Convert]::ToHexString()`, APIs not supported in standard Windows PowerShell 5.1/.NET Framework. Do not run that command unmodified; Codex must replace with supported `SHA256.Create().ComputeHash` + `BitConverter.ToString(...).Replace('-','')` or tested equivalent, and verify on a disposable file before requesting E: ACL permission.

**VeraCrypt recovery:** No second encrypted, non-synced physical disk attached. Owner must designate offline destination with enough free space for one consistent 8 GiB second copy, with up to ~20 GiB recommended for two disposable recovery rehearsals. External header backup and external+embedded restore rehearsals must be on disposable copies, never source E:. Separate Owner authorization needed for unmount, copy, header operations and backup-media custody. No G:/cloud container/header uploads.

## Authorization boundary and recommended sequencing

1. Codex **005** performs PowerShell 5.1 compatibility correction **on a disposable file only**, produces exact proposed E: ACL commands with rollback, verifies source unchanged or creates a new isolated feature branch, and runs synthetic safeguards. It can also recheck the Supabase dashboard service status read-only. No privilege elevation or E:/R: mutation now.
2. Owner explicitly approves *elevated read-only C: status only*. Do not request recovery keys. If C: protection cannot be authoritatively verified or spill destinations are unencrypted, remain HOLD and propose alternative fully encrypted host rather than altering OS settings casually.
3. If C: PASS, ask Owner separately to authorize *exact-file E: ACL* and *offline recovery media/header rehearsal*, after reviewing Codex's fixed commands and named destination. Document rollback and stop gates.
4. Only after those steps and healthy service status, Dev4 may issue an exact Gate 0.5 ACCEPT decision, followed by Owner-private credential entry for previously authorized **backup-only** 010B-1.

No staged SQL migration, role/secret modification, deployment, production, billing or real staging export is authorized in this adjudication. **Claude remains paused; Codex is sole local developer.**
