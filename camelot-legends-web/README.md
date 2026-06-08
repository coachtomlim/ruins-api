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

## Build Static Demo

```powershell
& 'C:\Users\Thomas\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\build-static.mjs
```

The static build is written to `dist/`.

## Validate And Test

```powershell
& 'C:\Users\Thomas\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\validate-content.mjs
& 'C:\Users\Thomas\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\test-demo.mjs
```

## Phone Testing Over LAN

1. Start the server from this folder.
2. Find the desktop machine's LAN IP address.
3. On the phone, open `http://DESKTOP_LAN_IP:4173`.
4. Keep both devices on the same network.

Phone `localhost` points to the phone itself, not this desktop.

## Current Playable Loop

Start Level 1 -> Area 1 dialogue -> Area 2 road cache -> Area 3 armor recovery/equip -> optional survivor rally -> Area 4 castle approach scouting -> Area 5 Forgon scout battle -> victory rewards -> save/load.

The current build is still a reconstruction prototype, but the first route now has a title screen, objective gating, optional level beats, a mission journal, recovered archive visuals, rebuilt turn combat, a victory screen, and persistent single-player save/load.

## Mobile App Shell

The demo includes a web app manifest and service worker cache so the local browser build can be tested as an installable/offline-capable prototype on supported mobile browsers. The current service worker caches the demo shell, level data, recovered content JSON, and wired PNG assets.
