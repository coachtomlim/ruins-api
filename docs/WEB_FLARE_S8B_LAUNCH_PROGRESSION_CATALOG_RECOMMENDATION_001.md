# WEB-FLARE S8B Launch Progression Catalog Recommendation 001

## Status

`OWNER REVIEW CANDIDATE — NOT ACTIVATED`

This packet proposes the smallest useful first purchasable stat catalog after acceptance of the OD-05 calibration policy and completion of the secure purchase transaction foundation.

It does not insert a catalog version or offer into Supabase.

## Recommended first catalog

Proposed catalog identity:

`s8b-launch-progression-001`

Calibration authority:

`s8b-economy-calibration-001`

Recommended offers:

| Offer | Effect | Gold | Why |
| --- | ---: | ---: | --- |
| Endurance I | +5 HP | 20 | immediate first progression after one strong 20-Gold clear |
| Strike I | +1 ATK | 30 | stronger offensive value; requires accumulation beyond one ordinary strong clear |
| Guard I | +1 DEF | 40 | highest defensive price because DEF consumes challengeability fastest in combination |

These exact prices are recommendations for Owner acceptance, not current authority.

## Why only three offers

Do not launch with multiple identical HP tiers yet.

A single offer per accepted atomic stat unit gives the first live progression loop without prematurely deciding:

- deeper tier sequencing;
- upgrade caps beyond the challengeability envelope;
- displayed Runner-level changes;
- item upgrade tiers.

The server-side envelope still governs combinations.

From the starter state `100/12/1`:

- Endurance I -> `105/12/1` PREFERRED
- Strike I -> `100/13/1` PREFERRED
- Guard I -> `100/12/2` PREFERRED

After Endurance I:

- Strike I -> `105/13/1` PREFERRED
- Guard I -> `105/12/2` PREFERRED

After Strike I without Endurance:

- Endurance I -> `105/13/1` PREFERRED
- Guard I -> `100/13/2`, not in the PREFERRED envelope

After Guard I without Endurance:

- Endurance I -> `105/12/2` PREFERRED
- Strike I -> `100/13/2`, not in the PREFERRED envelope

Therefore the first catalog naturally supports at most two compatible purchases without a separate hard-coded purchase-count cap.

The accepted challengeability envelope itself determines the allowed path.

## Reward pacing

Current clear-only Builder Gold bands are:

- 5
- 10
- 15
- 20
- 25

The recommended prices create a simple early cadence:

- Endurance I at 20 Gold can be reached by one strong clear;
- Strike I at 30 Gold requires a perfect clear plus additional Gold, or multiple clears;
- Guard I at 40 Gold corresponds to two strong 20-Gold clears.

This keeps the first upgrade visible and attainable while making the more challengeability-sensitive stats slower.

Final pacing still depends on the later reward-settlement decisions OD-01/OD-02 and live reward velocity.

## Equipment/armor recommendation

Do not put a purchasable armor item in this first catalog yet.

Reason:

- the secure purchase foundation can create item ownership but intentionally does not auto-equip;
- equip mutation still needs its own projected-state challengeability gate;
- OD-10 acquisition mix remains open;
- exact non-starter item modifier is not yet Owner-approved.

Stock Flare evidence confirms boots and other gear exist, so a first visible footwear acquisition does not require new art. The first gear slice should follow after the governed equip boundary is implemented and an exact item modifier/source is accepted.

## Activation conditions

If the Owner accepts these exact three prices, the next implementation may:

1. insert one `ACTIVE` catalog version using calibration `s8b-economy-calibration-001`;
2. insert exactly the three stat offers above as active;
3. add client read-only offer presentation;
4. keep purchase controls disabled until one more live staging proof confirms wallet debit and Runner projection through the real browser client;
5. keep equipment purchase and equip inactive.

No reward settlement decision is implied by accepting this catalog.
