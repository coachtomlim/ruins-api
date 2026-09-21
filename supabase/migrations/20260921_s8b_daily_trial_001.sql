-- WEB-FLARE S8B Daily Trial 001 server authority candidate.
-- NOT APPLIED by source commit. Daily Trial v1 is deterministic and automatic.
-- The browser does not submit terminal status, HP, score, loot, date, room, or reward amount.

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
      'daily_login_bonus',
      'daily_trial_reward'
    )
  );

create table if not exists public.daily_trial_room_catalog (
  trial_version text not null,
  rotation_slot integer not null check (rotation_slot between 0 and 5),
  room_id text not null,
  room_name text not null,
  expected_ticks integer not null check (expected_ticks > 0 and expected_ticks <= 3600),
  created_at timestamptz not null default now(),
  primary key (trial_version, rotation_slot),
  unique (trial_version, room_id)
);

insert into public.daily_trial_room_catalog(
  trial_version, rotation_slot, room_id, room_name, expected_ticks
) values
  ('s8b-daily-trial-001',0,'iron-labyrinth-01','Pillar Court',614),
  ('s8b-daily-trial-001',1,'iron-labyrinth-03','Crossed Court',660),
  ('s8b-daily-trial-001',2,'iron-labyrinth-07','Broken Gallery',604),
  ('s8b-daily-trial-001',3,'iron-labyrinth-08','Scattered Hall',598),
  ('s8b-daily-trial-001',4,'iron-labyrinth-15','Vaulted Crossing',653),
  ('s8b-daily-trial-001',5,'iron-labyrinth-18','Twin Lanes',617)
on conflict (trial_version, rotation_slot) do update set
  room_id = excluded.room_id,
  room_name = excluded.room_name,
  expected_ticks = excluded.expected_ticks;

alter table public.daily_trial_room_catalog enable row level security;

drop policy if exists daily_trial_room_catalog_select on public.daily_trial_room_catalog;
create policy daily_trial_room_catalog_select
on public.daily_trial_room_catalog for select
to authenticated
using (true);

revoke all on table public.daily_trial_room_catalog from anon, authenticated;
grant select on table public.daily_trial_room_catalog to authenticated;

