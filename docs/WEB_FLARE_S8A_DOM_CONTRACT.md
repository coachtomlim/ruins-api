# WEB-FLARE S8A DOM Contract

Purpose: give the one-go implementation and browser tests stable selectors without dictating internal rendering architecture.

## Screen roots

Each receiver panel must expose exactly one of:

- `[data-screen="invitation"]`
- `[data-screen="mission"]`
- `[data-screen="customize"]`
- `[data-screen="ready"]`
- `[data-screen="runtime"]`
- `[data-screen="rewards"]`
- `[data-screen="registration"]`

Inactive screen roots use `hidden`. Do not keep multiple interactive panels exposed off-screen to accessibility APIs.

## Invitation

- heading: `#heading-invitation`
- animated Hero canvas: `#inviteHeroCanvas`
- sender: `#senderName`
- runner: `#inviteRunner`
- target: `#inviteTarget`
- primary: `#acceptChallenge`

## Mission and room choice

- heading: `#heading-mission`
- dominant target: `#missionTarget`
- reward cue: `#missionRewardCue`
- target-fit cue: `#targetFitCue`
- room canvas: `#roomPreview`
- room name: `#roomName`
- room counter: `#roomCounter`
- previous: `#previousRoom`
- next: `#nextRoom`
- use room: `#useDungeon`
- optional customization: `#openCustomize`

## Customization

- heading: `#heading-customize`
- budget: `#dungeonBudget`
- tabs: `[data-custom-tab="monsters"]`, `[data-custom-tab="traps"]`, `[data-custom-tab="supports"]`
- category panels: `[data-custom-panel="monsters"]`, `[data-custom-panel="traps"]`, `[data-custom-panel="supports"]`
- done: `#finishCustomize`

Only one category panel is visible at once.

## Ready

- heading: `#heading-ready`
- target: `#readyTarget`
- summary: `#readySummary`
- run: `#runHero`
- edit: `#editDungeon`

## Runtime

- heading: `#heading-runtime`
- game canvas: `#scene`
- HP: `#heroHp`
- Hero Gold: `#heroGoldHud`
- time: `#runTime`
- camera toggle: `#cameraToggle`
- pause toggle: `#pauseToggle`

Camera toggle text is `OVERVIEW` in follow mode and `FOLLOW HERO` in overview mode.

## Rewards

- heading: `#heading-rewards`
- score: `#resultScore`
- actual/target: `#resultTargetMatch`
- Hero reward card: `#heroReward`
- Hero Gold value: `#heroRewardGold`
- Builder reward card: `#builderReward`
- Builder Gold value: `#builderRewardGold`
- run again: `#runAgain`
- edit: `#editThisDungeon`
- conversion: `#saveGoalBuildOwn`

## Registration

- heading: `#heading-registration`
- carried goal: `#registrationGoal`
- reward preview: `#registrationRewardPreview`
- persistence notice: `#registrationNotSaved`
- create account: `#createAccount`
- back: `#backToRewards`

In S8A `#createAccount` is present but disabled because no account provider is connected.

## Accessibility and focus

Every panel root has `aria-labelledby` pointing at its heading ID. On panel transition, move programmatic focus to the new heading. When closing customization or registration, restore focus according to the prepared focus policy.

## Browser-test rule

Browser tests should prefer these stable IDs/data attributes over CSS layout classes. Styling may change without invalidating interaction tests.
