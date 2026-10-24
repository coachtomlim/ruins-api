# 010B2_C2_5R_PRELIVE: PASS

2026-10-24 SGT. DB Dev Work5. **PASS is limited to the synthetic pre-r2 logical-database corrective package.** Dev4 acceptance, actual shared-staging capture, managed Supabase restoration, durable Owner custody and full-project disaster recovery are not claimed.

## Authority and preserved baselines

- Governance: 394b46d487ea1ec1cfaaaebc3ae6c055f7d6c524, read in full.
- Prior C2.5 source: f508163655acdbb433bcd6b072bf697572602457, retained as branch base.
- Accepted C0-C2: d0d534a592dd5a3395f7dfee830d710e812e2a45, unchanged. Completed C0-C2 work was not rerun.
- Corrective branch: work/ruins-001c-010b2-c25r-corrective-001.
- Original capture and initial snapshot/protocol source: 7e5527c3f63c14bb51455ee8fe7d657039ceae4a.
- Successful final restore/final snapshot regression runner: dba3c17853c990ccf332b5f61437e81963a99c98.
- Final producer regression source: 226c052ea528937c534faac4bbaaf11a02582a3d; completion helper: bcba0009f2e99a2b17ed1839b697290a104aa7a0.
- Final executable/documentation/digest inventory checkpoint: 3e64a43bc268655cffdd818d5cb043c3db39f9e5. Subsequent commits add sanitized receipts and this report without replacing these execution pins.

## What passed

| Gate | Observed result |
|---|---|
| R1 source compatibility | Non-superuser postgres, SELECT-only postpilot tables, all four application schema names. No explicit SHARE locks and no source/shared grant broadening. |
| R1 snapshot/adversarial tests | 16 checks passed, including concurrent committed DML while synchronized dumps preserve the older data, later relation/DDL drift, sequence nextval, role/membership drift and ABA demonstration, keeper death, expired snapshot, pre-r2 guard and private-schema whole-dump denial. |
| R2 representative fixture | 32 tables, 35 fake rows. Realistic fake Auth users/identities/sessions/migrations; Storage buckets/objects/migrations; Friend/Daily Trial/reward tables; 12 SL-SIM tables; hosted-poc and postpilot cross-relations; project history. Separate managed/postpilot ownership, enum, view, functions, constraints, indexes, RLS, default ACLs, roles/memberships and identity sequences. |
| R2 fresh reconstruction | Fresh administrative PG17.6 target after clean capture-VM replacement. All intended object/inventory categories, all table counts/hashes, sequence positions, project history and 19 effective behavior/invariant checks passed. |
| R3 state machine | 13 tests passed. Strict state order, atomic fsynced journal, identity/artifact/inventory lineage, no early PASS, idempotent identical retry, conflicting retry/tamper/stale identity rejected. |
| R3 actual producer faults | Final 8 checks passed: input-less stdin EOF, empty/partial/nonarchive input, pipefail producer rc71, terminated producer, real timeout, receipt stdout/stderr canary redaction. Missing/failed/incomplete members and history also rejected by protocol tests. |
| R3 actual Drive boundary | Upload response identity deliberately discarded. Actual list returned one matching run-name object, owner-only metadata read back, downloaded bytes/size/hash matched. Duplicate retry left the journal unchanged and no duplicate object was uploaded. A second independently fetched file was used for recovery. This simulates lost acknowledgement at the orchestrator boundary; it does not claim Google's server dropped a response. |
| R3 independent synthetic key recovery | Primary Work copy A deleted; capture VM replaced; old source workspace/scripts and Docker cache absent. Separate temporary Work copy B decrypted and authenticated the actual independently retrieved archive in RAM. Original private identity never entered either browser/Cloud Shell, code, chat, Drive or GitHub. |
| R3 crypto negatives | Independent context rejected wrong key, wrong recipient and corrupted ciphertext. Restore context separately rejected wrong key and authenticated corruption. |
| R3 restore drift negatives | Deliberate effective ACL leak, role-attribute drift and incomplete project history detected. Modified disposable target deleted. |
| R3 final completion | Actual journal progressed STARTED -> DUMPS_OK -> ENCRYPTED -> DRIVE_UPLOADED_VERIFIED -> DRIVE_REDOWNLOADED_VERIFIED -> RESTORE_VERIFIED. Completion retry was byte-identical. All earlier observed states withheld PASS. |
| R4 reviewable package | Exact command family, reproduction steps, source hashes, tested restore path, maintenance prerequisites, key-custody decision proposal and platform exclusion register saved. |

