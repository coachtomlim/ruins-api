-- Cover new catalog foreign keys introduced by the authoritative Runner projection.

create index if not exists player_runner_template_catalog_idx
  on public.player_runner(runner_template_id);

create index if not exists runner_item_ownership_catalog_slot_idx
  on public.runner_item_ownership(item_id, slot);
