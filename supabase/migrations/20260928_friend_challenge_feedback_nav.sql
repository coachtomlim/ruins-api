-- FRIEND CHALLENGE NAVIGATION + RESULT FEEDBACK 001
-- Additive public correlation and non-economic result receipts. No wallet/XP/stat/gear mutation.
-- IMPORTANT: this migration is intentionally still unapplied while FRIEND FEEDBACK 001A is validated.

alter table public.builder_challenge add column if not exists public_token text;
update public.builder_challenge
set public_token = rtrim(translate(encode(extensions.gen_random_bytes(24),'base64'),'+/','-_'),'=')
where public_token is null;
alter table public.builder_challenge alter column public_token set default rtrim(translate(encode(extensions.gen_random_bytes(24),'base64'),'+/','-_'),'=');
alter table public.builder_challenge alter column public_token set not null;
alter table public.builder_challenge drop constraint if exists builder_challenge_public_token_format;
alter table public.builder_challenge add constraint builder_challenge_public_token_format
  check (public_token ~ '^[A-Za-z0-9_-]{32,128}$');
create unique index if not exists builder_challenge_public_token_uidx on public.builder_challenge(public_token);

create table if not exists public.builder_challenge_result (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.builder_challenge(id) on delete cascade,
  room_id text not null check (room_id in (
    'iron-labyrinth-01','iron-labyrinth-03','iron-labyrinth-07',
    'iron-labyrinth-08','iron-labyrinth-15','iron-labyrinth-18'
  )),
  encounter jsonb not null check (jsonb_typeof(encounter)='object'),
  rules_version text not null check (rules_version='s8a-1'),
  terminal_status text not null check (terminal_status in ('cleared','dead','blocked','timeout')),
  finishing_hp integer not null check (finishing_hp>=0),
  max_hp integer not null check (max_hp between 1 and 10000 and finishing_hp<=max_hp),
  finishing_hp_percent numeric(6,2) generated always as (round(finishing_hp::numeric*100/max_hp,2)) stored,
  target_hp integer not null check (target_hp between 5 and 95),
  score integer not null check (score between 0 and 100),
  hero_gold integer not null check (hero_gold between 0 and 30),
  builder_gold integer not null check (builder_gold between 0 and 25),
  deterministic_input_hash text not null check (deterministic_input_hash ~ '^[0-9a-f]{64}$'),
  completed_at timestamptz not null default now(),
  owner_seen_at timestamptz,
  unique(challenge_id,deterministic_input_hash)
);
create index if not exists builder_challenge_result_owner_feed_idx on public.builder_challenge_result(challenge_id,completed_at desc,id);
alter table public.builder_challenge_result enable row level security;
revoke all on table public.builder_challenge_result from anon,authenticated;

create or replace function public.create_builder_challenge_v2(p_target_hp integer)
returns table (challenge_id uuid,runner_id text,target_hp integer,invite_code text,sender_name text,public_token text,builder_xp_awarded integer,total_builder_xp integer,builder_level integer,duplicate boolean,created_at timestamptz)
language plpgsql security definer set search_path=''
as $$
declare v_old record; v_token text;
begin
  select * into v_old from public.create_builder_challenge(p_target_hp);
  select c.public_token into v_token from public.builder_challenge c where c.id=v_old.challenge_id;
  return query select v_old.challenge_id,v_old.runner_id,v_old.target_hp,v_old.invite_code,v_old.sender_name,v_token,v_old.builder_xp_awarded,v_old.total_builder_xp,v_old.builder_level,v_old.duplicate,v_old.created_at;
end $$;
revoke all on function public.create_builder_challenge_v2(integer) from public,anon;
grant execute on function public.create_builder_challenge_v2(integer) to authenticated;

create or replace function public.get_builder_challenges_v2(p_limit integer default 20)
returns table (challenge_id uuid,runner_id text,target_hp integer,invite_code text,sender_name text,public_token text,result_count bigint,created_at timestamptz)
language sql stable security definer set search_path=''
as $
  select c.id,c.runner_id,c.target_hp,c.invite_code,c.sender_name,c.public_token,count(r.id),c.created_at
  from public.builder_challenge c left join public.builder_challenge_result r on r.challenge_id=c.id
  where c.owner_player_id=auth.uid()
  group by c.id order by c.created_at desc,c.id desc limit least(greatest(coalesce(p_limit,20),1),100)
$$;
revoke all on function public.get_builder_challenges_v2(integer) from public,anon;
grant execute on function public.get_builder_challenges_v2(integer) to authenticated;

