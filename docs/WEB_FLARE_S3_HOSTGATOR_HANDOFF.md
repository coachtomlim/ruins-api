# WEB-FLARE S3 HostGator handoff

S3 is separate from the accepted S2 deployment.

## Frozen S2

Do not modify:

- source: `8cc57ddacfc2e12ac65b120496f1ee8915e4525b`
- public URL: `https://think-2-thrive.com/quick-dungeon/flare-s2/`

## S3 source candidate

Deploy only the S3 source snapshot:

`0bf18137de56ef7aacfc2f462b4537ded9c8fafc`

The deploy helper is:

`scripts/deploy/hostgator-flare-s3-deploy.py`

It writes only to:

`public_html/quick-dungeon/flare-s3/`

It reads the existing cPanel API token from `CPANEL_API_TOKEN` and refuses to write outside the S3 directory.

## Required public URLs

Builder entry with prototype login `Buddy / Test`:

`https://think-2-thrive.com/quick-dungeon/flare-s3/`

Friend/player demo entry:

`https://think-2-thrive.com/quick-dungeon/flare-s3/play.html?demo=1&from=Buddy`

Generated challenge links use:

`https://think-2-thrive.com/quick-dungeon/flare-s3/play.html?from=Buddy#c=<challenge-token>`

## Product split

Builder URL:

1. Prototype login
2. Meet the default Level 1 Warrior and optionally inspect HP / ATK / DEF
3. Choose one of three stock rooms with large left/right arrows or swipe
4. Accept the balanced default encounter or optionally customize
5. Create/share a separate player link

Player URL:

- no builder login
- friend-facing invitation from the builder
- runner/room/target summary with optional stats
- one primary `RUN THE GAUNTLET` action
- autonomous collision-aware Flare run
- result, replay, share, and optional `BUILD YOUR OWN`

## Visual direction

Reference-inspired rather than copied: deep plum/purple background, rose accents, teal primary actions, warm-gold circular arrows, cream text, rounded mobile panels. Avoid long vertical scrolling; use screen-to-screen transitions and swipe/arrow room selection.

## Verification

Current S3 source passed 34/34 repository tests in the final build candidate. The HostGator deployer must additionally verify HTTPS and MIME for HTML, CSS, MJS and JSON before reporting `TEST PASS`.
