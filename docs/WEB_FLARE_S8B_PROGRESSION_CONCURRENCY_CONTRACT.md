# WEB-FLARE S8B Progression Concurrency Contract

## Problem

A player may tap twice, retry after a timeout, use multiple tabs/devices, or issue two upgrade purchases close together. Gold cannot be overspent and progression cannot be duplicated.

## Required transaction boundary

For every Gold-spending progression mutation, the authoritative backend must evaluate balance and commit debit + progression effect in one transaction.

The transaction should protect the player's wallet/progression mutation scope using the chosen database's appropriate locking or serialization mechanism.

## Required order

1. authenticate player;
2. resolve idempotency key;
3. if key already completed, return original result;
4. lock/serialize the relevant player wallet mutation scope;
5. re-read authoritative balance inside the transaction;
6. resolve current offer/catalog version;
7. validate Runner ownership and tier/cap;
8. reject if balance is insufficient;
9. append one debit ledger entry;
10. persist one progression effect/ownership record;
11. commit;
12. return new balance and Runner state.

## Concurrent purchase example

If balance is 25 Gold and two 20-Gold purchases arrive concurrently, only one may commit. The second must observe the post-first-purchase balance and fail with insufficient Gold or equivalent authoritative result.

## Duplicate retry example

If the same 20-Gold purchase is retried with the same idempotency key after an unknown client response, the backend returns the already-completed purchase. It does not append another -20 ledger entry.

## Equip concurrency

Loadout changes do not spend Gold but still need last-authoritative-write semantics and ownership validation. A response should identify the resulting loadout/version so stale clients can reconcile.

## Catalog change during purchase

If the requested offer version is stale and the authoritative cost/modifiers changed, do not silently charge the new amount. Return `STALE_CATALOG` or equivalent and require a refreshed quote/confirmation.

## Challenge creation race

Challenge creation snapshots the Runner inside an authoritative read boundary. A simultaneous upgrade may result in either the before-upgrade or after-upgrade snapshot, but the challenge must contain one internally consistent Runner snapshot and remain immutable thereafter.

## Backend-neutral requirement

Exact SQL locks/isolation levels depend on provider selection. The guarantee above is mandatory regardless of provider.