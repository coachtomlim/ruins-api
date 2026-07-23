---
title: Hydra Runtime Animation Ingestion and Placement Lock
aliases:
  - Hydra Production Animation Workflow
  - Room 10 Hydra Placement Lock
status: owner-approved-locked
date: 2026-07-20
project: F&H Fable - Adventure Ruins Charlie
room: room.10
tags:
  - fable-fh
  - adventure-ruins-charlie
  - production
  - animation
  - hydra
  - room-10
  - runtime-assets
---

# Hydra Runtime Animation Ingestion and Placement Lock

## Outcome

The three Hydra source videos have been prepared as silent, transparent VP9 WebM runtime candidates at a constant 24 FPS. The Room 10 Hydra and party positions below are owner-approved and locked.

The lock is data-driven. Browser-local state is not authoritative and must never be used to recapture or override the final values.

## Locked placement record

Stage coordinates are normalized against the 1080 × 1920 Room 10 stage:

- `x`: horizontal foot-anchor position, normalized from `0` to `1`.
- `y`: vertical foot-anchor position. Values above `1` intentionally place the Hydra below the stage edge.
- `h`: rendered actor height as a fraction of stage height.
- Anchor: `foot-center`.
- Character layer: `20`.
- Hydra layer: `25`, in front of all characters.

### Characters

| Actor | X | Y | Height |
|---|---:|---:|---:|
| P1 | 0.1165 | 0.7381 | 0.3350 |
| P2 | 0.4954 | 0.6722 | 0.2600 |
| P3 | 0.8799 | 0.6557 | 0.1930 |

### Hydra animations

| Animation | X | Y | Height | Playback |
|---|---:|---:|---:|---|
| Entrance | 0.5092 | 1.3826 | 1.1150 | Reverse, source 10 seconds → 0 seconds |
| Attack | 0.4837 | 1.1913 | 1.3070 | Full 10-second source |
| Dead | 0.5055 | 1.3340 | 1.2010 | Full 10-second source |

Canonical machine-readable record in the current Adventure Ruins Charlie working copy:

`ruins-api/.hydra-studio-work/hydra-room10-placement.locked.json`

## Source inputs

| Source | Use |
|---|---|
| `Hydra Entrance (to reverse play).mp4` | Full source reversed from approximately 10 seconds to 0 seconds |
| `Hydra Attack (1-4 Secs).mp4` | Full 10-second video; the earlier four-second cut is superseded |
| `Hydra Dead.mp4` | Full 10-second video |

The sources are 24 FPS H.264 MP4 files with audio. Production candidates remove audio and normalize timing to constant 24 FPS.

## Output contract

| Output | Codec | Pixel format | FPS | Audio | Duration |
|---|---|---|---:|---|---:|
| `hydra-entrance.webm` | VP9 | `yuva420p` | 24 | None | ~9.92 s |
| `hydra-attack.webm` | VP9 | `yuva420p` | 24 | None | 10.00 s |
| `hydra-dead.webm` | VP9 | `yuva420p` | 24 | None | 10.00 s |

Every WebM must carry `alpha_mode=1`. Use `libvpx-vp9`, CRF 32, zero target bitrate, row multithreading, and `auto-alt-ref=0` for alpha-safe encoding.

## Green-screen removal approach

### Important finding

A broad, single global green key damaged the Entrance and Dead animations. Dark purple Hydra pixels were incorrectly classified as background, producing skeletal gaps through the necks, torso, legs, and tail.

The approved approach uses several narrow green samples instead of one broad tolerance:

1. Convert the decoded frame to RGBA.
2. Remove the source generator mark by replacing its bottom-right area with a sampled green before keying.
3. Apply three narrow `colorkey` passes against the background gradient:
   - `0x3c9844`
   - `0x54aa59`
   - `0x2d7838`
4. Use similarity `0.13` and blend `0.025` for each pass.
5. Apply green despill with mix `0.9` and expand `0.12`.
6. Convert to `yuva420p` only after the RGBA matte is complete.

Representative filter chain for Entrance and Dead:

```text
drawbox=x=1125:y=560:w=130:h=120:color=0x3c9844:t=fill,
format=rgba,
colorkey=0x3c9844:0.13:0.025,
colorkey=0x54aa59:0.13:0.025,
colorkey=0x2d7838:0.13:0.025,
despill=type=green:mix=0.9:expand=0.12,
format=yuva420p
```

The Attack source uses a brighter green background and its own key sample. Do not automatically reuse the Entrance/Dead sample colours for future clips.

## Entrance reversal and reference frame

The Entrance candidate is encoded in reverse order. Runtime playback begins at the original source’s final frame and ends at its original 0-second frame.

Placement is judged against the original 0-second source frame, which is the final visual frame of the reversed candidate. The review UI uses `hydra-entrance-anchor.png` as the stable placement reference instead of depending on WebM seeking.

## Character-source rule

P1, P2, and P3 visuals come from the latest Sprite Animation Console composition at `http://localhost:5197/`.

Only the current character visuals are reused. Musca imagery, encounter records, tags, and runtime data are excluded from the Hydra review and production record.

## Placement-review process

1. Open the Hydra review console.
2. Select Entrance, Attack, or Dead and play the selected animation.
3. Adjust each Hydra animation independently during review.
4. Adjust P1, P2, and P3 independently.
5. Obtain explicit owner approval for every coordinate.
6. Copy approved values into the locked JSON record.
7. Replace mutable UI state with the locked values.
8. Disable placement controls after approval.
9. Verify the rendered UI contract against the locked JSON record.
10. Treat the locked JSON—not browser storage, a screenshot, or an open tab—as the source of truth.

## Capture-integrity rule

The first capture attempt reported stale P1/P2/P3 defaults because the review UI migrated values across versioned browser-storage keys. A valid-looking contract was produced from the wrong state.

This failure mode is now prohibited:

- Do not infer final coordinates from whichever browser tab happens to be open.
- Do not merge final production values with `localStorage`.
- Do not treat UI defaults as approved coordinates.
- Do not recapture approved values from a migrated browser session.
- Do compare the UI contract field-for-field with the locked JSON file.
- Do preserve four decimal places in human-readable production documentation.

## Verification checklist

- [x] Entrance renders a complete Hydra without skeletal alpha loss.
- [x] Dead renders a complete Hydra without skeletal alpha loss.
- [x] Attack plays the full 10-second, 240-frame source.
- [x] Entrance plays in reverse.
- [x] Green background is transparent and green spill is suppressed.
- [x] Source generator mark is removed before keying.
- [x] Hydra is foreground relative to P1/P2/P3.
- [x] Each Hydra animation has its own placement.
- [x] P1/P2/P3 have independent placements.
- [x] UI placement controls are locked after owner approval.
- [x] UI contract matches the canonical locked JSON record.
- [x] Musca data is absent from the Hydra UI and lock record.

## Change-control policy

Any later placement change requires all of the following:

1. An explicit owner-provided replacement coordinate set.
2. A revision to the canonical locked JSON record.
3. A matching revision to this document.
4. A fresh visual review of all three animations.
5. A new Git commit identifying the changed coordinates.

Do not silently alter only the UI, only the documentation, or only the runtime data.
