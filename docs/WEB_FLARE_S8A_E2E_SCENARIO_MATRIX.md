# WEB-FLARE S8A End-to-End Scenario Matrix

Use this as the minimum browser acceptance matrix for the next build. These scenarios are intentionally bounded and mobile-first.

| ID | Scenario | Expected proof |
| --- | --- | --- |
| E2E-01 | First-time receiver, default calibrated path | Invitation visible, mission understood, choose dungeon, skip customization, run, rewards |
| E2E-02 | Target 50% mission comprehension | `GET THE HERO TO THE EXIT AT ~50% HP`, reward incentive and no-kill warning all visible before action |
| E2E-03 | Optional customization | Open MONSTERS, switch TRAPS, switch SUPPORTS, budget remains visible, DONE returns to ready panel |
| E2E-04 | Overview camera | OVERVIEW materially expands camera to dungeon composition; button becomes FOLLOW HERO; second tap restores tracking |
| E2E-05 | Cleared near target | Reward screen shows actual Hero gold, builder gold from score band, score, target and clear state |
| E2E-06 | Hero dies | Reward screen says HERO DID NOT CLEAR; builder gold 0; no death reward loophole |
| E2E-07 | Route blocked/timeout | Builder gold 0; result clearly distinguishes failure from successful clear |
| E2E-08 | Run again | Same room/configuration; deterministic repeated result; no guest wallet accumulation |
| E2E-09 | Edit this dungeon | Current room and selections remain; opens optional customization rather than resetting challenge |
| E2E-10 | Build your own | Opens CREATE YOUR DUNGEON RUNNER ACCOUNT, never Buddy/Test |
| E2E-11 | Back from registration | Returns to reward panel with current in-memory run context still present |
| E2E-12 | Sender sanitization | Markup-like sender input is escaped/cleaned before invitation and reward labels |
| E2E-13 | Reduced motion | Idle Hero holds deterministic stance frame; all actions remain accessible |
| E2E-14 | Narrow phone 360x800 | No essential action requires scroll hunting; mission and target remain legible |
| E2E-15 | Typical phone 390x844 | Primary actions fit viewport; no tiny instructional boxes; customization uses panels |
| E2E-16 | Large phone 430x932 | Same hierarchy with no desktop assumptions |
| E2E-17 | Previous routes | `/q`, `/g`, `/h`, `/j`, `/k` remain unchanged and S2-S7.1 fingerprints remain exact |
| E2E-18 | S8A invite isolation | `/m/XXXX` is four characters and still encodes runner + target only |

## Pass rule

A browser gate must report every scenario individually. A single aggregate PASS is insufficient if one scenario was not exercised.

## Evidence rule

For layout/camera scenarios capture measurable state, not just screenshots or boolean flags. Record viewport size, relevant element rectangles, camera scale/position before and after, and the active UI state.
