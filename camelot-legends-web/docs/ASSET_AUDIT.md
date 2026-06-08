# Asset Audit

Generated from `C:\Users\Thomas\My Drive\CamleotLegends-GameFiles` with Unity `Library` cache excluded.

## Summary

- Total manifest assets: 3595
- Immediately usable without mandatory conversion: 2683
- Need conversion/optimization/review: 912

## Strong Asset Areas

- `Assets/Battle/Battle`: battle UI and background material.
- `Assets/Arena`: lobby/room/zone UI reference, but multiplayer is out of scope.
- `Assets/Main Menu` and `Assets/Player Interface`: menu and HUD references.
- `Main_Characters`: character portraits and animation stills.
- `Camelot Animation Project`: many Unity/GIF animation references.
- `4Characters-for-Unity/Assets/Daz3D`: four Daz/Unity character models/prefabs and bridge material.

## Conversion Flags

- PSD files should be exported to optimized PNG/WebP.
- Large PNG/JPG/GIF files should be size-checked before mobile use.
- FBX/Daz/Unity assets are not directly browser-runtime assets for the React-first Beta.
- GIF animation should be reviewed for size/performance; sprite sheets or video may be better later.
- CraftPix/Cratpix and Daz assets need rights review before public distribution.

## Currently Wired Assets

Recovered assets wired into the playable browser demo:

- `public/assets/recovered/level-design-example.png`
- `public/assets/recovered/characters-v2.png`
- `public/assets/recovered/characters/party-characters-v2.png`
- `public/assets/recovered/maps/grasslands.png`
- `public/assets/recovered/maps/deadforesttile.png`
- `public/assets/recovered/maps/mapcastlebrown.png`
- `public/assets/recovered/maps/mapcastlewhite.png`
- `public/assets/recovered/battle/battle-field-background.png`
- `public/assets/recovered/enemies/forgon.png`
- `public/assets/recovered/enemies/forgon-idle.gif`
- `public/assets/recovered/enemies/bandit1-new-spritesheet.png` (copied for future reference, not rendered)

Current usage:

- Title screen: `level-design-example.png`
- Level 1 area visual: recovered map/tile-sheet images
- Survivor encounter: map scene plus survivor marker
- Scout approach: castle approach map plus scout marker
- Forgon Scout battle: recovered battle background plus Forgon GIF
- Victory screen: castle map visual plus party image

Deferred:

- Dedicated survivor portrait or crowd image
- Cropped party sprites instead of full party image
- Cropped Forgon frames from sprite sheet instead of GIF/full sheet
- Item icons for Amethyst, Lithic Armor, and Potion
- Optimized mobile WebP exports

Source path and dimension details are recorded in `public/content/visual-asset-bindings.json`.

These are local reconstruction assets only. The broader archive still needs conversion, optimization, naming, and rights review before public release.
