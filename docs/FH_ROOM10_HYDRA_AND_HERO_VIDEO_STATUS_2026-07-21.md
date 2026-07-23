---
title: F&H Room 10 Hydra and Hero Video Status
status: owner-approved-locked
milestone: Hydra-Echo
date: 2026-07-21
updated: 2026-07-22
console_build: 40
project: F&H Fable - Adventure Ruins Charlie
room: room.10
tags: [fable-fh, room-10, hydra, hero-animation, placement-lock, hydra-echo]
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

## 2026-07-22: P2 (Tank) animation ingested from sprite sheets — PENDING REVIEW

P2 (Tank) previously had no animation — only a static `p2.webp` pose image. It now
has a full five-action system in the console, mirroring P1/P3, ingested from four
green-screen sprite sheets supplied by the owner in
`Dropbox\PC (2)\Downloads\Tank Sprite Sheets\`:
`Tank Defence.jpeg`, `Tank Faint.jpeg`, `Tank Recovery.jpeg` (each 1254×1254, a 4×3
grid of 12 numbered frames), and `Tank Attack 2.png` (1535×1024, 4×3, RGBA container
but flat green — no real alpha; landscape framing for the wide sword-slash trail).

**Pipeline used:**
- Owner removed the baked-in white frame-number labels on the three `.jpeg` sheets
  before slicing (confirmed clean per-frame after re-slice). The Attack sheet had no
  numbers.
- Sliced each sheet into 12 uniform frames (portrait 312×418 for
  Defence/Faint/Recovery; landscape 360×330 for Attack, centered in each grid cell).
- Chroma-keyed every frame at `chromakey=0x07d51d:0.10:0.03` + `despill=green:mix=0.5`.
  Same recipe cleared all four sheets including the two lighter-green backdrop boxes on
  Attack frames and preserved the translucent blue shield-barrier and gold slash VFX
  (verified by compositing over both black and magenta).
- Motion built by optical-flow interpolation (`minterpolate mci/aobmc/bidir/vsbmc`)
  between the 12 keyframes per action, up to constant 24 FPS. Interpolation is clean on
  Defence/Recovery; Faint and Attack carry visible motion-blur ghosting on the largest
  pose-to-pose displacements (reads as movement, flagged for owner judgement).
- Encoded `libvpx-vp9`, `yuva420p`, `crf 27`, `auto-alt-ref 0`, `alpha_mode=1`, silent.
- A combat-ready idle loop was derived from Defence frames 1→2→1 (ping-pong), played at
  ⅓ speed and looped, matching the P3 approach.

**Assets (in `.hydra-studio-work/assets/`, mirrored to the portable console):**
`p2-combat-ready-loop.webm` (0.54 s loop), `p2-attack-alpha-v1.webm` (4.04 s),
`p2-defence-alpha-v1.webm` (8.38 s), `p2-faint-alpha-v1.webm` (7.71 s),
`p2-recovery-alpha-v1.webm` (8.38 s).

**Alpha verified** by real in-browser `getImageData` canvas sampling on all five clips
(not CLI tag checks): all four corners alpha=0, soft anti-aliased edges present, solid
character body — the authoritative check per the earlier false-positive incident.

**Console wiring:** `encounter.js`/`encounter.html`/`encounter.css` now carry a full P2
action `<select>`, `clips.p2`/`calibration.p2`/`defaults.p2`/`state.p2`, a P2 `<video>`
replacing the static `<img>`, P2 entries in the videos/selectors/delays maps and in
`playAll`/`resetAll`/`tick`/lock/reset handlers, plus a P2 controls panel, delay input,
Play P2 button and time output. Build bumped 22→23 (each occurrence edited individually).
Verified in-browser: zero console errors, all P2 elements present, every action swaps to
the correct clip/height/calibration.

**Proposed starting placements (NOT yet owner-approved — no locked JSON written yet):**

| Action | X | Y | Height | Calibration [cx,cy] |
|---|---:|---:|---:|---|
| Ready | 0.4954 | 0.6722 | 0.2600 | 0.494, 0.904 |
| Attack | 0.4954 | 0.6722 | 0.1900 | 0.468, 0.961 |
| Defence | 0.4954 | 0.6722 | 0.2600 | 0.494, 0.904 |
| Faint | 0.4954 | 0.6722 | 0.2600 | 0.510, 0.943 |
| Recovery | 0.4954 | 0.6722 | 0.2600 | 0.526, 0.890 |

X/Y reuse the previously-locked static P2 anchor (bottom-centre = feet at 0.4954,
0.6722). Attack uses a reduced height (0.19 vs 0.26) because its landscape frame packs
the character larger; this keeps the on-screen body size consistent with the other
actions. In-room composites confirm the feet land on the stone floor in the party line
for all four actions. `p2-room10-action-placement.locked.json` will be written to match
the P1/P3 format **only after Thomas approves** these values in review.

## 2026-07-22: P2 Faint/Recovery de-ghosted + Ready loop made a true ping-pong (Build 24)

Owner reviewed Build 23 and flagged two things: (1) P2 Faint and Recovery showed a
**ghosting effect** — the optical-flow `minterpolate` motion-warp tweening across the
biggest pose jumps; (2) the combat-ready idle loop should **loop back the same way it
came** (ping-pong) rather than hard-cut, to avoid a jerky seam.

**Faint & Recovery — rebuilt ghost-free.** Dropped `minterpolate` entirely and rebuilt
the motion as a **premultiplied-alpha cross-dissolve** between the 12 keyed poses (owner
chose cross-dissolve over frame-stepping). Premultiplied blending avoids dark fringing
where a pose is transparent. Per segment: 2-frame hold + 8-frame dissolve, at 24 FPS →
118 frames ≈ **4.92 s** each (down from 7.71/8.38 s — snappier, as requested, no
slow-motion). New files `p2-faint-alpha-v2.webm` and `p2-recovery-alpha-v2.webm`, wired
at `?v=2`; dropdown durations updated. Mid-dissolve frames read as a clean fade between
poses, not the warped double-exposure the interpolation produced.

**Ready loop — true palindrome.** `p2-combat-ready-loop.webm` rebuilt from Defence poses
1→2: a forward dissolve then the **exact reversed interior** appended, so the return path
is frame-identical to the outbound path (numerically verified: mirror-diff **0.0**). 30
frames, wired at `?v=2`, kept at ⅓ speed and looping. Owner clarified the "1/2" in their
note referred to the combat-ready pose being Defence frames 1→2, not a half-speed change.

Attack and Defence clips are unchanged (still their v1 minterpolate builds).

**Verification.** Alpha confirmed via ffmpeg `alphaextract` with an explicit
`-c:v libvpx-vp9` decode of the alpha side-channel: all four corners alpha=0, character
body alpha=255, ~74% of each frame transparent. This is trustworthy here because a failed
side-channel read collapses to *opaque* output, and these decoded as genuinely
transparent. The authoritative in-browser `getImageData` check could not be run this
session — the automated Chrome tab reports `document.hidden:true`, which suspends video
decode (the known pane limitation), so the clips wouldn't load in it. **Owner should
confirm playback look in a normal browser tab.** Builder script kept at
`.hydra-studio-work`-adjacent scratch `p2frames/build_dissolve.py`.

Build bumped 23→24 (each occurrence edited individually — no blind digit replace). Both
consoles (working + portable) re-synced and confirmed byte-identical on the changed
`encounter.js`/`encounter.html` and all three rebuilt WebMs. Placements unchanged and
still not owner-locked; no locked JSON written yet.

## 2026-07-22: P2 Defence de-ghosted + Recovery size-keyframe ramp (Build 26)

Follow-up owner review of Build 24:

**Defence rebuilt ghost-free.** Owner confirmed Defence also carried the interpolation
ghosting. Rebuilt with the same premultiplied cross-dissolve as Faint/Recovery →
`p2-defence-alpha-v2.webm`, ~4.92 s (was 8.38 s), wired `?v=2`. The translucent
shield-barrier rune VFX dissolves cleanly (checked over black). Build 24→25.

**Recovery end-pose was too big — fixed with a baked size ramp (Galan-faint method).**
Root cause was pose geometry, not zoom: the character's bounding box grows ~2.3× rising
from prone (116 px) to kneeling (270 px), so at a fixed render height the kneel read as
oversized. Replicated the Galan approach — a **baked, foot-anchored size-keyframe ramp**
(cubic-smoothstep), scaling each frame about the calibration anchor (0.526, 0.890 →
164,372 px) so the contact point stays pinned. Owner picked an end height of **0.16** from
an in-room size ladder. Keyframes: hold `h=0.26` to 0.60 s (through the prone phase), then
smoothstep down to `h=0.16` at 4.9167 s. Baked into `p2-recovery-alpha-v3.webm`
(supersedes the v2 flat cross-dissolve), wired `?v=3`. Machine-readable record:
`.hydra-studio-work/p2-recovery-action-placement.locked.json` (schema matches the Galan
faint pass JSONs). Build 25→26.

Alpha reconfirmed on both new clips via explicit `-c:v libvpx-vp9` `alphaextract`:
corners alpha=0, body=255 (Defence 71% transparent, Recovery v3 88% transparent — higher
because the ramped kneel is smaller). Both consoles re-synced byte-identical
(`encounter.js`/`encounter.html`, the two new WebMs, and the recovery locked JSON).
Placements still not owner-locked; the final `p2-room10-action-placement.locked.json`
remains unwritten pending overall approval.

## 2026-07-22: P2 Attack + Combat-Ready re-ingested from real video (Build 27)

Owner supplied `Dropbox\PC (2)\Downloads\Tank Attack.mp4` — 1280×720, 24fps, 10s,
green-screen, containing **two** full attack sequences (~1.4–3.4s and ~7.6–9.6s) plus
long clean **idle** stretches (0–1s, ~4.3–7.0s). Real continuous footage, far better than
the 12-still sprite sheet.

**Keying — custom green-dominance mask (not chromakey).** The tunic is *teal* (G≈B), too
close to the green backdrop for `chromakey` (it ate the character). Instead keyed on
green-dominance: background only where `g_score = min(G−B, G−R)` is high (green ≈ +50..+65;
teal/blue/gold/skin all < ~0), soft ramp LOW=14/HIGH=34, plus a green despill. A fixed
top-left vignette blob (~1000px at x≈8,y≈28) is removed via connected-component filtering
(centroid in the top-left corner); all other scattered blobs are real moving slash
sparkles and are kept. Script: `scratchpad/p2attack/greenkey.py` (+`keybatch.py`).

**Combat-Ready** = idle segment 4.55–6.05s (37 frames), **ping-pong palindrome** →
`p2-combat-ready-loop-v2.webm`, 72 frames / 3.0s, looped at **normal speed** (dropped the
⅓-speed rate — this is real breathing motion, not a 2-frame micro-loop). Replaces the
Defence-frames palindrome.

**Attack** = two-hit combo: seq1 (idle→spark→slash1) premultiplied cross-dissolved into
seq2 (→spark→slash2) → `p2-attack-video-combo.webm`, 77 frames / 3.21s. A single-slash
alternative `p2-attack-video-single.webm` (seq2 only, 2.0s) is also deployed but not wired.
Scripts: `build_attack.py`.

**Placement re-derived for the 16:9 video framing** (different from the sprite sheets):
character bbox 0.9125 of frame, boots at y≈689 (cy=0.957), foot-centre x≈685 (cx=0.535).
New calibration for ready+attack = **[0.535, 0.957]**; starting height **h=0.245**
(feet land on the floor anchor; owner to fine-tune size in review). Storage key bumped
`v3→v4` so the new video-based defaults take cleanly over any stale localStorage.

Alpha verified (explicit VP9 `alphaextract`): both clips corners=0, body=255 (ready 85%
transparent, attack 71%). `encounter.js` `node --check` clean. Both consoles re-synced
byte-identical. Build 26→27. Defence/Faint/Recovery unchanged from Build 26. Nothing
locked; placements still pending owner approval.

## 2026-07-22: party height rebalance — Galan up, P2 down (Build 28)

Owner reviewed the assembled party and flagged relative heights: **Galan (P3) read as
"kid height"** next to P1/P2, and **P2 was too tall**. Fixed by uniform relative scaling of
each character's height set (preserves each one's internal action ratios, incl. Galan's
zoom-comp and P2's baked recovery ramp):

- **Galan ×1.18:** ready 0.2027→0.2392, attack/defence 0.2697→0.3182, faint/recovery
  0.1930→0.2277. (This revises the previously owner-approved-locked Galan heights — the
  owner directed the change; `galan-room10-action-placement.locked.json` and the Galan
  table above still show the old lock and will be updated once the new size is approved.)
- **P2 ×0.90:** ready/attack 0.245→0.2205, defence/faint/recovery 0.26→0.234.

X/Y anchors and calibrations unchanged (feet stay planted; scaling is about the foot
anchor). Judged against an in-room party lineup (`scratchpad/party/lineup.py`) before
applying. Storage key bumped v4→v5 so the new heights show over any stale state. Build
27→28, both consoles synced, `node --check` clean. Still proposals pending owner sign-off.

**Jerkiness note (Defence/Faint/Recovery):** owner finds these three still jerky. Confirmed
root cause — they're built from only **12 discrete sprite-sheet poses**; the cross-dissolve
smooths the blend but cannot invent the in-between motion, so large pose-to-pose jumps
still read as steppy. The real fix is **full-motion video source** (like `Tank Attack.mp4`
used for Attack/Ready). Owner plans to generate full videos for these three later; no
further processing improves them until then (more optical-flow interpolation just brings
back the ghosting already rejected).

## 2026-07-22: P2 sprite-action sizes corrected + Recovery end enlarged (Build 29)

The Build 28 uniform P2 ×0.90 was wrong for the **sprite-based** actions: sprite frames
fill ~0.77 of frame vs the video frames' ~0.9125, so the same placement-h renders the
sprite character *smaller* on-screen. Owner flagged Defence too small and the Recovery end
too small.

- **Defence + Faint** restored 0.234 → **0.26** (on-screen ≈0.20, matching the video
  Ready/Attack at h=0.2205). Faint bumped alongside Defence because both open on the same
  standing pose; keeping them split would render that pose at two sizes.
- **Recovery** base restored 0.234 → **0.26** and the baked ramp end raised **0.16 → 0.21**
  (shallower shrink) so the kneeling end reads proportionate, not tiny — start still holds
  0.26 to match Faint's prone framing. Re-baked → `p2-recovery-alpha-v4.webm` (wired `?v=4`),
  `p2-recovery-action-placement.locked.json` updated (end keyframe 0.21). Video Ready/Attack
  unchanged at 0.2205. Verified in-room (`scratchpad/p2frames/recovery_fix_check.png`).

Alpha reconfirmed (recovery v4 corners=0/body=255). Storage key v5→v6, Build 28→29,
`node --check` clean, both consoles synced. Galan heights unchanged from Build 28.

## 2026-07-22: console UX — hold final frame + Reset to default (Build 30)

Review-workflow tweaks (no asset changes):
- **Hold on final frame:** removed the "Return each hero to its ready loop after playback"
  checkbox and its behavior. A non-looping action (Attack/Defence/Faint/Recovery) now
  **holds on its last frame** when it finishes so the end pose is inspectable; `onended`
  just pauses + posts a "holding final frame" status.
- **Independent heroes:** playing one hero (Play P1/P2/Galan) never disturbs the others —
  they stay exactly where they are (already true of `playOne`; now meaningful because
  finished clips freeze instead of snapping back).
- **Reset to default:** the old "Reset" button is now **"Reset to default"** (distinct
  red styling, `.reset-btn`): sends every hero's dropdown back to `ready`, restores all
  placements to the compiled defaults, resets Hydra to Attack, and reconfigures the ready
  loops. Verified in real Chrome (Build 30, zero console errors; reset returns
  P2/Galan/Hydra to ready/ready/attack).

## 2026-07-22: P2 Faint trimmed + Hydra toggle (Build 31)

- **Faint trimmed to first flat pose.** The source sprite sheet has a jump between poses 8
  and 9 — the character reaches the ground (bbox bottom ≈392) then the whole body shifts
  **up ~52px** (bottom→340) and re-settles, reading as "moves up then faints again." Cut the
  clip at frame 77 (last on-ground frame before the jump at frame 78) + an 8-frame settle
  hold → `p2-faint-alpha-v3.webm`, **86 frames / 3.58s** (was 4.92s), wired `?v=3`. Verified
  the last frame is on-ground (bbox bottom 392, not the jumped 340) and alpha clean.
- **Hydra show/hide toggle.** New `#hydraToggle` button ("Hydra: shown" / "Hydra: hidden",
  blue when on, dashed grey when off) sets the Hydra video `display` none/visible and pauses
  it when hidden; `applyHydraVisibility()` is re-applied inside `configureHydra` so the state
  persists across Hydra action changes. Independent of the Hydra action dropdown's "None".

