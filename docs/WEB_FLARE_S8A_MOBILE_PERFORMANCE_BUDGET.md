# WEB-FLARE S8A Mobile Performance Budget

This is a practical acceptance budget for the receiver journey, not a hard platform SLA.

## Interaction targets

- Invitation should become usable promptly after required model/actor data is ready.
- Panel transitions should feel immediate and must not trigger network fetches for already-loaded local UI state.
- `ACCEPT CHALLENGE`, room switching, customization tab switching and reward actions should respond on the next frame under normal conditions.

## Runtime targets

- Preserve fixed deterministic simulation authority independent of render frame rate.
- Avoid adding animation libraries or layout-heavy effects to the runtime.
- Overview/FOLLOW HERO switches should not rebuild the simulation or refetch assets.

## Asset behavior

- Reuse accepted Flare assets and caches where possible.
- Do not duplicate large asset payloads merely to create S8A route isolation.
- Do not introduce new external art in S8A.

## Mobile layout

- Avoid continuous layout thrashing from measuring/repositioning large panels every frame.
- Canvas resize should respond to viewport changes, not run as a repeated hot-loop layout read.

## Browser proof

The next build should record at least:

- time from document load to invitation action enabled;
- whether any primary panel transition causes an unexpected network request;
- runtime frame/simulation separation remains intact;
- no console errors during the complete phone journey.

Performance findings should be reported, but do not sacrifice deterministic correctness or readability to meet an arbitrary timing number.
