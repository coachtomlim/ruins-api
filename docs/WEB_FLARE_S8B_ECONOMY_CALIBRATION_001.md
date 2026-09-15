# WEB-FLARE S8B Economy / Challengeability Calibration 001

## Status

`RECOMMENDATION PACKET — NO ECONOMY VALUES ACTIVATED`

This work follows accepted Runner Hub authority and addresses the unresolved OD-05 economy gate without enabling purchases, upgrades, drops, trade or persistent reward settlement.

Starting accepted authority:

- Runner Hub acceptance branch: `work/web-flare-s8b-runner-hub-001`
- accepted Runner Hub commit: `15e8607f745f96ff52118264534591108fd20cc5`
- fixed Dungeon Budget: `100`
- starter effective Runner: `100 HP / 12 ATK / 1 DEF`
- current Builder clear reward bands: `5 / 10 / 15 / 20 / 25 Gold`

## Governing question

How much permanent Runner power can S8B introduce before the current 100-point dungeon ceiling stops being able to place the Hero near ordinary challenge targets?

The answer must constrain the economy before prices or item catalogs are locked.

## Calibration method

A deterministic analysis tool is added at:

`tools/flare-s8b-economy-calibration.mjs`

It does not alter game runtime.

It uses the existing S7 calibration model and current S7 content definitions, and exhaustively enumerates all distinct legal encounter combinations under the fixed 100-point budget using:

- up to three enemy slots, with repeated enemy types allowed;
- Goblin, Skeleton, Goblin Elite, Antlion;
- Small Potion, Battle Tonic, Iron Tonic subsets;
- Spike Trap and Dart Trap subsets;
- total encounter cost `<= 100`.

This produces `317` legal calibration combinations.

The probe targets are:

`20 / 40 / 60 / 80% finishing HP`.

For each projected Runner state, the tool selects the closest legal encounter for each target and records the worst target delta.

Calibration bands:

- `PREFERRED`: worst target delta `<= 10`
- `EDGE`: worst target delta `> 10` and `<= 15`
- `OUTSIDE`: worst target delta `> 15`

These bands are design/calibration guidance, not production rules.

## Key findings

Starting from effective `100 / 12 / 1`:

| Added permanent/equipped power | Effective state | Worst target delta | Calibration band |
| --- | --- | ---: | --- |
| none | 100 / 12 / 1 | 1.8 | PREFERRED |
| +5 HP | 105 / 12 / 1 | 0.7 | PREFERRED |
| +10 HP | 110 / 12 / 1 | 3.6 | PREFERRED |
| +20 HP | 120 / 12 / 1 | 10.0 | PREFERRED boundary |
| +1 ATK | 100 / 13 / 1 | 3.5 | PREFERRED |
| +2 ATK | 100 / 14 / 1 | 10.2 | EDGE |
| +1 DEF | 100 / 12 / 2 | 6.5 | PREFERRED |
| +2 DEF | 100 / 12 / 3 | 14.8 | EDGE |
| +5 HP +1 DEF | 105 / 12 / 2 | 10.0 | PREFERRED boundary |
| +10 HP +1 ATK | 110 / 13 / 1 | 10.5 | EDGE |
| +1 ATK +1 DEF | 100 / 13 / 2 | 12.5 | EDGE |
| +20 HP +1 ATK | 120 / 13 / 1 | 16.3 | OUTSIDE |
| +10 HP +1 ATK +1 DEF | 110 / 13 / 2 | 18.6 | OUTSIDE |

The binding problem is normally the low finishing-HP target. As Runner survivability and kill speed increase, the existing 100-point encounter set loses the ability to damage the Runner deeply enough.

Therefore cumulative progression matters more than any single stat cap.

## Primary conclusion

Do **not** define S8B progression using independent maxima such as:

`HP <= X, ATK <= Y, DEF <= Z`

because individually legal bonuses can combine into an unchallengeable Runner.

Instead, every future progression offer should be evaluated against a **projected effective Runner challengeability envelope**.

