# WEB-FLARE S8B Runner Progression UX Contract

## Product goal

After Gold is persisted to an account, the player should immediately understand that Gold improves **their own Hero-Runner** for future challenges.

The progression loop should feel like a continuation of the reward screen, not a separate admin page.

## Mobile entry

Primary account-facing entry:

`UPGRADE YOUR RUNNER`

The top of the screen keeps visible:

- current Gold balance;
- active Runner name/level;
- effective HP / ATK / DEF;
- equipped weapon;
- equipped armor.

Use large touch targets and panel navigation. Do not create a dense inventory spreadsheet on phone.

## Panels

Initial categories:

1. `STATS`
2. `EQUIPMENT`
3. `ARMOR`

One category is active at a time.

### Stats panel

Shows current effective stat plus the next authorized upgrade offer where one exists.

Example shape only, not price authority:

`HP 110  →  +10 HP`

`Cost: [server-authoritative Gold price]`

### Equipment panel

Shows owned and purchasable `WEAPON` offers.

Each card shows:

- item name;
- stat modifiers;
- owned/equipped state;
- server-authoritative Gold cost when purchasable;
- one clear action: `BUY`, `EQUIP`, or `EQUIPPED`.

### Armor panel

Same pattern for `ARMOR`.

## Purchase confirmation

Before a Gold-spending mutation, show a compact confirmation panel with:

- upgrade/item name;
- exact stat effect;
- current Gold;
- cost;
- Gold remaining after purchase;
- `BUY UPGRADE` / `BUY ITEM`;
- `CANCEL`.

The browser display is only a quote. The server revalidates cost, ownership, tier/cap and balance before mutation.

## Success state

After server confirmation:

`RUNNER UPGRADED`

Show:

- Gold spent;
- new balance;
- changed HP / ATK / DEF;
- new equipment state if relevant;
- primary action `USE THIS RUNNER` or return to progression panel.

Do not animate/claim success before the authoritative mutation returns.

## Failure states

### Insufficient Gold

`NOT ENOUGH GOLD`

Show current balance and amount needed. Do not debit or partially apply.

### Stale price/catalog

Refresh the server quote and ask the player to confirm the new value. Never silently charge a different amount.

### Retry/unknown result

Read authoritative account state before retrying. Idempotency prevents double debit.

## Equip flow

Equipping an already-owned item should not require a purchase confirmation unless a future rule explicitly adds an equip cost.

Show effective stat changes immediately after authoritative loadout update.

## Challenge creation handoff

When the player creates a challenge, show the exact current Runner snapshot that will be frozen into the challenge:

- HP / ATK / DEF;
- weapon;
- armor;
- target HP condition.

A later Runner upgrade must not alter an already-sent challenge.

## S8A boundary

The current guest S8A reward screen may tease:

`USE GOLD TO UPGRADE YOUR RUNNER`

but must not expose active purchase controls until account-backed progression exists.