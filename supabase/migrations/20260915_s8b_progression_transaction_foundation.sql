-- WEB-FLARE S8B progression transaction foundation.
-- Owner accepted OD-05 calibration policy, but no concrete progression offer is activated here.
-- Empty/no-active catalog is deliberately fail-closed.

create table if not exists public.progression_catalog_version (
  catalog_version text primary key,
  calibration_version text not null,
  status text not null check (status in ('DRAFT','ACTIVE','RETIRED')),
  created_at timestamptz not null default now(),
  activated_at timestamptz null,
  retired_at timestamptz null
);

create unique index if not exists progression_catalog_one_active_idx
  on public.progression_catalog_version(status)
  where status = 'ACTIVE';

create table if not exists public.progression_offer_catalog (
  catalog_version text not null references public.progression_catalog_version(catalog_version) on update restrict on delete restrict,
  offer_id text not null,
  kind text not null check (kind in ('STAT','ITEM')),
  stat_key text null check (stat_key is null or stat_key in ('hp','attack','defense')),
  stat_amount integer null,
  item_id text null references public.runner_item_catalog(item_id) on update restrict on delete restrict,
  gold_cost integer not null check (gold_cost > 0),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (catalog_version, offer_id),
  check (
    (kind = 'STAT'
      and item_id is null
      and stat_key is not null
      and stat_amount is not null
      and (
        (stat_key = 'hp' and stat_amount = 5) or
        (stat_key = 'attack' and stat_amount = 1) or
        (stat_key = 'defense' and stat_amount = 1)
      )
    )
    or
    (kind = 'ITEM'
      and item_id is not null
      and stat_key is null
      and stat_amount is null
    )
  )
);

create index if not exists progression_offer_item_idx
  on public.progression_offer_catalog(item_id)
  where item_id is not null;

create table if not exists public.runner_challengeability_envelope (
  calibration_version text not null,
  effective_hp integer not null check (effective_hp > 0),
  effective_attack integer not null check (effective_attack >= 0),
  effective_defense integer not null check (effective_defense >= 0),
  band text not null check (band in ('PREFERRED','EDGE','OUTSIDE')),
  worst_target_delta numeric(8,3) not null check (worst_target_delta >= 0),
  created_at timestamptz not null default now(),
  primary key (calibration_version, effective_hp, effective_attack, effective_defense)
);

create table if not exists public.progression_purchase (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profile(id) on delete cascade,
  player_runner_id uuid not null references public.player_runner(id) on delete cascade,
  catalog_version text not null,
  offer_id text not null,
  gold_cost integer not null check (gold_cost > 0),
  ledger_entry_id uuid not null unique references public.wallet_ledger(id) on delete restrict,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  foreign key (catalog_version, offer_id)
    references public.progression_offer_catalog(catalog_version, offer_id)
    on update restrict on delete restrict,
  unique (player_id, idempotency_key),
  unique (player_runner_id, catalog_version, offer_id)
);

create index if not exists progression_purchase_player_idx
  on public.progression_purchase(player_id, created_at, id);
create index if not exists progression_purchase_runner_idx
  on public.progression_purchase(player_runner_id, created_at, id);
create index if not exists progression_purchase_offer_idx
  on public.progression_purchase(catalog_version, offer_id);