create or replace function public.submit_builder_challenge_result(
  p_public_token text,
  p_room_id text,
  p_encounter jsonb,
  p_rules_version text,
  p_terminal_status text,
  p_finishing_hp integer,
  p_max_hp integer,
  p_hero_gold integer
)
returns table(result_id uuid,duplicate boolean)
language plpgsql security definer set search_path=''
as $$
declare
  v_challenge public.builder_challenge%rowtype;
  v_result public.builder_challenge_result%rowtype;
  v_inserted boolean:=true;
  v_enemy_slots text[];
  v_traps text[];
  v_supports text[];
  v_normalized_encounter jsonb;
  v_budget integer:=0;
  v_hero_gold_max integer:=0;
  v_expected_max_hp integer;
  v_actual_hp numeric;
  v_score integer;
  v_builder_gold integer;
  v_canonical text;
  v_input_hash text;
  v_summary text;
begin
  if p_public_token is null or p_public_token !~ '^[A-Za-z0-9_-]{32,128}$' then
    raise exception 'UNKNOWN_CHALLENGE_TOKEN';
  end if;

  select * into v_challenge
  from public.builder_challenge c
  where c.public_token=p_public_token;
  if not found then raise exception 'UNKNOWN_CHALLENGE_TOKEN'; end if;

  if p_room_id is null or p_room_id not in (
       'iron-labyrinth-01','iron-labyrinth-03','iron-labyrinth-07',
       'iron-labyrinth-08','iron-labyrinth-15','iron-labyrinth-18'
     )
     or p_rules_version is distinct from 's8a-1'
     or p_terminal_status is null or p_terminal_status not in ('cleared','dead','blocked','timeout')
     or p_finishing_hp is null or p_finishing_hp<0
     or p_max_hp is null or p_max_hp<1 or p_finishing_hp>p_max_hp
     or p_hero_gold is null or p_hero_gold<0
     or jsonb_typeof(p_encounter) is distinct from 'object' then
    raise exception 'RESULT_RECEIPT_INVALID';
  end if;

  if (p_encounter - array['enemyTypes','trapTypes','supportTypes']) <> '{}'::jsonb
     or jsonb_typeof(p_encounter->'enemyTypes') is distinct from 'array'
     or jsonb_typeof(p_encounter->'trapTypes') is distinct from 'array'
     or jsonb_typeof(p_encounter->'supportTypes') is distinct from 'array' then
    raise exception 'RESULT_ENCOUNTER_INVALID';
  end if;

  if jsonb_array_length(p_encounter->'enemyTypes')>3
     or exists(select 1 from jsonb_array_elements(p_encounter->'enemyTypes') e where jsonb_typeof(e)<>'string')
     or exists(select 1 from jsonb_array_elements(p_encounter->'trapTypes') e where jsonb_typeof(e)<>'string')
     or exists(select 1 from jsonb_array_elements(p_encounter->'supportTypes') e where jsonb_typeof(e)<>'string') then
    raise exception 'RESULT_ENCOUNTER_INVALID';
  end if;

  select array[
    coalesce(p_encounter->'enemyTypes'->>0,'none'),
    coalesce(p_encounter->'enemyTypes'->>1,'none'),
    coalesce(p_encounter->'enemyTypes'->>2,'none')
  ] into v_enemy_slots;

  if exists(select 1 from unnest(v_enemy_slots) x where x not in ('none','goblin','skeleton','goblin-elite','antlion')) then
    raise exception 'RESULT_ENCOUNTER_INVALID';
  end if;

  select coalesce(array_agg(value order by value),array[]::text[])
  into v_traps
  from jsonb_array_elements_text(p_encounter->'trapTypes');
  if exists(select 1 from unnest(v_traps) x where x not in ('spike-trap','dart-trap'))
     or cardinality(v_traps) <> (select count(distinct x) from unnest(v_traps) as u(x)) then
    raise exception 'RESULT_ENCOUNTER_INVALID';
  end if;

  select coalesce(array_agg(value order by value),array[]::text[])
  into v_supports
  from jsonb_array_elements_text(p_encounter->'supportTypes');
  if exists(select 1 from unnest(v_supports) x where x not in ('small-potion','battle-tonic','iron-tonic'))
     or cardinality(v_supports) <> (select count(distinct x) from unnest(v_supports) as u(x)) then
    raise exception 'RESULT_ENCOUNTER_INVALID';
  end if;

  select coalesce(sum(case x
    when 'goblin' then 20 when 'skeleton' then 30 when 'goblin-elite' then 40
    when 'antlion' then 50 else 0 end),0),
    coalesce(sum(case x
      when 'goblin' then 6 when 'skeleton' then 9 when 'goblin-elite' then 12
      when 'antlion' then 15 else 0 end),0)
  into v_budget,v_hero_gold_max
  from unnest(v_enemy_slots) x;

  v_budget:=v_budget + coalesce((select sum(case x when 'spike-trap' then 20 when 'dart-trap' then 15 else 0 end) from unnest(v_traps) x),0);
  v_budget:=v_budget + coalesce((select sum(15) from unnest(v_supports)),0);
  if v_budget>100 then raise exception 'RESULT_ENCOUNTER_BUDGET_EXCEEDED'; end if;

  if p_hero_gold>v_hero_gold_max or p_hero_gold>30 then
    raise exception 'RESULT_HERO_GOLD_INVALID';
  end if;

  v_expected_max_hp:=case v_challenge.runner_id
    when 'warrior-l1' then 100
    when 'warrior-l2' then 110
    when 'warrior-l3' then 120
    else null
  end;
  if v_expected_max_hp is null or p_max_hp<>v_expected_max_hp then
    raise exception 'RESULT_MAX_HP_INVALID';
  end if;

  if p_terminal_status in ('cleared','dead') then
    v_actual_hp:=p_finishing_hp::numeric*100/p_max_hp;
    v_score:=round(greatest(0::numeric,100-abs(v_actual_hp-v_challenge.target_hp)*2))::integer;
  else
    v_score:=0;
  end if;

  v_builder_gold:=case
    when p_terminal_status<>'cleared' then 0
    when v_score=100 then 25
    when v_score>=75 then 20
    when v_score>=50 then 15
    when v_score>=25 then 10
    else 5
  end;

  v_summary:=concat_ws(' · ',
    nullif(array_to_string(array_remove(v_enemy_slots,'none'),', '),''),
    nullif(array_to_string(v_traps,', '),''),
    nullif(array_to_string(v_supports,', '),'')
  );
  if v_summary='' then v_summary:='Empty encounter'; end if;

  v_normalized_encounter:=jsonb_build_object(
    'enemyTypes',to_jsonb(v_enemy_slots),
    'trapTypes',to_jsonb(v_traps),
    'supportTypes',to_jsonb(v_supports),
    'summary',v_summary
  );

  v_canonical:=jsonb_build_object(
    'challengeId',v_challenge.id::text,
    'runnerId',v_challenge.runner_id,
    'targetHp',v_challenge.target_hp,
    'roomId',p_room_id,
    'encounter',v_normalized_encounter-'summary',
    'rulesVersion',p_rules_version
  )::text;
  v_input_hash:=encode(extensions.digest(convert_to(v_canonical,'UTF8'),'sha256'),'hex');

  insert into public.builder_challenge_result(
    challenge_id,room_id,encounter,rules_version,terminal_status,
    finishing_hp,max_hp,target_hp,score,hero_gold,builder_gold,deterministic_input_hash
  )
  values(
    v_challenge.id,p_room_id,v_normalized_encounter,p_rules_version,p_terminal_status,
    p_finishing_hp,p_max_hp,v_challenge.target_hp,v_score,p_hero_gold,v_builder_gold,v_input_hash
  )
  on conflict(challenge_id,deterministic_input_hash) do nothing
  returning * into v_result;

  if not found then
    v_inserted:=false;
    select * into v_result
    from public.builder_challenge_result r
    where r.challenge_id=v_challenge.id and r.deterministic_input_hash=v_input_hash;
  end if;

  return query select v_result.id,not v_inserted;
