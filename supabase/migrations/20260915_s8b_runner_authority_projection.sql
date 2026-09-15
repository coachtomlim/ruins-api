-- WEB-FLARE S8B authoritative Runner foundation projection.
-- Locks only already-approved starter definitions. No prices, purchases, drops,
-- permanent stat upgrades, reward settlement, or challenge issuance are activated.

create table if not exists public.runner_template_catalog (
  template_id text primary key,
  display_name text not null,
  base_hp integer not null check (base_hp > 0),
  base_attack integer not null check (base_attack >= 0),
  base_defense integer not null check (base_defense >= 0),
  catalog_version text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.runner_item_catalog (
  item_id text primary key,
  slot text not null check (slot in ('weapon','shield','head','chest','hands','legs','feet')),
  display_name text not null,
  hp_modifier integer not null default 0,
  attack_modifier integer not null default 0,
  defense_modifier integer not null default 0,
  flare_source text not null,
  gfx text null,
  catalog_version text not null,
  created_at timestamptz not null default now(),
  unique (item_id, slot)
);

insert into public.runner_template_catalog(
  template_id, display_name, base_hp, base_attack, base_defense, catalog_version
) values (
  'warrior-l1', 'Rookie Warrior', 100, 8, 0, 's8b-1'
)
on conflict (template_id) do update set
  display_name = excluded.display_name,
  base_hp = excluded.base_hp,
  base_attack = excluded.base_attack,
  base_defense = excluded.base_defense,
  catalog_version = excluded.catalog_version;

insert into public.runner_item_catalog(
  item_id, slot, display_name, hp_modifier, attack_modifier, defense_modifier,
  flare_source, gfx, catalog_version
) values
  ('wooden-club', 'weapon', 'Wooden Club', 0, 4, 0,
   'mods/fantasycore/items/base/weapons/melee/club.txt', 'club', 's8b-1'),
  ('wooden-shield', 'shield', 'Wooden Shield', 0, 0, 1,
   'mods/fantasycore/items/base/shields/wood.txt', 'buckler', 's8b-1')
on conflict (item_id) do update set
  slot = excluded.slot,
  display_name = excluded.display_name,
  hp_modifier = excluded.hp_modifier,
  attack_modifier = excluded.attack_modifier,
  defense_modifier = excluded.defense_modifier,
  flare_source = excluded.flare_source,
  gfx = excluded.gfx,
  catalog_version = excluded.catalog_version;

alter table public.runner_template_catalog enable row level security;
alter table public.runner_item_catalog enable row level security;

drop policy if exists runner_template_catalog_authenticated_select on public.runner_template_catalog;
create policy runner_template_catalog_authenticated_select
on public.runner_template_catalog for select
to authenticated
using (true);

drop policy if exists runner_item_catalog_authenticated_select on public.runner_item_catalog;
create policy runner_item_catalog_authenticated_select
on public.runner_item_catalog for select
to authenticated
using (true);

revoke all on table public.runner_template_catalog from anon, authenticated;
revoke all on table public.runner_item_catalog from anon, authenticated;
grant select on table public.runner_template_catalog to authenticated;
grant select on table public.runner_item_catalog to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'player_runner_template_catalog_fkey'
      and conrelid = 'public.player_runner'::regclass
  ) then
    alter table public.player_runner
      add constraint player_runner_template_catalog_fkey
      foreign key (runner_template_id)
      references public.runner_template_catalog(template_id)
      on update restrict on delete restrict;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'runner_item_ownership_catalog_slot_fkey'
      and conrelid = 'public.runner_item_ownership'::regclass
  ) then
    alter table public.runner_item_ownership
      add constraint runner_item_ownership_catalog_slot_fkey
      foreign key (item_id, slot)
      references public.runner_item_catalog(item_id, slot)
      on update restrict on delete restrict;
  end if;
end
$$;

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

  v_hp := v_template.base_hp;
  v_attack := v_template.base_attack;
  v_defense := v_template.base_defense;

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
