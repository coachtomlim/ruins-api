# DB Dev Work5: cloud-first synthetic recovery receipt
Date: 2026-10-24 SGT. Final disposition: CLOUD_SHELL_SYNTHETIC_PASS (synthetic workflow only).
C0 PASS; C1 PASS; C2 PASS. C3 LIVE EXPORT NOT AUTHORIZED. 011A HOLD.

## Authority and verified source
Repository: coachtomlim/ruins-api.
Decision branch work/ruins-001c-010b2-cloud-first-design-001 verified remote HEAD 96731577b6f8fcdc3755daf953329d6fadf0e9aa.
Execution branch: work/ruins-001c-010b2-cloud-synthetic-001.
Verified implementation commit: b9d2e9fb20a3e052c31e2b034e8fac13202b78a0.
Earlier checkpoint commit: a0c28a59d18931264cfaec54b038587d21c456f3.
Full attached successor, pivot, 010A hold, 010B1 README, F1/F2/F3/F4a/F4b commands and synthetic fixture were read. Drive pivot matches GitHub. S1/S2/S2FIX and all ASUS evidence remain untouched.

## C0 actual runner receipt
Opened https://shell.cloud.google.com/?ephemeral=true in connected Chrome. The actual session displayed EPHEMERAL. Session information said data will not be saved; quota displayed 0 of 50 hours used, reset Oct 31 2026 10:46 AM SGT. Welcome stated Cloud Shell is free for all users.
Declined Google Cloud API credential authorization. Terminal commands worked without it. No project API calls, billing upgrade, bucket, paid VM, persistent project or scheduled job.
Native tools initially pg_dump/psql 16.15; rejected for proof. Docker 29.8.2 available. Signed package installation added age 1.1.1 and PostgreSQL 17.11 clients; 17.11 was not used for database proof.
Actual database/tools used official Docker PostgreSQL 17.6 (Debian 17.6-2.pgdg13+1), pinned:
postgres@sha256:00bc86618629af00d2937fdc5a5d63db3ff8450acf52f0636ec813c7f4902929
Both disposable source/restore containers used --network none, no port bindings, 128 MiB tmpfs PGDATA. Source removed before restore. No Supabase endpoints or credentials were used.
Host /dev/shm 64 MiB; key/work directory mode 700, key mode 600. Archive assembly and decryption used Python process memory. This is not a guarantee against provider/host memory inspection or swapping.
Provider documentation: https://docs.cloud.google.com/shell/docs/using-cloud-shell ; https://docs.cloud.google.com/shell/docs/how-cloud-shell-works ; https://docs.cloud.google.com/shell/docs/quotas-limits .
Cloud Shell is interactive, has weekly quotas and session limits, and ephemeral files disappear with the VM. It is not an unattended backup scheduler. No separate egress-meter or billing-account audit was performed; no billable service was activated. Bounded registry/package downloads and connector transfers occurred.

## C1 encryption, private storage and retrieval
Source fake fixture included profiles, Friend, Daily Trial, 12 SL-SIM table shapes, Auth/Storage shapes, migration history, ruins_private records/signing-key placeholder, restricted roles, RLS, constraints, function, view, sequences and default ACL.
pg_dumpall --roles-only --no-role-passwords and custom pg_dump were collected with checked subprocess exits. Only the existing bootstrap postgres CREATE ROLE statement was removed for fresh-cluster restore. SQL dumps never written to Drive or the Work scratch filesystem.
Complete synthetic capture used the isolated bootstrap superuser. It does not validate a live restricted/S2FIX capture recipe. Restricted backup_reader whole dump failed against ruins_private as expected, with no permission weakening.
A throwaway age recipient key was generated inside /dev/shm only. No private key or passphrase reached GitHub, Drive, chat, browser output or Work scratch.
Ciphertext: RUINS_FAKE_ONLY_010B2.age, 11064 bytes.
SHA-256: 5e80fd8de3eae6411eedbf6177d7acae7ab0cf4861eee52a44a72dc900a1e3c6
Private proof folder, owner-only permission metadata verified:
https://drive.google.com/drive/folders/1eOw9M356YhkP-VAQJTxpPEy0x5WoJhxz
Ciphertext file: https://drive.google.com/file/d/1_rVCQ7nUnekfTedct36dPMcPAMgHWt0J/view
Manifest: https://drive.google.com/file/d/1fh0Qgp1LRNlRnPuf236SK8Zuue3yaWkH/view
Ciphertext was copied via bounded terminal UI text into Work cloud scratch, independently decoded and hashed, then uploaded through connected Drive. No Owner-PC file/download was used. Fetched the uploaded object through Drive and materialized its authenticated returned reference into a distinct Work scratch file. Retrieved size/hash matched exactly. Returned that retrieved file's bytes to Cloud Shell, deleted original source ciphertext and source DB, then restored from the retrieved file.
Explicit leakage marker scan of retrieved ciphertext rejected AGE-SECRET-KEY-, synthetic email, fake signing marker, CREATE TABLE and PGDMP. Folder listing before receipts contained exactly ciphertext and nonsecret manifest, no SQL, key or source rows. Marker scanning supports, but does not by itself prove, confidentiality; authenticated age encryption and allowlisted upload paths are the primary controls.

