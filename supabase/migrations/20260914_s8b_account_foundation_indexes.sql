-- S8B account foundation FK indexes identified by Supabase performance advisor.
create index if not exists runner_loadout_weapon_ownership_idx on public.runner_loadout(weapon_ownership_id);
create index if not exists runner_loadout_shield_ownership_idx on public.runner_loadout(shield_ownership_id);
create index if not exists runner_loadout_head_ownership_idx on public.runner_loadout(head_ownership_id);
create index if not exists runner_loadout_chest_ownership_idx on public.runner_loadout(chest_ownership_id);
create index if not exists runner_loadout_hands_ownership_idx on public.runner_loadout(hands_ownership_id);
create index if not exists runner_loadout_legs_ownership_idx on public.runner_loadout(legs_ownership_id);
create index if not exists runner_loadout_feet_ownership_idx on public.runner_loadout(feet_ownership_id);
