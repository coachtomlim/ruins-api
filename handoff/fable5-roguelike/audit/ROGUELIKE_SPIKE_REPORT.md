# Roguelike Spike Report

## Candidate Selected

Roguelike Browser Boilerplate, because it is the fastest browser-first base and already demonstrates the game-loop concepts Fiends & Hero needs.

## Files Created

- `docs/roguelike-spike/fiends-hero-rbb-spike.html`
- `docs/roguelike-spike/fiends-hero-rbb-spike.js`

## Commands Run

- `node.exe --check docs\roguelike-spike\fiends-hero-rbb-spike.js`
- `python.exe -m http.server 8133`
- `Invoke-WebRequest http://127.0.0.1:8133/docs/roguelike-spike/fiends-hero-rbb-spike.html`

## What The Spike Proves

- A two-room F&H module can be represented as machine-readable data.
- Player movement from Room 1 to Room 2 can be logged as trace data.
- A fiend encounter can trigger from Room 2.
- An artifact can be collected after the encounter.
- A journal entry can unlock after artifact collection.
- Victory can be gated on artifact plus journal state.
- Walkthrough trace JSON can be generated directly from state transitions.

Representative trace:

```json
[
  { "step": 0, "type": "module_loaded", "moduleId": "module-001-spike" },
  { "step": 1, "type": "move", "roomId": "fiend", "detail": { "from": "entry", "to": "fiend", "direction": "east" } },
  { "step": 2, "type": "encounter_triggered", "roomId": "fiend", "detail": { "fiend": "ashen-fiend" } },
  { "step": 3, "type": "artifact_collected", "roomId": "fiend", "detail": { "artifact": "ember-sigil" } },
  { "step": 4, "type": "journal_unlocked", "roomId": "fiend", "detail": { "journal": "journal-entry-001" } },
  { "step": 5, "type": "victory", "roomId": "fiend", "detail": { "condition": ["artifact:ember-sigil", "journal:journal-entry-001"] } }
]
```

## What Remains Unproven

- Direct patching into RBB's `Game` object and ROT display loop.
- Pixel/tile rendering with F&H art.
- Combat balance and fiend behavior.
- Save/load state.
- Module editor UI.
- Automated browser walkthrough screenshots.
- Vercel production build using pinned local dependencies.

## Notes

The spike is deliberately isolated from the current Beta build and does not import or alter legacy code.
