# Inventory Canon

## Inventory Principles

- `LOCKED`: Inventory tracks quest items, consumables, scrolls, equipment, readable items, gold, and state flags.
- `LOCKED`: Inventory can be viewed with `Inventory`.
- `LOCKED`: Items must be manually acquired with `Pick` or `Get` commands unless an item is explicitly an initial item or explicit automatic story reward.
- `LOCKED`: Post-test fixes say items are never silently added during exploration.
- `LOCKED`: Used scrolls and single-use items are removed after use.
- `LIKELY`: Items cannot be dropped, and there is no encumbrance or carry limit.

## Initial Inventory

- `LOCKED`: Player starts with `Prism Fragment A`.
- `LOCKED`: Player starts with `Adventurer's Journal`.
- `LIKELY`: Initial quest reward promise starts at `700g`; actual gold handling depends on negotiation and ending rules.

## Item Categories

- `LOCKED`: Quest/key items include Prism Fragments, assembled Prism, Hexagonal Glass Piece, Sound-Deflecting Girdle, and Merlin's Tetrahedronal.
- `LOCKED`: Scrolls are single-use combat consumables.
- `LOCKED`: Cure All Stats Potion is a single-use restorative item.
- `LOCKED`: Store items include Shield, Minor Combat Healing Potion, and Hose of Speed in the `Adventure Game Design V3 - Alpha` store model.
- `LIKELY`: Readable lore objects should add journal entries rather than behave like normal consumables.

## Use and Equipment

- `LOCKED`: Scrolls can be used during combat.
- `LOCKED`: `Assemble` activates only when all three Prism Fragments are held.
- `LOCKED`: Sound-Deflecting Girdle auto-triggers in Room 10 if possessed.
- `LOCKED`: Shield grants `+2 DEF`.
- `LOCKED`: Hose of Speed grants `+1 EVA`.
- `LOCKED`: Minor Combat Healing Potion auto-triggers when HP falls below `10`.
- `LOCKED`: Equipment boosts apply during the final boss fight but do not transfer to the Banshee's mirrored stats.
- `UNKNOWN`: Whether Shield/Hose bonuses modify base stats, derived stats, or a separate equipment modifier bucket.

## Store

- `LOCKED`: `Adventure Game Design V3 - Alpha` says Room 9 store appears only if the Prism has been assembled and the store has not yet triggered.
- `LOCKED`: Store items and prices:
  - Shield of the Lionheart: `400g`, `+2 DEF`
  - Minor Combat Healing Potion: `350g`, auto-heal at `HP < 10`
  - Hose of Speed: `450g`, `+1 EVA`
- `LOCKED`: Player uses `Buy 1`, `Buy 2`, etc., then `Equip`.
- `LOCKED`: Gold cannot fall below `0`.
- `CONFLICTED`: Later Beta-style Room 9 documents emphasize prism seal assembly and may omit or relocate the store.

## Save-Sensitive Inventory

- `LOCKED`: Save state must include inventory and room/event flags.
- `LIKELY`: Save state should include item visibility/picked-up status separately from held inventory.
- `UNKNOWN`: Whether auto-save before boss stores equipment state as of Room 10 entry or immediately before boss combat after entry triggers.
