-- WEB-FLARE S9 Builder Progression + Challenge Journal 001
-- Persistent, authenticated publishing history for the existing frozen S8A /m/<code> challenge
-- format. Builder progression is cosmetic only: no Gold, Runner XP, stats, gear or reward authority.
-- Friend opens/completions remain untracked because the frozen S8A receiver has no trustworthy
-- authenticated completion callback.

create table if not exists public.builder_challenge (
  id uuid primary key default gen_random_uuid(),
  owner_player_id uuid not null references public.player_profile(id) on delete cascade,
  owner_runner_id uuid not null references public.player_runner(id) on delete cascade,
  runner_id text not null check (runner_id in ('warrior-l1','warrior-l2','warrior-l3')),
  target_hp integer not null check (target_hp between 5 and 95 and target_hp % 5 = 0),
  invite_code text not null check (invite_code ~ '^[A-Za-z0-9_-]{4}$'),
  sender_name text not null check (char_length(sender_name) between 1 and 32),
  created_at timestamptz not null default now(),
  unique (owner_player_id, runner_id, target_hp)
);

create index if not exists builder_challenge_owner_idx
  on public.builder_challenge(owner_player_id, created_at desc, id);

alter table public.builder_challenge enable row level security;
drop policy if exists builder_challenge_select_own on public.builder_challenge;
create policy builder_challenge_select_own
on public.builder_challenge for select
to authenticated
using (owner_player_id = (select auth.uid()));
revoke all on table public.builder_challenge from anon, authenticated;
grant select on table public.builder_challenge to authenticated;

