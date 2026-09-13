# WEB-FLARE S8 Game Resource Semantics

## Dungeon Budget

The receiver gets a fixed 100-point dungeon construction budget for the current setup.

It limits monsters, traps and supports. It resets for each dungeon setup and is not a saved player asset.

## Earned Gold

Gold shown after a run is a player reward:

- Hero Gold belongs to the sender/friend side.
- Dungeon Builder Gold belongs to the receiver side.

S8A only displays these rewards. S8B may persist them after accounts exist.

## What Gold is for

Persisted player Gold is a progression resource for improving that player's own Hero-Runner.

Initial governed uses are:

- persistent Runner stat upgrades: HP, ATK and DEF;
- owned/equipped weapons;
- owned/equipped armor.

The intended loop is:

`EARN GOLD -> UPGRADE YOUR RUNNER -> SEND A STRONGER / DIFFERENT RUNNER CHALLENGE`

Exact prices, caps and item catalogs remain separate economy decisions and must not be invented during S8A.

## UI rule

Do not imply that selecting a monster deducts from the player's earned Gold.

Recommended label for the construction resource:

`DUNGEON BUDGET 65 / 100`

Use `GOLD` on the post-run reward screen for player rewards.

Where useful, explain the reward purpose with concise copy such as:

`USE GOLD TO UPGRADE YOUR RUNNER`

`Stats · Equipment · Armor`

## Resource separation

Dungeon construction must never consume persistent player Gold.

- `DUNGEON BUDGET` controls the current dungeon setup.
- `GOLD` belongs to the player account and funds Runner progression.

## Test requirement

A first-time phone player should be able to distinguish the 100-point dungeon build budget from Gold earned after the run without opening a help page, and should understand that earned Gold has future value for improving their own Runner.