Build 30→31, both consoles synced, `node --check` clean, verified in real Chrome (zero
console errors; toggle cycles display:none↔visible correctly).

## 2026-07-22: Faint cut-point corrected — must land on a PURE pose (Build 32)

Owner screenshot showed the held Faint end frame with **two heads and two sets of arms**.
Cause: the Build 31 cut at frame 77 landed **inside a cross-dissolve**. The dissolve
structure is 2 hold frames (pure pose) + 8 blend frames per segment, so frame 77 was a
~75% blend of pose 8 into pose 9 — and because those two poses are offset ~52px vertically,
the blend renders both bodies at once. Freezing on it made the double-exposure permanent
(mid-clip blends pass too fast to notice).

Fix: cut at frame **71** — the last *pure* pose-8 hold frame — plus an 8-frame settle hold
→ `p2-faint-alpha-v4.webm`, **80 frames / 3.33s**, wired `?v=4`. Proved unblended: the end
frame is pixel-identical to the source sprite pose 8 (mean abs diff **0.0**), and the
decoded shipped frame shows a single clean body.

**Rule for future trims: only cut/hold on a pure pose frame** (indices `segment*10` and
`segment*10+1`, or the final end-hold), never inside the 8-frame blend window. Other clips
are unaffected — Defence/Recovery already end on their pose-12 end-hold, and Attack/Ready
come from real video with no dissolve at the tail.

