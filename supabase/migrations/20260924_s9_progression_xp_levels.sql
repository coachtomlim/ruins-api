-- WEB-FLARE S9 Progression Loop 001: server-authoritative XP, Runner levels, progression history,
-- and the first governed equipment unlock (Level 2 → Leather Hood, a real stock Flare fantasycore
-- asset, mods/fantasycore/items/base/armor/leather/head.txt, pinned at the same Flare commit already
-- used for the starter Wooden Club/Wooden Shield).
-- No new currency. No change to the Daily Trial 5-Gold reward. No Daily Login/Practice/Friend Share
-- reward change.

-- ============================================================================================
-- 1. Append-only XP ledger.
-- ============================================================================================
create table if not exists public.runner_xp_event (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profile(id) on delete cascade,
  player_runner_id uuid not null references public.player_runner(id) on delete cascade,
  amount integer not null check (amount > 0),
  reason text not null check (reason in ('daily_trial_completion')),
  source_ref text not null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists runner_xp_event_player_idx
  on public.runner_xp_event(player_id, created_at, id);
create index if not exists runner_xp_event_runner_idx
  on public.runner_xp_event(player_runner_id, created_at, id);

alter table public.runner_xp_event enable row level security;

drop policy if exists runner_xp_event_select_own on public.runner_xp_event;
create policy runner_xp_event_select_own
on public.runner_xp_event for select
to authenticated
using (player_id = (select auth.uid()));

revoke all on table public.runner_xp_event from anon, authenticated;
grant select on table public.runner_xp_event to authenticated;

-- ============================================================================================
-- 2. Fixed level curve (immutable, pure — no table needed for lookups, but one exists for display).
-- ============================================================================================
create table if not exists public.runner_level_curve (
  level integer primary key check (level between 1 and 5),
  xp_required integer not null check (xp_required >= 0)
);

insert into public.runner_level_curve(level, xp_required) values
  (1, 0), (2, 30), (3, 80), (4, 150), (5, 250)
on conflict (level) do update set xp_required = excluded.xp_required;

alter table public.runner_level_curve enable row level security;
drop policy if exists runner_level_curve_select on public.runner_level_curve;
create policy runner_level_curve_select
on public.runner_level_curve for select
to authenticated
using (true);
revoke all on table public.runner_level_curve from anon, authenticated;
grant select on table public.runner_level_curve to authenticated;

create or replace function public.runner_level_for_xp(p_xp integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_xp >= 250 then 5
    when p_xp >= 150 then 4
    when p_xp >= 80 then 3
    when p_xp >= 30 then 2
    else 1
  end
$$;

create or replace function public.runner_level_threshold(p_level integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_level
    when 1 then 0 when 2 then 30 when 3 then 80 when 4 then 150 when 5 then 250
    else 250
  end
$$;

revoke all on function public.runner_level_for_xp(integer) from public, anon;
revoke all on function public.runner_level_threshold(integer) from public, anon;
grant execute on function public.runner_level_for_xp(integer) to authenticated;
grant execute on function public.runner_level_threshold(integer) to authenticated;

-- ============================================================================================
-- 3. Daily Trial settlement now also awards +10 Runner XP, atomically with the existing +5 Gold.
--    Same idempotency guarantee as Gold: a unique idempotency key plus the same row locks.
--    The return table gains three trailing columns, which PostgreSQL cannot do via a bare
--    CREATE OR REPLACE, hence the explicit drop immediately before recreating it.
-- ============================================================================================
drop function if exists public.settle_daily_trial(uuid);

create function public.settle_daily_trial(p_run_id uuid)
returns table (
  run_id uuid,
  ledger_entry_id uuid,
  trial_day date,
  reward_gold integer,
  balance integer,
  duplicate boolean,
  settled_at timestamptz,
  xp_awarded integer,
  total_xp integer,
  runner_level integer
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
  v_xp_key text;
  v_total_xp integer;
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

    select coalesce(sum(e.amount),0)::integer into v_total_xp
    from public.runner_xp_event e
    where e.player_runner_id = v_run.player_runner_id;

    return query
    select
      v_run.id,
      v_run.ledger_entry_id,
      v_run.trial_day,
      v_run.reward_gold,
      v_balance,
      true,
      v_run.settled_at,
      0,
      v_total_xp,
      public.runner_level_for_xp(v_total_xp);
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
  v_xp_key := 'daily-trial-xp:' || v_player::text || ':' || v_run.trial_day::text;
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

  insert into public.runner_xp_event(
    player_id,
    player_runner_id,
    amount,
    reason,
    source_ref,
    idempotency_key
  ) values (
    v_player,
    v_run.player_runner_id,
    10,
    'daily_trial_completion',
    'daily-trial-run:' || v_run.id::text,
    v_xp_key
  );

  update public.daily_trial_run
  set settled_at = v_settled_at,
      ledger_entry_id = v_ledger_id
  where id = v_run.id;

  select coalesce(sum(w.delta_gold),0)::integer into v_balance
  from public.wallet_ledger w
  where w.player_id = v_player;

  select coalesce(sum(e.amount),0)::integer into v_total_xp
  from public.runner_xp_event e
  where e.player_runner_id = v_run.player_runner_id;

  return query
  select
    v_run.id,
    v_ledger_id,
    v_run.trial_day,
    5,
    v_balance,
    false,
    v_settled_at,
    10,
    v_total_xp,
    public.runner_level_for_xp(v_total_xp);
end;
$$;

revoke all on function public.settle_daily_trial(uuid) from public;
revoke all on function public.settle_daily_trial(uuid) from anon;
grant execute on function public.settle_daily_trial(uuid) to authenticated;

-- ============================================================================================
-- 4. Authoritative read model: XP, level, thresholds, unlock state, recent events.
-- ============================================================================================
create or replace function public.get_runner_progression(p_player_runner_id uuid default null)
returns table (
  player_runner_id uuid,
  total_xp integer,
  runner_level integer,
  level_threshold integer,
  next_level_threshold integer,
  xp_remaining integer,
  max_level boolean,
  unlocks jsonb,
  recent_events jsonb
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_player uuid := auth.uid();
  v_runner public.player_runner%rowtype;
  v_total_xp integer;
  v_level integer;
  v_next_level integer;
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_player_runner_id is not null then
    select * into v_runner
    from public.player_runner r
    where r.id = p_player_runner_id
      and r.owner_player_id = v_player;
    if not found then
      raise exception 'RUNNER_NOT_FOUND';
    end if;
  else
    select * into v_runner
    from public.player_runner r
    where r.owner_player_id = v_player;
    if not found then
      raise exception 'RUNNER_NOT_FOUND';
    end if;
    if (select count(*) from public.player_runner r2 where r2.owner_player_id = v_player) > 1 then
      raise exception 'RUNNER_SELECTION_REQUIRED';
    end if;
  end if;

  select coalesce(sum(e.amount),0)::integer into v_total_xp
  from public.runner_xp_event e
  where e.player_runner_id = v_runner.id;

  v_level := public.runner_level_for_xp(v_total_xp);
  v_next_level := least(v_level + 1, 5);

  return query
  select
    v_runner.id,
    v_total_xp,
    v_level,
    public.runner_level_threshold(v_level),
    public.runner_level_threshold(v_next_level),
    case when v_level >= 5 then 0 else public.runner_level_threshold(v_next_level) - v_total_xp end,
    v_level >= 5,
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'offerId', o.offer_id, 'itemId', o.item_id, 'minLevel', o.min_runner_level,
        'goldCost', o.gold_cost, 'unlocked', v_level >= o.min_runner_level
      ) order by o.min_runner_level, o.offer_id), '[]'::jsonb)
      from public.progression_offer_catalog o
      where o.kind = 'ITEM' and o.active
    ),
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'amount', e.amount, 'reason', e.reason, 'createdAt', e.created_at
      ) order by e.created_at desc), '[]'::jsonb)
      from (
        select * from public.runner_xp_event e2
        where e2.player_runner_id = v_runner.id
        order by e2.created_at desc
        limit 10
      ) e
    );
