-- S8B account foundation privilege hardening.
-- Starter Runner, ownership and loadout are server-authoritative and must not be directly mutated by browser roles.

revoke all on table public.player_runner from anon, authenticated;
revoke all on table public.runner_item_ownership from anon, authenticated;
revoke all on table public.runner_loadout from anon, authenticated;

grant select on table public.player_runner to authenticated;
grant select on table public.runner_item_ownership to authenticated;
grant select on table public.runner_loadout to authenticated;
