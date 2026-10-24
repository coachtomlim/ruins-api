# 010B2 Cloud Shell fake-only proof
This package implements a generic synthetic cloud backup/encrypt/Drive/retrieve/restore proof. It has no live endpoint argument and must never be adapted by supplying real data without a new reviewed authorization.
See docs/ruins/RUINS_010B2_WORK5_SYNTHETIC_PASS_20261024.md for execution evidence, actual hashes and limitations.

## Reproduction
Use an explicitly ephemeral interactive Cloud Shell session. Decline Google Cloud API credential access; no project API is needed. Docker and Python 3 are required, plus age 1.1.1 from signed vendor packages.
Pull the official PostgreSQL 17.6 image pinned in synthetic-proof.py and independently verify its digest. Verify source script and fixture SHA-256 against the evidence receipt.
Run without Python optimization:
```bash
unset HISTFILE
set +o history
umask 077
python3 tools/ruins-010b2/synthetic-proof.py capture tools/ruins-010b2/synthetic-fixture.sql
```
Script requires clean /dev/shm/ruins010b2 and unused ruins010b2-source/restore container names. Do not delete unrelated resources to satisfy it. It creates no port mapping and no network on the database containers. Key remains only in its restricted /dev/shm directory.

Allowlist for outbound transfer: /dev/shm/ruins010b2/proof.age and manifest.json only. Use connected Drive to create a dedicated private folder, verify owner-only sharing, transfer ciphertext only, and retrieve the uploaded object into a DISTINCT file. Independently verify exact size/hash against the pre-upload receipt. Preserve the recorded ciphertext pin out of band. Do not upload SQL, key.txt, wrong-key.txt or source-inventory.json.
In the original Work proof, ciphertext alone passed through Work cloud scratch using terminal UI in bounded base64 chunks, then connected Drive upload/fetch. Byte decoding and SHA-256 matching proved transfer integrity. No Owner-PC downloads or file access occurred. This connector/UI bridge is documented rather than automated by this script; execute it explicitly and save receipt. Do not substitute the still-present source artifact for the downloaded object.

Remove original proof.age and the source container after verifying transfer. Put the actual Drive-retrieved ciphertext into /dev/shm/ruins010b2/drive-retrieved.age and run:
```bash
python3 tools/ruins-010b2/synthetic-proof.py restore /dev/shm/ruins010b2/drive-retrieved.age /dev/shm/ruins010b2/manifest.json <RECORDED_CIPHERTEXT_SHA256>
```
Do not interpret C2_DATABASE_RESTORE_PASS alone as proof of Drive transfer; correlate it with Drive metadata, authenticated download and independent hash receipt. Capture creates a fresh throwaway key and ciphertext each run, so original archive hashes are historical pins, not expected pins for a new run.

## Cleanup
After receipts are captured, remove only the two explicitly named proof containers and their disposable volumes; remove /dev/shm/ruins010b2 and own transferred /tmp files; verify root absent and container-name filter empty. This intentionally destroys synthetic keys, making retained test ciphertext undecryptable. Close the ephemeral browser tab; VM teardown follows provider lifecycle, not a secure-erasure guarantee.

## Limits
The harness uses Python assertions; run ordinary python3 without -O/PYTHONOPTIMIZE. It is fake-only test code, not a hardened live backup agent. Dumps use isolated synthetic bootstrap-superuser privileges. Private-role whole-dump failure is reproduced, but S2FIX split capture is not implemented or accepted here. Source fixture has no writers during capture.
Auth/Storage are fake SQL shapes; Storage bytes, Vault keys, real Auth continuity, passwords, Edge secrets and provider settings are not recovered. The drift negative test intentionally weakens only the disposable target after successful restore comparison, detects it, then target is deleted.
No live C3 or 011A authority follows from this package.
