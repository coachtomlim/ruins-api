# WEB-FLARE S8B Data Lifecycle Contract

## Purpose

Prepare account persistence so stored game data has a clear lifecycle before production use.

## Guest data

Guest S8A play remains memory-only. S8B may introduce short-lived server claim records for conversion, but guest reward claims should have an explicit expiry and cleanup policy.

## Account data

Persistent account data includes only what is needed for the game experience and reconciliation:

- player profile identity reference and display name;
- saved goals;
- owned assets;
- saved dungeons;
- challenge/run history;
- immutable gold ledger entries.

Do not store plaintext credentials in the game database.

## Historic integrity

Ledger and canonical run records may need retention after user-facing saved items are deleted because they support fraud prevention, reconciliation and transaction history. Product/privacy policy must define the legal/operational retention period before launch.

## Account deletion

Before production launch, decide how account deletion handles:

- profile deletion/anonymization;
- public challenge links authored by the player;
- immutable financial-like game ledger history;
- saved goals/dungeons/assets;
- challenge/run references involving other players.

Deletion must not silently corrupt another player's history.

## Export

The architecture should permit export of player-owned profile, saved goals, assets, challenge/run history and gold ledger where required.

## Logs and telemetry

Avoid including email, auth tokens, passwords or free-form private data in application logs and product telemetry.
