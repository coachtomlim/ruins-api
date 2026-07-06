# Journal Canon

## Journal Role

- `LOCKED`: The Adventurer's Journal is a core gameplay system, not flavor only.
- `LOCKED`: The journal tracks quest objective, lore, scroll effectiveness, discoveries, and final status.
- `LOCKED`: Journal is available outside combat.
- `LOCKED`: Journal can be read with `Read Journal` or equivalent journal command.
- `LIKELY`: Entries are chronological by discovery.
- `LIKELY`: Entries cannot be deleted or reordered by the player.

## Known Entry Families

- `LOCKED`: Initial quest objective.
- `LOCKED`: Room 1 altar/prism face scroll clues:
  - Fog of Confusion is super effective against Imp.
  - Pulse of Calm is super effective against Musca.
  - Heart Beacon is super effective against Lizardman.
- `LOCKED`: Shrine prophecy / Armour of Light.
- `LOCKED`: Cure All Stats Potion explanation.
- `LOCKED`: Guardroom / Camelot party-role lore.
- `LOCKED`: Galania, Xerces, and Cult of Asherah lore.
- `LOCKED`: Prism assembly and final chamber unlock.
- `LOCKED`: Final entry: `Hero who overcame the Voices of Care and awakened the Prophecy of the Stone.`
- `LIKELY`: Run penalty reflection entry.
- `LIKELY`: Prism Fragment C / assembly readiness entry.

## Trigger Rules

- `LOCKED`: Examining Room 1 altar faces adds scroll clue entries.
- `LOCKED`: Examining shrine/murals/scribbles/lore objects adds lore entries.
- `LOCKED`: Major item acquisition and assembly can add entries.
- `LOCKED`: Final artifact/cutscene adds final entry.
- `UNKNOWN`: Whether journal entries should be added at item discovery, item pickup, or item examination for each room.
- `UNKNOWN`: Whether duplicate entries are suppressed by exact text, entry id, or trigger flag.

## Numbering Caveat

- `CONFLICTED`: Journal numbering differs across documents. Future schemas should use stable entry ids such as `journal.scroll.fog_vs_imp` rather than relying on numeric sequence as canonical identity.
