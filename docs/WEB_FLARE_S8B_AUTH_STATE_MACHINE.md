# WEB-FLARE S8B Account/Auth State Machine

This is provider-neutral authority for the first real account build. It does not select an auth vendor by itself.

## States

- `GUEST`
- `REGISTRATION_STARTED`
- `VERIFYING_IDENTITY`
- `AUTHENTICATED_UNCLAIMED`
- `AUTHENTICATED_CLAIMED`
- `SIGNED_OUT`
- `AUTH_ERROR`

## Guest invariant

A guest may receive and play a challenge without an account. Guest play must not create a hidden persistent wallet.

## Conversion path

`GUEST -> REGISTRATION_STARTED` when the receiver chooses `SAVE THIS GOAL & BUILD YOUR OWN`.

The registration handoff contains only current game context and a short-lived claim reference. It must not contain passwords or auth secrets.

After real identity verification:

`REGISTRATION_STARTED -> VERIFYING_IDENTITY -> AUTHENTICATED_UNCLAIMED`

Then the server performs one idempotent claim transaction:

1. create/confirm player profile;
2. persist saved goal;
3. record the qualifying run/challenge reference;
4. append eligible Builder gold reward ledger entry once;
5. create any starter asset ownership records;
6. mark claim consumed.

Success:

`AUTHENTICATED_UNCLAIMED -> AUTHENTICATED_CLAIMED`

## Retry safety

Registration or network retries must not duplicate rewards, goals or assets. A claim key must be unique and server-validated.

Unknown completion must be reconciled by reading authoritative server state before retrying mutation.

## Sign-out

Signing out removes authenticated session access but does not delete player assets or ledger history.

## Prototype retirement

`Buddy / Test` is never migrated as a real credential. The prototype login must not coexist on the production registration route once S8B account functionality is accepted.

## Security boundary

Passwords, magic-link tokens, OTPs or third-party OAuth secrets are managed only by the selected auth service. The game database stores provider user identity references and game-domain profile data, not reusable plaintext credentials.
