# WEB-FLARE S8B Account UX Contract

This contract defines product behavior before selecting exact auth screens/provider widgets.

## Entry points

1. Receiver conversion after rewards: `SAVE THIS GOAL & BUILD YOUR OWN`.
2. Returning player builder entry: `SIGN IN`.
3. New player direct entry: `CREATE ACCOUNT`.

## Receiver conversion

Registration keeps visible context from the completed challenge: friend/sender, Hero-Runner, target finishing HP, eligible Builder Gold preview, and why the player is creating an account.

Do not hide the game conversion behind a generic signup page.

## Registration

Use a managed identity flow suitable for phone. Exact provider/method remains a backend decision. The game never stores plaintext passwords itself.

## Account starter state

A new player account receives a starter Rookie Warrior with:

- Wooden Club equipped, +4 ATK;
- Wooden Shield equipped, +1 DEF;
- empty head/chest/hands/legs/feet armor slots;
- no starter armor set.

Starter item ownership is a grant, not a Gold purchase. Default clothing is visual baseline only.

## Post-registration success

After authentication and idempotent guest claim succeeds, show:

`ACCOUNT READY`

Include:

- saved incoming goal confirmed;
- eligible Builder Gold credited once;
- current Gold balance;
- starter Runner card with Club + Shield visible;
- clear empty armor slots to signal future progression;
- `BUILD YOUR CHALLENGE` as the main continuation;
- `UPGRADE YOUR RUNNER` as a visible progression destination when account-backed progression is enabled.

Do not imply that the player already owns boots/head/chest/hands/legs armor.

## First equipment moment

When the player later acquires the first armor piece, preserve a game-like moment such as `NEW FOOTWEAR!` or `NEW HEAD GEAR!`, showing the stat effect and `EQUIP` action. Acquisition may later come from purchase, reward, drop or unlock; the account UX must not hardwire one source prematurely.

## Sign in

Returning players land in game/account context, never the old Buddy/Test prototype gate.

## Error/retry

Identity verification failure must not consume a guest claim. Unknown claim completion reconciles authoritative state before retrying.

## Sign out and recovery

Sign out ends protected session access but preserves server-side assets/history. Recovery, account deletion and export requirements must be resolved with the selected auth provider before production launch.
