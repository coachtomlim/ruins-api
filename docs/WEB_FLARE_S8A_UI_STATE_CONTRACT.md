# WEB-FLARE S8A UI State Contract

Purpose: lock the receiver interaction states before implementation so mobile behavior does not devolve into one scrolling page.

## Canonical receiver states

1. `INVITATION`
2. `MISSION_DUNGEON`
3. `CUSTOMIZE_MONSTERS`
4. `CUSTOMIZE_TRAPS`
5. `CUSTOMIZE_SUPPORTS`
6. `READY_TO_RUN`
7. `RUNNING_FOLLOW`
8. `RUNNING_OVERVIEW`
9. `REWARDS`
10. `REGISTRATION`

Only one primary panel is active at a time on a portrait phone.

## Required transitions

- `INVITATION -> MISSION_DUNGEON` via `ACCEPT CHALLENGE`
- `MISSION_DUNGEON -> READY_TO_RUN` via `USE THIS DUNGEON`
- `MISSION_DUNGEON -> CUSTOMIZE_MONSTERS` via `CUSTOMIZE - OPTIONAL`
- customization category tabs switch among MONSTERS/TRAPS/SUPPORTS without leaving customization
- customization `DONE -> READY_TO_RUN`
- `READY_TO_RUN -> RUNNING_FOLLOW` via `RUN THE HERO`
- `RUNNING_FOLLOW <-> RUNNING_OVERVIEW` via `OVERVIEW` / `FOLLOW HERO`
- terminal run -> `REWARDS`
- `REWARDS -> READY_TO_RUN` via `RUN AGAIN`, preserving exact inputs
- `REWARDS -> CUSTOMIZE_MONSTERS` via `EDIT THIS DUNGEON`, preserving room and selections
- `REWARDS -> REGISTRATION` via `SAVE THIS GOAL & BUILD YOUR OWN`
- `REGISTRATION -> REWARDS` via `BACK TO REWARDS`

## Mission panel invariant

Before the player can choose or run a dungeon, the active viewport must communicate all three ideas without scrolling:

- `GET THE HERO TO THE EXIT AT ~[TARGET]% HP`
- `Closer to the target = higher score + more gold.`
- `Do not kill the Hero. The Hero must clear the dungeon.`

The target percentage is the dominant numerical element.

## Primary-action invariant

Every non-running state has one unmistakable primary action with large touch geometry. Secondary actions cannot visually compete with it.

## Customization invariant

Customization is optional. MONSTERS, TRAPS and SUPPORTS are separate switchable panels. Do not render all controls as one long vertical form. Budget remains visible across all three categories.

## Runtime invariant

`OVERVIEW` must materially alter camera composition to show the dungeon. While active, the control label becomes `FOLLOW HERO`. Tapping it restores the tracked hero camera.

## Rewards invariant

Rewards occupy a dedicated receiver panel, not a small overlay. Show friend Hero gold and receiver Dungeon Builder gold as separate ownership blocks.

If Hero did not clear, prominently show `HERO DID NOT CLEAR` and receiver Builder reward is 0 gold.

## Registration invariant

Registration is a dedicated product screen. It must not expose or link to prototype `Buddy / Test`. S8A only explains the account requirement and carries current in-memory goal/reward context. It does not collect credentials or claim persistence.