The fixture is representative and richer than the accepted 24-table proof; it is not a replica or export of the 107 real shared tables reported by Dev4.

## Corrections and failures preserved

1. Registry provisioning exceeded the initial database-start timeout. The pinned image cache is now a preflight requirement; no timeout was interpreted as restore success. Google mirror caching of the same cryptographically pinned image was used in the disposable VM; no daemon configuration, paid registry/project or image-version change was made.
2. Background docker exec -i checks inherited the terminal and stopped on SIGTTIN. Input-less subprocesses now explicitly read /dev/null; data-bearing commands retain explicit pipes. Suspended/expired attempts were retired and fresh targets used. The final producer regression includes actual stdin-EOF behavior.
3. The first inventory comparison rejected schema metadata. A semantic check then correctly rejected a real right difference, rather than dismissing it as ordering. pg_restore --clean had recreated public without initdb's original PUBLIC USAGE baseline. The final verifier independently rebuilt the exact original fake source, matched its original raw schema pin, proved the sole missing grant, reconstructed only that original baseline right in the disposable target and rechecked owner/exploded ACL equality. Any other owner/right difference fails. Original inventory and artifact pins were retained. This is target reconstruction, not backup-credential elevation or a shared-source grant.

Failure outputs are preserved alongside final receipts. No failed attempt reached RESTORE_VERIFIED. The original ciphertext was not silently replaced during retries.

## Remaining decisions and hard holds

**NEEDS_OWNER_MAINTENANCE_WINDOW_AUTH.** Snapshot synchronization does not make global roles, nontransactional sequence operations or later DDL atomic. Pre/post equality cannot exclude a change-and-revert. The synthetic harness owned all fake writers/admin paths; no live freeze was imposed. Before C3, enumerate all shared application/Auth/Storage/job/admin writer paths, assign operators, obtain exact window/service-stop/resume authorization and abort on any unknown/unfenced path. No broader grants or read-only catalog check can replace that governance. A concrete review-only procedure is in the maintenance/custody proposal.

**NEEDS_OWNER_KEY_CUSTODY_DECISION.** The fake A/B paths share one Work host and are temporary. They prove recovery after loss of the capture environment and primary copy, not durable independently administered Owner custody. Future live policy requires Owner-generated recipient, separately recoverable private copies outside Drive/code/chat/Cloud Shell, recipient pinning, recovery challenge, lost-key response and rotation/retention rules. No live identity or password was generated/requested/stored.

Managed Supabase target restore and actual Auth/session continuity remain UNOBSERVED_SEPARATE_GATE. Storage binaries, Vault/root keys, role passwords, managed schema versions/configuration, Edge functions/secrets, Realtime/publications, project/API settings, extensions/webhooks/jobs require separate presence/absence decisions and recovery evidence. SQL metadata is not whole-project disaster recovery. Migration history is in scope and was tested, not silently excluded. Post-r2 ruins_owner/S2FIX recovery remains a future separate package.

**C3_LIVE_EXPORT: HOLD. 011A: HOLD.** This package is submitted for Dev4 review. No real authorization request or credentials are needed now; a separate C3 proposal follows technical acceptance and reviewable maintenance/custody decisions.

## Artifacts and custody

Run: c25r-20261024-001. Original ciphertext: 18,407 bytes, SHA-256 7fe9463f6451d6139308bbf47f5cf580170d562c61a709f34b080a6768c04734.
Original inventory pin: 42cc3e7f91d74a260b16966d7338d0200f6f52bc7f1acf1e7c18de57f244cda8.
Validated recovery relay: 14,935 bytes, SHA-256 a1d0c34e816b0f879915b2fb6b9d9f72f58660db6a6269d6368cea8e66a030ac.
Final Cloud-to-Work evidence transport: 3,031 bytes, SHA-256 2436404b352791b9361dad8b888e73f6875bd9e259187d8719b95fceb3b88d17.

