# WEB-FLARE S8B Runner Progression Contract

## Product truth

Earned Gold is a progression resource for improving the player's own Hero-Runner.

`RECEIVE CHALLENGE -> BUILD DUNGEON -> EARN GOLD -> UPGRADE YOUR RUNNER -> SEND YOUR OWN CHALLENGE`

## Stat authority

Effective combat stats are composed from:

`base stats + permanent stat upgrades + equipped item modifiers`

Item bonuses must not also be baked into base stats. The same rule applies to monsters that own/equip items.

## Starter Runner

The initial Rookie Warrior has no armor set.

Base and starter equipment decomposition:

- base HP 100
- base ATK 8
- Wooden Club in `WEAPON`: +4 ATK
- base DEF 0
- Wooden Shield in `SHIELD`: +1 DEF
- effective starter: 100 HP / 12 ATK / 1 DEF

No starter `HEAD`, `CHEST`, `HANDS`, `LEGS`, or `FEET` item is owned/equipped. Default clothing is visual baseline only and grants no equipment bonus.

## Progression categories

Permanent stat upgrades may improve:

- `MAX_HP`
- `ATTACK`
- `DEFENSE`

Initial equipment slots are:

- `WEAPON`
- `SHIELD`
- `HEAD`
- `CHEST`
- `HANDS`
- `LEGS`
- `FEET`

Armor is acquired piece by piece. This preserves the progression moment of acquiring the first boots, head gear, chest piece, gloves or leg armor.

## Equipment ownership

Owning an item does not apply its stats. It must be equipped in its matching slot.

A shield is equipment but not part of the armor-piece set for purchase categorization. Armor pieces are head/chest/hands/legs/feet.

## Monster equipment

Monsters may also own/equip governed items. When they do, their item modifiers contribute to effective HP/ATK/DEF exactly once through the same composition rule.

Frozen S7 monster stats remain legacy effective values until a later S8 content refactor explicitly decomposes them into base stats plus items. Do not alter frozen S7 balance merely to retrofit item ownership.

## Challenge snapshot

A challenge snapshots the exact effective Runner configuration at creation time:

- base stats;
- permanent upgrades;
- each equipped item identity and modifiers;
- effective HP / ATK / DEF;
- rules/content/progression version.

Later upgrades or equipment changes cannot mutate an already-issued challenge.

## Gold spending

Gold purchases/upgrades use the append-only Gold ledger and server-authoritative catalog values.

Explicit debit reasons include:

- `RUNNER_STAT_UPGRADE`
- `EQUIPMENT_PURCHASE` for weapons/shields
- `ARMOR_PURCHASE` for head/chest/hands/legs/feet

Every mutation must be idempotent and must not permit a negative balance.

## Separate resources

The 100-point `DUNGEON BUDGET` is not player Gold. Dungeon construction never spends persistent Gold.

## S8A presentation

S8A may explain:

`USE GOLD TO UPGRADE YOUR RUNNER`

`Improve Stats · Equipment · Armor`

but must not claim purchases or persistent ownership before accounts exist.

## Economy values not yet locked

Still to decide before persistent progression purchase implementation:

- Gold prices;
- stat increments and caps;
- later weapon/shield/armor catalog;
- later item modifiers;
- whether items are bought once or have upgrade tiers;
- relationship between progression and displayed Runner level.

Do not invent those values during S8A.
