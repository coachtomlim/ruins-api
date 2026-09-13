# WEB-FLARE S8B Supabase Proof Plan

Status: candidate evaluation only. Do not create or modify production infrastructure from this document.

## Goal

If the Owner selects Supabase Auth + PostgreSQL for S8B, run one bounded staging proof before building the full account system.

## Proof surface

Use a dedicated non-production Supabase project and an isolated frontend route/build.

Prove only:

1. create test user through managed auth;
2. complete verification/session establishment;
3. read own player profile under RLS;
4. fail to read another test player's profile;
5. create one saved-goal record for authenticated player;
6. claim one prepared reward using a server-side function/transaction and unique idempotency key;
7. retry the same claim and prove no duplicate ledger entry;
8. read resulting Gold balance from ledger-derived state;
9. sign out and prove protected reads fail;
10. confirm no service-role secret exists in browser bundle or repository.

## Frontend compatibility

The production game frontend currently lives on `https://think-2-thrive.com`. Before any production activation, configure only the exact required auth redirect/origin entries and test them from the isolated S8B proof route.

## Data scope for proof

Minimum tables/entities:

- player profile;
- saved goal;
- guest claim;
- gold ledger.

Do not build progression, shop, social graph, asset marketplace or full challenge history during the provider proof.

## Owner gate

Return evidence and a recommendation. Only after Owner acceptance should a full S8B implementation branch be authorized.
