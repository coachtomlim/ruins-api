# WEB-FLARE S7.1 HostGator Handoff

Prepared only. Do not deploy as part of `WEB-FLARE-S71-ONBOARDING-001`.

## Frozen source and boundaries

- Recommended S7.1 web source: `c4834520570adc72b02e50aa6a0f2a764030989c`
- Branch: `work/web-flare-s71-onboarding-001`
- Accepted S7 source remains: `4ca60cab1d14b8f7cc98087c49a72ad132310942`
- Builder: `https://think-2-thrive.com/quick-dungeon/flare-s71/`
- Short receiver route: `https://think-2-thrive.com/k/XXXX`
- Level 3 Tough Warrior / 60% regression invite: `https://think-2-thrive.com/k/UvVY`

The bounded helper is `scripts/deploy/hostgator-flare-s71-deploy.py`. It accepts only `auth`, `probe`, or `deploy`. Its only writable cPanel roots are:

- `public_html/quick-dungeon/flare-s71`
- `public_html/k`

It cannot write to S2-S7 or `/q`, `/g`, `/h`, `/j`. Those releases and routes are checked through pinned public fingerprints before and after S7.1 deployment.

## Execution sequence

With `CPANEL_API_TOKEN` present only in the local process environment:

```powershell
python .\scripts\deploy\hostgator-flare-s71-deploy.py auth
python .\scripts\deploy\hostgator-flare-s71-deploy.py probe
python .\scripts\deploy\hostgator-flare-s71-deploy.py deploy
Remove-Item Env:\CPANEL_API_TOKEN
```

`probe` is read-only. `deploy` creates or overwrites only the two S7.1 roots above.

## Required live gate

1. Confirm all 86 tests pass and the complete Flare asset build passes.
2. Confirm the Builder remains `Buddy / Test`, chooses runner and target only, and produces a four-character `/k/XXXX` link.
3. Confirm Screen 1 is the `DUNGEON RUNNER` invitation with the exact approved copy, safe sender, runner identity and target.
4. Confirm Screen 1 displays the real composed stock-Flare warrior stance animation; reduced motion must hold a stable stance frame.
5. Confirm acceptance starts no simulation and reveals the three-step hierarchy with `CUSTOMIZE THE DANGER — OPTIONAL` visibly emphasized.
6. Confirm the no-customization path works: Accept Challenge → Choose Dungeon → Run.
7. Confirm all S7 rooms, monsters, traps, supports, 100-gold budget, calibrated defaults, difficulty cues, scoring, Pause/Resume and Overview remain unchanged.
8. Confirm `/k/UvVY` finishes materially close to 60% for the Level 3 Tough Warrior.
9. Confirm `/q/hiS4`, `/q/Rind`, `/g/MsJ9`, `/h/UvVY`, `/j/UvVY`, and pinned S2-S7 fingerprints are unchanged.

Return `S7.1 TEST STATUS: PASS` only after this complete live gate. Otherwise return the exact blocker.
