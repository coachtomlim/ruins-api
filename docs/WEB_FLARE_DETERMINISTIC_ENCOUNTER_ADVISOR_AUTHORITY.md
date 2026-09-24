# WEB-FLARE Deterministic Encounter Advisor Authority

Status: AUTHORITATIVE FOR CURRENT P9/P10 RELEASE WORK

This document supersedes the external-AI/provider assumptions introduced by
`WEB_FLARE_P9_AI_ENCOUNTER_ASSIST_001.md`.

## Product invariant

Quick Dungeon Builder and Encounter Advisor are deterministic application features.

No external AI model, LLM, hosted inference service, AI provider credential, or AI proxy is required
or permitted for encounter advice.

## Deterministic advice path

`current encounter → legal variation enumeration → existing deterministic estimate/calibration →
rank against target/difficulty intent → show SUGGESTED ADJUSTMENT → player apply/edit/reject →
normal Builder validation → Practice run`

The implementation uses only governed Quick Dungeon inputs:

- current encounter;
- legal monster IDs;
- legal trap IDs;
- legal support IDs;
- Dungeon Budget 100;
- authoritative Runner snapshot;
- existing `estimateEncounter()` / `difficultyCue()`;
- target finishing HP;
- deterministic intent parsing.

## Supported advice intents

Examples include:

- make this easier;
- make this harder;
- get closer to 60% finishing HP;
- suggest another legal variation;
- reduce difficulty;
- increase challenge while remaining legal.

Natural-language input is parsed locally into bounded deterministic intent. It is never sent to a
network service.

## External-service boundary

Encounter advice uses:

- no OpenAI;
- no ChatGPT API;
- no Anthropic/Claude API;
- no Gemini API;
- no LLM gateway;
- no Supabase Edge Function;
- no external inference endpoint.

No AI-provider secret exists in the release contract.

## Removed/retired P9 components

The following external-AI components are obsolete under this authority:

- `public/flare-s8b/ai-encounter-provider.mjs`;
- `supabase/functions/suggest-encounter/index.ts`;
- provider availability probing;
- AI provider timeout/network handling;
- `AI_ENCOUNTER_PROVIDER_KEY`;
- AI live-provider release gating;
- player-facing `AI ENCOUNTER ASSIST`, `AI SUGGESTION`, and `AI ASSIST UNAVAILABLE` states.

The useful deterministic calibration/advice concept is retained and promoted as:

`public/flare-s8b/encounter-advisor.mjs`

## Economy boundary

Encounter Advisor awards and mutates none of:

- Gold;
- Runner XP;
- Builder XP;
- Runner level;
- Builder level;
- equipment;
- stats;
- Daily Trial;
- Daily Login;
- Challenge Journal.

Practice remains `PRACTICE RUN · NO REWARDS`.

## Release impact

An AI-provider credential is NOT a release gate.

There is no AI-provider live proof requirement.

The complete core product remains self-contained with respect to encounter creation, advice,
calibration, validation, sharing, execution and progression.