create table if not exists public.runner_stat_upgrade_event (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null unique references public.progression_purchase(id) on delete restrict,
  player_id uuid not null references public.player_profile(id) on delete cascade,
  player_runner_id uuid not null references public.player_runner(id) on delete cascade,
  stat_key text not null check (stat_key in ('hp','attack','defense')),
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists runner_stat_upgrade_player_idx
  on public.runner_stat_upgrade_event(player_id, created_at, id);
create index if not exists runner_stat_upgrade_runner_idx
  on public.runner_stat_upgrade_event(player_runner_id, created_at, id);

alter table public.progression_catalog_version enable row level security;
alter table public.progression_offer_catalog enable row level security;
alter table public.runner_challengeability_envelope enable row level security;
alter table public.progression_purchase enable row level security;
alter table public.runner_stat_upgrade_event enable row level security;

drop policy if exists progression_catalog_active_select on public.progression_catalog_version;
create policy progression_catalog_active_select
on public.progression_catalog_version for select
to authenticated
using (status = 'ACTIVE');

drop policy if exists progression_offer_active_select on public.progression_offer_catalog;
create policy progression_offer_active_select
on public.progression_offer_catalog for select
to authenticated
using (
  active
  and exists (
    select 1
    from public.progression_catalog_version v
    where v.catalog_version = progression_offer_catalog.catalog_version
      and v.status = 'ACTIVE'
  )
);

drop policy if exists progression_purchase_select_own on public.progression_purchase;
create policy progression_purchase_select_own
on public.progression_purchase for select
to authenticated
using (player_id = (select auth.uid()));

drop policy if exists runner_stat_upgrade_select_own on public.runner_stat_upgrade_event;
create policy runner_stat_upgrade_select_own
on public.runner_stat_upgrade_event for select
to authenticated
using (player_id = (select auth.uid()));

revoke all on table public.progression_catalog_version from anon, authenticated;
revoke all on table public.progression_offer_catalog from anon, authenticated;
revoke all on table public.runner_challengeability_envelope from anon, authenticated;
revoke all on table public.progression_purchase from anon, authenticated;
revoke all on table public.runner_stat_upgrade_event from anon, authenticated;

grant select on table public.progression_catalog_version to authenticated;
grant select on table public.progression_offer_catalog to authenticated;
grant select on table public.progression_purchase to authenticated;
grant select on table public.runner_stat_upgrade_event to authenticated;

-- Add explicit progression debit reasons while preserving existing reward/admin reasons.
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
      'armor_purchase'
    )
  );

