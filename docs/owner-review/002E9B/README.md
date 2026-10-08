# FRIEND FEEDBACK 002E9B — Owner acceptance corrections

## Local review steps

```
cd "C:\Users\Thomas\Documents\ChatGPT\Dungeon Builder\ruins-api"
node tools/flare-s8a-preview-server.mjs
```

Open `http://127.0.0.1:4178/quick-dungeon/flare-s8a/challenge.html?demo=1&from=cactus` (target 50%, Runner 100 HP / 12 ATK / 1 DEF) in a **new tab** (Builder Level is per tab).

1. CHOOSE A DUNGEON, press the right arrow: JUST RIGHT (Crossed Court) -> BRUTAL (Scattered Hall) -> TOO EASY (Pillar Court).
2. Pick BRUTAL, USE THIS DUNGEON, RUN THE HERO. The READY chips read Skeleton, Skeleton, Goblin, Spike Trap. Result: cleared at 27% HP, 24 Hero Gold.
3. Owner path: BRUTAL -> CUSTOMIZE - OPTIONAL (locked) -> BACK (lands on READY, not the chooser) -> BACK (chooser, BRUTAL still selected) -> USE THIS DUNGEON -> RUN. Same result.
4. After the first run, step through the journey to "Your kit just got bigger!": the button reads **Check out your new gizmos** and opens the real editor on the selected tab.
5. Browser back/forward: no cyan bar, no ceremony, no stale overlay at any point.
6. Fast-forward a run in the console after RUN THE HERO: `const s=__s8aRuntime.sim;while(s.status==='running')s.step();`

## What each Owner-visible chooser entry really does (target 50, through the real transition path)

| Chooser position | Dungeon | Encounter | Budget | Estimator | Actual | Status | Hero Gold | Kills | Traps fired |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TOO EASY | Pillar Court | Skeleton, Skeleton + Small Potion | 75 | 71.5 | **74%** | cleared | **18** | 2 | 0 |
| JUST RIGHT | Crossed Court | Skeleton, Skeleton, Goblin | 80 | 58.0 | 56% | cleared | 24 | 3 | 0 |
| BRUTAL | Scattered Hall | Skeleton, Skeleton, Goblin + Spike Trap | 100 | 36.3 | **27%** | cleared | 24 | 3 | 1 |

The Owner's reported 74% / 18 Hero Gold is exactly the TOO EASY encounter's result.

## 3 x 3 matrix (every chooser encounter on every starter room)

| Room | TOO EASY | JUST RIGHT | BRUTAL |
| --- | --- | --- | --- |
| Pillar Court | 74% / 18 Gold | 56% / 24 Gold | 27% / 24 Gold |
| Crossed Court | 74% / 18 Gold | 56% / 24 Gold | 27% / 24 Gold |
| Scattered Hall | 74% / 18 Gold | 56% / 24 Gold | 27% / 24 Gold |

Room geometry does not change the outcome with the current stationary-guard simulation; ordering holds in every room.

Screenshots: `01-brutal-chooser-target50.jpg`, `02-too-easy-chooser-target50.jpg`.
