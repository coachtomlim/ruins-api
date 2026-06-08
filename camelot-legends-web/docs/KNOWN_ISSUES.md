# Known Issues

## Runtime

- Only Level 1 is implemented.
- Combat is playable but still provisional.
- Enemy stats and formulas are rebuilt, not recovered.
- Route graph is handcrafted from recovered episode records.
- Save/load is local-only.

## Content

- Survivor and scout approach dialogue are authored reconstruction.
- Exact recovered dialogue sequencing is incomplete.
- `Castle Survivor` is a role-based NPC, not a recovered named character record.
- Level 2 is not implemented.

## Assets

- Only two recovered PNG assets are currently wired.
- No dedicated survivor, scout approach, item icon, or enemy sprite assets are wired yet.
- Many archive assets still require conversion, optimization, naming, and review.

## Mobile/PWA

- Manual phone-over-LAN testing remains pending.
- Service worker cache can serve stale files if `CACHE_NAME` is not bumped after runtime changes.
- `file://` cannot be used for service worker/offline testing.
- SVG app icon may not satisfy all mobile install surfaces.

## Tooling

- The app remains dependency-free because `npm` is unavailable in this environment.
- Vite/React/TypeScript migration is deferred until the vertical slice is stable and package installation is available.
