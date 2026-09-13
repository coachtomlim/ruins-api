# WEB-FLARE S8 Gear Preparation Status

Current preparation is non-live and additive on `work/web-flare-s8a-rewards-replay-001`.

## Locked product direction

- Starter Runner has Wooden Club +4 ATK and Wooden Shield +1 DEF.
- Head, chest, hands, legs and feet begin empty.
- Item bonuses come from equipped items, not hidden base stats.
- Monsters that use the same item definition receive the same item modifier.
- Player gear may be acquired through starter grant, Gold purchase or dungeon-run award.
- A future player exchange mechanism remains reserved for later design.

## Prepared architecture

Equipment item identity is separated from purchase offers. This permits an item to exist as a run award without also being sold for Gold.

Prepared source modules cover:

- seven equipment slots;
- starter loadout decomposition;
- immutable Runner snapshots;
- source-independent equipment catalog;
- optional Gold purchase offers;
- source-aware acquisition presentation;
- mobile gear-slot and inventory views;
- player gear-instance identity and loadout validation;
- post-run gear award records;
- shared Runner/monster item modifier resolution;
- pinned stock-Flare visual identities.

## Deliberately open

No exact later item prices, modifiers, rarity, run-award frequency, duplicate-item policy or future exchange rules are locked yet.

## Verification

Focused tests have been added throughout the preparation. They must be executed during the bounded implementation build together with frozen predecessor verification and browser/mobile gates.

No HostGator deployment is part of this preparation.
