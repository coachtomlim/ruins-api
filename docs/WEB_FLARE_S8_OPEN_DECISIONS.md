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

## OD-05 Reward economy spend

Gold earning is being introduced before spending/unlock rules.

Status: do not invent shops, purchases or asset prices in S8A/S8B account foundation work.

## OD-06 Public challenge lifetime

Expiry/revocation behavior for persistent challenge links is not yet defined.

Status: defer until S8B challenge persistence design.
