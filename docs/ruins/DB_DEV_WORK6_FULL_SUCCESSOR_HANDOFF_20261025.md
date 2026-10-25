# DB Dev Work6 — Full Successor Handoff and WAIT Contract

**Project:** Gitkraken Kepler Automation → Dungeon Builder / Quick Dungeon / RUINS Daily Expedition (`RUINS_001C`)  
**Successor role:** **DB Dev Work6**, succeeding the possibly unresponsive/corrupted **DB Dev Work5** Work thread and taking over **Dungeon Bravo Dev4's database backup/recovery governance responsibilities**, but **not** authorization to change the game, staging database, or infrastructure.  
**Issued:** 25 October 2026 (Singapore time)  
**Current decision:** `C2_5R_SYNTHETIC_ACCEPTED / C3_PREPARATION_PRESERVED / BITWARDEN_ACCOUNT_REPORTED_READY / AGE_CUSTODY_NOT_VERIFIED / ADMIN_FREEZE_NOT_AUTHORIZED / C3_LIVE_EXPORT_HOLD / 011A_MIGRATION_HOLD`  
**First instruction:** **WAIT FOR THE OWNER'S BITWARDEN/APPROVED-DEVICE DECISION.** This is a **planning, reconciliation and succession assignment only**. Do not use the new thread as implied permission to run any backup, key-generation, software installation, maintenance freeze, migration or deployment.

## 1. Immediate instructions to the successor

You are **DB Dev Work6**, the sole responsible successor for the cloud-first database recovery stream of `coachtomlim/ruins-api`. Read this handoff **in full** and independently reconcile the specifically pinned GitHub commits and the canonical G: evidence. The former Work5 interface may be unresponsive, but evidence survived in GitHub and Google Drive. **Do not restart Work5, repeat its long synthetic tests, or rely on an apparently running UI as proof of task status.**

**Required opening response:** confirm that you have reconciled the source and verified the following HOLDs; say precisely what you can independently verify and what remains unobservable. **Then WAIT for the Owner's decision** rather than prompting for keys or scheduling an export.

The Owner's latest binding instruction, verbatim in substance:

> Preserve the C3 preparation package. Keep C3 live export and 011A migration on HOLD. Before requesting my age key setup, reconcile the approved device boundary and compatible age version, then provide one short Owner-operated procedure for the agreed device. The exporter must receive only the public recipient. Neither private identity may enter chat or an agent session. Each independently stored private copy must decrypt the same harmless challenge and pass its checksum check. Preserve the exact governing commits, unresolved gates and HOLD boundaries in the successor handoff. Reconcile Work5's last reliable state against repository evidence and the surviving PM records. Do not dispatch the freeze notice, generate keys, install software, perform live export or run the migration under this planning instruction.

**Interpretation:** Owner reported Bitwarden Free *account* set up, **not** an `age` key pair, Secure Note populated, independent offline key copy, or recovery test PASS. Do not infer any of those steps. **No keys are to be generated in ChatGPT, Work, Codex, Claude, Cloud Shell, GitHub or Drive.** Do not ask the Owner for the private identity or for secret screenshots. A **public** age recipient (`age1...`) may eventually be supplied, but **do not request it before device/version reconciliation and a short Owner-operated procedure have been agreed**.

## 2. Project purpose and architectural boundaries

