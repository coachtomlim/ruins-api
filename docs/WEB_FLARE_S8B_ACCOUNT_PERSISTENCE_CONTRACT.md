# WEB-FLARE S8B Account + Persistence Contract

Prepared in advance only. Do not implement authentication or persistence in S8A.

## Goal

When a guest chooses `SAVE THIS GOAL & BUILD YOUR OWN`, registration must eventually convert the in-memory S8A handoff into durable player-owned state without losing reward provenance.

Preferred implementation direction: managed authentication plus PostgreSQL persistence. Supabase Auth + PostgreSQL is a strong fit, but the implementation choice remains an S8B gate and must be verified before mutation.

## Core entities

### player_profile

- id UUID, primary key, same stable identity as auth subject where practical
- display_name text
- created_at timestamptz
- updated_at timestamptz

Do not store plaintext passwords. Password handling belongs to the managed auth provider.

### wallet_ledger

Append-only reward ledger. Do not use one mutable balance as the source of truth.

- id UUID primary key
- player_id UUID
- delta_gold integer
- reason text enum-like value
- source_run_id UUID nullable
- source_challenge_id UUID nullable
- idempotency_key text unique
- created_at timestamptz

Balance is derived from ledger sum or from a reconciled projection/cache.

Initial reasons should include:

- `dungeon_builder_reward`
- `hero_runner_reward_claim`
- future `asset_purchase`
- future `admin_adjustment`

### saved_goal

- id UUID primary key
- owner_player_id UUID
- source_sender_name text
- source_runner_id text
- source_runner_name text
- source_runner_level integer
- target_hp integer
- created_at timestamptz

### owned_asset

Represents game assets owned or unlocked by a player.

- id UUID primary key
- owner_player_id UUID
- asset_type text
- asset_key text
- acquired_via text
- acquired_at timestamptz
- metadata jsonb

Do not assume asset ownership means executable code authority.

### challenge

- id UUID primary key
- creator_player_id UUID
- short_code text nullable
- runner_id text
- target_hp integer
- sender_display_name text
- created_at timestamptz

The public short code remains a transport/reference mechanism, not the authority for wallet/account state.

### run

- id UUID primary key
- challenge_id UUID nullable
- builder_player_id UUID nullable
- runner_id text
- target_hp integer
- room_id text
- encounter jsonb
- status text
- finish_hp numeric
- finish_hp_percent numeric
- score numeric
- hero_gold integer
- builder_gold integer
- duration_seconds numeric
- deterministic_input_hash text
- created_at timestamptz

### reward_claim

Optional explicit reconciliation table if wallet posting is asynchronous or retried.

- id UUID primary key
- run_id UUID
- player_id UUID
- reward_type text
- gold integer
- idempotency_key text unique
- ledger_entry_id UUID nullable
- created_at timestamptz

## Registration conversion transaction

The intended future conversion is:

`guest reward screen -> register/authenticate -> create/reconcile player profile -> save carried goal -> write authoritative run/reward evidence -> post eligible reward ledger entry exactly once -> enter Builder with saved goal ready`

This must be idempotent. Retrying registration or reward claim must never duplicate gold.

## Authority rules

- Auth provider owns credentials/session identity.
- PostgreSQL owns player/game persistence.
- Browser state is temporary presentation/input state only.
- Short invitation codes never become wallet authority.
- Wallet gold is derived from durable ledger entries.
- Every reward entry must be traceable to an accepted run or explicit governed adjustment.
- Client-submitted reward amounts are never trusted without server-side recomputation/verification from accepted run evidence.

## S8A -> S8B handoff

Consume the version-1 in-memory handoff from `public/flare-s8a/registration-handoff.mjs`.

Before persistence, S8B must validate:

- runner identity exists in governed catalog;
- target HP is legal;
- room and encounter are legal under the accepted ruleset;
- result/reward data reconciles with the authoritative deterministic run or accepted server verification;
- builder reward is zero unless status is `cleared`;
- idempotency key has not already been claimed.

## Security baseline

- no plaintext password storage;
- no auth secrets in browser code;
- row-level access controls or equivalent ownership enforcement;
- server-side validation of reward claims;
- rate limiting for registration/login/reward endpoints as appropriate;
- no trust in localStorage for wallet/assets;
- no direct browser mutation of another player's rows.
