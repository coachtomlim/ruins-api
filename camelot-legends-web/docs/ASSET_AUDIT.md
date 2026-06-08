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

No archive image/model assets are wired into the first playable demo yet. The demo uses neutral CSS visuals while content, save/load, navigation, inventory, and combat are proven.
