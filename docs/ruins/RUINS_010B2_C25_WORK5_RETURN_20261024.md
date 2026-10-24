# 010B2_C2_5_PRELIVE_PACK: REVISE

Date: 2026-10-24 SGT. DB Dev Work5. Contract 61c5d8f01a56e965df97643dc3322ec821309ebc read in full. Accepted C0-C2 source d0d534a592dd5a3395f7dfee830d710e812e2a45 remains unchanged and reproducible.

## Result

Implementation and synthetic execution performed directly through Work tools. No delegated Codex/Claude executor, real Supabase connection, credential request, data export, billing change, ASUS-drive access, migration or wallet/production change.

| Area | Actual evidence | Verdict |
|---|---|---|
| PG17.6 non-superuser capture | 18-check diagnostic, shared snapshot for schema/data/history, all four application schema family names | Diagnostic PASS |
| Adversarial consistency | UPDATE/ALTER blocked; new-table and sequence drift detected; expired snapshot rejected; post-r2 whole dump denied | Diagnostic PASS; complete live consistency NOT PROVEN |
| Encryption | pg_dump/pg_dumpall stdout -> gzip -> age; bash pipefail; rc71 producer failure removes partial output; encrypted manifest | Synthetic PASS |
| Drive transfer | Owner-only folder/file ACL readback; independent authenticated download; exact 8,915-byte size and SHA-256 | PASS |
| Independent key recovery | Key never entered capture VM; original Work custody A removed; separate Work custody B decrypted actual downloaded archive in memory | Synthetic PASS; durable independent custody NOT PROVEN |
| Capture environment destruction | Cloud Shell clean restart; replacement ephemeral VM reports old /dev/shm workspace and /tmp capture script absent, Docker image cache empty | Observed replacement PASS, no forensic erasure claim |
| Fresh restoration | Downloaded archive decrypted externally and reencrypted to new restore-VM public recipient; relay uploaded/retrieved; fresh PG17.6 target; seven tables/fourteen fake rows; per-table hashes, sequence positions, role metadata, membership, ACL/RLS comparison | PASS with bootstrap restore ONLY |
| Custom role reconstruction | app_member removed from target baseline and recreated from captured role SQL/membership lines | Scoped PASS; managed role definitions remain baseline-supplied |
| Negative restore tests | anon denied, managed Auth read denied, wrong key rejected, authenticated corruption rejected, read-only managed-role restore rejected | Five checks PASS |
| Live pack readiness | Managed-role locks and restore permissions unresolved; generic records fixture; full global consistency and completion state machine incomplete | REVISE |

## Why no live authorization proposal

1. A separately owned Auth table denied SHARE locking to the backup role. Existing-table locks also do not prevent new-relation DDL or nextval. Role dump does not use the common snapshot. No-writer/no-DDL/no-role-change fencing, ABA conditions and lost-response completion protocol remain unproven. No broad grants were added to bypass these findings.
2. Restoring managed data under the read-only modeled postgres baseline failed. Fresh reconstruction succeeded with the disposable bootstrap administrator. That proves archive recovery but does not validate the exact managed Supabase restore command family.
3. The new fixture represents schema families with generic records tables. It is smaller and less realistic than accepted historical fixtures, and does not establish actual Auth/Storage shapes, migration semantics or every required object class. No substitution of this seven-table result for the accepted 24-table C0-C2 proof is intended.
4. The key-copy rehearsal used two separate paths on one Work host outside Cloud Shell. It does not satisfy independently administered durable Owner custody. Key B remains only in temporary Work scratch for this synthetic checkpoint; no durable recovery is promised if that scratch is lost. No real secret was requested.
5. Full timeout/interruption/lost-response and stdout/stderr-redaction adversarial coverage, live-size resource bounds, recipient lifecycle and all recovery exclusions require closure. Recovery coverage register identifies the missing platform dependencies explicitly.

No Owner authorization proposal submitted. C3 live export and 011A remain HOLD.

## Verified source and hashes

Branch: work/ruins-001c-010b2-c25-prelive-001.
Execution pins: probe a1946a29c99a2a3b306344c1b3c7de9b26b8b11f; capture stream d1831575bd8a4a708641f7e607fc762fb41f6dd9; recovery relay 23ba444cb2bf5c0d3cb130ba8b2fc3a9a22d1e32; final restore e0c8ed043d402e47efe225abc95a2ab31be9774b.

| Artifact | SHA-256 |
|---|---|
| probe.py | 1b209c0358c54057a46c5224c4efc112b56917f58c879a528f4cc852236ae041 |
| probe stdout | 9148d2c262cf0a2b12f3eb8cbc688c66cf0b88543934cee7bfea3a77589134b3 |
| stream.py | 24fae1c16a4d42feb6aa81836860902c5b947fec1ce77e20ab5bbbed44ddf494 |
| recover.py | 7f331a3a3cc2f9dac21ae6537ad597e61632b8b6f9f40332b3864ed203eb8413 |
| restore.py | d17373e366f68b6993c65c7d9e5620981662953a79de4caf62a80accdea90e27 |
| original Drive ciphertext bundle | d5e2af458878eca5059f3af766ebf9a1bd02006e84f1c557c5b0b76ab2f4ffb7 |
| recovery relay ciphertext, 4,436 bytes | db4e609ad621daadfa3c13041cf7d1ba499f2b8a882c4393595170c18b5db4ae |
| final restore stdout JSON | b0bfbbe88abc54907fdfc44f17383ea21bdb75535029e7ac23465faefbbead5f |
| terminal screenshot | 962ac6d861702836d81e00ec4845b2b721d3853be6a0df3869589c938c75e0cc |

Restore stdout reconstructed as canonical JSON in Work scratch and its exact hash matched the independent Cloud Shell stdout hash. Signed transient download URLs are not part of saved receipts. Keys are not in these artifacts.

## Evidence destinations and cleanup

Canonical folder: G:\My Drive\Quick Dungeon\Owner Review\RUINS_DAILY_EXPEDITION_001C\STAGING_READINESS_010\RECOVERY_010B\CLOUD_FIRST_010B2\C25_PRELIVE_PACK_WORK5_20261024\

Drive folder: https://drive.google.com/drive/folders/1Epe8xGSpL4Big-wEKWgywj_iDMoQLnvA
Original ciphertext: https://drive.google.com/file/d/1lQLM8CC1X_h93iW4UT0igY6lYGLbBJVc/view
Recovery relay: https://drive.google.com/file/d/1QdHHqAH4uld8pUrSaEE3IdPgoZtlucd3/view
Screenshot: https://drive.google.com/file/d/1kMa_cWOSyli_WAyfZw0SVHZV_Vpkc5qC/view
Checkpoint 02: https://drive.google.com/file/d/1iQQIbsZPqxNuxUcZB-90sS5y4E0yIXwZ/view

No source/restore database containers remained in the final name-filter check. Restore key, wrong key and relay working copy removed from Cloud Shell; terminal printed RESTORE_KEY_AND_RELAY_REMOVED. Capture VM was replaced earlier. External key B is intentionally temporary and is not uploaded. Public tools/cache and sanitized receipts need not be treated as secret; no secure physical erasure claim is made.

## What's next

- DB Dev Work5: implement a complete, testable consistency/fencing and completion protocol, realistic managed fixtures and target permission reconciliation. Re-run full independent recovery against expanded inventory; close the exclusion decisions. Retain this REVISE evidence rather than rewriting it as acceptance.
- Codex and Claude: no executor task.
- Owner: no action or credentials now. Review a live proposal only after every C2.5 gate passes.
