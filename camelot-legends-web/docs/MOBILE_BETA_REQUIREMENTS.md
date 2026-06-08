# Mobile Beta Requirements

## Required

- Responsive layout from 360px wide upward.
- Touch-first controls; no keyboard dependency.
- Large tap targets, preferably 44px or larger.
- Start new game and load game from browser storage.
- Persistent save data in browser storage.
- One complete playable mission path.
- Basic offline asset strategy after the vertical slice works.

## Browser/Device Notes

- Desktop local testing can use `http://localhost`.
- Phone testing needs either the phone opening a LAN URL for the dev server or a static/PWA deployment.
- Service workers do not work from `file://`.
- PWA installability generally needs HTTPS, except local development exceptions.

## Out Of Scope For First Beta

- Multiplayer.
- Arena lobby.
- Backend.
- Login/accounts.
- Unity WebGL.
- Full 8-world campaign.
