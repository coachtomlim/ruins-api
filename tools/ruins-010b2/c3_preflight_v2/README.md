# RUINS 010B2 / C3 — Offline preflight hardening and public-only recovery drill

**Dev4 execution boundary:** No live export, no real key generation, no credentials, no staging writes, no service freeze, no managed Supabase restore and no migration. The scripts do **not** connect to Supabase, Google Drive or the Owner's devices. The read-only metadata file was refreshed via the connected Supabase project/catalog API at 2026-10-25T10:45:15Z (107 tables in seven expected schemas; project ACTIVE_HEALTHY and pre-r2). It ages out after one hour by design.

## Technical changes

1. `audit.py` preserves all existing fail-closed scope and owner-attestation checks; now additionally refuses expired administrative windows, windows more than seven days ahead, and Owner custody recovery attestations older than 180 days. It **always** returns `live_export_authorized=false` and `011A_authorized=false`, including fully populated test fixtures. Every independent operator acknowledgement and Bitwarden/offline recovery result remains `false` in the actual Owner-pending plan.
2. `public_challenge.py` is an optional **public-key-only** nonsecret challenge helper. The `prepare` subcommand accepts only one syntactically shaped `age1...` X25519 public recipient, requires the reviewed age **1.1.1** CLI, creates a harmless random challenge and an age-encrypted copy in a **new**, private output directory, and records public hashes/manifest. It never accepts an identity file, prompts for a password, decrypts files or claims custody verification. `verify-bytes` checks only whether Owner-recovered harmless plaintext matches the manifest. Owner must independently prove which custody copy decrypted it; byte matching itself does not attest to vault access. No real public recipient has yet been provided, and **no actual age encryption** has been run in this development environment.
3. `test_audit.py` / `test_public_challenge.py` execute deterministic offline policy and **mocked** age-subprocess tests; they are NOT a live encryption or Owner key-recovery proof. Actual Bitwarden setup and age-key recovery follow the separately published owner manual in `docs/ruins/RUINS_010B2_BITWARDEN_FREE_KEY_CUSTODY_MANUAL_20261025.md`.

## Testing

```
PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -p 'test_*.py' -v
python audit.py catalog_20261025.json owner_pending.json
```

31/31 unit tests PASS; the actual pending evidence returns `C3_PREFLIGHT_HOLD`, as expected. The first script may only return `READY_FOR_SEPARATE_AUTHORIZATION_REVIEW` for fully attested information; that status is NOT a grant to run any backup.

## Optional Owner recovery drill (not executed yet)

After the Owner creates an `age` private identity **on a trusted non-ASUS device**, stores it in Bitwarden Free and separately as a protected offline copy, only the matching **public recipient** is used to encrypt a harmless challenge. The Owner uses the official `age -d -i <PRIVATE_IDENTITY_FILE>` locally, once for the Bitwarden-recovered identity and again using the independent offline copy **with Bitwarden locked**, checks matching bytes, then privately reports **PASS/FAIL only**. Never enter identities, passphrases, recovery codes or keys into ChatGPT, GitHub, Google Drive or the cloud capture VM.

If the Owner chooses to use this helper on a trusted device that already has the required age version and Python 3, the public-only commands are:

```
python public_challenge.py prepare --public-recipient-file <NONSECRET_PUBLIC_RECIPIENT_TEXT_FILE> --new-directory <NEW_PRIVATE_DRILL_DIRECTORY>
# Owner privately decrypts the resulting .age file using each independent identity copy.
python public_challenge.py verify-bytes --manifest <NONSECRET_manifest.json> --recovered-file <OWNER_DECRYPTED_HARMLESS_FILE>
```

This optional helper is **not** a substitute for privately testing Bitwarden and the physical paper copy. If the Owner has no trusted non-ASUS environment, stop; do not improvise key generation on the backup runner, ChatGPT, ASUS C:/E:/R:, or an untrusted web key generator.

## Live backup and release boundary

- All A hold acknowledgements must be obtained from the actual administrators of Supabase, RUINS/Friend/Daily Trial, SL-SIM and database-changing deployments; the current scripts cannot invent them.
- All B custody and recovery attestations must be made by the Owner after successful real decryption with two independently held private-key copies.
- Then refresh staging metadata, independently review the exact C3 command/connection scope and request **separate Owner authorization** for the *one-time, read-only* cloud export. Source permissions and the source's role schema remain unchanged.
- C3 is **HOLD**, 011A is **HOLD**. No paid capacity, VPS, GitHub Actions or ASUS drive operations.
