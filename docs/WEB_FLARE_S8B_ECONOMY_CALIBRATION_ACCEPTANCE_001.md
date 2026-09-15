# WEB-FLARE S8B Economy Calibration Acceptance 001

## Decision

`S8B ECONOMY CALIBRATION VERIFY: ACCEPTED`

Branch:

`work/web-flare-s8b-economy-calibration-001`

Verified source/tool authority:

`8efd295e24a37fa65b4c852d44db12a39d3881e6`

## Independent PM audit

The PM independently reread the remote branch and confirmed it remained exactly at the expected verification SHA before recording this acceptance.

The calibration verification returned:

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

Verified calibration anchor states:

- `100/12/1` -> `PREFERRED`
- `120/12/1` -> `PREFERRED` boundary
- `100/14/1` -> `EDGE`
- `100/12/3` -> `EDGE`
- `120/13/1` -> `OUTSIDE`
- `110/13/2` -> `OUTSIDE`

## Acceptance boundary

This accepts the calibration evidence and tooling only.

It does not yet accept or activate the recommended OD-05 policy values, Gold bands, purchase catalog, progression caps, Supabase purchase mutations, reward settlement, or deeper dungeon-content changes.

Owner approval is still required before the OD-05 recommendation becomes governing design authority.

## Recommended Owner policy awaiting approval

1. Atomic stat units: `+5 HP`, `+1 ATK`, `+1 DEF`.
2. Launch progression offers must keep projected effective Runner state inside the `PREFERRED` challengeability envelope under the fixed `100` Dungeon Budget.
3. Candidate Gold bands remain pacing guidance only until concrete catalog/play evidence:
   - `+5 HP`: 20-25 Gold
   - `+1 ATK`: 25-35 Gold
   - `+1 DEF`: 35-50 Gold
   - modest first armor piece: 25-40 Gold
4. Armor and stat training share the same cumulative power envelope; do not default every armor slot to `+1 DEF`.
5. Deeper progression requires stronger governed dungeon content rather than silently raising the Dungeon Budget.

## Next gate

Owner decision: ACCEPT / REVISE the OD-05 calibration policy.

If accepted, the next bounded design slice is the first versioned progression catalog and server-side purchase transaction design, while reward settlement remains separately gated by OD-01/OD-02.
