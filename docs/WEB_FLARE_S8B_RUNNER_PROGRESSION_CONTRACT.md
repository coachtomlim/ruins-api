# WEB-FLARE S8B Runner Progression Contract

## Product truth

Earned Gold is not only a score/reward display. Once accounts exist, a player's persisted Gold is a progression resource for improving that player's own Hero-Runner.

The progression loop is:

`RECEIVE CHALLENGE -> BUILD DUNGEON -> EARN GOLD -> UPGRADE YOUR RUNNER -> SEND YOUR OWN CHALLENGE`

This creates a reason to keep accepting and building challenges beyond a single score attempt.

## Ownership rule

The receiver/Dungeon Builder earns Builder Gold for a successful precision clear.

When that receiver later becomes a sender, the Gold in their own account may be spent to improve their own Runner.

Hero Gold credited to an authenticated sender also belongs to that sender's player wallet and may fund the same runner-progression system.

Do not merge one player's reward into another player's wallet.

## Upgrade categories

Initial governed categories are:

### 1. Runner stats

Persistent upgrades may improve:

- `MAX_HP`
- `ATTACK`
- `DEFENSE`

These are account-owned progression on a specific runner, not temporary dungeon-run buffs.

### 2. Equipment

Initial equipment slot:

- `WEAPON`

Equipment is an owned asset that can contribute governed stat modifiers when equipped.

### 3. Armor

Initial armor slot:

- `ARMOR`

Armor is an owned asset that can contribute governed defensive and/or HP modifiers when equipped.

Do not add accessory, magic, ranged or other slots until separately authorized.

## Effective Runner snapshot

A challenge must snapshot the exact Runner configuration used when the challenge is created.

Recommended effective-stat model:

`effective HP = base HP + permanent HP upgrades + equipped HP bonuses`

`effective ATK = base ATK + permanent ATK upgrades + equipped weapon/armor ATK bonuses`

`effective DEF = base DEF + permanent DEF upgrades + equipped weapon/armor DEF bonuses`

A later player upgrade must not silently alter an already-issued challenge. Historic challenges remain bound to their recorded Runner snapshot/rules version.

## Gold spending

Gold spent on upgrades is an account transaction and must use the append-only Gold ledger.

Spending must create explicit debit entries, for example:

- `RUNNER_STAT_UPGRADE`
- `EQUIPMENT_PURCHASE`
- `ARMOR_PURCHASE`

Do not overwrite wallet balance directly.

Every purchase/upgrade mutation must be idempotent and server-authoritative when S8B persistence is implemented.

## Separate resources

The 100-point `DUNGEON BUDGET` remains completely separate from player Gold.

- Dungeon Budget builds the current receiver dungeon and resets per setup.
- Gold belongs to the player's account and funds Runner progression.

Selecting monsters/traps/supports never spends persistent Gold.

## S8A presentation

S8A does not implement purchases or persistent progression, but the reward/registration UX may make the purpose of Gold clear with copy such as:

`USE GOLD TO UPGRADE YOUR RUNNER`

`Improve Stats · Equipment · Armor`

Because S8A has no account persistence yet, do not claim that upgrades can be purchased before registration is implemented.

## S8B persistence requirements

The account model needs persistent representations for:

- player-owned Runner identity;
- permanent stat-upgrade state;
- owned equipment;
- owned armor;
- currently equipped weapon;
- currently equipped armor;
- immutable Runner snapshot on challenge creation;
- Gold debit ledger entries for purchases/upgrades.

## Economy values deliberately not locked here

This contract locks what Gold is for, not exact prices or progression pacing.

Still to decide before the progression shop is implemented:

- Gold cost per HP/ATK/DEF upgrade;
- maximum upgrade tiers/caps;
- exact equipment catalog;
- exact armor catalog;
- equipment/armor prices;
- whether assets are bought once or upgraded through tiers;
- whether Runner level is derived from progression or remains a separate governed tier.

Codex must not invent these values during S8A.

## Test requirements for later persistent implementation

Prove at minimum:

1. Builder Gold credits only the receiver owner.
2. Hero Gold credits only the sender owner.
3. Gold debit cannot make balance negative.
4. Duplicate purchase retries do not double-debit.
5. Unequipped assets do not affect Runner stats.
6. Equipped weapon/armor modifiers affect the Runner snapshot exactly once.
7. Permanent stat upgrades are included exactly once.
8. Challenges preserve the Runner snapshot even after later upgrades.
9. Dungeon Budget never consumes account Gold.
10. A player cannot equip or spend another player's assets/Gold.
