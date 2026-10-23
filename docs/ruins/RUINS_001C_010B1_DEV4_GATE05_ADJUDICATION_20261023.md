# RUINS Daily Expedition 001C / 010B-1 — Dev4 Gate 0.5 independent adjudication

**Date:** 2026-10-23, Singapore. **Disposition:** `GATE_0_5: HOLD_SOURCE_NOT_VERIFIED / VOLUME_RISK_UNRESOLVED`; `OFFLINE_SYNTHETIC: PASS_REPORTED`; `LIVE_EXPORT: NOT_AUTHORIZED_TO_START`; `011A: HOLD`.

## Scope and Owner authority

Owner authorized **one backup-only, read-only export** of Supabase staging `qpgwqmduqtqidmhbuclw` on the Free plan and **one disposable local PostgreSQL 17.6 restore**, with all sensitive output restricted to encrypted non-synced media. The separate 011A database migration, account provisioning, deployments, production activity, billing and writes remain unauthorized. Owner enters any database credential privately after independent Gate 0.5 acceptance.

## Observed evidence and provenance

Codex reports `PASS_READY_FOR_DEV4_GATE_0_5`, local isolated branch `work/ruins-001c-010b1-codex-independent-002`, SHA `257a8f5c6a81ebcfce79726c8ea625a909acc8bd`; package manifest SHA-256 `74f872a5895a0b835a0be0f492ebefd20ab3984845e0123b9da2f252fa6e717e` and verifier SHA-256 `072d5d41d8b07086a76be3db4d3b98398794eb7ba27143971d7f8530606b564e`. Its synthetic result says PG17.6 **410/410** objects, **34/34** data objects, zero effective privilege differences, 12/12 legacy SL-SIM tables, no recovered role passwords, and negative path/bundle/SQL/capture tests PASS. These counts are executor reports, **not independently rerun here**.

The sanitized cloud evidence JSON was retrieved at Google Drive file `1_wP2F33nlGjgZH5dtYkyEf3Z8r849Xhk` and includes those values. The original Claude packet was available under Drive folder `1695Brfi_7y1p5UyrdbK-4RXPqdwwzpFx`; its synthetic evidence is a historical comparator only.

**P0 block:** GitHub API GET for `refs/heads/work/ruins-001c-010b1-codex-independent-002` returned 404. GET for commit `257a8f...` returned 404/422. GitHub branch enumeration and matching-ref listing exposed only `work/ruins-001c-010b1-codex-independent-001` at `3afe6a186a382903049b89cce267eda237e55fd2`. Therefore Codex's latest corrected source is **not independently retrievable in the canonical repository**. A report and a sanitized JSON alone cannot authorize executing sensitive live scripts. Do not presume successful publication, fabricate source, or publish it in Dev4's place.

## Remaining security and continuity findings

1. **Windows OS plaintext exposure:** `R:` is a VeraCrypt file container but OS pagefile, hibernation and crash dumps may write sensitive plaintext to **C:** while the protected files are open. System encryption on C: was not proven. Before a real export, require authoritative C: encryption protection with safe recovery-key custody, or use a verified alternative protected host. Any residual acceptance requires an explicit separate Owner decision informed by the exact configuration; do not silently accept it.
2. **E: container ACL:** Codex reports broad inherited access on the host container. Confirm actual effective ownership/ACL and propose a narrowly scoped owner/SYSTEM/Administrators baseline; no wholesale disk ACL modifications or permission changes without audited local approval. Confidentiality is cryptographic when unmounted, but inappropriate access can enable theft, damage, or deletion of the container.
3. **VeraCrypt recovery:** Verify in VeraCrypt Properties that mounted `R:` actually maps to the intended `E:` container, without revealing passphrase. Produce an **offline full-container backup** and external-header backup strategy (stored securely off G:/GitHub/chat), and a non-destructive recovery rehearsal on a **copy**, never on the live backup header. Confirm separate capacity and Owner approval before copying an 8 GiB container.
4. **TLS trust anchor:** The proposed native client must use `sslmode=verify-full` and a separately retrieved, trusted and pinned **Supabase project root certificate**, matching the correct project and session-pooler hostname. A self-downloaded unverified server-supplied certificate is not an independent trust anchor; record safe, nonsecret certificate provenance and hash. Official guidance: https://supabase.com/docs/guides/database/psql .
5. **Executable provenance:** Require full exact source tree plus manifest/verifier in GitHub or separately immutable verified GitHub blob references. Before any password prompt, re-hash every script, SQL family, helper, executable and CA; fail on any changed/unlisted file or symlink/reparse path. No fallback to old unreviewed Claude scripts.
6. **Storage path and environment:** All dumps, temporary files, PostgreSQL data directories, script output, error logs and private row hashes must stay on verified `R:`. Secret must be input via Owner-only masked terminal, unavailable to supervising AI; avoid persistent global environment variables, PowerShell transcription, shell history, crash logs. Unmount cleanly afterward.
7. **Recovery limitations:** A successful logical restore is not a full Supabase platform recovery; Storage file binaries, Vault, managed Auth behavior, Edge functions/secrets and settings remain outside 010B-1 scope. Keep 011A separate and held.

## Release decision

`GATE_0_5 = HOLD`. Codex may repair and independently validate **local, non-staging** source/tooling, including GitHub publication, scoped Windows/VeraCrypt read-only checks, offline synthetic test suite, and new evidence, then return `PASS_READY_FOR_DEV4_GATE_0_5` or `REVISE/BLOCKED`. Source publication is mandatory. OS encryption, ACL changes, VeraCrypt backups/recovery operations and password entry require their own explicit local safety review/Owner actions if non-read-only.

Neither this adjudication nor Codex's reported PASS authorizes a live read-only database export to start. The 010B-1 backup-only Owner permission remains recorded but execution is stopped until Gate 0.5 passes. Staging/production mutation stays zero.
