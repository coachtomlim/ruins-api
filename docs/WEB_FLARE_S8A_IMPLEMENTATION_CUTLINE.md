# WEB-FLARE S8A One-Go Implementation Cutline

Purpose: define exactly what the next Codex build may implement and what remains planning-only.

## Implement in S8A

- Additive runtime under `public/flare-s8a/`.
- Isolated short route `/m/XXXX`.
- Screen 1 invitation with real Hero stance animation.
- Mission panel with target-first language, clear-not-kill rule and reward incentive.
- Six-room selection with one room visible at a time.
- Optional customization using MONSTERS / TRAPS / SUPPORTS panels.
- Persistent-on-screen 100 Gold build budget indicator.
- Ready panel with target, room, current build summary and `RUN THE HERO`.
- Existing deterministic simulation and accepted content catalog.
- Fixed Overview / Follow Hero camera interaction with measurable camera change.
- Dedicated Rewards panel with Hero Gold and Builder Gold separated.
- `RUN AGAIN` preserving exact inputs.
- `EDIT THIS DUNGEON` preserving current room/configuration.
- `SAVE THIS GOAL & BUILD YOUR OWN` opening a dedicated registration gate.
- Memory-only registration handoff.
- Prepared pure helpers/modules and focused tests already on branch.
- Mobile browser acceptance at 360x800, 390x844 and 430x932.
- S2-S7.1 frozen-file verification.
- Prepared but unexecuted HostGator handoff/deployer for S8A-only roots.

## Do not implement in S8A

- Real user registration.
- Email/password/passkey/social login collection.
- Password storage or password hashing code.
- Supabase or any backend connection.
- Database schema deployment.
- Wallet persistence.
- Saved-goal persistence.
- Asset ownership persistence.
- Challenge history persistence.
- Hero reward settlement to sender wallet.
- Builder reward settlement beyond current-run display.
- Shops, purchases, progression or asset pricing.
- AI behavior.
- New rooms, monsters, traps, supports, runners or art.
- Gameplay rebalance.
- Changes to S2-S7.1.
- Changes to `/q`, `/g`, `/h`, `/j`, `/k`.
- Any Vercel operation.
- HostGator deployment during implementation.

## Stop conditions

STOP rather than broadening scope if implementation appears to require:

- predecessor mutations;
- real credential persistence;
- changing simulation authority;
- changing accepted S7.1 calibration to make S8A fit;
- a provider decision for accounts;
- a Vercel change;
- overwriting an existing public route.

## Completion boundary

S8A implementation is complete only when code, tests and browser evidence exist on the branch and one exact deployable web SHA is identified. Live deployment remains a separate Owner-authorized step.
