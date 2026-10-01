-- FRIEND FEEDBACK 002B — replay attempt identity + challenge-time Runner snapshot.
-- Additive only. Does not edit 20260928_friend_challenge_feedback_nav.sql history.
-- Still unapplied while 002B is reviewed for staging.
--
-- Owner rule: ONE CHALLENGE = ONE CURRENT RESULT. A genuine new run supersedes the prior
-- current result; a network retry of the same run must stay idempotent. These are different
-- things today because the only identity a result has is `deterministic_input_hash` (a pure
-- function of room/encounter/rules), so retrying the exact same build dedupes (correct) but so
-- does deliberately replaying the exact same build on purpose (wrong — Owner wants that to be a
-- new current result). This migration introduces an explicit client-generated `attempt_token`
-- as the one true run identity, decoupled from the build.

-- ---------------------------------------------------------------------------
-- PART A — attempt identity + current/superseded result semantics
-- ---------------------------------------------------------------------------

alter table public.builder_challenge_result add column if not exists attempt_token text;
alter table public.builder_challenge_result add column if not exists is_current boolean not null default true;
alter table public.builder_challenge_result add column if not exists superseded_at timestamptz;

-- Backfill: existing rows have no attempt_token. `deterministic_input_hash` was the only identity
-- a result had, and it is already unique per (challenge_id, hash), so it is a safe, deterministic
-- stand-in attempt_token for rows that predate this migration (legacy rows are never re-submitted
-- with a new attempt_token, so no collision risk).
update public.builder_challenge_result set attempt_token = deterministic_input_hash where attempt_token is null;
alter table public.builder_challenge_result alter column attempt_token set not null;
alter table public.builder_challenge_result drop constraint if exists builder_challenge_result_attempt_token_format;
alter table public.builder_challenge_result add constraint builder_challenge_result_attempt_token_format
  check (attempt_token ~ '^[A-Za-z0-9_-]{16,128}$' or attempt_token ~ '^[0-9a-f]{64}$');

-- Backfill is_current deterministically: latest completed_at wins; ties broken by highest id.
-- Every other existing row for that challenge becomes superseded as of this migration run.
with ranked as (
  select id, challenge_id,
    row_number() over (partition by challenge_id order by completed_at desc, id desc) as rn
  from public.builder_challenge_result
)
update public.builder_challenge_result r
set is_current = (ranked.rn = 1),
    superseded_at = case when ranked.rn = 1 then null else now() end
from ranked
where ranked.id = r.id;

-- The old global uniqueness on (challenge_id, deterministic_input_hash) is exactly the bug: it
-- blocks a deliberate replay of an identical build from ever becoming a new attempt. attempt_token
-- is the new sole run-identity invariant, so it replaces the hash constraint rather than stacking
-- beside it (stacking would still reject "same build, new attempt_token" with a hash conflict).
alter table public.builder_challenge_result drop constraint if exists builder_challenge_result_challenge_id_deterministic_input_hash_key;
alter table public.builder_challenge_result drop constraint if exists builder_challenge_result_challenge_id_attempt_token_key;
alter table public.builder_challenge_result add constraint builder_challenge_result_challenge_id_attempt_token_key
  unique (challenge_id, attempt_token);

-- Database invariant: at most one current result per challenge, enforced independently of
-- application logic. A losing concurrent writer gets a unique-violation error, not a silent
-- second "current" row (see submit_builder_challenge_result_v2's `for update` challenge lock,
-- which makes that error path unreachable in practice but keeps it as a hard backstop).
drop index if exists public.builder_challenge_result_one_current_uidx;
create unique index builder_challenge_result_one_current_uidx
  on public.builder_challenge_result(challenge_id)
  where is_current;

create index if not exists builder_challenge_result_current_feed_idx
  on public.builder_challenge_result(challenge_id, is_current, completed_at desc, id);

