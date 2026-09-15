# WEB-FLARE S8B Account Foundation Client Acceptance 001

## Decision

`S8B ACCOUNT FOUNDATION CLIENT: ACCEPTED`

Independent PM audit accepted the Codex result on branch:

`work/web-flare-s8b-supabase-integration-001`

Codex start:

`d1366a7302fa435833e9c318e61d63c8f4358b50`

Codex final:

`34e986160deb331c0de69239e6d86dc38f25f4a1`

The Codex change is a strict three-commit fast-forward from the accepted PM checkpoint.

## Independent GitHub audit

Remote branch was independently reread and confirmed at Codex final SHA.

The three accepted Codex checkpoints are:

- `c1b29055940dcb7cc6af6f06a58f0990e6b4b332` — Supabase account adapter
- `52aaa0c9daf2ebb04b29279b25fdc31992b3f4f0` — isolated S8B account UI/runtime wiring
- `34e986160deb331c0de69239e6d86dc38f25f4a1` — live account-foundation journey proof

Independent compare from `d1366a7...` to `34e9861...` shows only the declared S8B account client, tests, npm/vendor support and `.gitignore` changes.

Independent compare from accepted S8A baseline `6962696b84f44e7d15bafb770ade92d8eb0ea42b` to `34e9861...` contains no changes under `public/flare-s8a/`.

Therefore:

`S8A_TREE_UNCHANGED=YES`

## Client architecture accepted

The browser client uses official `@supabase/supabase-js` and a vendored static browser bundle.

Runtime configuration remains injected through:

`globalThis.__FLARE_S8B_PUBLIC_CONFIG__`

Only a Supabase URL and publishable/public key are accepted.

The adapter rejects:

- `sb_secret_*` keys;
- JWTs with `service_role` role;
- non-public/non-anon credentials;
- non-HTTPS remote Supabase URLs.

No service-role/admin/database/management credential is present in committed account configuration.

Session handling uses Supabase client persistence, auto-refresh and URL session detection.

## Product boundary accepted

The isolated S8B client supports:

- create account;
- email-confirmation pending state;
- sign in;
- persisted authenticated session;
- starter-account provisioning;
- authoritative account-state reads;
- authoritative Gold ledger-derived balance;
- starter Runner/loadout presentation;
- governed saved-goal RPC;
- saved-goal readback;
- sign out.

Product guest reward claiming remains deliberately disabled. The abstract `claimGuestRun` capability currently fails closed with:

`PRODUCT_REWARD_CLAIM_NOT_ENABLED`

The proof-only `claim_proof_builder_reward` RPC is not called by product client code.

## Independent Supabase audit

Project:

`qpgwqmduqtqidmhbuclw`

After Codex cleanup, PM independently queried the staging database and confirmed all proof/account tables and Auth users returned to zero:

- auth users: 0
- player profiles: 0
- saved goals: 0
- wallet ledger: 0
- reward claims: 0
- player runners: 0
- owned Runner items: 0
- Runner loadouts: 0

The environment is therefore clean for the next bounded proof.

## Security adviser status

Supabase security adviser currently reports three intentional authenticated `SECURITY DEFINER` RPC warnings:

- `claim_proof_builder_reward(...)`
- `ensure_starter_account()`
- `save_account_goal(...)`

`ensure_starter_account()` and `save_account_goal(...)` are intentionally exposed authenticated transaction boundaries and validate `auth.uid()` server-side.

`claim_proof_builder_reward(...)` remains proof-only and is not part of the product client path. It should be retired or made inaccessible before production release unless a later accepted settlement design explicitly replaces it.

No new missing-RLS warning was reported.

Performance adviser reports only newly created loadout FK indexes as currently unused, which is expected in an empty staging database and is not a release blocker.

## Accepted product facts

New account state remains:

- Rookie Warrior
- base HP 100
- base ATK 8
- base DEF 0
- Wooden Club +4 ATK
- Wooden Shield +1 DEF
- effective 100 HP / 12 ATK / 1 DEF
- HEAD empty
- CHEST empty
- HANDS empty
- LEGS empty
- FEET empty
- initial Gold 0

Email confirmation remains required.

## Deferred boundaries

This acceptance does not authorize:

- guest reward settlement;
- Hero reward settlement;
- permanent stat purchases;
- equipment purchases;
- gear drops;
- trade;
- persistent challenge issuance;
- live S8A registration activation;
- HostGator deployment;
- Vercel changes;
- main-branch changes.

## Architecture debt to address before progression activation

The current Account Ready projection is intentionally starter-only and still derives effective starter stats from a small client-side starter catalog.

Before activating non-starter progression, the application must stop assuming:

- one first Runner selected by creation order;
- only Wooden Club/Wooden Shield item definitions;
- fixed 100/8/0 base stats in the Account Ready projection;
- unknown equipped items contributing zero modifiers.

Future progression work must use server-governed Runner/catalog state and fail closed on unknown equipment rather than silently treating it as zero-value gear.

## Next recommended bounded slice

Proceed next with a read-only **Runner Account Hub / authoritative Runner-state projection** before activating purchases or reward settlement.

That slice should:

1. make server-owned Runner/template/equipment data sufficient to render effective stats without hardcoded starter-only calculation in the account UI;
2. retain the existing seven-slot loadout;
3. present Stats / Equipment / Armor as read-only destinations;
4. preserve Gold as ledger-derived read-only state;
5. preserve saved-goal continuation without deciding reward settlement;
6. keep all purchase, upgrade, drop, trade and persistent-challenge mutations disabled;
7. keep S8A frozen.

This removes starter-only client authority before progression is activated and creates the correct product surface for subsequent economy decisions.