- A browser-based dungeon-building and running game with a Friends/Challenges/Daily Trial progression backend. The 001C work develops a **private** Supabase-backed Daily Expedition service, deliberately separate from pre-existing Friend, wallet/rewards, and SL-SIM features.
- **GitHub repository:** [`coachtomlim/ruins-api`](https://github.com/coachtomlim/ruins-api). GitHub is versioned source/code/governance authority; do not merge into `main` or mutate frozen public `Friend`/`S8B` game surfaces without a separate decision.
- **Shared Supabase Free staging:** project `qpgwqmduqtqidmhbuclw`, display name `Dungeon Runner S8B Staging`, region `ap-southeast-1`, PostgreSQL **17.6**, last independently checked `ACTIVE_HEALTHY` on 25 October 2026. Shared by RUINS, Friend, Daily Trial, and SL-SIM: **never treat as an isolated disposable RUINS database**.
- **Present private-schema state:** `ruins_private` schema **absent** and `ruins_owner` role **absent** in read-only catalog checks; private r2 migration remains **DRAFT** and the `011A` gate remains **HOLD**. Recheck in any future separately authorized operation—do not assume state is permanent.
- **Seven scoped schemas / 107 tables**, catalog read-only count: `public` 38, `sl_sim` 9, `sl_sim_basic1_hosted_poc` 12, `sl_sim_basic1_postpilot` 12, `auth` 27, `storage` 8, `supabase_migrations` 1. `postgres` had SELECT on all 107 at observed time; permissions and count may drift.
- **One active Supabase Edge Function** listed: `sl-sim-seat-router` (v4); not proof that no other worker or external writer exists. `pg_cron` and `pg_net` were not installed at last review. One publication and existing triggers/event triggers were observed. Do not alter any.
- **Hosting:** Quick Dungeon web assets already have HostGator/other web delivery; Vercel hosts various related projects, including `ruins-api` and SL-SIM. Hostinger account was independently inspected earlier as paid **Business Web Hosting** (not VPS) with 200GB storage, SSH/cron/Node.js/PHP/MySQL, but no confirmed PostgreSQL maintenance runtime. **No game hosting migration, VPS purchase, tier upgrade or changed DNS** follows from database backup work.
- **Cloud-first backup direction:** short-lived, interactive **Google Cloud Shell ephemeral** (not game hosting, no unattended service) for logical Postgres export/encryption/restore; only **encrypted ciphertext** plus nonsecret receipts to a private Google Drive location. No dependence on ASUS C:, E:, R: or VeraCrypt; existing Windows/VeraCrypt work is *historical only*.
- Google Drive is **not** a password vault for this workflow. No plaintext dump, private `age` identity, Auth row data, DB password, JWT, keyfile, Vault secret, HMAC key or credential in GitHub/Drive/chat/screenshots/logs.

## 3. Authoritative governing commits and source status

Verify exact refs with connected GitHub; use immutable SHAs, not floating branches. These refs were independently rechecked on 25 October 2026:

| Area | Commit SHA | Branch / role |
|---|---|---|
| Original offline 001C accepted candidate | `70b7cd4fca084bd6611cefc210f623017cf395b7` | Historical 009 fake Auth/PG integration |
| Original 001C reconciliation | `f6ffc53ceb7e654515001abe194b9cb686af721a` | Historical governance |
| 010B1 accepted Windows backup candidate | `208b8399409383a4dcf329be8270e8e8a201a101` | Retired from primary cloud path; do not run |
| 010B1 independent PowerShell preflight | `af7520af8bb23b5793807705e95ab562e00a8641` | Historical ASUS/VeraCrypt tests only |
| Dev4 independent 010B1 adjudication | `bbe5aadd1f4f6514a2533904f7729d448477c8ee` | Historical gate decisions |
| **010B2 cloud-first design authority** | **`96731577b6f8fcdc3755daf953329d6fadf0e9aa`** | `work/ruins-001c-010b2-cloud-first-design-001` |
| **Work5 C0–C2 synthetic PASS** | **`d0d534a592dd5a3395f7dfee830d710e812e2a45`** | `work/ruins-001c-010b2-cloud-synthetic-001` |
| Work5 first C2.5 pre-live attempt | `f508163655acdbb433bcd6b072bf697572602457` | `REVISE`; NOT final success |
| Dev4 C2.5R corrective contract | `394b46d487ea1ec1cfaaaebc3ae6c055f7d6c524` | `work/ruins-001c-010b2-dev4-c25r-adjudication-001` |
| **Work5 final C2.5R synthetic PASS** | **`6050dc5efff780f92ac2e0ac18cd77775956fe0e`** | **`work/ruins-001c-010b2-c25r-corrective-001`** |
| Dev4 independent recovery after stalled Work UI | `afb31cb4e59d39b6da9f00c9b340053ae9423aec` | Work5 final receipt independently reviewed |
| Dev4 C3 low-disruption scope/Owner decisions | `4883d2a32096cd4941b75f7778a46b22f4d49741` | `work/ruins-001c-010b2-dev4-c3-owner-decision-001` |
| Dev4 A/B administration/custody preparation | `895dcc8e6b29cbeb01c68e6c08a3e4f76972ff9a` | `work/ruins-001c-010b2-dev4-ab-preflight-20261025` |
| **Bitwarden Free manual key-custody policy** | **`5f7af761dfa68c6c13b0d7d46b2c60f96e72443c`** | `work/ruins-001c-010b2-dev4-bitwarden-free-custody-001` |
| C3 offline preflight gate: 18 tests | `7ce638c1217b38c33211558d2246c51cd189487c` | `work/ruins-001c-010b2-dev4-c3-preflight-20261025` |
| C3 preflight v2 hardening: 31 tests | `5a3f4261360fa2426e730241eff2147b7d22cb77` | `work/ruins-001c-010b2-dev4-c3-hardening-20261025` |
| Dev4 deployment/freezing dependency audit | `b9d76b25df1495f046640558ba19b2416b3964c4` | `work/ruins-001c-010b2-dev4-freeze-dependency-20261025` |
| **Latest C3 Owner public-challenge/freeze preparation** | **`119e93203f0dd66c1b13cc468a2e4f161f4d151b`** | **`work/ruins-001c-010b2-dev4-custody-challenge-20261025`** |

**Do not confuse:** the latest `119e932...` is a documentation/test-only preparation commit, **not** an accepted live C3 backup candidate or authorization. Current repository governance is a network of task-specific branches; do not merge/move refs as a “cleanup” step without a separate approved integration plan.

**Private r2 draft checksum (historical hard stop):** `e1ef979945cb0b0c89155e80b69fd1f779e5c5d512f02c4f44436440c602cb57`. It remains in `supabase/drafts`, **not** a live migration. Do not grant `postgres` access to `ruins_private` as a backup workaround. Post-r2 stock whole-project CLI dump was proven to fail; a separately audited `ruins_owner` split-backup S2FIX is required after any future r2 release.

## 4. Work5's last reliable state — reconstruct from evidence, not the damaged UI

The Work5 thread's last *visible* progress text described a background Docker `exec -i` job-control stall, a fix to use `/dev/null` on input-less commands, a schema ACL mismatch due to loss of PostgreSQL initdb's `PUBLIC USAGE` baseline, and eventual **32 table / 35 fake row** fresh restore while receipts were being transferred.

Dev4 then found that **Work5 had actually finished and published the final result** despite the unresponsive/“offline” chat UI:

- **Final Work5 GitHub remote head** `6050dc5efff780f92ac2e0ac18cd77775956fe0e` was independently verified. Full GitHub completion receipts are under `docs/ruins/evidence-010b2-c25r/`.
- **Final G: report** [`RUINS_010B2_C25R_WORK5_RETURN_20261024.md`](https://drive.google.com/file/d/1N35MqkVazbxr_VK4ZI6fln2KVc_mj5TH/view), and [C25R evidence folder](https://drive.google.com/drive/folders/1Fxmap3GdNSfuP4orOTwaHtTNBmG4lEO6).
- Final `completion-receipt.json`: **`010B2_C2_5R_PRELIVE: PASS` for *synthetic pre-r2 logical database recovery only***. Journal: `STARTED → DUMPS_OK → ENCRYPTED → DRIVE_UPLOADED_VERIFIED → DRIVE_REDOWNLOADED_VERIFIED → RESTORE_VERIFIED`.
- **32 fake tables, 35 fake rows**, 13 inventory categories, 19 effective privilege checks; **13/13 completion-protocol tests**, **8/8 producer-fault checks** passed. Original fake ciphertext SHA-256 `7fe9463f6451d6139308bbf47f5cf580170d562c61a709f34b080a6768c04734`; inventory pin `42cc3e7f91d74a260b16966d7338d0200f6f52bc7f1acf1e7c18de57f244cda8`.
- Original failures (image pull/start deadline, SIGTTIN job control, real `public` ACL mismatch) were preserved as negative evidence. The initial assumption of simple ACL-order differences was correctly rejected; only the proven original fake `PUBLIC USAGE` grant was reconstructed on the **disposable restore target**. No shared-source ACL was touched.
- No actual staging connection/export/credential, managed Supabase restore, paid resource, ASUS C/E/R operations, Edge deployment, wallet write, or 011A migration occurred.
- Browser connector listed Work5's ChatGPT tab but refused content access under its **host security policy**. **Do not attempt to bypass that restriction.** Its live running/corrupted UI state remains **unobservable**; the reliable completed output is the **published GitHub/G: receipts**. Work5 can remain stopped; **do not poll/restart, re-run C2.5R, or infer an unfinished stage**.

**Accepted and still limited:** generic synthetic encrypted logical backup + fresh disposable PostgreSQL 17.6 recovery. **Unproven:** first real 107-table staging export, recovery to a *managed Supabase project*, live Auth/JWT/session continuity, Storage file binaries, Vault/root encryption keys, role passwords, Edge/deployment configuration, Realtime settings, full-platform disaster recovery, and post-r2 private-schema split backup. These are not silently included in the PASS.

## 5. C3 preparation already preserved — do not repeat or damage

The latest preparation packages include:

1. **C3 preflight v2** (31/31 bounded tests), `tools/ruins-010b2/c3_preflight_v2/` at `5a3f426...`. This is a **non-secret, offline, fail-closed readiness checker**. It rejects wrong project/version/table counts, drift, missing freeze acknowledgements, stale custody tests, a missing recipient fingerprint and attempted automatic authorization. It can at most return `READY_FOR_SEPARATE_AUTHORIZATION_REVIEW`. **It cannot authorize C3 or 011A.** Real source catalog checks must be refreshed near an authorized window.
2. **Bitwarden Free custody manual**, `docs/ruins/RUINS_010B2_BITWARDEN_FREE_KEY_CUSTODY_MANUAL_20261025.md` at `5f7af761...`. Owner has **set up Bitwarden Free account**. No actual `age` identity or independent recovery success has been reported. Do not generate a private key for the Owner in any agent environment.
3. **Deployment freeze audit**, `docs/ruins/RUINS_010B2_DEV4_DEPLOYMENT_FREEZE_AND_BITWARDEN_NEXT_STEPS_20261025.md` at `b9d76b25...`. The RUINS repo `vercel.json` sets `git.deploymentEnabled=false`; Vercel has RUINS/SL-SIM projects including active production SL-SIM deployments. No `.github/workflows` directory found on `main` of either RUINS or SL-SIM repo at audit time. These findings **reduce, but do not eliminate**, migration/DDL risk from manual deploys, SQL editor, other branches or connected services. Do not dispatch a freeze notification under this handoff.
4. **Latest harmless public challenge**, `tools/ruins-010b2/c3_custody_challenge/` at `119e932...`: `recovery_challenge.txt`, `challenge_manifest.json`, `verify_recovery.py`, README and local checksum-verifier test evidence. It contains **no private identity, no public Owner recipient, no real encrypted artifact**, and is **not** a successful `age` cryptographic recovery drill. A separate v2 `public_challenge.py` under C3 preflight uses simulated encryption subprocesses; its tests were **mocked**, not a real encryption/decryption test.
5. **A policy**: limited **administrative schema/role/permission/migration freeze** over shared staging during a later explicitly approved pre-r2 backup; ordinary application transactions may continue as captured by synchronized PostgreSQL MVCC snapshots. **No actual freeze was started or authorized.** Global roles, DDL and sequences are not guaranteed coherent solely by an MVCC snapshot; catalog change-and-revert cannot always be detected. Never claim full point-in-time Supabase recovery.

**Current offline C3 result:** `C3_PREFLIGHT_HOLD` with missing Owner custody proof, operator acknowledgements, exact maintenance window and independent live C3 approval. There is no need to add more synthetic engine features merely to keep an agent busy.

## 6. Canonical Google Drive evidence locations

All below are **existing verified** folders. Use connected Google Drive tools (not guessed sandbox paths) for reading.

| Area | G: / Drive |
|---|---|
| Root | `G:\My Drive\Quick Dungeon\Owner Review\RUINS_DAILY_EXPEDITION_001C\STAGING_READINESS_010\RECOVERY_010B\` |
| Cloud-first C0–C2 decision | [CLOUD_FIRST_010B2](https://drive.google.com/drive/folders/1Ipeg38MnCWb4l82IDtWgXc-OGxzlUtfm) |
| Work5 C0–C2 proof | [SYNTHETIC_PROOF_WORK5_20261024](https://drive.google.com/drive/folders/1eOw9M356YhkP-VAQJTxpPEy0x5WoJhxz) |
| Work5 C2.5R final proof | [C25R_CORRECTIVE_WORK5_20261024](https://drive.google.com/drive/folders/1Fxmap3GdNSfuP4orOTwaHtTNBmG4lEO6) |
| Dev4 C3 scoping | [C3_DEV4_DECISION_20261024](https://drive.google.com/drive/folders/1OEy7878LcFD6zZkP6oWU4akb1DoPi7Ae) |
| Dev4 A/B preflight | [AB_DEV4_PREP_20261025](https://drive.google.com/drive/folders/1_InCLM4m6Ypq3BGyXoGM9QBLJlS1IQuY) |
| Bitwarden Free manual | [B_BITWARDEN_FREE_OWNER_SETUP](https://drive.google.com/drive/folders/18lfiSLeKPS-cR5NBCIL762KySpB_bzdr) |
| C3 offline preflight (18 tests) | [C3_OFFLINE_PREFLIGHT_20261025](https://drive.google.com/drive/folders/1YMfZEBRKnwDCJhufZx5vf3bvMrjXUwDX) |
| C3 preflight v2 (31 tests) | [C3_PREFLIGHT_HARDENING_20261025](https://drive.google.com/drive/folders/1uI6cPHiBf6lGPaSA7eOodPtaq7CRWnbR) |
| Freeze dependency audit | [DEPLOYMENT_FREEZE_ADDITIONAL](https://drive.google.com/drive/folders/1pbu8GEVpUSNXHg1kPLsX5zgdfbDOO9I6) |
| Harmless recovery challenge | [CUSTODY_CHALLENGE_AND_FREEZE_DRAFT_20261025](https://drive.google.com/drive/folders/1jV5meGt_iekGkEHCBbjRUNnYLR_SP741) |

**No secrets** belong in any of these folders. Historical synthetic ciphertext is **not guaranteed recoverable** because its throwaway synthetic key may be intentionally destroyed. It is a test receipt, not the live database backup.

## 7. Age/Bitwarden device and version reconciliation — before asking Owner to set up keys

**Mandatory successor task, but only read-only/planning until Owner agrees:**

1. Establish the **approved device and platform** on which the **Owner** will privately generate an age identity and perform two decryptions. The user explicitly prohibited touching ASUS `C:`; earlier guidance also excluded ASUS `E:`/`R:`/VeraCrypt. Existing text suggests a **trusted non-ASUS environment** but does **not** conclusively designate one device. **Do not quietly substitute a device.** Check surviving Owner/PM records first; if still unresolved, present a single specific device choice for Owner approval. Do not instruct installation or storage until approved.
2. Verify platform compatibility with the **official `age` CLI** and exact supported version/packaging **for that device**. The synthetic cloud harness used **age 1.1.1** (pinned at test time), but **that is not authority for the Owner device in 2026**. Confirm key generation, `age-keygen -y` public recipient extraction, `age -r` encryption, `age -d -i` decryption, filename/clipboard/terminal and secret-storage hygiene using upstream official documentation. Do not assert that the app supports age if it has not been verified. Do not install anything during this planning step.
3. Only after device/version agreement, issue **one short, Owner-operated manual procedure** suited to that device, with no generated keys in chat: privately generate one `age` identity; store full identity in Bitwarden Free Secure Note; create independent protected **offline** copy of the **same identity** (not a second unrelated identity); keep Bitwarden master password and 2FA recovery separately protected; derive/share only the public recipient/fingerprint after both copies exist; perform two independent decryption checks against the **same harmless challenge** and compare each plaintext SHA-256 to the source manifest. For the offline test, do not rely on unlocking Bitwarden as the source of key material. Leave detailed device-specific paths out until the device is agreed.
4. Both private copies must stay **outside chat, every agent/work/Cloud Shell session, GitHub, Google Drive, email, screenshots and logs**. The capture/exporter will receive **only the public `age1...` recipient**, never either private identity. A public recipient is not authorization to use it for a live export.
5. A sanitized Owner status report may say: `PRIMARY_CHALLENGE_PASS`, `INDEPENDENT_OFFLINE_CHALLENGE_PASS`, date, and public recipient fingerprint. Never request the raw identity. Success is Owner-attested until an independently verifiable, privacy-preserving procedure is agreed; never pretend the model observed the private decryptions.

**Do not prematurely instruct installation, key generation, software migration, offline-custody handling or transmission of the public recipient** in the opening successor answer. The device/version reconciliation is first and requires the Owner's device decision if records do not already establish one.

## 8. Administrative freeze A — current state and limitations

- **Recommended limited freeze:** prevent **intentional administrative DDL, migrations, grants/roles/policies, extension or publication changes, and deployments with database-migration hooks** during a later named, short, approved capture interval. Do not automatically stop Friend, Daily Trial, RUINS, Auth, Storage or SL-SIM gameplay/login activity.
- Staging already contains **107 shared tables** and related trigger/function infrastructure; corresponding owners/PMs must acknowledge change freeze. Operators: Supabase admin, RUINS/Friend/Trial, SL-SIM, relevant deployment owners. One person may fill multiple roles but must explicitly attest each responsibility. Unknown autonomous schema writers are NO-GO.
- No freeze notices have been sent; no operator approvals received; no start/end window chosen. This is **design**, not active coordination. **Do not dispatch any notice under this handoff instruction.**
- A SQL logical baseline with synchronized snapshots is **not** exact full-cluster atomic capture of global roles/sequences and does **not** include storage binaries, managed Auth continuity, platform config, Vault or Edge secrets. No general “all systems backed up” claim.

## 9. Explicit HOLD and permission matrix

| Action | Current status | Who can authorize |
|---|---|---|
| Read public docs / connected GitHub and sanitized G: evidence | Allowed read-only | Successor under project SOP |
| Read-only Supabase *catalog metadata*, if needed for reconciliation | Allowed; avoid player/secret rows | Successor within prior scoped observation; document provenance |
| Inspect Owner's Bitwarden entries/private identity | **FORBIDDEN** | Do not request |
| Generate or paste live `age` private identity | **FORBIDDEN under this instruction** | Only Owner privately after device/version agreement |
| Install age or another tool | **HOLD** | Separate device-specific Owner agreement |
| Send administrative-freeze notices / pause services | **HOLD** | Separate Owner/operator permission |
| Create/change Supabase roles, grants, schemas or migrations | **HOLD** | Separate Owner-approved migration contract |
| Export real data to ephemeral Cloud Shell/Drive | **C3 HOLD** | **New explicit bounded C3 authorization**; prior ASUS 010B-1 approval is NOT applicable |
| Execute `011A`/private r2 release or post-r2 split backup | **HOLD** | Separate migration/backup governance and recovery gate |
| Modify ASUS C/E/R or VeraCrypt | **FORBIDDEN for this project path** | Not contemplated |
| Start Codex/Claude/another Work executor | **NO TASK** | Only if a future truly unavailable capability requires a new bounded assignment |
| Mission Control observation integration | **IDEATION ONLY** (`INVESTIGATE later`) | No integration or Gamma credential copying |

## 10. SOP, continuity and reporting

1. **Direct action first:** successor must personally do what connected GitHub, G:, read-only Supabase metadata and browser tools permit; no repetitive Codex delegation. Preserve exact commits, test receipts and checksums. Save artifacts to GitHub/G: only after verifying publication.
2. **No pretend background polling.** Work5 may be corrupted; do not promise live observation of its ChatGPT page. Its last reliable state is the GitHub/G: C2.5R PASS described above.
3. **Read-only, no secrets:** no copying Gamma/Mission Control permissions or credentials and no Mission Control dependency. Future candidate read-only receipt monitor may be assessed separately; unrelated to this gate.
4. **Avoid excessive multi-hour assignments:** Work5 appeared hung when its large test was already done. Split future work into narrow gates with named checkpoints, especially if a user authorization is required.
5. **Stop at this Owner boundary:** once latest commits/evidence and device/version options are reconciled, report **`SUCCESSOR_READY_WAITING_FOR_OWNER_DEVICE_AND_BITWARDEN_DECISION`**. Do not generate a key or request it; do not give an age installation command until the Owner confirms the device and it is verified compatible.
6. **End every substantive return with `What's next`**, separating successor, Owner, Codex (none unless needed), and the C3/011A HOLDs.

## 11. What the successor should say on its first turn

> I am DB Dev Work6. I verified Work5's C2.5R **synthetic-only PASS** from immutable GitHub/G: evidence, the latest C3 preflight and challenge preparation source at `119e93203f0dd66c1b13cc468a2e4f161f4d151b`, and the explicit **C3 live-export HOLD / 011A migration HOLD**. Bitwarden Free account setup is reported complete; actual age identity and dual independent private-key recovery are **not** yet verified. I will **WAIT** for the Owner's approved device decision. Before any key instructions, I will reconcile the device boundary and compatible age version, then give one concise, private Owner-operated procedure. I will not dispatch a freeze, install software, generate keys, export data or migrate staging without separately explicit authority.

If the current context permits direct confirmation of an agreed device, specify the supported version; otherwise ask **only the essential device question** in a future turn, without assuming that ASUS may be touched.

## 12. Next gates **after** future Owner choices (not authorized now)

1. Owner selects device and approves precise procedure, independently sets up Bitwarden + offline age identity, passes both identical harmless-challenge decrypt/hash checks; successor records **sanitized attestation only** and does not possess a private key.
2. Responsible operators coordinate and approve a short administrative hold—**not** automatically a full shutdown. Identify all migration/DDL paths and ensure affected project leads acknowledge. No notice without approval.
3. Independently re-verify current staging catalog/TLS identity, command SHA/resource bounds, recipient fingerprint, nonsecret inventory, and post-r2 absence. If `ruins_private` has appeared, stop and route to separately approved S2FIX.
4. Submit a **separate one-time C3 live export authorization request** specifying scope, timeframe, read-only extraction, ciphertext-only private Drive storage, temp cloud processing, independent disposable restore, exact exclusions, credentials entered privately, freeze/abort and cost boundaries. **Never interpret Owner's device/custody agreement as C3 approval.**
5. Only after a real backup has been authorized, executed, retrieved and genuinely restored, assess the separate `011A` migration and the post-r2 split recovery approach. Until then **HOLD**.

---

**Succession disposition:** `DB_DEV_WORK6_HANDOFF_READY / WAIT_FOR_OWNER_BITWARDEN_DEVICE_DECISION / WORK5_C25R_SYNTHETIC_ACCEPTED / C3_LIVE_EXPORT_HOLD / 011A_HOLD`.
