# Walkthrough Visual Production Plan

Date: 2026-06-08

Goal: make the locked Alpha walkthrough playable in the Beta graphical interface with visual continuity from prologue through ending.

Local URL: `http://localhost:4273/play.html`

## Definition Of Done

The walkthrough is visually done when:

- every walkthrough room entry shows the correct room art;
- every walkthrough movement shows either a bespoke transition or approved placeholder transition sequence;
- every combat encounter shows a combat visual state;
- every item pickup and journal-critical examine step gives visible UI feedback;
- Room 9 store and Room 10 boss/final artifact have distinct visual states;
- the existing walkthrough smoke still completes with unchanged game logic.

## Current Readiness

Already sufficient:

- Room stills for Rooms 1-10.
- Tavern/prologue scene.
- Room 3 to Room 4 transition.
- Room 4 to Room 3 transition.
- Generic north/east/west passageway candidates in `public/assets/beta/transitions/`.
- Basic combat HUD with HP bars and scroll readiness.
- Journal feedback for prism-face examines.

Still insufficient:

- route-specific transition manifest;
- most route-specific transition art;
- store screen visual state;
- boss-specific combat/artifact/end visual states;
- item icons;
- monster portraits or animations;
- post-boss ending art.

## Walkthrough Path And Required Visuals

### Prologue To Room 1

| Step | Current art | Need |
| --- | --- | --- |
| Tavern conversation | `prologue-tavern-sheja.webp` | Good enough for walkthrough. |
| Say incantation / approach ruin | `towards-ruins.webp`, `ruins-entrance.webp`, `entrance-towards-room-01.webp` available | Create scripted entry sequence using available scenes. |
| Enter Room 1 | Room 1 art wired | Good enough. |

Create:

- `route.prologue.to_ruins.sequence`: tavern -> approach -> entrance -> Room 1.
- Manifest entry for `entrance-towards-room-01.webp`.

### Room 1 To Room 2

Walkthrough command: `North`

Current art: Room 1 and Room 2 stills exist; no bespoke transition.

Create:

- Use `straight-north-passageway-1.webp` or `north-passageway.webp` as approved placeholder.
- `route.room01.north.room02`.

Final art optional:

- Bespoke Room 1 altar exit to Shrine approach.

### Room 2 To Room 6

Walkthrough command: `East`

Current art: Room 2 and Room 6 stills exist; generic right/east turn exists.

Create:

- Use `passageway-turning-east.webp` as placeholder.
- `route.room02.east.room06`.

Final art optional:

- Bespoke serpent shrine east corridor into cracked mirror chamber.

### Room 6 To Room 5

Walkthrough command: `North`

Current art: Room 6 and Room 5 stills exist; generic north passageways exist.

Create:

- Use `north-passageway-2.webp` or `north-passageway-3.webp` as placeholder.
- `route.room06.northwest.room05`.

Final art needed:

- Bespoke mirror room northwest passage to library.

### Room 5 Backtracking To Room 2

Walkthrough commands:

- `South` from Room 5 to mid-passage
- `South` from mid-passage to Room 6
- `South` or current alias back toward Room 2

Current art: Room 5, Room 6, Room 2 stills exist; dead-end secret passage exists; no mid-passage art in manifest.

Create:

- Add generic mid-passage route art using `north-passageway-2b.webp` as temporary passage.
- `route.room05.south.mid_passage`.
- `route.mid_passage.south.room06`.
- `route.room06.south_or_east.room02` as placeholder, while canon route remains conflicted.

Final art needed:

- Room 5 doorway to corrected midpoint.
- Midpoint to Room 6.
- Room 6 return path to Room 2 once route direction is canon-locked.

### Room 2 To Room 3

Walkthrough command: `North`

Runtime route: `multi_step_north_west_north`

Current art: generic north and west passageways exist.

Create:

- Sequence: `north-passageway.webp` -> `passageway-turning-west.webp` -> `north-passageway-3.webp`.
- `route.room02.multi_n_w_n.room03`.

Final art optional:

- Bespoke multi-step route into Sarcophagus Hall.

### Room 3 To Room 4

Walkthrough command: `go northwest`

Current art: `room-03-to-04.webp` exists and is wired as display asset.

Create:

- `route.room03.northwest.room04` binding.

No new art needed for walkthrough.

### Room 4 To Room 8

Walkthrough command: `West`

Runtime route: `west_then_north`

Current art: generic west and north passageways exist.

Create:

- Sequence: `passageway-turning-west.webp` -> `north-passageway.webp`.
- `route.room04.west_north.room08`.

Final art optional:

