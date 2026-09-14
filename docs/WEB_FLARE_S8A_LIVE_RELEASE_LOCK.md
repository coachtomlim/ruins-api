# WEB-FLARE S8A Live Release Lock

Accepted live release authority for WEB-FLARE S8A.

## Live source

- repository: `coachtomlim/ruins-api`
- canonical branch: `work/web-flare-s8a-rewards-replay-001`
- deployed web SHA: `6962696b84f44e7d15bafb770ade92d8eb0ea42b`
- builder: `https://think-2-thrive.com/quick-dungeon/flare-s8a/`
- receiver regression: `https://think-2-thrive.com/m/UvVY?from=Tom`

## Acceptance evidence

- focused S8A preflight: 222/222 PASS
- final complete suite: 308/308 PASS
- mobile: 360x800, 390x844, 430x932 PASS
- Level 3 / 60 target: 60.8% HP, score 98.33
- Hero Gold: 24
- Builder Gold: 20
- Overview / Follow Hero: material camera change verified
- hero stance/run/attack states verified
- Club + Wooden Shield visual composition verified
- S2-S7.1 fingerprints PASS
- `/q`, `/g`, `/h`, `/j`, `/k` preserved
- console errors/404s: 0 / 0
- Vercel untouched

## Freeze rule

S8A is now a live frozen predecessor. S8B account/progression work must not mutate the live S8A source in place. Any S8B work begins on a new branch from the accepted S8A authority and uses new isolated account/persistence surfaces.

## Deployment provenance

The one-pass HostGator deployment used the accepted S8A web SHA above. Temporary cPanel credentials were revoked after deployment and the deployment worktree was left clean.
