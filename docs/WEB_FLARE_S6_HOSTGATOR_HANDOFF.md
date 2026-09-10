# WEB-FLARE S6 HostGator Handoff

Deploy S6 as a new isolated line. Preserve S2, S3, S4 and S5 exactly.

## Frozen prior baselines

- S2: `8cc57ddacfc2e12ac65b120496f1ee8915e4525b`
- S3: `3c1e62c82ab4277956c451ad8a396cea11b1f4a9`
- S4: `a038c163530ae55ab8d6a158591443c84ebe8dde`
- S5: `ecbbb4f10c2fbfab992c0bf77cdb9ac996333c3e`

Do not write into any prior `flare-s*` directory. Do not alter `/q/` or `/g/`.

## S6 source

Deploy web source exactly:

`490e21b8cfe358fb96b933705d3b4206840a9305`

Branch:

`work/web-flare-s6-calibration-001`

Deployer:

`scripts/deploy/hostgator-flare-s6-deploy.py`

It writes only:

- `public_html/quick-dungeon/flare-s6/`
- `public_html/h/`

## Public targets

Builder:

`https://think-2-thrive.com/quick-dungeon/flare-s6/`

Prototype login:

`Buddy / Test`

Level 3 Tough Warrior / 60% target regression invite:

`https://think-2-thrive.com/h/UvVY`

## What must be visible

Sender:

- chooses runner
- chooses target HP
- cannot choose room, monsters, potion or trap
- can send invite or play it themselves

Receiver opening:

- explains Choose a room
- explains Build the danger with 100 gold
- explains Run the gauntlet and scoring
- states that difficulty guidance does not reveal or guarantee the result

Receiver build:

- calibrated starting setup is preloaded
- Easy / Fair / Brutal guidance is visible
- room remains receiver choice
- manual presets/customization still work
- S6 Spike Trap is 30 raw physical damage, 20 gold, one use

## Required gate

1. Run the full repository suite. Expected: 59 passing at source `490e21b...`.
2. Deploy only with the bounded S6 deployer.
3. Verify Builder HTTPS, CSS/MJS/JSON MIME and `Buddy / Test` login.
4. Generate a four-character `/h/XXXX` invite.
5. Open `/h/UvVY` and verify no `/h/` asset-resolution 404s.
6. Confirm opening instructions before room choice.
7. Confirm three rooms and arrow/swipe choice.
8. Confirm calibrated starting encounter for Level 3 / 60% uses 100 gold rather than the S5 65-gold default.
9. Run it and confirm visible running, swing/attack, damage, trap trigger and score.
10. Record finishing HP percentage, score, gold and time.
11. Verify `/g/MsJ9`, `/q/hiS4`, and `/q/Rind` still work.
12. Run prior deployment fingerprints and confirm S2-S5 are byte-for-byte unchanged.

Return `S6 TEST STATUS: PASS` only if the whole gate passes. Otherwise return the exact blocker.