Build 31→32, both consoles synced, `node --check` clean, verified in Chrome (Build 32,
Faint · 3.33 s).

## 2026-07-22: Recovery stabilised (Build 33) + Defence size corrected (Build 34)

**Recovery stabilised.** Owner reported heavy left-right motion and a start pose offset
right/down from where Faint now ends. Measurement showed two systematic sprite-sheet
artifacts: (1) the centroid drifts left within each 4-pose row then **snaps ~24px right at
each row boundary** (poses 5 and 9 — the start of grid rows 2 and 3), giving a sawtooth
wobble; (2) the ground contact **floated up 44px** across the sequence (bbox bottom
372→328), so he lifted off the floor while rising.

Fix (`scratchpad/p2frames/stabilise_recovery.py`): per-pose translation applied *before*
the dissolve — alpha-weighted centroid x locked to the sequence mean (145.63) and bbox
bottom locked to a fixed ground line (372). Row means were already ~constant, so no real
motion is lost. Then rebuilt dissolve + size ramp, with the **ramp pivot moved onto the
stabilised anchor (145.6, 372)** so scaling no longer reintroduces horizontal drift.
Residual: centroid drift **~1.5px** (was ~40px), ground **~1px** (was 44px). Start now
aligns with the Faint end to within ~1 stage px both axes. → `p2-recovery-alpha-v5.webm`
(`?v=5`); locked JSON updated with a `stabilisation` block.

