# P10 §7 — Failure UX, Resilience, Performance, Accessibility

## Failure UX (fixed 1 real defect)

Audited every `catch`/error-surfacing path across `account-app.mjs`, `daily-trial-app.mjs`,
`friend-share.mjs`, `practice-app.mjs`, and `ai-encounter-provider.mjs`.

**Fixed**: `account-app.mjs`'s `errorMessage()` — used by every account/purchase/equip/friend-share
failure path — had no catch-all for an unrecognized error. Its fallback stripped one known prefix and
otherwise returned the raw message verbatim. In every currently-observed path this only ever surfaces
the project's own short `UPPER_SNAKE_CASE` RPC exception codes (harmless), but nothing prevented a
raw Postgres error (a constraint name, a column name, a relation name) or a raw network error from
reaching the player unfiltered if one ever occurred. Added a safety net: the project's own short codes
still pass through unchanged; anything containing SQL-error vocabulary (`relation`, `column`,
`syntax error`, `duplicate key`, `violates`, `permission denied for`, `constraint`) or raw
network-error vocabulary (`ECONNREFUSED`, `fetch failed`, `NetworkError`) is replaced with a generic
"Something went wrong. Please try again." Verified in `tests/flare-p10-failure-ux.test.mjs` against 8
realistic raw-error strings, plus regression coverage for every previously-recognized friendly-message
case and the project's own error codes.

**No defect found** (already sound, verified by re-reading source):
- `daily-trial.mjs`'s `dailyTrialErrorMessage()` already has a safe generic fallback
  (`'Daily Trial status is uncertain. Reload to check your account.'`) and every call site in
  `daily-trial-app.mjs` routes through it — never a raw `error.message`.
- `practice-app.mjs`'s two `error.message` surfaces are safe by construction: Practice never touches
  Supabase (already enforced by an existing test), so every error reaching them originates from
  hand-authored strings (`'Catalogue unavailable'`, `'S7 game model unavailable'`,
  `loadSnapshot()`'s own messages) or internal game-logic errors, never a database error.
- `friend-share.mjs`'s clipboard path already falls through `navigator.clipboard` →
  `document.execCommand('copy')` → `copied:false`, never throwing; its native-share path correctly
  distinguishes a user cancel (`AbortError`) from a real failure, and any real failure now routes
  through the hardened `errorMessage()` above via `openFriendShare()`'s catch block.
- `ai-encounter-provider.mjs`'s `requestEncounterSuggestion()`/`checkAiAvailability()` already map
  every failure mode (timeout, network error, non-200, malformed JSON, unconfigured) to typed
  `AIProviderError` codes or a safe `{available:false}` — covered by the existing P9 test suite and
  never throw past `runAiSuggestion()`'s own catch, which falls back to the deterministic calibrator.

## Offline / network resilience

- AI Assist: unavailable/timeout/network-error all fall back to the deterministic calibrator, never a
  blocked UI (P9/P10 §4 coverage, 50 tests).
- Daily Trial: `waitForClaimable()`'s catch swallows a status-check failure and simply retries on the
  next poll rather than breaking the page.
- Practice: entirely offline-capable once its two fetches (catalog.json, game.json) succeed once —
  no live network dependency during a run.
- Flare art/room assets: `loadS7StockRoom`/`loadS7PlayableRoom` failures already surface through the
  existing `$('introStatus')`/`$('buildStatus')` error paths reviewed above.

## Accessibility (static census — not a full live audit)

`grep`-verified presence, not yet exhaustively tested with a screen reader or automated a11y tool:
- Hub (`index.html`): 40 `aria-live`/`aria-label`/`role` attributes present across dialogs, tabs, and
  status regions.
- Practice / Daily Trial: 4 each — comparatively thin; the AI Assist status line (`#aiStatus`) and
  practice result panel are not confirmed to be `aria-live` regions. **Not fixed in this pass** — flag
  for a follow-up accessibility-focused pass rather than a speculative edit here.
- Reduced motion: `prefers-reduced-motion` is honored in 3 locations (Practice's renderer `draw()`
  call already gates animation on it, confirmed in `practice-app.mjs`).
- Touch targets: 16 `min-height:44px`/`min-width:44px` declarations across the S8B stylesheets,
  including the P10-added AI Assist controls (verified by the existing P9 test).

**This accessibility section is a static census, not a full live keyboard/contrast/screen-reader
audit** — an exhaustive audit across every screen and interaction state was out of scope for the time
available in this pass. It is recorded honestly as partial, not claimed complete.

## Performance

Runtime manifest (`docs/release/WEB-FLARE-RC1-MANIFEST.json`) gives real, current byte weights:
- `vendor/supabase.js`: 218,328 bytes (the dominant asset; third-party, unchanged by this project).
- `account.css`: 20,031 bytes; `account-app.mjs`: 22,992 bytes — the two largest first-party files,
  both pre-existing (not grown materially by P10; P10's own additions — `ai-encounter-assist.mjs`
  10,313 bytes, `ai-encounter-provider.mjs` 4,946 bytes, `release-identity.mjs` well under 1KB — are
  small relative to the existing S8B baseline).
- Total flare-s8b runtime tree: 387,400 bytes (~378KB) across 25 files — no build/bundle step exists
  in this project, so this is also what ships to the browser as-is.

No material performance regression was found attributable to P10; no fix was needed here.
