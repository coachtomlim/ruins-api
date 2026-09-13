# WEB-FLARE S8B Owner Decision Packet 001

This packet captures the first decisions that will materially shape persistent progression. They do not block current S8A guest/reward implementation, but they must be resolved before the account-backed progression build.

## Decision 1: What is a persistent Runner?

### A. One owned Runner grows over time — recommended

New player starts with one Rookie Warrior. Gold improves that Runner's HP / ATK / DEF, weapon and armor. Displayed level can later derive from progression milestones.

Current prototype L2/L3 fixed runners remain legacy/demo snapshots until mapped into progression.

**Why recommended:** strongest connection between earned Gold and visible ownership/progression; least duplication; easiest to understand on mobile.

### B. Multiple fixed Runner templates, each separately upgradeable

Player can own several Runners and spend Gold on each.

**Trade-off:** richer collection game, but much more inventory, balance and onboarding complexity.

### C. Keep L1/L2/L3 freely selectable forever

**Not recommended:** free stronger tiers weaken the purpose of earning Gold for progression.

## Decision 2: Armor granularity for v1

### A. `WEAPON + ARMOR SET` — recommended

One Weapon slot and one Armor slot. An Armor item may visually compose several stock Flare avatar layers (cuirass, coif, gloves, greaves, boots) while remaining one purchase/loadout choice.

**Why recommended:** strong visible progression without turning the phone UI into a full RPG inventory grid.

### B. Multi-slot armor immediately

Head / chest / hands / legs / feet / shield plus weapon.

**Trade-off:** much deeper gear game, but significantly more pricing, balancing, ownership and UI work.

The prepared catalog schema can evolve to B later because visual layers are already separated from gameplay modifiers.

## Decision 3: When is a reward permanently banked?

### Recommended rule

- Guest receiver may retry/edit freely. `SAVE THIS GOAL & BUILD YOUR OWN` starts registration and, after successful account creation, settles the current run once.
- Signed-in receiver may retry/edit freely until explicitly choosing `CLAIM REWARD / FINISH CHALLENGE`.
- Settlement credits Hero Gold to sender and Builder Gold to receiver exactly once.
- Replays after settlement are practice and do not mint more Gold for the same challenge-receiver session.

**Why recommended:** lets players improve their precision result before banking it, while preventing replay farming.

Alternative: automatically settle the first successful clear. Simpler, but removes the value of retrying for a better precision reward.

## Decision 4: Starter persistent gear

### Recommended starter

- Rookie Warrior template
- Wooden Club already equipped
- default clothing as visual baseline
- no purchased armor yet

Gold then has immediate meaning: improve stats, buy a better weapon, or acquire armor.

Alternative: grant a starter armor item as well. This gives a fuller loadout but reduces the first visible progression gap.

## Pricing is intentionally not in this packet

Exact Gold prices, upgrade amounts and caps should be proposed only after deterministic reward velocity and the 100-point dungeon challenge ceiling are evaluated. The economy calibration plan is already prepared for that step.