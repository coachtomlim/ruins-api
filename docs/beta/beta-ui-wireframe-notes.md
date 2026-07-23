# Ruins Beta UI Wireframe Notes

## Primary Layout Direction

Beta should be mobile-first portrait, then scale to tablet/desktop.

## Screen Shell

Top bar:
- game title
- save/load button
- menu/settings button

Main viewport:
- large room/scene image
- optional enemy overlay in combat

Event log strip:
- player command and system response timeline
- collapsible on mobile

Action area:
- context-sensitive button grid
- exploration actions
- combat actions
- store actions

Bottom status:
- HP/ATF/DEF/EVA (compact cards)
- current room name
- key flags indicator (poisoned, prism assembled, etc)

## Required Modal/Drawer UX

- Inventory drawer (icons + quantities + use/equip actions)
- Journal drawer (entry list + details)
- Map overlay (full screen on mobile)
- Save/Load panel

## Combat Wireframe Notes

- enemy portrait + name + HP bar
- player HP bar + compact stats
- action row:
  - Attack Once
  - Fight till the End
  - Run
  - Use Item
- scroll quick-use chips when available
- rolling event log (hit/miss/damage/effects)

## Prologue Scene Notes

- must show Adventurer's Inn context
- Sheja dialogue panel + response actions:
  - Quest
  - Monsters
  - Offer
  - Negotiate
  - Bargain
  - Accept

## Boss Chamber Notes

- precondition messaging if girdle missing
- boss intro visual state
- defeat state transition to artifact pickup state
- ending confirmation state

## Accessibility / Touch Notes

- 44px+ touch targets
- avoid hidden/overlapping controls on mobile keyboard open
- clear contrast and focus styles
- avoid horizontal scrolling in gameplay screens
