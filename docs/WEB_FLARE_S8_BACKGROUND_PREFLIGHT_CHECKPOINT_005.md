# WEB-FLARE S8 Background Preflight Checkpoint 005

## Scope

Durable recovery point after Owner clarified that earned Gold must upgrade the player's own Hero-Runner through stats, equipment and armor.

No live deployment was executed. S7.1 remains the accepted live baseline. Vercel Git auto-deployment remains disabled on this S8 branch.

## Product progression truth now locked

`RECEIVE CHALLENGE -> BUILD DUNGEON -> EARN GOLD -> UPGRADE YOUR RUNNER -> SEND YOUR OWN CHALLENGE`

Gold progression categories:

- permanent HP / ATK / DEF upgrades;
- `WEAPON` equipment;
- `ARMOR` equipment.

Dungeon Budget remains separate from account Gold.

## Prepared progression modules

- `public/flare-s8a/runner-progression.mjs`
- `public/flare-s8a/runner-snapshot.mjs`
- `public/flare-s8a/progression-catalog.mjs`
- `public/flare-s8a/progression-purchase.mjs`
- `public/flare-s8a/runner-loadout.mjs`
- `public/flare-s8a/progression-view-model.mjs`
- `public/flare-s8a/progression-purchase-view.mjs`
- `public/flare-s8a/progression-state.mjs`
- `public/flare-s8a/runner-calibration.mjs`
- `public/flare-s8b/progression-ledger.mjs`
- `public/flare-s8b/challenge-envelope.mjs`

## Prepared progression contracts

- `docs/WEB_FLARE_S8B_RUNNER_PROGRESSION_CONTRACT.md`
- `docs/WEB_FLARE_S8B_RUNNER_UPGRADE_TRANSACTION_CONTRACT.md`
- `docs/WEB_FLARE_S8B_RUNNER_PROGRESS_DATA_MODEL.md`
- `docs/WEB_FLARE_S8B_RUNNER_PROGRESSION_UX_CONTRACT.md`
- `docs/WEB_FLARE_S8B_PROGRESSION_ECONOMY_CALIBRATION_PLAN.md`
- `docs/WEB_FLARE_S8B_EQUIPMENT_VISUAL_CONTRACT.md`

Account API contract, Gold ledger contract, account data model, asset ownership contract, reward copy and S8 open-decision register were also updated for Runner progression.

## Prepared tests

Focused tests now cover:

- effective stats from base + permanent bonuses + weapon + armor;
- immutable challenge Runner snapshot;
- catalog validation;
- purchase affordability and explicit debit intent;
- cross-player/wrong-slot loadout rejection;
- progression view-model affordability;
- state derivation from purchased upgrades and owned gear;
- non-negative Gold ledger spending;
- progressed Runner calibration adapter;
- persistent challenge envelope excludes receiver dungeon choices;
- equipment visual-layer metadata.

## Stock-Flare visual direction

Pinned Flare avatar assets already expose independent gear layers such as `battle_axe`, `buckler`, `chain_cuirass`, `chain_coif`, `chain_gloves`, `chain_greaves` and `chain_boots`.

The schema now allows an item to carry one or more `avatarLayers` separately from gameplay modifiers. This permits a simple Armor bundle now and a richer slot model later without changing historic combat authority.

## Decisions intentionally not forced yet

No decision is required from the Owner yet to continue preparation.

Still unresolved before persistent progression/shop implementation:

- exact Gold prices;
- HP / ATK / DEF upgrade amounts and caps;
- exact starter weapon/armor catalog;
- simple Armor bundle vs later multi-slot armor;
- Runner level relationship to persistent progression;
- persistent reward settlement trigger;
- account backend/provider.

The economy calibration plan defines how to bring concrete options back to the Owner rather than asking for arbitrary numbers now.

## Key recent commits

- `f5f0fbef3c37932f00a21df14c022511095b0a49` progression product contract
- `7fad402da26e619c01a9db47b85a8d7f7706a5ac` Runner progression composition helper
- `0318fd4ccddd670f87575a24a36062a9a9b95bf2` immutable Runner snapshot helper
- `ef0947ce123f3abecea3a53cd213daed2bddfd55` progression catalog schema
- `906c73fe9c4787930c8ec2d2b953fd7bba467c53` purchase quote/debit intent
- `a4c68166546ba6f9a9b327e38b6507e854dd2a1e` loadout ownership validation
- `7bb142212b5451d8c349d08bb9b99787d60c8f97` progression view model
- `56384f3631ac69b632c2fe61e92d79f01b510b9d` progression ledger debit helper
- `53cc64e23f9602d7e33ae52e5040065fa2c60101` Runner progression data model
- `7dbf63b83f3da361ca05e900f10293797c55d885` account API progression extension
- `0b06bd9eac1938ab6aa106584bc23bd70ad2f374` economy calibration plan
- `c454b23c8f81421436d6ba9dec199d585f08e9b1` equipment visual contract

## Next safe preparation

Continue building provider-neutral progression transaction/state tests, challenge-snapshot compatibility and mobile progression UI contracts. Do not select prices, caps or auth provider until a true decision gate is reached.