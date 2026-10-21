# RUINS Daily Expedition 001B Visual 002 — asset provenance

This presentation layer uses only the already accepted Flare v1.15 source pin
`2ef474f5f5f368628bc526f9e56f936dac743e49`. No generated, substituted, or
licence-pending art or audio is introduced by this work package.

## Runtime sources

| Presentation role | Pinned Flare source | Runtime selection |
| --- | --- | --- |
| Ruins Runner | `public/flare-s8a/actors.mjs` | Existing composed `warrior` actor assembled from the pinned base, hair, head, chest, hands, legs, feet, main-hand, off-hand, and shield layers |
| Zombie guardian | `public/flare-s8a/level2-actors.mjs` | Existing `zombie` stance and death animation |
| Cave floor | `mods/fantasycore/images/tilesets/tileset_cave.png` | Authored atlas frames at `(1152,1149,192,96)` and `(1344,1255,192,96)` |
| Ancient altar | `mods/fantasycore/images/tilesets/tileset_cave.png` | Dormant frame `(0,0,384,192)` and awakened frame `(384,0,384,192)` |
| First chest | `mods/fantasycore/images/tilesets/tileset_cave.png` | Closed frame `(1916,2951,91,86)` and open frame `(1008,1690,121,106)` |
| Sealed passage | `tiled/tilesheets/dungeon_door_left.png` and `tiled/tilesheets/dungeon_door_right.png` | Closed frame at `x=0`; open frame at `x=192` |

All remote image URLs in `public/ruins-expedition/day1-art.mjs` are raw GitHub
URLs containing the immutable pin above. Hero and zombie loading uses the
existing accepted local adapters, which in turn resolve only pinned stock
layers.

## Licence and attribution

The upstream Flare art is credited and licensed under CC-BY-SA 3.0 in the
existing project attribution page at `public/flare-p0/credits.html`. That page
remains the canonical in-product attribution. This document records the exact
runtime selections needed to reproduce the Visual 002 presentation.
