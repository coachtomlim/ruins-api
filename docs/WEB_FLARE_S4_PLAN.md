# WEB-FLARE S4 Game System Plan

## Baselines

- S2 rollback source: `8cc57ddacfc2e12ac65b120496f1ee8915e4525b`
- S3 accepted product-flow source: `3c1e62c82ab4277956c451ad8a396cea11b1f4a9`
- S4 branch: `work/web-flare-s4-game-system-001`

S4 must not modify the deployed S2 or S3 directories. It is a new gameplay line.

## Product principle

The first-time experience stays simple. The builder can accept defaults without understanding RPG arithmetic. Deeper information appears only when requested. Every number shown to an advanced builder must affect the actual deterministic simulation.

## S4.1 Functional runner model

Status: implemented.

The default runner is a Level 1 Warrior with:

- HP 100
- base ATK 8
- Wooden Club +4 ATK
- total ATK 12
- base DEF 1
- total DEF 1

The runtime catalogue is derived from the governed S4 game model. Weapon and defence values are therefore simulation inputs, not decorative labels.

Acceptance:

- weapon bonus changes runtime attack
- runner DEF reduces incoming monster damage
- monster DEF reduces runner damage
- builder and player show the same actual values

## S4.2 Encounter intelligence

Status: implemented for Goblin and Skeleton.

Advanced builder view shows real comparison cards:

- HP
- ATK
- DEF
- gold cost
- damage dealt to the current runner
- damage received from the current runner

Current governed values:

- Goblin: HP 30, ATK 5, DEF 1, cost 20
- Skeleton: HP 45, ATK 7, DEF 2, cost 30

The novice flow still sees only the balanced preset unless Customize is opened.

## S4.3 First real trap

Status: implemented.

Spike Trap:

- cost 20
- raw damage 8
- one use
- placed deterministically on a legal traversal cell
- runner DEF reduces physical trap damage
- trap is visibly distinguished from healing items
- trap participates in the 100-gold budget and short challenge code

## S4.4 Short challenge code v2

Status: implemented.

The public friend link remains four characters after `/q/`.

S4 code v2 adds a trap bit while retaining:

- room
- three guard choices
- potion
- target HP
- checksum

The S4 player also decodes legacy S3 four-character codes so accepted S3 links remain playable after `/q/XXXX` is repointed to S4.

## S4.5 Player runtime

Status: implemented candidate.

The player:

1. opens the short friend link
2. sees who sent it, runner, room, defences and target
3. may optionally inspect runner stats
4. taps Run the Gauntlet once
5. watches the stock Flare runner use stance, run, swing/attack, hit and die animation states
6. receives the deterministic result
7. may replay, share or build their own

## S4.6 Verification gate

Automated gate covers:

- legacy S1/S2/S3 tests
- weapon modifier application
- defence formula
- monster comparison values
- actual combat damage events
- one-shot spike trap behaviour
- trap budget accounting
- four-character S4 code round trip
- legacy S3 code compatibility

HostGator acceptance additionally requires:

- HTTPS
- correct HTML/CSS/MJS/JSON MIME
- Builder login `Buddy / Test`
- one default no-customization build
- one trap-enabled build
- `/q/XXXX` survives WhatsApp copy/share
- visible run and swing/attack animation
- S3 `Rind` legacy link still loads
- deployed S2 and S3 files remain byte-for-byte unchanged

## Next sequence after S4 acceptance

### S5 Content breadth

Target a small but meaningful catalogue, not a dump of assets:

- 6 visually distinct stock Flare rooms
- 4 monster types
- 2 traps
- 3 useful items
- curated encounter presets

### S6 Runner progression

Add 3 runner configurations and progression-safe equipment choices. Preserve a one-tap default runner for newcomers.

### S7 Social loop

Add challenge result cards, challenge-back/rematch, and lightweight challenge history.

### S8 Accounts

Replace prototype login only when persistence is needed for saved builds, progression, history, friends or rankings.

### S9 Assisted creation

Optional AI suggestions for builders who want a fast recommendation. AI must never be required to play or resolve a run.

### S10 Production hardening

Versioned challenge persistence, telemetry, security, deployment rollback, backups and release governance.
