# FRIEND FEEDBACK 002E9 — local Owner review

## Launch (local only, nothing deployed)

```
cd "C:\Users\Thomas\Documents\ChatGPT\Dungeon Builder\ruins-api"
node tools/flare-s8a-preview-server.mjs
```

Open on a phone-sized window (390 x 844 is what the screenshots use):

http://127.0.0.1:4178/quick-dungeon/flare-s8a/challenge.html?demo=1&from=Makidon

* Needs internet: Flare sprites, tiles and animations load from the pinned `flareteam/flare-game` commit, exactly as in production.
* `?demo=1` runs a local, un-shared challenge, so the result stays on the device ("Legacy challenge · result stays on this device").
* Builder Level 2 lives in `sessionStorage`. To see the Level 1 starter experience and the full reward journey again, open the link in a **new tab** (or clear site data and reload). A reload of the same tab keeps Level 2.
* The run plays in real time (~15 s). To skip ahead in the browser console after pressing RUN THE HERO:
  `const s=__s8aRuntime.sim;while(s.status==='running')s.step();`

## Screenshots (this folder)

| File | Shows |
| --- | --- |
| 11-level1-three-starter-shells | Level 1: single-dungeon chooser, 3 starter shells (Pillar Court / Crossed Court / Scattered Hall), no Broken Gallery |
| 12-level1-customization-locked | Level 1 customization locked (MONSTERS / TRAPS / SUPPORT / DUNGEONS) |
| 01-success | Reward journey 1 — SUCCESS |
| 02-performance | 2 — PERFORMANCE: real target, finish and difference; no percentile claim |
| 03-you-gained | 3 — YOU GAINED (Builder Gold) with the transparent Tactics coin |
| 04-friend-gained | 4 — YOUR FRIEND GAINED (separate Friend/Hero Gold) with the real Flare hero |
| 05-level-2-achievement | 5 — Level 2 hexagon, YOU / LEVELED / UP! |
| 06..09 | 6 — NEW GIZMOS: Monsters (Zombie, Skeleton Archer), Traps (Spike, Dart), Support (no new Support at Level 2), Dungeons (Broken Gallery) |
| 10-keep-progressing | 7 — account framing, session-only truth note |
| 13-customization-dungeons-tab | TRY OUT NEW GIZMOS → real EDIT DUNGEON, DUNGEONS tab incl. Broken Gallery |
| 14-customization-zombie-selected | Real editor, Zombie selected (reversed-background selected state) |
| 15-run-broken-gallery-zombie | A real run in Broken Gallery against a Zombie |
