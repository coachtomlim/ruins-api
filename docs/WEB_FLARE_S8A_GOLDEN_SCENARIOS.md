# WEB-FLARE S8A Golden Scenarios

These are deterministic/reference scenarios for implementation and browser acceptance.

## G1 Accepted Level 3 / 60% baseline

Input:
- runner: `warrior-l3`
- target: `60%`
- accepted calibrated default encounter
- no receiver customization

Expected product behavior:
- Hero clears;
- finishing HP remains materially near the accepted S7/S7.1 result of about `60.8%`;
- score remains materially near `98`;
- Hero Gold equals actual simulation Gold, currently expected around `24`;
- Builder Gold = `20` because a successful clear with score in `[75,100)` earns 20;
- mission panel says the aim is to reach the EXIT near 60% HP;
- reward screen clearly separates Hero Gold from Builder Gold.

Do not alter simulation merely to force the exact displayed decimals. Treat the accepted range as the regression target and the reward band as exact.

## G2 Perfect precision clear

Input/result fixture:
- terminal status `cleared`;
- score `100`.

Expected:
- Builder Gold `25`;
- success language may celebrate an exact target hit;
- Hero Gold remains whatever the simulation result reports.

## G3 Good but not perfect clear

Input/result fixture:
- terminal status `cleared`;
- score `75`.

Expected Builder Gold: `20`.

Boundary checks:
- `74.999` -> `15`;
- `75` -> `20`.

## G4 Weak precision clear

Input/result fixture:
- terminal status `cleared`;
- score below `25`.

Expected:
- Hero still cleared;
- Builder Gold `5`;
- result copy should encourage refinement without implying the player should make the dungeon lethal.

## G5 Hero defeated

Input/result fixture:
- terminal status `dead`;
- any legacy numerical closeness/score value.

Expected:
- prominent `HERO DID NOT CLEAR`;
- Builder Gold `0`;
- never present death as a successful precision result;
- Hero Gold display, if any was physically collected before defeat, remains separately labelled and must not imply Builder ownership.

## G6 Route blocked / timeout

Expected:
- Builder Gold `0`;
- no success language;
- clear recovery action back to Edit Dungeon or Run Again where valid.

## G7 Too gentle setup

Estimated finish HP is more than 10 points above target.

Expected target-fit cue:
- `TOO GENTLE`;
- note explains the Hero may finish too healthy;
- recommended direction is to add some challenge, not to maximize danger.

## G8 Too harsh setup

Estimated finish HP is more than 10 points below target.

Expected target-fit cue:
- `TOO HARSH`;
- note explains the Hero may take too much damage;
- recommended direction is to ease the dungeon.

## G9 Close setup

Estimate is within ±10 percentage points of target.

Expected:
- `CLOSE TO TARGET`;
- this is guidance only, never an exact predicted finish.

## G10 Registration conversion

After a completed run, receiver chooses `SAVE THIS GOAL & BUILD YOUR OWN`.

Expected:
- dedicated `CREATE YOUR DUNGEON RUNNER ACCOUNT` panel;
- target, runner and source friend context remain visible;
- current reward preview remains visible where useful;
- copy states that nothing has been saved yet;
- no Buddy/Test screen;
- no credential fields in S8A;
- Back to Rewards works without losing current in-memory run context.
