# WEB-FLARE S8B Daily Trial 001

## Status

CALIBRATION / SERVER-SETTLEMENT DESIGN CANDIDATE — NOT DEPLOYED, NOT APPLIED

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
