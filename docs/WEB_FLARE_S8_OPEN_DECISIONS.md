# WEB-FLARE S8 Open Decisions

These items are deliberately unresolved unless marked resolved below. Do not invent answers during implementation.

## OD-01 Persistent reward settlement trigger

Question: after retries/edits, which run becomes the persistent settlement in S8B?

Recommendation: account holder uses explicit `CLAIM / FINISH CHALLENGE`; guest conversion uses `SAVE THIS GOAL & BUILD YOUR OWN` to settle the current run.

Status: Owner decision required before S8B reward persistence is activated.

## OD-02 Hero Gold on failed run

Should Hero Gold collected before death persist to the sender wallet?

Recommendation: yes if collected Gold is literal loot, but settle only once under anti-farming rules.

Status: Owner decision required before S8B settlement.

## OD-03 Account backend

**Resolved:** Supabase Auth + PostgreSQL selected as the Dungeon Runner S8B application backend after the isolated provider proof passed.

Staging authority:

- project: `Dungeon Runner S8B Staging`
- project ref: `qpgwqmduqtqidmhbuclw`
- region: `ap-southeast-1`
- production email confirmation: REQUIRED

Gamma Mission Control remains `CONTROL_PLANE_ONLY` and is not the Dungeon Runner application database.

Canonical decision detail:

`docs/WEB_FLARE_S8B_SUPABASE_SELECTION_AND_PROOF_ACCEPTANCE.md`

## OD-04 Challenge sender identity

Persistent S8B challenges should normally have an authenticated sender owner so Hero rewards have a wallet destination.

Status: confirm before persistent challenge creation.

## OD-05 Runner progression economy

**Resolved:** persisted Gold improves the player's own Runner via permanent HP/ATK/DEF upgrades and equipment.

**Resolved slots:** `WEAPON`, `SHIELD`, `HEAD`, `CHEST`, `HANDS`, `LEGS`, `FEET`.

**Resolved starter:** Wooden Club +4 ATK, Wooden Shield +1 DEF, no starter armor pieces.

**Resolved calibration policy:**

- atomic permanent-stat units: `+5 HP`, `+1 ATK`, `+1 DEF`;
- fixed Dungeon Budget remains `100`;
- launch progression must keep projected effective Runner state inside the versioned `PREFERRED` challengeability envelope;
- cumulative projected power governs progression eligibility rather than independent stat maxima;
- armor and stat training share one cumulative power envelope;
- armor slots do not default to `+1 DEF` each;
- deeper progression requires stronger governed dungeon content rather than silently raising Dungeon Budget.

Candidate Gold bands are accepted as **pacing guidance only**, not exact offer prices:

- `+5 HP`: 20-25 Gold;
- `+1 ATK`: 25-35 Gold;
- `+1 DEF`: 35-50 Gold;
- modest first armor piece: 25-40 Gold.

Still unresolved:

- exact Gold price for each concrete offer;
- concrete later item catalog and modifiers;
- equipment upgrade tiers;
- relationship between progression and displayed Runner level;
- exact acquisition mix across purchase, drops/rewards and future trade.

Canonical calibration acceptance:

`docs/WEB_FLARE_S8B_ECONOMY_CALIBRATION_ACCEPTANCE_001.md`

## OD-06 Public challenge lifetime

Expiry/revocation behavior for persistent challenge links is not yet defined.

## OD-07 Persistent invite format

Recommendation: S8B persistent challenges use a new isolated opaque challenge token route while `/m/XXXX` remains frozen for S8A.

Status: decide before persistent challenge activation.

## OD-08 Post-registration landing

Recommendation: preserve conversion momentum and land directly on a builder with the saved goal visibly loaded, while also storing it in the account.

Status: Owner confirmation required before conversion UX implementation.

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
