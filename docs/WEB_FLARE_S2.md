# WEB-FLARE S2: quick challenge builder

Purpose: prove the social game loop without building new maps. A builder picks one of three already-authored Flare rooms, buys up to three guards and one potion from a 100-gold budget, predicts the warrior's finishing health, and gets a URL. The recipient opens the URL and watches the same rules-based autonomous warrior attempt the room.

## Architecture
- Existing S1 navigation/combat remains the gameplay authority.
- S2 challenge links contain only compact allowlisted data in the URL fragment. No account, database or AI is needed for the MVP.
- Three stock Flare rooms are pinned by source commit and blob identity: Iron Labyrinth rooms 1, 7 and 15.
- Room geometry is not generated. S2 parses the authored stock map and collision data, derives legal spawn/exit/encounter slots deterministically, and renders the stock art in the browser.
- A deterministic source verifier checks all three room blobs, validates the generated challenge manifests against the S1 rules, and simulates each default challenge during the preview build.
- The builder cannot override costs or combat stats. Those remain in the catalogue.
- Player camera starts with the whole room, then follows at a closer default zoom (1.45x S1 gameplay zoom), with manual zoom/overview controls.

## Deliberate MVP limit
Room tile art is loaded from the pinned public Flare source for these three gallery rooms. This is acceptable for the bounded preview, but not the scale endpoint. After owner acceptance, package the approved room subset into first-party compressed atlases/CDN, then add server replay authority and short challenge IDs before broader sharing.

## Next
If the 30-second build -> link -> sub-minute run loop is fun, expand the room registry to 10-20 curated stock rooms, add more enemy archetypes/traps, then optional AI-assisted dungeon composition. Do not build procedural geometry before this loop is accepted.