Canonical G: destination:
`G:\My Drive\Quick Dungeon\Owner Review\RUINS_DAILY_EXPEDITION_001C\STAGING_READINESS_010\RECOVERY_010B\CLOUD_FIRST_010B2\C25R_CORRECTIVE_WORK5_20261024\`

- Folder: https://drive.google.com/drive/folders/1Fxmap3GdNSfuP4orOTwaHtTNBmG4lEO6
- Original ciphertext: https://drive.google.com/file/d/11b80mq0MxaZs_s9Y2XjXRRxlKQrDlf1s/view
- Relay ciphertext: https://drive.google.com/file/d/1Sjv2X-O7AW-Ab9UZbsi0WFcmmpoxqlst/view
- Maintenance/custody proposal: https://drive.google.com/file/d/1Ft7GZISE0haqLXIDtLk0-163a2cJKuFQ/view
- Commands/coverage: https://drive.google.com/file/d/1zcMVqyDK7N8-3yS5yF1ucjXm2uGQPMm9/view
- Final cloud screenshot: https://drive.google.com/file/d/1WUTJaFO_Gd2boFT2tRBiAq3_r0voM0G4/view

Ciphertext and nonsecret manifests alone were transferred for backup/recovery. Source files, fixture SQL and sanitized receipts were saved as implementation evidence. No plaintext database dump file was produced. Plaintext necessarily existed in bounded fake-data process memory, pipes and Docker PGDATA tmpfs. The Python harness is memory-buffered and not a hardened live-size agent; no swap/core/log forensic-erasure guarantee is claimed. Resource/containment limits and restoration exclusions are explicit in README and coverage register.

Capture/restore proof containers were removed and final name-filter output was empty. Restore-only key and relay working copy were removed from Cloud Shell; provider-ephemeral tab cleanup follows. Secondary fake key B remains only temporarily in Work scratch, outside deliverables. Retained original fake ciphertext is not guaranteed decryptable after that scratch is lost; the fixture can be rerun with a new fake key/run identity. Real durable custody remains an Owner decision. No private identity, raw transient signed download URL or actual credentials are included in the saved source/evidence package.

## Hash inventory

| Artifact | SHA-256 |
|---|---|
| restore-receipt.json | 28b2e60212e37b76fca792ed7b77a30d67998b7f78f7f81ca1f673e0eda4d74a |
| state.json | 28f3fc8d674fa9bd3d43368ac22b3ab1fe395e3c9490ab56cb689846ed2f1413 |
| completion-receipt.json | a1196c7b9a140fc818b9146f00379987f07f8dfa0fb921ee1fc089a6abf6cc86 |
| c25r-producer-final.out | e7fbd793a0d97a35a170e351cf5e0babdb195dd1685ca356f9ac27910be9f595 |
| c25r-diagnostics-final.out | d57e886361c2599a8fb75f1881c8488a75c040060ebaa38a86e20097f5782971 |
| schema-acl-diagnostic.json | 3fbfb368dd0d291e33e82d35d57322636930d44fa8093acac7bc030655100fd6 |
| C25R_FINAL_CLOUD_PROOF.png | 9e56e72d84b0f886f00c819ab612dc9e9e6486be30aaed6abe3c0aae78390a8b |

Complete per-source digests are in tools/ruins-010b2/c25r/source-hashes.json; the sanitized distribution also includes per-file evidence hashes.

## What's next

- DB Dev Work5: submit this scoped PASS, commands and maintenance/custody decision proposal to Dev4 for adjudication. Prepare a separate exact C3 proposal only after acceptance and the required decisions. Keep actual shared-staging export, managed-target recovery, post-r2 recovery and 011A gated.
- Codex and Claude: no executor task.
- Owner: no action or credentials now. Any later maintenance/custody decision will be presented as a concrete reviewed proposal.
