-- WEB-FLARE S8B Supabase account/provider proof.
-- Staging proof only. Do not treat as production rollout authority.

create extension if not exists pgcrypto;

create table public.player_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_goal (
  id uuid primary key default gen_random_uuid(),
  owner_player_id uuid not null references public.player_profile(id) on delete cascade,
  source_sender_name text not null default '',
  source_runner_id text not null,
  source_runner_name text not null default '',
  source_runner_level integer not null default 0 check (source_runner_level >= 0),
  target_hp integer not null check (target_hp between 1 and 99),
  created_at timestamptz not null default now()
);

create table public.proof_run_award (
  id uuid primary key default gen_random_uuid(),
  builder_player_id uuid not null references public.player_profile(id) on delete cascade,
  source_key text not null unique,
  builder_gold integer not null check (builder_gold >= 0),
  created_at timestamptz not null default now()
);

create table public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profile(id) on delete cascade,
  delta_gold integer not null,
  reason text not null check (reason in ('dungeon_builder_reward','hero_runner_reward_claim','asset_purchase','admin_adjustment')),
  source_award_id uuid references public.proof_run_award(id) on delete restrict,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table public.reward_claim (
  id uuid primary key default gen_random_uuid(),
  run_award_id uuid not null unique references public.proof_run_award(id) on delete restrict,
  player_id uuid not null references public.player_profile(id) on delete cascade,
  reward_type text not null check (reward_type in ('builder_gold')),
  gold integer not null check (gold >= 0),
  idempotency_key text not null unique,
  ledger_entry_id uuid not null unique references public.wallet_ledger(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index saved_goal_owner_idx on public.saved_goal(owner_player_id, created_at desc);
create index wallet_ledger_player_idx on public.wallet_ledger(player_id, created_at, id);
create index proof_run_award_player_idx on public.proof_run_award(builder_player_id, created_at desc);
create index reward_claim_player_idx on public.reward_claim(player_id, created_at desc);

create or replace function public.touch_player_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger player_profile_touch_updated_at
before update on public.player_profile
for each row execute function public.touch_player_profile_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_profile(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_creates_player_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.player_profile enable row level security;
alter table public.saved_goal enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.proof_run_award enable row level security;
alter table public.reward_claim enable row level security;

create policy player_profile_select_own
on public.player_profile for select
to authenticated
using (id = auth.uid());

create policy player_profile_update_own
on public.player_profile for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy saved_goal_select_own
on public.saved_goal for select
to authenticated
using (owner_player_id = auth.uid());

create policy saved_goal_insert_own
on public.saved_goal for insert
to authenticated
with check (owner_player_id = auth.uid());

create policy saved_goal_update_own
on public.saved_goal for update
to authenticated
using (owner_player_id = auth.uid())
with check (owner_player_id = auth.uid());

create policy saved_goal_delete_own
on public.saved_goal for delete
to authenticated
using (owner_player_id = auth.uid());

create policy wallet_ledger_select_own
on public.wallet_ledger for select
to authenticated
using (player_id = auth.uid());

create policy proof_run_award_select_own
on public.proof_run_award for select
to authenticated
using (builder_player_id = auth.uid());

create policy reward_claim_select_own
on public.reward_claim for select
to authenticated
using (player_id = auth.uid());

grant select, update on public.player_profile to authenticated;
grant select, insert, update, delete on public.saved_goal to authenticated;
grant select on public.wallet_ledger to authenticated;
grant select on public.proof_run_award to authenticated;
grant select on public.reward_claim to authenticated;

create or replace function public.claim_proof_builder_reward(
  p_run_award_id uuid,
  p_idempotency_key text
)
returns table (
  claim_id uuid,
  ledger_entry_id uuid,
  gold integer,
  balance bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player uuid := auth.uid();
  v_award public.proof_run_award%rowtype;
  v_existing public.reward_claim%rowtype;
  v_ledger_id uuid;
  v_claim_id uuid;
  v_client_key text := btrim(coalesce(p_idempotency_key, ''));
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if v_client_key = '' then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED';
  end if;

  select * into v_award
  from public.proof_run_award
  where id = p_run_award_id
  for update;

  if not found then
    raise exception 'AWARD_NOT_FOUND';
  end if;
  if v_award.builder_player_id <> v_player then
    raise exception 'AWARD_NOT_OWNED';
  end if;

  select * into v_existing
  from public.reward_claim
  where run_award_id = v_award.id;

  if found then
    return query
      select v_existing.id,
             v_existing.ledger_entry_id,
             v_existing.gold,
             coalesce((select sum(w.delta_gold) from public.wallet_ledger w where w.player_id = v_player), 0)::bigint;
    return;
  end if;

  insert into public.wallet_ledger(
    player_id,
    delta_gold,
    reason,
    source_award_id,
    idempotency_key
  ) values (
    v_player,
    v_award.builder_gold,
    'dungeon_builder_reward',
    v_award.id,
    'builder_reward:' || v_award.id::text
  )
  returning id into v_ledger_id;

  insert into public.reward_claim(
    run_award_id,
    player_id,
    reward_type,
    gold,
    idempotency_key,
    ledger_entry_id
  ) values (
    v_award.id,
    v_player,
    'builder_gold',
    v_award.builder_gold,
    v_client_key,
    v_ledger_id
  )
  returning id into v_claim_id;

  return query
    select v_claim_id,
           v_ledger_id,
           v_award.builder_gold,
           coalesce((select sum(w.delta_gold) from public.wallet_ledger w where w.player_id = v_player), 0)::bigint;
end;
$$;

revoke all on function public.claim_proof_builder_reward(uuid, text) from public;
grant execute on function public.claim_proof_builder_reward(uuid, text) to authenticated;
