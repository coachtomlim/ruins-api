# WEB-FLARE S4 HostGator Handoff

Deploy S4 as a new isolated line. Preserve S2 and S3 exactly.

## Frozen baselines

- S2 source: `8cc57ddacfc2e12ac65b120496f1ee8915e4525b`
- S3 source: `3c1e62c82ab4277956c451ad8a396cea11b1f4a9`

Do not write into `public_html/quick-dungeon/flare-s2/`, `public_html/quick-dungeon/flare-s3/`, or `public_html/quick-dungeon/flare-p0/`.

## S4 web source candidate

`e7e68972a01f2610667a675d5a9deccfcf80a97d`

Branch:

`work/web-flare-s4-game-system-001`

Deploy helper:

`scripts/deploy/hostgator-flare-s4-deploy.py`

The helper writes only to:

- `public_html/quick-dungeon/flare-s4/`
- `public_html/q/`

The `/q/XXXX` rewrite is intentionally repointed to the S4 player. S4 decodes both the new S4 v2 four-character code and legacy S3 v1 four-character codes.

## Public targets

Builder:

`https://think-2-thrive.com/quick-dungeon/flare-s4/`

Prototype login:

`Buddy / Test`

Default S4 player test:

`https://think-2-thrive.com/q/hiS4`

Known legacy S3 regression link:

`https://think-2-thrive.com/q/Rind`

## What S4 adds

- functional Level 1 runner model
- HP 100
- base ATK 8
- Wooden Club +4 ATK
- total ATK 12
- DEF 1
- Goblin DEF 1 and Skeleton DEF 2 affect actual damage
- advanced monster comparison cards show actual combat numbers
- optional Spike Trap costs 20, deals 8 raw physical damage once, and respects runner DEF
- trap choice is encoded inside the same four-character short URL
- player still uses the composed stock Flare avatar with run and swing/attack animations

## Required verification

Before returning PASS:

1. Run repository tests. Expected current total: 44 passing.
2. Deploy S4 only with the bounded deployer.
3. Verify Builder opens over HTTPS and `Buddy / Test` works.
4. Build the untouched Balanced default and confirm a four-character `/q/XXXX` link.
5. Open it and confirm player enables Run the Gauntlet.
6. Confirm runner visibly runs and visibly swings/attacks.
7. Build one challenge with Spike Trap enabled and confirm the short link still has exactly four code characters.
8. Confirm trap visibly appears and fires once, reducing HP by the governed physical-damage rule.
9. Confirm `https://think-2-thrive.com/q/Rind` still loads as a legacy S3 challenge.
10. Confirm HTML/CSS/MJS/JSON MIME checks pass.
11. Confirm S2 and S3 deployed files remain byte-for-byte unchanged.

Return:

`S4 TEST STATUS: PASS` or the precise blocker, plus Builder URL, one generated S4 short link, legacy S3 regression result, final run HP/gold/time, and deployed source SHA.
