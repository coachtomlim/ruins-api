-- S8B account-foundation saved-goal boundary.
-- Saved-goal writes are validated and server-derived; browser roles retain read-only table access.

revoke insert, update, delete on table public.saved_goal from authenticated;
grant select on table public.saved_goal to authenticated;

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
set search_path = public
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

revoke all on function public.save_account_goal(text, text, integer) from public;
revoke all on function public.save_account_goal(text, text, integer) from anon;
grant execute on function public.save_account_goal(text, text, integer) to authenticated;