- Bespoke Guardroom to Chapel route.

### Room 8 To Room 7

Walkthrough command: `South`

Important: current room content lists Room 8 exits to Room 4 and Room 3, but the walkthrough expects `South` to progress toward Room 7. This should be checked as a route/content issue while preserving Alpha behavior.

Current art: Room 8 and Room 7 stills exist; no bespoke transition.

Create:

- Temporary south/backtrack visual using a generic passage if route remains valid in runtime.
- `route.room08.south.room07` if current runtime supports it, or update route manifest after content decision.

Final art needed:

- Chapel to black roots route.

### Room 7 To Room 9

Walkthrough command: `South`

Current art: Room 7 and Room 9 stills exist; no transition.

Create:

- Generic dark passage placeholder.
- `route.room07.south.room09`.

Final art needed:

- Black roots to Room of Cares corridor.

### Room 9 To Room 10

Walkthrough command: `West`

Runtime route: `west_then_north`

Current art: Room 9 and Room 10 stills exist; no final approach transition.

Create:

- Sequence: `passageway-turning-west.webp` -> `north-passageway-3.webp`.
- `route.room09.west_north.room10`.

Final art needed:

- Bespoke final boss approach / seal passage.

## Combat Visuals Needed For Walkthrough

The walkthrough contains these encounters:

- Room 2 random low-tier monster.
- Room 6 random/scaled low-tier monster.
- Room 5 Imp.
- Room 4 random/scaled low-tier monster.
- Room 8 Musca.
- Room 7 Lizardman.
- Room 10 Banshee Doppelganger.

Minimum to complete walkthrough:

- Keep current letter portrait HUD for random low-tier monsters.
- Create or approve static portraits for Imp, Musca, Lizardman, and Banshee.

Better Beta:

- idle pose for each monster;
- hit flash state;
- defeated/die pose for each monster;
- no full animation requirement yet.

Do not block walkthrough on full monster animation.

## Item And UI Assets Needed

Minimum item icons for walkthrough:

- Prism Fragment A.
- Fog of Confusion.
- Hexagonal Glass Piece.
- Heart Beacon.
- Sound-Deflecting Girdle.
- Lorebook.
- Cure All Stats Potion.
- Pulse of Calm.
- Prism Fragment B.
- Prism Fragment C.
- Prism of Makidos.
- Shield of the Lionheart.
- Hose of Speed.
- Merlin's Tetrahedronal.

These are not required to complete the command walkthrough, but they are required for a polished graphical inventory.

## Store, Boss, And Ending Visual States

Create for walkthrough completion:

- Room 9 store drawer/screen state using existing Room 9 art as background.
- Store item rows for Shield, Potion, Hose.
- Boss chamber precombat state.
- Boss defeated / crystal stand available state.
- Artifact pickup / Sheja ending panel.

New final art needed:

- post-boss artifact scene or ending card.

## Route Manifest To Create

Create `public/route-transitions.json` with:

```json
{
  "schemaVersion": 1,
  "routes": [
    {
      "id": "route.room01.north.room02",
      "from": "room.01",
      "command": "north",
      "to": "room.02",
      "assetSequence": ["assets/beta/transitions/straight-north-passageway-1.webp"],
      "status": "placeholder"
    }
  ]
}
```

Required fields:

- `id`
- `from`
- `command`
- `to`
- `assetSequence`
- `status`: `approved`, `placeholder`, or `missing`
- `notes`

## Implementation Order

1. Create route transition manifest with placeholder mappings for the walkthrough path.
2. Add missing transition files to the runtime asset manifest, not just the filesystem.
3. Update movement rendering to show transition sequence before destination room image.
4. Add entry sequence from tavern to ruins to Room 1.
5. Add store visual drawer/screen for Room 9.
6. Add boss and ending visual states.
7. Add minimum monster portraits for named monsters.
8. Add item icons for inventory polish.
9. Add route coverage validator to fail if a walkthrough route has no approved or placeholder visual.

## Critical Decisions

No immediate human decision is needed to finish a placeholder visual walkthrough.

Human decisions needed before public Beta:

- approve generic passageway reuse for repeated movements;
- decide whether Room 8 to Room 7 route should be explicit in content;
- choose static vs animated monster combat;
- approve final Room 9 store/seal presentation;
- approve final boss and ending art direction.

## Non-Blocking Placeholder Policy

For local Beta walkthrough, use placeholder transition art when bespoke art is missing.

Rules:

- Placeholder must be marked as `placeholder`.
- Placeholder must never overwrite route canon.
- Placeholder can be reused across routes.
- Missing final art must remain visible in docs and validation output.
