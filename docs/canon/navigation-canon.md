# Navigation Canon

## Core Navigation

- `LOCKED`: The dungeon contains 10 unique rooms.
- `LOCKED`: Navigation is room/node based.
- `LOCKED`: Directional movement uses cardinal commands such as `North`, `South`, `East`, `West`, and likely `N/S/E/W`.
- `LOCKED`: Valid directions should be shown at every location.
- `LOCKED`: The player cannot leave the Ruin once entered.
- `LOCKED`: Some passages are one-way.
- `LOCKED`: Dead ends, murals, secret panels, and similar triggers must be discovered manually with `Examine` or contextual commands.

## Special Routes

- `LOCKED`: Hexagonal Glass Piece activates a one-way secret portal/shortcut associated with the black wall/dead-end route.
- `LOCKED`: The secret portal is one-way.
- `LOCKED`: If the player reaches Room 4 via the secret portal and runs from battle, they return to Room 6.
- `LOCKED`: Room 5 corrected navigation includes going South to a mid-passageway, then choosing West to the dead-end dark passage or South back to Room 6.

## Room Exits from Evidence

- `LIKELY`: Room 1 exits north to Room 2.
- `LIKELY`: Room 2 connects east to Room 6 and via north/west/north route to Room 3.
- `LIKELY`: Room 3 connects northwest to Room 4 and back toward Room 2.
- `LIKELY`: Room 4 connects toward Room 8, Room 3, and Room 7.
- `LIKELY`: Room 5 connects back through corrected mid-passageway logic and to the secret portal route.
- `LIKELY`: Room 6 connects to Room 2 and Room 5 route.
- `LIKELY`: Room 7 connects south to Room 9 and north/back to Room 4.
- `LIKELY`: Room 8 connects back toward Room 4 / Room 7 / Room 3 via multi-step exits.
- `LIKELY`: Room 9 unlocks path to Room 10 after prism conditions.
- `LOCKED`: Room 10 has no normal exits; it is the final boss chamber.

## Unknowns

- `UNKNOWN`: Whether multi-step exits should be modeled as abstract edges or explicit corridor nodes.
- `UNKNOWN`: Whether map display should use canonical room ids, image asset names, or both.
- `UNKNOWN`: Whether random encounters can occur during backtracking outside fixed room encounters; current Alpha appears mostly static.
