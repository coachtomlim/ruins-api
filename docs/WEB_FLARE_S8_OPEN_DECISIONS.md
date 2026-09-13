# WEB-FLARE S8 Open Decisions

These items are deliberately unresolved. Codex must not invent answers during S8A implementation.

## OD-01 Persistent reward settlement trigger

Question: after retries/edits, which run becomes the persistent settlement in S8B?

Recommendation: account holder uses explicit `CLAIM / FINISH CHALLENGE`; guest conversion uses `SAVE THIS GOAL & BUILD YOUR OWN` to settle the current run.

Status: Owner decision required before S8B reward persistence.

## OD-02 Hero Gold on failed run

Should Hero Gold collected before death persist to the sender wallet?

Recommendation: yes if collected Gold is literal loot, but settle only once under anti-farming rules.

Status: Owner decision required before S8B settlement.

## OD-03 Account backend

Leading candidate: Supabase Auth + PostgreSQL.

Status: evaluation recommended; no provider authorized yet.

## OD-04 Challenge sender identity

Persistent S8B challenges should normally have an authenticated sender owner so Hero rewards have a wallet destination.

Status: confirm before persistent challenge creation.

## OD-05 Runner progression economy

**Resolved:** persisted Gold improves the player's own Runner via permanent HP/ATK/DEF upgrades and equipment.

**Resolved slots:** `WEAPON`, `SHIELD`, `HEAD`, `CHEST`, `HANDS`, `LEGS`, `FEET`.

**Resolved starter:** Wooden Club +4 ATK, Wooden Shield +1 DEF, no starter armor pieces.

Still unresolved:

- exact Gold prices;
- stat upgrade caps/tiers;
- later item catalog and modifiers;
- whether later items are purchased once, upgraded through tiers, or both;
- relationship between progression and displayed Runner level.

## OD-06 Public challenge lifetime

Expiry/revocation behavior for persistent challenge links is not yet defined.

## OD-07 Persistent invite format

Recommendation: S8B persistent challenges use a new isolated opaque challenge token route while `/m/XXXX` remains frozen for S8A.

Status: decide with backend architecture.

## OD-08 Post-registration landing

Recommendation: preserve conversion momentum and land directly on a builder with the saved goal visibly loaded, while also storing it in the account.

Status: Owner confirmation required before S8B UX implementation.

## OD-09 Starter content beyond Runner gear

Runner starter gear is resolved: Wooden Club + Wooden Shield only, with no head/chest/hands/legs/feet armor.

Still open: which rooms, monsters, traps and supports are globally available versus account-owned/unlocked content in the later progression game.

Do not create artificial restrictions in S8A.

## OD-10 Equipment acquisition experience

The player should experience the first acquisition of visible gear such as boots or head gear. Exact acquisition mix remains open:

- direct Gold purchase;
- reward/drop acquisition;
- unlock-then-purchase;
- hybrid.

Architecture should support ownership from either purchase or reward source without deciding the mix yet.
