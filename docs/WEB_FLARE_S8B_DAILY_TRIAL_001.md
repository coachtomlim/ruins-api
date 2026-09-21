# WEB-FLARE S8B Daily Trial 001

## Status

CALIBRATION PASS / SERVER-AUTHORITY CANDIDATE — NOT DEPLOYED, NOT APPLIED

## Product purpose

Give a signed-in Runner owner one additional solo Gold opportunity per UTC day without allowing browser-controlled Practice outcomes to mint persistent currency.

Daily Trial is distinct from Practice:

- Practice remains unlimited, configurable and reward-free.
- Daily Trial is one governed system trial per UTC day.
- The first settled Daily Trial pays 5 Gold.
- Replays after settlement pay no persistent Gold.

## v1 trial content

Version:

`s8b-daily-trial-001`

Reward:

`5 Gold`

Encounter:

- Goblin
- Skeleton
- one empty enemy slot
- Small Potion
- no trap

This is the existing FAIR/BALANCED S7 encounter.

Dungeon Budget:

`65 / 100`

Room rotates deterministically across the six existing stock Flare rooms:

1. Pillar Court
2. Crossed Court
3. Broken Gallery
4. Scattered Hall
5. Vaulted Crossing
6. Twin Lanes

The server derives the UTC day and room. The browser does not choose the rewarded trial room or encounter.

## Calibration gate

Before server settlement is implemented, prove the fixed trial clears for every currently purchase-legal PREFERRED Runner state across all six rooms.

Current PREFERRED states:

- 100 / 12 / 1
- 100 / 12 / 2
- 100 / 13 / 1
- 105 / 12 / 1
- 105 / 12 / 2
- 105 / 13 / 1
- 110 / 12 / 1
- 115 / 12 / 1
- 120 / 12 / 1

Required combinations:

`6 rooms × 9 Runner states = 54`

Tool:

`tools/flare-s8b-daily-trial-calibration.mjs`

Required gate:

`54/54 CLEARED`

If any current legal Runner state fails, do not activate this Daily Trial template.

## Why this gate matters

Dungeon Runner's run is deterministic and automatic. The player does not issue tactical combat commands.

If the fixed Daily Trial is proven to clear for every currently legal Runner state, the server does not need to trust browser-supplied:

- clear/death status
- finish HP
- Gold collected
- elapsed simulation result
- FAIR/BRUTAL label

The server can instead create one canonical Daily Trial run entitlement for the authenticated player/day, bound to:

- server UTC date
- Daily Trial version
- deterministic room
- fixed encounter
- authoritative Runner snapshot

Settlement can then be limited to that server-created run and one wallet credit per player/day.

## Planned server run record

After calibration PASS, introduce an immutable `daily_trial_run` record with at minimum:

- run id
- player id
- player Runner id
- trial day
- trial version
- room id
- authoritative Runner HP / ATK / DEF snapshot
- encounter version
- expected minimum completion window
- started timestamp
- settle-after timestamp
- settled timestamp
- wallet ledger entry id
- created timestamp

Unique:

- `(player_id, trial_day)`
- ledger entry id

The browser may receive the run id and canonical trial manifest.

It does not submit authoritative reward/result fields.

## Planned settlement

Initial reward reason:

`daily_trial_reward`

Settlement RPC accepts only a server-created `run_id`.

Server verifies:

1. authenticated player owns the run;
2. run belongs to today's governed trial;
3. run is not already settled;
4. server settle-after time has passed;
5. run's Runner snapshot was in the accepted Daily Trial envelope;
6. no prior Daily Trial reward exists for that player/day;
7. reward is the server constant 5 Gold.

Then atomically:

- append one +5 wallet ledger row;
- mark the run settled;
- return authoritative balance.

Retry returns the same settlement result.

## Anti-farming boundary

Daily Trial does not rely on:

- localStorage/sessionStorage as reward authority;
- browser-submitted finish HP;
- browser-submitted score;
- browser-submitted Gold;
- Practice result objects;
- mutable client clocks.

At most one persistent Daily Trial reward exists per authenticated player per UTC day.

## Daily Trial versus social rewards

Daily Login perfect week:

`45 Gold / 7 days`

Daily Trial:

`5 Gold/day = 35 Gold / 7 days`

Combined active solo ceiling:

`80 Gold / 7 days`

Average active solo income:

`~11.4 Gold/day`

This remains within the previously targeted solo floor of roughly 8–12 Gold/day, while future social challenge play can remain the higher-yield route.

## Non-scope

Daily Trial 001 does not yet:

- activate a new Supabase migration;
- deploy an Edge Function;
- alter HostGator;
- settle social Hero/Builder Gold;
- add gear drops;
- change Practice;
- change Dungeon Budget;
- create new Flare art;
- introduce a second combat ruleset.

