# WEB-FLARE-RC1 — External Gates (checked once each, per standing instruction)

Each gate below was checked exactly once in this run, without hammering any endpoint or repeatedly
retrying. No credential value is printed anywhere in this document or in any command output kept from
this session.

## 1. S9 combined-progression real-staging proof

**Status: `S9 LIVE ADMIN PROOF: PENDING_CREDENTIAL`**

Checked the local environment for a rotated Supabase admin/service-role credential
(`SUPABASE_SERVICE*`, `SUPABASE_ADMIN*`, `ROTATED*` prefixes). None found. The previously-exposed
service-role credential remains **not reused** — per the standing rule, its mere presence would not
have been sufficient to unblock this gate even if found; only a genuinely rotated replacement would.
The outstanding S9 combined real-staging proof (Daily Trial + Runner/Builder progression against real
staging with disposable users) remains not run. This does not block internal engineering completion —
it is an accepted external-credential-pending state, consistent with every prior gate in this project
that hit the same constraint.

## 2. AI provider live proof

**Status: `AI LIVE PROVIDER PROOF: PENDING_CREDENTIAL`**

Checked the local environment for an AI provider key (`AI_ENCOUNTER_PROVIDER_KEY`,
`ANTHROPIC_API_KEY`). None found. The `suggest-encounter` Edge Function has not been deployed and no
real-provider proof was run. Production behavior in this state is the correct, honest one: Practice's
AI Assist panel probes availability at bootstrap (`checkAiAvailability()`), gets `{available:false}`
from any unreachable/unconfigured endpoint, and presents "AI ASSIST UNAVAILABLE / USE CALIBRATED
SUGGESTION" — it does not and cannot silently claim AI availability it hasn't confirmed. This is the
P10 §4/5 blocking requirement, and it is what makes this pending gate safe to leave pending: the
product never misrepresents its own state either way.

## 3. HostGator cPanel connectivity

**Status: `HOSTGATOR DEPLOYMENT: PENDING_CONNECTIVITY`**

`CPANEL_API_TOKEN` was present in the local environment. Ran exactly one bounded, read-only check:

```
python scripts/deploy/hostgator-flare-p10-rc1.py auth
```

Result: the helper's offline `AI AVAILABILITY HONESTY: PASS` gate ran and passed (confirming the
helper's own static logic is sound even when the network call that follows fails), then the network
call to `gator4116.hostgator.com:2083` failed:

```
BLOCKED: cPanel connection failed: <urlopen error [WinError 10060] A connection attempt failed
because the connected party did not properly respond after a period of time, or established
connection failed because connected host has failed to respond>
```

This is the same failure mode observed on every attempt since Update 006 (multiple prior sessions).
Per the standing instruction, this was checked exactly once in this run and is not retried. The
prepared fallback path (`docs/release/web-flare-p10-rc1-release.zip` +
`DEPLOYMENT_FALLBACK_AND_ROLLBACK.md`) remains the way to ship this release until connectivity from
this environment to HostGator's cPanel API is restored, or the deployment is run from an environment
that can reach it.

## Production deployment decision

**No production deployment was run in this pass.** Per the explicit instruction ("Do not run
production deployment unless all required production gates are ready"), and since gate 3 above is
blocked, `deploy` mode was never invoked — only the read-only `auth` check.