## C2 independent restore and adversarial receipt
Fresh network-isolated PG17.6 restore loaded roles and custom dump with ON_ERROR_STOP/exit-on-error. Validated expected tables and canonical hashes independently against encrypted source inventory:
- 24 tables / 25 synthetic rows.
- 10 inventory categories: schemas, relations/owners/ACL/RLS flags, columns, constraints, policies, functions, default privileges, roles, memberships and sequences.
- Source pre/post capture integrity matched; every in-scope table's ordered row hash/count matched restored data. Migration tables included.
- 9 access/invariant checks on each side: four private-schema denials, correct/wrong RLS principal, executor insert denial, duplicate daily trial rejection, invalid progress rejection.
- 7 negative cases: corruption/checksum, missing file, wrong age key, wrong manifest, authenticated corruption independently of outer hash, partial encrypted archive, changed schema/table permission.
Changed-permission case intentionally modified only the disposable target after successful restore verification; both ACL drift and newly permitted access were detected. Target then destroyed.
Restore receipt: https://drive.google.com/file/d/1lR3S3nVnkB06JYPzmst3R_mJ9FuYkkIQ/view
Receipt SHA-256: cd796a5e593bdc4235778a3a53277b854ef11f8a440cf4578c582b91639cdcfc
Two harness problems were found and fixed, not suppressed: failed identity insert advanced a sequence before the source snapshot; initial Docker temporary server readiness raced final startup. First restore attempt failed before roles loaded; a fresh target then passed with final-startup check. No unsuccessful run is counted as PASS.

## Reproducibility pins
Final tools/ruins-010b2/synthetic-proof.py SHA-256:
76e9e7e7aa65122e82e15cc63903ea39da0df43850526f696d99b050583f0ffb
Git blob 1e01cd72777331cf04453f243b22eb91a6ab6102. Cloud Shell checksum matched exact final source.
tools/ruins-010b2/synthetic-fixture.sql SHA-256:
a7ef2d8338797dda88e83e852aad41603036d0dbff093206db7718791dc14a26
Git blob 480ffea395ac4a0deb0f08658c1830b9b6b59d4a. Actual browser-transferred SQL had one extra trailing newline:
f51fc171216a37c3a2fd93c16a0e2e10eb79cdbcbf052b74872d8aedc8433a5b.
Capture-phase script revision SHA-256 dd2defccaf3866d211ff65e637e7c894c1f3b0e6827eae020a872bf11885678c; final restore revision above adds corrected negative-test baseline and final Docker readiness. Capture logic otherwise unchanged.
Ciphertext is deliberately not committed to GitHub.

## Cleanup and retention
At 2026-10-24 03:05:20 UTC (11:05:20 SGT), removed source and restore containers including associated volumes, /dev/shm/ruins010b2 (both keys, plaintext-derived inventory, ciphertext and receipts), own /tmp scripts/fixture/install logs. Verified work root absent and docker ps -a name filter empty. Native pg_lsclusters showed only pre-existing PG16 main down; no PG17 cluster was running.
Ephemeral VM retains only installed tool binaries/image cache and ordinary terminal UI history of synthetic code/ciphertext, until VM teardown. No claim of immediate provider-level secure erasure. Browser tab closed after receipt collection.
Drive retains ciphertext, nonsecret manifest, sanitized receipts/proposal. Work scratch retains only ciphertext, fake fixture/source scripts and sanitized receipts, no decryption keys. Test decryption key intentionally destroyed after successful recovery: this historical ciphertext is no longer decryptable; rerun fixture for a new proof. Do not treat that throwaway custody model as a live backup solution.
No ASUS C/E/R access, staging/production connection, wallet/XP writes, game changes, Actions, deployment, purchase or migration.

## Scope limitations and next gate
This PASS proves a generic fake-data cloud backup/encrypt/Drive/retrieve/fresh-restore workflow. It does not prove live Supabase recovery, full platform recovery, source write-consistency under live traffic, or the S2FIX split capture.
Stock F2 omits managed Auth/Storage schema definitions; stock F3 excludes Vault and supabase_migrations and selected migration tables. F4 supplements project migration history. A fresh real Supabase target needs provider-managed definitions/versions. The synthetic full dump deliberately includes fake shapes and all fake migrations; it does not demonstrate stock CLI completeness.
Uncovered surfaces: Storage object binaries; real Vault encryption/root keys and decrypted secrets; Auth service/JWT/session/provider continuity; role passwords (explicitly excluded); platform-managed schemas/extensions/settings; Edge code/secrets; Realtime publications/configuration; recovery destination/provider version alignment and real migration history. Earlier S1 96/96 / S2 FAIL / S2FIX 182/182 remain historical offline evidence.
Live proposal is drafted separately for review. It is NOT an executable approval package: Owner key custody/recovery, real least-privilege capture command manifest, exclusion disposition and live consistency protocol still need review before requesting live authorization.

## What's next
DB Dev Work5: prepare and synthetically validate the live pre-r2 capture command pack and independent key-custody/recovery procedure; keep post-r2 split capture separately gated.
Codex: no task, direct Work execution succeeded. Claude remains paused.
Owner: no immediate login, purchase or approval needed. A separate explicit 010B2 live-export request follows only when the exact package is ready.
010B2 live export HOLD. 011A HOLD.
