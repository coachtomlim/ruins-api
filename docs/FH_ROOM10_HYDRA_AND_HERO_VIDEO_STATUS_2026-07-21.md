---
title: F&H Room 10 Hydra and Hero Video Status
status: owner-approved-locked
date: 2026-07-21
project: F&H Fable - Adventure Ruins Charlie
room: room.10
tags: [fable-fh, room-10, hydra, hero-animation, placement-lock]
---

# F&H Room 10 Hydra and Hero Video Status

## Final P3 (Galan) action placements

Coordinates use normalized stage values: `x` horizontal, `y` vertical, and `h` rendered canvas height.

| Action | X | Y | Height | Runtime source |
|---|---:|---:|---:|---|
| Combat-ready loop | 0.8658 | 0.6406 | 0.2027 | One-second ping-pong loop from Galan Defence, played at one-third speed |
| Attack | 0.8799 | 0.6557 | 0.2697 | Galan attack v005, 3.75 seconds |
| Defence | 0.8799 | 0.6557 | 0.2697 | Galan Defence, 10 seconds |
| Faint | 0.8799 | 0.6557 | 0.1930 | Corrected Galan Faint, 9 seconds |
| Recovery | 0.8799 | 0.6557 | 0.1930 | Galan Recovering from Faint, 10 seconds |

Owner-approved and locked 2026-07-21. Recovery reuses Faint's placement since it starts from that pose; it uses a single static-frame anchor across the prone-to-kneeling motion, so it may need the same kind of zoom compensation Faint received if review surfaces drift.

Machine-readable source of truth: `.hydra-studio-work/galan-room10-action-placement.locked.json`.

## Locked party reference

| Actor | X | Y | Height |
|---|---:|---:|---:|
| P1 (DD) base (ready/attack/defence/faint) | 0.1165 | 0.7381 | 0.3350 |
| P2 (Tank) | 0.4954 | 0.6722 | 0.2600 |
| P3 (Galan) base/faint | 0.8799 | 0.6557 | 0.1930 |

P1 (DD) owner-approved and locked 2026-07-21. Machine-readable source of truth: `.hydra-studio-work/p1-room10-action-placement.locked.json`.

## Locked Hydra placements

| Action | X | Y | Height | Playback |
|---|---:|---:|---:|---|
| Entrance | 0.5092 | 1.3826 | 1.1150 | Reversed from source end to source start |
| Attack | 0.4837 | 1.1913 | 1.3070 | Full 10 seconds |
| Dead | 0.5055 | 1.3340 | 1.2010 | Full 10 seconds |

Hydra uses foreground layer 25; heroes use layer 20.

## Video ingestion completed

- Hydra Entrance, Attack, and Dead: silent VP9 WebM with alpha at constant 24 FPS.
- P1 (DD) Attack: transparent VP9 WebM at 24 FPS; its one-second ready loop uses the attack pose at one-third speed.
- P1 (DD) Defence and Faint: green-screen removal, silent transparent VP9 WebM, 24 FPS.
- P3 (Galan) Attack: combined transparent runtime sequence retained as v005.
- P3 (Galan) Defence: blue-screen removal, silent transparent VP9 WebM, 24 FPS.
- P3 (Galan) combat-ready: one-second ping-pong loop rebuilt from Defence and played at one-third speed.
- P3 (Galan) Faint: camera-zoom compensation applied through approved size keyframes; transparent 24 FPS WebM.

## Corrections completed during review

- Removed residual green around Hydra without destroying its purple body.
- Corrected Entrance and Dead alpha rendering.
- Preserved separate Hydra positions for all three Hydra actions.
- Corrected P1 ready-loop canvas anchor so the actor is visible.
- Tightened Galan Defence alpha to remove blue-screen compression-block noise while preserving blue clothing and green spell effects.
- Replaced Galan's Attack-based ready pose with a Defence-based loop.
- Added per-action X, Y, and height controls for P1 and P3.
- Updated notation to P1 (DD), P2 (Tank), and P3 (Galan).
- Reworked the console into a wide three-column layout so desktop review does not require material vertical scrolling.
- Kept Hydra in front of the heroes and excluded Musca data.