The first launch envelope should target the `PREFERRED` band. `EDGE` states are useful for design exploration but should not be automatically purchasable until real-simulator evidence confirms them.

## Recommended first-step increments

Use small atomic progression units for Owner review:

- HP: `+5` per step
- ATK: `+1` per step
- DEF: `+1` per step

These are recommended units, not yet activated values.

Why:

- `+5 HP`, `+1 ATK`, and `+1 DEF` each remain comfortably challengeable in isolation;
- larger units consume the 100-point challengeability envelope quickly;
- small units let equipment and permanent training share the same total power budget;
- they preserve room for the first visible armor acquisition instead of spending the entire power envelope on one upgrade.

## Equipment implication

Do not give every armor slot `+1 DEF` merely because it is armor.

Five separately acquired +1 DEF armor pieces would greatly exceed the present challengeability envelope.

Early equipment should consume the same effective-power envelope as stat training. Example design directions may use modest HP contribution on some armor pieces and reserve direct DEF increases for fewer, more valuable items.

No exact later armor catalog is locked by this packet.

The same governed item modifier remains applicable to monsters that explicitly use the item, consistent with existing item semantics.

## Candidate Gold price bands

Current Builder reward authority is clear-only:

- score 0–24.999 → 5 Gold
- 25–49.999 → 10 Gold
- 50–74.999 → 15 Gold
- 75–99.999 → 20 Gold
- 100 → 25 Gold

Recommended review bands:

| Power unit | Candidate price band | Existing reward interpretation |
| --- | ---: | --- |
| +5 HP equivalent | 20–25 Gold | one very strong/perfect clear, or multiple lower clears |
| +1 ATK equivalent | 25–35 Gold | at least one perfect clear; normally accumulated across clears |
| +1 DEF equivalent | 35–50 Gold | approximately two high/perfect clears at the upper end |
| first modest armor piece | 25–40 Gold | depends on its actual modifier budget |

These are pacing bands only. They are not authoritative prices.

Price should follow the item's effective combat contribution, not the slot name.

DEF is priced highest because the current damage model shows it consumes challengeability faster in combination and can affect multiple incoming attacks plus non-piercing traps.

## Recommended first progression gate

Before a future purchase is offered/committed:

1. derive the Runner's current effective stats from authoritative server state;
2. apply the proposed stat/item modifier hypothetically;
3. run the versioned challengeability check against the current 100-point content envelope;
4. reject or withhold offers that cross the accepted progression envelope;
5. store the catalog/calibration version with any later accepted progression event.

This is deliberately stronger than a simple tier-count cap.

## Product consequence

The current S7 content can support **shallow early progression**, but not deep stacking across many stats and armor slots while preserving broad target choice under a fixed 100-point Dungeon Budget.

Before S8B offers substantially more cumulative Runner power, the dungeon content side should expand with stronger governed stock-Flare challenge components rather than silently increasing Dungeon Budget or weakening target accuracy.

The 100-point Dungeon Budget remains fixed.

## Owner decision recommendation

Recommend accepting the following as the OD-05 **calibration policy**, while leaving exact catalog/prices for a later content pass:

1. atomic stat units: `+5 HP / +1 ATK / +1 DEF`;
2. first progression catalog must keep projected Runner state inside the `PREFERRED` challengeability envelope;
3. prices begin in the candidate bands above and are adjusted only after reward-velocity play evidence;
4. armor modifiers share the same power envelope and do not default to +1 DEF per slot;
5. deeper progression requires stronger governed dungeon content while retaining the 100-point budget.

Acceptance of this policy would still **not** activate purchases or mutate Supabase progression state. It would only unlock design of the first versioned progression catalog and server-side purchase transaction.

## Still unresolved after this packet

- exact Gold price for each concrete offer;
- exact later item catalog and item names/modifiers;
- whether equipment itself has upgrade tiers;
- displayed Runner level relationship to permanent progression;
- exact acquisition mix across Gold purchase, drop/reward and future trade;
- reward-settlement decisions OD-01/OD-02;
- persistent challenge decisions OD-04/OD-06/OD-07.
