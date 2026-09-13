# WEB-FLARE S8B Account UX Contract

This contract defines product behavior before selecting exact auth screens/provider widgets.

## Entry points

1. Receiver conversion after rewards: `SAVE THIS GOAL & BUILD YOUR OWN`.
2. Returning player builder entry: `SIGN IN`.
3. New player direct entry: `CREATE ACCOUNT`.

## Receiver conversion

The registration page keeps visible context from the completed challenge:

- source friend/sender display name;
- Hero-Runner identity;
- target finishing HP;
- preview of eligible Builder gold;
- explicit statement that the account will save the goal and assets after successful registration/claim.

Do not lose the player's reason for registering behind a generic sign-up form.

## Registration

Preferred product flow should minimize friction on phone. Exact method is provider decision, but the product should support a modern managed identity path such as email verification/magic link or equivalent.

The game must never store plaintext passwords itself.

## Post-registration success

After authentication and idempotent claim succeeds, show:

`ACCOUNT READY`

- saved goal confirmed;
- Builder gold credited once;
- current wallet balance;
- `BUILD YOUR CHALLENGE` primary action.

## Sign in

Returning players land on their game home/builder context, not the old Buddy/Test screen.

## Error/retry

Identity verification failure must not consume the guest reward claim.

Unknown claim completion must reconcile authoritative account state before another mutation.

## Sign out

Sign out ends protected session access but preserves server-side player assets and history.

## Recovery and account management

Password/magic-link recovery, account deletion and data export requirements are delegated to the selected auth/provider architecture and must be understood before production launch.
