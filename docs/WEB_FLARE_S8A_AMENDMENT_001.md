# WEB-FLARE S8A Amendment 001

This amendment applies to `WEB-FLARE-S8A-REWARDS-REPLAY-001` on branch `work/web-flare-s8a-rewards-replay-001` and supersedes conflicting wording in `docs/WEB_FLARE_S8A_REWARDS_REPLAY_WORK_ORDER.md`.

## 1. Fix OVERVIEW in S8A

The accepted S7.1 runtime exposes an `OVERVIEW` control, but Owner reports that its effect is not working/visible in the live player runtime.

S8A must fix this additively without mutating frozen S7.1 files.

Required behavior:

- tapping `OVERVIEW` must visibly switch the runtime camera to a whole-dungeon/full-room overview;
- while overview is active, the control must visibly indicate the state and read `FOLLOW HERO`;
- tapping `FOLLOW HERO` must restore the normal hero-follow camera;
- the toggle must work while the simulation is running and while paused;
- camera mode is presentation-only and must never change deterministic simulation results;
- if the inherited renderer behavior is the source of the problem, override or wrap it in S8A rather than editing S7.1 or earlier renderer files.

Add a focused browser test that proves a measurable camera/viewport state change in both directions rather than testing only the boolean flag or button click.

## 2. Replace ambiguous REBUILD wording

Do not show a result action labelled `REBUILD` or `REBUILD THIS DUNGEON`.

Use:

`EDIT THIS DUNGEON`

Meaning:

- return to the optional customization/build screen;
- preserve the currently selected room, monsters, traps and supports;
- allow the receiver to tune that same dungeon and run again.

The action must be understandable without prior project knowledge.

## 3. BUILD YOUR OWN must lead to registration, never Buddy/Test

`SAVE THIS GOAL & BUILD YOUR OWN` must never send the receiver to the existing prototype Buddy/Test builder login screen.

In S8A it must open a dedicated full-screen registration experience in the receiver flow.

Required registration-screen copy/structure:

- title: `CREATE YOUR DUNGEON RUNNER ACCOUNT`
- explain that an account is required to save this goal, keep earned gold and store game assets;
- show the carried-forward goal context: target finishing HP, Hero-Runner identity/level and source sender name;
- show a clear `BACK TO REWARDS` action.

S8A still does not implement real authentication or persistence. Therefore the registration screen must not pretend an account was created, must not save credentials, and must not route to the Buddy/Test builder.

Do not collect or retain real passwords in S8A. If registration fields are shown for visual product proof, they must be clearly non-submitting/prototype-only and must not write to localStorage, sessionStorage, IndexedDB, cookies, Git, URL parameters, filesystem or a backend.

Real registration submission and account-backed persistence remain S8B authority.

## 4. Current prototype login truth

The current `Buddy / Test` builder login is not an account store. It is a public client-side prototype credential hard-coded in the web JavaScript and validated locally in the browser. It has no durable user record, no password hashing, no server session and no asset wallet.

Do not treat `Buddy / Test` as a real account system and do not extend it for S8A registration.

When real accounts are introduced in S8B, credentials must be handled by a proper server-side/auth-provider system. Passwords must never be stored in repository source or plain application tables.

## 5. Revised S8A browser acceptance journey

The required focused mobile journey becomes:

`invite -> accept -> choose dungeon -> run without customization -> verify OVERVIEW -> FOLLOW HERO -> reward screen -> EDIT THIS DUNGEON -> rerun -> reward screen -> SAVE THIS GOAL & BUILD YOUR OWN -> dedicated registration screen -> BACK TO REWARDS`

The registration step must not expose or redirect to Buddy/Test.

All original S8A reward rules, invitation isolation, no-persistence boundary, S2-S7.1 preservation rules and HostGator no-deploy rule remain in force.