end;
$$;

revoke all on function public.get_runner_progression(uuid) from public;
revoke all on function public.get_runner_progression(uuid) from anon;
grant execute on function public.get_runner_progression(uuid) to authenticated;

-- ============================================================================================
-- 5. First governed equipment unlock: a real stock Flare fantasycore item, not the starter set.
--    Source (same pinned commit as the starter Club/Shield): 2ef474f5f5f368628bc526f9e56f936dac743e49
--    mods/fantasycore/items/base/armor/leather/head.txt (item_type=head, gfx=leather_hood).
--    +1 defense only: from the starter baseline (100/12/1) this lands on 100/12/2, an existing
--    PREFERRED envelope state, so it is safe by default; the equip mutation still re-projects and
--    fails closed if a player's own prior stat purchases would push them outside PREFERRED.
-- ============================================================================================
insert into public.runner_item_catalog(
  item_id, slot, display_name, hp_modifier, attack_modifier, defense_modifier,
  flare_source, gfx, catalog_version
) values (
  'leather-hood', 'head', 'Leather Hood', 0, 0, 1,
  'mods/fantasycore/items/base/armor/leather/head.txt', 'leather_hood', 's8b-1'
)
on conflict (item_id) do update set
  slot = excluded.slot,
  display_name = excluded.display_name,
  hp_modifier = excluded.hp_modifier,
  attack_modifier = excluded.attack_modifier,
  defense_modifier = excluded.defense_modifier,
  flare_source = excluded.flare_source,
  gfx = excluded.gfx,
  catalog_version = excluded.catalog_version;

