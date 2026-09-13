# WEB-FLARE S8 Game Resource Semantics

## Dungeon Budget

The receiver gets a fixed 100-point dungeon construction budget for the current setup.

It limits monsters, traps and supports. It resets for each dungeon setup and is not a saved player asset.

## Earned Gold

Gold shown after a run is a player reward:

- Hero gold belongs to the sender/friend side.
- Dungeon Builder gold belongs to the receiver side.

S8A only displays these rewards. S8B may persist them after accounts exist.

## UI rule

Do not imply that selecting a monster deducts from the player's earned Gold.

Recommended label for the construction resource:

`DUNGEON BUDGET 65 / 100`

Use `GOLD` on the post-run reward screen for player rewards.

## Future progression

Whether earned Gold later unlocks assets is a separate progression decision. Current dungeon construction must not consume saved player Gold.

## Test requirement

A first-time phone player should be able to distinguish the 100-point dungeon build budget from the Gold earned after the run without opening a help page.
