# WEB-FLARE S8B Guest Claim Security Contract

## Threats to prevent

- changing client-side builder reward before account claim;
- claiming another player's guest run;
- replaying the same claim to duplicate gold/assets;
- fabricating a claim token from an invitation code;
- changing target/runner/dungeon fields between run completion and claim;
- using an expired or revoked claim;
- exposing privileged backend credentials in public JavaScript.

## Claim authority

A four-character challenge invitation is not a reward claim credential.

After a terminal guest run, the authoritative backend should mint or register a separate opaque claim reference tied to:

- canonical run ID;
- challenge ID;
- eligible Builder reward;
- goal snapshot;
- issue time and expiry;
- consumed/unconsumed state.

The browser may carry the opaque reference through registration but must not be able to alter the authoritative reward fields.

## Claim validation

Before mutation the server verifies:

1. authenticated player session;
2. claim exists and is unexpired;
3. claim has not been assigned to another player;
4. canonical run is eligible for Builder reward;
5. persisted reward matches server-governed reward rules/version;
6. idempotency key has not produced another ledger mutation.

## Retry

If a network response is lost after commit, a retry with the same authenticated player and idempotency key returns the already-created saved goal/reward record.

## Expiry

Expiry policy is a product decision for S8B. Expired claims may still allow normal account creation, but must not silently mint an expired reward.

## Browser data

Do not treat localStorage, sessionStorage, query parameters or hidden form inputs as authority for reward amount, player identity or ownership.
