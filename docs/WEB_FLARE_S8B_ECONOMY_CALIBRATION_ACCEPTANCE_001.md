# WEB-FLARE S8B Economy Calibration Acceptance 001

## Decision

`OD-05 CALIBRATION POLICY: OWNER ACCEPTED`

Branch:

`work/web-flare-s8b-economy-calibration-001`

Verified calibration authority before Owner acceptance:

`8efd295e24a37fa65b4c852d44db12a39d3881e6`

## Verified evidence

- focused tests: `3/3 PASS`
- full suite: `327/327 PASS`
- frozen verifier: `PASS`
- legal encounter combinations: `317`
- matrix states: `84`
- `public/flare-s8a/` changes: `NONE`
- source changes during verification: `NONE`
- schema changes: `NONE`
- HostGator/Vercel/main: untouched
- worktree: clean

Verified anchor states:

- `100/12/1` -> `PREFERRED`
- `120/12/1` -> `PREFERRED` boundary
- `100/14/1` -> `EDGE`
- `100/12/3` -> `EDGE`
- `120/13/1` -> `OUTSIDE`
- `110/13/2` -> `OUTSIDE`

## Accepted OD-05 calibration policy

The Owner accepted the following governing policy for S8B progression design:

1. atomic permanent-stat units are `+5 HP`, `+1 ATK`, and `+1 DEF`;
2. the fixed Dungeon Budget remains `100`;
3. launch progression offers must keep the projected effective Runner state inside the versioned `PREFERRED` challengeability envelope;
4. cumulative projected Runner power governs eligibility, not independent HP/ATK/DEF maxima;
5. armor and permanent training share the same cumulative power envelope;
6. armor slots do not automatically receive `+1 DEF` each;
7. deeper progression requires stronger governed dungeon content rather than silently increasing Dungeon Budget;
8. candidate Gold bands remain pacing guidance only until concrete offers are accepted:
   - `+5 HP` equivalent: 20-25 Gold
   - `+1 ATK` equivalent: 25-35 Gold
   - `+1 DEF` equivalent: 35-50 Gold
   - first modest armor piece: 25-40 Gold.

## Still unresolved

This policy acceptance does not yet select or activate:

- exact Gold price for a concrete offer;
- exact later armor/item catalog;
- equipment upgrade tiers;
- displayed Runner-level progression rules;
- exact acquisition mix across purchase/drop/reward/future trade;
- reward settlement OD-01/OD-02;
- persistent challenge OD-04/OD-06/OD-07.

## Authorized next foundation work

A secure fail-closed progression transaction foundation may now be implemented without activating any concrete offer.

Required properties:

- versioned server-owned offer catalog;
- no active offer until exact modifier and exact Gold price are accepted;
- server-authoritative and idempotent wallet debit;
- per-player serialization so balance cannot go negative under concurrency;
- server-side Runner ownership validation;
- append-only/auditable stat upgrade events;
- equipment purchase creates ownership but does not imply equip;
- challengeability envelope must authorize the projected resulting effective state before a stat purchase can commit;
- absent catalog/envelope data fails closed;
- browser cannot directly mutate progression authority;
- S8A remains frozen.