end $$;
revoke all on function public.submit_builder_challenge_result(text,text,jsonb,text,text,integer,integer,integer) from public;
grant execute on function public.submit_builder_challenge_result(text,text,jsonb,text,text,integer,integer,integer) to anon,authenticated;

create or replace function public.get_builder_challenge_results(p_limit integer default 10)
returns table(result_id uuid,challenge_id uuid,target_hp integer,room_id text,encounter_summary text,terminal_status text,finishing_hp_percent numeric,score integer,hero_gold integer,builder_gold integer,completed_at timestamptz,owner_seen_at timestamptz)
language sql stable security definer set search_path=''
as $$
 select r.id,r.challenge_id,r.target_hp,r.room_id,coalesce(r.encounter->>'summary','Recorded encounter'),r.terminal_status,r.finishing_hp_percent,r.score,r.hero_gold,r.builder_gold,r.completed_at,r.owner_seen_at
 from public.builder_challenge_result r join public.builder_challenge c on c.id=r.challenge_id
 where c.owner_player_id=auth.uid() order by r.completed_at desc,r.id desc limit least(greatest(coalesce(p_limit,10),1),50)
$$;
revoke all on function public.get_builder_challenge_results(integer) from public,anon;
grant execute on function public.get_builder_challenge_results(integer) to authenticated;

create or replace function public.mark_builder_challenge_result_read(p_result_id uuid)
returns table(result_id uuid,owner_seen_at timestamptz)
language plpgsql security definer set search_path=''
as $$
begin
 return query update public.builder_challenge_result r set owner_seen_at=coalesce(r.owner_seen_at,now())
 from public.builder_challenge c where r.id=p_result_id and c.id=r.challenge_id and c.owner_player_id=auth.uid()
 returning r.id,r.owner_seen_at;
end $$;
revoke all on function public.mark_builder_challenge_result_read(uuid) from public,anon;
grant execute on function public.mark_builder_challenge_result_read(uuid) to authenticated;