## Console and data behavior

- Review console: `http://127.0.0.1:5198/encounter.html?v=13`.
- Each selectable P1 and P3 action has independent placement state.
- Owner-approved P3 values are compiled into versioned defaults under storage key `fh-encounter-action-placements-v3`, preventing stale v2 browser values from overriding this lock.
- The locked JSON and this note are authoritative; browser local storage is only a review convenience.

## Verification status

- [x] All new WebMs are silent, 24 FPS, and carry alpha metadata.
- [x] P1 and P3 ready loops render and play at one-third speed.
- [x] Galan ready-pose block noise removed.
- [x] P1 ready-loop actor visible with corrected anchor.
- [x] Hydra is foreground and uses action-specific locked coordinates.
- [x] P3 action-specific values match the owner-approved coordinates above.
- [x] Wide desktop console fits the main controls without material vertical scrolling.
- [x] Browser console has no warnings or errors in the final verification pass.
- [x] Musca data is not included.

## 2026-07-21 follow-up: P1 Defence re-key

`p1-defence-alpha.webm` was reported garbled on review. Its alpha plane was
checked directly in-browser (canvas pixel sampling, not just container
metadata) and found genuinely broken: background corners sampled ~40% opacity
instead of 0%, i.e. the original key never fully cleared the green screen.
Re-keyed from the raw source (`.fh-reconcile-work/source-media/heroes/
damage-dealer/DamageDealer_Defence.mp4`) with a tighter chromakey similarity
to avoid the same H.264 compression-block noise problem seen on Galan
Defence, plus a despill pass — the spell-circle VFX was carrying a visible
green color-spill fringe against the green backdrop, now corrected to a clean
gold color. Replacement encoded as `p1-defence-alpha-v2.webm`, wired into
`encounter.js`, verified transparent via in-browser canvas sampling (not
ffprobe/ffmpeg CLI alone — WebM's VP9 alpha side-channel is not reliably
exposed by ffmpeg's own demuxer, so CLI-based alpha checks can false-positive
as opaque even when a file is genuinely fine; only a real browser decode is
authoritative).

**Resolved without a re-key:** `p1-attack-alpha.webm`'s reported "short/
feathered flame" was a false alarm — it's the same content as the reference
beta game asset (`assets/beta/heroes/damage-dealer/anim/attack.webm`),
byte-different but visually identical at every sampled timestamp (0.5s, 3s,
5s, 7s), with the flame beam extending fully by ~t=3s. The screenshots that
prompted the report matched the **P1 Ready loop** (a separate 1-second clip
of just the ignition pose, `p1-combat-ready-loop.webm`) pixel-for-pixel, which
is what the console shows by default before Attack is selected from the P1
dropdown. No asset change made.

## 2026-07-21 follow-up: P1 Faint re-key

Same root cause as Defence — `p1-faint-alpha.webm`'s alpha was never fully
cleared (in-browser canvas sampling showed non-zero background alpha).
Re-keyed from `DamageDealer_Faint.mp4` using the same chromakey similarity
(0.05) and despill (green, mix 0.6) as the Defence fix. Replacement encoded
as `p1-faint-alpha-v2.webm`, wired into `encounter.js`, verified fully
transparent (all four sampled corners alpha=0) via in-browser canvas
sampling.

**Process note:** the "[x] All new WebMs are silent, 24 FPS, and carry alpha
metadata" verification line above only confirmed the `ALPHA_MODE=1` container
tag was present, not that the alpha data itself was non-trivial. That gap is
how the broken Defence key shipped as "verified." Future passes should
sample actual pixel alpha in a browser, not just check for the tag.

## 2026-07-21 follow-up: P1 Recovery ingested, P1 Attack re-ingested

