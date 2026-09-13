# WEB-FLARE S8 Open Decisions

These items are deliberately unresolved. Codex must not invent answers during S8A implementation.

## OD-01 Persistent reward settlement trigger

Question: after multiple retries/edits, which run becomes the one persistent reward settlement in S8B?

Recommendation: account holder uses explicit `CLAIM / FINISH CHALLENGE`; guest conversion uses `SAVE THIS GOAL & BUILD YOUR OWN` to settle the current run.

Status: Owner decision required before S8B reward persistence.

## OD-02 Hero gold on failed run

Current S8A display rule may show gold actually collected before death while Builder reward remains zero.

Question: should that Hero gold persist to the sender wallet in S8B if the Hero did not clear?

Recommendation: yes, if product meaning is literally gold the Hero physically collected, but settle only once under anti-farming rules.

Status: Owner decision required before S8B settlement.

## OD-03 Account backend

Leading candidate: Supabase Auth + PostgreSQL.

Status: evaluation recommended; no provider authorized yet.

## OD-04 Challenge sender identity

S8A continues display-name sender context. Persistent S8B challenges should normally have an authenticated sender owner so Hero rewards have a wallet destination.

Status: confirm before persistent challenge creation.

## OD-05 Runner progression economy

**Resolved product purpose:** persisted Gold is spent on improving the player's own Hero-Runner through:

- permanent Runner stat upgrades: HP, ATK, DEF;
- equipment, initially the `WEAPON` slot;
- armor, initially the `ARMOR` slot.

Still unresolved before progression spending is implemented:

- exact Gold prices;
- stat-upgrade caps/tiers;
- exact weapon catalog and modifiers;
- exact armor catalog and modifiers;
- whether items are one-time purchases, tier upgrades, or both;
- relationship between persistent progression and displayed Runner level.

Status: Gold purpose is locked. Pricing/catalog/balance values remain Owner decisions. Codex must not invent them during S8A.

## OD-06 Public challenge lifetime

Expiry/revocation behavior for persistent challenge links is not yet defined.

Status: defer until S8B challenge persistence design.

## OD-07 Persistent invite format

The stateless four-character invite cannot uniquely identify sender ownership, settlement or run history.

Recommendation: S8B persistent challenges use a new isolated opaque challenge token route while `/m/XXXX` remains frozen for S8A.

Status: decide with backend architecture.

## OD-08 Post-registration landing

After a receiver creates an account, should the saved incoming goal open directly into a dungeon-building workspace, become a reusable goal template, or first land on a new player home screen?

Recommendation: preserve the conversion momentum and land directly on a builder with the saved goal visibly loaded, while also storing it in the account.

Status: Owner confirmation required before S8B UX implementation.

## OD-09 Starter assets

Which rooms, monsters, traps, supports and runners become owned starter assets versus globally available catalog content is not yet defined.

Status: do not create artificial ownership restrictions in S8A or the S8B account foundation. Decide as part of progression/economy design.
