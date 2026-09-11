# WEB-FLARE S8A Rewards + Replay Work Order

## Authority

Work order: `WEB-FLARE-S8A-REWARDS-REPLAY-001`

Repository: `coachtomlim/ruins-api`

Branch: `work/web-flare-s8a-rewards-replay-001`

Accepted live predecessor: S7.1

Authority base SHA: `e599229ce9373614b1b164e0aa9f7ec37fea53a0`

Accepted S7.1 web source: `c4834520570adc72b02e50aa6a0f2a764030989c`

Do not mutate S2-S7.1. Implement S8A additively under `public/flare-s8a/` plus S8A-only tests, tools, docs and later deployment helper.

## Product goal

After a received challenge finishes, turn the current result into a game-like reward and replay moment.

The receiver must see both sides of the outcome:

1. what the sender/friend's Hero-Runner actually brought back in gold from the run;
2. what the receiver earned as the Dungeon Builder for how closely the dungeon matched the target.

Then offer a natural continuation:

`RUN AGAIN`

`REBUILD THIS DUNGEON`

`SAVE THIS GOAL & BUILD YOUR OWN`

The third path is the future account-conversion point. S8A proves the reward/replay UX only. It must not implement fake persistence or fake authentication.

## Preserve S7.1 flow

Preserve exactly in product meaning:

`DUNGEON RUNNER invitation -> Accept -> Choose Dungeon -> Optional Customize -> Run`

Screen 1 remains the game-like invitation with the real animated idle/stance Hero-Runner.

Customization remains explicitly optional.

Preserve six rooms, four monsters, two traps, three supports, 100-gold budget, deterministic simulation, calibration, scoring, Pause/Resume and Overview.

No gameplay rebalance in S8A.

## S8A post-run sequence

The runtime screen is no longer the final UX destination.

When a run reaches a valid terminal gameplay result, transition to a dedicated full receiver viewport reward screen. Do not leave the rewards as a small overlay over the battlefield.

Recommended hierarchy:

`CHALLENGE COMPLETE`

large score and closeness label

`Finished at XX.X% HP · Target YY%`

Then two visually equal reward cards:

### Friend reward

Label using the sanitized sender name, for example:

`BUDDY'S HERO EARNED`

`24 GOLD`

This value is exactly `sim.result().gold`. Do not invent or normalize it. It is the gold actually collected by the Hero-Runner during this run.

### Receiver reward

Label:

`YOU EARNED`

`20 GOLD`

Sub-label:

`Dungeon Builder reward`

This is a deterministic S8A reward derived from score.

## Governed S8A Dungeon Builder reward

Create a pure exported function, for example `builderGoldForResult(result, score)`.

For valid scored outcomes (`cleared` or `dead`):

- score 0-24.999 -> 5 gold
- score 25-49.999 -> 10 gold
- score 50-74.999 -> 15 gold
- score 75-99.999 -> 20 gold
- score 100 -> 25 gold

Equivalent implementation is acceptable if boundary behavior is exact.

For `blocked`, `timeout`, invalid or unscored outcomes: 0 builder gold.

The reward belongs to this run only in S8A. Do not accumulate it in a wallet yet.

The current Level 3 / 60% calibration regression (approximately 60.8% finishing HP, score approximately 98) therefore displays:

friend Hero gold: actual simulation gold, currently expected around 24 for the accepted default

receiver Dungeon Builder gold: 20

Do not alter combat to force those exact values. The friend reward always follows the simulation result.

## Reward language and ownership

Gold shown for the Hero and gold shown for the receiver are both game rewards, but ownership must be unambiguous.

Never label the Hero's collected gold as the receiver's reward.

Never add the two figures into a guest wallet in S8A.

Do not claim either reward has been permanently saved.

A small line may state:

`Create an account to keep your gold, saved goals and future assets.`

## Replay actions

### RUN AGAIN

Runs the same selected dungeon and current customization again.

It must remain deterministic for identical inputs.

Do not accumulate a persistent guest reward on repeated runs.

### REBUILD THIS DUNGEON

Returns to the existing optional customization/build screen with the current room and selections intact.

### SAVE THIS GOAL & BUILD YOUR OWN

This is the primary continuation/conversion action.

On click, show an account-required gate in the same S8A experience.

The gate must explain:

`Create an account to save this goal, keep your gold and store your game assets.`

Show the goal being carried forward at minimum as:

- target finishing HP percentage;
- source Hero-Runner identity/level;
- source sender name.

These values may exist only in current in-memory page state for S8A.

Do not persist them to localStorage, sessionStorage, IndexedDB, cookies, filesystem or a backend.

Do not implement a fake account.

Do not ask for a password or email in S8A.

