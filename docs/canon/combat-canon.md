# Combat Canon

## Core Combat Rules

- `LOCKED`: Player stats are `ATF`, `DEF`, `EVA`, and `HP`.
- `LOCKED`: Combat is turn-based.
- `LOCKED`: Monsters initiate combat on room entry and attack first.
- `LOCKED`: Hit check uses `Attacker EVA + 1d4` against `Defender EVA + 1d4`.
- `LOCKED`: An attack hits when the attacker total is greater than or equal to the defender total.
- `LOCKED`: Damage is `ATF - target DEF + 1d4`.
- `LOCKED`: Minimum damage is `1`.
- `LOCKED`: Combat ends when a combatant reaches `HP <= 0`.
- `LOCKED`: Victory fully heals the player.
- `LOCKED`: Victory grants the player `30%` of the defeated monster's stats, rounded down.

## Combat Menu

- `LOCKED`: The menu contains:
  - `A`: Attack Once / Fight Once
  - `B`: Fight till the End
  - `C`: Run
  - `D`: Use Item
- `LIKELY`: `Attack Once` should execute one player action and one monster action, preserving initiative and returning control.
- `LIKELY`: `Fight till the End` should loop deterministic rounds until victory or defeat.
- `LIKELY`: `Use Item` consumes the player's turn when the item is a scroll.

## Run Logic

- `LOCKED`: Run succeeds automatically.
- `LOCKED`: Running applies a `-15%` penalty to all player stats, rounded down.
- `LOCKED`: If the player runs from battle and later re-enters the room, the monster remains and has initiative again.
- `LOCKED`: If the player used the hexagonal portal to reach Room 4 and then runs, return location is Room 6, not the portal.
- `CONFLICTED`: One combat JSON says Run is available only during `Attack Once` mode. Other rule summaries present Run as a normal combat menu option.
- `UNKNOWN`: Whether run penalties reduce current HP only, max HP only, or both current and max HP.

## Scroll Mechanics

- `LOCKED`: Scrolls are one-use combat items.
- `LOCKED`: Fog of Confusion is super effective against the Imp.
- `LOCKED`: Pulse of Calm is super effective against the Musca.
- `LOCKED`: Heart Beacon is super effective against the Lizardman.
- `LOCKED`: Correct scroll use reduces all monster stats by `50%`.
- `LOCKED`: Incorrect scroll use has a weaker effect and should show a message directing the player toward the Room 1 altar clue.
- `CONFLICTED`: Incorrect scroll effect is `5%` in the frozen build and `10%` in later Alpha/Beta materials.
- `LIKELY`: Scroll use consumes one player turn and the monster acts afterward unless the combat loop has already ended.
- `UNKNOWN`: Whether scroll reductions should be rounded down immediately per stat or stored as percentage modifiers.

## Monster Stats

- `LOCKED`: Random low-tier monsters can use `ATF 5 / DEF 4 / EVA 4 / HP 15`.
- `LOCKED`: Random monsters may also scale to `70%` of current player stats depending on room.
- `CONFLICTED`: Imp stats appear as `ATF 9 / DEF 4 / EVA 6 / HP 20` in the frozen summary, but `ATF 9 / DEF 8 / EVA 6 / HP 30` in later specs.
- `LOCKED`: Musca appears consistently as `ATF 10 / DEF 7 / EVA 12 / HP 50`.
- `CONFLICTED`: Lizardman appears as `ATF 20 / DEF 14 / EVA 14 / HP 100` in the frozen summary, but `ATF 20 / DEF 14 / EVA 24 / HP 100` in later tuning docs.
- `UNKNOWN`: Whether low-tier monster species are cosmetic only or should have distinct stat/personality tables later.

## Rewards

- `LOCKED`: Combat victory grants stat increases based on defeated monster stats.
- `LOCKED`: Victory heals all player wounds.
- `LIKELY`: Item drops should become visible/available after the monster is defeated, then require manual `Pick/Get` unless explicitly auto-added by a later approved rule.
- `UNKNOWN`: Whether stat reward should use original monster stats or current modified stats after scroll effects. Later examples usually imply original/base stats for key fiends, but this should be made explicit before implementation.
