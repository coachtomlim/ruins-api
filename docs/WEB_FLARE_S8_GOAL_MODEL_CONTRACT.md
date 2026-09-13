# WEB-FLARE S8 Goal Model Contract

## Current governed goal

S8A supports one goal type only:

`FINISH_HP_PERCENT`

Payload:

- `targetHpPercent`

Meaning: the Hero must clear the dungeon and finish as close as possible to the specified remaining HP percentage.

## Why model the goal explicitly

Future challenge designs may introduce other measurable conditions, but S8A must not hard-code every future possibility into one opaque sentence or database field.

## Saved goal shape for future persistence

Recommended domain shape:

```json
{
  "goalVersion": 1,
  "goalType": "FINISH_HP_PERCENT",
  "payload": { "targetHpPercent": 50 }
}
```

S8A invitation encoding remains unchanged and may continue carrying only the current target HP value.

## Future extension rule

New goal types require their own scoring/reward semantics and version bump. Do not reinterpret historic `FINISH_HP_PERCENT` goals when adding another condition later.

Potential future conditions are intentionally not authorized by this document.

## UI rule

Even though the domain model is extensible, S8A must explain the current goal in plain language:

`GET THE HERO TO THE EXIT AT ~50% HP`

Do not expose schema terminology to players.
