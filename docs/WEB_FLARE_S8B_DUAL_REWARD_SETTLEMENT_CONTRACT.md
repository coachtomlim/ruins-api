# WEB-FLARE S8B Dual-Party Reward Settlement Contract

## Product truth

A completed receiver run can create two different game rewards:

1. **Hero reward**: gold actually collected by the sender/friend's Hero-Runner during the run. This belongs to the sender/friend side.
2. **Dungeon Builder reward**: gold awarded for how closely the receiver's dungeon achieved the target while still allowing the Hero to clear. This belongs to the receiver/builder side.

They are shown together on the result screen but must never be merged into the wrong player's wallet.

## S8A behavior

S8A displays both values as a preview/result only. No wallet mutation occurs.

## S8B ownership

When real accounts exist:

- Hero gold settles to the challenge sender's account, if the challenge has an authenticated sender owner.
- Builder gold settles to the receiver's account. If the receiver is still a guest, it remains claimable only through the governed guest-claim path.

If the Hero dies after collecting gold, the Hero-side collected gold may still be displayed as actual collected gold. Builder reward remains 0 because the Hero did not clear.

## Anti-farming problem

`RUN AGAIN` must not allow unlimited persistent gold minting from identical challenge/dungeon inputs.

## Recommended initial settlement rule

For S8B v1, treat every displayed result as a **reward preview** until one run is selected as the settlement run for that challenge-receiver session.

- Receiver may retry/edit freely.
- Only one canonical run per challenge-receiver session becomes `SETTLED`.
- Settling that run credits Hero gold to sender once and Builder gold to receiver once.
- Guest receiver settlement may be completed atomically during account conversion.
- Once settled, replay remains available for fun/testing but does not mint another persistent reward for the same session.

Recommended idempotency keys:

- `hero-reward:<settlement-id>:<sender-player-id>`
- `builder-reward:<settlement-id>:<receiver-player-id>`

## Decision still required

Before S8B implementation, Owner must choose what user action finalizes the settlement run. Candidate choices:

A. explicit `CLAIM / FINISH CHALLENGE` action on reward screen;
B. `SAVE THIS GOAL & BUILD YOUR OWN` implicitly settles the current run for a guest receiver;
C. server settles the first valid clear automatically and later replays are practice only.

Recommendation: **A for account holders, B for guest conversion**, because it keeps replay useful without silently farming currency.

Do not implement persistent dual-party rewards until this settlement trigger is explicitly accepted.
