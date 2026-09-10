# WEB-FLARE S3 HostGator handoff

S3 remains separate from the accepted S2 deployment.

## Frozen S2

Do not modify:

- source: `8cc57ddacfc2e12ac65b120496f1ee8915e4525b`
- public URL: `https://think-2-thrive.com/quick-dungeon/flare-s2/`

## S3 patch candidate

Deploy the S3 web files exactly from:

`3c1e62c82ab4277956c451ad8a396cea11b1f4a9`

Deployment helper:

`scripts/deploy/hostgator-flare-s3-deploy.py`

The helper is pinned to that source and writes only to:

- `public_html/quick-dungeon/flare-s3/`
- `public_html/q/`

It must not write to `flare-s2` or `flare-p0`.

## Fixes in this candidate

1. **WhatsApp-safe short player links**
   - challenge choices are encoded into a four-character checksummed code instead of a long JSON/base64 fragment
   - generated links are `https://think-2-thrive.com/q/XXXX`
   - `/q/XXXX` internally serves the S3 player shell while preserving the short URL in the browser
   - the player deterministically reconstructs the room, enemies, potion and target HP from the code

2. **Animated Flare runner**
   - S3 no longer uses the stance-only NPC knight as the hero
   - `actors.mjs` composes the stock Flare male avatar from `default_legs`, `default_feet`, `default_chest`, `default_hands`, `head_short` and `club`
   - the composite exposes real Flare `stance`, `run`, `swing`/attack, `hit` and `die` animation sequences
   - goblin and skeleton animations remain the existing stock Flare enemy animations

3. **Friend link activation**
   - player links no longer depend on a very long `#c=<json>` fragment
   - the friend invitation resolves the compact code first, rebuilds the challenge, loads the room and actor pack, then enables `RUN THE GAUNTLET`
   - direct demo URL remains supported

## Public URLs after deployment

Builder, prototype login `Buddy / Test`:

`https://think-2-thrive.com/quick-dungeon/flare-s3/`

Friend demo:

`https://think-2-thrive.com/quick-dungeon/flare-s3/play.html?demo=1&from=Buddy`

Generated friend links:

`https://think-2-thrive.com/q/XXXX`

The default balanced Pillar Court code currently resolves to a four-character route such as `/q/Rind`; builders generate the code automatically.

## Verification

Repository verification on the patch candidate:

- 37 tests
- 37 passed
- 0 failed
- collision-safe deterministic simulation unchanged
- compact-code round trip and checksum tests added
- short HostGator URL contract tested under 40 characters

After HostGator deployment, additionally verify:

- HTTPS
- HTML/CSS/MJS/JSON MIME
- `/q/XXXX` rewrite returns the player shell
- builder creates a short `/q/XXXX` link
- opening that link from WhatsApp enables `RUN THE GAUNTLET`
- visible hero run animation while moving
- visible hero attack animation in combat
- completed result state
- S2 comparison remains byte-for-byte unchanged
