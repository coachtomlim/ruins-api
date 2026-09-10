# WEB-FLARE S3: three-touch novice flow

## Product split

Two URL classes are deliberately separate.

1. **Run the Gauntlet builder/invite URL**: the invited friend accepts a runner, chooses an arena, and launches a gauntlet. This is `flare-s3/index.html`.
2. **Player/run URL**: a compact challenge manifest is opened by `flare-s3/play.html`. It is replayable and shareable, but it does not expose builder controls. A player who wants to create a gauntlet follows the separate builder link.

## Novice contract

The default path reaches runtime in three primary touches:

1. **Accept challenge**. The runner is visible before acceptance. Demo credentials are prefilled as `Buddy` / `Test`, so the placeholder login does not add an extra required touch. Full account/auth work is deliberately deferred.
2. **Use this room**. One of three stock Flare rooms is already selected. Swipe or large left/right arrows are optional exploration, not mandatory steps.
3. **Run gauntlet**. Balanced defences and a 50% target are preselected. The generated player URL uses `autostart=1`, so the runtime begins without a fourth Start tap.

## Progressive disclosure

The novice does not need combat arithmetic. The acceptance screen shows only runner identity, class, level and weapon. `View stats` reveals HP, attack and defence. The launch screen shows a readable summary. `Customize` reveals presets, three guard slots, potion and target HP. This keeps the first one or two runs fast while preserving a path into deeper builder strategy.

## Default runner and encounter

- Runner: Level 1 Warrior, stats derived from the existing `warrior` catalogue entry.
- Weapon label: Longsword, matching the current stock visual direction.
- Default encounter: Goblin + Skeleton + Small Potion.
- Budget: 100 gold.
- Default target: 50% HP.

The runner profile is data-only at `public/flare-s3/data/runner.json`; combat stats remain catalogue-owned, avoiding duplicated balance authority.

## Scale boundaries

S3 reuses the existing collision-aware deterministic simulation, Flare room loader, challenge encoder and renderer. The new layer contains only invite/auth placeholder, runner presentation, novice flow and the separate player entry point. This keeps future account systems, room catalogues, runner progression, server verification and AI-assisted building replaceable without rewriting the simulation.

## Acceptance criteria

- Builder and player URLs are distinct.
- Default novice path is exactly three primary touches before runtime.
- Runner identity is shown before dungeon choice.
- HP, attack and defence are available but optional.
- Three stock rooms remain selectable using large arrows or swipe.
- Balanced default encounter is legal under 100 gold.
- Customization is optional and does not block the novice path.
- Player runtime autostarts when launched from the builder.
- Player URL can be forwarded independently.
- Completion view offers replay/share and a separate path back to build a gauntlet.
- No production/Beta/C++/GitHub Actions work is introduced.
