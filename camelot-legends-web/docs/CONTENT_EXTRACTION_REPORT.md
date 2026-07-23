# Content Extraction Report

Source archive: `C:\Users\Thomas\My Drive\CamleotLegends-GameFiles`

The archive was treated as read-only. Generated records preserve `sourceFile`, `confidence`, and `notes` so uncertain material stays visible.

## Extracted Record Counts

| File | Records |
|---|---:|
| `public/content/worlds.json` | 8 |
| `public/content/areas.json` | 100 |
| `public/content/scenes.json` | 40 |
| `public/content/characters.json` | 16 |
| `public/content/classes.json` | 6 |
| `public/content/enemies.json` | 7 |
| `public/content/skills.json` | 1755 |
| `public/content/items.json` | 157 |
| `public/content/equipment.json` | 155 |
| `public/content/dialogue.json` | 472 |
| `public/content/missions.json` | 40 |
| `public/content/asset-manifest.json` | 3595 |

## Successfully Extracted

- Area and episode records from `Camelot_Legends-GameBible.csv`.
- Dialogue NPC names and dialogue text from `Camelot_Legends-GameBible.csv`.
- Skill names/descriptions from `Camelot_Legends-GameBible.csv`.
- Equipment/item candidate records from `Camelot_Legends-GameBible.csv`.
- Character and class seeds from `CAMELOT LEGENDS NEW_GDD.docx`, `CamelotLegendsScript6.docx`, and the Unity sample scene.
- Asset manifest from all non-`Library` archive files.

## Missing Or Ambiguous

- Runtime gameplay logic is not present: no combat engine, inventory engine, save/load, or game loop survived.
- 60 area records look like placeholders, for example `AREA_41_NAME`.
- Enemy records are design-derived. Runtime stats, AI, encounter tables, and reward tables are not recovered.
- World grouping is derived from the GDD phrase `8 worlds x 5 area`; explicit world runtime data was not found.
- Arena/lobby assets exist, but no backend, matchmaking, account, or multiplayer code was found.

## Immediately Usable Assets

2683 assets appear directly usable as browser image/reference assets without mandatory conversion, mainly PNG/JPG/GIF files.

## Assets Needing Conversion

912 assets need conversion, optimization, rights review, or engine-specific handling. This includes PSD, FBX, Unity assets, archives, Office documents, and very large images.
