-- WEB-FLARE S8B solo economy floor 001.
-- Branch-only migration candidate. Do not apply without separate staging authorization.
-- Adds an idempotent server-authoritative Daily Bonus. Practice remains reward-free.

alter table public.wallet_ledger drop constraint if exists wallet_ledger_reason_check;
alter table public.wallet_ledger
  add constraint wallet_ledger_reason_check check (
    reason in (
      'dungeon_builder_reward',
      'hero_runner_reward_claim',
      'asset_purchase',
      'admin_adjustment',
      'runner_stat_upgrade',
      'equipment_purchase',
      'armor_purchase',
      'daily_login_bonus'
    )
  );

create table if not exists public.daily_login_claim (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profile(id) on delete cascade,
  reward_day date not null,
  streak_day integer not null check (streak_day between 1 and 7),
  base_gold integer not null check (base_gold = 5),
  streak_bonus_gold integer not null check (streak_bonus_gold in (0,10)),
  ledger_entry_id uuid not null unique references public.wallet_ledger(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (player_id, reward_day),
  check (
    (streak_day = 7 and streak_bonus_gold = 10)
    or
    (streak_day between 1 and 6 and streak_bonus_gold = 0)
  )
);

create index if not exists daily_login_claim_player_idx
  on public.daily_login_claim(player_id, reward_day desc, id);

alter table public.daily_login_claim enable row level security;

drop policy if exists daily_login_claim_select_own on public.daily_login_claim;
create policy daily_login_claim_select_own
on public.daily_login_claim for select
to authenticated
using (player_id = (select auth.uid()));

revoke all on table public.daily_login_claim from anon, authenticated;
grant select on table public.daily_login_claim to authenticated;

create or replace function public.get_daily_login_status()
returns table (
  reward_day date,
  claimed_today boolean,
  current_streak_day integer,
  next_streak_day integer,
  claimable_gold integer,
  next_reset_at timestamptz
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_player uuid := auth.uid();
  v_day date := (now() at time zone 'UTC')::date;
  v_today public.daily_login_claim%rowtype;
  v_last public.daily_login_claim%rowtype;
  v_current integer := 0;
  v_next integer := 1;
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists (select 1 from public.player_profile p where p.id = v_player) then
    raise exception 'PLAYER_PROFILE_REQUIRED';
  end if;

  select * into v_today
  from public.daily_login_claim c
  where c.player_id = v_player
    and c.reward_day = v_day;

  if found then
    v_current := v_today.streak_day;
    v_next := case when v_today.streak_day >= 7 then 1 else v_today.streak_day + 1 end;

    return query
    select
      v_day,
      true,
      v_current,
      v_next,
      0,
      ((v_day + 1)::timestamp at time zone 'UTC');
    return;
  end if;

  select * into v_last
  from public.daily_login_claim c
  where c.player_id = v_player
    and c.reward_day < v_day
  order by c.reward_day desc, c.created_at desc, c.id desc
  limit 1;

  if found and v_last.reward_day = v_day - 1 then
    v_current := v_last.streak_day;
    v_next := case when v_last.streak_day >= 7 then 1 else v_last.streak_day + 1 end;
  else
    v_current := 0;
    v_next := 1;
  end if;

  return query
  select
    v_day,
    false,
    v_current,
    v_next,
    5 + case when v_next = 7 then 10 else 0 end,
    ((v_day + 1)::timestamp at time zone 'UTC');
end;
$$;

revoke all on function public.get_daily_login_status() from public;
revoke all on function public.get_daily_login_status() from anon;
grant execute on function public.get_daily_login_status() to authenticated;

create or replace function public.claim_daily_login_bonus()
returns table (
  claim_id uuid,
  ledger_entry_id uuid,
  reward_day date,
  streak_day integer,
  base_gold integer,
  streak_bonus_gold integer,
  gold_awarded integer,
  balance integer,
  duplicate boolean,
  next_reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player uuid := auth.uid();
  v_profile_id uuid;
  v_day date := (now() at time zone 'UTC')::date;
  v_existing public.daily_login_claim%rowtype;
  v_previous public.daily_login_claim%rowtype;
  v_streak integer := 1;
  v_base integer := 5;
  v_bonus integer := 0;
  v_ledger_id uuid;
  v_claim_id uuid;
  v_balance integer;
  v_key text;
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- Serialize reward claims for one player so concurrent requests cannot mint twice.
  select p.id into v_profile_id
  from public.player_profile p
  where p.id = v_player
  for update;

  if v_profile_id is null then
    raise exception 'PLAYER_PROFILE_REQUIRED';
  end if;

  select * into v_existing
  from public.daily_login_claim c
  where c.player_id = v_player
    and c.reward_day = v_day;

  if found then
    select coalesce(sum(w.delta_gold),0)::integer into v_balance
    from public.wallet_ledger w
    where w.player_id = v_player;

    return query
    select
      v_existing.id,
      v_existing.ledger_entry_id,
      v_existing.reward_day,
      v_existing.streak_day,
      v_existing.base_gold,
      v_existing.streak_bonus_gold,
      v_existing.base_gold + v_existing.streak_bonus_gold,
      v_balance,
      true,
      ((v_day + 1)::timestamp at time zone 'UTC');
    return;
  end if;

  select * into v_previous
  from public.daily_login_claim c
  where c.player_id = v_player
    and c.reward_day < v_day
  order by c.reward_day desc, c.created_at desc, c.id desc
  limit 1;

  if found and v_previous.reward_day = v_day - 1 then
    v_streak := case when v_previous.streak_day >= 7 then 1 else v_previous.streak_day + 1 end;
  else
    v_streak := 1;
  end if;

  if v_streak = 7 then
    v_bonus := 10;
  end if;

  v_key := 'daily-login:' || v_player::text || ':' || v_day::text;

  insert into public.wallet_ledger(
    player_id,
    delta_gold,
    reason,
    source_award_id,
    idempotency_key
  ) values (
    v_player,
    v_base + v_bonus,
    'daily_login_bonus',
    null,
    v_key
  )
  returning id into v_ledger_id;

  insert into public.daily_login_claim(
    player_id,
    reward_day,
    streak_day,
    base_gold,
    streak_bonus_gold,
    ledger_entry_id
  ) values (
    v_player,
    v_day,
    v_streak,
    v_base,
    v_bonus,
    v_ledger_id
  )
  returning id into v_claim_id;

  select coalesce(sum(w.delta_gold),0)::integer into v_balance
  from public.wallet_ledger w
  where w.player_id = v_player;

  return query
  select
    v_claim_id,
    v_ledger_id,
    v_day,
    v_streak,
    v_base,
    v_bonus,
    v_base + v_bonus,
    v_balance,
    false,
    ((v_day + 1)::timestamp at time zone 'UTC');
end;
$$;

revoke all on function public.claim_daily_login_bonus() from public;
revoke all on function public.claim_daily_login_bonus() from anon;
grant execute on function public.claim_daily_login_bonus() to authenticated;
