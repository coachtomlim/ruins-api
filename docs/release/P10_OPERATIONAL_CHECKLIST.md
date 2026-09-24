# WEB-FLARE-RC1 — Operational Checklist

## Credential lifecycle

- [ ] **Service-role/admin credential**: the credential exposed earlier in the project must remain
  unrotated-and-unused. `ROTATED_ADMIN_CREDENTIAL` status: see `P10_EXTERNAL_GATES.md`. Once rotated,
  store it only where the S9 combined-progression real-staging proof script expects it (local
  environment variable, never committed, never echoed).
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


## Standing rules this checklist exists to protect (do not weaken without explicit authorization)

- Never reuse the previously-exposed service-role/admin credential.
- Never commit or print a `service_role`/`sb_secret_`/`CPANEL_API_TOKEN` value.
- Never modify the frozen Update 006 helper or its branch.
- Never claim leaked-password-protection is enabled without having actually verified it.
- Encounter advice must remain deterministic and self-contained; do not introduce an external AI/API dependency.
