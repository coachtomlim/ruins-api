# New Repo Bootstrap

## Repository

New repo name:

`fiends-hero-roguelike`

Legacy/reference repo:

`coachtomlim/ruins-api`

Keep legacy `ruins-api` as reference only.

## Base

Base implementation:

Roguelike Browser Boilerplate

Source:

`https://github.com/chr15m/roguelike-browser-boilerplate`

## Required New Repo Paths

Add F&H module data under:

`content/modules/forgotten-ruin-dark-galan/`

Add deterministic walkthrough under:

`scripts/walkthrough/`

Add editor/admin UI under:

`src/editor/` or equivalent

Add game UI under:

`src/game/` or equivalent

Add engine code under:

`src/engine/`

## Bootstrap Steps

1. Create GitHub repo `coachtomlim/fiends-hero-roguelike`.
2. Clone or fork Roguelike Browser Boilerplate into that repo.
3. Add `LICENSE_NOTES.md` with RBB, ROT.js, asset, and attribution notes.
4. Copy this handoff package into the new repo as reference material.
5. Create the target module structure for Module 001.
6. Import Alpha SSOT JSON into module files without rewriting canon.
7. Build deterministic engine and trace layer.
8. Wire browser UI to module data.
9. Add automated walkthrough runner.
10. Iterate until walkthrough reaches victory and emits `walkthrough.md` plus `trace.json`.

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
