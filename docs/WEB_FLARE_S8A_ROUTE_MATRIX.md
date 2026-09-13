# WEB-FLARE S8A Route Isolation Matrix

Purpose: prevent route collisions and accidental takeover of prior releases.

| Route | Release | Meaning | S8A authority |
|---|---|---|---|
| `/q/XXXX` | S3/S4 legacy | legacy player challenge | preserve only |
| `/g/XXXX` | S5 | role-correct challenge | preserve only |
| `/h/XXXX` | S6 | calibrated challenge | preserve only |
| `/j/XXXX` | S7 | content-variety challenge | preserve only |
| `/k/XXXX` | S7.1 | onboarding challenge | preserve only |
| `/m/XXXX` | S8A | rewards/replay receiver challenge | new S8A route |

## S8A invitation payload

The four-character S8A code continues to encode only:

- runner identity;
- target finishing HP.

It must not encode:

- selected room;
- monsters;
- traps;
- supports;
- run result;
- score;
- reward Gold;
- account state;
- saved-goal state.

Sender display name may continue separately through the sanitized query-string mechanism used by S7.1.

## Rewrite boundary

A future bounded HostGator helper may write only:

- `public_html/quick-dungeon/flare-s8a`
- `public_html/m`

It must not overwrite or edit the rewrite roots for `/q`, `/g`, `/h`, `/j`, or `/k`.

## Acceptance

Before deployment, test decoding/encoding and fallback development URLs. After deployment, test one known public URL from every prior route plus the new S8A `/m/XXXX` route.
