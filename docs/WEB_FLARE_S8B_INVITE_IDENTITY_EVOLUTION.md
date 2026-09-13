# WEB-FLARE S8B Invite Identity Evolution

## Current S8A invite truth

The four-character `/m/XXXX` code remains intentionally stateless and encodes only:

- runner identity;
- target finishing HP.

It does not uniquely identify a challenge instance, sender account, reward settlement, expiry or history record.

That is correct for S8A, but insufficient for persistent S8B social/reward behavior.

## Why S8B needs a challenge instance identity

Persistent accounts/rewards require the system to distinguish two challenges that happen to use the same runner and target.

A unique challenge identity is needed for:

- authenticated sender ownership;
- dual-party reward settlement;
- challenge expiry/revocation;
- run history;
- anti-farming settlement rules;
- reconciliation and audit.

## Recommended evolution

Keep all existing `/q`, `/g`, `/h`, `/j`, `/k`, `/m` routes frozen for their respective stateless versions.

For persistent S8B challenges, introduce a new isolated route with an opaque server-issued challenge token, for example:

`/c/<compact-token>`

The token resolves server-side to the canonical challenge record containing runner + target + sender ownership.

Do not put wallet state, dungeon choices, rewards or private profile data into the URL token.

## Alternative

A composite route could carry both the four-character spec and a challenge instance reference, but it adds complexity without much user benefit. Prefer one opaque challenge token once server persistence exists.

## Decision gate

Do not change S8A `/m/XXXX`. Select the persistent S8B invite format only when the account/backend architecture is approved.
