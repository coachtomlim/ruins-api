# WEB-FLARE P9 AI Encounter Assist 001

Status: SOURCE CANDIDATE — provider live proof PENDING (no safe AI-provider credential in this
environment). Not deployed. Practice remains fully usable without AI at all times.

## What this is

An optional, advisory suggestion tool inside the existing S8B Practice flow. The player may describe
a dungeon in plain language; the assistant proposes a room + encounter using only governed Flare
content, shown as a labeled preview before anything changes. The player can Apply it, ask for
another, or ignore it entirely and configure Practice manually as before.

This is **not** AI-generated art, geometry, monsters, or executable logic, and it never controls
runtime combat, rewards, or progression.

## Architecture

```
browser (practice-app.mjs)
  → ai-encounter-provider.mjs  →  suggest-encounter Edge Function  →  AI provider
  ← plan JSON (untrusted)      ←  strict JSON contract             ←
  → ai-encounter-assist.mjs: parse → validate → repair → (fallback if unsalvageable) → estimate
  → applyEncounter(plan.encounter)  — the SAME existing manual controls, no parallel runtime
```

The AI is advisory only. Every candidate is re-validated and re-estimated by the existing
deterministic S7 game logic (`encounterCost`, `calibrateEncounter`, `estimateEncounter`,
`buildS7Challenge`) before it can be applied or run. The final encounter is always legal under
current game rules, regardless of what the provider returned.

## Contract: `s9-ai-encounter-plan-001`

Allowed fields only: `roomId`, `targetHp`, `enemyTypes`, `trapTypes`, `supportTypes`, `summary`.
Any other field — Gold, XP, reward, Runner stat, item grant, level, URL, HTML, script, credential,
etc. — causes the entire candidate to be rejected outright (`FORBIDDEN_FIELD`), not merely stripped,
so a prompt-injection attempt cannot smuggle an economy field past validation.

## Deterministic repair

Applied only to genuinely well-intentioned but out-of-range plans, using existing governed IDs and
the existing 100-point budget: unknown room → null (triggers fallback); unknown monster/trap/support
→ dropped; more than three enemy slots → trimmed; duplicate trap/support → deduplicated; over-budget
→ trimmed in fixed priority (traps, then supports, then enemies) until legal; out-of-range target HP
→ clamped to 1–100.

## Fallback

If a plan cannot be safely repaired (unknown/missing room, empty result, malformed JSON, provider
failure), the assistant falls back to `calibrateEncounter()` — the same deterministic calibrator
Practice already uses for its starting encounter — never fabricated content.

## No economy effect

Generating a suggestion, previewing it, retrying, and applying it all award nothing: 0 Gold, 0 Runner
XP, 0 Builder XP, 0 items, 0 stat upgrades. Practice remains `PRACTICE RUN · NO REWARDS`. Neither
`ai-encounter-assist.mjs` nor `ai-encounter-provider.mjs` references any RPC, ledger table, or the
Supabase client at all; `practice-app.mjs` still contains no `supabase`/`createClient` reference.

## Provider boundary

The browser never holds an AI provider key. `ai-encounter-provider.mjs` calls only the project's own
`suggest-encounter` Edge Function, sending the sanitized brief (≤280 chars), an optional target HP,
and — where a session exists — the caller's own access token. It never sends and the function never
returns a provider key, a service-role key, or any other privileged credential.

`supabase/functions/suggest-encounter/index.ts` (not deployed) holds the only place a provider key
may exist, read once from `Deno.env.get('AI_ENCOUNTER_PROVIDER_KEY')`. It performs no database
write and awards nothing — it has no database credential and no reason to hold one. It returns the
provider's raw JSON text under `plan`; the browser re-validates it exactly as it would validate any
other untrusted input, so a compromised or misbehaving Edge Function still cannot escalate privilege.

## Deployment prerequisites (not done in this milestone)

1. A rotated AI provider API key set as `AI_ENCOUNTER_PROVIDER_KEY` in the function's own Supabase
   secrets store (never in `public/**`, never in a commit).
2. `supabase functions deploy suggest-encounter` from a session with the necessary project access.
3. No database migration is required — the function is stateless.

## Provider-live status

`PROVIDER LIVE PROOF: PENDING`. No safe AI-provider credential exists in this environment, so the
milestone was completed with the real provider *interface* (the Edge Function source and the exact
request/response shape it will use), a deterministic mock provider for tests, and a local browser
proof using both the mock-provider success path and the genuine provider-absent fallback path. This
is an accepted success state, not a blocker — Practice's manual flow is unaffected either way.
