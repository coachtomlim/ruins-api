# Hydra Boss-room placement console

This standalone review UI uses the canonical Room 10 background and regular 4-player layout (Sheja, Ironscale, and Galan) to position the Hydra animations. It contains no Musca record, tag, asset, or runtime dependency.

Open `http://127.0.0.1:5198/` after double-clicking `Start Hydra Placement Console.bat`.

## Prepared runtime candidates

- `assets/hydra-attack.webm`: full source, 240 frames, 10.00 seconds.
- `assets/hydra-entrance.webm`: source seconds 10–0 in reverse, 239 frames, 9.92 seconds. Its placement reference is the original source frame at 0 seconds, which is the final frame of the reversed candidate.
- `assets/hydra-dead.webm`: full source, 240 frames, 10.00 seconds.

All candidates are silent VP9 WebM, constant 24 fps, `yuva420p`, `alpha_mode=1`. Green is converted to transparency and the source generator mark is removed before keying.

Drag the Hydra directly, use the mouse wheel to resize, or use the right-side sliders. `Copy placement JSON` produces the values to lock into production after owner review.
