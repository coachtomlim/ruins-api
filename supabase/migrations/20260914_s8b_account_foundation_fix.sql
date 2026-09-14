-- Fix PL/pgSQL output-parameter/column ambiguity in ensure_starter_account.

create or replace function public.ensure_starter_account()
returns table (
  player_runner_id uuid,
  starter_runner_template_id text,
  weapon_ownership_id uuid,
  shield_ownership_id uuid,
  starter_created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player uuid := auth.uid();
  v_runner uuid;
  v_weapon uuid;
  v_shield uuid;
  v_existing_runner uuid;
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists (select 1 from public.player_profile p where p.id = v_player) then
    raise exception 'PLAYER_PROFILE_REQUIRED';
  end if;

  select r.id into v_existing_runner
  from public.player_runner r
  where r.owner_player_id = v_player
    and r.runner_template_id = 'warrior-l1';

  insert into public.player_runner(
    owner_player_id,
    runner_template_id,
    display_name,
    progression_version
  ) values (
    v_player,
    'warrior-l1',
    'Rookie Warrior',
    's8b-1'
  )
  on conflict (owner_player_id, runner_template_id)
  do update set updated_at = public.player_runner.updated_at
  returning id into v_runner;

  insert into public.runner_item_ownership(
    owner_player_id,
    item_id,
    slot,
    acquisition_reason,
    source_ref,
    idempotency_key
  ) values (
    v_player,
    'wooden-club',
    'weapon',
    'STARTER_GRANT',
    'starter:warrior-l1',
    'starter:' || v_player::text || ':warrior-l1:wooden-club'
  )
  on conflict (idempotency_key)
  do update set idempotency_key = excluded.idempotency_key
  returning id into v_weapon;

  insert into public.runner_item_ownership(
    owner_player_id,
    item_id,
    slot,
    acquisition_reason,
    source_ref,
    idempotency_key
  ) values (
    v_player,
    'wooden-shield',
    'shield',
    'STARTER_GRANT',
    'starter:warrior-l1',
    'starter:' || v_player::text || ':warrior-l1:wooden-shield'
  )
  on conflict (idempotency_key)
  do update set idempotency_key = excluded.idempotency_key
  returning id into v_shield;

  insert into public.runner_loadout(
    player_runner_id,
    weapon_ownership_id,
    shield_ownership_id,
    head_ownership_id,
    chest_ownership_id,
    hands_ownership_id,
    legs_ownership_id,
    feet_ownership_id
  ) values (
    v_runner,
    v_weapon,
    v_shield,
    null,
    null,
    null,
    null,
    null
  )
  on conflict (player_runner_id)
  do nothing;

  return query
  select v_runner,
         'warrior-l1'::text,
         v_weapon,
         v_shield,
         (v_existing_runner is null);
end;
$$;

revoke all on function public.ensure_starter_account() from public;
revoke all on function public.ensure_starter_account() from anon;
grant execute on function public.ensure_starter_account() to authenticated;
