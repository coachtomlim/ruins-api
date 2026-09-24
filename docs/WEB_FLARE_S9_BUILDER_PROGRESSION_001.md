# WEB-FLARE S9 Builder Progression + Challenge Journal 001

Status: SOURCE CANDIDATE — NOT YET APPLIED TO STAGING

Base authority:

- S9 Progression Loop 001: `0ad6f4740e6f034ac91a1badbb85b382adc1bf47`
- Frozen friend receiver: S8A `/m/<4-char-code>?from=<sender>`
- Existing invite encoding remains frozen in `public/flare-s8a/flow.mjs`.

## Product purpose

Complete the remaining P6 progression loop with a persistent Builder identity and challenge history without pretending that the public, stateless S8A receiver can prove who opened or completed a challenge.

The durable loop is:

`choose precision target → publish challenge → earn cosmetic Builder XP once for a unique design → share/re-share from Challenge Journal`

Runner power progression remains separate:

`Daily Trial → Runner XP → Runner Level → equipment unlocks`.

## Builder authority

A published challenge is server-created through:

`create_builder_challenge(p_target_hp)`

The browser supplies only the requested finishing-HP target.

The server derives:

- authenticated player from `auth.uid()`;
- authoritative Runner from `get_account_runner_state(null)`;
- the frozen S8A public Runner tier from authoritative effective HP;
- sanitized sender display name from the player's profile;
- the exact four-character S8A invite code;
- challenge identity;
- Builder XP.

The browser does not submit player id, Runner id, sender name, invite code, XP, Builder level, Gold or reward values.

## Public invite compatibility

The migration contains a SQL twin of the frozen S8A version-2 invite encoding algorithm.

Client code reconstructs the public link through the original frozen JS implementation and refuses to expose the link unless the JS code exactly matches the server-stored invite code.

Known frozen compatibility samples include:

- Rookie Warrior / 60% → `Qs2Z`
- regular tier / 60% → `StUY`
- top tier / 60% → `UvVY`

The public URL remains:

`https://think-2-thrive.com/m/<code>?from=<sanitized-name>`

No account UUID, database Runner ID, email, session or credential is placed in the public link.

## Precision designs

The governed invite format supports finishing HP targets from 5% through 95% in 5-point increments.

The Hub exposes that full 19-target range.

A design is unique for one owner when its frozen public Runner tier + target HP combination has not previously been published.

Republishing the same design returns the existing challenge and awards 0 additional Builder XP.

## Builder XP

First publication of a unique design:

`+10 Builder XP`

Builder XP is append-only and cosmetic.

Curve:

| Builder Level | Total Builder XP |
| ---: | ---: |
| 1 | 0 |
| 2 | 20 |
| 3 | 50 |
| 4 | 100 |
| 5 | 180 |

The visible 19-target range permits 190 Builder XP even on one frozen public Runner tier, so Level 5 is reachable through ordinary UI use.

Builder XP does not alter:

- Gold;
- Runner XP;
- HP / ATK / DEF;
- equipment;
- Daily Trial;
- Daily Login;
- Practice;
- challengeability.

## Challenge Journal

The authenticated Hub loads the owner's server-created challenges and presents a chronological Challenge Journal.

A journal entry stores:

- public Runner tier;
- precision target;
- four-character invite code;
- sanitized sender name at publication time;
- publication timestamp.

Re-share reconstructs the original public link and verifies that the frozen JS encoding still reproduces the stored server code.

## Explicit non-authority

This slice does NOT record or reward:

- link copy;
- native share;
- WhatsApp / Telegram share;
- friend link open;
- room selection by friend;
- friend run start;
- friend run completion.

The existing S8A receiver has no authenticated callback that could prove those events safely.

Do not infer completion from a browser callback, URL parameter or client-submitted result.

A future social-completion system requires a separate server-issued challenge/run identity and settlement contract.

## S9 compatibility correction

After S9 Progression Loop 001, `progression_offer_catalog` contains an active ITEM offer for Leather Hood.

The old Hub training loader fetched every active offer while the training view model accepts STAT offers only.

This slice corrects that integration by explicitly filtering the Runner Training feed to:

`kind = STAT`

Equipment unlocks continue through `get_runner_progression().unlocks` and the governed item/equip path.

## Deployment boundary

This source candidate does not authorize HostGator deployment.

HostGator Update 006 remains separately blocked by cPanel connectivity and must not be modified by this slice.
