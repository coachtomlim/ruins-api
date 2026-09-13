# WEB-FLARE S8B Progression Economy Calibration Plan

## Goal

Gold should make successful Dungeon Building matter without making Runner progression either trivial or grind-heavy.

This document sets tuning method and pacing targets. It does not lock final prices, stat amounts or caps.

## Current earning sources

Persistent account Gold will eventually come from:

1. Dungeon Builder reward for a successful precision clear.
2. Hero-run Gold collected by the player's own Runner when that player is the challenge sender.

Builder reward preview bands are 5 / 10 / 15 / 20 / 25 Gold for successful clears. Failed clears earn 0 Builder Gold.

## Starter power baseline

Economy calibration begins from the decomposed starter Rookie Warrior:

- base HP 100
- base ATK 8
- Wooden Club +4 ATK
- base DEF 0
- Wooden Shield +1 DEF
- no head/chest/hands/legs/feet armor
- effective 100 HP / 12 ATK / 1 DEF

The empty armor locations are deliberate progression opportunities.

## Calibration principle

Price progression by expected successful sessions, not arbitrary round numbers.

For each candidate stat upgrade/item measure:

- expected Builder Gold per settled challenge;
- expected Hero Gold per sent challenge;
- clear rate;
- median settlements required to acquire it;
- effective HP / ATK / DEF impact;
- target-fit/calibration impact;
- whether the 100-point Dungeon Budget can still challenge the upgraded Runner.

## Provisional pacing hypotheses

For later Owner review, not authority:

- first minor permanent stat improvement: about 2 to 4 successful settlements;
- first new visible armor piece such as footwear or head gear: early enough to create an acquisition thrill, tentatively about 2 to 5 successful settlements;
- first meaningful weapon or shield alternative: roughly 4 to 7 successful settlements;
- stronger armor pieces/equipment: long enough to feel earned, generally under about 10 to 15 ordinary successful settlements unless deliberately aspirational.

No Gold prices are locked by these targets.

## Power-growth constraint

Before authorizing an upgrade tier, test the upgraded Runner snapshot across all six accepted stock rooms and encounter families. Track target-fit error, clear/death rate, time, encounter cost needed to approach target, and whether 100 Dungeon Budget remains credible.

If a Runner becomes too strong for the 100-point ceiling, progression pauses at that cap or content/budget expands through a separate milestone.

## Stat and equipment roles

Recommended tuning intent:

- permanent stats provide modest predictable growth;
- weapons primarily affect offense;
- shields primarily affect defense;
- head/chest/hands/legs/feet provide piece-by-piece defensive/HP growth and visible collection progress;
- later equipment should create choices rather than immediate linear obsolescence.

Exact later modifiers remain unresolved.

## Monster parity

If a governed monster owns/equips one of the same items, use the same item modifier semantics when measuring its effective stats. Do not create player-only versions of an item's combat bonus.

Frozen S7 monster stats remain legacy effective values until an explicit S8 decomposition milestone.

## Anti-farming

Do not lock prices until reward settlement behavior is fixed. Practice replays must not mint unlimited persistent Gold.

## Data for first account staging proof

Record privacy-safe aggregates sufficient to tune economy: reward band, Hero Gold, target band, effective Runner stats, equipped item IDs/catalog version, clear/fail, target-fit delta and retries before settlement.

## Decision gate

Request Owner pricing decisions only after the catalog schema and settlement rule are stable and candidate upgrade impacts are tested against the 100-point ceiling. Return a small set of concrete economy options rather than asking the Owner to invent numbers.
