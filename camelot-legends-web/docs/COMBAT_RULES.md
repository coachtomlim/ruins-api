# Combat Rules

The first playable demo uses rebuilt combat rules because original combat formulas, stat curves, encounter tables, and enemy runtime stats were not recovered.

Recovered evidence used:

- `Forgon` exists in `enemies.json` from the GameBible.
- `Amethyst`, `Lithic Armor`, and `Potion` exist in recovered item/equipment records.
- `Lightning Shot` and `Battle Cry` are recovered skill names/descriptions.

## Player

- Name: Mystery
- HP: 42
- MP: 14
- Attack: 8
- Defense: 2
- Guard: 0
- Equipping `Lithic Armor` raises defense to 4, max HP by 4, and max MP by 6.
- Rallying survivors in area 003 grants 10 XP and restores 4 MP.
- Scouting the castle approach in area 004 starts the final battle with 4 guard.

## Enemy

- Name: Forgon Scout
- Evidence basis: provisional first-level use of recovered enemy name `Forgon`
- HP: 68
- Attack: 8
- Defense: 1

## Turn Flow

1. Player chooses an action.
2. MP cost is checked.
3. Player action applies damage, guard, MP recovery, or potion healing.
4. If enemy HP reaches 0, battle ends on the victory screen.
5. Otherwise the enemy resolves its current intent.
6. Enemy intent advances to the next turn.
7. If player HP reaches 0, the demo enters defeat state with a retry option.

## Player Actions

- `Strike`: weapon damage, restores 2 MP.
- `Lightning Shot`: high damage, costs 5 MP, gains +3 damage if the Amethyst was recovered.
- `Battle Cry`: medium damage, costs 3 MP, grants 5 guard for the next enemy attack.
- `Guard`: grants 7 guard and restores 4 MP.
- `Potion`: consumes `hp-item-1` and heals 40 HP.

## Enemy Intents

- Probe attack
- Heavy attack
- Brace behind shield

The intent is shown before the player acts, so the fight has an early tactical loop: spend MP, guard against heavy attacks, or recover.

## Level Beats Before Combat

- `Rally Survivors` is optional and exists to add pacing, reward, and a small support action before the final approach.
- `Scout Castle Approach` is required before entering area 005 and prepares Mystery for the first enemy strike.

## Victory Rewards

- 25 gold
- 35 XP
- Potion added to inventory if not already present

These rules are intentionally provisional and should be replaced only when better historical combat evidence is found or the final design direction is chosen.
