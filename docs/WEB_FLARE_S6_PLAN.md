# WEB-FLARE S6 Calibration and Difficulty Intelligence

## Mission

Keep the corrected S5 sender/receiver roles, but stop giving every receiver the same weak default dungeon.

Sender remains:

`choose runner -> choose target -> send short invite`

Receiver remains:

`accept -> choose room -> build danger -> autonomous run -> score`

## S6 change

The receiver now starts with a deterministic, coarse calibration based on:

- runner HP
- runner ATK
- runner DEF
- target finishing HP
- current monster and trap combat values
- 100-gold budget

The calibration chooses only a starting encounter. It does not choose the room and it does not predict or reveal the exact outcome.

## Difficulty guidance

The receiver sees a simple cue:

- Easy
- Fair
- Brutal

The cue is explicitly guidance, not a result forecast. Manual room, monster, potion and trap controls remain available.

## Balance correction

S5 exposed a concrete weakness: Level 3 Tough Warrior with a 60% target used the same 65-gold default as Level 1 and finished at 98.3% HP.

S6 rebalances the Spike Trap to 30 raw physical damage at the existing 20-gold cost and uses a coarse timing factor rather than full simulation prediction to select a starting preset.

Deterministic room-1 verification now gives the Level 3 / 60% calibration approximately 60.8% HP using the full 100-gold starting setup. This is a calibration check, not an outcome promise across all rooms.

## Constraints

- no new art
- no new monster family yet
- no real authentication
- no AI runtime
- no hidden exact-outcome predictor
- no change to S2, S3, S4 or accepted S5
- `/q/` and `/g/` remain untouched
- S6 uses isolated `/h/XXXX` invitations

## Acceptance gates

1. Repository suite passes.
2. Sender still chooses runner and target only.
3. Receiver opening instructions remain explicit.
4. Calibrated starting encounter changes with runner/target.
5. Level 3 / 60% is materially closer than the S5 98.3% result.
6. Every calibrated starting encounter stays within 100 gold.
7. Manual tuning still works.
8. Run and attack animation remain visible.
9. Spike Trap visibly triggers once and uses S6 damage.
10. `/h/XXXX` is four characters and WhatsApp-safe.
11. S2-S5 fingerprints and `/q/`, `/g/` remain unchanged.
