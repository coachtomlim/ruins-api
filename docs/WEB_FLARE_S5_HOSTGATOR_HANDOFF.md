# WEB-FLARE S5 HostGator Handoff

Deploy S5 as a new isolated role-corrected line. Preserve S2, S3, and S4 exactly.

## Frozen accepted baselines

- S2: `8cc57ddacfc2e12ac65b120496f1ee8915e4525b`
- S3: `3c1e62c82ab4277956c451ad8a396cea11b1f4a9`
- S4 public baseline: `a038c163530ae55ab8d6a158591443c84ebe8dde`

Do not write into any existing `flare-s2`, `flare-s3`, `flare-s4`, `flare-p0`, or `/q/` path.

## S5 web source

`ecbbb4f10c2fbfab992c0bf77cdb9ac996333c3e`

Branch:

`work/web-flare-s5-role-correction-001`

Deploy helper:

`scripts/deploy/hostgator-flare-s5-deploy.py`

It writes only to:

- `public_html/quick-dungeon/flare-s5/`
- `public_html/g/`

`/g/XXXX` is a new S5 invitation route. Existing `/q/XXXX` remains untouched.

## Public targets

Builder:

`https://think-2-thrive.com/quick-dungeon/flare-s5/`

Prototype login:

`Buddy / Test`

Default receiver invitation:

`https://think-2-thrive.com/g/Ilyj`

## Corrected game roles

Sender chooses:

- runner;
- target finishing HP percentage.

Receiver chooses:

- room;
- monsters;
- potion;
- Spike Trap;
- then runs the autonomous hero.

The opening receiver screen must visibly explain the game before the receiver accepts:

1. Choose a room.
2. Build the danger with up to 100 gold. Balanced defaults are ready.
3. Run the gauntlet. Score is based on closeness to the target finishing HP.

The novice path must remain:

`ACCEPT CHALLENGE → USE THIS ROOM → RUN THE GAUNTLET`

## Required live verification

Before returning PASS:

1. Run repository tests. Expected current total: **52 passing**.
2. Deploy only the pinned S5 web source with the bounded S5 deployer.
3. Verify Builder loads over HTTPS and `Buddy / Test` works.
4. Confirm Builder can switch among Level 1, Level 2, and Level 3 runner choices.
5. Confirm Builder sets target and creates a four-character `/g/XXXX` link.
6. Confirm Builder has no room, monster, potion, or trap controls.
7. Open generated `/g/XXXX` and confirm the first screen clearly gives the challenge goal and the three-step instructions before `ACCEPT CHALLENGE`.
8. Confirm runner details and optional stats match the sender choice.
9. Confirm receiver can choose one of three rooms.
10. Confirm Balanced defaults are loaded and receiver can reach runtime in exactly three primary touches from the invitation opening screen.
11. Confirm receiver can optionally change monsters, potion, and Spike Trap while respecting the 100-gold budget.
12. Confirm runner visibly runs and visibly swings/attacks.
13. Confirm Spike Trap remains visible and functional when selected.
14. Confirm score is based on finishing HP percentage, including one Level 2 or Level 3 test where max HP exceeds 100.
15. Confirm `PLAY IT MYSELF` from the sender builder opens the same receiver challenge flow.
16. Confirm `/q/hiS4` still works.
17. Confirm `/q/Rind` still works.
18. Confirm HTML/CSS/MJS/JSON MIME checks pass.
19. Confirm accepted S2/S3/S4 deployed fingerprints remain byte-for-byte unchanged.

Return:

`S5 TEST STATUS: PASS` or the exact blocker, plus:

- Builder URL
- one generated `/g/XXXX` receiver URL
- chosen runner and target
- final run HP percentage / score / gold / time
- `/q/hiS4` regression result
- `/q/Rind` regression result
- deployed S5 source SHA
