# WEB-FLARE S7 HostGator Handoff

Prepared only. Do not deploy as part of WEB-FLARE-S7B-CONTENT-VARIETY-001.

## Frozen source and boundaries

- S7 web source: `4ca60cab1d14b8f7cc98087c49a72ad132310942`
- Branch: `work/web-flare-s7-content-variety-001`
- Flare stock source: v1.15 / `2ef474f5f5f368628bc526f9e56f936dac743e49`
- Builder: `https://think-2-thrive.com/quick-dungeon/flare-s7/`
- Short receiver route: `https://think-2-thrive.com/j/XXXX`
- Level 3 Tough Warrior / 60% regression invite: `https://think-2-thrive.com/j/UvVY`

The bounded helper is `scripts/deploy/hostgator-flare-s7-deploy.py`. It accepts only `auth`, `probe`, or `deploy`. Its only writable cPanel roots are:

- `public_html/quick-dungeon/flare-s7`
- `public_html/j`

It cannot write to S2-S6 or `/q`, `/g`, `/h`. Those releases are checked through pinned public fingerprints before and after S7 deployment.

## Frozen prior baselines

- S2: `8cc57ddacfc2e12ac65b120496f1ee8915e4525b`
- S3: `3c1e62c82ab4277956c451ad8a396cea11b1f4a9`
- S4: `a038c163530ae55ab8d6a158591443c84ebe8dde`
- S5: `ecbbb4f10c2fbfab992c0bf77cdb9ac996333c3e`
- S6: `490e21b8cfe358fb96b933705d3b4206840a9305`

## Execution sequence

With `CPANEL_API_TOKEN` present only in the local process environment:

```powershell
python .\scripts\deploy\hostgator-flare-s7-deploy.py auth
python .\scripts\deploy\hostgator-flare-s7-deploy.py probe
python .\scripts\deploy\hostgator-flare-s7-deploy.py deploy
Remove-Item Env:\CPANEL_API_TOKEN
```

`probe` is read-only. `deploy` creates or overwrites only the two S7 roots above.

## Required live gate

1. Confirm the repository suite reports 75 passing tests and `node tools/flare-s7-verify.mjs` reports all six stock rooms and both stock actors PASS.
2. Confirm the Builder remains `Buddy / Test`, selects only runner and target, and produces a four-character `/j/XXXX` link.
3. Confirm receiver opening instructions precede the six-room arrow/swipe selector and the 100-gold build step.
4. Confirm the calibrated basic setup is immediately runnable and Easy / Fair / Brutal remain coarse guidance.
5. Confirm customization exposes four monsters, two traps, and three supports with readable costs.
6. Confirm the runner visibly runs and swings; Goblin Elite and Antlion use real stock stance/run/swing/hit/die frames.
7. Confirm Spike Trap is 30 raw physical damage with DEF applied, Dart Trap deals 16 ignoring DEF, and both are one use at distinct route positions.
8. Confirm Small Potion heals 10, Battle Tonic adds 2 ATK, Iron Tonic adds 2 DEF, and each effect changes the simulation for the rest of the run as applicable.
9. Confirm finish percentage, score, gold and time are visible.
10. Confirm `/j/UvVY` remains materially close to 60% for Level 3 Tough Warrior.
11. Confirm `/q/hiS4`, `/q/Rind`, `/g/MsJ9`, `/h/UvVY`, and pinned S2-S6 fingerprints are unchanged.

Return `S7 TEST STATUS: PASS` only after this complete live gate. Otherwise return the exact blocker.