create table if not exists public.daily_trial_run (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profile(id) on delete cascade,
  player_runner_id uuid not null references public.player_runner(id) on delete cascade,
  trial_day date not null,
  trial_version text not null check (trial_version = 's8b-daily-trial-001'),
  room_id text not null,
  room_name text not null,
  rules_version text not null check (rules_version = 'web-flare-0.2.0'),
  content_version text not null check (content_version = 'web-flare-s7-0.1.0'),
  runner_snapshot jsonb not null,
  runner_hp integer not null check (runner_hp > 0),
  runner_attack integer not null check (runner_attack >= 0),
  runner_defense integer not null check (runner_defense >= 0),
  encounter_id text not null check (encounter_id = 'fair-goblin-skeleton-potion-001'),
  encounter jsonb not null,
  budget_spent integer not null check (budget_spent = 65),
  reward_gold integer not null check (reward_gold = 5),
  expected_ticks integer not null check (expected_ticks > 0 and expected_ticks <= 3600),
  started_at timestamptz not null default now(),
  settle_after timestamptz not null,
  settled_at timestamptz null,
  ledger_entry_id uuid null unique references public.wallet_ledger(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (player_id, trial_day),
  check (
    (settled_at is null and ledger_entry_id is null)
    or
    (settled_at is not null and ledger_entry_id is not null)
  ),
  check (settle_after >= started_at)
);

create index if not exists daily_trial_run_player_idx
  on public.daily_trial_run(player_id, trial_day desc, id);
create index if not exists daily_trial_run_runner_idx
  on public.daily_trial_run(player_runner_id, trial_day desc, id);

alter table public.daily_trial_run enable row level security;

drop policy if exists daily_trial_run_select_own on public.daily_trial_run;
create policy daily_trial_run_select_own
on public.daily_trial_run for select
to authenticated
using (player_id = (select auth.uid()));

revoke all on table public.daily_trial_run from anon, authenticated;
grant select on table public.daily_trial_run to authenticated;

create or replace function public.get_daily_trial_status()
returns table (
  trial_day date,
  trial_version text,
  state text,
  run_id uuid,
  room_id text,
  room_name text,
  rules_version text,
  content_version text,
  runner_snapshot jsonb,
  reward_gold integer,
  expected_ticks integer,
  expected_seconds numeric,
  settle_after timestamptz,
  runner_hp integer,
  runner_attack integer,
  runner_defense integer,
  encounter_id text,
  budget_spent integer
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_player uuid := auth.uid();
  v_day date := (now() at time zone 'UTC')::date;
  v_slot integer := mod(mod(v_day - date '2026-09-21',6)+6,6);
  v_room public.daily_trial_room_catalog%rowtype;
  v_run public.daily_trial_run%rowtype;
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists (select 1 from public.player_profile p where p.id = v_player) then
    raise exception 'PLAYER_PROFILE_REQUIRED';
  end if;

  select * into v_room
  from public.daily_trial_room_catalog c
  where c.trial_version = 's8b-daily-trial-001'
    and c.rotation_slot = v_slot;

  if not found then
    raise exception 'DAILY_TRIAL_ROOM_NOT_GOVERNED';
  end if;

  select * into v_run
  from public.daily_trial_run r
  where r.player_id = v_player
    and r.trial_day = v_day;

  if found then
    return query
    select
      v_day,
      v_run.trial_version,
      case
        when v_run.settled_at is not null then 'CLAIMED'
        when now() >= v_run.settle_after then 'CLAIMABLE'
        else 'RUNNING'
      end,
      v_run.id,
      v_run.room_id,
      v_run.room_name,
      v_run.rules_version,
      v_run.content_version,
      v_run.runner_snapshot,
      v_run.reward_gold,
      v_run.expected_ticks,
      round(v_run.expected_ticks::numeric / 60, 2),
      v_run.settle_after,
      v_run.runner_hp,
      v_run.runner_attack,
      v_run.runner_defense,
      v_run.encounter_id,
      v_run.budget_spent;
    return;
  end if;

  return query
  select
    v_day,
    's8b-daily-trial-001'::text,
    'AVAILABLE'::text,
    null::uuid,
    v_room.room_id,
    v_room.room_name,
    'web-flare-0.2.0'::text,
    'web-flare-s7-0.1.0'::text,
    null::jsonb,
    5,
    v_room.expected_ticks,
    round(v_room.expected_ticks::numeric / 60, 2),
    null::timestamptz,
    null::integer,
    null::integer,
    null::integer,
    'fair-goblin-skeleton-potion-001'::text,
    65;
end;
$$;

revoke all on function public.get_daily_trial_status() from public;
revoke all on function public.get_daily_trial_status() from anon;
grant execute on function public.get_daily_trial_status() to authenticated;

create or replace function public.start_daily_trial()
returns table (
  run_id uuid,
  trial_day date,
  trial_version text,
  room_id text,
  room_name text,
  rules_version text,
  content_version text,
  runner_snapshot jsonb,
  reward_gold integer,
  expected_ticks integer,
  expected_seconds numeric,
  settle_after timestamptz,
  runner_hp integer,
  runner_attack integer,
  runner_defense integer,
  encounter_id text,
  budget_spent integer,
  duplicate boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player uuid := auth.uid();
  v_profile_id uuid;
  v_day date := (now() at time zone 'UTC')::date;
  v_slot integer := mod(mod(v_day - date '2026-09-21',6)+6,6);
  v_room public.daily_trial_room_catalog%rowtype;
  v_existing public.daily_trial_run%rowtype;
  v_state jsonb;
  v_runner_id uuid;
  v_hp integer;
  v_attack integer;
  v_defense integer;
  v_started_at timestamptz := now();
  v_settle_after timestamptz;
  v_run_id uuid;
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select p.id into v_profile_id
  from public.player_profile p
  where p.id = v_player
  for update;

  if v_profile_id is null then
    raise exception 'PLAYER_PROFILE_REQUIRED';
  end if;

  select * into v_existing
  from public.daily_trial_run r
  where r.player_id = v_player
    and r.trial_day = v_day;

  if found then
    return query
    select
      v_existing.id,
      v_existing.trial_day,
      v_existing.trial_version,
      v_existing.room_id,
      v_existing.room_name,
      v_existing.rules_version,
      v_existing.content_version,
      v_existing.runner_snapshot,
      v_existing.reward_gold,
      v_existing.expected_ticks,
      round(v_existing.expected_ticks::numeric / 60, 2),
      v_existing.settle_after,
      v_existing.runner_hp,
      v_existing.runner_attack,
      v_existing.runner_defense,
      v_existing.encounter_id,
      v_existing.budget_spent,
      true;
    return;
  end if;

  select * into v_room
  from public.daily_trial_room_catalog c
  where c.trial_version = 's8b-daily-trial-001'
    and c.rotation_slot = v_slot;

  if not found then
    raise exception 'DAILY_TRIAL_ROOM_NOT_GOVERNED';
  end if;

  select public.get_account_runner_state(null::uuid) into v_state;
  v_runner_id := nullif(v_state ->> 'player_runner_id','')::uuid;
  v_hp := (v_state #>> '{effective_stats,hp}')::integer;
  v_attack := (v_state #>> '{effective_stats,attack}')::integer;
  v_defense := (v_state #>> '{effective_stats,defense}')::integer;

  if v_runner_id is null then
    raise exception 'RUNNER_NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.runner_challengeability_envelope e
    where e.calibration_version = 's8b-economy-calibration-001'
      and e.effective_hp = v_hp
      and e.effective_attack = v_attack
      and e.effective_defense = v_defense
      and e.band = 'PREFERRED'
  ) then
    raise exception 'RUNNER_OUTSIDE_DAILY_TRIAL_ENVELOPE';
  end if;

  v_settle_after := v_started_at + (v_room.expected_ticks::double precision / 60.0) * interval '1 second';

  insert into public.daily_trial_run(
    player_id,
    player_runner_id,
    trial_day,
    trial_version,
    room_id,
    room_name,
    rules_version,
    content_version,
    runner_snapshot,
    runner_hp,
    runner_attack,
    runner_defense,
    encounter_id,
    encounter,
    budget_spent,
    reward_gold,
    expected_ticks,
    started_at,
    settle_after
  ) values (
    v_player,
    v_runner_id,
    v_day,
    's8b-daily-trial-001',
    v_room.room_id,
    v_room.room_name,
    'web-flare-0.2.0',
    'web-flare-s7-0.1.0',
    v_state,
    v_hp,
    v_attack,
    v_defense,
    'fair-goblin-skeleton-potion-001',
    '{"enemyTypes":["goblin","skeleton","none"],"supportTypes":["small-potion"],"trapTypes":[]}'::jsonb,
    65,
    5,
    v_room.expected_ticks,
    v_started_at,
    v_settle_after
  )
  returning id into v_run_id;

  return query
  select
    v_run_id,
    v_day,
    's8b-daily-trial-001'::text,
    v_room.room_id,
    v_room.room_name,
    'web-flare-0.2.0'::text,
    'web-flare-s7-0.1.0'::text,
    v_state,
    5,
    v_room.expected_ticks,
    round(v_room.expected_ticks::numeric / 60, 2),
    v_settle_after,
    v_hp,
    v_attack,
    v_defense,
    'fair-goblin-skeleton-potion-001'::text,
    65,
    false;
end;
$$;

revoke all on function public.start_daily_trial() from public;
revoke all on function public.start_daily_trial() from anon;
grant execute on function public.start_daily_trial() to authenticated;

create or replace function public.settle_daily_trial(p_run_id uuid)
returns table (
  run_id uuid,
  ledger_entry_id uuid,
  trial_day date,
  reward_gold integer,
  balance integer,
  duplicate boolean,
  settled_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player uuid := auth.uid();
  v_profile_id uuid;
  v_run public.daily_trial_run%rowtype;
  v_ledger_id uuid;
  v_balance integer;
  v_settled_at timestamptz;
  v_key text;
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_run_id is null then
    raise exception 'RUN_ID_REQUIRED';
  end if;

  select p.id into v_profile_id
  from public.player_profile p
  where p.id = v_player
  for update;

  if v_profile_id is null then
    raise exception 'PLAYER_PROFILE_REQUIRED';
  end if;

  select * into v_run
  from public.daily_trial_run r
  where r.id = p_run_id
    and r.player_id = v_player
  for update;

  if not found then
    raise exception 'DAILY_TRIAL_RUN_NOT_FOUND';
  end if;

  if v_run.settled_at is not null then
    select coalesce(sum(w.delta_gold),0)::integer into v_balance
    from public.wallet_ledger w
    where w.player_id = v_player;

    return query
    select
      v_run.id,
      v_run.ledger_entry_id,
      v_run.trial_day,
      v_run.reward_gold,
      v_balance,
      true,
      v_run.settled_at;
    return;
  end if;

  if v_run.trial_version <> 's8b-daily-trial-001'
     or v_run.reward_gold <> 5
     or v_run.encounter_id <> 'fair-goblin-skeleton-potion-001'
     or v_run.budget_spent <> 65 then
    raise exception 'DAILY_TRIAL_RUN_NOT_GOVERNED';
  end if;

  if now() < v_run.settle_after then
    raise exception 'DAILY_TRIAL_NOT_COMPLETE';
  end if;


  v_key := 'daily-trial:' || v_player::text || ':' || v_run.trial_day::text;
  v_settled_at := now();

  insert into public.wallet_ledger(
    player_id,
    delta_gold,
    reason,
    source_award_id,
    idempotency_key
  ) values (
    v_player,
    5,
    'daily_trial_reward',
    null,
    v_key
  )
  returning id into v_ledger_id;

  update public.daily_trial_run
  set settled_at = v_settled_at,
      ledger_entry_id = v_ledger_id
  where id = v_run.id;

  select coalesce(sum(w.delta_gold),0)::integer into v_balance
  from public.wallet_ledger w
  where w.player_id = v_player;

  return query
  select
    v_run.id,
    v_ledger_id,
    v_run.trial_day,
    5,
    v_balance,
    false,
    v_settled_at;
end;
$$;

revoke all on function public.settle_daily_trial(uuid) from public;
revoke all on function public.settle_daily_trial(uuid) from anon;
grant execute on function public.settle_daily_trial(uuid) to authenticated;
