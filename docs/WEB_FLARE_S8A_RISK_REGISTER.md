# WEB-FLARE S8A Risk Register

This file lists implementation risks that must be checked before S8A is accepted.

## R1 Mission is misunderstood
Risk: the receiver thinks the aim is to defeat the Hero.
Mitigation: target-first mission copy, explicit successful-clear wording, and visible reward incentive.
Block if: the player must infer the mission from secondary text.

## R2 Mobile UI becomes a long page
Risk: controls become tiny or buried below scrolling content.
Mitigation: dedicated panels for MONSTERS, TRAPS and SUPPORTS, one category active at a time, large primary actions.
Block if: the novice path requires searching down the page for the next action.

## R3 Overview appears active but camera does not change
Mitigation: require measurable camera-scale/position change plus browser evidence.
Block if: only button text or a boolean state changes.

## R4 Failure earns Builder Gold
Mitigation: Builder reward only for a successful clear.
Block if: dead, blocked or timeout outcomes produce Builder Gold.

## R5 Hero Gold and Builder Gold are confused
Mitigation: separate reward cards and ownership labels.
Block if: the two values are combined into one guest total.

## R6 Run Again changes hidden gameplay inputs
Mitigation: preserve canonical room, encounter and target inputs.
Block if: replay recalibrates or resets before running.

## R7 Edit Dungeon loses the current build
Mitigation: keep selected room and encounter choices in current page state.
Block if: Edit Dungeon returns to defaults.

## R8 Build Your Own returns to the prototype Buddy screen
Mitigation: dedicated registration panel.
Block if: the conversion path exposes or routes through Buddy/Test.

## R9 S8A accidentally becomes real account implementation
Mitigation: registration remains a memory-only gate in S8A.
Block if: S8A introduces durable account ownership or a real account service.

## R10 Frozen releases move
Mitigation: additive S8A files and predecessor-diff verification.
Block if: S2-S7.1 change.

## R11 Live deployment becomes the debugging loop
Mitigation: full local/browser acceptance before one controlled HostGator pass.
Block if: live deployment is needed merely to discover ordinary UI defects.

## R12 Vercel drift
Mitigation: Vercel remains explicitly outside S8 authority.
Block if: any S8 implementation or release step depends on a Vercel change.
