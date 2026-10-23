# Codex independent executor — 010B-1 Gate 0.5 remediation / source custody 003

**PM:** Dungeon Bravo Dev4. **Date:** 2026-10-23 SGT. **Sole executor:** Codex Desktop. **Status:** `AUTHORIZED_OFFLINE_CORRECTION_ONLY / LIVE_BACKUP_HOLD`.

**Repo:** `coachtomlim/ruins-api`. Known canonical base `work/ruins-001c-010b1-codex-independent-001` at `3afe6a186a382903049b89cce267eda237e55fd2`. Codex reported unpublished/unretrievable `work/ruins-001c-010b1-codex-independent-002` at `257a8f5c6a81ebcfce79726c8ea625a909acc8bd`. The Dev4 governance branch with this instruction will be separately named. Do not modify `main`, prior accepted branches, Owner C: checkout, frozen Friend/SL-SIM or production.

## Mandatory task sequence

### P0 — prove actual GitHub custody **before all other acceptance work**

1. Locate Codex's existing isolated Windows worktree and actual `.git` state; verify the reported local SHA and parent. Confirm exact remote URL corresponds to `coachtomlim/ruins-api`, no embedded token printed. `git ls-remote` for branch `-002`; inspect `git status`, `git show --stat`, tree/blob IDs and claimed source/test filenames. Do not rely on the prior chat or Drive JSON as proof of remote publication.
2. If the commit is present locally and exact diff was the reviewed backup tooling, perform a normal **non-force** push of **only** the isolated `-002` branch and verify `git ls-remote` plus GitHub API/web reachability. If the remote branch already exists at a different SHA, STOP on drift rather than overwrite. If the commit cannot be recovered, reconstruct under a new bounded feature branch from the known canonical commit, with fresh tests and all previous hashes marked superseded; never pretend the old SHA was published.
3. Keep the scripts, tests, manifest/verifier and independent runbook in repository source at the new verified HEAD. Report individual SHA-256 hashes, Git blob IDs, exact parent/final SHA and a clean diff. No Git operations in G:; no secret/capture files in Git.

### P1 — independent Windows system and VeraCrypt review (read-only first)

4. Inspect R: mounting: `QueryDosDevice('R:')`, drive filesystem, VeraCrypt Properties identification of source container on local E:, size and no symlink/reparse-path escapes. Log only sanitized path type and mount association; no passphrase, volume key or confidential full path. Independently review installed VeraCrypt provenance, version, config and the state when locked/unlocked.
5. Record authoritative evidence of C: OS encryption state (Windows Device Encryption/BitLocker or equivalent), pagefile presence/locations, hibernation mode and dump destinations **without changing them**. If rights are insufficient, return `OS_PROTECTION_NOT_OBSERVED`, do not assume safe. In particular, an unencrypted C: with active pagefile/dumps is a **default HOLD** for real Auth hashes/user data. Never disable paging/dumps/hibernation, enable device encryption or change recovery keys without a separate Owner permission.
6. Review the actual E: container file ACL, inheritance, owner and effective access of nonowner principals. Propose a least-privilege ACL and reversible change plan (record original ACL); do not alter disk-root ACL or change permissions until separately authorized. Distinguish access while mounted vs encrypted ciphertext when unmounted.
7. Produce a feasible full-container offline second-copy plan and independent **external volume header backup** plan. Must specify distinct secure custody, storage capacity (~8 GiB plus overhead), how to verify a copy's integrity and perform recovery against a **disposable copy** only; no header restore on live source, no uploading encrypted container/headers to G:, GitHub or chat. No actual copy or header operation until Owner approval.

### P2 — trusted TLS and exact-command integrity

8. Independently source the correct Supabase root CA from an authoritative provider/dashboard path; identify target `qpgwqmduqtqidmhbuclw` without opening any credential dialog or initiating live DB traffic. Use certificate `sslmode=verify-full` and hostname verification, with an out-of-band pinned certificate SHA-256 and expiry/chain review. If certificate authenticity or host association is ambiguous, HOLD. Do not accept `sslmode=require` as equivalent to server verification.
9. Review/harden execution-time checks for **all** files: full bundle manifest, verifier self-integrity, executable/CA checksum, source tree, canonical `R:`-rooted paths including restore capture argument, no symlink/reparse traversal, restrictive temp and local OS ACLs; fail closed on altered or extra file. Use single-use Owner credential entered privately in child-only environment. Do not put connection strings or credentials in process args/logs.
10. Independently rerun synthetic PostgreSQL 17.6 capture+restore and negative mutation tests (files/bundle, certificate pin, wrong hostname, inherited ACL, reparse paths, altered SQL, tampered capture, mismatched hashes, non-R: destinations, interrupted export). State exact results and source SHA. Any change to executable scripts invalidates earlier manifest and requires fresh reviewed hashes.

### P3 — decision-ready handoff, still **NO live export**

11. Return `SOURCE_PUBLISHED` / `SOURCE_BLOCKED`, `VERACRYPT_READONLY_PASS/REVISE`, `OS_ENCRYPTION_PROVEN/NOT_OBSERVED/NOT_ENCRYPTED`, `TLS_CA_PINNED/NOT_PINNED`, `BACKUP_RECOVERY_PLAN_READY/NEEDS_OWNER_PERMISSION`, `SYNTHETIC_PASS/REVISE`, and overall `PASS_READY_FOR_DEV4_GATE_0_5 | REVISE | BLOCKED`.
12. Provide precise GitHub URLs/SHA, G: sanitized evidence folder, a new fixed command packet with all hashes, tests and stop conditions. If a non-read-only local security step is needed, include one scoped Owner-approval request **per category**. Never solicit DB password until Dev4 independently approves the revised commands and encryption/ACL/recovery gates.

## Hard limits

**NO** staging DB connection, export, data read, real SQL, passwords, Supabase setting, role changes, migrations, Edge deploy, `011A`, paid tier change, production, Friend/SL-SIM modification, user checkout, or live VeraCrypt header changes. Claude stays paused. GitHub is canonical for code, G: for sanitized receipts; sensitive data stays only on approved encrypted non-synced media.

The user authorized the eventual 010B-1 read-only backup and disposable local restore, **not** immediate execution before Gate 0.5 acceptance. This work order has no expiry but must be revalidated against actual platform/tool states when Codex runs.
