# WEB-FLARE S8 Release and Rollback Contract

## Principle

S8A remains additive until live acceptance. Existing S2-S7.1 releases and routes stay frozen.

## Proposed S8A live targets

- builder: `/quick-dungeon/flare-s8a/`
- receiver: `/m/XXXX`

Do not repoint `/k/XXXX` or replace S7.1 in place during initial S8A acceptance.

## Deployment gate

Before deployment:

1. exact deployable web SHA selected;
2. complete suite and focused browser matrix pass;
3. S2-S7.1 diff is empty;
4. deploy helper write roots are restricted to S8A targets only;
5. existing public route fingerprints pass.

After deployment:

1. verify HTML/JS/CSS/assets return correct MIME over HTTPS;
2. execute phone journey including mission comprehension, optional customization, Overview/FOLLOW HERO, rewards and registration screen;
3. verify `/q`, `/g`, `/h`, `/j`, `/k` remain unchanged;
4. verify S7.1 remains directly usable as rollback baseline.

## Rollback

If S8A live gate fails:

- do not alter older routes;
- remove or quarantine only S8A deployment roots if necessary;
- continue directing testers to accepted S7.1 `/k/` route;
- fix S8A on its branch and redeploy only after a new frozen source SHA is accepted.

Rollback does not require overwriting S7.1 because S8A is isolated.

## Account feature rollout

S8B account/backend functionality must have its own feature gate. The registration screen may exist before backend activation, but it must never imply an account or assets were saved unless the authoritative backend transaction succeeded.
