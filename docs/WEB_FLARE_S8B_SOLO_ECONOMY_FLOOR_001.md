# WEB-FLARE S8B Solo Economy Floor 001

## Status

IMPLEMENTATION CANDIDATE — BRANCH ONLY, NOT DEPLOYED, NOT APPLIED TO SUPABASE

## Purpose

Give an authenticated Runner owner a secure minimum Gold income even when no friend has run a social challenge yet, without turning Practice into a farmable reward loop.

## Accepted existing authority

- Starter Runner effective stats: 100 HP / 12 ATK / 1 DEF.
- Active stat offers: Endurance I 20 Gold, Strike I 30 Gold, Guard I 40 Gold.
- Dungeon Budget remains 100.
- Practice runs remain unlimited and reward-free.
- Wallet authority remains append-only `wallet_ledger`.
- Gold balance remains `SUM(delta_gold)`.
- Social Builder/Hero settlement remains separately governed and is not activated by this slice.

## Solo economy v1

### Daily Bonus

- Base reward: 5 Gold.
- One claim per authenticated player per UTC calendar day.
- Server determines the claim day.
- Browser cannot choose the day, reward amount or streak.
- Claim is atomic and idempotent.
- A duplicate/retry returns the existing result rather than minting another ledger entry.

### Seven-day streak

Consecutive successful Daily Bonus claims advance a 1–7 streak cycle.

- Days 1–6: 5 Gold each.
- Day 7: 5 Gold base + 10 Gold streak bonus = 15 Gold.
- After Day 7, the next consecutive claim starts a new cycle at Day 1.
- Missing a UTC day resets the next claim to Day 1.

Maximum seven-day solo login income:

`5 + 5 + 5 + 5 + 5 + 5 + 15 = 45 Gold`

This means a solo player can reach:

- Endurance I (20 Gold) after four base daily claims;
- Strike I (30 Gold) after six base daily claims;
- Guard I (40 Gold) within a complete seven-day streak.

This is intentionally slower than the future social challenge economy.

## Why Practice still pays zero

The current Practice simulation is browser-local and deliberately non-persistent.

It has no canonical server-side run record that proves a specific player actually cleared a specific governed Daily Trial.

Therefore this slice MUST NOT grant Gold for:

- Practice clears;
- FAIR / BRUTAL practice presets;
- client-submitted finish HP;
- client-submitted combat outcomes.

Doing so would let a browser mint Gold by calling an RPC without completing combat.

## Daily Trial

A future Daily Trial remains desirable, but activation is held behind a canonical server-verifiable trial/run settlement boundary.

Required before activation:

1. deterministic daily trial identity/version;
2. authoritative run identity;
3. server-verifiable completion entitlement;
4. one rewarded clear per player/day;
5. idempotent ledger settlement;
6. replay remains reward-free after settlement.

The UI may show Daily Trial as a future Gold source, but no active claim control is authorized here.

## Flare-native presentation

Use stock Flare v1.15 presentation assets where practical.

Pinned source:

`flareteam/flare-game @ 2ef474f5f5f368628bc526f9e56f936dac743e49`

Relevant assets:

- `mods/fantasycore/images/menus/inventory.png`
- `mods/fantasycore/images/menus/storage_generic.png`
- `mods/fantasycore/images/loot/coins5.png`

The existing loadout geometry already mirrors the canonical Flare inventory slots. This slice may place the stock inventory artwork behind that layout and use the Flare Gold loot image in the Daily Bonus card.

Do not copy Flare RPG prices or stats into Dungeon Runner.

## Data model

Add `daily_login_claim` as immutable reward evidence:

- claim id
- player id
- reward day
- streak day
- base Gold
- streak bonus Gold
- ledger entry id
- created timestamp

Unique:

- `(player_id, reward_day)`
- ledger entry id

The wallet entry uses reason:

`daily_login_bonus`

and a server-derived idempotency key:

`daily-login:<player-id>:<YYYY-MM-DD>`

## Security

The claim RPC must:

1. require `auth.uid()`;
2. lock the player's profile row to serialize concurrent claim attempts;
3. compute UTC reward day server-side;
4. derive streak from durable prior claims;
5. return an existing same-day claim on retry;
6. append exactly one positive wallet ledger row;
7. insert exactly one claim evidence row;
8. return authoritative resulting balance.

Direct INSERT/UPDATE/DELETE privileges are not granted to the browser.

## Non-scope

This slice does not implement:

- persistent Daily Trial reward;
- Builder/Hero social reward settlement;
- challenge issuance;
- gear purchase;
- gear equip mutation;
- drop tables;
- selling gear;
- trade;
- reward ads or paid currency.

## Acceptance

The slice is acceptable when:

- Daily Bonus can be claimed once per UTC day;
- retry is idempotent;
- concurrent claim attempts cannot mint twice;
- Day 7 awards exactly 15 Gold;
- missed day resets the next streak to Day 1;
- UI refreshes Gold immediately after authoritative claim;
- Practice remains no-reward;
- frozen S7/S7.1/S8A/P0 files remain untouched;
- no Supabase migration is applied until a separate staging authorization.
