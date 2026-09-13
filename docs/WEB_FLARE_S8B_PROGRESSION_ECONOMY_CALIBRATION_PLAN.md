# WEB-FLARE S8B Progression Economy Calibration Plan

## Goal

Gold should make successful Dungeon Building matter without turning Runner progression into either a trivial one-run purchase or an endless grind.

This document sets tuning method and pacing targets. It does **not** lock final prices, stat amounts or caps.

## Current earning sources

Persistent account Gold will eventually come from two governed sources:

1. Dungeon Builder reward for a successful precision clear.
2. Hero-run Gold collected by the player's own Runner when that player is the challenge sender.

The current Builder reward preview bands are 5 / 10 / 15 / 20 / 25 Gold for successful clears. Failed clears earn 0 Builder Gold.

Hero Gold remains whatever the deterministic run actually collected and is separately settled to the sender account.

## Calibration principle

Progression pricing should be based on **expected successful sessions**, not arbitrary round numbers.

For each candidate upgrade/item, measure:

- expected Builder Gold per accepted challenge;
- expected Hero Gold per sent challenge;
- percentage of runs that clear;
- median number of sessions required to afford the item;
- effect of the item on effective HP / ATK / DEF;
- effect on receiver calibration difficulty and target-fit spread.

## Provisional pacing targets, not prices

Use these as tuning goals for later Owner review:

- first minor permanent stat improvement: reachable after roughly 2 to 4 successful reward settlements;
- first meaningful weapon choice: roughly 4 to 7 successful settlements;
- first meaningful armor choice: roughly 4 to 7 successful settlements;
- stronger equipment/tier upgrades: long enough to feel earned, but not more than about 10 to 15 ordinary successful settlements without a clear reason.

These ranges are hypotheses for playtesting, not locked game economy values.

## Power-growth constraint

Permanent progression must not make old room/content calibration nonsensical.

Before authorizing an upgrade tier, run the upgraded Runner snapshot through all six accepted stock rooms and the calibrated encounter families. Track:

- target-fit error;
- clear/death rate;
- time to clear;
- encounter cost required to approach target;
- whether the fixed 100-point Dungeon Budget can still create a credible challenge.

If a Runner becomes too strong for the current 100-point dungeon budget, progression must pause at that cap or the content/budget system must expand through a separately authorized milestone.

## Stat-vs-equipment role

Recommended design intent:

- permanent stat upgrades provide predictable, modest progression;
- weapons primarily differentiate offensive strength;
- armor primarily differentiates defense/HP;
- equipment should create choices rather than simply making every previous item obsolete immediately.

Exact modifiers remain unresolved.

## Anti-inflation / anti-farming

Do not price progression until the reward settlement rule is fixed, because replay farming behavior materially changes Gold velocity.

Use the settled-run rule and append-only ledger as economy authority. Replayed practice runs must not create unlimited persistent Gold.

## Data to collect during first account staging proof

For each settled challenge, record privacy-safe aggregates sufficient to tune the economy:

- Builder reward band;
- Hero Gold amount;
- target HP band;
- effective Runner HP/ATK/DEF;
- equipped item IDs/catalog version;
- clear/fail status;
- target-fit delta;
- number of retries before settlement.

Do not collect credentials or unnecessary personal information.

## Decision gate

Owner pricing decisions should be requested only after:

1. progression catalog schema is stable;
2. settlement rule is chosen;
3. at least baseline reward velocity is understood from deterministic simulations and/or staging play;
4. candidate upgrade impacts are tested against the 100-point dungeon ceiling.

At that point return a small set of concrete economy options rather than asking the Owner to invent numbers from scratch.