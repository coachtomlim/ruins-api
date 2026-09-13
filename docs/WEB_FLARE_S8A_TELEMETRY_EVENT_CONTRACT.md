# WEB-FLARE S8A Telemetry Event Contract

Purpose: prepare measurable product-learning signals without coupling S8A to a telemetry vendor.

S8A does not need to send these events anywhere yet. The next build may expose them to a test harness or in-memory debug collector.

## Event principles

- No passwords, email addresses, auth tokens or free-form personal text.
- Sender display name is excluded from telemetry payloads.
- Events use controlled enums and numeric values.
- Telemetry must never influence deterministic simulation.

## Suggested events

- `invite_viewed` `{runner_id,target_hp}`
- `challenge_accepted` `{runner_id,target_hp}`
- `dungeon_selected` `{room_id}`
- `customize_opened` `{room_id}`
- `customize_panel_viewed` `{panel}`
- `customize_done` `{budget_used}`
- `run_started` `{room_id,budget_used}`
- `camera_mode_changed` `{mode}`
- `run_completed` `{status,actual_hp_percent,target_hp,score,hero_gold,builder_gold,seconds}`
- `run_again_selected` `{}`
- `edit_dungeon_selected` `{}`
- `registration_gate_viewed` `{target_hp,runner_id}`
- `registration_gate_back` `{}`

## Product metrics enabled later

- acceptance rate from invitation to challenge acceptance;
- percentage of receivers using zero-customization path;
- customization category usage;
- run completion/failure distribution;
- frequency of Overview use;
- replay/edit behavior after rewards;
- conversion intent represented by registration-gate entry.

## Test collector

A future test harness may inject a callback such as `emit(eventName,payload)` and assert event order. Default production behavior may remain no-op until a real telemetry decision is approved.