**Defence size corrected.** Owner: Defence too small next to idle/attack. Cause — the
Build 29 fix assumed all sprite actions share Faint's fill fraction, but **Defence's
character only fills 0.665 of its cell vs Faint's 0.768** (Defence is a more crouched
stance drawn smaller). Measured on-screen heights: video idle @0.2205 → 0.2012, Faint
@0.26 → 0.1997 (correct), **Defence @0.26 → 0.1729 (~14% small)**. Set Defence
**h = 0.3025** → 0.2012, matching the video actions. Faint/Recovery unchanged (already
correct). Lesson: derive each action's height from *its own* measured fill fraction, never
from a sibling's.

Builds 32→34, both consoles synced byte-identical, `node --check` clean, verified in real
Chrome (Build 34, P2 Defence X/Y/H = 0.4954 / 0.6722 / 0.3025, zero console errors).

## 2026-07-22: P1 placements recovered; Galan restored to lock + Recovery ramp (Builds 35-36)

**Regression — P1 placements lost, then recovered.** Owner reported P1 and P3
Defence/Faint/Recovery looked reset. Cause: bumping the localStorage key three times
(v3→v4→v5→v6) to force new defaults through **orphaned the owner's saved placements**. P1's
per-action tuning existed ONLY in the browser (the P1 locked JSON held the flat base for all
five actions), so the console fell back to that flat base. Recovered intact from the still-
present `fh-encounter-action-placements-v3` key and **baked into the JS defaults** so a key
change can never drop them again. Backup:
`.hydra-studio-work/recovered/localStorage-v3-recovered-2026-07-22.json` (also in the
portable console).

