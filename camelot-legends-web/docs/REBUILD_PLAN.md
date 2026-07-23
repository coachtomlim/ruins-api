# Camelot Legends Web Rebuild Plan

## Direction

Build a new web-first single-player Camelot Legends game. Treat the old Unity/Daz archive as source material, not the runtime engine.

## Why Not Unity First

The surviving Unity material is incomplete: no `ProjectSettings`, no `Packages`, no gameplay scripts, no build metadata, and no deployable build. Rebuilding missing game systems inside Unity would add overhead without restoring a runnable historical project.

## Target

- Local desktop browser.
- Mobile browser usability.
- Single-player only for the first playable Beta.
- No backend, login, multiplayer, online arena, or account system in this phase.

## Vertical Slice Scope

Main Menu -> Start Game -> Intro Scene -> Area 1 -> Dialogue -> Item/equipment pickup -> Basic battle -> Victory/defeat -> Save -> Load.

Use recovered Camelot Legends content. If a required detail is missing, mark it as a Beta design gap rather than inventing historical content.

## Implementation Order

1. Content loader.
2. Game state manager.
3. Scene/navigation engine.
4. Dialogue engine.
5. Inventory/equipment engine.
6. Combat engine.
7. Browser save/load.
8. Responsive mobile UI shell.
9. Asset optimization/conversion.
10. PWA/offline support.

## Flags

- `local browser` on desktop is straightforward with a dev server.
- `mobile local browser` usually means hosting from the desktop over LAN or deploying a local/static build; a phone's `localhost` is the phone, not the desktop.
- PWA install/offline service workers require secure origins, except localhost during development.
- Third-party CraftPix/Cratpix and Daz assets need licensing review before redistribution.
