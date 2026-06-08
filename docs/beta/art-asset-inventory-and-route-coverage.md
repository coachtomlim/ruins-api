# Art Asset Inventory And Route Coverage

Date: 2026-06-08

Local Ruins URL: `http://localhost:4273/play.html`

Scope: this inventory covers art assets currently inside this repository under `public/`. The current filesystem permissions do not allow re-reading the older Desktop/Drive source folders, so external source archives are not included here unless already imported.

## Summary

- Room stills: complete for Rooms 1-10.
- Prologue/entry scenes: partial but usable.
- Transition art: partial.
- Bespoke room-to-room transition coverage: not complete.
- Generic corridor transition candidates: available but not mapped to route intents yet.
- Monster art: not present as manifest assets.
- Item icons: not present as manifest assets.

Current runtime can walk room-to-room using room images plus text. It does not yet have enough confirmed transition art to visually animate every `go north`, `go south`, `go east`, `go west`, left turn, or right turn.

## Runtime Manifest Art

| Type | Count | Coverage |
| --- | ---: | --- |
| Map | 1 | Main map available. |
| Room images | 11 | Rooms 1-10 plus Room 5B secret room. |
| Transition images | 3 | Room 3 to 4, Room 4 to 3, dead-end secret passage. |
| Scene images | 4 | Tavern, approach, entrance, fallback. |
| Monster images | 0 | None wired. |
| Item icons | 0 | None wired. |

## Legacy Public Art

These flat-root files remain in `public/` as compatibility/fallback assets:

| File | Use |
| --- | --- |
| `Map.webp` | Legacy map fallback. |
| `Room 1.png` | Legacy Room 1 fallback. |
| `Room3.webp` | Legacy Room 3 fallback. |
| `Room4.webp` | Legacy Room 4 fallback. |
| `Room3to4.webp` | Legacy transition fallback. |
| `Room4to3.webp` | Legacy transition fallback. |

## Imported Beta Art

### Rooms

| Room | Asset | Status |
| --- | --- | --- |
| Room 1 | `public/assets/beta/rooms/room-01-cracked-altar.webp` | Wired |
| Room 2 | `public/assets/beta/rooms/room-02-shrine-silent-coil.webp` | Wired |
| Room 3 | `public/assets/beta/rooms/room-03-sarcophagus-hall.webp` | Wired |
| Room 4 | `public/assets/beta/rooms/room-04-guardroom-delta.webp` | Wired |
| Room 5 | `public/assets/beta/rooms/room-05-library-echoes.webp` | Wired |
| Room 5B | `public/assets/beta/rooms/room-05b-secret-room.webp` | Available, not route-wired |
| Room 6 | `public/assets/beta/rooms/room-06-cracked-mirror.webp` | Wired |
| Room 7 | `public/assets/beta/rooms/room-07-black-roots.webp` | Wired |
| Room 8 | `public/assets/beta/rooms/room-08-chapel-glass.webp` | Wired |
| Room 9 | `public/assets/beta/rooms/room-09-room-of-cares.webp` | Wired |
| Room 10 | `public/assets/beta/rooms/room-10-boss-room.webp` | Wired |
| Map | `public/assets/beta/rooms/map-main.webp` | Wired |

### Scenes

| Scene | Asset | Status |
| --- | --- | --- |
| Prologue tavern | `public/assets/beta/scenes/prologue-tavern-sheja.webp` | Wired |
| Towards ruins | `public/assets/beta/scenes/towards-ruins.webp` | Available |
| Ruins entrance | `public/assets/beta/scenes/ruins-entrance.webp` | Available |
| Entrance toward Room 1 | `public/assets/beta/scenes/entrance-towards-room-01.webp` | Available, not in manifest |
| Black start/fallback | `public/assets/beta/scenes/black-start-frame.webp` | Wired fallback |

### Transitions

