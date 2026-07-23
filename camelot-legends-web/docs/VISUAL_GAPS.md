# Visual Gaps

## Remaining Gaps

- The scene map is a layered static map/tile-sheet presentation, not a full interactive isometric tile engine.
- Party visual uses a recovered party image, not individual walking/idling sprites.
- Survivor and scout use clear markers rather than dedicated recovered character sprites.
- Forgon uses a recovered GIF animation for battle; the recovered PNG sprite sheet still needs frame extraction.
- Battle actions do not yet animate attacks, damage reactions, or guard effects.
- Item pickups do not yet show item icons.
- Victory screen uses recovered map/party art but no unique victory illustration.

## Deferred Asset Work

- Extract individual party frames.
- Extract Forgon idle/attack frames from `forgon.png`.
- Identify or create survivor-compatible recovered art.
- Identify Castle Camelot approach background if a better single-image scene exists.
- Convert large PNG/GIF assets to optimized WebP/sprite atlases for mobile.

## Licensing Notes

All currently wired art is treated as local reconstruction material. Public release should wait until asset ownership, third-party packs, Daz/CraftPix references, and redistribution rights are reviewed.
