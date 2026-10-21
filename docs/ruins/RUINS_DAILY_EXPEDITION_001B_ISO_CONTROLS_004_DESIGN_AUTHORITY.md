# RUINS Daily Expedition | ISO_CONTROLS_004 Dev4 design and source change
Date: 2026-10-21
Authority: Dungeon Bravo Dev4
Design decision: Owner screenshot observation, slanted isometric movement, game-like controls.
Base source: acee65b7dd5de39691f8e554661a6af5f1289278
Scope: Day 1 presentation controls only; no gameplay/state/store changes, no native engine modifications.

## Correct screen-direction authority
Source: day1-state.mjs defines up [0,-1], right [1,0], down [0,1], left [-1,0].
Source isometric coordinates from day1-art.mjs: screenX=(x-y)tw/2 and screenY=(x+y)th/2.
Therefore:
- source left -> northwest (↖) top left
- source up -> northeast (↗) top right
- source down -> southwest (↙) bottom left
- source right -> southeast (↘) bottom right

All bindings stay unchanged. Keyboard arrows remain backward compatible even though the on-screen arrows now point along the actual isometric axes.

## Visual contract
Use 2×2 stone/bronze octagonal rune buttons, consistent with game presentation and existing muted-gold RUINS style. Carved diagonal arrow SVG, 46×46 min on 320, 48×48 elsewhere. Focus visible, active/tap feedback, pointer and keyboard friendly, decorative glyphs aria-hidden. No external/new art, licence changes, sound, global CSS, new packages.

## Deliverables (Dev4)
- HTML control block and visual stylesheet link
- isolated day1-iso-controls.css, layered after day1-visual-002.css
- behavioral projection and presentation tests
- this governance note
Design is source-level, not browser-verified yet.

## Codex, bounded remaining work
Run Node focused and frozen regressions and the full suite, inspect 320x568,360x640,390x844,tablet,desktop; click each of 4 arrows from interior tile and verify screenshot motion, no document overflow or touch collisions. Check actual touch comfort and isometric directions, journal and completion unaffected. Reuse corrected Recapture 003 evidence and produce new differentiated final-state captures. Save evidence under VISUAL_002/ISO_CONTROLS_004. If any issue, fix only isometric presentation control files and matching test. Commit normally; preserve Owner BAT, vercel-storage-audit, main/frozen releases/Supabase. No deployment.
DOT independent second visual gate only AFTER Codex visual evidence. Dev4 reconciles all results.
