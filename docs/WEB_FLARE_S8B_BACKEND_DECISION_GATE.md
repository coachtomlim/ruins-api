# WEB-FLARE S8B Backend Decision Gate

Status: **CLOSED / PASS**

The Owner has selected **Supabase Auth + PostgreSQL** as the Dungeon Runner S8B application backend after a successful isolated provider proof.

## HOTEL / Gamma boundary

HOTEL/Gamma remains independent control-plane infrastructure.

Gamma Mission Control owns orchestration metadata only. It must not store or transact Dungeon Runner identity, gameplay, challenge, run, reward, wallet, inventory, equipment, saved-goal or progression state.

The Dungeon Runner application backend is therefore external to Gamma even though the project is coordinated through Gamma/HOTEL.

## Selected application backend

- provider: Supabase Auth + PostgreSQL
- staging project: `Dungeon Runner S8B Staging`
- project ref: `qpgwqmduqtqidmhbuclw`
- region: `ap-southeast-1`
- production email confirmation policy: REQUIRED

## Decision inputs satisfied

The bounded staging proof demonstrated:

1. managed credential/session handling;
2. transactional/idempotent reward mutation;
3. player-scoped RLS isolation;
4. retry safety without duplicate Gold;
5. browser-compatible managed Auth;
6. public-client credential boundary with no service-role exposure;
7. authenticated saved-goal persistence;
8. sign-out and unauthenticated denial.

Account deletion/export, production SMTP/deliverability, recovery UX and production operational sizing remain launch-readiness concerns, not blockers to the bounded S8B staging integration slice.

## Gate result

The provider-selection gate is satisfied.

Proceed on:

`work/web-flare-s8b-supabase-integration-001`

under the authority of:

`docs/WEB_FLARE_S8B_SUPABASE_SELECTION_AND_PROOF_ACCEPTANCE.md`

## Current integration constraint

Backend selection does not authorize unresolved reward/product policy to be invented.

The first integration slice therefore activates only:

- managed account/session adapter;
- authenticated profile;
- starter Runner provisioning;
- starter Club + Shield ownership/loadout;
- authenticated saved-goal persistence;
- backend-fed account-ready state.

Guest reward settlement, persistent challenge issuance, purchases/upgrades and live S8A wiring remain separately gated.
