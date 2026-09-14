# WEB-FLARE S8B Backend Decision Gate

Before implementing real accounts, choose the backend/auth architecture explicitly.

## HOTEL / Gamma boundary

HOTEL onboarding does not require or authorize a Dungeon Runner Supabase
project. Dungeon Runner S8B staging is a logical project in the shared Gamma
Mission Control control plane. Gamma owns orchestration metadata only; it does
not own Dungeon Runner identity, gameplay, challenge, run, reward, wallet,
inventory, equipment or progression state.

The decision in this document is solely whether Dungeon Runner independently
needs persistent cloud application state and, if so, which product-owned
backend provides it.

## Decision inputs

Compare candidate approaches against:

1. managed credential handling;
2. transaction support for reward claim + saved goal + ledger mutation;
3. player-scoped authorization/RLS capability;
4. retry/idempotency support;
5. operational complexity on mobile web deployment;
6. secret management;
7. backup/export/recovery options;
8. account deletion/data export support;
9. cost and expected player scale;
10. compatibility with HostGator-hosted frontend.

## Current leading option

Supabase Auth + PostgreSQL remains one candidate for application persistence
because it combines managed authentication with relational/transactional
persistence and row-level security. It is not a HOTEL dependency and would be
provisioned outside Gamma under Dungeon Runner authority.

This is not yet an implementation authorization.

## Gate to start S8B implementation

Owner explicitly selects the backend approach after reviewing the bounded provider proof plan.

Then create a dedicated S8B branch with:

- provider setup isolated from production;
- an isolated test/staging environment appropriate to the selected provider;
- no migration of Buddy/Test;
- no production secrets in repository;
- a bounded proof of registration, session, saved goal, one idempotent reward claim and sign-out before broader account functionality.