alter table public.progression_offer_catalog
  add column if not exists min_runner_level integer not null default 1;

insert into public.progression_offer_catalog(
  catalog_version, offer_id, kind, item_id, gold_cost, active, min_runner_level
) values (
  's8b-launch-progression-001', 'leather-hood', 'ITEM', 'leather-hood', 35, true, 2
)
on conflict (catalog_version, offer_id) do update set
  kind = excluded.kind,
  item_id = excluded.item_id,
  gold_cost = excluded.gold_cost,
  active = excluded.active,
  min_runner_level = excluded.min_runner_level;

-- Level-gate item offers inside the existing purchase RPC (redefinition; STAT-offer behavior,
-- envelope check, idempotency, and reason mapping are all unchanged from the accepted version).
create or replace function public.purchase_progression_offer(
  p_player_runner_id uuid,
  p_offer_id text,
  p_idempotency_key text
)
returns table (
  progression_purchase_id uuid,
  ledger_entry_id uuid,
  catalog_version text,
  offer_id text,
  gold_spent integer,
  balance integer,
  duplicate boolean,
  stat_event_id uuid,
  ownership_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player uuid := auth.uid();
  v_offer_id text := trim(coalesce(p_offer_id, ''));
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_existing public.progression_purchase%rowtype;
  v_runner public.player_runner%rowtype;
  v_catalog public.progression_catalog_version%rowtype;
  v_offer public.progression_offer_catalog%rowtype;
  v_state jsonb;
  v_projected_hp integer;
  v_projected_attack integer;
  v_projected_defense integer;
  v_balance integer;
  v_purchase_id uuid := gen_random_uuid();
  v_ledger_id uuid := gen_random_uuid();
  v_stat_event_id uuid;
  v_ownership_id uuid;
  v_item public.runner_item_catalog%rowtype;
  v_reason text;
  v_total_xp integer;
  v_level integer;
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_player_runner_id is null then
    raise exception 'RUNNER_REQUIRED';
  end if;
  if v_offer_id = '' then
    raise exception 'OFFER_REQUIRED';
  end if;
  if v_key = '' then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED';
  end if;

  select * into v_existing
  from public.progression_purchase p
  where p.player_id = v_player
    and p.idempotency_key = v_key;

  if found then
    if v_existing.player_runner_id <> p_player_runner_id
       or v_existing.offer_id <> v_offer_id then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;

    select coalesce(sum(w.delta_gold),0)::integer into v_balance
    from public.wallet_ledger w
    where w.player_id = v_player;

    select e.id into v_stat_event_id
    from public.runner_stat_upgrade_event e
    where e.purchase_id = v_existing.id;

    select o.id into v_ownership_id
    from public.runner_item_ownership o
    where o.owner_player_id = v_player
      and o.source_ref = 'progression-purchase:' || v_existing.id::text
      and o.revoked_at is null
    order by o.acquired_at, o.id
    limit 1;

    return query select
      v_existing.id,
      v_existing.ledger_entry_id,
      v_existing.catalog_version,
      v_existing.offer_id,
      v_existing.gold_cost,
      v_balance,
      true,
      v_stat_event_id,
      v_ownership_id;
    return;
  end if;

  -- Serialize all wallet mutations for one player.
  perform 1
  from public.player_profile p
  where p.id = v_player
  for update;

  if not found then
    raise exception 'PLAYER_PROFILE_REQUIRED';
  end if;

  select * into v_runner
  from public.player_runner r
  where r.id = p_player_runner_id
    and r.owner_player_id = v_player;

  if not found then
    raise exception 'RUNNER_NOT_OWNED';
  end if;

  select * into v_catalog
  from public.progression_catalog_version c
  where c.status = 'ACTIVE';

  if not found then
    raise exception 'NO_ACTIVE_PROGRESSION_CATALOG';
  end if;

  select * into v_offer
  from public.progression_offer_catalog o
  where o.catalog_version = v_catalog.catalog_version
    and o.offer_id = v_offer_id
    and o.active;

  if not found then
    raise exception 'OFFER_NOT_ACTIVE';
  end if;

  if exists (
    select 1
    from public.progression_purchase p
    where p.player_runner_id = v_runner.id
      and p.catalog_version = v_catalog.catalog_version
      and p.offer_id = v_offer.offer_id
  ) then
    raise exception 'OFFER_ALREADY_PURCHASED';
  end if;

  select coalesce(sum(e.amount),0)::integer into v_total_xp
  from public.runner_xp_event e
  where e.player_runner_id = v_runner.id;
  v_level := public.runner_level_for_xp(v_total_xp);

  if v_offer.min_runner_level > v_level then
    raise exception 'RUNNER_LEVEL_TOO_LOW';
  end if;

  select coalesce(sum(w.delta_gold),0)::integer into v_balance
  from public.wallet_ledger w
  where w.player_id = v_player;

  if v_balance < v_offer.gold_cost then
    raise exception 'INSUFFICIENT_GOLD';
  end if;

  if v_offer.kind = 'STAT' then
    v_state := public.get_account_runner_state(v_runner.id);
    v_projected_hp := (v_state->'effective_stats'->>'hp')::integer;
    v_projected_attack := (v_state->'effective_stats'->>'attack')::integer;
    v_projected_defense := (v_state->'effective_stats'->>'defense')::integer;

    if v_offer.stat_key = 'hp' then
      v_projected_hp := v_projected_hp + v_offer.stat_amount;
    elsif v_offer.stat_key = 'attack' then
      v_projected_attack := v_projected_attack + v_offer.stat_amount;
    elsif v_offer.stat_key = 'defense' then
      v_projected_defense := v_projected_defense + v_offer.stat_amount;
    else
      raise exception 'STAT_OFFER_INVALID';
    end if;

    if not exists (
      select 1
      from public.runner_challengeability_envelope e
      where e.calibration_version = v_catalog.calibration_version
        and e.effective_hp = v_projected_hp
        and e.effective_attack = v_projected_attack
        and e.effective_defense = v_projected_defense
        and e.band = 'PREFERRED'
    ) then
      raise exception 'PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE';
    end if;

    v_reason := 'runner_stat_upgrade';
  elsif v_offer.kind = 'ITEM' then
    select * into v_item
    from public.runner_item_catalog i
    where i.item_id = v_offer.item_id;

    if not found then
      raise exception 'ITEM_NOT_GOVERNED';
    end if;

    v_reason := case
      when v_item.slot in ('head','chest','hands','legs','feet') then 'armor_purchase'
      else 'equipment_purchase'
    end;
  else
    raise exception 'OFFER_KIND_INVALID';
  end if;

  insert into public.wallet_ledger(
    id, player_id, delta_gold, reason, source_award_id, idempotency_key
  ) values (
    v_ledger_id,
    v_player,
    -v_offer.gold_cost,
    v_reason,
    null,
    'progression:' || v_player::text || ':' || v_key
  );

  insert into public.progression_purchase(
    id, player_id, player_runner_id, catalog_version, offer_id,
    gold_cost, ledger_entry_id, idempotency_key
  ) values (
    v_purchase_id,
    v_player,
    v_runner.id,
    v_catalog.catalog_version,
    v_offer.offer_id,
    v_offer.gold_cost,
    v_ledger_id,
    v_key
  );

  if v_offer.kind = 'STAT' then
    insert into public.runner_stat_upgrade_event(
      purchase_id, player_id, player_runner_id, stat_key, amount
    ) values (
      v_purchase_id,
      v_player,
      v_runner.id,
      v_offer.stat_key,
      v_offer.stat_amount
    )
    returning id into v_stat_event_id;
  else
    insert into public.runner_item_ownership(
      owner_player_id,
      item_id,
      slot,
      acquisition_reason,
      source_ref,
      idempotency_key
    ) values (
      v_player,
      v_item.item_id,
      v_item.slot,
      'GOLD_PURCHASE',
      'progression-purchase:' || v_purchase_id::text,
      'progression-purchase:' || v_purchase_id::text
    )
    returning id into v_ownership_id;
  end if;

  update public.player_runner
  set updated_at = now()
  where id = v_runner.id;

  v_balance := v_balance - v_offer.gold_cost;

  return query select
    v_purchase_id,
    v_ledger_id,
    v_catalog.catalog_version,
    v_offer.offer_id,
    v_offer.gold_cost,
    v_balance,
    false,
    v_stat_event_id,
    v_ownership_id;
end;
$$;

revoke all on function public.purchase_progression_offer(uuid,text,text) from public;
revoke all on function public.purchase_progression_offer(uuid,text,text) from anon;
grant execute on function public.purchase_progression_offer(uuid,text,text) to authenticated;

-- ============================================================================================
-- 6. Equip mutation: the first real server-authoritative equip. Ownership -> equip are distinct;
--    purchasing never auto-equips. Fails closed if the resulting effective state is not PREFERRED.
-- ============================================================================================
create table if not exists public.runner_loadout_event (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profile(id) on delete cascade,
  player_runner_id uuid not null references public.player_runner(id) on delete cascade,
  slot text not null check (slot in ('weapon','shield','head','chest','hands','legs','feet')),
  ownership_id uuid not null references public.runner_item_ownership(id) on delete restrict,
  previous_ownership_id uuid null references public.runner_item_ownership(id) on delete restrict,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists runner_loadout_event_player_idx
  on public.runner_loadout_event(player_id, created_at, id);

alter table public.runner_loadout_event enable row level security;
drop policy if exists runner_loadout_event_select_own on public.runner_loadout_event;
create policy runner_loadout_event_select_own
on public.runner_loadout_event for select
to authenticated
using (player_id = (select auth.uid()));
revoke all on table public.runner_loadout_event from anon, authenticated;
grant select on table public.runner_loadout_event to authenticated;

create or replace function public.equip_runner_item(
  p_player_runner_id uuid,
  p_ownership_id uuid,
  p_slot text
)
returns table (
  player_runner_id uuid,
  slot text,
  ownership_id uuid,
  item_id text,
  effective_hp integer,
  effective_attack integer,
  effective_defense integer,
  equipped_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player uuid := auth.uid();
  v_runner public.player_runner%rowtype;
  v_ownership public.runner_item_ownership%rowtype;
  v_item public.runner_item_catalog%rowtype;
  v_slot text := trim(coalesce(p_slot, ''));
  v_loadout public.runner_loadout%rowtype;
  v_previous_ownership_id uuid;
  v_previous_item public.runner_item_catalog%rowtype;
  v_state jsonb;
  v_hp integer;
  v_attack integer;
  v_defense integer;
  v_event_id uuid;
  v_key text;
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_player_runner_id is null then
    raise exception 'RUNNER_REQUIRED';
  end if;
  if p_ownership_id is null then
    raise exception 'OWNERSHIP_REQUIRED';
  end if;
  if v_slot = '' then
    raise exception 'SLOT_REQUIRED';
  end if;
  if v_slot not in ('weapon','shield','head','chest','hands','legs','feet') then
    raise exception 'SLOT_INVALID';
  end if;

  perform 1 from public.player_profile p where p.id = v_player for update;
  if not found then
    raise exception 'PLAYER_PROFILE_REQUIRED';
  end if;

  select * into v_runner
  from public.player_runner r
  where r.id = p_player_runner_id
    and r.owner_player_id = v_player;
  if not found then
    raise exception 'RUNNER_NOT_OWNED';
  end if;

  select * into v_ownership
  from public.runner_item_ownership o
  where o.id = p_ownership_id
    and o.owner_player_id = v_player
    and o.revoked_at is null
  for update;
  if not found then
    raise exception 'OWNERSHIP_NOT_FOUND';
  end if;

  if v_ownership.slot <> v_slot then
    raise exception 'SLOT_MISMATCH';
  end if;

  select * into v_item
  from public.runner_item_catalog i
  where i.item_id = v_ownership.item_id;
  if not found then
    raise exception 'ITEM_NOT_GOVERNED';
  end if;

  v_key := 'equip:' || v_player::text || ':' || v_runner.id::text || ':' || v_slot || ':' || v_ownership.id::text;

  select * into v_loadout
  from public.runner_loadout l
  where l.player_runner_id = v_runner.id
  for update;
  if not found then
    raise exception 'RUNNER_LOADOUT_NOT_FOUND';
  end if;

  v_previous_ownership_id := case v_slot
    when 'weapon' then v_loadout.weapon_ownership_id
    when 'shield' then v_loadout.shield_ownership_id
    when 'head' then v_loadout.head_ownership_id
    when 'chest' then v_loadout.chest_ownership_id
    when 'hands' then v_loadout.hands_ownership_id
    when 'legs' then v_loadout.legs_ownership_id
    when 'feet' then v_loadout.feet_ownership_id
  end;

  if v_previous_ownership_id = v_ownership.id then
    -- Already equipped in this slot: idempotent no-op, report current authoritative state.
    v_state := public.get_account_runner_state(v_runner.id);
    return query select
      v_runner.id, v_slot, v_ownership.id, v_item.item_id,
      (v_state->'effective_stats'->>'hp')::integer,
      (v_state->'effective_stats'->>'attack')::integer,
      (v_state->'effective_stats'->>'defense')::integer,
      now();
    return;
  end if;

  v_state := public.get_account_runner_state(v_runner.id);
  v_hp := (v_state->'effective_stats'->>'hp')::integer;
  v_attack := (v_state->'effective_stats'->>'attack')::integer;
  v_defense := (v_state->'effective_stats'->>'defense')::integer;

  if v_previous_ownership_id is not null then
    select ic.* into v_previous_item
    from public.runner_item_ownership o2
    join public.runner_item_catalog ic on ic.item_id = o2.item_id
    where o2.id = v_previous_ownership_id;
    if found then
      v_hp := v_hp - v_previous_item.hp_modifier;
      v_attack := v_attack - v_previous_item.attack_modifier;
      v_defense := v_defense - v_previous_item.defense_modifier;
    end if;
  end if;

  v_hp := v_hp + v_item.hp_modifier;
  v_attack := v_attack + v_item.attack_modifier;
  v_defense := v_defense + v_item.defense_modifier;

  if not exists (
    select 1
    from public.runner_challengeability_envelope e
    where e.calibration_version = 's8b-economy-calibration-001'
      and e.effective_hp = v_hp
      and e.effective_attack = v_attack
      and e.effective_defense = v_defense
      and e.band = 'PREFERRED'
  ) then
    raise exception 'PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE';
  end if;

  execute format(
    'update public.runner_loadout set %I = $1, updated_at = now() where player_runner_id = $2',
    v_slot || '_ownership_id'
  ) using v_ownership.id, v_runner.id;

  insert into public.runner_loadout_event(
    player_id, player_runner_id, slot, ownership_id, previous_ownership_id, idempotency_key
  ) values (
    v_player, v_runner.id, v_slot, v_ownership.id, v_previous_ownership_id, v_key
  )
  on conflict (idempotency_key) do nothing
  returning id into v_event_id;

  update public.player_runner set updated_at = now() where id = v_runner.id;

  return query select
    v_runner.id, v_slot, v_ownership.id, v_item.item_id, v_hp, v_attack, v_defense, now();
end;
$$;

revoke all on function public.equip_runner_item(uuid,uuid,text) from public;
revoke all on function public.equip_runner_item(uuid,uuid,text) from anon;
grant execute on function public.equip_runner_item(uuid,uuid,text) to authenticated;

-- ============================================================================================
-- 7. Progression history: a compact, player-facing, chronological, read-only timeline.
-- ============================================================================================
create or replace function public.get_runner_progression_history(p_player_runner_id uuid default null, p_limit integer default 20)
returns table (
  kind text,
  label text,
  gold_delta integer,
  xp_delta integer,
  created_at timestamptz
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_player uuid := auth.uid();
  v_runner public.player_runner%rowtype;
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 100);
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_player_runner_id is not null then
    select * into v_runner from public.player_runner r
    where r.id = p_player_runner_id and r.owner_player_id = v_player;
  else
    select * into v_runner from public.player_runner r where r.owner_player_id = v_player;
  end if;
  if not found then
    raise exception 'RUNNER_NOT_FOUND';
  end if;

  return query
  with level_ups as (
    select
      public.runner_level_for_xp(running.total::integer) as reached_level,
      running.created_at
    from (
      select e.created_at, sum(e.amount) over (order by e.created_at, e.id) as total
      from public.runner_xp_event e
      where e.player_runner_id = v_runner.id
    ) running
  ),
  level_reached as (
    select distinct on (reached_level) reached_level, level_ups.created_at
    from level_ups
    where reached_level > 1
    order by reached_level, level_ups.created_at asc
  ),
  events as (
    select 'daily_trial'::text as kind,
           'Daily Trial · +10 XP · +5 Gold'::text as label,
           5 as gold_delta, 10 as xp_delta, r.settled_at as created_at
    from public.daily_trial_run r
    where r.player_id = v_player and r.settled_at is not null

    union all
    select
      case when o.kind = 'STAT' then 'stat_purchase' else 'equipment_purchase' end,
      case
        when o.kind = 'STAT' then initcap(o.offer_id) || ' purchased · ' ||
          upper(left(o.stat_key,1)) || right(o.stat_key,length(o.stat_key)-1) || ' +' || o.stat_amount
        else coalesce(ic.display_name, o.item_id) || ' acquired'
      end,
      -p.gold_cost, 0, p.created_at
    from public.progression_purchase p
    join public.progression_offer_catalog o
      on o.catalog_version = p.catalog_version and o.offer_id = p.offer_id
    left join public.runner_item_catalog ic on ic.item_id = o.item_id
    where p.player_id = v_player and p.player_runner_id = v_runner.id

    union all
    select 'equipment_equipped', coalesce(ic.display_name, le.slot) || ' equipped', 0, 0, le.created_at
    from public.runner_loadout_event le
    left join public.runner_item_ownership o3 on o3.id = le.ownership_id
    left join public.runner_item_catalog ic on ic.item_id = o3.item_id
    where le.player_id = v_player and le.player_runner_id = v_runner.id

    union all
    select 'level_reached', 'Level ' || lr.reached_level || ' reached', 0, 0, lr.created_at
    from level_reached lr
  )
  select events.kind, events.label, events.gold_delta, events.xp_delta, events.created_at
  from events
  order by events.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.get_runner_progression_history(uuid,integer) from public;
revoke all on function public.get_runner_progression_history(uuid,integer) from anon;
grant execute on function public.get_runner_progression_history(uuid,integer) to authenticated;
