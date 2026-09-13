# WEB-FLARE S8B Progression Security Test Matrix

## Purpose

Define the minimum security/reconciliation tests for persistent Gold-funded Runner upgrades before any production account rollout.

## Wallet and purchase tests

1. Browser-submitted Gold price is ignored; server catalog price wins.
2. Browser-submitted wallet balance is ignored; server ledger-derived balance wins.
3. Purchase that would make Gold negative is rejected atomically.
4. Duplicate idempotency key returns the original purchase result without another debit.
5. Two concurrent purchases that together exceed balance cannot both commit.
6. Stale catalog/version returns a refresh/requote result and does not silently charge a changed amount.
7. Unknown/disabled offer is rejected.
8. Upgrade beyond configured tier/cap is rejected.

## Ownership tests

9. Player A cannot upgrade Player B's Runner.
10. Player A cannot equip Player B's item.
11. Revoked/inactive ownership cannot be equipped.
12. Weapon cannot be placed in Armor slot and Armor cannot be placed in Weapon slot.
13. Equipping an already-owned item does not create an extra Gold debit.

## Stat integrity tests

14. Permanent stat upgrade applies exactly once.
15. Equipped weapon modifier applies exactly once.
16. Equipped armor modifier applies exactly once.
17. Unequipped item contributes no stats.
18. Effective stats can be re-derived from base template + upgrade records + loadout.
19. Client cannot directly write effective HP / ATK / DEF totals.

## Challenge integrity tests

20. Challenge creation records the current effective Runner snapshot.
21. Later purchase does not modify prior challenge snapshot.
22. Later loadout change does not modify prior challenge snapshot.
23. Challenge sender payload cannot inject room, monsters, traps or supports.
24. Receiver calibration uses the challenge Runner snapshot, not the sender's current post-challenge Runner state.

## Reward-to-progression tests

25. Builder Gold settles only to receiver owner.
26. Hero Gold settles only to sender owner.
27. Practice/replay after settled challenge does not mint duplicate persistent Gold.
28. Purchase uses only already-settled Gold, never unclaimed preview Gold.
29. Dungeon Budget cannot be converted into account Gold and account Gold is not consumed by dungeon construction.

## Failure/retry tests

30. Unknown purchase response is reconciled by reading authoritative ledger/progression state before retry.
31. Interrupted equip request resolves to one authoritative loadout.
32. Database/API failure cannot leave debit committed without corresponding purchased progression state.
33. Database/API failure cannot grant progression state without corresponding debit when the offer costs Gold.

## Acceptance

Persistent progression cannot ship until all applicable tests pass against the chosen backend and authenticated staging environment.