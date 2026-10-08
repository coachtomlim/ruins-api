-- FRIEND FEEDBACK 002E9C — governed Level 1 BRUTAL receipt authority.
-- Additive only. 002B, 002B1, 002B2 and 002E9A are already APPLIED to staging; this is a new correction on
-- top of them (CREATE OR REPLACE of one function + replacement of one CHECK constraint). NOT applied by
-- Claude: PM applies and proves it on S8B Staging (qpgwqmduqtqidmhbuclw) after local source PASS.
--
-- WHY: the Owner-approved Level 1 BRUTAL starter preset is FIVE monsters (Goblin x2 + Skeleton x3) with a
-- nominal content cost of 130 and a potential Hero Gold of 39 (6+6+9+9+9). The 002E9A function normalises
-- only three enemy slots, rejects any encounter above the ordinary 100 budget, and (with the table CHECK)
-- caps Hero Gold at 31, so it cannot truthfully receive that run.
--
-- WHAT CHANGES (the body below is the 002E9A body plus exactly these edits):
--   1. up to FIVE enemy slots are accepted (padded to at least three with 'none', so <=3-monster
--      encounters normalise and hash exactly as before);
--   2. v_governed: the ONE encounter that may exceed three monsters and the ordinary 100 budget is the
--      governed BRUTAL preset — room iron-labyrinth-08, enemies exactly goblin,goblin,skeleton,skeleton,
--      skeleton in that order, no traps, no supports. Every other encounter with more than three monsters
--      is RESULT_ENCOUNTER_INVALID, and every other encounter above budget 100 is still
--      RESULT_ENCOUNTER_BUDGET_EXCEEDED (arbitrary 101..130 builds are NOT legal);
--   3. Hero Gold ceiling: 31 for every ordinary encounter (unchanged), 39 for the governed preset only.
--      The per-encounter derived maximum (v_hero_gold_max, summed from the server's own monster map) is
--      STILL enforced first, so a client can never claim more Gold than the encounter it ran can produce;
--      40+ is rejected;
--   4. table CHECK widened 0..31 -> 0..39 (the RPC derivation remains the real authority).
-- The allow-list is unchanged and explicit: goblin, skeleton, goblin-elite, antlion, zombie, skeleton-archer.
-- score / Builder Gold derivation, max-HP authority, attempt_token, idempotency, supersession
-- (is_current / superseded_at), the one-current-result index and snapshot semantics are untouched.
--
-- TABLE CHECK: located by catalog introspection (the 002B2 / 002E9A lesson), never by a guessed name, and
-- replaced by an explicitly named 0..39 CHECK. Idempotent.

do $$
declare
  v_conname text;
begin
  for v_conname in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'builder_challenge_result'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ~ '^CHECK \(+hero_gold'
  loop
    execute format('alter table public.builder_challenge_result drop constraint %I', v_conname);
    raise notice 'FRIEND_FEEDBACK_002E9C: dropped hero_gold check %', v_conname;
  end loop;

  alter table public.builder_challenge_result
    add constraint builder_challenge_result_hero_gold_range check (hero_gold between 0 and 39);
end $$;

do $$
declare
  v_n integer;
begin
  select count(*) into v_n
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public' and rel.relname = 'builder_challenge_result' and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ~ 'hero_gold';
  if v_n <> 1 then
    raise exception 'FRIEND_FEEDBACK_002E9C_ASSERTION_FAILED: expected exactly one hero_gold CHECK, found %', v_n;
  end if;
end $$;

create or replace function public.submit_builder_challenge_result_v2(
  p_public_token text,
  p_room_id text,
  p_encounter jsonb,
  p_rules_version text,
  p_terminal_status text,
  p_finishing_hp integer,
  p_max_hp integer,
  p_hero_gold integer,
  p_attempt_token text default null
)
returns table(result_id uuid,duplicate boolean,is_current boolean)
language plpgsql security definer set search_path=''
as $$
declare
  v_challenge public.builder_challenge%rowtype;
  v_existing public.builder_challenge_result%rowtype;
  v_result public.builder_challenge_result%rowtype;
  v_enemy_slots text[];
  v_traps text[];
  v_supports text[];
  v_normalized_encounter jsonb;
  v_budget integer:=0;
  v_hero_gold_max integer:=0;
  v_expected_max_hp integer;
  v_snapshot_hp_text text;
  v_snapshot_hp integer;
  v_actual_hp numeric;
  v_score integer;
  v_builder_gold integer;
  v_canonical text;
  v_input_hash text;
  v_summary text;
  v_attempt_token text;
  v_governed boolean:=false;
begin
  if p_public_token is null or p_public_token !~ '^[A-Za-z0-9_-]{32,128}$' then
    raise exception 'UNKNOWN_CHALLENGE_TOKEN';
  end if;

  select * into v_challenge
  from public.builder_challenge c
  where c.public_token=p_public_token
  for update;
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

  if jsonb_array_length(p_encounter->'enemyTypes')>5
     or exists(select 1 from jsonb_array_elements(p_encounter->'enemyTypes') e where jsonb_typeof(e)<>'string')
     or exists(select 1 from jsonb_array_elements(p_encounter->'trapTypes') e where jsonb_typeof(e)<>'string')
     or exists(select 1 from jsonb_array_elements(p_encounter->'supportTypes') e where jsonb_typeof(e)<>'string') then
    raise exception 'RESULT_ENCOUNTER_INVALID';
  end if;

  -- 002E9C: up to FIVE slots, padded to at least three with 'none' exactly as before, so every
  -- encounter of three or fewer monsters normalises (and hashes) byte-identically to the 002E9A function.
  select array(
    select coalesce(p_encounter->'enemyTypes'->>i,'none')
    from generate_series(0,greatest(2,jsonb_array_length(p_encounter->'enemyTypes')-1)) as g(i)
    order by i
  ) into v_enemy_slots;

  if exists(select 1 from unnest(v_enemy_slots) x where x not in ('none','goblin','skeleton','goblin-elite','antlion','zombie','skeleton-archer')) then
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

  -- 002E9C: the ONE encounter allowed beyond three monsters / the ordinary 100 budget is the governed
  -- Level 1 BRUTAL starter preset: iron-labyrinth-08 with exactly goblin,goblin,skeleton,skeleton,skeleton
  -- (in that order), no traps and no supports. Anything else with more than three monsters is invalid.
  v_governed:=p_room_id='iron-labyrinth-08'
    and v_enemy_slots=array['goblin','goblin','skeleton','skeleton','skeleton']::text[]
    and cardinality(v_traps)=0 and cardinality(v_supports)=0;
  if cardinality(v_enemy_slots)>3 and not v_governed then
    raise exception 'RESULT_ENCOUNTER_INVALID';
  end if;

  select coalesce(sum(case x
    when 'goblin' then 20 when 'skeleton' then 30 when 'goblin-elite' then 40
    when 'antlion' then 50 when 'zombie' then 35 when 'skeleton-archer' then 35 else 0 end),0),
    coalesce(sum(case x
      when 'goblin' then 6 when 'skeleton' then 9 when 'goblin-elite' then 12
      when 'antlion' then 15 when 'zombie' then 11 when 'skeleton-archer' then 11 else 0 end),0)
  into v_budget,v_hero_gold_max
  from unnest(v_enemy_slots) x;

  v_budget:=v_budget + coalesce((select sum(case x when 'spike-trap' then 20 when 'dart-trap' then 15 else 0 end) from unnest(v_traps) x),0);
  v_budget:=v_budget + coalesce((select sum(15) from unnest(v_supports)),0);
  if v_budget>100 and not v_governed then raise exception 'RESULT_ENCOUNTER_BUDGET_EXCEEDED'; end if;

  if p_hero_gold>v_hero_gold_max or p_hero_gold>case when v_governed then 39 else 31 end then
    raise exception 'RESULT_HERO_GOLD_INVALID';
  end if;

  -- Transitional max-HP authority (002B1):
  --   legacy v1 wrapper always calls with p_attempt_token = null -> always the template path,
  --   unchanged from before this migration, so the still-undeployed-past-002B HostGator client
  --   keeps working exactly as it does today.
  --   An attempt-aware (p_attempt_token is not null) caller trusts the challenge's captured
  --   runner_snapshot HP when one exists and is a bounded positive integer; it is never silently
  --   downgraded to the template value just because one happens to exist. A historical challenge
  --   with runner_snapshot still null (published before 002B) falls back to the same template
  --   authority legacy clients use — there is nothing else safe to validate against.
  v_snapshot_hp := null;
  if p_attempt_token is not null and v_challenge.runner_snapshot is not null then
    v_snapshot_hp_text := v_challenge.runner_snapshot#>>'{runner,stats,hp}';
    if v_snapshot_hp_text ~ '^[0-9]{1,4}$' then
      v_snapshot_hp := v_snapshot_hp_text::integer;
      if v_snapshot_hp < 1 or v_snapshot_hp > 10000 then
        v_snapshot_hp := null;
      end if;
    end if;
  end if;

  if v_snapshot_hp is not null then
    v_expected_max_hp := v_snapshot_hp;
  else
    v_expected_max_hp:=case v_challenge.runner_id
      when 'warrior-l1' then 100
      when 'warrior-l2' then 110
      when 'warrior-l3' then 120
      else null
    end;
  end if;
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

  v_attempt_token:=coalesce(nullif(trim(p_attempt_token),''),v_input_hash);
  if v_attempt_token !~ '^[A-Za-z0-9_-]{16,128}$' and v_attempt_token !~ '^[0-9a-f]{64}$' then
    raise exception 'ATTEMPT_TOKEN_INVALID';
  end if;

  select * into v_existing
  from public.builder_challenge_result r
  where r.challenge_id=v_challenge.id and r.attempt_token=v_attempt_token;
  if found then
    return query select v_existing.id, true, v_existing.is_current;
    return;
  end if;

  -- FIX (002B1): every column in this UPDATE is now qualified with the table alias `r`. Before
  -- this correction, the bare `is_current` here was ambiguous against this function's own
  -- RETURNS TABLE OUT variable of the same name (ERROR 42702, confirmed live in staging).
  -- `challenge_id` is additionally qualified for the same defense-in-depth reason even though it
  -- does not collide with any OUT parameter name today.
  update public.builder_challenge_result r
  set is_current=false, superseded_at=now()
  where r.challenge_id=v_challenge.id and r.is_current=true;

  insert into public.builder_challenge_result(
    challenge_id,room_id,encounter,rules_version,terminal_status,
    finishing_hp,max_hp,target_hp,score,hero_gold,builder_gold,deterministic_input_hash,
    attempt_token,is_current
  )
  values(
    v_challenge.id,p_room_id,v_normalized_encounter,p_rules_version,p_terminal_status,
    p_finishing_hp,p_max_hp,v_challenge.target_hp,v_score,p_hero_gold,v_builder_gold,v_input_hash,
    v_attempt_token,true
  )
  returning * into v_result;

  return query select v_result.id, false, true;
end $$;
revoke all on function public.submit_builder_challenge_result_v2(text,text,jsonb,text,text,integer,integer,integer,text) from public;
grant execute on function public.submit_builder_challenge_result_v2(text,text,jsonb,text,text,integer,integer,integer,text) to anon,authenticated;

-- submit_builder_challenge_result (v1 legacy wrapper) and every other function are unchanged.
