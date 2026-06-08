# Beta 0 Baseline Lock

Date: 2026-05-22

## Alpha Walkthrough Authority

The local Alpha lock document reviewed for this baseline is:

`C:/Users/Thomas/My Drive/Ruins Adventure Game - Alpha/@ Ruins Alpha - CODEX Complete @/RUINS ADVENTURE LOCKED ALPHA - CODEX Complated w Walkthrough.docx`

Key baseline references from that document:

- Locked Alpha branch: `engine-prep-v1`
- Local play entry: `http://localhost:4173/play.html`
- Bootstrap API: `/api/game-bootstrap`
- Compatibility API: `/api/display-room`
- Walkthrough log: `docs/walkthrough-log.md`
- Final walkthrough screenshot: `docs/walkthrough-final-ui.png`
- Walkthrough runner: `scripts/walkthrough-ui.js`

## Current Baseline Contract

Beta must preserve these Alpha player flows unless a canon decision changes them:

- Sheja prologue and negotiation up to 900 gold.
- Incantation entry into Room 1.
- Room movement through the ten-room dungeon.
- Examine-triggered journal and item reveals.
- Manual pickup for visible items.
- Prism assembly from fragments A, B, and C.
- Turn-based combat with monster initiative, d4 hit/damage rules, scroll effects, run penalty, and victory rewards.
- Room 5 hidden panel flow for Girdle and lorebook.
- Room 9 store when Prism is assembled.
- Room 10 Girdle precondition, Banshee combat, artifact reveal, artifact pickup, and ending completion.
- Local save/load outside combat.
- Existing `/api/display-room` markdown behavior and `/openapi.yaml` availability.

## Beta 0 Implementation Result

- The Beta asset package now lives under `public/assets/beta/`.
- The asset manifest now includes all 10 room images, key scenes, and currently approved transition assets.
- The UI bootstrap API exposes scene and transition asset lookups while preserving room image lookup.
- The display-room API can return nested public asset paths.
- The lint-blocking trailing whitespace in `docs/beta/beta-requirements.md` is removed.

## Open Alpha Caveats Carried Forward

- The gameplay behavior still lives mainly in `public/play.js`; `src/engine` remains a scaffold.
- Auto walkthrough is a UI runner, not an engine-level replay contract.
- Canon conflicts remain unresolved and must not be silently normalized:
  - incorrect scroll reduction;
  - Imp stat variant;
  - Lizardman EVA variant;
  - Room 9 store/seal role;
  - Girdle acquisition wording;
  - Hexagonal Glass hinting;
  - final reward gold;
  - journal numbering.

## Beta 1 Acceptance Target

The first graphical milestone is satisfied only when the Alpha walkthrough can run locally through `/play.html` with:

- portrait-first room viewport;
- visible status, inventory, and journal panels;
- phase-aware prologue, exploration, and combat action bars;
- no broken room images for the Alpha walkthrough route;
- no horizontal overflow on mobile portrait;
- checks and walkthrough script passing.
