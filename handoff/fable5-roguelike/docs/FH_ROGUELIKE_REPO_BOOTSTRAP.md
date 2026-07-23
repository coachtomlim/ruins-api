# Fiends & Hero Roguelike Repo Bootstrap

## New Repository

Recommended repository name:

`fiends-hero-roguelike`

Legacy/reference repository:

`coachtomlim/ruins-api`

## Base

Start from Roguelike Browser Boilerplate:

`https://github.com/chr15m/roguelike-browser-boilerplate`

Recommended approach:

1. Create a new empty repo named `fiends-hero-roguelike`.
2. Add Roguelike Browser Boilerplate as the initial game base.
3. Vendor or pin runtime dependencies instead of relying on CDN links.
4. Add F&H Alpha data as Content Module 001.
5. Keep `ruins-api` available only as legacy/canon/reference material.

## Target Structure

```text
fiends-hero-roguelike/
README.md
LICENSE_NOTES.md
AGENTS.md
FABLE5_MASTER_PROMPT.md
package.json
src/
  game/
  engine/
  editor/
  ui/
content/
  modules/
    forgotten-ruin-dark-galan/
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
scripts/
  walkthrough/
  validate/
docs/
  architecture/
  walkthroughs/
  audits/
tests/
```

## Content Placement

Place F&H Alpha Module 001 under:

`content/modules/forgotten-ruin-dark-galan/`

Minimum module files:

- `module.json`: module id, title, version, start room, victory condition.
- `rooms.json`: room definitions copied/adapted from Alpha SSOT.
- `map.json`: grid or room graph layout.
- `exits.json`: movement rules and one-way edges.
- `encounters.json`: encounter placement and trigger rules.
- `fiends.json`: fiend definitions.
- `artifacts.json`: artifacts and acquisition rules.
- `scrolls.json`: scroll text and unlock/use rules.
- `journals.json`: journal entries and unlock conditions.
- `dialogue.json`: dialogue/events text.
- `events.json`: scripted room, encounter, inventory, and journal events.
- `victory.json`: Prism, boss, and ending conditions.

## Engine Placement

Add deterministic engine code under:

`src/engine/`

The engine should own:

- module loading and validation
- seeded RNG
- immutable or traceable state transitions
- movement
- inventory
- journal unlocks
- encounter/combat resolution
- victory/loss state
- walkthrough trace emission

## Game UI Placement

Add playable browser UI under:

`src/game/`

Use RBB's browser loop as the starting point, but keep F&H module data outside hardcoded game functions.

## Editor/Admin UI Placement

Add map and room development UI under:

`src/editor/`

Minimum editor goals:

- inspect rooms and exits
- inspect encounters, artifacts, scrolls, and journals
- validate reachability
- show one-way movement rules
- export or revalidate module JSON

## Walkthrough Placement

Add deterministic walkthrough tooling under:

`scripts/walkthrough/`

Required outputs:

- `docs/walkthroughs/module-001/walkthrough.md`
- `docs/walkthroughs/module-001/trace.json`

The walkthrough must fail if Module 001 becomes unwinnable.

## Validation

Add validators under:

`scripts/validate/`

Minimum validations:

- module schema
- room graph reachability
- one-way exits
- encounter trigger coverage
- artifact/journal dependency graph
- Prism assembly path
- final boss reachability
- victory path

## License Notes

Create `LICENSE_NOTES.md` and document:

- RBB code: MIT.
- ROT.js: BSD-3-Clause.
- Kenney Micro Rogue tileset: CC0 if retained.
- NES.css: MIT if retained.
- sfxr/jsfxr: public-domain-style attribution per source if retained.
- Pixel coin: CC-BY 3.0 if retained; replace or attribute.

## Bootstrap Commands

Suggested starting commands:

```sh
git clone https://github.com/chr15m/roguelike-browser-boilerplate.git fiends-hero-roguelike
cd fiends-hero-roguelike
git remote remove origin
git remote add origin https://github.com/coachtomlim/fiends-hero-roguelike.git
```

Then add the handoff files from `ruins-api/handoff/fable5-roguelike/` and begin the Module 001 spike.
