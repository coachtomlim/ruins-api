# Canon Conflicts

This document lists conflicts that must be resolved explicitly. Future code must not choose a side silently.

## C001: Incorrect Scroll Reduction

- Frozen Alpha: incorrect scroll reduces monster stats by `5%`.
- Later Alpha/Beta docs: incorrect scroll reduces monster stats by `10%`.
- Impact: combat balance, deterministic tests, player strategy.
- Proposed handling until resolved: schema should allow versioned `minorEffectPercent`; tests should mark both cases as pending variants.

## C002: Imp Stats

- Frozen summary: `ATF 9 / DEF 4 / EVA 6 / HP 20`.
- Later tuned specs: `ATF 9 / DEF 8 / EVA 6 / HP 30`.
- Impact: Room 5 difficulty, reward calculation, fixed-path stat progression.
- Proposed handling until resolved: store both as `alpha_frozen` and `alpha_tuned_candidate`.

## C003: Lizardman EVA

- Frozen summary: `ATF 20 / DEF 14 / EVA 14 / HP 100`.
- Later docs: `ATF 20 / DEF 14 / EVA 24 / HP 100`.
- Impact: makes Heart Beacon nearly mandatory vs strongly recommended.
- Proposed handling until resolved: do not write final combat balance tests against Lizardman until approved.

## C004: Room 9 Role

- Frozen Alpha: Room 9 magical store appears after Prism assembly and before boss.
- Later docs: Room 9 is mainly a Galanic Mirror / seal assembly chamber.
- Impact: command flow, store timing, Room 10 unlock, frontend layout.
- Proposed handling until resolved: model Room 9 as capable of multiple conditional events, but keep store/seal as separate event definitions.

## C005: Girdle Acquisition

- Some docs: Girdle appears as Room 5 reward/drop.
- Post-test fix: must `Examine East Wall`, `Push Panel`, then manually `Pick up Girdle`.
- Impact: boss eligibility, puzzle logic, manual pickup rule.
- Proposed handling: post-test fix should override direct-drop wording unless human review says otherwise.

## C006: Hexagonal Glass Hinting

- Later docs include journal-like hints for shard purpose.
- Post-test fix says there should be no automatic hint where to use the shard.
- Impact: puzzle difficulty, journal content, room narration.
- Proposed handling: no automatic use-location hint in Alpha mode; later hinting could be optional Beta mode.

## C007: Reward Gold

- Prologue negotiation allows up to `900g`.
- Final cutscene docs often say Sheja rewards `700g`.
- Impact: economy, store affordability, ending state.
- Proposed handling: clarify whether final reward is fixed 700, negotiated amount, or 700 plus negotiated contract metadata.

## C008: Journal Numbering

- Journal entries have inconsistent numeric ids across documents.
- Impact: save/load, UI display, tests, migration.
- Proposed handling: use stable semantic ids in content files and derive display numbering from discovery order.
