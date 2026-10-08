# FRIEND FEEDBACK 002E9C — Owner-approved V12 (local review)

```
cd "C:\Users\Thomas\Documents\ChatGPT\Dungeon Builder\ruins-api"
node tools/flare-s8a-preview-server.mjs
```

Open `http://127.0.0.1:4178/quick-dungeon/flare-s8a/challenge.html?demo=1&from=Makidon` at about 390 x 844 in a **new tab** (Builder Level is per tab; Flare art for the run loads from the pinned Flare commit, the journey art is packaged locally).

1. CHOOSE A DUNGEON, press the right arrow: JUST NICE (Crossed Court) -> BRUTAL (Scattered Hall) -> EASY (Pillar Court).
2. USE THIS DUNGEON: READY shows the static target triangle, the green estimate circle and "ESTIMATED FINISH" below it. The summary line reads "Scattered Hall · BRUTAL / 5 monsters · Level 1".
3. RUN THE HERO (OVERVIEW button shows all five monsters). To skip ahead in the console: `const s=__s8aRuntime.sim;while(s.status==='running')s.step();`
4. Journey: ... Level 2 -> New Gizmos overview -> tap any card (or "Check out your new gizmos") -> Monsters / Traps / Support / Dungeon -> final loot page -> keep progressing.

## Level 1 presets through the real runtime (default Runner 100 HP / 12 ATK / 1 DEF, target 50)

| Preset | Dungeon | Composition | Estimator | Actual | Status | Hero Gold |
| --- | --- | --- | --- | --- | --- | --- |
| EASY | Pillar Court | Skeleton, Goblin | 76% | **74%** | cleared | 15 |
| JUST NICE | Crossed Court | Skeleton, Goblin, Skeleton | 58% | **56%** | cleared | 24 |
| BRUTAL | Scattered Hall | Goblin x2, Skeleton x3 (nominal cost 130) | 34% | **30%** | cleared (5/5 killed) | 39 |

EASY 74 > JUST NICE 56 > BRUTAL 30. Nothing was tuned to hit a target; BRUTAL does not defeat the Runner at the default stats.

## Screenshots

`01` chooser BRUTAL, `02` READY, `03` five monsters (overview camera), `04` New Gizmos overview incl. Support card, `05` monster loot, `06` trap loot, `07` Support empty state, `08` NEW DUNGEON Broken Gallery (confetti), `09` final loot page.
