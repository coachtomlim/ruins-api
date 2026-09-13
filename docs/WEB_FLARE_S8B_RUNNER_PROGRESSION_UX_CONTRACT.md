# WEB-FLARE S8B Runner Progression UX Contract

## Product goal

After Gold is persisted, the player should immediately understand that Gold improves **their own Hero-Runner** for future challenges.

The progression loop should feel like a continuation of rewards, not an admin page.

## Mobile entry

Primary entry:

`UPGRADE YOUR RUNNER`

Keep visible:

- current Gold balance;
- active Runner name/level;
- effective HP / ATK / DEF;
- starter/equipped weapon and shield;
- visible empty/filled armor-piece slots.

Use large touch targets and panel navigation. Do not create a dense inventory spreadsheet on phone.

## Panels

Initial categories:

1. `STATS`
2. `EQUIPMENT`
3. `ARMOR`

One category is active at a time.

### Stats

Shows current effective stat and next authorized permanent upgrade offer.

### Equipment

Shows `WEAPON` and `SHIELD` ownership/loadout offers.

Starter state visibly begins with:

- Wooden Club equipped
- Wooden Shield equipped

Each card shows item name, stat modifiers, owned/equipped state, authoritative Gold cost when purchasable, and one clear action such as `BUY`, `EQUIP`, or `EQUIPPED`.

### Armor

Shows piece-by-piece slots:

- `HEAD`
- `CHEST`
- `HANDS`
- `LEGS`
- `FEET`

A new account begins with all five empty. Empty slots should look intentionally available rather than broken or missing.

The first acquisition of a piece such as footwear or head gear should be a visible reward/progression moment. Show the new item's name, slot and stat effect, then allow `EQUIP`.

Do not bundle the five armor locations into one set for v1.

## Acquisition source neutrality

The UX can celebrate `NEW FOOTWEAR!`, `NEW HEAD GEAR!`, etc. without assuming whether the item came from a shop, reward, drop or unlock. The source is governed by the later economy/acquisition design.

## Purchase confirmation

Before a Gold-spending mutation, show item/upgrade, exact stat effect, current Gold, cost, remaining Gold, and explicit confirm/cancel actions.

The browser quote is not authority. Server revalidates catalog, ownership, cap and balance.

## Success

After authoritative mutation:

`RUNNER UPGRADED`

Show Gold spent, new balance, changed stats, and loadout change. Do not claim success before the server confirms.

## Equip flow

Equipping an already-owned item has no Gold cost unless a future rule explicitly adds one. Wrong-slot and cross-player equip attempts fail closed.

## Challenge creation

Before challenge creation, show the exact Runner configuration that will be snapshotted:

- effective HP / ATK / DEF;
- weapon;
- shield;
- equipped head/chest/hands/legs/feet pieces;
- target HP condition.

Later upgrades cannot alter an issued challenge.

## S8A boundary

Guest S8A may tease:

`USE GOLD TO UPGRADE YOUR RUNNER`

`Stats · Equipment · Armor`

but must not expose active purchase controls before account-backed progression exists.