The account gate must state clearly that account creation is the next product step and no assets have been saved yet.

Provide a safe return action such as `BACK TO REWARDS`.

The actual account creation and persistent asset wallet are S8B authority, not S8A.

## S8B authority recorded, not implemented

Future S8B must provide real account-backed persistence for at least:

- player identity;
- gold wallet;
- saved goals;
- owned/stored game assets;
- challenge/run history sufficient for reconciliation.

S8B will decide the backend/auth implementation separately. S8A must not pre-empt that architecture.

## Invitation isolation

S8A uses a new isolated invitation route:

`/m/XXXX`

Builder target for later deployment:

`/quick-dungeon/flare-s8a/`

The four-character code continues to encode only runner identity and target HP.

Sender may continue to travel separately through the sanitized `from` query parameter as in S7.1.

Do not encode room, monsters, traps, supports, rewards or account state into the four-character code.

Preserve `/q/`, `/g/`, `/h/`, `/j/`, `/k/` exactly.

## UI requirements

Keep mobile-first composition and existing palette/style family.

The reward screen should feel celebratory but compact. No new art is required.

Use simple gold iconography/text/CSS effects only. Do not add external art or animation libraries.

The two reward values must be understandable without reading explanatory paragraphs.

Primary visual order:

score/result -> friend reward + your reward -> replay/build actions.

`SAVE THIS GOAL & BUILD YOUR OWN` should be visually prominent but should not obscure the immediate replay actions.

## Technical boundaries

- No accounts/auth/backend in S8A.
- No persistence APIs.
- No database.
- No local guest wallet.
- No progression system.
- No asset purchasing/spending.
- No new rooms, enemies, traps, supports or runners.
- No gameplay rebalance.
- No AI.
- No new art.
- No deployment in the implementation task.
- Preserve deterministic simulation and fixed-tick authority.
- Presentation and reward calculation must not alter simulation outcome.

## Tests and acceptance

Preserve all 86 accepted S7.1 tests.

Add focused S8A tests proving at least:

1. S8A is additive and S2-S7.1 files remain unchanged.
2. `/m/XXXX` remains four characters and decodes runner + target only.
3. Screen 1 remains `DUNGEON RUNNER` with the real composed stance preview.
4. Optional customization and zero-customization path remain intact.
5. valid cleared score <25 -> receiver earns 5 gold.
6. score 25 -> 10 gold.
7. score 50 -> 15 gold.
8. score 75 -> 20 gold.
9. score 100 -> 25 gold.
10. blocked/timeout -> 0 receiver gold.
11. friend reward displayed equals actual `sim.result().gold`.
12. rewards appear only after terminal run result.
13. reward screen distinguishes friend Hero gold from receiver Dungeon Builder gold.
14. RUN AGAIN preserves the same dungeon/configuration and deterministic result.
15. REBUILD preserves current room/configuration when returning to build.
16. SAVE THIS GOAL & BUILD YOUR OWN opens the account-required gate with current target, runner and sender.
17. no localStorage/sessionStorage/IndexedDB/cookie persistence is introduced.
18. account gate does not collect credentials or claim anything is saved.
19. Level 3 Tough Warrior / 60% accepted calibration remains materially close to 60%, score remains materially near the S7.1 baseline, and receiver reward is 20 gold for the expected score band.
20. full browser journey passes on a mobile-sized viewport:
`invite -> accept -> choose dungeon -> run without customization -> reward screen -> account gate -> back to rewards -> rebuild -> run again`.

Run the complete repository test suite, Flare asset/source verification and focused browser gate available in this project.

## Implementation shape

Prefer a small S8A-only pure reward module rather than embedding reward band logic directly into DOM code.

Re-export accepted S7/S7.1 modules where possible rather than copying logic unnecessarily.

Do not modify frozen predecessor modules just to make imports convenient.

## Return contract

Return:

`S8A TEST STATUS: PASS`

or exact blocker.

Include:

- branch;
- authority base SHA;
- starting branch SHA;
- ending SHA;
- recommended deployable S8A web SHA;
- exact changed files;
- total test count;
- browser journey result;
- Level 3 / 60% finishing HP, score, friend Hero gold and receiver builder gold;
- confirmation that S2-S7.1 are unchanged;
- confirmation that no persistence/auth/backend was introduced;
- confirmation that `/q`, `/g`, `/h`, `/j`, `/k` are preserved;
- prepared but unexecuted bounded `docs/WEB_FLARE_S8A_HOSTGATOR_HANDOFF.md` and S8A-only HostGator deployment helper restricted to `public_html/quick-dungeon/flare-s8a` and `public_html/m`.

Do not deploy HostGator as part of this work order.
