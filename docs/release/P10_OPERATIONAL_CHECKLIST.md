# WEB-FLARE-RC1 — Operational Checklist

## Credential lifecycle

- [ ] **Service-role/admin credential**: the credential exposed earlier in the project must remain
  unrotated-and-unused. `ROTATED_ADMIN_CREDENTIAL` status: see `P10_EXTERNAL_GATES.md`. Once rotated,
  store it only where the S9 combined-progression real-staging proof script expects it (local
  environment variable, never committed, never echoed).
- [ ] **AI provider secret** (`AI_ENCOUNTER_PROVIDER_KEY`): set only in the Supabase Edge Function's
  own secrets store when/if the Edge Function is deployed. Never in `public/**`, never in a commit,
  never in a log line. Rotate independently of the Supabase admin credential — they are unrelated.
- [ ] **cPanel API token** (`CPANEL_API_TOKEN`): read from environment only by
  `scripts/deploy/hostgator-flare-p10-rc1.py`; never printed or persisted by that script (verified in
  `tests/flare-p10-deploy-helper.test.mjs` and the repo-wide credential scan in
  `tests/flare-p10-repo-hygiene.test.mjs`). If this token is ever exposed, rotate it in cPanel and
  update the local environment only — no code change is needed since the helper always reads it fresh
  from `os.environ`.

## Leaked-password-protection decision

`P10_SECURITY_REVIEW.md` records this honestly as `PENDING_LIVE_VERIFICATION` — it was not checked
(and not claimed enabled) because this review had no live Supabase dashboard/API access. Before this
release is marked externally complete:
- [ ] Check Supabase Auth settings → confirm whether "leaked password protection" is enabled.
- [ ] If not enabled and there is no documented reason it's off, enable it — this is a low-risk,
  purely additive Supabase platform feature.
- [ ] Record the actual status (enabled/disabled + who confirmed it + date) in this checklist.

## Email confirmation

- [ ] Confirm Supabase Auth still requires email confirmation for new signups (the client code neither
  bypasses nor requests disabling it — this is purely a platform-config check).

## Post-release monitoring

- [ ] Watch for any spike in `AUTH_REQUIRED` (401) responses from `suggest-encounter` after
  deployment — would indicate a client/server auth-header mismatch from the P10 §1 bounded-access
  change.
- [ ] Watch for `PAYLOAD_TOO_LARGE`/`UNSUPPORTED_MEDIA_TYPE` responses from `suggest-encounter` — would
  indicate a client sending malformed requests (new to P10 §1).
- [ ] Confirm the Hub's release-identity footer (`WEB-FLARE-RC1 · <sha>`) matches the deployed source
  SHA after the first real deployment — mismatch means a stale `config.js` or a partial deploy.
- [ ] Watch Daily Trial / Daily Login / progression-purchase Gold-award volume for the first 24h after
  deployment for any unexpected deviation from the known +5/+10/+20/+30/+40/+35 Gold-or-XP amounts
  (would indicate an economy-invariant regression that slipped past §9's static re-proof).
- [ ] If the Edge Function was deployed, watch its `PROVIDER_TIMEOUT`/`PROVIDER_HTTP_*` error rate —
  the client always falls back gracefully, but a sustained spike indicates a provider-side issue worth
  fixing at the source.

## Standing rules this checklist exists to protect (do not weaken without explicit authorization)

- Never reuse the previously-exposed service-role/admin credential.
- Never commit or print a `service_role`/`sb_secret_`/`CPANEL_API_TOKEN`/`AI_ENCOUNTER_PROVIDER_KEY`
  value.
- Never modify the frozen Update 006 helper or its branch.
- Never claim leaked-password-protection is enabled without having actually verified it.
- Never present the AI Encounter Assist deterministic fallback as live AI-generated content.
