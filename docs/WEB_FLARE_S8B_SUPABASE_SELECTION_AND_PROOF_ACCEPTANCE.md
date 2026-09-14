# WEB-FLARE S8B Supabase Selection and Proof Acceptance

## Authority

The Owner has intentionally reopened the Dungeon Runner application-persistence gate and selected **Supabase Auth + PostgreSQL** as the S8B application backend, subject to the normal staging-to-production gates.

This decision supersedes the earlier `UNDECIDED_EXTERNAL_TO_GAMMA` provider status and the provider-selection prohibition in the pre-persistence cutline. It does **not** change the Gamma/HOTEL boundary.

## Architecture boundary

Gamma Mission Control remains **CONTROL_PLANE_ONLY** for Dungeon Runner.

Gamma may coordinate project/work/evidence/transport metadata, but must not store or transact:

- player identities or auth credentials;
- challenges or runs;
- reward settlement or Gold ledger;
- saved goals/dungeons;
- inventory, equipment ownership or loadouts;
- permanent Runner progression.

Dungeon Runner application state belongs to the selected application backend outside Gamma.

## Selected staging environment

- provider: Supabase
- project: `Dungeon Runner S8B Staging`
- project ref: `qpgwqmduqtqidmhbuclw`
- region: `ap-southeast-1`
- environment role: isolated S8B application staging/proof only

StoryForge Studio was paused only to free a Free-plan slot. Gamma Mission Control remains active and must not be repurposed for Dungeon Runner application state.

## Accepted provider proof

The bounded proof completed successfully:

- managed signup/session: PASS;
- auth-user to player-profile trigger: PASS;
- session survives ordinary reload/navigation: PASS;
- player-owned saved goal write/read: PASS;
- row-level cross-player isolation: PASS;
- first Builder reward claim: 20 Gold / balance 20;
- retry of same award: same claim ID and ledger entry ID;
- ledger rows after retry: 1;
- cross-player reward claim: rejected `AWARD_NOT_OWNED`;
- sign-out: PASS;
- unauthenticated protected access: rejected;
- service-role secret exposed to browser: NO;
- disposable users and proof rows: cleaned.

For the autonomous proof only, signup email confirmation was temporarily disabled and then restored. **Email confirmation remains REQUIRED as the S8B production policy.**

Independent PM reconciliation after the proof confirmed zero disposable rows/users remained in the staging proof state and the Supabase security adviser retained only the intentional warning for the authenticated `SECURITY DEFINER` reward-claim boundary.

## Live-release boundary

S8A remains frozen at:

`6962696b84f44e7d15bafb770ade92d8eb0ea42b`

Live S8A must not be mutated in place to activate S8B accounts. S8B account work proceeds on its own branch/release surface until separately accepted and deployed.

## Integration branch authority

Active S8B application integration branch:

`work/web-flare-s8b-supabase-integration-001`

It inherits the accepted Gamma/HOTEL control-plane boundary from:

`work/web-flare-s8b-gamma-binding-001`

and references the completed provider-proof evidence on:

`work/web-flare-s8b-account-proof-001`

The proof branch remains evidence. Proof-only structures such as `proof_run_award` are not automatically production schema authority.

## What is now resolved

- S8B needs external application persistence: **YES**.
- selected application backend: **Supabase Auth + PostgreSQL**.
- auth identity/session provider: **Supabase Auth**.
- application database: **Dungeon Runner-owned Supabase PostgreSQL**, external to Gamma.
- production email confirmation: **REQUIRED**.
- browser credential rule: publishable client credential only; no service/admin/database secret in public JavaScript.

## Still unresolved and not to be invented

This backend selection does not resolve:

- the final signed-in reward-settlement trigger after retries/edits;
- Hero Gold treatment on failed runs;
- persistent challenge expiry/revocation;
- final persistent invite/token shape;
- exact progression prices/caps/pacing;
- whether later product UX presents one growing Runner or multiple upgradeable Runners;
- final post-registration continuation beyond the bounded integration cutline.

## Next bounded implementation cutline

Proceed first with an **account foundation slice** that does not depend on unresolved reward-settlement policy:

1. provider-backed create-account / sign-in / sign-out session adapter;
2. authenticated player profile;
3. idempotent starter Rookie Warrior provisioning;
4. starter Wooden Club +4 ATK and Wooden Shield +1 DEF ownership/equip state;
5. no starter HEAD/CHEST/HANDS/LEGS/FEET armor;
6. authenticated saved-goal persistence/readback;
7. account-ready view model fed from authoritative backend state;
8. staging-only integration/browser proof with email confirmation required;
9. no guest reward settlement activation yet;
10. no S8A live mutation or deployment.

Reward claim remains separately gated until its product trigger and authoritative guest-run claim model are accepted.

## Result

`S8B SUPABASE PROVIDER PROOF: ACCEPTED`
