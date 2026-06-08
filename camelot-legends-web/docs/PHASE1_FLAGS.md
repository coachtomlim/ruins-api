# Phase 1 Flags

These are the parts of the rebuild brief that need caution or later confirmation.

## Mobile Local Browser

`localhost` on a phone means the phone itself, not the development machine. Mobile testing needs a LAN URL, a static deployment, or a packaged local install path.

## PWA Offline/Install

Service workers do not run from `file://`. Installable/offline PWA behavior usually requires HTTPS, with localhost exceptions during development.

## Browser Storage

`localStorage` is fine for tiny settings or a simple save slot, but it is synchronous and limited. Use IndexedDB for structured saves, content cache metadata, and anything that may grow.

## React First

React-first is sensible for a screen-based RPG/story/battle prototype. If the first Beta requires grid tactics, heavy animation timing, or canvas-based sprite combat, Phaser or a canvas layer may need to arrive earlier than planned.

## Asset Rights

CraftPix/Cratpix and Daz-derived assets need licensing review before redistribution. Keep them as internal reconstruction sources until rights are confirmed.

## Unity As Asset Source

The earlier audit did not find a Unity editor command on PATH, and the Unity archive is incomplete. Unity should remain optional for asset inspection/export, not a required runtime dependency.

## Dependency Versions

The Vite/React dependency ranges in `package.json` are Phase 2 starting points. They have not been installed or locked yet.
