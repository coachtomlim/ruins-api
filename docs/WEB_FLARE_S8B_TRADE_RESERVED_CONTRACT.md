# WEB-FLARE S8B Trade Reserved Contract

## Status

Trade is a future possibility, not an active S8A/S8B feature.

The architecture may preserve enough provenance and ownership identity to support future transfer, but it must not expose trade, gifting, marketplace or transfer controls yet.

## Why reserve now

Gear may eventually move between players. Avoid data structures that assume every ownership record is permanent and non-transferable.

## Minimum future-safe requirements

- every owned item has a unique ownership identity;
- acquisition provenance is retained;
- active owner is explicit;
- revocation/transfer history can be added without rewriting historic reward/purchase evidence;
- item/catalog identity remains separate from ownership identity;
- equipped state references ownership, not merely catalog item ID.

## Not authorized

Do not implement or imply:

- player-to-player gifting;
- marketplace listings;
- Gold-for-item player trades;
- item-for-item swaps;
- auctions;
- escrow;
- trade taxes/fees;
- transfer of starter items;
- transfer of bound/soulbound items;
- cross-account equip.

All of those require separate product and abuse-prevention decisions.

## Security concern

Future Trade materially changes account security and economy abuse risk. Any implementation must include ownership locking, idempotent transfer settlement, double-spend prevention and audit history.
