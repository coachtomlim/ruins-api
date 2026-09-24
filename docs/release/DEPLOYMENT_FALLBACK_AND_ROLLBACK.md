# WEB-FLARE-RC1 — Fallback Deployment & Rollback

## When to use this

Use this only if `scripts/deploy/hostgator-flare-p10-rc1.py auth` fails for connectivity reasons
(HostGator cPanel has been unreachable — `WinError 10060` — since Update 006). The automated helper
is the preferred path whenever cPanel is reachable; this manual path exists so a release is never
blocked purely on a transient network path from this machine to `gator4116.hostgator.com:2083`.

## Fallback deployment (manual cPanel File Manager)

Archive: `docs/release/web-flare-p10-rc1-release.zip`
Manifest: `docs/release/web-flare-p10-rc1-release.manifest.json` (25 files, path/sha256/mime/bytes)

Both are built by `node scripts/release/build-release-archive.mjs`, which reads file content only
via `git show <commit>:<path>` — never the working tree — so the archive can never pick up an
uncommitted secret, `.env`, or scratch file. `config.js` is deliberately **not** in the archive: it
is generated per-deployment from `S8B_SUPABASE_URL`/`S8B_SUPABASE_PUBLISHABLE_KEY` and must be
created by hand in this fallback path (step 4 below).

1. **Back up first.** In cPanel File Manager, select the entire existing
   `public_html/quick-dungeon/flare-s8b/` directory and use *Compress* to create a timestamped backup
   zip in place (e.g. `flare-s8b-backup-YYYYMMDD.zip`) before changing anything. Do not skip this —
   it is the rollback fallback if the release itself needs to be reverted (see below).
2. Upload `web-flare-p10-rc1-release.zip` into `public_html/quick-dungeon/flare-s8b/`.
3. Select it in File Manager and choose **Extract** — this overwrites the 25 release files in place
   without touching `.htaccess`, `vendor/` extras, or anything outside this directory. Delete the
   uploaded zip afterward.
4. Recreate `config.js` by hand (File Manager → New File → `config.js`, contents below), replacing
   the two placeholders with the current staging public config — **never** a `service_role` or
   `sb_secret_` key:
   ```js
   globalThis.__FLARE_S8B_PUBLIC_CONFIG__={url:"https://qpgwqmduqtqidmhbuclw.supabase.co",publishableKey:"sb_publishable_..."};
   ```
5. Confirm `.htaccess` in the directory still sets `X-Content-Type-Options: nosniff` and
   `X-Robots-Tag: noindex, nofollow` (see `HTACCESS` in the deploy helper for the exact contents if
   it needs to be recreated).
6. Smoke-test: open `https://think-2-thrive.com/quick-dungeon/flare-s8b/` and confirm the Hub loads,
   the release footer shows `WEB-FLARE-RC1 · <7-char sha>`, and Practice's AI Assist panel shows
   either live suggestions or `AI ASSIST UNAVAILABLE` (never a false "AI SUGGESTION" claim on a
   fallback result).
7. Re-run the frozen-route smoke checks by hand: `/q/hiS4`, `/q/Rind`, `/g/MsJ9`, `/h/UvVY`,
   `/j/UvVY`, `/k/UvVY`, `/m/UvVY?from=Tom` should all still load unchanged.

## Rollback (only if the release itself must be reverted)

Archive: `docs/release/web-flare-update006-rollback.zip`
Manifest: `docs/release/web-flare-update006-rollback.manifest.json` (20 files — the last actually-live
predecessor tree, source commit `523bfd7ffc46be191ce48b794708cc5af945dcda`, the accepted Update 006
source)

This has **not been executed** — it is prepared only. To roll back:

1. Restore the step-1 backup zip taken immediately before the release (preferred — it is the exact
   bytes that were actually live, including any config.js drift), **or** if that backup is
   unavailable, extract `web-flare-update006-rollback.zip` into
   `public_html/quick-dungeon/flare-s8b/` the same way as the fallback deploy above (steps 2–4),
   noting this predecessor tree has no AI Assist or S9 progression files — extra P10-only files left
   over from the release (`ai-encounter-assist.mjs`, `ai-encounter-provider.mjs`,
   `builder-progression-view.mjs`, `runner-progression-view.mjs`, `release-identity.mjs`) must be
   deleted by hand, since Extract does not remove files absent from the archive.
2. Rebuild `config.js` exactly as in fallback-deploy step 4 (unchanged — rollback does not change the
   Supabase project or its public config).
3. Post-rollback verification: repeat fallback-deploy steps 6–7. Additionally confirm the Hub does
   **not** show the P10 release footer and that Friend Share / Daily Trial / Practice behave exactly
   as they did before this release (Update 006's own accepted feature set).

## Rollback limitations (no false reversibility claims)

- **Database migrations are not rolled back by this procedure.** `20260924_s9_progression_xp_levels.sql`
  and `20260924_s9_builder_progression_challenge_journal.sql` are additive (new tables/columns/RPCs;
  `settle_daily_trial` is redefined via `drop function if exists` + recreate, not reverted to its
  pre-S9 signature). Rolling back only the static files while these migrations remain applied is safe
  — the S9/P9 client code simply won't be present to call the new RPCs — but it does **not** restore
  the database to its pre-S9 shape. A true database rollback is out of scope here and was not
  requested; it would need its own reviewed down-migration.
- Any Gold/XP/progression state written by real players between the release and a rollback is not
  reverted by this procedure — it is data, not code, and rolling back the client does not undo it.
- This document has not been executed end-to-end against production. It is a prepared, reviewed
  procedure, not a proven one.