## Next gate

Run the 54-combination calibration.

Only if all 54 clear should the server run/settlement schema be implemented.


## Calibration result

Claude independently verified the calibration gate at source HEAD:

`364860d85911db5e59b0ca53d8d7c82049c290cc`

Result:

`54 / 54 CLEARED`

Completion envelope:

- minimum: 598 ticks / 9.97 s
- maximum: 660 ticks / 11.00 s
- median: 10.255 s
- mean: 10.405 s

Per-room calibrated run windows:

| Rotation | Room | Expected ticks | Display seconds |
| ---: | --- | ---: | ---: |
| 0 | Pillar Court | 614 | 10.23 |
| 1 | Crossed Court | 660 | 11.00 |
| 2 | Broken Gallery | 604 | 10.07 |
| 3 | Scattered Hall | 598 | 9.97 |
| 4 | Vaulted Crossing | 653 | 10.88 |
| 5 | Twin Lanes | 617 | 10.28 |

The exact tick values are the unique integer tick counts consistent with the calibrated two-decimal seconds under the fixed 60 ticks/second simulation. They must be independently rechecked against the calibration output before migration application.

All nine current PREFERRED Runner states clear every room. Finish HP remains 82.0–85.7%, and the deterministic simulation collects 15 Hero loot Gold in every row.

### Important Gold separation

The simulation's 15 Hero loot Gold is **not** the Daily Trial persistent wallet reward.

Daily Trial v1 persistent reward remains exactly:

`5 Gold`

The 15 simulation loot value is runtime telemetry from the existing deterministic combat model. It must not be credited in addition to the fixed Daily Trial reward, or the accepted 80-Gold/week solo ceiling would be broken.

## Server-authority candidate

Candidate migration:

`supabase/migrations/20260921_s8b_daily_trial_001.sql`

The migration is source-only and is not applied by this branch.

It introduces:

- read-only `daily_trial_room_catalog`;
- owner-readable `daily_trial_run`;
- `get_daily_trial_status()`;
- `start_daily_trial()`;
- `settle_daily_trial(uuid)`;
- wallet reason `daily_trial_reward`.

### Why no Edge Function in v1

The calibrated Daily Trial is automatic and deterministic. There are no tactical player inputs after start, and every currently legal PREFERRED Runner state clears all six trial rooms.

Therefore v1 does not need to accept a browser-computed terminal result or run a second server-side JavaScript simulation.

Server authority instead consists of:

1. server UTC day;
2. server-selected rotating room;
3. fixed encounter;
4. immutable authoritative Runner snapshot;
5. calibration-envelope membership;
6. server-created run identity;
7. calibrated room-specific minimum run window;
8. one settlement per player/day.

The browser may animate the same canonical run but cannot choose reward authority.

This proves one daily trial entitlement and prevents repeat farming. It does not attempt to prove that a human watched every animation frame, which is not a meaningful gameplay distinction for an automatic deterministic run.

### Start

`start_daily_trial()` takes no browser arguments.

It derives:

- authenticated player from `auth.uid()`;
- UTC trial day;
- deterministic room rotation;
- current authoritative Runner state;
- fixed FAIR encounter;
- fixed 5 Gold reward;
- calibrated expected ticks and `settle_after`.

It refuses Runner states outside the accepted `PREFERRED` challengeability envelope.

One player may have at most one server-created run for a trial day.

### Historical snapshot

Each run stores:

- full authoritative Runner JSON snapshot;
- effective HP / ATK / DEF;
- rules version;
- content version;
- room identity;
- exact encounter JSON;
- expected ticks;
- start and settlement timing.

Later Runner upgrades cannot alter the started trial.

### Settlement

`settle_daily_trial(run_id)` accepts only the server-created run ID.

It does not accept:

- player ID;
- room;
- date;
- status;
- finishing HP;
- score;
- Hero loot;
- reward amount.

The RPC verifies ownership, governed trial identity and `settle_after`, then appends exactly one +5 `daily_trial_reward` wallet entry and marks the run settled atomically.

Retry returns the existing settlement result.

A run started just before UTC midnight may settle after midnight. The entitlement belongs to its server-recorded `trial_day`; crossing midnight during the calibrated 10–11 second run does not invalidate it.

## Next gate after server-authority verification

Before applying the candidate migration:

1. parse SQL with a real PostgreSQL parser;
2. verify the six exact calibrated tick values against raw calibration rows;
3. run focused/full/frozen tests;
4. review function permissions and RLS;
5. prove no browser-controlled reward/result field exists.

Only after that PASS may the migration be applied to S8B staging for a real start/early-settle/settle/retry/concurrency proof.