-- Extend the authoritative Runner projection with append-only permanent stat events.
create or replace function public.get_account_runner_state(p_player_runner_id uuid default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_player uuid := auth.uid();
  v_runner public.player_runner%rowtype;
  v_template public.runner_template_catalog%rowtype;
  v_loadout public.runner_loadout%rowtype;
  v_runner_count integer;
  v_item record;
  v_training_hp integer := 0;
  v_training_attack integer := 0;
  v_training_defense integer := 0;
  v_hp integer;
  v_attack integer;
  v_defense integer;
  v_gear jsonb := '[]'::jsonb;
  v_slot text;
  v_ownership_id uuid;
begin
  if v_player is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select count(*) into v_runner_count
  from public.player_runner r
  where r.owner_player_id = v_player;

  if p_player_runner_id is null then
    if v_runner_count = 0 then
      raise exception 'RUNNER_NOT_FOUND';
    elsif v_runner_count > 1 then
      raise exception 'RUNNER_SELECTION_REQUIRED';
    end if;

    select * into v_runner
    from public.player_runner r
    where r.owner_player_id = v_player;
  else
    select * into v_runner
    from public.player_runner r
    where r.id = p_player_runner_id
      and r.owner_player_id = v_player;

    if not found then
      raise exception 'RUNNER_NOT_FOUND';
    end if;
  end if;

  select * into v_template
  from public.runner_template_catalog c
  where c.template_id = v_runner.runner_template_id;

  if not found then
    raise exception 'RUNNER_TEMPLATE_NOT_GOVERNED';
  end if;

  select * into v_loadout
  from public.runner_loadout l
  where l.player_runner_id = v_runner.id;

  if not found then
    raise exception 'RUNNER_LOADOUT_NOT_FOUND';
  end if;

  select
    coalesce(sum(e.amount) filter (where e.stat_key = 'hp'), 0)::integer,
    coalesce(sum(e.amount) filter (where e.stat_key = 'attack'), 0)::integer,
    coalesce(sum(e.amount) filter (where e.stat_key = 'defense'), 0)::integer
  into v_training_hp, v_training_attack, v_training_defense
  from public.runner_stat_upgrade_event e
  where e.player_runner_id = v_runner.id
    and e.player_id = v_player;

  v_hp := v_template.base_hp + v_training_hp;
  v_attack := v_template.base_attack + v_training_attack;
  v_defense := v_template.base_defense + v_training_defense;

  foreach v_slot in array array['weapon','shield','head','chest','hands','legs','feet'] loop
    v_ownership_id := case v_slot
      when 'weapon' then v_loadout.weapon_ownership_id
      when 'shield' then v_loadout.shield_ownership_id
      when 'head' then v_loadout.head_ownership_id
      when 'chest' then v_loadout.chest_ownership_id
      when 'hands' then v_loadout.hands_ownership_id
      when 'legs' then v_loadout.legs_ownership_id
      when 'feet' then v_loadout.feet_ownership_id
    end;

    if v_ownership_id is null then
      v_gear := v_gear || jsonb_build_array(jsonb_build_object(
        'slot', v_slot,
        'equipped', false,
        'ownership_id', null,
        'item_id', null,
        'name', null,
        'modifiers', jsonb_build_object('hp',0,'attack',0,'defense',0)
      ));
    else
      select
        o.id as ownership_id,
        o.item_id,
        o.slot,
        c.display_name,
        c.hp_modifier,
        c.attack_modifier,
        c.defense_modifier,
        c.catalog_version,
        c.flare_source,
        c.gfx
      into v_item
      from public.runner_item_ownership o
      join public.runner_item_catalog c
        on c.item_id = o.item_id
       and c.slot = o.slot
      where o.id = v_ownership_id
        and o.owner_player_id = v_player
        and o.slot = v_slot
        and o.revoked_at is null;

      if not found then
        raise exception 'LOADOUT_OWNERSHIP_INVALID:%', v_slot;
      end if;

      v_hp := v_hp + v_item.hp_modifier;
      v_attack := v_attack + v_item.attack_modifier;
      v_defense := v_defense + v_item.defense_modifier;

      v_gear := v_gear || jsonb_build_array(jsonb_build_object(
        'slot', v_slot,
        'equipped', true,
        'ownership_id', v_item.ownership_id,
        'item_id', v_item.item_id,
        'name', v_item.display_name,
        'modifiers', jsonb_build_object(
          'hp', v_item.hp_modifier,
          'attack', v_item.attack_modifier,
          'defense', v_item.defense_modifier
        ),
        'catalog_version', v_item.catalog_version,
        'flare_source', v_item.flare_source,
        'gfx', v_item.gfx
      ));
    end if;
  end loop;

  return jsonb_build_object(
    'player_runner_id', v_runner.id,
    'runner_template_id', v_runner.runner_template_id,
    'runner_name', v_runner.display_name,
    'progression_version', v_runner.progression_version,
    'catalog_version', v_template.catalog_version,
    'base_stats', jsonb_build_object(
      'hp', v_template.base_hp,
      'attack', v_template.base_attack,
      'defense', v_template.base_defense
    ),
    'stat_bonuses', jsonb_build_object(
      'hp', v_training_hp,
      'attack', v_training_attack,
      'defense', v_training_defense
    ),
    'effective_stats', jsonb_build_object(
      'hp', v_hp,
      'attack', v_attack,
      'defense', v_defense
    ),
    'gear', v_gear
  );
end;
$$;

revoke all on function public.get_account_runner_state(uuid) from public;
revoke all on function public.get_account_runner_state(uuid) from anon;
grant execute on function public.get_account_runner_state(uuid) to authenticated;

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
set search_path = public
as $$
declare
  v_player uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key,''));
  v_offer_id text := btrim(coalesce(p_offer_id,''));
  v_runner public.player_runner%rowtype;
  v_catalog public.progression_catalog_version%rowtype;
  v_offer public.progression_offer_catalog%rowtype;
  v_existing public.progression_purchase%rowtype;
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
