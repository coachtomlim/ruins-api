# WEB-FLARE S8B Account and Persistence API Contract

Provider-neutral contract for the first persistent account implementation.

## General rules

- All protected mutations require an authenticated user identity established by the selected auth provider.
- Browser-supplied player IDs are never trusted as authority.
- Mutations accept an idempotency key where retries could duplicate state.
- Server responses are authoritative for persisted state and wallet balance.
- Client must reconcile unknown outcomes by reading state before retrying a mutation.

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

## POST `/api/challenges`

Creates a persistent sender challenge. Request carries runner identity and target only. Room/monsters/traps/supports remain receiver-run choices.

## POST `/api/runs`

Future server-recorded run intake. Must validate rules/content version and deterministic input identity. Do not trust client-submitted reward amount as authority.

## Error model

- `401 AUTH_REQUIRED`
- `403 FORBIDDEN`
- `404 CLAIM_NOT_FOUND`
- `409 CLAIM_ALREADY_OWNED` when owned by another identity
- `422 INVALID_CLAIM` / `INVALID_CHALLENGE`
- `429 RATE_LIMITED`
- `500 SERVER_ERROR`

Retry-safe successful duplicate requests should normally return the existing result rather than a generic conflict.

## Browser secret rule

No service-role/admin/database secret may be shipped to public JavaScript. Public browser code may use only provider-approved public client credentials and authenticated user sessions.