-- ---------------------------------------------------------------------------
-- PART B — submit_builder_challenge_result_v2: attempt-aware, supersedes atomically
-- ---------------------------------------------------------------------------

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

  -- Lock the challenge row for the duration of this submission. This serializes every concurrent
  -- submit for the SAME challenge, which is what makes the supersede-then-insert sequence below
  -- race-free: a second writer blocks here until the first writer's transaction ends, by which
  -- point the first writer's new row is already the sole is_current row.
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

  -- Legacy callers (the original submit_builder_challenge_result) pass no attempt token; fall
  -- back to the deterministic hash so their existing hash-based idempotency keeps working exactly
  -- as before. New callers always pass a real client-generated attempt_token.
  v_attempt_token:=coalesce(nullif(trim(p_attempt_token),''),v_input_hash);
  if v_attempt_token !~ '^[A-Za-z0-9_-]{16,128}$' and v_attempt_token !~ '^[0-9a-f]{64}$' then
    raise exception 'ATTEMPT_TOKEN_INVALID';
  end if;

  -- Same attempt retried (network retry of the SAME completed run): return the existing row
  -- unchanged. This is the idempotent path — it must never touch is_current/superseded_at.
  select * into v_existing
  from public.builder_challenge_result r
  where r.challenge_id=v_challenge.id and r.attempt_token=v_attempt_token;
  if found then
    return query select v_existing.id, true, v_existing.is_current;
    return;
  end if;

  -- Genuinely new attempt: supersede whatever is current now, then insert the new current row.
  -- Both statements run inside this function's single transaction under the challenge row lock
  -- taken above, so the partial unique index never observes two is_current rows at once.
  update public.builder_challenge_result
  set is_current=false, superseded_at=now()
  where challenge_id=v_challenge.id and is_current;

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

-- v1 becomes a thin compatibility wrapper so any still-deployed legacy client keeps its existing
-- hash-based idempotency unchanged (p_attempt_token defaults to null inside v2, which falls back
-- to the deterministic hash exactly as v1 always did).
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
language sql security definer set search_path=''
as $$
  select v2.result_id, v2.duplicate
  from public.submit_builder_challenge_result_v2(
    p_public_token,p_room_id,p_encounter,p_rules_version,p_terminal_status,
    p_finishing_hp,p_max_hp,p_hero_gold,null
  ) v2
$$;
revoke all on function public.submit_builder_challenge_result(text,text,jsonb,text,text,integer,integer,integer) from public;
grant execute on function public.submit_builder_challenge_result(text,text,jsonb,text,text,integer,integer,integer) to anon,authenticated;

-- ---------------------------------------------------------------------------
-- PART C — Challenge Activity reads only the current result per challenge by default
-- ---------------------------------------------------------------------------

create or replace function public.get_builder_challenge_results_v2(p_limit integer default 10)
returns table(result_id uuid,challenge_id uuid,target_hp integer,room_id text,encounter_summary text,terminal_status text,finishing_hp_percent numeric,score integer,hero_gold integer,builder_gold integer,completed_at timestamptz,owner_seen_at timestamptz,is_current boolean)
language sql stable security definer set search_path=''
as $$
 select r.id,r.challenge_id,r.target_hp,r.room_id,coalesce(r.encounter->>'summary','Recorded encounter'),r.terminal_status,r.finishing_hp_percent,r.score,r.hero_gold,r.builder_gold,r.completed_at,r.owner_seen_at,r.is_current
 from public.builder_challenge_result r join public.builder_challenge c on c.id=r.challenge_id
 where c.owner_player_id=auth.uid() and r.is_current
 order by r.completed_at desc,r.id desc limit least(greatest(coalesce(p_limit,10),1),50)
$$;
revoke all on function public.get_builder_challenge_results_v2(integer) from public,anon;
grant execute on function public.get_builder_challenge_results_v2(integer) to authenticated;

-- History (all attempts, including superseded) is a deliberately separate, explicit capability —
-- not exposed through normal Challenge Activity per Part 5's "do not expose it in normal Friend
-- Activity yet." Provided now so a future history view doesn't need another migration.
create or replace function public.get_builder_challenge_result_history(p_challenge_id uuid,p_limit integer default 20)
returns table(result_id uuid,challenge_id uuid,terminal_status text,finishing_hp_percent numeric,score integer,hero_gold integer,builder_gold integer,completed_at timestamptz,is_current boolean,superseded_at timestamptz)
language sql stable security definer set search_path=''
as $$
  select r.id,r.challenge_id,r.terminal_status,r.finishing_hp_percent,r.score,r.hero_gold,r.builder_gold,r.completed_at,r.is_current,r.superseded_at
  from public.builder_challenge_result r join public.builder_challenge c on c.id=r.challenge_id
  where c.owner_player_id=auth.uid() and r.challenge_id=p_challenge_id
  order by r.completed_at desc,r.id desc limit least(greatest(coalesce(p_limit,20),1),100)
