# RUINS Daily Expedition 001C — Dev4 A/B Operational Preparation

**Prepared:** 25 October 2026 (Singapore)  
**Responsible:** Dungeon Bravo Dev4  
**Scope:** A — low-disruption shared-staging administrative change freeze; B — Owner-held `age` decryption key custody.  
**Authority:** Owner approved proceeding with A/B preparation **in principle**. No real freeze, new key, export, credential request or Supabase change was authorized.  
**State:** `A_POLICY_PREPARED / A_ACTUAL_WINDOW_NOT_AUTHORIZED / B_CUSTODY_CONTRACT_PREPARED / B_REAL_KEYS_NOT_CREATED / C3_LIVE_EXPORT_HOLD / 011A_HOLD`.

## 1. Authority and independent live inventory

- Project: `Dungeon Runner S8B Staging`, Supabase Free, `qpgwqmduqtqidmhbuclw`, `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.166 (read through authenticated project metadata, 25 October 2026).
- **Pre-r2**: `ruins_private` schema and `ruins_owner` role both absent at prior and current catalog inspection. Recheck immediately before any separately authorized live operation.
- Across the seven scoped schemas there are **107 database tables**; the role `postgres` has SELECT on all 107 as observed by Dev4 read-only catalog queries on 24 October. This establishes no permission to export now, and not a guarantee of object access at future execution time.

| Schema | Tables | Non-internal triggers | Functions | SECURITY DEFINER functions |
|---|---:|---:|---:|---:|
| `public` | 38 | 3 | 33 | 19 |
| `sl_sim` | 9 | 0 | 0 | 0 |
| `sl_sim_basic1_hosted_poc` | 12 | 2 | 1 | 0 |
| `sl_sim_basic1_postpilot` | 12 | 2 | 1 | 0 |
| `auth` | 27 | 1 | 4 | 0 |
| `storage` | 8 | 7 | 19 | 0 |
| `supabase_migrations` | 1 | 0 | 0 | 0 |
| **Total** | **107** | **15** | **58** | **19** |

- One deployed active Supabase Edge Function: `sl-sim-seat-router` (version 4). No installed `pg_cron`, `pg_net` or `pgmq`. Six enabled PostgreSQL event triggers and one publication exist: do not modify them.
- Vercel inventory includes `ruins-api`, `sl-sim-seat-admission`, `sl-sim-uat`, `sl-sim-basic1-hosted-proof`, `sl-sim-basic1-postpilot`, `basic1-postpilot-qr-guard-codex-20261024`, plus other related proofs. **Existence is confirmed; whether these actively write to staging or run migrations is not proven.** Assume any connected deployment could trigger admin changes until checked before the specific window.
- Existing SQL migrations include both Dungeon Runner/Friend/Daily Trial and SL-SIM, with the latest listed migration `20261021061512_remove_temporary_postpilot_role_membership_grant`. These names are metadata, not permission to run a new migration.

## 2. A — recommended low-disruption administrative freeze contract

**Purpose:** obtain a useful *pre-r2 SQL logical recovery baseline* using a single synchronized MVCC snapshot for transactional data while **normal player writes may continue**. This is not a whole-platform exact point-in-time image. No database writer shutdown, application downtime or new table-wide SHARE grants are proposed.

**Freeze only administrative changes**, project-wide, during a later **named and specifically authorized** capture interval:

1. No migrations, SQL editor DDL, table/schema/sequence/role/grant/policy changes, extension operations, database restore, manual privilege update, creation/alteration of triggers, publications or scheduled database jobs.
2. No Vercel/Hostinger/HostGator/GitHub or Supabase deployment **that applies DDL or changes database privileges or schema**, including automatic migration hooks. Ordinary read-only source changes and unrelated code work outside that affected release path may continue.
3. Existing player transactions, Friend/Daily Trial writes, SL-SIM runtime sessions, login/refresh and Storage API activity need not be stopped for the *transactional MVCC row snapshot*. They still create sequence/global-state drift risk; keep capture short and record an explicit limited guarantee.
4. The Supabase project administrator, plus any independent PM/operator with authority over SL-SIM, Friend/Trial, database SQL editor, and deployment pipelines must receive a **hold announcement and acknowledgement**. If a controlling actor or an auto-migration path cannot be identified, do not claim an enforced freeze.
5. Before future launch, pin source/command versions, exact schema inventory, project/ref/hostname/CA, pre-r2 absence, role privileges, maintenance/change-freeze owner and interval. Require the responsible operator to record a start attestation and a no-migration/no-DDL/no-role-change end attestation. Zero active sessions at one instant is **not** a freeze.
6. Capture in a **later separately approved** Cloud Shell C3 operation using the reviewed synchronized `pg_export_snapshot`/`pg_dump --snapshot` recipe, source read-only settings and authenticated encryption before any Google Drive upload. Collect passwordless role metadata within the change freeze, acknowledging it is not an MVCC-frozen global object.
7. Abort and mark the run **invalid** on lost snapshot, failed/partial producer, discovered DDL/migration/role change, object drift, changed r2 state, privilege drift, TLS mismatch, plaintext leak, unmet custody requirement, inconsistent history or unbounded cost. Never repair source privileges to get a successful dump. New run ID required after an invalidated snapshot.
8. Release the administrative hold explicitly once source capture/encryption is validated, even if independent Drive re-download and disposable restore take longer; never claim `RESTORE_VERIFIED` until all independent checks pass.

**Required acknowledgements before A can run:** staging administrator/change coordinator; RUINS/Friend/Daily Trial steward; SL-SIM steward; any deployment operator with migration privileges. These may be the same individual but their roles must be recorded explicitly. The Owner will approve the actual window only after the implementation and nonsecret checklist are presented.

**No-go residuals:** sequences can advance under concurrent writes; `pg_dumpall --roles-only` is not linked to the MVCC snapshot; schema creation during capture remains dangerous; a change-and-revert can evade simple before/after comparisons. Reconcile sequences on disposable restore and label baseline `SCOPED_SQL_RECOVERY`, never `FULL_SUPABASE_RECOVERY`. Supabase SQL dump excludes Storage binaries, managed secrets, full Auth/session continuity, deployment code/settings and hosted service continuity.

## 3. B — encryption and independent private-key custody contract

**Chosen cryptography:** `age` asymmetric encryption, with a newly generated **Owner-controlled** X25519 age recipient for C3. The public recipient and fingerprint can be shared with Dev4. The private identity must **not** be sent to ChatGPT/Work, GitHub, Google Drive/G:, Supabase, Cloud Shell capture, email or test logs.

**Primary custody:** Owner-selected existing reputable password manager/secure vault, storing a private age identity as an encrypted secret item. **Secondary custody:** separately protected, truly independent failure domain, such as a sealed printed recovery record or a separately controlled encrypted vault with independent access and recovery, not merely a second folder under the same Google account. No new paid product is assumed and no ASUS C/E/R access is required by this design.

**Actual keys are NOT generated yet.** Dev4 cannot safely manufacture the live private key in its tools and hand it to the Owner without violating custody. The Owner generates it **privately in a trusted environment** that supports a vetted `age` implementation and imports the private identity straight into chosen custody. Generation device/session and exact transfer instructions need to match the Owner's chosen vault, and should avoid persistent plaintext traces. Cloud Shell **capture** must never be used to generate/store this live private identity.

**Recovery check before C3** (no private secret disclosure):

1. Owner privately establishes both primary and independent secondary custody. Only the public recipient reaches Dev4.
2. Dev4 produces a **nonsecret test challenge** encrypted to that public recipient. Store public recipient hash, encrypted challenge hash and expected SHA-256 of challenge plaintext as nonsecret evidence.
3. Owner independently disables/avoids the primary recovery path and decrypts the challenge using the **secondary** copy in a controlled environment, checks its expected hash and confirms success without giving anyone the private key.
4. Record a nonsecret receipt: recipient fingerprint, two storage-domain labels (no access details), challenge digest, success, date, and who confirmed the test. If not independently recoverable, `C3_HOLD`.
5. Keep the corresponding old identities as long as any archive encrypted to them is retained. Rotation requires new recipient + recovery test + policy/retention mapping; never silently remove keys. Losing all private copies makes otherwise intact ciphertext unrecoverable.

**Real backup storage:** ciphertext and nonsecret manifest/receipts only in a private, separately designated G: folder created after C3 authorization. The actual private key remains outside Google Drive even if ciphertext is mirrored by Drive Desktop. The test key in Work5 synthetic proof was deliberately transient and **does not** satisfy live custody.

## 4. Tasks completed and outstanding

**Dev4 completed now:** read-only Supabase provider/project/catalog/trigger/scheduler/migration/Edge metadata audit; Vercel project-name discovery; PostgreSQL/Supabase documentation validation; fixed A/B change-control, backup scope, abort criteria and private-key recovery acceptance contract; published this documentation for review.

**Not yet performed:** actual change freeze; notifying or suspending other project PMs; generating a real encryption identity; verifying an Owner secondary key copy; connecting to the live source with `pg_dump`; backup transfer/decryption/restore using actual data; any database or deployment change. These have distinct approval/operational boundaries.

**Next tightly bounded action:** determine the Owner's existing secure vault/custody approach, and establish who can attest to project-wide no-DDL/no-migration/no-role-change during a short future window. Dev4 can then prepare the exact nonsecret execution/runbook and challenge; request separate explicit C3 authorization only after key recovery PASS and the maintenance operator commitments are recorded.

**Holds:** `C3_LIVE_EXPORT_HOLD`; `011A_HOLD`; no project subscription changes, deployment, staging DML/DDL, code merge, ASUS-drive/VeraCrypt or user-data movement.

## References

- Controlling prior C3 governance: `4883d2a32096cd4941b75f7778a46b22f4d49741`.
- Work5 C2.5R synthetic tested source: `6050dc5efff780f92ac2e0ac18cd77775956fe0e`.
- Dev4 recovery/adjudication: `afb31cb4e59d39b6da9f00c9b340053ae9423aec`.
- Supabase Free plan backups: https://supabase.com/docs/guides/platform/backups
- Supabase CLI manual restore limitations: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- PostgreSQL 17 pg_dump and MVCC: https://www.postgresql.org/docs/17/app-pgdump.html
