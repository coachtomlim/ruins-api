# Roguelike Candidate Audit

Date: 2026-07-06

## Executive Recommendation

Use Roguelike Browser Boilerplate first for a Fiends & Hero Beta roguelike spike. It is the fastest path to a browser-deployable, skinnable, room/grid roguelike because it already includes a playable browser loop, map generation, room rendering, items, inventory UI, one monster, combat, win/loss screens, touch controls, and explicit MIT/commercial-use language.

ROT.js should remain the underlying toolkit choice if the team wants a cleaner long-term engine written around F&H content schemas from scratch. HobgoblinJS has appealing entity/item/mixin concepts, but its CLI failed on modern Node and its repository metadata has a license mismatch.

Adoption is recommended as a short spike path, not as a blind full migration. A full F&H migration is likely faster than building from scratch if the first milestone is an authored 10-room browser roguelike with simple encounters, artifacts, journals, dialogue/events, and walkthrough traces. If the product quickly needs a map editor, rich dialogue authoring, and deterministic automation, expect to extract the RBB game loop into a more data-driven structure or graduate to a custom ROT.js app layer.

## Candidate Comparison

| Candidate | License | Browser/Vercel fit | Completeness | Skinnability | F&H fit | Score | Recommendation |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Roguelike Browser Boilerplate | MIT code, mixed permissive assets | 14/15 | 13/15 | 18/20 | 12/15 | 84/100 | Use first |
| ROT.js | BSD-3-Clause | 15/15 | 8/15 | 16/20 | 11/15 | 78/100 | Use as toolkit/fallback |
| HobgoblinJS | LICENSE is MIT; package metadata says ISC | 8/15 | 9/15 | 14/20 | 12/15 | 64/100 | Do not start here |

## Fit Scores

| Candidate | License safety (15) | Browser/Vercel fit (15) | Completeness (15) | Skinnability (20) | F&H mechanics fit (15) | Code readability (10) | Walkthrough automation fit (10) | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Roguelike Browser Boilerplate | 13 | 14 | 13 | 18 | 12 | 7 | 7 | 84 |
| ROT.js | 15 | 15 | 8 | 16 | 11 | 8 | 5 | 78 |
| HobgoblinJS | 11 | 8 | 9 | 14 | 12 | 6 | 4 | 64 |

## License Findings

### Roguelike Browser Boilerplate

- Code license: MIT, commit `424ac4588c1e86a45b490ad67541506ac166897a`.
- Commercial redistribution and reskinning: allowed by MIT. The README also explicitly says commercial projects are allowed.
- Asset/license notes:
  - ROT.js: BSD license.
  - Kenney Micro Rogue tileset: CC0 1.0.
  - NES.css: MIT.
  - sfxr.me/jsfxr sound tooling: public domain per bundled credits.
  - Pixel coin image: CC-BY 3.0, requires attribution if kept.
- Risk: replace or track attribution for the coin GIF; keep third-party credits if any bundled asset remains.

### ROT.js

- Code license: BSD-3-Clause, commit `46782e248c2db9d379a5e4f13bb8323f18dff04b`.
- Commercial redistribution and reskinning: allowed with copyright/license notice retention and no endorsement by original author/contributors.
- Asset/license notes: core repo is a toolkit; no production game assets are needed for F&H if used as a library.
- Risk: none material for code use.

### HobgoblinJS

- Repository LICENSE file: MIT, commit `633311bab9a4e845598cbd4585a129bb8e63196c`.
- `package.json` license field: ISC.
- Commercial redistribution and reskinning: both MIT and ISC are permissive, but the mismatch should be resolved before adoption.
- Asset/license notes: no major bundled art asset path identified; examples are code/content templates.
- Risk: metadata mismatch and abandoned/old-tooling feel.

## Clone and Run Results

Environment:

- Current F&H commit audited from: `d3f897bf4e283fa1610e1f604e8ea78c36814036`.
- Global `node`, `npm`, `python`, and `make` were not on PATH.
- Used bundled Node `v24.14.0`, bundled Python `3.12.13`, and bundled `pnpm 11.7.0`.
- Candidate clone folder `_roguelike-audit` was temporary and removed after audit so the F&H lint walk remains clean.

### Roguelike Browser Boilerplate

- Clone: `git clone https://github.com/chr15m/roguelike-browser-boilerplate.git _roguelike-audit\roguelike-browser-boilerplate` passed.
- Install dependencies: no `package.json`; runtime dependencies are CDN links in `index.html`.
- Tests: no test script found.
- Dev server: `python.exe -m http.server 8131` passed; `Invoke-WebRequest http://127.0.0.1:8131/index.html` returned HTTP 200.
- Production build: repo has `make docs` / `node compile.js`, but no pinned package manifest for `jsdom` and `minify`; `make` was unavailable on this Windows shell. Treat production build as not validated.

### ROT.js

- Clone: `git clone https://github.com/ondras/rot.js.git _roguelike-audit\rot.js` passed.
- Install dependencies: `pnpm install` passed with deprecated-subdependency warnings.
- Tests: `pnpm test` failed because package script runs `make test`, and `make` is not available. Direct `node tests\run.js` failed because Puppeteer hardcodes `/usr/bin/google-chrome`.
- Build: `pnpm exec tsc` passed after prepending bundled Node to PATH. `pnpm exec rollup -c` passed and emitted bundle output to stdout.
- Dev server: `python.exe -m http.server 8132` passed; root docs page and `examples/dist/index.html` returned HTTP 200.
- Production build: full `make all` not validated because `make` is unavailable; underlying TypeScript and Rollup steps passed.

