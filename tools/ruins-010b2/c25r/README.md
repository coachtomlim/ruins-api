# C2.5R synthetic corrective package

No remote database argument exists. Do not adapt this runner to staging without the separate reviewed C3 package. C0-C2 accepted sources remain unchanged; this is an additional scoped repair.

## Reproduce in ephemeral Cloud Shell

Use Python 3 without optimization, Docker, pinned PG17.6 image in runner.py, and age 1.1.1. Decline Cloud API credential requests. Do not create or bill a project. Disable history, use umask 077. Container names and /dev/shm/ruins-c25r must be unused; never delete unrelated resources to make a run fit.

Read source-hashes.json and the execution report for exact tested source commits and digest pins. Obtain the listed source files from that commit, rather than a moving branch.

```sh
python3 test_protocol.py
python3 runner.py diagnostics
python3 producer_tests.py
python3 runner.py capture PUBLIC_SYNTHETIC_RECIPIENT CAPTURE_SOURCE_COMMIT UNIQUE_FAKE_RUN_ID
```

Capture prints nonsecret receipt, member/inventory hashes and ENCRYPTED state. It does not print decrypted rows, role passwords or keys. Current code bounds individual captured subprocess outputs to 8MiB after collection; it buffers fake data in RAM. It is not a resource-hardened live backup agent. Capture DB uses no network/ports, 256MiB PGDATA tmpfs and 512MiB container memory. Host /dev/shm is 64MiB in the observed Cloud Shell VM. No assertion of no swap/core/log remnants or secure physical erasure is made. Do not extrapolate small fake-data memory usage to live data.

## Drive and completion

Transfer only ciphertext and nonsecret receipt/journal. Transfer source/docs/sanitized evidence separately. Never transfer a private identity or plaintext dump into Drive. The Work implementation uses the connected Drive uploader and fetcher. It intentionally discards the uploader's object identity at one boundary, then reconciles by exact run-name list, owner-only metadata, size and independently downloaded SHA-256. Missing/duplicate matches or mismatched bytes fail closed and do not trigger blind reupload.

drive_step.py takes sanitized receipts of those actual connector observations and a materialized downloaded ciphertext file. The metadata receipt omits Owner contact details and all transient signed URLs. The helper validates stage identity, ACLs, pin, unique object and distinct second download file, then idempotently advances the journal. It is not a credential-bearing Drive client or a substitute for actually making the connected calls. Unit tests use synthetic listings; the execution report distinguishes these from the actual Drive exercise.

```sh
python3 drive_step.py DRIVE_UPLOADED_VERIFIED RECEIPT_ROOT ACTUAL_LISTING_JSON ACTUAL_METADATA_JSON ACK_DOWNLOAD
python3 drive_step.py DRIVE_REDOWNLOADED_VERIFIED RECEIPT_ROOT ACTUAL_LISTING_JSON ACTUAL_METADATA_JSON INDEPENDENT_DOWNLOAD
```

The exact state order is STARTED -> DUMPS_OK -> ENCRYPTED -> DRIVE_UPLOADED_VERIFIED -> DRIVE_REDOWNLOADED_VERIFIED -> RESTORE_VERIFIED. No earlier stage permits PASS. Evidence is bound to run/source/fixture/recipient/scope/freeze identity and original artifact/inventory pins. A source capture failure is abandoned, not resumed with mixed snapshots. Drive/restore retries can reconcile the same immutable artifact under the same identity. A failed restore target is deleted and rebuilt from scratch.

## Independent key and fresh restore

Generate a synthetic key outside capture Cloud Shell and copy it to a separate recovery context. Only its public recipient enters capture. Destroy the original copy and replace the capture VM. Verify the old source workspace/script/cache are absent. Generate a NEW restore-only key in the replacement VM; only its public recipient leaves that VM.

Use pinned pyrage 1.3.0 in the external Work context:

```sh
python3 recovery.py INDEPENDENT_DRIVE_CIPHERTEXT SECONDARY_FAKE_IDENTITY CAPTURE_RECEIPT_JSON NEW_RESTORE_PUBLIC_RECIPIENT
```

This verifies original age manifests and all member sizes/hashes in memory, tests wrong key/recipient/corruption, and creates ciphertext recovery-relay.age for the new restore-only key. Original private identity remains outside browser/chat/code/Drive/Cloud Shell. The fake copies on one Work host prove loss of the capture VM and primary copy; they do not establish durable independent Owner custody. Real policy is in the maintenance/custody decision proposal.

Upload/retrieve the relay, verify its independently recorded pin, then:

```sh
python3 runner.py restore VERIFIED_RELAY NEW_RESTORE_IDENTITY RECORDED_RELAY_SHA256
```

Only after matching all inventory classes, per-table rows/hashes, actual sequences/history and effective privilege tests may the Work journal consume the sanitized restore receipt and advance RESTORE_VERIFIED. Record original artifact and original inventory lineage, not just the relay hash. Keep failure receipts and label modified disposable targets as negative-test artifacts, not final runtime candidates.

## Scope and cleanup

The fixture has 32 representative tables/35 fake rows across seven schemas, not the live 107-table catalog. SQL recovery to administrative PG17 is the tested result. Managed Supabase restore, Auth/session continuity, Storage files and other platform dependencies remain excluded/unobserved as detailed in the coverage register.

After receipts, remove only the specifically owned proof containers/keys/relay/workspace and verify those names/paths absent. Closing an ephemeral Cloud Shell tab relies on provider lifecycle, not secure erasure. Do not silently discard the secondary key and later imply retained fake ciphertext is durably recoverable. Temporary Work custody must be explicitly recorded in the final report; future long-term custody is an Owner decision.

## C2.5R execution corrections

Input-less subprocesses explicitly use /dev/null so unattended Docker checks do not inherit the terminal and stop on SIGTTIN. Commands with data still receive explicit pipes. Preflight requires the pinned image already cached; registry provisioning is separate from database-start deadlines. Fault receipts were retained before fresh-target retries.

pg_restore --clean recreates the public schema and can lose initdb's original PUBLIC USAGE baseline. The synthetic verifier does not ignore a schema hash mismatch. It rebuilds the original pinned fake fixture in a separate disposable source, requires its raw schema fingerprint to match the captured original, and compares owner plus exploded ACL semantics. Only the precisely identified missing original PUBLIC USAGE on public can be reconstructed by the target administrator. Any other ownership/right difference fails. This changes only the disposable target to match the original source; it never grants backup convenience rights on a shared source. The receipt records both original pin validation and semantic comparison.
