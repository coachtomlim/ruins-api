# 010B-1 — Native Windows backup operator fallback (review addendum)

**Status:** `DESIGN_ONLY / NOT_AUTHORIZED`. 2026-10-23 SGT. Complements the 010B-1 human backup-only proposal. No credentials, staging connections or actual exports were used to prepare this addendum.

## Why the alternative exists

ASUS lacks Docker, while the Supabase CLI 2.121.0's supported backup runner uses a container/Linux environment. Claude 010B ran the CLI `--dry-run` offline and reproduced its SQL dump behavior through official native PostgreSQL 17.6 `pg_dump`, `pg_dumpall` and `psql` binaries against synthetic PG 17.6.

The dry-run text required two **reviewed translation corrections** on native Windows: `--quote-all-identifier` to the full `--quote-all-identifiers` spelling, and shell-quoting the schema list so it is not parsed as a pipe. These are *portability corrections*, not evidence that an arbitrary manually assembled script is equivalent to the CLI on live staging.

## Two acceptable routes for a later authorized human operator

**A (preferred):** approved protected Docker/Linux machine running a checksum-pinned supported Supabase CLI/PG client, with official pre-r2 backup workflow and a fresh test of the exact output coverage.

**B (conditional, useful on ASUS):** checksum-pinned native official PostgreSQL **17.6** binaries, plus the exact CLI 2.121.0 dry-run-derived invocations after the two audited Windows syntax corrections, with all include/exclude schema lists revalidated against the **current live schema metadata**. The operator must first run synthetic replay with exactly those commands and compare their coverage to the previously accepted test; the backup must fail closed on any command error, empty dump or privilege mismatch. A second reviewer must approve sanitized command families and source/target scope before any live data access.

Both paths use a private operator terminal/session. Database connection details and passwords are manually entered by the authorized human and never shown to a model or placed in logs, G:, GitHub, synced folders, chat or screenshots. Use the documented **session pooler or other supported direct database connection**, without changing connection settings or granting privileges as a workaround. No paid tooling purchase or Docker installation is authorized by this addendum.

## Fixed boundaries

- Only **one pre-r2 read-only export** of `qpgwqmduqtqidmhbuclw` and one disposable **local** restore rehearsal under separate Owner 010B-1 authorization.
- Do not use any stock post-r2 dump without the split `ruins_owner` process. S2 showed it fails after r2.
- No staging SQL writes, migration, roles, keys, Edge, billing, user data to G:, or production access.
- Any unverified backup coverage, Auth/Storage/Vault/Edge exclusion, unavailable operator environment, or credential-handling concern returns **BLOCKED**.
- Neither route grants 011A authorization. The user must approve the future migration separately after recovery is verified.

Source: https://drive.google.com/file/d/1KpIJDIjOxuptekYp2OQEr5pppXDvvDzg/view and S1/S2/S2FIX receipts cited in the Dev4 adjudication.
