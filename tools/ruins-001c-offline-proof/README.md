# RUINS 001C offline backend proof harness (packages 006 and 008)

Offline only. Starts its own disposable PostgreSQL 17.6 on `127.0.0.1` in a fresh OS temp directory,
applies the Supabase role shim (`supabase-roles-shim.sql`, test-only, including pgcrypto in schema `extensions`)
and then the active migration **draft r2**
`supabase/drafts/ruins_001c/20261022200000_ruins_001c_private_expedition_r2_principal_binding_DRAFT.sql` as a
non-superuser `migrator`. The 006 draft is kept unmodified as the 006 proof record and as the vulnerable-design
fixture. It then attacks the result through the trusted handler candidate
(`supabase/functions/ruins-expedition/handler.mjs`) using fake accounts. The database is deleted on exit.

Suites:
- `proof.test.mjs` (P01-P21): privileges, identity isolation, concurrency, replay, rollback, oracle fuzz.
- `credential-theft.test.mjs` (C01-C13, package 008): an attacker holding only the `ruins_backend` password
  connects directly and tries every routine for a victim; the retained 006 draft is shown to be exploitable and
  r2 to block the same attack. Keys are random per run, held in memory only, and never written anywhere.

It never reads Supabase credentials and cannot target staging or production: it only connects to the
server it started.

```bash
cd tools/ruins-001c-offline-proof
npm ci
npm test
```

Set `RUINS_PROOF_EVIDENCE_DIR=<dir>` to write `db-proof-evidence.json` (privilege matrix, catalog snapshot,
concurrency and fuzz results).

Notes
- PostgreSQL binaries come from the pinned `@embedded-postgres/<platform>` package. The package's JS wrapper
  is not used (it hung on Windows); `local-pg.mjs` runs `initdb`/`postgres` directly.
- `npm ci` here may warn that the binary package's `postinstall` was not run. It is not needed on Windows.
- The repo-root `npm test` does not depend on this harness; `tests/ruins-expedition-001c-offline-proof.test.mjs`
  covers the database-free checks there and explicitly makes no DB-security claim.
