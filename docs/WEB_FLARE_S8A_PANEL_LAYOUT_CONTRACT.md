# WEB-FLARE S8A Single-Viewport Panel Layout Contract

## Purpose

Keep the receiver journey game-like on portrait phones. Primary actions must not be hidden below a long page.

## Global panel shell

Each active receiver state uses one viewport-sized panel with three zones:

1. top context zone: title/status, compact;
2. main content zone: one primary game decision or visualization;
3. bottom action zone: one dominant CTA plus at most one or two secondary actions.

The bottom action zone may be sticky within the panel when needed, respecting safe-area inset.

## Invitation

Main content: animated Hero-Runner and concise invitation. Avoid rule lists.

Bottom CTA: `ACCEPT CHALLENGE`.

## Mission + Dungeon

Top/main content must show target mission before room controls:

`GET THE HERO TO THE EXIT AT ~[TARGET]% HP`

Mission text and reward cue share the same viewport as the currently selected room preview.

Bottom CTA: `USE THIS DUNGEON`.

Secondary: `CUSTOMIZE - OPTIONAL`.

## Customize

Header includes always-visible budget.

Main content shows one category only: MONSTERS, TRAPS or SUPPORTS.

Category switchers remain visible without scrolling to another section.

Bottom CTA: `DONE`.

If category contents exceed the available inner content zone, only the category body may scroll. The overall page should not require a long document scroll to reach DONE.

## Ready

Compact summary of room, target and spend. No duplicate long explanations.

Bottom CTA: `RUN THE HERO`.

Secondary: `EDIT DUNGEON`.

## Runtime

Canvas occupies dominant main content.

Runtime controls remain visible: `OVERVIEW`/`FOLLOW HERO` and `PAUSE`/`RESUME`.

Do not place essential controls below the canvas where they require page scrolling.

## Rewards

Full panel, not battlefield overlay.

Order: result -> score/target -> two reward cards -> actions.

Primary continuation: `SAVE THIS GOAL & BUILD YOUR OWN`.

Immediate game actions `RUN AGAIN` and `EDIT THIS DUNGEON` remain clearly available.

## Registration

Dedicated account-conversion panel with carry-forward goal/reward context and `BACK TO REWARDS`.

No prototype login fields.