P1 (DD) now has a 5th action, matching Galan: **Recovery**, ingested from
`Damage Dealer Recovery.mp4` (blue-screen, 1280x720, 10s). Chromakeyed at
similarity 0.06 / blend 0.02 with a blue despill (mix 0.5), verified fully
transparent (all four corners alpha=0) via in-browser canvas sampling.
Encoded as `p1-recovery-alpha-v1.webm`, wired into `encounter.js` and the P1
dropdown, defaulted to P1's shared base placement (0.1165, 0.7381, 0.3350) —
**not yet owner-approved**, pending review like Galan Recovery was.

`p1-attack-alpha.webm` was re-ingested from a fresh raw source at
`E:\Desktop\Red ThumbDrive\Adventure Game\3D Heroes and Powers\Damage Dealer
Attack.mp4` (green-screen, vivid AI-generated backdrop, 1280x720, 8s,
carries a small "Veo" watermark over the green field that keys away
automatically) — this supersedes the "resolved without a re-key" note above;
the prior asset is no longer the reference. The new source's flame carries
dark smoke wisps mixed into the orange/yellow fire, which needed a careful
similarity (0.12) to avoid eating into the smoke, plus a stronger despill
(green, mix 0.7) to recover the flame's true yellow-orange color — verified
against the raw source by compositing over a neutral black backdrop rather
than magenta, since magenta distorts the apparent hue of translucent smoke.
Encoded as `p1-attack-alpha-v2.webm`, verified fully transparent at all four
corners and correct flame color (252,128,26) via in-browser canvas sampling.

**Update:** P1 (DD) is now fully owner-approved and locked across all five
actions, including Recovery — `p1-room10-action-placement.locked.json`
updated with the recovery entry (0.1165, 0.7381, 0.3350, matching P1's
shared base placement).

**Layering fix:** P1's actor video was tied at z-index 20 with P2 and Galan,
so DOM order put P1 (source order first) behind both of them — the Attack
flame beam, which spans nearly the full stage width, was rendering behind
P2 and Galan instead of sweeping in front of them toward the Hydra. Gave
`.actor-p1` its own z-index (22): above P2/Galan (20), below Hydra (25).
The flame now passes in front of the party and terminates behind/at the
Hydra, selling the "attack hits the boss" read. Verified via computed
style (`p1: 22, p2: 20, galan: 20, hydra: 25`) in-browser.

## 2026-07-21 follow-up: flame taper, Hydra glow-merge, visible build number

- Switched to a single shared build number instead of separate per-file `?v=`
  query strings (which were easy to lose track of). It's now shown directly
  in the console header ("Build N") so a refreshed page is confirmable at a
  glance — currently **Build 18**, `http://127.0.0.1:5198/encounter.html`
  (any old `?v=` in the URL is cosmetic now; the header text is the source
  of truth for "did my update land").
- P1's Attack flame previously ended in a hard rectangular cutoff (the video
  frame's own edge — the source footage has no built-in fade-out). Added a
  CSS mask (`.actor-p1[data-action="attack"]`) that tapers the last ~30% of
  the flame's video frame to transparent, so it dissipates smoothly instead
  of stopping at a box edge. `encounter.js` now stamps `data-action` on the
  P1/Galan video elements so this can target Attack specifically without
  affecting Ready/Defence/Faint/Recovery framing.
- Added `mix-blend-mode: screen` to the Hydra video. Where the bright flame
  sits directly beneath the Hydra's silhouette, the necks pick up a warm
  glow from it — reads as "the flame is hitting the Hydra" rather than the
  flame simply being chopped off behind an opaque boss. Negligible effect
  elsewhere (screen blending against the dark room background is barely
  visible), so it's left on unconditionally rather than gated to Attack only.

## 2026-07-21 follow-up: flame-into-Hydra merge, corrected

Prior entry's `mix-blend-mode:screen` on the Hydra itself was wrong — it
washed out the Hydra's own look everywhere, not just where the flame
touches it, and the owner clarified the ask was the opposite: the **flame**
should look partially merged into the Hydra at the overlap, with the Hydra
itself untouched. Reverted the Hydra blend mode.

