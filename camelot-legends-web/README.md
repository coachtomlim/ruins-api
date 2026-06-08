# Camelot Legends Web

Non-Unity, web-first single-player rebuild workspace for Camelot Legends.

The historical archive is treated as read-only source material. The current playable demo is a dependency-free browser app because this environment has `node.exe` but no `npm`.

## Run Locally

From this folder:

```powershell
& 'C:\Users\Thomas\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\serve-static.mjs
```

Then open:

```text
http://localhost:4173
```

The server binds to `0.0.0.0`, so it can also be reached from another device on the same network if Windows Firewall and network settings allow it.

## Build Static Demo

```powershell
& 'C:\Users\Thomas\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\build-static.mjs
```

The static build is written to `dist/`.

## Validate And Test

```powershell
& 'C:\Users\Thomas\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\validate-content.mjs
& 'C:\Users\Thomas\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\test-demo.mjs
& 'C:\Users\Thomas\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\build-static.mjs
& 'C:\Users\Thomas\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\verify-demo.mjs
& 'C:\Users\Thomas\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\verify-visual-slice.mjs
```

## Phone Testing Over LAN

1. Start the server from this folder.
2. Find the desktop machine's LAN IP address:

```powershell
ipconfig
```

Look for the active Wi-Fi or Ethernet adapter's `IPv4 Address`.

3. On the phone, open `http://DESKTOP_LAN_IP:4173`.
4. Keep both devices on the same network.

Phone `localhost` points to the phone itself, not this desktop.

Service worker and PWA notes:

- `file://` will not support service workers or offline mode.
- Service workers require `localhost`, HTTPS, or a trusted local development context.
- Mobile testing requires LAN hosting, a static deployment, or a packaged install.
- If stale content appears, clear site data for the host or bump `CACHE_NAME` in `service-worker.js`.

## Current Playable Loop

Start Level 1 -> Area 1 speaker-labelled dialogue -> visual map scenes -> Area 2 road cache -> Area 3 armor recovery/equip -> authored survivor choice -> Area 4 authored scout choice -> Area 5 Forgon Scout visual battle -> victory summary -> save/load.

The current build is still a reconstruction prototype, but the first route now has a title screen, objective gating, optional level beats, a mission journal, recovered map/party/enemy/battle visuals, rebuilt turn combat, a victory screen, and persistent single-player save/load.

## Mobile App Shell

The demo includes a web app manifest and service worker cache so the local browser build can be tested as an installable/offline-capable prototype on supported mobile browsers. The current service worker caches the demo shell, level data, recovered content JSON, and wired PNG assets.

## Manual Visual QA Checklist

1. Start the local server.
2. Open `http://localhost:4173` in a desktop browser.
3. Start Level 1.
4. Confirm a recovered map scene appears.
5. Confirm the party visual appears on the scene.
6. Open dialogue and confirm speaker labels appear.
7. Continue to area 003 and confirm survivor marker appears.
8. Continue to area 004 and confirm scout/enemy marker appears.
9. Enter battle and confirm battle background appears.
10. Confirm Forgon visual appears.
11. Confirm party visual appears in battle.
12. Complete battle and confirm victory visual appears.
13. Test save/load before and after battle.
14. Repeat over LAN on a phone.