| P1 action | Restored value |
|---|---|
| ready | 0.1165, 0.7381, 0.3468 |
| attack | 0.1165, 0.7381, 0.3350 |
| defence | 0.1244, 0.6982, 0.2369 |
| faint | 0.1289, 0.6915, 0.2272 |
| recovery | 0.1165, 0.7250, 0.1561 |

**Galan reverted to the owner-approved lock.** The earlier ×1.18 increase was undone at the
owner's direction — ready 0.8658/0.6406/0.2027, attack & defence 0.8799/0.6557/0.2697,
faint 0.8799/0.6557/0.1930.

**Galan Recovery given the zoom compensation the original note anticipated.** Measured the
conflict: its start must match the Faint end (on-screen 0.0635) but its end must match
standing (0.2259), and the clip's own height fraction only grows 0.3806→0.8903 — not enough,
so no single static h works (0.1669 fixes the start, 0.2537 fixes the end). Baked a
foot-anchored cubic-smoothstep ramp **h 0.1669 → 0.2537**, pivot at the calibration anchor
(640, 684) in the 1280×720 frame, keyframes synced to the real rise window (prone to ~0.8s,
rising to ~5.5s, then held). Placement h = **0.2537**. Result verified: on-screen 0.0634 at
the start (target 0.0635) → 0.2262 standing (target 0.2259), ground contact stable 686–693.
→ `galan-recovery-alpha-v2.webm` (`?v=2`), alpha verified (corners 0 / body 255).

