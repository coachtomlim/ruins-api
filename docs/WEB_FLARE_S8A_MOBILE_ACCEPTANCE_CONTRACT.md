# WEB-FLARE S8A Mobile Acceptance Contract

This contract is preflight authority for the next S8A build. It does not change the live S7.1 deployment.

## Target viewports

At minimum test portrait phone layouts at:

- 390 x 844
- 430 x 932

Also retain responsive sanity at 360 x 800.

## Mission comprehension

Without scrolling, the Mission + Dungeon panel must visibly communicate all of the following:

- the Hero must clear the dungeon;
- the goal is to finish as close as possible to the target HP;
- killing the Hero is not the objective;
- closer to target means higher score and more Dungeon Builder gold;
- current target percentage;
- maximum current-run Builder reward: 25 gold.

Required dynamic core copy:

`GET THE HERO TO THE EXIT AT ~[TARGET]% HP`

`Closer to the target = higher score + more gold.`

`Do not kill the Hero. The Hero must clear the dungeon.`

Compact reward cue:

`CLEAR NEAR [TARGET]% HP · WIN UP TO 25 GOLD`

## Phone interaction rules

- Primary actions should be approximately 52-56 CSS px high where practical.
- Ordinary instructional copy should normally be 16 CSS px or larger.
- No essential action may depend on reading tiny text inside a compact card.
- The next primary action must be visible without hunting down a long page.
- Use panel/state transitions rather than a continuous long form.
- One dungeon at a time, with large arrows and swipe support.
- Optional customization must use large category controls: MONSTERS, TRAPS, SUPPORTS.
- Only one customization category needs to be expanded at once.
- The 100-gold budget remains visible while customizing.
- DONE exits customization back to a run-ready state.

## Novice path

The shortest path remains:

`ACCEPT CHALLENGE -> USE THIS DUNGEON -> RUN THE HERO`

Customization is never required.

## Overview proof

A test passes only if presentation changes materially. Toggling a boolean is insufficient.

Capture camera state after the Hero-follow camera has engaged, then capture camera state in Overview mode.

The Overview state must satisfy both:

1. it fits the complete rendered dungeon bounds within the canvas with reasonable padding;
2. it materially differs from the Hero-follow camera by scale or center position.

Recommended measurable assertion: at least one of these is true:

- absolute scale delta >= 0.02;
- camera center delta >= 8 CSS pixels.

The control label must change:

`OVERVIEW` -> `FOLLOW HERO`

Tapping FOLLOW HERO must restore tracked Hero composition and the label `OVERVIEW`.

## Rewards panel

Rewards must occupy a dedicated receiver panel rather than a small battlefield overlay.

Visible without page hunting:

- score / closeness outcome;
- finishing HP and target HP;
- sender Hero gold;
- receiver Dungeon Builder gold;
- RUN AGAIN;
- EDIT THIS DUNGEON;
- SAVE THIS GOAL & BUILD YOUR OWN.

For a failed clear, show `HERO DID NOT CLEAR` and Builder reward `0 GOLD`.

## Registration panel

`SAVE THIS GOAL & BUILD YOUR OWN` opens a dedicated registration panel headed:

`CREATE YOUR DUNGEON RUNNER ACCOUNT`

It must not navigate to the Buddy/Test prototype login.

S8A registration remains informational only. Do not collect email/password and do not persist guest data.
