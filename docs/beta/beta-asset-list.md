# Ruins Beta Asset Library And Stocktake

Status baseline: 2026-05-22

Runtime manifest: `public/assets-manifest.json`

Imported public package folder: `public/assets/beta/`

## Production Package Rules

- Only game assets should be copied into `public/`.
- Debug screenshots, API setup notes, credentials, prompts, and non-game notes must stay out of the public package.
- Archive files containing sensitive values must be treated as compromised source material and must not be published.
- Runtime gameplay uses static pregenerated assets only. No runtime AI image generation is required for Beta 1.

## Runtime Assets Wired In Beta 1

| Asset | Runtime id | File | Status | Notes |
| --- | --- | --- | --- | --- |
| Main map | `map.main` | `assets/beta/rooms/map-main.webp` | EXISTS | Used as fallback and display map. |
| Room 1 | `room.01.image` | `assets/beta/rooms/room-01-cracked-altar.webp` | EXISTS | Portrait Beta crop. |
| Room 2 | `room.02.image` | `assets/beta/rooms/room-02-shrine-silent-coil.webp` | EXISTS | Wired to `room.02`. |
| Room 3 | `room.03.image` | `assets/beta/rooms/room-03-sarcophagus-hall.webp` | EXISTS | Wired to `room.03`. |
| Room 4 | `room.04.image` | `assets/beta/rooms/room-04-guardroom-delta.webp` | EXISTS | Wired to `room.04`. |
| Room 5 | `room.05.image` | `assets/beta/rooms/room-05-library-echoes.webp` | EXISTS | Wired to `room.05`. |
| Room 5B | `room.05b.image` | `assets/beta/rooms/room-05b-secret-room.webp` | EXISTS | Available, not yet attached to a room state. |
| Room 6 | `room.06.image` | `assets/beta/rooms/room-06-cracked-mirror.webp` | EXISTS | Wired to `room.06`. |
| Room 7 | `room.07.image` | `assets/beta/rooms/room-07-black-roots.webp` | EXISTS | Wired to `room.07`. |
| Room 8 | `room.08.image` | `assets/beta/rooms/room-08-chapel-glass.webp` | EXISTS | Wired to `room.08`. |
| Room 9 | `room.09.image` | `assets/beta/rooms/room-09-room-of-cares.webp` | EXISTS | Wired to `room.09`. |
| Room 10 | `room.10.image` | `assets/beta/rooms/room-10-boss-room.webp` | EXISTS | Wired to boss chamber. |
| Room 3 to 4 transition | `transition.room03.room04` | `assets/beta/transitions/room-03-to-04.webp` | EXISTS | Display API exposed. |
| Room 4 to 3 transition | `transition.room04.room03` | `assets/beta/transitions/room-04-to-03.webp` | EXISTS | Display API exposed. |
| Dead end secret passage | `transition.dead_end_secret_passage` | `assets/beta/transitions/dead-end-secret-passage.webp` | EXISTS | Display API exposed; not yet auto-selected by transition node. |
| Tavern prologue | `scene.prologue.tavern` | `assets/beta/scenes/prologue-tavern-sheja.webp` | EXISTS | Used for prologue view. |
| Ruins approach | `scene.ruins.approach` | `assets/beta/scenes/towards-ruins.webp` | EXISTS | Available for future title/entry sequence. |
| Ruins entrance | `scene.ruins.entrance` | `assets/beta/scenes/ruins-entrance.webp` | EXISTS | Available for future entry sequence. |
| Black fallback frame | `scene.black_start` | `assets/beta/scenes/black-start-frame.webp` | EXISTS | Fallback scene. |

## Imported But Not Yet Wired

These are available in `public/assets/beta/transitions/` but are not yet bound to transition nodes or route macros:

- `north-passageway.webp`
- `north-passageway-2.webp`
- `north-passageway-2b.webp`
- `north-passageway-3.webp`
- `passageway-turning-east.webp`
- `passageway-turning-west.webp`
- `straight-north-passageway-1.webp`

## Candidate Archive Assets Not Imported

- `ChatGPT Image 1.webp` through `ChatGPT Image 8.webp`: likely candidate scene or monster material, but names are not descriptive enough for production manifest binding.
- `@Room3to4.webp` and `@Room4to3.webp`: duplicate transition variants. Current manifest uses the non-prefixed versions.
- `Thrive OpenAPI username.png`: excluded as non-game/debug material.
- Text notes and DOCX files: excluded from public package.

## Gaps For Beta 2 And Later

- Monster portraits are not locked. Random low-tier monsters, Imp, Musca, Lizardman, and Banshee Doppelganger need approved standing/attack/defeat coverage if combat becomes animated.
- Item icons are not present in the public package. Prism fragments, scrolls, Girdle, potion, store gear, and final artifact need icons for inventory panels.
- Transition coverage is partial. Room 3 to Room 4 and Room 4 to Room 3 are strong; other multi-step corridors need route mapping and final art selection.
- Title, ending, store, boss-defeat, and post-boss artifact scenes can use placeholders for Beta 1 but need final art before public Beta.

## Independent Development Assessment

Codex can independently continue with:

- manifest maintenance and validation;
- wiring existing room and scene images;
- placeholder/fallback behavior;
- UI layout and responsive polish;
- asset completeness checks;
- route-to-transition binding once the movement graph is stable.

Critical human design decisions still needed before final public Beta:

- whether combat is static, lightly animated, or fully animated;
- whether die-pose monster assets are mandatory for all monsters;
- whether candidate unnamed images are approved for monster/scene use;
- final visual style for item icons and HUD art;
- final Room 9 presentation if store and seal chamber both remain.
