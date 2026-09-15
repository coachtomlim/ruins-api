# WEB-FLARE S8B Runner Hub Acceptance 001

## Decision

`S8B RUNNER HUB: ACCEPTED`

Accepted branch:

`work/web-flare-s8b-runner-hub-001`

Verified product/runtime authority before this acceptance record:

`feeda99ec799a0a75737be3069be564baec1f536`

## Independent PM verification

The PM independently reread the remote branch and confirmed it remained exactly at the expected verified SHA before recording acceptance.

The authenticated runtime verification returned PASS without source, schema, migration, HostGator, Vercel or main changes.

Accepted execution evidence:

- sign in: PASS
- session reload/navigation: PASS
- `ensure_starter_account`: PASS
- `get_account_runner_state`: PASS
- authoritative base stats: 100 HP / 8 ATK / 0 DEF
- authoritative effective stats: 100 HP / 12 ATK / 1 DEF
- Wooden Club: +4 ATK
- Wooden Shield: +1 DEF
- HEAD/CHEST/HANDS/LEGS/FEET: empty
- STATS / EQUIPMENT / ARMOR panels: PASS
- governed saved goal: `Tom · Tough Warrior · 60% HP`
- Gold: 0
- direct saved-goal write: NO
- `claim_proof_builder_reward`: NOT CALLED
- `claimGuestRun`: NOT CALLED
- catalog/progression mutation: NO
- 360x800: PASS
- 390x844: PASS
- 430x932: PASS
- console errors: 0
- route/asset 404s: 0
- email confirmation remained enabled
- temporary users deleted
- worktree clean

## Independent staging cleanup confirmation

After the external browser verification, PM independently queried the staging database and confirmed:

- Auth users: 0
- player profiles: 0
- saved goals: 0
- wallet ledger: 0
- reward claims: 0
- player Runners: 0
- owned Runner items: 0
- Runner loadouts: 0
- governed Runner templates: 1
- governed Runner items: 2

Therefore the proof left no player/test residue.

## Email-rate-limit disposition

The earlier fresh-signup retry was blocked by Supabase built-in SMTP rate limiting only. The accepted Account Foundation Client had already proved confirmation-required signup and the `CHECK YOUR EMAIL` pending state. Runner Hub acceptance therefore reused that unchanged signup-path evidence and completed the new authenticated Runner Hub behavior with one administratively confirmed disposable staging user.

Email confirmation remained REQUIRED throughout.

This does not resolve production transactional-email delivery. Production still needs a deliberate custom SMTP or equivalent managed delivery decision before public launch.

## Authority now accepted

The S8B browser no longer owns or recomputes Runner combat authority.

`get_account_runner_state(uuid)` is the authoritative source for:

- Runner identity;
- governed base stats;
- effective stats;
- equipped Club/Shield modifiers;
- seven-slot loadout state.

The client fails closed rather than inventing values for unknown/malformed authoritative equipment.

## Product boundary still closed

This acceptance does not activate:

- guest reward settlement;
- Hero reward settlement;
- Gold spending;
- permanent stat upgrades;
- equipment purchases;
- equip mutation;
- gear drops;
- trade;
- persistent challenge issuance;
- live S8A registration;
- HostGator deployment;
- Vercel changes;
- main changes.

## Next governed decision boundary

The next product-mutation slices are blocked by unresolved Owner decisions in `docs/WEB_FLARE_S8_OPEN_DECISIONS.md`.

The highest-leverage next work that does not require inventing those decisions is economy/challengeability calibration for OD-05: propose bounded stat increments, Gold price bands, item modifier bands and progression caps while proving that the fixed 100-point Dungeon Budget can still challenge progressed Runners.

Calibration outputs are recommendations only and do not activate purchases or mutate staging persistence until Owner accepts the economy values.
