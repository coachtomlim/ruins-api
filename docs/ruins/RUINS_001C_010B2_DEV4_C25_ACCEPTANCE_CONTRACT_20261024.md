# RUINS 001C / DB Dev Work5 — Dev4 independent C0–C2 adjudication and C2.5 acceptance contract

**Date:** 2026-10-24 (SGT)  
**Verdict:** `CLOUD_SHELL_SYNTHETIC_PASS: ACCEPTED_WITH_SCOPE`; `C2_5_LIVE_PACK: NOT_PROVEN`; `C3_LIVE_EXPORT: HOLD`; `011A_MIGRATION: HOLD`.  
**Executive ownership:** DB Dev Work5 implements the next package **directly in the existing Work thread**; Codex and Claude have no task.

## Verified source and evidence

- Repository `coachtomlim/ruins-api`; Work5 source branch `work/ruins-001c-010b2-cloud-synthetic-001` at `d0d534a592dd5a3395f7dfee830d710e812e2a45` (remote verified). Implementation code `tools/ruins-010b2/synthetic-proof.py` and fixture reviewed directly. Latest commit adds its reproducibility README.
- Work5 report: https://drive.google.com/file/d/1fk8rAIOXH9D9oZuleM4qzFDHe4LRtH54/view ; evidence index: https://drive.google.com/file/d/1W21wkWr-odQOFCTeU-AV3uUgwx3hlMSP/view ; proof folder: https://drive.google.com/drive/folders/1eOw9M356YhkP-VAQJTxpPEy0x5WoJhxz .
- C0: actual ephemeral Google Cloud Shell; Docker-provided PostgreSQL 17.6 pinned image, no Cloud API permission or new paid project.
- C1: age-authenticated encryption; synthetic ciphertext SHA-256 `5e80fd8de3eae6411eedbf6177d7acae7ab0cf4861eee52a44a72dc900a1e3c6`; private Drive upload and authenticated independent re-download matched. No plaintext data or decryption key was put in Drive.
- C2: restored 24 fake tables and 25 rows; 10 inventory categories, 9 authorization checks, 7 negative cases. The dummy source was discarded before restore and verification used the retrieved ciphertext, not a local shortcut.
- No real Supabase connection, credentials, database export, migration, ASUS drives, infrastructure purchase, or game/production mutation. Managed staging target is `qpgwqmduqtqidmhbuclw`; `011A` remains unauthorized.
- This was a **generic synthetic complete bootstrap-superuser custom dump**. It was **NOT** a validated live Supabase restricted-role/stock-CLI F1–F4 recipe. A restricted fake backup_reader was correctly denied `ruins_private` to illustrate the 010B S2 problem.

## C2.5 required work — perform, don't just plan

**A. Pin the prospective PRE-r2 live command family.** Use synthetic PostgreSQL 17.6 with a managed-like non-superuser `postgres`; do not require superuser-only privileges for the proposed live operation. Reproduce precise role, custom schema, Auth/Storage row data and migration-history export semantics. Include all FOUR existing application schema families (`public`, `sl_sim`, `sl_sim_basic1_hosted_poc`, `sl_sim_basic1_postpilot`) in the plan, not just the smaller fake schemas. Use version-pinned commands and explicit fail-closed empty/error checks. The draft r2 SHA-256 `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57` remains unchanged and outside active migrations.

**B. Prove source consistency.** Real source may be concurrently writing Friend/Trial/SL-SIM tables. Separate `pg_dumpall`, schema, data and migration-history captures do NOT automatically share one snapshot. Choose and fully test either a justified single consistency/snapshot protocol or an approved no-writer window, with explicit fail-closed concurrent-write and DDL drift tests. A superficial `COUNT(*)` pre/post equality alone is insufficient. Do not pause or mutate live services without separate Owner authorization. Demonstrate a lost response and interrupted export do not mark archive complete.

**C. Persistent independent key recovery.** The C0–C2 throwaway age key was destroyed; the retained historical fake ciphertext is intentionally not recoverable. For the live design, use an Owner-controlled public recipient and **at least one separately recoverable private-key copy**, stored outside Drive, code, chat and ephemeral Cloud Shell. Using two synthetic independent custody contexts, prove archive recovery after deliberate destruction of the capture VM and its working key material. Define safe handling, lost-key response, key rotation and pinning. This is a synthetic rehearsal only; do not ask the Owner to share or generate a real secret yet.

**D. Contain plaintext.** Make the prospective streaming capture → compressor → `age` data flow explicit. Prove shell `pipefail`, exit code propagation, stdout/stderr redaction and archive manifest authentication. Bound memory, `/dev/shm`, disk, Docker and Work scratch exposure; never claim no plaintext ever exists in memory. Move **only ciphertext and nonsecret manifests** into Drive; assert Drive folder ACLs and retrieval integrity. Do not use a live staging DB endpoint in these tests.

**E. Fresh restore and declared coverage.** Rehearse from the independently fetched encrypted artifact in a fresh isolated PostgreSQL 17.6 target with checks for all in-scope objects, roles, effective privileges/RLS, sensitive Auth/Storage *row* data using fake fixtures, sequence positions, migration history and per-table row hashes. Identify platform-dependent features **not** restored by database dump: Storage binaries, Vault/root key, Auth/JWT/session configuration, role passwords, managed schema definitions/versions, Edge functions/secrets, Realtime/publications, API/project configuration. Decide whether each gap blocks recovery of shared staging, requires separate backup evidence, or is an explicitly accepted exclusion **before** requesting live approval.

**F. Test after-r2 restriction without weakening security.** Re-demonstrate that stock whole-project backup fails after r2 and that the separate `ruins_owner` split-recovery path (S2FIX) is a **future** gated package. Do not connect this C2.5 pre-r2 process to a system where r2 already exists; fail closed. No broad grants for backup convenience.

## Exit conditions

- An exact source-pinned candidate **pre-r2** command pack, a synthetic transcript with positive and adversarial results, a testable snapshot-consistency protocol, independent synthetic key-recovery proof, and an executable encrypted-artifact recovery runbook.
- Source code and sanitized evidence in distinct 010B-2 GitHub branch and G: folder, each verified readback/hash. The README and current C0–C2 accepted source must remain reproducible.
- Deliver `010B2_C2_5_PRELIVE_PACK: PASS | REVISE | BLOCKED`. Only `PASS` allows DB Dev Work5 to submit a revised **Owner authorization proposal**. Do not execute C3 or request a real database password on an unapproved proposal.
- `011A` cannot proceed merely because C2.5 passes; it also needs the separately authorized real data capture+recovery and a post-r2 backup design.
- New permanent infrastructure, billable service, GitHub Actions minutes and ASUS C/E/R/VeraCrypt operations are all excluded. Codex is not needed unless Work demonstrably cannot execute a bounded technical step.

**SOP:** DB Dev Work5 performs all directly available research, code review, implementation, synthetic testing, G: upload and GitHub publication. Save frequent checkpoints. The Owner is not asked to repeat decisions or approve real export until the exact package is ready.
