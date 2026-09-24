-- P10 §5 security review finding: two SECURITY DEFINER functions from the earliest S8B foundation
-- migrations (ensure_starter_account, save_account_goal) were defined with `set search_path = public`
-- instead of the empty-string `search_path = ''` every other SECURITY DEFINER function in this project
-- uses. Every object reference in both bodies is already schema-qualified (public.*, auth.uid()), so
-- tightening search_path here changes nothing about their behavior — it only removes the (low but
-- nonzero) risk that a future writable-schema change could let an unqualified reference resolve to an
-- attacker-controlled object. No return type, argument list, or grant changes; only `create or replace`.

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
set search_path = ''
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
  on conflict on constraint runner_loadout_pkey
  do nothing;

  return query
  select v_runner,
         'warrior-l1'::text,
         v_weapon,
         v_shield,
         (v_existing_runner is null);
end;
$$;

create or replace function public.save_account_goal(
  p_source_sender_name text,
  p_runner_id text,
  p_target_hp integer
)
returns table (
  saved_goal_id uuid,
  runner_id text,
  runner_name text,
  runner_level integer,
  target_hp integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player uuid := auth.uid();
  v_runner_id text := btrim(coalesce(p_runner_id, ''));
  v_sender text := left(btrim(coalesce(p_source_sender_name, '')), 64);
  v_runner_name text;
  v_runner_level integer;
  v_goal_id uuid;
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists (select 1 from public.player_profile p where p.id = v_player) then
    raise exception 'PLAYER_PROFILE_REQUIRED';
  end if;

  case v_runner_id
    when 'warrior-l1' then v_runner_name := 'Rookie Warrior'; v_runner_level := 1;
    when 'warrior-l2' then v_runner_name := 'Seasoned Warrior'; v_runner_level := 2;
    when 'warrior-l3' then v_runner_name := 'Tough Warrior'; v_runner_level := 3;
    else raise exception 'RUNNER_NOT_ALLOWED';
  end case;

  if p_target_hp is null or p_target_hp < 5 or p_target_hp > 95 or mod(p_target_hp, 5) <> 0 then
    raise exception 'TARGET_HP_NOT_ALLOWED';
  end if;

  insert into public.saved_goal(
    owner_player_id,
    source_sender_name,
    source_runner_id,
    source_runner_name,
    source_runner_level,
    target_hp
  ) values (
    v_player,
    v_sender,
    v_runner_id,
    v_runner_name,
    v_runner_level,
    p_target_hp
  )
  returning id into v_goal_id;

  return query
  select v_goal_id, v_runner_id, v_runner_name, v_runner_level, p_target_hp;
end;
$$;
