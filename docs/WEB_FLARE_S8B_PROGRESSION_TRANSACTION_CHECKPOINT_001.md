# WEB-FLARE S8B Progression Transaction Checkpoint 001

## Status

`S8B PROGRESSION TRANSACTION FOUNDATION: BACKEND PASS / NO OFFERS ACTIVATED`

Branch:

`work/web-flare-s8b-progression-transaction-001`

Owner authority:

`OD-05 CALIBRATION POLICY: ACCEPTED`

## Implemented directly by PM

The PM implemented the backend transaction foundation before delegating any local-runtime verification.

Added:

- `progression_catalog_version`
- `progression_offer_catalog`
- `runner_challengeability_envelope`
- `progression_purchase`
- `runner_stat_upgrade_event`
- governed `purchase_progression_offer(...)`
- authoritative Runner projection support for permanent stat events
- explicit progression wallet debit reasons
- read-only RLS for own purchase/stat-event history
- explicit no-client-access policy for challengeability envelope

No concrete catalog version, offer or challengeability row is active in staging.

Post-proof staging authority remains deliberately empty:

- active/draft progression catalog versions: 0
- progression offers: 0
- challengeability envelope rows: 0
- progression purchases: 0
- stat upgrade events: 0

Therefore product spending remains fail-closed.

## Accepted stat-unit enforcement

The database catalog accepts only the Owner-approved atomic permanent-stat units:

- HP: +5
- ATK: +1
- DEF: +1

No independent stat maximum is used as the safety gate.

## Cumulative challengeability gate

Before a `STAT` purchase can commit, the transaction:

1. reads authoritative current effective Runner state;
2. applies the catalog stat modifier hypothetically;
3. requires an exact row in `runner_challengeability_envelope` for the active catalog's calibration version;
4. requires that row to be `PREFERRED`.

Missing envelope row fails:

`PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE`

This directly implements the accepted cumulative-power policy under the fixed 100-point Dungeon Budget.

## Wallet and concurrency authority

`purchase_progression_offer(...)`:

- requires `auth.uid()`;
- validates Runner ownership;
- locks the authenticated player's `player_profile` row before balance evaluation;
- derives balance from authoritative `wallet_ledger`;
- rejects insufficient Gold before progression mutation;
- writes the Gold debit and progression receipt in one transaction;
- uses a player-scoped client idempotency key;
- returns the original receipt on an exact retry;
- rejects semantic reuse of the same key as `IDEMPOTENCY_CONFLICT`;
- prevents repurchasing the same offer for the same Runner/catalog version.

Explicit debit reasons now include:

- `runner_stat_upgrade`
- `equipment_purchase`
- `armor_purchase`

Existing reward/admin reasons remain valid.

## Permanent stat persistence

Permanent stat training is append-only through:

`runner_stat_upgrade_event`

`get_account_runner_state(...)` now sums those events and returns:

- `base_stats`
- `stat_bonuses`
- `effective_stats`
- governed seven-slot gear

The browser does not own these values.

## Item purchase boundary

A governed `ITEM` offer can create one `runner_item_ownership` row with:

`GOLD_PURCHASE`

Purchase does not update `runner_loadout` and therefore does not equip the item.

Equip remains a separately gated future mutation because slot replacement and projected challengeability must be evaluated at equip time.

No item offer is active.

## Independent transactional Supabase proof

The PM executed a transaction-scoped synthetic proof against:

`Dungeon Runner S8B Staging`

Project ref:

`qpgwqmduqtqidmhbuclw`

The proof created two synthetic identities, starter accounts, synthetic wallet credits, one temporary active catalog, temporary offers, one temporary PREFERRED envelope row and one temporary proof-only boots item. The entire proof was rolled back.

Verified in that transaction:

- first +5 HP purchase creates exactly one debit, purchase receipt and stat event;
- resulting authoritative Runner state includes +5 HP;
- exact retry returns the same purchase ID and ledger ID;
- retry creates no second debit or stat event;
- conflicting reuse of the idempotency key is rejected;
- a +1 ATK purchase with no matching PREFERRED envelope row is rejected with zero purchase/debit residue;
- item purchase creates ownership;
- item purchase does not auto-equip the item;
- cross-player Runner purchase is rejected;
- insufficient Gold is rejected with balance unchanged;
- authenticated browser role has no direct INSERT privilege on purchases, stat events, offers or envelope rows;
- anonymous role cannot execute the purchase RPC;
- authenticated role can execute the purchase RPC.

The proof returned `PASS` and rollback restored staging to:

- Auth users: 0
- player profiles: 0
- player Runners: 0
- owned items: 0
- loadouts: 0
- progression purchases: 0
- stat events: 0
- progression catalog versions: 0
- progression offers: 0
- envelope rows: 0
- governed Runner templates: 1
- governed starter items: 2

## Security adviser

After adding an explicit deny policy for the server-only envelope table, there are no new missing-RLS/no-policy notices from this foundation.

The security adviser reports the purchase RPC as an authenticated `SECURITY DEFINER` function. This is intentional: it is the narrow server-side mutation boundary that validates identity, Runner ownership, catalog authority, challengeability, wallet balance and idempotency before writing authoritative state.

The existing `ensure_starter_account()` and `save_account_goal(...)` warnings remain for the same governed-RPC pattern.

Reference:

https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## Still deliberately inactive

This checkpoint does not activate:

- a concrete catalog version;
- an exact Gold price;
- a concrete new equipment/armor item;
- a purchase UI/button;
- equip mutation;
- drops/reward acquisition;
- trade;
- reward settlement;
- persistent challenges;
- S8A changes;
- HostGator/Vercel/main changes.

## Next decision/design boundary

The transaction foundation is ready for a first concrete catalog, but the Owner must still approve exact offer prices and any concrete non-starter item modifier before activation.

The next design task should produce the smallest useful launch catalog recommendation, constrained by the accepted price bands and PREFERRED challengeability envelope, without activating it until Owner approval.