### HobgoblinJS

- Clone: `git clone https://github.com/jakofranko/hobgoblinjs.git _roguelike-audit\hobgoblinjs` passed.
- Install dependencies: `pnpm install` passed.
- Tests: `pnpm test` failed by design with "Error: no test specified".
- CLI smoke: `node hobgoblin.js --help` passed.
- Starter generation: `node ..\hobgoblinjs\hobgoblin.js init --examples` failed on Node 24 with `TypeError [ERR_INVALID_ARG_TYPE]: The "cb" argument must be of type function` from old `fs.mkdir` usage.
- Dev server/build: not validated because the example scaffold could not be generated on current Node.

## Architecture Notes

### Roguelike Browser Boilerplate

- Source layout: `index.html`, `main.js`, `style.css`, image assets, docs. Very compact.
- Map generation: `generateMap()` in `main.js`, using `ROT.Map.Digger`; room wall decoration in `generateRooms()`.
- Monsters/enemies: `makeMonster()`, `monsterAct()`, `monsterAt()`, `removeMonster()`.
- Items/inventory: `generateItems()`, `Game.items`, `checkItem()`, `renderInventory()`, `selectedInventory()`.
- Player state: `Game.player` from `makePlayer()`, with position, inventory, stats.
- Win/loss: `win()`, `lose()`, `checkDeath()`, and amulet position in `Game.amulet`.
- UI/screens: HTML screen divs in `index.html`, screen switching via `showScreen()`, HUD/inventory/toast in `main.js`.
- Data-driven vs hardcoded: mostly hardcoded in `main.js`; content must be extracted into F&H module JSON for serious use.
- F&H overlay: easy for a 2-room demo; moderate for full 10-room authored content unless refactored.

### ROT.js

- Source layout: TypeScript toolkit under `src/`, generated `lib/`, `dist/`, `manual/`, `examples/`, `tests/`.
- Map generation: `src/map/*`, including `digger.ts`, `rogue.ts`, `uniform.ts`, `arena.ts`, `cellular.ts`.
- Monsters/enemies: not provided as game content; examples/addons include generic entity helpers.
- Items/inventory: not provided as full game content.
- Player state: not provided as full game content.
- Win/loss: not provided as full game content.
- UI/screens: display backends in `src/display/*`; example pages only.
- Data-driven vs hardcoded: toolkit primitives, not a game schema.
- F&H overlay: excellent library foundation, but slower than RBB because the application layer must be built.

### HobgoblinJS

- Source layout: `src/game.js`, `map.js`, `entity.js`, `entity-mixins.js`, `item.js`, `item-mixins.js`, `screen.js`, AI helpers, examples.
- Map generation: `Game.Map._generateTiles()` in `src/map.js`, using `ROT.Map.Digger`; supports depth/stairs.
- Monsters/enemies: `Game.Entity`, `Game.EntityRepository`, `Game.EntityMixins.AIActor`, `Attacker`, `Destructible`.
- Items/inventory: `Game.Item`, `Game.ItemMixins`, `InventoryHolder`, map item slots.
- Player state: entity mixins including `PlayerActor`, `MessageRecipient`, `FoodConsumer`, stats.
- Win/loss: player death through `kill()` and example giant-zombie `onDeath` listener switches to win screen.
- UI/screens: `Game.Screen` prototypes, item list, targeting, menu screens.
- Data-driven vs hardcoded: repository templates and mixins are more data-shaped than RBB, but still old-style global JS.
- F&H overlay: conceptually good, practically slowed by old CLI/tooling and less complete browser packaging.

## Overlay Feasibility

| Candidate | 2-room F&H spike | Notes |
| --- | --- | --- |
| Roguelike Browser Boilerplate | Easy | Replace map generation with authored two-room module or seed a tiny map; add trace array beside `Game`; wire fiend/artifact/journal to item/combat hooks. |
| ROT.js | Moderate | Clean and safe, but requires custom game state, screen flow, item handling, dialogue/event layer, and trace generation. |
| HobgoblinJS | Difficult | Domain concepts exist, but CLI failure and old globals make a modern browser/Vercel spike slower than RBB. |

## Risks and Blockers

- RBB is not data-driven yet; F&H needs a content-module loader instead of hardcoded `main.js` constants.
- RBB production build tooling is underpinned by a Makefile and unpinned Node packages, so a Vercel-friendly build should be created if adopted.
- RBB uses CDN runtime dependencies by default; for deterministic Vercel builds, vendor/pin ROT.js, NES.css, and sound helpers.
- ROT.js is a toolkit, not a game. It is safer long-term but front-loads more custom work.
- HobgoblinJS is old and failed scaffold generation on modern Node.
- Any retained RBB pixel coin asset needs CC-BY attribution or replacement.

## Adoption Recommendation

Recommended first candidate: Roguelike Browser Boilerplate.

Recommended adoption mode:

1. Fork/copy RBB into an isolated `experiments/` or separate branch, not the current Beta app.
2. Replace CDN dependencies with pinned local dependencies.
3. Extract a minimal `module001.json` schema for rooms, exits, encounters, artifacts, journals, and victory.
4. Add deterministic trace logging from movement, encounter, item, journal, and victory events.
5. Only after the 2-room spike is green, estimate a 10-room Module 001 migration.

Full migration is likely faster than building from scratch if F&H accepts RBB's small-game constraints and a refactor toward data-driven content. If the editor and automation requirements are prioritized before playable Module 001, a custom ROT.js app layer may be cleaner despite taking longer upfront.
