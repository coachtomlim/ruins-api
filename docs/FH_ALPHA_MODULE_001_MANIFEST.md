# F&H Alpha Module 001 Manifest

## Module Identity

- Module id: `forgotten-ruin-dark-galan`
- Product name: Fiends & Hero Roguelike Beta
- Source game: F&H Alpha
- Canon title: Forgotten Ruin of the Dark Galan
- Scope: authored 10-room module
- Role in new repo: Content Module 001

## Source Of Truth Files

Primary Alpha content files in `ruins-api`:

- `content/game-config.json`
- `content/rooms.json`
- `content/monsters.json`
- `content/items.json`
- `content/scrolls.json`
- `content/journal-entries.json`
- `content/flags.json`
- `content/commands.json`

Movement and route files:

- `public/navigation-map.json`
- `public/route-transitions.json`

Engine references:

- `src/engine/`
- `scripts/walkthrough-ui.js`
- `scripts/walkthrough-dom-smoke.js`
- `scripts/validate-content.js`
- `scripts/validate-navigation-map.js`
- `scripts/validate-route-transitions.js`
- `test/content-validation.test.js`
- `test/engine-state.test.js`
- `test/engine-rng.test.js`
- `test/engine-registries.test.js`
- `test/game-bootstrap.test.js`

Canon references:

- `docs/canon/canon-index.md`
- `docs/canon/rooms-canon.md`
- `docs/canon/navigation-canon.md`
- `docs/canon/combat-canon.md`
- `docs/canon/boss-mechanics-canon.md`
- `docs/canon/inventory-canon.md`
- `docs/canon/items-canon.md`
- `docs/canon/journal-canon.md`
- `docs/canon/timeline-canon.md`
- `docs/canon/canon-conflicts.md`

## Module 001 Requirements

Module 001 must preserve:

- all 10 rooms
- intended room names
- intended exits and movement locks
- Room 9 to Room 10 one-way behavior if canon requires it
- all fiends and final boss behavior
- artifacts, scrolls, Prism assembly, journals, flags, and commands
- dialogue and room events
- win/loss logic
- known canon conflicts until explicitly resolved

## Target Module Files In New Repo

```text
content/modules/forgotten-ruin-dark-galan/
  module.json
  rooms.json
  map.json
  exits.json
  encounters.json
  fiends.json
  artifacts.json
  scrolls.json
  journals.json
  dialogue.json
  events.json
  victory.json
```

## Import Rule

Import from Alpha SSOT first. Restructure content for the new roguelike schema, but do not rewrite canon content during bootstrap.