$$;
revoke all on function public.get_builder_challenge_result_history(uuid,integer) from public,anon;
grant execute on function public.get_builder_challenge_result_history(uuid,integer) to authenticated;

-- ---------------------------------------------------------------------------
-- PART D — challenge-time Runner snapshot (captured once, at publish)
-- ---------------------------------------------------------------------------

-- JSONB snapshot column on builder_challenge (option A from Part 8): the simplest shape that
-- preserves publish-time state byte-for-byte, needs no joins into private account tables at
-- Friend runtime, and is trivial to validate with a jsonb_typeof check. Normalized child rows
-- would buy nothing here — the snapshot is written once and read whole, never queried by field.
alter table public.builder_challenge add column if not exists runner_snapshot jsonb;
alter table public.builder_challenge drop constraint if exists builder_challenge_runner_snapshot_shape;
alter table public.builder_challenge add constraint builder_challenge_runner_snapshot_shape
  check (runner_snapshot is null or jsonb_typeof(runner_snapshot)='object');

-- Snapshot capture happens only for a genuinely NEW challenge (create_builder_challenge already
-- treats a repeat (owner,runner_id,target_hp) publish as a duplicate and returns the original row
-- untouched) — this is what makes "must not change later" hold: a duplicate publish never
-- re-snapshots, and there is no other write path to this column.
create or replace function public.create_builder_challenge_v2(p_target_hp integer)
returns table (challenge_id uuid,runner_id text,target_hp integer,invite_code text,sender_name text,public_token text,builder_xp_awarded integer,total_builder_xp integer,builder_level integer,duplicate boolean,created_at timestamptz)
language plpgsql security definer set search_path=''
as $$
declare
  v_old record;
  v_token text;
  v_state jsonb;
  v_gear jsonb;
  v_safe_gear jsonb;
  v_snapshot jsonb;
begin
  select * into v_old from public.create_builder_challenge(p_target_hp);
  select c.public_token,c.runner_snapshot into v_token,v_snapshot
  from public.builder_challenge c where c.id=v_old.challenge_id;

  if not v_old.duplicate and v_snapshot is null then
    select public.get_account_runner_state(null::uuid) into v_state;
    v_gear:=coalesce(v_state->'gear','[]'::jsonb);
    -- Strip account-private identifiers (ownership_id is a private row UUID). item_id stays: it
    -- names a governed public catalog row (runner_item_catalog), not an account/player identifier.
    select coalesce(jsonb_agg(elem - 'ownership_id' order by ordinality),'[]'::jsonb)
    into v_safe_gear
    from jsonb_array_elements(v_gear) with ordinality as t(elem,ordinality);

    v_snapshot:=jsonb_build_object(
      'captured_at',now(),
      'runner',jsonb_build_object(
        'display_name',v_state->>'runner_name',
        'tier',v_old.runner_id,
        'stats',v_state->'effective_stats'
      ),
      'equipment',v_safe_gear
    );
    update public.builder_challenge set runner_snapshot=v_snapshot where id=v_old.challenge_id;
  end if;

  return query select v_old.challenge_id,v_old.runner_id,v_old.target_hp,v_old.invite_code,v_old.sender_name,v_token,v_old.builder_xp_awarded,v_old.total_builder_xp,v_old.builder_level,v_old.duplicate,v_old.created_at;
end $$;
revoke all on function public.create_builder_challenge_v2(integer) from public,anon;
grant execute on function public.create_builder_challenge_v2(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- PART E — bounded public snapshot read, keyed only by the opaque public_token
-- ---------------------------------------------------------------------------

create or replace function public.get_builder_challenge_public_snapshot(p_public_token text)
returns table(sender_name text,target_hp integer,runner_snapshot jsonb)
language sql stable security definer set search_path=''
as $$
  select c.sender_name,c.target_hp,c.runner_snapshot
  from public.builder_challenge c
  where c.public_token=p_public_token
    and p_public_token ~ '^[A-Za-z0-9_-]{32,128}$'
$$;
revoke all on function public.get_builder_challenge_public_snapshot(text) from public;
grant execute on function public.get_builder_challenge_public_snapshot(text) to anon,authenticated;
-- Unknown/invalid token: the query returns zero rows (not an error) — the same bounded
-- not-found shape callers already handle for an empty result set. No owner_player_id,
-- owner_runner_id, challenge id, email, or private history is ever selected here.