| Transition Asset | Runtime Status | Notes |
| --- | --- | --- |
| `room-03-to-04.webp` | Wired | Bespoke Room 3 to Room 4 movement. |
| `room-04-to-03.webp` | Wired | Bespoke Room 4 to Room 3 movement. |
| `dead-end-secret-passage.webp` | Wired in manifest | Candidate for Room 5 secret/dead-end branch. |
| `north-passageway.webp` | Available, not in manifest | Generic north movement candidate. |
| `north-passageway-2.webp` | Available, not in manifest | Generic north movement candidate. |
| `north-passageway-2b.webp` | Available, not in manifest | Generic north movement candidate. |
| `north-passageway-3.webp` | Available, not in manifest | Generic north movement candidate. |
| `straight-north-passageway-1.webp` | Available, not in manifest | Generic straight north candidate. |
| `passageway-turning-east.webp` | Available, not in manifest | Generic right/east turn candidate. |
| `passageway-turning-west.webp` | Available, not in manifest | Generic left/west turn candidate. |

## Movement Route Coverage

| From | Direction / Route | To | Art Coverage | Notes |
| --- | --- | --- | --- | --- |
| Room 1 | north | Room 2 | Generic candidate only | Could use north passageway, but no bespoke Room 1 to 2 transition. |
| Room 2 | east | Room 6 | Generic candidate only | Could use east/right-turn passageway. |
| Room 2 | multi_step_north_west_north | Room 3 | Generic candidate only | Needs multi-step corridor sequence. |
| Room 3 | northwest | Room 4 | Bespoke covered | `room-03-to-04.webp`. |
| Room 3 | multi_step_south_east_south | Room 2 | Missing | No confirmed reverse route art. |
| Room 4 | west_then_north | Room 8 | Generic candidate only | Could use west turn plus north passageway. |
| Room 4 | east_then_south | Room 3 | Bespoke covered | `room-04-to-03.webp`. |
| Room 4 | south | Room 7 | Missing | Needs south/back corridor art or approved generic fallback. |
| Room 5 | south_to_mid_passage | Mid-passage | Missing | Needs Room 5 exit/passage art. |
| Mid-passage | west | Dead-end black wall | Partial | Dead-end asset exists, but approach movement is not separately covered. |
| Mid-passage | south | Room 6 | Missing | Needs mid-passage to Room 6 art. |
| Dead-end black wall | use_hexagonal_glass_piece | Room 4 | Missing | Needs portal/teleport transition if visualized. |
| Room 6 | northwest | Room 5 | Missing | Needs Room 6 to 5 movement art. |
| Room 6 | south_or_east_to_room02 | Room 2 | Generic candidate only | Route is canon-conflicted; art should wait for route decision. |
| Room 7 | south | Room 9 | Missing | Needs Room 7 to 9 art. |
| Room 7 | north | Room 4 | Missing | Needs Room 7 to 4 art. |
| Room 8 | south_east_south | Room 4 | Generic candidate only | Could use south/east sequence if approved. |
| Room 8 | south_east_south_east_south | Room 3 | Generic candidate only | Needs longer corridor sequence. |
| Room 9 | west_then_north | Room 10 | Missing | Needs final boss approach transition. |
| Room 9 | north_or_backtrack | Room 4 | Missing | Route is ambiguous; art should wait for route decision. |

## Answer: Do We Have What We Need To Walk Room To Room?

For functional gameplay: yes. Every room has a room image, and the engine can move the player between rooms.

For graphical walking with specific transitions: not yet.

We have:

- complete room destination art;
- a few strong bespoke transitions;
- several generic passageway candidates for north/east/west movement;
- no complete route-by-route transition map;
- no approved south/backtrack transition set;
- no final approach to Room 10;
- no portal/teleport transition;
- no route-specific animation plan.

## Recommended Next Step

Create a route transition manifest separate from the room asset manifest:

- route id;
- from room;
- command/direction;
- to room or transition node;
- asset sequence;
- fallback asset;
- whether the sequence is approved, placeholder, or missing.

This lets Beta show available generic movement now while keeping missing bespoke art visible as production gaps.
