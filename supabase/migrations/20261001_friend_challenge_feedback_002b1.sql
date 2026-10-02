-- FRIEND FEEDBACK 002B1 — staging-found correction to submit_builder_challenge_result_v2.
-- Additive only. 002B (20260930_friend_challenge_feedback_002b.sql) is already APPLIED to
-- staging; this migration is NOT a rewrite of that history, it is a CREATE OR REPLACE correction
-- on top of it, safe to run again against the current 002B-applied state.
--
-- STAGING FINDING 1: a real v2 submission failed with
--   ERROR 42702: column reference "is_current" is ambiguous
-- submit_builder_challenge_result_v2's RETURNS TABLE declares an OUT column named `is_current`,
-- which PL/pgSQL auto-binds as an in-scope variable for the whole function body. The supersede
-- UPDATE referenced the real table column `is_current` unqualified, so Postgres could not tell
-- whether `is_current` in the WHERE clause meant the OUT variable or `builder_challenge_result
-- .is_current`. pglast's parse_sql/parse_plpgsql cannot catch this: the statement is syntactically
-- valid in isolation — the ambiguity only exists because of the surrounding RETURNS TABLE scope,
-- which is a semantic (catalog-dependent) check pglast does not perform.
--
-- Audited every other PL/pgSQL function this feature touches for the same OUT-variable/column
-- collision pattern:
--   - create_builder_challenge_v2: OUT columns (challenge_id, runner_id, target_hp, invite_code,
--     sender_name, public_token, builder_xp_awarded, total_builder_xp, builder_level, duplicate,
--     created_at) never appear unqualified against a real table anywhere in its body — every
--     reference goes through `v_old.<field>` or `c.<column>`. Not affected.
--   - mark_builder_challenge_result_read (001, untouched here): OUT columns (result_id,
--     owner_seen_at) collide in name with real columns, but the only unqualified use is the LHS
--     of `set owner_seen_at=...`, which Postgres always parses as a column reference by grammar
--     (an UPDATE SET target can never be read as a variable) — not ambiguous. The RETURNING list
--     and RHS are already qualified via `r.`. Not affected.
--   - get_builder_challenge_results_v2 / get_builder_challenge_result_history /
--     get_builder_challenge_public_snapshot: `language sql`, not plpgsql — PL/pgSQL's
--     OUT-variable auto-binding does not exist for these at all. Not affected.
-- submit_builder_challenge_result_v2 was the only affected function, and the single unqualified
-- `is_current` in its supersede UPDATE was the only ambiguous reference in it.
--
-- STAGING FINDING 2: a newly published staging challenge captured an account-authoritative
-- runner_snapshot with hp=105 for warrior-l1, but the function still validated max HP against the
-- hard-coded template value (100), so a snapshot-authoritative client submitting a real 105-HP run
-- would be rejected with RESULT_MAX_HP_INVALID. This must be resolved before 002C makes the
-- correlated Friend runtime snapshot-authoritative, but the current live HostGator client has not
-- been upgraded past the pre-002B template runtime, so legacy v1 submissions (p_attempt_token is
-- null) must keep validating against the old template values exactly as before.

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

-- submit_builder_challenge_result (v1, legacy wrapper) is unchanged by this migration: it always
-- calls v2 with p_attempt_token := null, which this correction's logic routes straight to the
-- template max-HP branch exactly as it always has. Not redefined here on purpose — there is
-- nothing in it to fix.
