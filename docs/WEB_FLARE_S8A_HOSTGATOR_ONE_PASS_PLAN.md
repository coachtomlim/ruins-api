# WEB-FLARE S8A HostGator One-Pass Deployment Plan

Planning only. Do not execute as part of S8A implementation.

## Preconditions

- one exact deployable S8A web SHA selected;
- complete repository/test/browser gate PASS;
- predecessor freeze PASS;
- S8A audit accepted;
- Owner explicitly authorizes deployment;
- cPanel token available only for the deployment window.

## Allowed public roots

Expected isolated roots:

- `public_html/quick-dungeon/flare-s8a`
- `public_html/m`

No other public root is writable by the S8A deploy helper.

## Protected public releases/routes

Fingerprint before and after deployment:

- S2-S7.1 release roots;
- `/q`;
- `/g`;
- `/h`;
- `/j`;
- `/k`.

A mismatch is a hard BLOCK.

## Execution shape

One controlled pass only:

1. `auth` proves cPanel API access without mutation.
2. `probe` performs read-only predecessor/public checks.
3. `deploy` writes only S8A roots from the authorized SHA.
4. live MIME/HTTPS checks run immediately.
5. complete mobile/browser acceptance runs against public S8A.
6. predecessor fingerprints run again.
7. token is revoked and local credential bridge cleared.

Do not repeatedly redeploy to chase UI issues. If live acceptance fails for a source defect, stop, fix on Git, select a new audited source SHA, then authorize a new one-pass deployment separately.

## Required live URLs after deployment

- Builder: `https://think-2-thrive.com/quick-dungeon/flare-s8a/`
- Receiver regression: expected isolated `/m/XXXX` route using the accepted Level 3 / 60% code.

## Live acceptance focus

In addition to HTTP/MIME and regression checks, validate on portrait phone size:

- mission meaning is immediately clear;
- target is visually dominant;
- reward incentive is visible;
- no-scroll novice path works;
- customization is panel-based;
- Overview and Follow Hero visibly change camera composition;
- reward ownership is clear;
- registration gate never routes to Buddy/Test.

## Vercel prohibition

Do not open, configure, deploy, rebuild, inspect through deployment tooling, or alter Vercel as part of S8A. HostGator remains the authorized public path.
