# P10 §5 — Database, Authentication & Credential Security Review

Method: independent static audit via `pglast` (real PostgreSQL/PL-pgSQL parsing) + regex cross-check
over all 17 migrations, plus a full PGlite execution of the migration chain (84/84 checks passed,
including every existing anon/authenticated-denial and RLS-isolation assertion) with the new
hardening migration appended on top. No staging database was queried or modified for this review.

## Finding 1 (fixed): two SECURITY DEFINER functions used `search_path = public` instead of `''`

`ensure_starter_account()` and `save_account_goal()` (both from the earliest 2026-09-14 foundation
migrations) were the only two SECURITY DEFINER functions in the project not using the project's own
established `set search_path = ''` pattern — every function added since (S8B Daily Trial onward) uses
the empty string. Both bodies already schema-qualify every reference (`public.*`, `auth.uid()`), so
the fix changes no behavior; it removes the (low but real — the local test harness's own bootstrap
grants `CREATE ON SCHEMA public TO authenticated`, mirroring a plausible real configuration) risk that
an object created in a writable `public` schema could shadow an unqualified reference inside a
SECURITY DEFINER function and escalate privilege.

Fixed via a **new** migration, `20260924_p10_security_definer_search_path_hardening.sql`, following
this project's established convention of never editing an already-applied migration file. Verified:
- Parses cleanly with `pglast`.
- Applies cleanly on top of the full 17-migration chain in PGlite, with all 84 existing S9 checks
  (including `ensure_starter_account`'s own "bootstraps a runner for U1" assertion) still passing.
- `tests/flare-p10-security-review.test.mjs` adds a **generic regression guard**: it scans every
  SECURITY DEFINER function across the entire migration set and asserts every one resolves to
  `search_path=''` as of its latest `create or replace` — so this class of regression cannot recur
  silently in a future migration.

## Finding 2 (no defect): RLS coverage is complete

Every table created across all 17 migrations (`player_runner`, `runner_loadout`, `runner_xp_event`,
`builder_challenge`, `daily_trial_run`, `progression_purchase`, etc. — 18 tables) has
`ENABLE ROW LEVEL SECURITY` in the same migration that creates it. No table was found with a policy
gap. (`player_profile`, `wallet_ledger`, `saved_goal` are bootstrapped in the local test harness, not
these migrations, and were separately confirmed RLS-enabled with owner-only `select` policies.)

## Finding 3 (no defect): mutation RPCs remain the only write path

The full test suite (`tests/flare-*-progression-*.test.mjs` and others, exercised again in this
review's PGlite run) independently confirms: `anon` cannot call any of `get_runner_progression`,
`equip_runner_item`, `create_builder_challenge`, `get_builder_progression`, `get_builder_challenges`;
`authenticated` cannot directly `INSERT`/`UPDATE` `runner_xp_event`, `runner_loadout`,
`builder_challenge`, or `builder_xp_event`. All progression-affecting writes go through SECURITY
DEFINER RPCs with server-derived inputs (Gold amounts, XP amounts, tier labels are never accepted
from the client).

## Auth review (static code only — see PENDING items below)

- **Redirect safety**: `normalizeEmailRedirectTo()` in `account-adapter.mjs` rejects any non-`http(s)`
  scheme, requires HTTPS except for `localhost`/`127.0.0.1`/`::1`, and strips `hash`/`search` before
  the URL is sent to `signUp()` — closing the common open-redirect-via-fragment pattern.
- **Session config**: the browser client uses the SDK's standard `persistSession:true,
  autoRefreshToken:true, detectSessionInUrl:true` — no lowered or custom session handling.
- **Account enumeration**: `errorMessage()` in `account-app.mjs` passes through Supabase's own
  generic "Invalid login credentials" message for sign-in failures; the codebase contains no custom
  "no such account" / "account not found" branch that would let an attacker distinguish a wrong
  password from a nonexistent account.
- **Error leakage**: adapter errors are mapped to a small fixed set of player-facing strings
  (`errorMessage()`); no SQL, RPC name, or stack trace reaches the UI in the reviewed paths.

### PENDING (require live Supabase dashboard/API access, not available in this environment)

- `S8B EMAIL CONFIRMATION: PENDING_LIVE_VERIFICATION` — the client neither bypasses nor requests
  disabling email confirmation; whether it is actually enforced is a project-level Supabase Auth
  setting this review cannot read without a live credential.
- `S8B LEAKED_PASSWORD_PROTECTION: PENDING_LIVE_VERIFICATION` — same constraint. This review makes
  **no claim** that it is enabled; it was not fabricated as PASS.

## Credential hygiene (scoped to files touched/reviewed in this pass)

No real `service_role`, `sb_secret_`, or provider credential was found in any file reviewed in §1–§5.
Every `service_role`/`sb_secret_` string match is one of three known guard patterns (documented in
`docs/release/DEPLOYMENT_FALLBACK_AND_ROLLBACK.md`'s archive-safety note): the admin-key rejection
check in `account-adapter.mjs`, the URL-safety scan in `friend-share.mjs`, and the Supabase SDK's own
new-key-format detector in `vendor/supabase.js`. A full repository-wide scan (not limited to files
touched in P10) is §6's scope, not this section's.
