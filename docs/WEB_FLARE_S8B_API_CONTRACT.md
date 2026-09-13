# WEB-FLARE S8B Account and Persistence API Contract

Provider-neutral contract for the first persistent account implementation.

## General rules

- All protected mutations require an authenticated user identity established by the selected auth provider.
- Browser-supplied player IDs are never trusted as authority.
- Mutations accept an idempotency key where retries could duplicate state.
- Server responses are authoritative for persisted state and wallet balance.
- Client must reconcile unknown outcomes by reading state before retrying a mutation.
- Browser-submitted prices, stat modifiers, ownership flags and wallet balances are never authoritative.

## POST `/api/account/claim-guest-run`

Purpose: convert a qualifying guest run into account-owned state after successful registration.

Request fields:

- `claim_token`
- `idempotency_key`

The server resolves player identity from the authenticated session and resolves the run/goal/reward context from the server-side claim token, not from editable browser reward values.

Success returns:

- canonical `player_id`
- `saved_goal_id`
- optional `run_id`
- `builder_reward_ledger_entry_id`
- resulting `gold_balance`
- starter ownership IDs if any
- `already_claimed` boolean for idempotent retries

## GET `/api/me`

Returns authenticated player profile and current derived wallet balance.

## GET `/api/me/saved-goals`

Returns player-owned saved goals with rules/version metadata.

## GET `/api/me/assets`

Returns active owned asset records. Global catalog availability remains separate from ownership.

## GET `/api/me/runs`

Returns recent canonical run history sufficient for reward/replay reconciliation.

## GET `/api/me/runners`

Returns the authenticated player's owned Runner records with:

- Runner identity/template;
- permanent stat progression;
- equipped weapon and armor;
- effective HP / ATK / DEF;
- progression/catalog version metadata.

## GET `/api/progression/catalog`

Returns the currently active, versioned progression offers that the player is allowed to see.

The server remains authoritative for prices, modifiers, tiers and caps. S8A/S8B planning does not lock the actual offer values yet.

## POST `/api/me/runners/{runnerId}/purchases`

Purchases one authorized stat upgrade, weapon or armor offer.

Request:

- `offer_id`
- `idempotency_key`

Do not accept authoritative `gold_cost`, `amount`, `stat_modifier`, `player_id` or wallet balance from the browser.

Server transaction must:

1. resolve authenticated player;
2. verify Runner ownership;
3. resolve current progression offer;
4. verify tier/cap legality;
5. verify sufficient Gold;
6. append one idempotent Gold debit;
7. persist the stat upgrade or item ownership;
8. return updated Gold balance and Runner progression state.

## POST `/api/me/runners/{runnerId}/loadout`

Equips owned weapon/armor without spending Gold unless a future rule explicitly authorizes an equip fee.

Request may include:

- `weapon_ownership_id` or null;
- `armor_ownership_id` or null;
- `idempotency_key` when retry protection is needed.

Server verifies both Runner and items belong to the authenticated player and slots are valid.

Returns refreshed effective Runner snapshot.

## POST `/api/challenges`

Creates a persistent sender challenge. Request carries current owned Runner identity plus target only. Room/monsters/traps/supports remain receiver-run choices.

The server snapshots the exact effective Runner stats, permanent progression summary, equipped weapon, equipped armor and rules/content version at creation time. Later Runner upgrades must not mutate the issued challenge.

## POST `/api/runs`

Future server-recorded run intake. Must validate rules/content version and deterministic input identity. Do not trust client-submitted reward amount as authority.

## Error model

- `401 AUTH_REQUIRED`
- `403 FORBIDDEN`
- `404 CLAIM_NOT_FOUND`
- `404 RUNNER_NOT_FOUND`
- `404 OFFER_NOT_FOUND`
- `409 CLAIM_ALREADY_OWNED` when owned by another identity
- `409 UPGRADE_ALREADY_APPLIED` when a non-repeatable tier was already applied
- `409 STALE_CATALOG` when a quote/version is no longer valid
- `422 INVALID_CLAIM` / `INVALID_CHALLENGE`
- `422 INSUFFICIENT_GOLD`
- `422 UPGRADE_CAP_REACHED`
- `422 INVALID_LOADOUT`
- `429 RATE_LIMITED`
- `500 SERVER_ERROR`

Retry-safe successful duplicate requests should normally return the existing result rather than a generic conflict.

## Browser secret rule

No service-role/admin/database secret may be shipped to public JavaScript. Public browser code may use only provider-approved public client credentials and authenticated user sessions.
