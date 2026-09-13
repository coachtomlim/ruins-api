# WEB-FLARE S8B Account Backend Options

This document prepares the architecture decision. It does not activate a provider.

## Option A: Supabase Auth + PostgreSQL

Strengths:

- managed email/password, magic link and OAuth options;
- PostgreSQL fits ledger, challenge, run and ownership relationships well;
- row-level security can enforce player-scoped reads/writes;
- transaction support is suitable for idempotent reward claims;
- avoids storing passwords in the game application.

Costs/risks:

- new external service and operational dependency;
- frontend/backend integration and key management required;
- production RLS and service-role boundaries must be reviewed carefully.

## Option B: HostGator PHP + MySQL + custom auth

Strengths:

- remains on existing hosting account;
- familiar PHP/MySQL capabilities are available;
- potentially fewer external vendors.

Costs/risks:

- we would own password reset, verification, session security, abuse controls and credential handling;
- more custom security-sensitive code;
- transaction/idempotency and authorization logic must be built and audited manually.

## Option C: Managed auth provider + HostGator game API/MySQL

Strengths:

- credentials handled by an auth provider;
- game data can remain on HostGator.

Costs/risks:

- split architecture and token verification complexity;
- shared-hosting API/session constraints;
- MySQL game-data authorization still needs a robust server boundary.

## Recommended direction for evaluation

Evaluate Option A first because Dungeon Runner needs more than login: immutable reward history, saved goals, run records and asset ownership. PostgreSQL plus managed auth offers a cleaner authority model than turning the public HostGator frontend into a custom credential system.

Do not implement this recommendation until the Owner explicitly accepts the account architecture.

## Proof required before adoption

A provider proof should demonstrate:

1. create test account;
2. authenticated session survives normal page navigation;
3. player can only read/write their own profile/assets;
4. one reward claim is idempotent across retry;
5. saved goal persists and reloads;
6. sign-out blocks protected operations;
7. no service/admin secret is exposed to browser code;
8. account deletion/export path is understood before production use.
