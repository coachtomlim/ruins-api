# Ruins Canon Index

This folder reconstructs the gameplay canon for **Forgotten Ruin of the Dark Galan / Ruins Adventure Game** from the CustomGPT archive. It is not an implementation plan by itself; it is the source-control layer that future code should cite before encoding gameplay behavior.

## Evidence Order

Use this order when interpreting conflicts:

1. `LOCKED`: `Adventure Game Design V3 - Alpha.docx` is the primary implementation base unless Thomas explicitly overrides a specific rule.
2. `LIKELY`: Frozen Alpha, post-test fixes, and later reconstruction documents that align with `Adventure Game Design V3 - Alpha` or fill gaps without changing behavior.
3. `CONFLICTED`: Later documents or JSON exports that disagree with the frozen build or each other.
4. `UNKNOWN`: Details that are implied but not sufficiently specified for deterministic implementation.

## Source Materials Reviewed

- `Adventure Game Design V3 - Alpha.docx` (current base authority per Thomas)
- `Forgotten_Ruin_Alpha_Edition_Frozen.txt`
- `Forgotten_Ruin_Alpha_GPT_Instructions_UPDATED.txt`
- `FULL ALPHA SPECIFICATIONS FOR CUSTOM CHATGPT ALPHA.docx`
- `JSON SCRIPT FOR THE RUINS OF THE DARK GALAN.docx`
- `Forgotten_Ruin_Combat_System_Alpha.json`
- `forgotten_ruin_map_data.json`
- `Forgotten_Ruin_Summarized_Rulebook.txt`

## Canon Documents

- [combat-canon.md](combat-canon.md): turn order, hit/damage math, scrolls, rewards, run penalties.
- [navigation-canon.md](navigation-canon.md): room traversal, exits, one-way portal, movement constraints.
- [rooms-canon.md](rooms-canon.md): room-by-room content and triggers.
- [items-canon.md](items-canon.md): item catalog and acquisition rules.
- [inventory-canon.md](inventory-canon.md): inventory categories, pickup, use, equipment, assembly.
- [journal-canon.md](journal-canon.md): journal access, entry triggers, known entries.
- [boss-mechanics-canon.md](boss-mechanics-canon.md): Banshee Doppelganger, Girdle, final sequence.
- [timeline-canon.md](timeline-canon.md): story setup, prologue, ending, version timeline.
- [canon-conflicts.md](canon-conflicts.md): conflicts that must not be silently resolved in code.

## Implementation Rule

No future engine code should invent or normalize canon silently. If a rule is `CONFLICTED` or `UNKNOWN`, implementation must either:

- preserve both variants behind explicit version tags, or
- wait for human canon approval, or
- mark a test as pending with the unresolved question linked here.

Current working assumption:

- `Adventure Game Design V3 - Alpha.docx` is the implementation base.
- Older frozen material remains important evidence, but final tie-breaks follow `Adventure Game Design V3 - Alpha.docx` unless Thomas explicitly overrides.
