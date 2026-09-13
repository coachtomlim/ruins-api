# WEB-FLARE S8 Background Preflight Checkpoint 006

## Scope

Durable recovery point after deeper Runner-progression preparation. No live deployment has been executed. S7.1 remains live authority. Vercel auto-deploy remains disabled on the S8 branch.

## Added since Checkpoint 005

### Progression transaction/state preparation

- immutable progressed Runner snapshots;
- versioned progression catalog schema;
- purchase quotes and debit intents;
- loadout ownership validation;
- derived progression state from purchased stat offers + owned/equipped gear;
- mobile progression home/purchase view models;
- progression panel state machine;
- pure rehearsal engine for idempotent purchases and equip operations;
- non-negative Gold debit helper;
- progressed-Runner calibration adapter;
- 100-point Dungeon Budget challengeability preflight;
- persistent challenge envelope carrying exact Runner snapshot but no receiver dungeon choices.

### Contracts

Added:

- Runner upgrade transaction contract;
- Runner progression data model;
- Runner progression mobile UX contract;
- progression economy calibration plan;
- equipment visual-layer contract;
- progression security test matrix;
- progression concurrency contract;
- stock Flare gear candidate inventory;
- Owner Decision Packet 001.

### Stock Flare gear evidence

Pinned Flare v1.15 source confirms a broad melee weapon inventory including club, reinforced club, mace, longsword, battle axe and others.

Pinned armor content confirms Leather, Chain and Plate families, with multi-piece avatar assets. This supports visible Gold-funded gear progression without new-art dependency.

Prepared recommendation remains a simple v1 `WEAPON + ARMOR` abstraction, with Armor permitted to visually bundle multiple underlying Flare layers. Multi-slot armor remains an Owner decision.

### S8A reward-to-progression alignment

S8A Codex packet and mobile acceptance fixture now require visible copy:

`USE GOLD TO UPGRADE YOUR RUNNER`

`Stats · Equipment · Armor`

S8A still does not activate buying/equipping or claim persistence.

## Decision gate reached for persistent progression

Further provider-neutral testing can continue, but the next concrete account-backed progression design now materially depends on Owner choices captured in:

`docs/WEB_FLARE_S8B_OWNER_DECISION_PACKET_001.md`

The four prepared decisions are:

1. one persistent Runner that grows vs multiple separately upgraded Runner templates;
2. simple Weapon + Armor Set vs immediate multi-slot armor;
3. explicit reward settlement timing vs auto-first-clear settlement;
4. starter persistent gear/loadout.

Recommended choices are already stated in that packet so the Owner does not need to invent the architecture from scratch.

## Pricing remains later

Gold prices, upgrade amounts and caps are intentionally not yet an Owner decision. First use deterministic reward velocity and 100-point Dungeon Budget challengeability to bring back concrete balance options.

## Safe next step after Owner choices

Once the four structural choices are confirmed, prepare the exact persistent Runner ownership model, progression UI/navigation contract and first candidate stock-gear catalog for later account staging. Backend/provider selection remains a separate gate.