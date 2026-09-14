-- WEB-FLARE S8B account foundation.
-- Application staging/implementation authority after Supabase provider acceptance.
-- Does not activate guest reward settlement, purchases, or live S8A wiring.

create table if not exists public.player_runner (
  id uuid primary key default gen_random_uuid(),
  owner_player_id uuid not null references public.player_profile(id) on delete cascade,
  runner_template_id text not null,
  display_name text not null,
  progression_version text not null default 's8b-1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_player_id, runner_template_id)
);

create table if not exists public.runner_item_ownership (
  id uuid primary key default gen_random_uuid(),
  owner_player_id uuid not null references public.player_profile(id) on delete cascade,
  item_id text not null,
  slot text not null check (slot in ('weapon','shield','head','chest','hands','legs','feet')),
  acquisition_reason text not null check (acquisition_reason in ('STARTER_GRANT','GOLD_PURCHASE','RUN_DROP','REWARD','UNLOCK')),
  source_ref text not null,
  idempotency_key text not null unique,
  acquired_at timestamptz not null default now(),
  revoked_at timestamptz null
);

create table if not exists public.runner_loadout (
  player_runner_id uuid primary key references public.player_runner(id) on delete cascade,
  weapon_ownership_id uuid null references public.runner_item_ownership(id) on delete restrict,
  shield_ownership_id uuid null references public.runner_item_ownership(id) on delete restrict,
  head_ownership_id uuid null references public.runner_item_ownership(id) on delete restrict,
  chest_ownership_id uuid null references public.runner_item_ownership(id) on delete restrict,
  hands_ownership_id uuid null references public.runner_item_ownership(id) on delete restrict,
  legs_ownership_id uuid null references public.runner_item_ownership(id) on delete restrict,
  feet_ownership_id uuid null references public.runner_item_ownership(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create index if not exists player_runner_owner_idx on public.player_runner(owner_player_id, created_at, id);
create index if not exists runner_item_ownership_owner_idx on public.runner_item_ownership(owner_player_id, acquired_at, id);

alter table public.player_runner enable row level security;
alter table public.runner_item_ownership enable row level security;
alter table public.runner_loadout enable row level security;

drop policy if exists player_runner_select_own on public.player_runner;
create policy player_runner_select_own
on public.player_runner for select
to authenticated
using (owner_player_id = (select auth.uid()));

drop policy if exists runner_item_ownership_select_own on public.runner_item_ownership;
create policy runner_item_ownership_select_own
on public.runner_item_ownership for select
to authenticated
using (owner_player_id = (select auth.uid()));

drop policy if exists runner_loadout_select_own on public.runner_loadout;
create policy runner_loadout_select_own
on public.runner_loadout for select
to authenticated
using (
  exists (
    select 1
    from public.player_runner r
    where r.id = runner_loadout.player_runner_id
      and r.owner_player_id = (select auth.uid())
  )
);

grant select on public.player_runner to authenticated;
grant select on public.runner_item_ownership to authenticated;
grant select on public.runner_loadout to authenticated;

create or replace function public.ensure_starter_account()
returns table (
  player_runner_id uuid,
  runner_template_id text,
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