create table if not exists public.builder_xp_event (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profile(id) on delete cascade,
  player_runner_id uuid not null references public.player_runner(id) on delete cascade,
  challenge_id uuid not null unique references public.builder_challenge(id) on delete cascade,
  amount integer not null check (amount = 10),
  reason text not null check (reason = 'challenge_publish'),
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists builder_xp_event_player_idx
  on public.builder_xp_event(player_id, created_at, id);

alter table public.builder_xp_event enable row level security;
drop policy if exists builder_xp_event_select_own on public.builder_xp_event;
create policy builder_xp_event_select_own
on public.builder_xp_event for select
to authenticated
using (player_id = (select auth.uid()));
revoke all on table public.builder_xp_event from anon, authenticated;
grant select on table public.builder_xp_event to authenticated;

create or replace function public.builder_level_for_xp(p_xp integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(p_xp,0) >= 180 then 5
    when coalesce(p_xp,0) >= 100 then 4
    when coalesce(p_xp,0) >= 50 then 3
    when coalesce(p_xp,0) >= 20 then 2
    else 1
  end
$$;

create or replace function public.builder_level_threshold(p_level integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_level
    when 1 then 0
    when 2 then 20
    when 3 then 50
    when 4 then 100
    when 5 then 180
    else 180
  end
$$;

revoke all on function public.builder_level_for_xp(integer) from public, anon;
revoke all on function public.builder_level_threshold(integer) from public, anon;
grant execute on function public.builder_level_for_xp(integer) to authenticated;
grant execute on function public.builder_level_threshold(integer) to authenticated;

-- SQL twin of frozen S8A flow.mjs encodeInviteCode().
create or replace function public.s8a_invite_code(p_runner_id text, p_target_hp integer)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_runner integer;
  v_target_index integer;
  v_payload integer;
  v_x bigint;
  v_check integer;
  v_packed bigint;
  v_alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  v_out text := '';
  v_shift integer;
  v_index integer;
begin
  v_runner := case p_runner_id
    when 'warrior-l1' then 0
    when 'warrior-l2' then 1
    when 'warrior-l3' then 2
    else -1
  end;
  if v_runner < 0 then raise exception 'BUILDER_RUNNER_NOT_ENCODABLE'; end if;
  if p_target_hp is null or p_target_hp < 5 or p_target_hp > 95 or p_target_hp % 5 <> 0 then
    raise exception 'BUILDER_TARGET_INVALID';
  end if;

  v_target_index := p_target_hp / 5 - 1;
  v_payload := (2 << 7) | (v_runner << 5) | v_target_index;

  v_x := v_payload # 858;
  v_x := v_x * 107 + 41;
  v_x := v_x # (v_x >> 6);
  v_x := v_x * 59 + 13;
  v_check := (v_x & 16383)::integer;
  v_packed := (v_payload::bigint << 14) | v_check::bigint;

  foreach v_shift in array array[18,12,6,0] loop
    v_index := ((v_packed >> v_shift) & 63)::integer;
    v_out := v_out || substr(v_alphabet, v_index + 1, 1);
  end loop;
  return v_out;
end;
$$;

revoke all on function public.s8a_invite_code(text,integer) from public, anon;
grant execute on function public.s8a_invite_code(text,integer) to authenticated;

create or replace function public.create_builder_challenge(p_target_hp integer)
returns table (
  challenge_id uuid,
  runner_id text,
  target_hp integer,
  invite_code text,
  sender_name text,
  builder_xp_awarded integer,
  total_builder_xp integer,
  builder_level integer,
  duplicate boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player uuid := auth.uid();
  v_profile public.player_profile%rowtype;
  v_state jsonb;
  v_runner_id uuid;
  v_effective_hp integer;
  v_invite_runner text;
  v_code text;
  v_existing public.builder_challenge%rowtype;
  v_challenge public.builder_challenge%rowtype;
  v_total integer;
  v_sender text;
begin
  if v_player is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_target_hp is null or p_target_hp < 5 or p_target_hp > 95 or p_target_hp % 5 <> 0 then
    raise exception 'BUILDER_TARGET_INVALID';
  end if;

  select * into v_profile
  from public.player_profile p
  where p.id = v_player
  for update;
  if not found then raise exception 'PLAYER_PROFILE_REQUIRED'; end if;

  select public.get_account_runner_state(null::uuid) into v_state;
  v_runner_id := nullif(v_state ->> 'player_runner_id','')::uuid;
  v_effective_hp := (v_state #>> '{effective_stats,hp}')::integer;
  if v_runner_id is null then raise exception 'RUNNER_NOT_FOUND'; end if;

  -- Match frozen friend-share nearestRunnerId() tie behavior: ties stay with the lower tier.
  v_invite_runner := case
    when v_effective_hp <= 105 then 'warrior-l1'
    when v_effective_hp <= 115 then 'warrior-l2'
    else 'warrior-l3'
  end;

  v_sender := left(regexp_replace(coalesce(nullif(trim(v_profile.display_name),''),'Buddy'),'[<>]','','g'),32);
  if v_sender = '' then v_sender := 'Buddy'; end if;
  v_code := public.s8a_invite_code(v_invite_runner,p_target_hp);

  select * into v_existing
  from public.builder_challenge c
  where c.owner_player_id = v_player
    and c.runner_id = v_invite_runner
    and c.target_hp = p_target_hp;

  if found then
    select coalesce(sum(e.amount),0)::integer into v_total
    from public.builder_xp_event e
    where e.player_id = v_player;

    return query select
      v_existing.id,v_existing.runner_id,v_existing.target_hp,v_existing.invite_code,
      v_existing.sender_name,0,v_total,public.builder_level_for_xp(v_total),true,v_existing.created_at;
    return;
  end if;

  insert into public.builder_challenge(
    owner_player_id,owner_runner_id,runner_id,target_hp,invite_code,sender_name
  ) values (
    v_player,v_runner_id,v_invite_runner,p_target_hp,v_code,v_sender
  )
  returning * into v_challenge;

  insert into public.builder_xp_event(
    player_id,player_runner_id,challenge_id,amount,reason,idempotency_key
  ) values (
    v_player,v_runner_id,v_challenge.id,10,'challenge_publish','builder-publish:' || v_challenge.id::text
  );

  select coalesce(sum(e.amount),0)::integer into v_total
  from public.builder_xp_event e
  where e.player_id = v_player;

  return query select
    v_challenge.id,v_challenge.runner_id,v_challenge.target_hp,v_challenge.invite_code,
    v_challenge.sender_name,10,v_total,public.builder_level_for_xp(v_total),false,v_challenge.created_at;
end;
$$;

revoke all on function public.create_builder_challenge(integer) from public, anon;
grant execute on function public.create_builder_challenge(integer) to authenticated;

create or replace function public.get_builder_progression()
returns table (
  total_builder_xp integer,
  builder_level integer,
  level_threshold integer,
  next_level_threshold integer,
  xp_remaining integer,
  max_level boolean,
  published_challenges integer
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_player uuid := auth.uid();
  v_total integer;
  v_level integer;
  v_next integer;
  v_count integer;
begin
  if v_player is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.player_profile p where p.id=v_player) then
    raise exception 'PLAYER_PROFILE_REQUIRED';
  end if;

  select coalesce(sum(e.amount),0)::integer into v_total
  from public.builder_xp_event e where e.player_id=v_player;
  select count(*)::integer into v_count
  from public.builder_challenge c where c.owner_player_id=v_player;

  v_level := public.builder_level_for_xp(v_total);
  v_next := least(v_level+1,5);

  return query select
    v_total,v_level,public.builder_level_threshold(v_level),
    public.builder_level_threshold(v_next),
    case when v_level>=5 then 0 else public.builder_level_threshold(v_next)-v_total end,
    v_level>=5,v_count;
end;
$$;

revoke all on function public.get_builder_progression() from public, anon;
grant execute on function public.get_builder_progression() to authenticated;

create or replace function public.get_builder_challenges(p_limit integer default 20)
returns table (
  challenge_id uuid,
  runner_id text,
  target_hp integer,
  invite_code text,
  sender_name text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select c.id,c.runner_id,c.target_hp,c.invite_code,c.sender_name,c.created_at
  from public.builder_challenge c
  where c.owner_player_id = auth.uid()
  order by c.created_at desc,c.id desc
  limit least(greatest(coalesce(p_limit,20),1),100)
$$;

revoke all on function public.get_builder_challenges(integer) from public, anon;
grant execute on function public.get_builder_challenges(integer) to authenticated;