Implemented instead: a second `<video id="p1FlameGhost">` element, a
synced duplicate of the P1 attack video (same src, position, and playback
state, mirrored via a new `syncGhost()` in `encounter.js`), rendered above
the Hydra (z-index 27 vs. Hydra's 25) at 50% opacity with
`mix-blend-mode:screen`. The real flame stays fully opaque below the Hydra
(z-index 22, unchanged) for the "passes in front of the party" read: the
ghost duplicate is invisible everywhere by default
(`.flame-ghost{opacity:0}`) and only turns on for the attack action
(`[data-action="attack"]`), so it's a no-op outside that pose. Net effect:
Hydra renders completely normally everywhere except where the bright flame
sits directly beneath it, where the necks pick up a warm 50%-strength glow
from the ghost layer — reads as contact without altering the Hydra's own
opacity or color anywhere else.

Also shortened the flame's reach for the box-edge complaint: `attack`
specifically now renders at `max-width:150%` instead of the shared 180%
(a `name==='p1'&&a==='attack'` branch in `placeHero()`), pulling the hard
frame-edge further back before the taper mask has to do the rest of the
work.

**Not independently verified this pass** — the Browser pane used for
testing reports `document.hidden:true` (a pane-level limitation noted
earlier in this thread), which blocks all video playback from that side,
including the previously-confirmed-working ready loops. Structural checks
passed (computed z-index/opacity/blend-mode/src on both flame layers,
`maxWidth` reduced correctly), but actual on-screen look during playback
needs owner confirmation in a real browser tab.

## 2026-07-21 follow-up: flame length fix + a version-bump bug

Owner reported the flame still reached as far as before despite the
`max-width:150%` change from the previous pass. Root cause: that cap was
never the binding constraint — the video's natural rendered width (from
its height-based scaling × 1280:720 source aspect ratio) came out to
roughly 106% of the stage width, well under even the original 180% cap, so
capping it lower changed nothing. The actual fix is the mask fade zone,
which is independent of element width: tightened from `60%→88%` to
`46%→68%` (of the video's own local width, not stage space), so the flame
is fully opaque only through its first ~46% and completely gone by 68% —
a genuinely shorter visible flame, not just a softer edge at the same
length.

**Self-caught bug:** bumping the build number via a blind `replace_all`
of the bare string "19"→"20" also matched the "19" inside the hardcoded
Galan reference value `0.1930` in the console's display panel, corrupting
it to `0.2030`. Caught and fixed immediately (display text only — the
functional placement values in `encounter.js` were never touched). Future
version bumps will edit each occurrence individually rather than blind
string replacement, since bare 2-digit numbers collide with unrelated
decimal values.

## 2026-07-21 follow-up: reverted flame reach to the confirmed-good mask

Widening the mask to 54%→76% (Build 21) brought back a visible square-box
artifact. Checked the raw source footage frame-by-frame in that exact zone
(58–100% of frame width) — it's clean, no baked-in seam or defect — so the
box is a compositing quirk from combining `mask-image` with the ghost
layer's `mix-blend-mode`, not a source problem. Worth noting: the Hydra's
locked position maps to roughly x=97% in the flame video's own local
coordinate space (worked out from the attack calibration anchor), i.e. the
Hydra sits almost exactly where the frame's hard edge is — so "reach the
Hydra" and "avoid the hard edge" are in direct tension for this asset, and
isn't resolvable by nudging the same single mask further out.

Reverted to the confirmed-good **46%→68%** mask (Build 22) rather than
risk another unverifiable guess — per owner's own fallback instruction.
If more reach toward the Hydra is wanted later, the next real fix is
giving the ghost layer its *own*, independently-tuned narrower mask
(rather than sharing the main flame's), so only a small band near the
Hydra's actual position glows, instead of pushing the whole flame's fade
zone further out.

## Repository safety note

The nested `fiends-hero-roguelike` checkout on G: was not modified because its index currently reports the complete tracked tree as deleted while matching paths appear untracked. The Obsidian status record is committed to the clean outer `fable-fh-vault` repository only.
