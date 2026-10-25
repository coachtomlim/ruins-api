# RUINS 010B2 — Independent deployment-path check and Bitwarden custody next steps

**Date:** 2026-10-25, SGT  
**Authority:** Dungeon Bravo Dev4, read-only reconciliation; Owner confirms Bitwarden Free account is set up.  
**Status:** `DEPLOYMENT_PATHS_RECONCILED_PARTIALLY / BITWARDEN_ACCOUNT_READY / AGE_CUSTODY_UNVERIFIED / C3_LIVE_EXPORT_HOLD / 011A_HOLD`.

## Deployment and database-change scope

- Supabase staging project `qpgwqmduqtqidmhbuclw` is shared with RUINS/Friend/Daily Trial/SL-SIM. Earlier read-only catalog confirms 107 in-scope tables, pre-r2 (`ruins_private` and `ruins_owner` absent), PostgreSQL 17.6; no row data was read. Existing Supabase `sl-sim-seat-router` Edge Function is active and versioned; it was not changed.
- `coachtomlim/ruins-api` `main` contains `vercel.json` with `git.deploymentEnabled = false`; `package.json` uses build/test tooling, not automatic SQL migration as part of `build:flare`. There is no `.github/workflows` directory on `main` according to GitHub contents lookup (404). Separate `scripts/deploy/hostgator-*` release scripts exist and must not be run during the capture's administrative hold.
- `coachtomlim/sl-biz-simulation` is a private GitHub repository with `main` as its default branch. The `.github/workflows` directory lookup on `main` returned 404; **this does not rule out manual CI, scheduled non-GitHub jobs, another branch, Git-linked auto-deploy or project administrator actions**.
- Vercel's `ruins-api` project's latest deployment record was `ERROR`, and its last production deployment is older. This does **not** tell whether HostGator-delivered gameplay is operational; do not conflate unrelated deployment channels.
- Vercel projects `sl-sim-seat-admission`, `sl-sim-basic1-postpilot`, `sl-sim-basic1-hosted-proof`, `sl-sim-uat` report their latest deployments as `READY`. Recent `sl-sim-basic1-postpilot` production deployments are evidence that the deployment path is active. Whether any of these performs DDL/migrations automatically remains **UNPROVEN**, pending review of the actual per-project deployment/configuration and relevant SL-SIM PM acknowledgement. No Vercel state was modified.
- No runtime, Vercel or Supabase schema/grant/role/settings changes were made. A deployment freeze must not be interpreted as player/application data-write suspension. A synchronized MVCC snapshot still excludes precise global role/nontransactional sequence continuity; target sequences need independent reconciliation.

## A: narrowly scoped freeze acknowledgement to prepare, not activate

At a separately Owner-approved C3 interval (no more than 30 minutes under the current preflight contract): hold only migrations, CREATE/ALTER/DROP, grants, role/policy changes, extension or scheduler changes, database-restoring operations, and deployment jobs that apply any such database changes across all affected projects. Ordinary game transactions and Auth/Storage reads/writes continue unless a specific discovered blocker requires a separate decision. Capture starts only after the RUINS/Friend/Daily Trial steward, SL-SIM steward, deployment operator and Supabase administrator have each acknowledged **no planned/administered DDL/role changes** and any automatic migration writers are identified/held. An unowned automatic writer is NO-GO. Return HOLD if a safe short interval cannot be demonstrated. A read-only catalog lookup cannot impose or prove the administrative freeze.

## B: Owner's Bitwarden setup acknowledged; key custody still unproven

Owner has confirmed Bitwarden Free is set up. This is **only the account-management step**, not evidence that an age identity exists, that an offline copy exists, or that either can recover an encrypted challenge.

The remaining **Owner-private** steps, described in the already published custody manual, are:

1. Generate an `age` X25519 identity on a personally controlled, trusted environment (not a ChatGPT/Work/Cloud Shell capture VM; no ASUS C:/E:/R: work is required by this project). Use the official age tool. Never use an online key generator. Save the complete private identity as a Bitwarden Secure Note; immediately test that it can be viewed and copied back accurately. Protect the Bitwarden account with a unique master passphrase, separate authenticator-based 2FA and offline Bitwarden recovery information.
2. Independently transcribe or print the **same complete** private identity and store it in a sealed, protected offline location, separate from Bitwarden and Google Drive. The offline copy is not a second unrelated key pair. If a paper copy is used, verify its exact spelling/line integrity before sealing.
3. Create a harmless local challenge (no real database content), encrypt it to the derived **public recipient** with the official `age` CLI, and separately decrypt to the same expected plaintext digest using (i) the Bitwarden Secure Note and (ii) the offline recovery copy while Bitwarden is closed/unavailable. Record only boolean outcomes, date and public-recipient digest; do not upload keys, decrypted content or screenshots containing secrets to chat, Drive, GitHub or Cloud Shell.
4. Reconcile key lifetime and succession: keep both independently recoverable copies while any corresponding ciphertext archive remains. If both copies are lost, ciphertext is unrecoverable. Re-run the offline challenge whenever a copy is replaced and before changing recipient keys.

The public-recipient-only test helper in `tools/ruins-010b2/c3_preflight_v2/` is a preparatory tool; its earlier 31/31 checks include mocked subprocess behavior, **not a real `age` encryption/decryption exercise against an Owner recipient**. The owner's private recovery drill cannot be marked PASS by programmatic assumptions or checkboxes alone.

## Next action and scope boundary

**Dev4** has completed this read-only deployment inventory and A/B guidance. A limited live C3 proposal can be finalized only after the operator hold acknowledgements and Owner-attested independent key recovery are available. Actual public recipient/fingerprint may later be entered into an **authorized local nonsecret run file**; no private key may enter ChatGPT.

**Owner** confirms Bitwarden account ready. The next private task is age-identity creation, independent offline backup and dual-source test, without sharing keys. Owner needs no password/secret entry into this chat.

**Codex/Claude** no task. **C3 live backup and 011A migration remain HOLD**, with separate explicit authorization still required even when A and B pass.
