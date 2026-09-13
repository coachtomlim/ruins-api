# WEB-FLARE S8A Accessibility and Touch Contract

This is a phone-first acceptance contract for the receiver journey.

## Touch targets

- Primary buttons: target height 52-56px where practical; never below 44px.
- Secondary action buttons: never below 44px.
- Room arrows and category tabs must have at least a 44x44px interactive box.
- Spacing must prevent accidental activation of adjacent destructive or navigation actions.

## Readability

- Normal instructional text should render at approximately 16px or larger on phone.
- Critical mission text and target percentage must be substantially larger than supporting copy.
- Do not use tiny helper text as the only place where a rule is explained.
- Contrast must remain readable over the existing dark/plum palette.

## Viewport behavior

At 360x800, 390x844 and 430x932:

- the active panel's primary action is visible without hunting down a long page;
- the mission statement and reward incentive are visible before the receiver chooses a dungeon;
- customization is category-based and does not expose all controls at once;
- fixed/sticky elements must not cover the active button or important text;
- safe-area insets on iPhone must not hide bottom actions.

## Motion

- reduced-motion mode must preserve the same content and controls;
- invitation Hero uses a stable stance frame when motion is reduced;
- camera mode switches remain immediate and comprehensible without animated easing.

## Semantic behavior

- all primary and secondary actions are native button/link controls or equivalent accessible controls;
- active customization category and active camera mode expose state to assistive technology;
- focus order follows the visible panel, not hidden off-screen panels;
- hidden panels must not retain keyboard focusability.

## Required automated checks

The next build should measure button rectangles, font sizes for critical copy, active panel bounds, viewport overflow, and hidden-panel focusability. These checks supplement visual review rather than replacing it.
