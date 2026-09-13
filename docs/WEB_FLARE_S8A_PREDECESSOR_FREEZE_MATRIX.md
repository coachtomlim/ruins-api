# WEB-FLARE S8A Predecessor Freeze Matrix

S8A is additive. The following accepted web sources remain immutable reference points.

| Release | Accepted web/source SHA | Public root / route authority |
|---|---|---|
| S2 | `8cc57ddacfc2e12ac65b120496f1ee8915e4525b` | `/quick-dungeon/flare-s2/` |
| S3 | `3c1e62c82ab4277956c451ad8a396cea11b1f4a9` | S3 public root and legacy `/q/` family |
| S4 | `a038c163530ae55ab8d6a158591443c84ebe8dde` | S4 public root and `/q/hiS4` |
| S5 | `ecbbb4f10c2fbfab992c0bf77cdb9ac996333c3e` | `/quick-dungeon/flare-s5/`, `/g/XXXX` |
| S6 | `490e21b8cfe358fb96b933705d3b4206840a9305` | `/quick-dungeon/flare-s6/`, `/h/XXXX` |
| S7 | `4ca60cab1d14b8f7cc98087c49a72ad132310942` | `/quick-dungeon/flare-s7/`, `/j/XXXX` |
| S7.1 | `c4834520570adc72b02e50aa6a0f2a764030989c` | `/quick-dungeon/flare-s71/`, `/k/XXXX` |

## Frozen behavior checks

Before S8A is accepted, prove at minimum:

- no file under `public/flare-s2` through `public/flare-s71` was modified by the S8A implementation build;
- `/q/Rind` and `/q/hiS4` remain available;
- `/g/MsJ9` remains available;
- `/h/UvVY` remains available;
- `/j/UvVY` remains available;
- `/k/UvVY` remains available;
- S8A uses its own new `/m/XXXX` route rather than altering an older decoder or rewrite.

## Git-history note

Frozen-file tests that diff against historical SHAs require those commit objects to be present in the Git checkout. A shallow CI checkout that lacks the objects must not be interpreted as a product regression. The implementation/test environment should fetch or retain sufficient history before running the freeze test.
