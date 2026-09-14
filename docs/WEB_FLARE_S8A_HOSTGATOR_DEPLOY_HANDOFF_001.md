# WEB-FLARE S8A HostGator Deployment Handoff 001

## Authority

Accepted S8A web source SHA:

`6962696b84f44e7d15bafb770ade92d8eb0ea42b`

Canonical S8A branch:

`work/web-flare-s8a-rewards-replay-001`

Deployment-preparation branch:

`deploy/web-flare-s8a-hostgator-001`

The deployment-preparation branch may contain helper/docs commits after the accepted web SHA. The public web payload is always read from the pinned source SHA above.

## Public target

Builder:

`https://think-2-thrive.com/quick-dungeon/flare-s8a/`

Receiver regression:

`https://think-2-thrive.com/m/UvVY?from=Tom`

The `/m/XXXX` route rewrites to `/quick-dungeon/flare-s8a/challenge.html`. The four-character code still carries Runner + target only.

## Writable HostGator roots

Only these roots may be created or changed:

- `public_html/quick-dungeon/flare-s8a`
- `public_html/m`

No S2-S7.1 release root and no `/q`, `/g`, `/h`, `/j`, `/k` route may be edited.

## Prepared helper

Use:

`scripts/deploy/hostgator-flare-s8a-deploy.py`

The helper:

- pins web content to `6962696b84f44e7d15bafb770ade92d8eb0ea42b`;
- enumerates the complete `public/flare-s8a` tree from that commit;
- refuses non-text files rather than silently corrupting them;
- writes only the two authorized HostGator roots;
- creates explicit MIME mappings for `.html`, `.css`, `.js`, `.mjs`, `.json`;
- installs the isolated `/m/XXXX` rewrite;
- fingerprints representative S2-S7.1 release files before and after deployment;
- verifies `/q`, `/g`, `/h`, `/j`, `/k` smoke routes before and after deployment;
- additionally fingerprints the P0/S7/S7.1 files used directly by S8A at runtime;
- checks live S8A HTTPS/MIME/content markers immediately after writing.

## Pre-deployment commands

The cPanel API token must exist only for the deployment window.

PowerShell shape:

```powershell
$env:CPANEL_API_TOKEN = '<temporary token>'
python .\scripts\deploy\hostgator-flare-s8a-deploy.py auth
python .\scripts\deploy\hostgator-flare-s8a-deploy.py probe
```

`auth` must print `AUTH PASS`.

`probe` must print both:

- `S2-S7.1, /q /g /h /j /k, AND S8A DEPENDENCIES: FINGERPRINT PASS`
- `PROBE PASS`

If `probe` blocks, do not deploy.

## One-pass deployment

Only after `auth` and `probe` pass:

```powershell
python .\scripts\deploy\hostgator-flare-s8a-deploy.py deploy
```

Required helper result:

- `TEST PASS`
- `S8A SOURCE: 6962696b84f44e7d15bafb770ade92d8eb0ea42b`
- Builder URL reported correctly
- `/m/UvVY?from=Tom` reported correctly
- `S2-S7.1 AND /q /g /h /j /k: PRESERVED`

Do not run a second deployment merely to chase a visual/source issue. A source defect requires a Git fix, new accepted web SHA, and a separately authorized deployment pass.

## Live browser acceptance

After the helper returns PASS, run the already-accepted browser gate against the public origin:

PowerShell:

```powershell
$env:S8A_ORIGIN = 'https://think-2-thrive.com'
node .\tools\flare-s8a-browser-gate.mjs
Remove-Item Env:\S8A_ORIGIN -ErrorAction SilentlyContinue
```

The public browser gate must pass at:

- 360x800
- 390x844
- 430x932

It must reconfirm:

- invitation and mission without document scrolling;
- dominant `~60% HP` target;
- clear-not-kill instruction;
- visible Gold incentive;
- novice no-customization path;
- one customization category at a time;
- 100-point Dungeon Budget;
- primary action height >= 44px;
- Overview vs FOLLOW HERO material geometry change;
- real Hero run/attack animation states;
- deterministic Run Again;
- Edit This Dungeon preservation;
- L3/60 clear near 60.8% HP;
- score near 98.33;
- Hero Gold 24;
- Builder Gold 20;
- registration gate disabled/memory-only;
- no console errors or route/asset 404s.

## Manual public smoke checks

Confirm directly:

- `https://think-2-thrive.com/quick-dungeon/flare-s8a/`
- `https://think-2-thrive.com/m/UvVY?from=Tom`
- one known URL from each legacy route: `/q`, `/g`, `/h`, `/j`, `/k`

No Vercel URL is part of acceptance.

## Credential cleanup

Immediately after the live gate:

```powershell
Remove-Item Env:\CPANEL_API_TOKEN -ErrorAction SilentlyContinue
```

Revoke the temporary cPanel token if the deployment workflow issued a disposable token. Do not persist it in Git, Drive, shell profiles, scripts, logs or chat.

## Rollback boundary

If HostGator write succeeds but live acceptance fails because the deployed files themselves are unusable, rollback is restricted to removing the two new S8A roots only:

- `public_html/quick-dungeon/flare-s8a`
- `public_html/m`

Do not touch any predecessor release/route during rollback.

If the failure is merely a source/UI defect while S8A is otherwise safely isolated, stop and return the failure evidence before deciding whether rollback is necessary.

## Vercel prohibition

Do not inspect, configure, deploy, rebuild or re-enable Vercel as part of this deployment.

## Return contract

Return one of:

`S8A HOSTGATOR DEPLOY: PASS`

`S8A HOSTGATOR DEPLOY: BLOCKED:<reason>`

`S8A HOSTGATOR DEPLOY: ROLLED_BACK:<reason>`

For PASS include:

- deployed source SHA;
- Builder URL;
- Receiver URL;
- helper auth/probe/deploy result;
- public browser-gate result;
- three viewport results;
- L3/60 HP/score/Hero Gold/Builder Gold;
- Overview/FOLLOW HERO proof;
- predecessor fingerprint status;
- `/q /g /h /j /k` preservation status;
- cPanel token cleanup confirmation;
- Vercel untouched confirmation.
