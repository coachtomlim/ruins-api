# WEB-FLARE S8A Amendment 004: Target-Fit Language

This amendment supersedes any S8A UI wording that presents `Easy / Fair / Brutal` as the primary receiver guidance.

## Reason

The receiver is solving a precision-target problem, not maximizing lethality. Difficulty labels can push the wrong mental model.

## S8A receiver guidance

Use target-fit language derived from the coarse estimator:

- `TOO GENTLE` when the Hero is expected to finish materially above the target;
- `CLOSE TO TARGET` when the setup is within the governed coarse target band;
- `TOO HARSH` when the Hero is expected to finish materially below the target.

Suggested support copy:

- TOO GENTLE: `The Hero may finish too healthy. Add a little challenge.`
- CLOSE TO TARGET: `This setup is a good starting point for the target.`
- TOO HARSH: `The Hero may take too much damage. Ease the dungeon.`

Do not reveal an exact predicted finishing HP.

The accepted S7.1 calibration algorithm remains untouched. S8A may translate its coarse estimate into the new target-fit UI terminology.

## Presets

Existing internal preset IDs may remain implementation details for compatibility, but the receiver-facing primary UX should not center `Easy / Fair / Brutal` buttons. If quick adjustment controls are retained, phrase them around target fit or challenge adjustment rather than combat brutality.
