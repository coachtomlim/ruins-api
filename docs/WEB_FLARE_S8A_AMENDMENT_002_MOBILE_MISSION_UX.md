# WEB-FLARE S8A Amendment 002 — Mobile Mission Clarity + Panel UX

This amendment is authoritative for `WEB-FLARE-S8A-REWARDS-REPLAY-001` and supersedes any conflicting UI wording in the original S8A work order or Amendment 001.

## 1. Core game intent must be unmistakable

The receiving player is NOT trying to kill the Hero-Runner.

Their task is:

> Build/select a dungeon that lets the Hero-Runner CLEAR the dungeon as close as possible to the target finishing condition.

For an example target of 50% HP, the product meaning is:

> Get the Hero to the exit as close to 50% health as possible.

The UI must explicitly say:

`YOUR GOAL`

`Get the Hero to the EXIT as close as possible to 50% HP.`

and immediately below:

`Do not try to kill the Hero. Closer to the target = higher score.`

Use the actual target percentage dynamically.

Do not use ambiguous copy such as `build the danger`, `can you survive`, or copy that implies maximum lethality is success.

A dead Hero counts as a poor target match unless the score rules themselves say otherwise. The visible player instruction should focus on getting the Hero through the dungeon near the requested finishing HP.

## 2. Screen 1 remains the game invitation

Keep the S7.1 game-like opening:

`DUNGEON RUNNER`

`Your friend [Name] has challenged you.`

Show the actual animated idle/stance Hero-Runner.

Use a large, bright primary button:

`ACCEPT CHALLENGE`

Do not put the detailed rules on Screen 1.

## 3. Screen 2 must teach the mission before the controls

After ACCEPT, the first visible content on the next panel must be a large mission block, not a dense instructional list.

Recommended hierarchy:

`YOUR MISSION`

`GET THE HERO TO THE EXIT AT ~50% HP`

`Do not kill him. The closer he finishes to 50%, the higher your score.`

Then:

`1. CHOOSE A DUNGEON`

`2. CUSTOMIZE — OPTIONAL`

`3. RUN THE HERO`

The target percentage must be visually dominant and easy to understand at a glance.

## 4. Mobile-first operating model

Primary target is a modern phone in portrait orientation.

Do not design desktop cards and shrink them down.

The main flow should avoid page scrolling wherever possible. One operation should occupy one viewport-sized panel at a time.

Use panel/state transitions rather than long vertically stacked screens.

Operations that can be toggled should open as dedicated panels/overlays/sheets and return to the prior panel without losing state.

The user should normally be able to complete the novice path with repeated taps in approximately the same thumb area near the lower portion of the screen.

## 5. Readability requirements

Do not rely on small labels, tiny helper text, or compressed cards.

For mobile proof:

- normal instructional/body text should be approximately 16px or larger;
- important mission/target text should be materially larger;
- primary action buttons should be large, bright and full-width or near-full-width;
- touch targets must be at least 44 CSS px high, preferably about 52-56px for primary actions;
- avoid low-contrast text;
- avoid putting essential instructions in small boxes that require close reading;
- avoid multiple simultaneous tiny buttons competing for attention.

The browser gate must inspect this on a mobile-sized viewport, not only desktop.

## 6. Revised receiver panels

### Panel A — Invitation

Animated Hero-Runner + friend challenge + target summary.

Primary CTA:

`ACCEPT CHALLENGE`

### Panel B — Mission + Dungeon Choice

Large mission statement with target percentage.

Show one dungeon at a time with swipe/large left-right controls.

Primary CTA:

`USE THIS DUNGEON`

Secondary large action:

`CUSTOMIZE — OPTIONAL`

Do not force customization before running.

### Panel C — Optional Customization

This panel opens only when the player asks for it.

Do not present one long scroll of all monsters, traps and supports.

Use large, toggleable sub-panels/tabs such as:

`MONSTERS`

`TRAPS`

`SUPPORTS`

Only one category should need to be open at a time.

Keep the 100-gold budget highly visible.

Provide a large action to return to the ready state, for example:

`DONE`

Do not bury the exit action at the bottom of a long list.

### Panel D — Ready / Run

Show compact confirmation:

- chosen dungeon;
- target HP;
- current setup cost;
- coarse difficulty cue.

Primary CTA:

`RUN THE HERO`

The novice zero-customization path remains:

`Accept -> Choose Dungeon -> Run`

### Panel E — Runtime

The game view should dominate the screen.

Controls should remain large enough to tap.

Fix OVERVIEW so it visibly switches between:

`OVERVIEW` -> full dungeon view

and

`FOLLOW HERO` -> tracked Hero view.

The button label must represent the action/state clearly.

### Panel F — Rewards

Dedicated full-screen reward panel after the run.

Do not use a small overlay over the battlefield.

Show score and target match first, then friend Hero gold and receiver Dungeon Builder gold.

Use the S8A reward logic from the original work order.

Actions:

`RUN AGAIN`

`EDIT THIS DUNGEON`

`SAVE THIS GOAL & BUILD YOUR OWN`

### Panel G — Registration / Account Required

`SAVE THIS GOAL & BUILD YOUR OWN` must go to a dedicated account/registration screen, never to the public Buddy/Test prototype builder login.

In S8A this remains a non-persistent product gate only.

Explain:

`Create an account to save this goal, keep your gold and store your game assets.`

Do not collect real credentials yet. Do not fake persistence.

Provide:

`BACK TO REWARDS`

## 7. Do not expose Buddy/Test to new receivers

The current hard-coded Buddy/Test builder login is legacy prototype behavior only.

A receiving player who chooses to build their own dungeon must never be sent to that screen.

The account-registration path is a separate product path.

## 8. Acceptance additions

In addition to all prior S8A tests, browser acceptance must prove on a mobile-sized viewport:

1. Screen 1 is readable without scrolling and shows the animated Hero-Runner plus a large ACCEPT CHALLENGE button.
2. After accept, the player can state the mission from the visible UI without opening help: get the Hero to the exit close to the target HP, not kill him.
3. The target percentage is visually dominant.
4. The novice path can be completed without opening customization.
5. Optional customization uses dedicated toggleable category panels, not a long vertically stacked control list.
6. Essential controls do not require scrolling to locate.
7. Primary buttons are large, bright and comfortably tappable.
8. OVERVIEW visibly changes camera composition and toggles back via FOLLOW HERO.
9. Reward screen is dedicated/full-screen and distinguishes friend Hero gold from receiver gold.
10. BUILD YOUR OWN / SAVE THIS GOAL opens the registration/account-required screen and never the Buddy/Test login.

If the mobile journey requires substantial scrolling to find the next primary action, S8A does not pass.