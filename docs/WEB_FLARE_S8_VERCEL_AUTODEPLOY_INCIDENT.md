# WEB-FLARE S8 Vercel Auto-Deploy Incident

Status: CLOSED for branch `work/web-flare-s8a-rewards-replay-001`.

## What happened

The Vercel project `ruins-api` is GitHub-linked to `coachtomlim/ruins-api`. Every GitHub commit on the S8 branch was therefore creating a Vercel preview deployment automatically. Because S8 background preparation was intentionally checkpointed frequently, this produced many failed-deployment emails.

The failures were not evidence that the S8 planning changes had broken the accepted HostGator runtime.

## Verified failure cause

The latest Vercel build ran 124 Node tests and reported 123 pass / 1 fail. The single failure was the inherited S7.1 frozen-file test invoking:

`git diff --quiet 4ca60cab1d14b8f7cc98087c49a72ad132310942 ...`

Vercel's checkout did not contain that historical commit object and returned:

`fatal: bad object 4ca60cab1d14b8f7cc98087c49a72ad132310942`

This is a shallow/history-availability problem in the Vercel build environment, not a demonstrated S7.1 or S8 product regression.

## Stop action

The branch `vercel.json` was changed to include:

```json
"git": {
  "deploymentEnabled": false
}
```

Stop commit:

`26c48ddefff2000b19db4035ab2c71282bbe20c5`

Vercel deployment listing was checked after subsequent GitHub commits and showed no new deployment beyond the pre-stop failed deployment. Automatic Vercel deployments are therefore disabled for this branch.

## Operating rule

- Do not re-enable Vercel Git deployment during S8 work.
- Do not use Vercel as an S8 test/deployment surface.
- Keep S8 test execution in the normal repository/Codex environment with full required Git history.
- Public deployment authority remains the later bounded HostGator one-pass process.
- If the project-level Git integration is ever changed globally, that is a separate Owner-authorized operation.