**Process lesson:** do not bump the localStorage key casually — it silently discards owner
placements that may exist only in the browser. Bake approved values into the JS defaults and
the locked JSONs instead.

## 2026-07-22: Galan placements re-tuned by owner from live review (Build 37)

Owner reviewed Build 36 in a real browser tab and supplied a fresh set of exact
placements for all five Galan actions (superseding the values recorded in the previous
entry, including my own derived Recovery ramp):

| Action | X | Y | Height |
|---|---:|---:|---:|
| Ready | 0.8658 | 0.6406 | 0.2257 |
| Attack | 0.8799 | 0.6557 | 0.2854 |
| Defence | 0.8658 | 0.6406 | 0.2257 (now shares Ready's anchor) |
| Faint | 0.8799 | 0.6857 | 0.1930 (Y moved from 0.6557) |
| Recovery | 0.8579 | 0.6450 | ramps **0.2212 → 0.1752** |

Applied as given (owner's live-review numbers take precedence over my earlier derived
targets). Recovery's size direction is now the reverse of my previous attempt — it
starts at the larger value and settles smaller, not the other way round; implemented
exactly as specified rather than re-derived. Re-baked the foot-anchored ramp (pivot
unchanged at the calibration anchor, 0.5/0.95 → 640,684px in the 1280×720 frame; same
rise-timing keyframes as before, only the h values changed) → `galan-recovery-alpha-v3.webm`
(`?v=3`), alpha verified (corners 0 / body 255). The stale "Locked reference" display text
for P3 (Galan) updated to match the new Faint values (0.8799, 0.6857, 0.1930).

Build 36→37, both consoles synced byte-identical, `node --check` clean, verified live in
Chrome (all five Galan actions read back exactly as specified). Not yet committed — owner
to confirm before the next commit.

## 2026-07-22: Galan Recovery BASE_H convention corrected (Build 38)

Owner caught a real bug: the console showed Recovery's Height field as a constant
**0.1752** no matter where in the clip you looked, which didn't match either end of the
0.2212→0.1752 range just set. Root cause — my baking convention was backwards relative to
the codebase's own precedent. Checked `galan-faint-pass2.locked.json`:
`baselinePlacement.h` (0.1930) equals the *first* `lockedSizeKeyframes` entry, not the
last — i.e., **the static placement.h the console displays/uses is always the START
reference**, and later frames are scaled relative to it. My bake used the END value as
that reference instead, so the field could never show the intended start size.

Fixed: rebuilt with `BASE_H` = the start value, matching the Faint precedent. Owner also
gave revised numbers when re-examining the mismatch: start **h=0.135**, end
**h=0.1648** (supersedes the 0.2212/0.1752 pair from the previous entry). Same rise-timing
keyframes as before (prone→~0.8s, rising→~5.5s, held). → `galan-recovery-alpha-v4.webm`
(`?v=4`), `defaults.galan.recovery.h = 0.135`. Alpha verified (corners 0/body 255,
80% transparent). Verified live: the Height field now reads exactly `0.1350`.

Build 37→38, both consoles synced, `node --check` clean, zero console errors in Chrome.

## 2026-07-22: Galan Recovery — X/Y/H update + real head-clipping bug fixed (Build 39)

Owner reported two things from Build 38: (1) Recovery placement should be
X=0.8579/Y=0.6857/H(start)=0.15 (Y now matches Faint's, H nudged from 0.135); (2) the top
of Galan's head was cut off.

**Diagnosed (2) precisely rather than guessing.** Computed the exact stage-space top edge
for all five Galan actions from real measured frame content + real calibration — none of
them were clipped by the *stage's* CSS overflow. The actual bug was one level deeper: it's
baked into the video pixels. Growing a size ramp (start 0.135 → end 0.1648) requires
scaling later frames *up* around the foot pivot (near the bottom of frame), and the raw
source footage only has 52px of headroom above the head at 1280×720 — scaling up by the
needed ~9–22% pushes the head past row 0 of the fixed encode canvas, permanently cropping
it into the file. Confirmed directly: raw end frame top-row=52, baked end frame top-row=0.

**Fix:** bake onto a padded canvas — extra transparent room added on top (and symmetric
left/right to preserve the exact 16:9 aspect ratio, so nothing distorts), sized to the
actual headroom the max scale factor needs plus a safety margin. Canvas grew
1280×720 → 1463×823; pivot and calibration recomputed to the new frame fractions
(cx≈0.4997, cy≈0.9563 — functionally unchanged position, just measured against the taller
canvas). Verified post-bake: minimum headroom across all 240 frames is 37px (was 0/clipped
at the tightest frame). → `galan-recovery-alpha-v5.webm` (`?v=5`), alpha verified.

Placement: `x:.8579, y:.6857, h:.15`. Alpha confirmed clean, `node --check` passes, both
consoles synced, verified live in Chrome (fields read back exactly 0.8579/0.6857/0.1500,
zero console errors) and visually re-rendered through the actual stage transform math —
head fully clear with margin in the tightest frame.

## 2026-07-22: Galan Recovery placement-only tweak for final test (Build 40)

Owner: since the size ramp's relative shape is already baked into
`galan-recovery-alpha-v5.webm`, a placement.h change uniformly rescales the whole clip
(start and end together) without needing a rebake — confirmed correct, matches how the
system works. Updated `defaults.galan.recovery` to `x:.8579, y:.6841, h:.1698` (was
`y:.6857, h:.15`); X and the clip/calibration unchanged. Build 39→40, both consoles
synced, `node --check` clean, verified live (fields read back exactly
0.8579/0.6841/0.1698, zero console errors). For final owner test.

## 2026-07-22: Build 40 locked as milestone "Hydra-Echo"

Owner approved and locked the current state of the console as milestone **Hydra-Echo**
(Build 40). This is the first lock that includes P2 (Tank) — previously only Hydra and P1
were locked, with P2 explicitly pending review through the whole animation-ingest and
size-correction process documented above.

**Locked JSON files** (all in `.hydra-studio-work/`, mirrored to the portable console),
each tagged `"milestone": "Hydra-Echo"`, `"consoleBuild": 40`:

- `p1-room10-action-placement.locked.json` — updated to schemaVersion 2 with the real
  per-action values (see the 2026-07-22 recovery entry above; the old lock only ever held
  one flat value for all five actions).
- `p2-room10-action-placement.locked.json` — **new**, first lock for P2. Ready/Attack
  0.4954/0.6722/0.2205, Defence 0.4954/0.6722/0.3025, Faint/Recovery
  0.4954/0.6722/0.2600 (Recovery's `h` scales a baked ramp down to 0.21 at the kneel).
- `galan-room10-action-placement.locked.json` — updated to schemaVersion 2. Ready/Defence
  0.8658/0.6406/0.2257, Attack 0.8799/0.6557/0.2854, Faint 0.8799/0.6857/0.1930, Recovery
  0.8579/0.6841/0.1698 (h scales the baked start→end ramp uniformly, ramp shape/canvas
  padding documented in the JSON's `recoverySizeRamp` block).
- `hydra-room10-placement.locked.json` — Hydra's own entrance/attack/dead positions
  unchanged; the `characters` snapshot block (stale since per-action placements were
  introduced) refreshed to each actor's Ready pose with a pointer to the per-actor files.

**Console**: header now reads "Build 40 · Hydra-Echo (Locked)"; the "Locked reference"
panel relabeled "(Ready pose)" and its three values corrected to match. Verified served
correctly via direct fetch (automated Chrome tab was unavailable this pass; no JS logic
changed, HTML-only label edits). Both consoles synced byte-identical.

## Repository safety note

The nested `fiends-hero-roguelike` checkout on G: was not modified because its index currently reports the complete tracked tree as deleted while matching paths appear untracked. The Obsidian status record is committed to the clean outer `fable-fh-vault` repository only.
