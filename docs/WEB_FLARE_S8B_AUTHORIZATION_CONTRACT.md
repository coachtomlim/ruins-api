# WEB-FLARE S8B Authorization Contract

## Principle

Authentication proves who the player is. Authorization decides which game records that identity may access or mutate.

## Player-owned data

An authenticated player may read their own:

- profile;
- wallet/ledger view;
- saved goals;
- owned assets;
- authored dungeon configurations;
- challenge history where they are sender;
- run history where they are receiver/owner subject to product privacy rules.

## Mutations

A player may mutate only records owned by their authenticated identity, except for server-governed append-only records such as reward ledger entries and canonical run results.

## Server-only writes

The browser must not directly create authoritative:

- reward ledger entries;
- claim-consumed markers;
- canonical server run verification records;
- ownership grants whose acquisition reason requires server validation.

Those writes occur through server functions/API operations after validation.

## Public challenge access

A valid challenge invitation may reveal only the minimum gameplay data required for guest play: runner identity/version, target HP and safe sender display context. It must not expose private profile, wallet or asset records.

## Row-level security expectation

If PostgreSQL/Supabase is selected, RLS should default deny and explicitly allow player-scoped access using authenticated user identity. Service-role/server operations remain separate and are never exposed to browser clients.

## Test cases

- Player A cannot read Player B wallet or saved goals.
- Player A cannot claim Player B consumed reward.
- Guest can open a public challenge but cannot query private player data.
- Signed-out session loses protected access immediately after token/session invalidation.
- Admin/server-only operations fail from normal browser credentials.
