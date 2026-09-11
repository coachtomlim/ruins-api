# WEB-FLARE S8A Amendment 003 — Reward and Incentive Alignment

This amendment supersedes any conflicting reward/messaging language in the earlier S8A work order and amendments.

## Core mission must mention reward, not only score

The receiving player must understand immediately that the game is a precision challenge with a reward outcome.

The mission copy must communicate all three ideas together:

1. get the Hero-Runner to the EXIT;
2. finish as close as possible to the target HP;
3. a closer successful clear earns a better score and more Dungeon Builder gold.

For a 50% target, use prominent mobile copy equivalent to:

`GET THE HERO TO THE EXIT AT ~50% HP`

`Closer to the target = higher score + more gold.`

`Do not kill the Hero. The Hero must clear the dungeon.`

The exact target percentage must be dynamic.

Do not bury the reward mechanic in secondary text. The reward motivation should be visible on the main Mission + Dungeon panel before the receiver chooses a room.

## Completion is required for Builder reward

The game objective is a successful precision clear, not maximum lethality.

For S8A, Dungeon Builder reward is earned only when the Hero-Runner clears the dungeon.

Use the existing reward bands only for `cleared` outcomes:

- score 0-24.999 -> 5 gold
- score 25-49.999 -> 10 gold
- score 50-74.999 -> 15 gold
- score 75-99.999 -> 20 gold
- score 100 -> 25 gold

For `dead`, `blocked`, `timeout`, invalid or unscored outcomes:

`Dungeon Builder reward = 0 gold`

This completion gate is authoritative even if legacy score math could otherwise produce a numerical closeness score for a dead Hero.

Do not change S2-S7.1 scoring code. Implement the S8A completion gate additively in S8A reward/result logic.

On a failed run, the reward screen must make the reason obvious, for example:

`HERO DID NOT CLEAR`

`Builder reward: 0 gold`

`Try again and tune the dungeon so the Hero reaches the exit near the target.`

Do not celebrate or reward a kill as a successful dungeon design.

## Friend Hero reward

For a successful clear, the friend's Hero reward remains the actual gold returned by the simulation result.

Show separately:

`[NAME]'S HERO EARNED`

`XX GOLD`

For S8A, do not create or persist a wallet.

If the Hero does not clear, do not present carried run gold as a permanent earned reward. It may be described as run-collected telemetry if needed for debugging, but the player-facing reward panel should not claim that failed-run gold has been banked or saved.

## Mobile reward cue before the run

The Mission + Dungeon panel should include a compact, visually strong reward cue such as:

`CLEAR NEAR 50% HP`

`WIN UP TO 25 GOLD`

or equivalent wording using the dynamic target.

Keep it concise and game-like. Do not use a small explanatory paragraph.

The player must be able to understand, without scrolling:

`reach exit + hit target HP + earn more gold`

## Reward screen hierarchy

After a successful run, use this order:

`CHALLENGE COMPLETE`

large score / closeness result

`Finished at XX.X% HP · Target YY%`

then two equally legible reward cards:

`[NAME]'S HERO EARNED` -> actual Hero gold

`YOU EARNED` -> Dungeon Builder gold

Then actions:

`RUN AGAIN`

`EDIT THIS DUNGEON`

`SAVE THIS GOAL & BUILD YOUR OWN`

The reward amounts must be large enough to read comfortably on a portrait phone.

## Acceptance additions

Add tests/browser evidence proving:

1. the pre-run mission visibly mentions both higher score and more gold;
2. the target HP and potential Builder reward are visible without scrolling on a phone-sized viewport;
3. a cleared score around 98 yields 20 Builder gold;
4. a dead Hero yields 0 Builder gold regardless of numerical closeness;
5. failed runs are not presented as successful dungeon design;
6. successful reward screen keeps friend Hero gold and receiver Builder gold visually separate;
7. no wallet/persistence/auth is introduced in S8A.
