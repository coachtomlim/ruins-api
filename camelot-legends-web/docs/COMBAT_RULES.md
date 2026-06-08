# Combat Rules

The first playable demo uses temporary rules because original combat formulas were not recovered.

## Player

- Name: Mystery
- HP: 32
- Attack: 7
- Defense: 2
- Equipped armor raises defense to 4

## Enemy

- Name: Roadside Raider
- HP: 24
- Attack: 5

## Turn Flow

1. Player chooses an action.
2. Player deals damage.
3. If enemy HP reaches 0, battle ends in victory.
4. Otherwise the enemy retaliates.
5. If player HP reaches 0, the demo enters defeat state.

## Damage

- Basic attack: player attack.
- `Lightning Shot`: player attack + 5.
- `Battle Cry`: player attack + 3.
- Enemy retaliation: enemy attack - player defense, minimum 1.

These rules are intentionally simple and should be replaced once better historical combat evidence is found or a final design direction is chosen.
