# RUINS 001C / 010B2 — Dev4 Work5 Stalled-UI Recovery and C2.5R Adjudication

**Date:** 2026-10-24 SGT  
**Decision:** `010B2_C2_5R_SYNTHETIC: ACCEPTED_WITH_SCOPE`; `WORK5_LONG_EXECUTION: STOP_AND_CHECKPOINT`; `C3_LIVE_EXPORT: HOLD`; `011A: HOLD`.

## Independently verified recovery after user-observed Work5 stall

- Work5's latest visible chat step stated that 32 tables/35 fake rows and 13 categories restored and final regressions/evidence transfer were running. The ChatGPT Work tab was found in the user's browser list, but the connected Browser reader returned **a host security-policy block for chatgpt.com**. **Do not bypass the block or claim direct knowledge of Work's current UI/process state.**
- Crucially, the canonical Work5 C2.5R branch `work/ruins-001c-010b2-c25r-corrective-001` was independently found at remote HEAD `6050dc5efff780f92ac2e0ac18cd77775956fe0e`. The final report, original receipts and corrective implementation have been published; the report was saved in Google Drive at approximately 2026-10-24 12:37 SGT, and GitHub final HEAD recorded 12:38:14 SGT.
- Report: https://drive.google.com/file/d/1N35MqkVazbxr_VK4ZI6fln2KVc_mj5TH/view ; G: folder https://drive.google.com/drive/folders/1Fxmap3GdNSfuP4orOTwaHtTNBmG4lEO6 .
- GitHub `docs/ruins/evidence-010b2-c25r/completion-receipt.json` **confirms** `010B2_C2_5R_PRELIVE: PASS` with `RESTORE_VERIFIED`, 32 tables, 35 rows, 19 effective checks, identical completion retry; and **explicitly** `C3:HOLD`, `011A:HOLD`, `managed_supabase_recovery:UNOBSERVED_SEPARATE_GATE`.
- GitHub `state.json` contains the six required transitions in sequence: `STARTED -> DUMPS_OK -> ENCRYPTED -> DRIVE_UPLOADED_VERIFIED -> DRIVE_REDOWNLOADED_VERIFIED -> RESTORE_VERIFIED`; source/artifact/inventory SHA pins match completion receipt.
- The independent saved `c25r-protocol.out` shows 13/13 tests PASS; `c25r-producer-final.out` shows 8/8 producer-fault checks PASS. Saved `restore-receipt.json` confirms 32 tables/35 synthetic rows, full intended inventory hash, sequences, 19 effective checks and negative tests. The original ciphertext hash is `7fe9463f6451d6139308bbf47f5cf580170d562c61a709f34b080a6768c04734`.
- Work5 recorded the actual earlier stalled `docker exec -i` caused by inherited job-control stdin and fixed input-less subprocess stdin to `/dev/null`. It also preserved/repaired an exact fake `public` initdb `PUBLIC USAGE` grant in **disposable target only** after proving the original pinned fixture baseline; failed runs were not marked PASS. No live/shared permissions changed.

## Acceptance and limits

**Dev4 accepts C2.5R as a synthetic, pre-r2, logical-backup/recovery package only**, grounded in evidence published by Work5 and reviewed by Dev4. This is **not** independent reproduction of the Cloud Shell commands by Dev4; execution receipts were independently inspected. This PASS does not authorize connection to live staging or claim full Supabase project disaster recovery.

The remaining limitations are **decision boundaries**, not grounds to send another expansive programming task:

1. **Maintenance/freeze scope and authority**: a synchronized MVCC snapshot covers transactional data, but not global roles, newly created relations, nontransactional sequences or change-then-revert. For the real shared staging (RUINS, Friend, Daily Trial and SL-SIM), all writer/admin paths and ability to hold a change-free window need a specifically reviewable plan. No table-wide SHARE grants, no live traffic stop now.
2. **Durable independent private-key custody**: synthetic Work-host key-copy tests pass; actual Owner-held, separately recoverable `age` private key custody and an independent recovery challenge are not yet authorized or proven. No secret should appear in Drive/chat, GitHub or capture VM.
3. **Managed platform coverage**: disposable PG17 administrative restore is valid for proving encrypted SQL reconstructability but not managed Supabase restore, live Auth/JWT/session continuity, Storage binaries, Vault, platform-managed schema settings/extensions, Edge Functions/secrets, Realtime or post-r2 `ruins_owner` S2FIX. Do not represent a completed 32-table fake fixture as covering all 107 real tables.

## Revised SOP and smaller next tasks

- **Stop sending expansive, multi-hour Work5 packages** and avoid Codex/Claude. Work5 may be running or UI-unresponsive, but all material results for this gate are durably published. No need to restart Docker, recover the same fake data or rerun C0–C2/C2.5R.
- **Dev4 owns now:** read/adjudicate already published maintenance/custody proposal; convert it into one concise Owner decision covering time-bounded staging read-only live backup scope and proposed maintenance writer-freeze conditions, **without requesting secrets or live access in the same step**. Stay on Free plan and do not invent guaranteed managed-platform recovery.
- **Owner eventually decides, separately:** whether a finite shared-staging maintenance window is acceptable; durable encryption private-key custody arrangements. If owner declines disruption or manual key custody, propose a **more narrowly scoped application-schema-only baseline** and label the reduced recovery guarantees, rather than endless synthetic test expansion. Explicit authorization for one live external-cloud export still required later.
- **Work5 only after Owner decision:** ONE narrowly scoped operational package, with test and output narrowly bound. Return `PASS/REVISE/BLOCKED`; do not treat authorizing a maintenance decision as authorizing C3.
- **No action:** Codex, Claude. No operations on ASUS C/E/R, VeraCrypt, paid hosting, Supabase schemas/writes, GitHub Actions, deploys, production or player rewards.

**Disposition:** `C2_5R_SYNTHETIC_PASS_ACCEPTED`; `WORK5_EXECUTION_CHECKPOINT_RECOVERED`; `C3_LIVE_EXPORT_HOLD`; `011A_HOLD`.
