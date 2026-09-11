# WEB-FLARE S7.1 Onboarding Invitation Work Order

## Authority

Base branch head: `accf4ec4f4cd4620d8ce2745925926f9f56e7276`

Accepted S7 deployable web source remains frozen at:
`4ca60cab1d14b8f7cc98087c49a72ad132310942`

Do not modify accepted S2-S7 web files. Implement S7.1 additively under `public/flare-s71/` and S7.1-specific tests/tooling only.

## Product correction

S7.1 is a bounded onboarding patch before S8. Do not add accounts, persistence, rewards, progression, AI, new combat, new rooms, monsters, traps or items.

### Screen 1: game invitation

The receiver must first see a game-like invitation screen, not rules/instructions.

Required headline and copy:

`DUNGEON RUNNER`

`Your friend [Name] has challenged you to select a dungeon for his Hero-Runner.`

`This takes only 30 seconds. Just accept the challenge and see his Hero run!`

Primary action:

`ACCEPT CHALLENGE`

The sender name must continue to use the existing safe sender behavior. Current Buddy/Test prototype may display `Buddy`; non-default `from=` values must remain supported and sanitized.

The selected Hero-Runner must be shown prominently on Screen 1 in a looping animated stock Flare idle/stance state. Reuse the actual composed runner sprite/stance frames already used by gameplay. No new art or static replacement portrait. Animation is presentation-only and must not touch deterministic simulation state. Respect `prefers-reduced-motion` by showing a stable stance frame rather than continuous animation.

Also show the runner identity and target succinctly, for example `Level 3 Tough Warrior` and `Target 60% HP`, without turning Screen 1 into an instruction page.

### Screen 2: choose and run

After `ACCEPT CHALLENGE`, the current game instructions/build sequence begins.

The visible hierarchy must make Step 2 explicitly optional:

1. `CHOOSE A DUNGEON`
   Pick one of the six rooms.

2. `CUSTOMIZE THE DANGER — OPTIONAL`
   The dungeon already has a calibrated setup. The receiver may change monsters, traps and supports within the existing 100-gold limit, or skip customization entirely.

3. `RUN THE GAUNTLET`
   The Hero-Runner runs automatically and scores by closeness to the sender's target HP.

A first-time receiver must be able to complete the novice path as:

`Accept Challenge → Choose Dungeon → Run`

No customization is required.

## S7 gameplay to preserve exactly

Preserve all accepted S7 mechanics and content:

- six rooms
- Goblin, Skeleton, Goblin Elite, Antlion
- Spike Trap and Dart Trap
- Small Potion, Battle Tonic, Iron Tonic
- 100-gold budget
- calibrated default
- Easy / Fair / Brutal coarse guidance
- deterministic runner and scoring
- Pause / Resume and Overview
- sender chooses runner + target only
- receiver chooses dungeon and optional build details

No gameplay rebalance in S7.1.

## Public isolation

Use a new public S7.1 build root:

`/quick-dungeon/flare-s71/`

Use a new four-character receiver route:

`/k/XXXX`

Do not modify or reinterpret:

`/q/`, `/g/`, `/h/`, `/j/`

S7.1 short links continue to encode only runner identity + target HP. Dungeon selections remain receiver-local/session state.

Expected post-deployment examples:

Builder: `https://think-2-thrive.com/quick-dungeon/flare-s71/`
Receiver: `https://think-2-thrive.com/k/UvVY`

## Acceptance tests

Preserve all 75 S7 tests and add bounded S7.1 coverage proving:

1. Screen 1 contains `DUNGEON RUNNER` and the required invitation copy.
2. Safe sender name populates `[Name]` and remains sanitized.
3. Hero idle canvas uses the real stock/composed stance animation frames.
4. Reduced-motion mode renders a stable stance frame.
5. Accept transitions to Screen 2 and does not start simulation.
6. Screen 2 labels customization as `OPTIONAL`.
7. Novice path works with no customization: accept, choose room, run.
8. S7 calibration and Level 3 / 60% regression remain materially unchanged.
9. `/k/XXXX` carries runner + target only.
10. S2-S7 source and routes remain unchanged.

Run the full available repository tests/build verification plus a browser gate. Do not deploy HostGator in this implementation task.

## Deferred S8+ authority, do not implement in S7.1

After a friend completes the gauntlet, a later S8-or-later result/reward flow must show both sides' rewards, including:

- what the sender/friend's Hero obtained, currently gold;
- what the receiving player obtained, currently gold;
- an option for the receiving player to save the goal/challenge and build their own dungeon;
- account creation/login required before saving persistent goals or owned assets;
- account-backed storage will hold those persistent assets.

This is product authority for S8 or later only. No account, reward-wallet or persistence work belongs in S7.1.

## Return contract

Return:

`S7.1 TEST STATUS: PASS` or precise blocker

plus branch, base SHA, ending SHA, exact changed files, test totals, browser-gate result, idle-animation proof, novice-path proof, Level 3 / 60% calibration regression, confirmation S2-S7 are unchanged, and recommended deployable S7.1 web source SHA.

Prepare, but do not execute, a bounded S7.1 HostGator handoff/deployer that writes only the S7.1 root and `/k/`, preserving all prior routes and fingerprints.