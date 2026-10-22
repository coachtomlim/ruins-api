# RUINS 001C offline backend proof harness (package 006)

Offline only. Starts its own disposable PostgreSQL 17.6 on `127.0.0.1` in a fresh OS temp directory,
applies the Supabase role shim (`supabase-roles-shim.sql`, test-only) and then the migration **draft**
`supabase/drafts/ruins_001c/20261022120000_ruins_001c_private_expedition_DRAFT.sql` as a non-superuser
`migrator`. It then attacks the result through the trusted handler candidate
(`supabase/functions/ruins-expedition/handler.mjs`) using fake accounts. The database is deleted on exit.

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
