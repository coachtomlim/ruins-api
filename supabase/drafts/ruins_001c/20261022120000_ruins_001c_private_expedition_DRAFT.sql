-- RUINS_DAILY_EXPEDITION_001C_OFFLINE_BACKEND_PROOF_006 · MIGRATION DRAFT (SOURCE ONLY)
--
-- STATUS: DRAFT. NOT AUTHORIZED FOR SUPABASE STAGING OR PRODUCTION. Deliberately kept OUTSIDE
-- supabase/migrations/ so `supabase db push` / migration tooling can never pick it up by accident.
-- Proven only against a disposable local PostgreSQL 17.6 (tools/ruins-001c-offline-proof/).
--
-- Contract: docs/ruins/RUINS_DAILY_EXPEDITION_001C_TRUSTED_SERVER_TRANSACTION_CONTRACT_V1.md
-- Matrix:   docs/ruins/RUINS_DAILY_EXPEDITION_001C_STAGING_ACCESS_MATRIX_V1.md
-- Protocol: docs/ruins/RUINS_DAILY_EXPEDITION_001C_STAGING_PROTOCOL_V1.json (ruins-expedition-001c.v1)
--
-- Security model
--   * Schema ruins_private is NOT exposed to PostgREST (must stay off the Data API exposed-schema list).
--   * ruins_owner  (NOLOGIN, no superuser/bypassrls/createrole/createdb) owns schema, tables, routines.
--   * ruins_backend (created NOLOGIN here; LOGIN + secret are configured out-of-band by an authorized
--     operator, never in source) gets USAGE on ruins_private and EXECUTE on exactly three entry routines.
--     It has NO table privileges, so a leaked backend credential still cannot bypass the rules.
--   * Entry routines are SECURITY DEFINER (owner ruins_owner) because the backend role must not hold
--     direct DML; each pins `SET search_path = ''`, schema-qualifies every relation, uses no dynamic SQL,
--     derives every ownership decision from the server-verified principal argument, and revokes PUBLIC.
--   * RLS is ENABLED (not FORCED) on all six tables with NO policies: browser roles have no grants and
--     no policies; the table owner (routines) bypasses RLS by design, so routine-internal checks are the
--     authority. This is verified by dynamic negative tests, not assumed.
--   * Nothing is created in, granted on, or read from `public`. public.wallet_ledger / runner_xp_event /
--     Daily Trial / Friend / SL-SIM objects are never referenced.
--   * Rewards are STAGING_ONLY, non-transferable, recorded only in ruins_private.

begin;

-- ---------------------------------------------------------------------------------------------
-- Roles (idempotent; fail closed if a pre-existing role is more privileged than designed)
-- ---------------------------------------------------------------------------------------------
do $roles$
declare r record;
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'ruins_owner') then
    create role ruins_owner nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls noreplication;
  end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'ruins_backend') then
    create role ruins_backend nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls noreplication;
  end if;
  for r in select rolname, rolsuper, rolcreatedb, rolcreaterole, rolbypassrls, rolreplication, rolcanlogin
           from pg_catalog.pg_roles where rolname in ('ruins_owner','ruins_backend') loop
    if r.rolsuper or r.rolcreatedb or r.rolcreaterole or r.rolbypassrls or r.rolreplication
       or (r.rolname = 'ruins_owner' and r.rolcanlogin) then
      raise exception 'RUINS_001C_ROLE_PRIVILEGE_UNEXPECTED: %', r.rolname;
    end if;
  end loop;
  -- PG16+: the creating role must be allowed to SET ROLE ruins_owner to create objects owned by it.
  execute pg_catalog.format('grant ruins_owner to %I with inherit false, set true', current_user);
end
$roles$;

create schema ruins_private authorization ruins_owner;

-- Every object below is created by, and therefore owned by, ruins_owner. All GRANT/REVOKE statements also
-- run as the owner: a non-owner REVOKE only emits a WARNING and silently does nothing.
set local role ruins_owner;

revoke all on schema ruins_private from public;
revoke all on schema ruins_private from anon, authenticated, service_role;
grant usage on schema ruins_private to ruins_backend;

-- Future objects created by ruins_owner never inherit browser/PUBLIC rights.
alter default privileges for role ruins_owner revoke execute on functions from public;
alter default privileges for role ruins_owner in schema ruins_private revoke all on tables from public;
alter default privileges for role ruins_owner in schema ruins_private revoke all on sequences from public;
alter default privileges for role ruins_owner in schema ruins_private revoke all on functions from public;

-- ---------------------------------------------------------------------------------------------
-- Six private authority tables (uuid keys; no sequences are created)
-- ---------------------------------------------------------------------------------------------
create table ruins_private.expedition_entitlement (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  principal_kind text not null check (principal_kind = 'ACCOUNT'),
  principal_id uuid not null,
  campaign_reward_scope text not null check (campaign_reward_scope = 'ruins-gate-c-015:five-day:v1'),
  definition_id text not null check (definition_id = 'ruins-gate-c-015'),
  contract_version text not null,
  rules_version text not null,
  content_pin text not null,
  reward_policy text not null default 'STAGING_NONTRANSFERABLE' check (reward_policy = 'STAGING_NONTRANSFERABLE'),
  created_at timestamptz not null default pg_catalog.now(),
  constraint expedition_entitlement_principal_scope_key unique (principal_kind, principal_id, campaign_reward_scope)
);

create table ruins_private.expedition_instance (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  entitlement_id uuid not null references ruins_private.expedition_entitlement(id) on delete restrict,
  revision bigint not null default 0 check (revision >= 0),
  status text not null check (status in ('ACTIVE','AWAITING_DAY')),
  day_number smallint not null check (day_number between 1 and 5),
  room smallint not null check (room in (1, 2)),
  checkpoint text not null,
  state jsonb not null check (pg_catalog.jsonb_typeof(state) = 'object'),
  rules_version text not null,
  content_pin text not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint expedition_instance_entitlement_key unique (entitlement_id)
);

create table ruins_private.expedition_operation (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  entitlement_id uuid not null references ruins_private.expedition_entitlement(id) on delete restrict,
  operation_id uuid not null,
  command_type text not null,
  expected_revision bigint not null,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  committed_revision bigint not null,
  receipt jsonb not null,
  committed_at timestamptz not null default pg_catalog.now(),
  constraint expedition_operation_entitlement_operation_key unique (entitlement_id, operation_id)
);

create table ruins_private.expedition_claim (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  entitlement_id uuid not null references ruins_private.expedition_entitlement(id) on delete restrict,
  instance_id uuid not null references ruins_private.expedition_instance(id) on delete restrict,
  reward_source_id text not null check (reward_source_id in ('ruins-gate-c-015:room02:zombie:01:defeat','ruins-gate-c-015:room02:chest:01')),
  operation_id uuid not null,
  payload jsonb not null,
  staging_only boolean not null default true check (staging_only),
  claimed_revision bigint not null,
  claimed_at timestamptz not null default pg_catalog.now(),
  constraint expedition_claim_entitlement_source_key unique (entitlement_id, reward_source_id)
);

create table ruins_private.expedition_inventory_event (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  entitlement_id uuid not null references ruins_private.expedition_entitlement(id) on delete restrict,
  operation_id uuid not null,
  claim_id uuid not null references ruins_private.expedition_claim(id) on delete restrict,
  item_key text not null check (item_key in ('staging_gold','staging_xp')),
  delta integer not null check (delta > 0),
  effect text not null check (effect = 'STAGING_NONTRANSFERABLE_CREDIT'),
  committed_revision bigint not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint expedition_inventory_event_effect_key unique (entitlement_id, operation_id, item_key)
);

create table ruins_private.expedition_day_settlement (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  entitlement_id uuid not null references ruins_private.expedition_entitlement(id) on delete restrict,
  day_number smallint not null check (day_number between 1 and 5),
  status text not null check (status = 'SETTLED'),
  checkpoint text not null,
  operation_id uuid not null,
  settled_revision bigint not null,
  settled_at timestamptz not null default pg_catalog.now(),
  constraint expedition_day_settlement_entitlement_day_key unique (entitlement_id, day_number)
);

alter table ruins_private.expedition_entitlement     enable row level security;
alter table ruins_private.expedition_instance        enable row level security;
alter table ruins_private.expedition_operation       enable row level security;
alter table ruins_private.expedition_claim           enable row level security;
alter table ruins_private.expedition_inventory_event enable row level security;
alter table ruins_private.expedition_day_settlement  enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Pinned Day 1 content and rules (server-owned; never supplied by a client)
-- Collision layers are the exact Gate C authority maps (SHA-256 pins below), row-major y*8+x,
-- verified against public/ruins-expedition/authority by tests/ruins-expedition-001c-offline-proof.test.mjs.
-- ---------------------------------------------------------------------------------------------
create function ruins_private.day1_rules()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'contractVersion', 'ruins-expedition-001c.v1',
    'rulesVersion', 'ruins-001c-day1-server-rules.v1',
    'contentPin', 'gate_c_room_01:931db491d994df65b86a19fbe842c01d06c46627f82ae21a73271cd144e9f17d;gate_c_room_02:c225a37af72f08eb032f531f863146f2651ae48c194d39d0ec33f532edbba15e',
    'scope', 'ruins-gate-c-015:five-day:v1',
    'definition', 'ruins-gate-c-015',
    'collision1', '1111111110000001100000011000000110000001100000011000000111111111',
    'collision2', '1111111110000001100000011000000110000101100000011000000111111111',
    'zombieSource', 'ruins-gate-c-015:room02:zombie:01:defeat',
    'chestSource', 'ruins-gate-c-015:room02:chest:01'
  )
$$;

create function ruins_private.day1_initial_state()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{"status":"ACTIVE","day":1,"room":1,"checkpoint":"day1-room1-entry",
           "hero":{"x":2,"y":4,"hp":100,"maxHp":100,"xp":0,"gold":0},
           "flags":{"gate_c_discovery":false,"gate_c_r2_reward":false},
           "zombie":{"x":4,"y":4,"hp":60,"defeated":false},
           "dayState":{"1":"ACTIVE","2":"LOCKED","3":"LOCKED","4":"LOCKED","5":"LOCKED"},
           "roomState":{"1":"ACTIVE","2":"LOCKED"},
           "claimed":[]}'::jsonb
$$;

create function ruins_private.reject(p_code text, p_reason text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  -- Stable, safe projection: the trusted handler maps 'RUINS:<CODE>:<REASON>' and nothing else.
  raise exception using errcode = 'P0001', message = 'RUINS:' || p_code || ':' || p_reason;
end
$$;

-- Sanitized outward projection: no principal, entitlement, instance, operation hash or internal IDs.
create function ruins_private.public_projection(p_state jsonb, p_revision bigint)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'contractVersion', 'ruins-expedition-001c.v1',
    'scope', 'ruins-gate-c-015:five-day:v1',
    'revision', p_revision,
    'day', (p_state->>'day')::int,
    'room', (p_state->>'room')::int,
    'status', p_state->>'status',
    'checkpoint', p_state->>'checkpoint',
    'heroPublic', p_state->'hero',
    'visibleFlags', pg_catalog.jsonb_build_object(
       'altarDiscovered', (p_state#>>'{flags,gate_c_discovery}')::boolean,
       'zombieDefeated', (p_state#>>'{zombie,defeated}')::boolean,
       'chestClaimed', (p_state#>>'{flags,gate_c_r2_reward}')::boolean),
    'enemyPublic', case when (p_state->>'room')::int = 2 then pg_catalog.jsonb_build_object('zombie', p_state->'zombie') else '{}'::jsonb end,
    'claimedPublic', p_state->'claimed',
    'availableActions', case
       when p_state->>'status' <> 'ACTIVE' then '[]'::jsonb
       when (p_state->>'room')::int = 1 and not (p_state#>>'{flags,gate_c_discovery}')::boolean then '["MOVE","DISCOVER_ALTAR"]'::jsonb
       when (p_state->>'room')::int = 1 then '["MOVE","ENTER_ROOM2"]'::jsonb
       when not (p_state#>>'{zombie,defeated}')::boolean then '["MOVE","ATTACK_ZOMBIE"]'::jsonb
       when not (p_state#>>'{flags,gate_c_r2_reward}')::boolean then '["MOVE","CLAIM_ROOM2_CHEST"]'::jsonb
       else '["MOVE","CLAIM_ROOM2_CHEST","SETTLE_DAY1"]'::jsonb end,
    'policyStatus', 'UNRESOLVED',
    'nextChapter', 'UNAVAILABLE',
    'rewards', 'STAGING_NONTRANSFERABLE')
$$;

-- Canonical request fingerprint computed in the database (never trusted from the handler).
-- jsonb normalises key order, so logically identical commands hash identically.
create function ruins_private.request_hash(p_command jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object(
    'type', p_command->'type',
    'expectedRevision', p_command->'expectedRevision',
    'parameters', p_command->'parameters')::text, 'UTF8')), 'hex')
$$;

-- Strict envelope validation (defense in depth behind the handler's own validation).
create function ruins_private.validate_command(p_command jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_type text;
  v_params jsonb;
begin
  if p_command is null or pg_catalog.jsonb_typeof(p_command) <> 'object' then
    perform ruins_private.reject('BAD_COMMAND', 'ENVELOPE');
  end if;
  if exists (select 1 from pg_catalog.jsonb_object_keys(p_command) k
             where k not in ('contractVersion','operationId','expectedRevision','type','parameters')) then
    perform ruins_private.reject('BAD_COMMAND', 'UNKNOWN_FIELD');
  end if;
  if p_command->>'contractVersion' is distinct from 'ruins-expedition-001c.v1' then
    perform ruins_private.reject('UNSUPPORTED_VERSION', 'CONTRACT_VERSION');
  end if;
  if pg_catalog.jsonb_typeof(p_command->'operationId') is distinct from 'string'
     or (p_command->>'operationId') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    perform ruins_private.reject('BAD_COMMAND', 'OPERATION_ID');
  end if;
  if pg_catalog.jsonb_typeof(p_command->'expectedRevision') is distinct from 'number'
     or (p_command->>'expectedRevision') !~ '^[0-9]{1,9}$' then
    perform ruins_private.reject('BAD_COMMAND', 'EXPECTED_REVISION');
  end if;
  v_type := p_command->>'type';
  v_params := p_command->'parameters';
  if pg_catalog.jsonb_typeof(v_params) is distinct from 'object' then
    perform ruins_private.reject('BAD_COMMAND', 'PARAMETERS');
  end if;
  if v_type in ('BEGIN_NEXT_DAY','ENTER_ROOM3') then
    perform ruins_private.reject('NOT_YET_UNLOCKED', v_type);
  end if;
  if v_type is null or v_type not in ('BOOTSTRAP','MOVE','DISCOVER_ALTAR','ENTER_ROOM2','ATTACK_ZOMBIE','CLAIM_ROOM2_CHEST','SETTLE_DAY1') then
    perform ruins_private.reject('BAD_COMMAND', 'COMMAND_NOT_ALLOWED');
  end if;
  if v_type = 'MOVE' then
    if (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(v_params)) <> 1
       or pg_catalog.jsonb_typeof(v_params->'direction') is distinct from 'string'
       or (v_params->>'direction') not in ('up','right','down','left') then
      perform ruins_private.reject('BAD_COMMAND', 'MOVE_PARAMETERS');
    end if;
  elsif v_params <> '{}'::jsonb then
    perform ruins_private.reject('BAD_COMMAND', 'UNEXPECTED_PARAMETERS');
  end if;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Authoritative Day 1 reducer (mirrors the accepted 001B reference oracle; the oracle is a test
-- comparison only and is never executed for authority). Returns {state, events}.
-- ---------------------------------------------------------------------------------------------
create function ruins_private.day1_reduce(p_state jsonb, p_type text, p_params jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  s jsonb := p_state;
  rules jsonb := ruins_private.day1_rules();
  ev text[] := '{}';
  hx int := (p_state#>>'{hero,x}')::int;
  hy int := (p_state#>>'{hero,y}')::int;
  room int := (p_state->>'room')::int;
  zx int := (p_state#>>'{zombie,x}')::int;
  zy int := (p_state#>>'{zombie,y}')::int;
  zdef boolean := (p_state#>>'{zombie,defeated}')::boolean;
  nx int; ny int; zhp int; hp int;
  coll text;
begin
  if p_state->>'status' <> 'ACTIVE' then
    perform ruins_private.reject('DAY_ALREADY_SETTLED', 'DAY1_SETTLED');
  end if;
  case p_type
  when 'MOVE' then
    nx := hx + case p_params->>'direction' when 'right' then 1 when 'left' then -1 else 0 end;
    ny := hy + case p_params->>'direction' when 'down' then 1 when 'up' then -1 else 0 end;
    coll := case room when 1 then rules->>'collision1' else rules->>'collision2' end;
    if nx < 0 or ny < 0 or nx > 7 or ny > 7 or pg_catalog.substr(coll, ny * 8 + nx + 1, 1) <> '0' then
      perform ruins_private.reject('OUT_OF_RANGE', 'BLOCKED_TILE');
    end if;
    if room = 2 and not zdef and nx = zx and ny = zy then
      perform ruins_private.reject('OUT_OF_RANGE', 'ENEMY_OCCUPIES_TILE');
    end if;
    s := pg_catalog.jsonb_set(pg_catalog.jsonb_set(s, '{hero,x}', pg_catalog.to_jsonb(nx)), '{hero,y}', pg_catalog.to_jsonb(ny));
    ev := pg_catalog.array_append(ev, 'move'::text);
  when 'DISCOVER_ALTAR' then
    if room <> 1 then perform ruins_private.reject('BAD_COMMAND', 'WRONG_ROOM'); end if;
    if not (hx between 2 and 4 and hy between 3 and 5) then perform ruins_private.reject('OUT_OF_RANGE', 'NOT_AT_ALTAR'); end if;
    if (s#>>'{flags,gate_c_discovery}')::boolean then perform ruins_private.reject('BAD_COMMAND', 'ALREADY_DISCOVERED'); end if;
    s := pg_catalog.jsonb_set(s, '{flags,gate_c_discovery}', 'true');
    s := pg_catalog.jsonb_set(s, '{roomState,1}', '"CLEARED"');
    ev := pg_catalog.array_append(ev, 'altar_discovered'::text);
  when 'ENTER_ROOM2' then
    if room <> 1 then perform ruins_private.reject('BAD_COMMAND', 'WRONG_ROOM'); end if;
    if not (s#>>'{flags,gate_c_discovery}')::boolean then perform ruins_private.reject('BAD_COMMAND', 'ALTAR_REQUIRED'); end if;
    if not (hx between 5 and 6 and hy between 1 and 6) then perform ruins_private.reject('OUT_OF_RANGE', 'NOT_AT_ROOM1_EXIT'); end if;
    s := s || '{"room":2,"checkpoint":"day1-room2-entry"}'::jsonb;
    s := pg_catalog.jsonb_set(s, '{roomState,2}', '"ACTIVE"');
    s := pg_catalog.jsonb_set(pg_catalog.jsonb_set(s, '{hero,x}', '1'), '{hero,y}', '4');
    ev := pg_catalog.array_cat(ev, array['door_open','room02_entered']);
  when 'ATTACK_ZOMBIE' then
    if room <> 2 then perform ruins_private.reject('BAD_COMMAND', 'WRONG_ROOM'); end if;
    if zdef then perform ruins_private.reject('BAD_COMMAND', 'ENCOUNTER_ALREADY_CLEARED'); end if;
    if pg_catalog.abs(hx - zx) + pg_catalog.abs(hy - zy) > 1 then perform ruins_private.reject('OUT_OF_RANGE', 'ENEMY_OUT_OF_RANGE'); end if;
    -- Fixed proof combat fixture (native Flare level-1 zombie HP60, XP2): 20 damage per strike.
    -- (GREATEST is SQL syntax, not a pg_catalog function, so it is intentionally unqualified.)
    zhp := greatest(0, (s#>>'{zombie,hp}')::int - 20);
    s := pg_catalog.jsonb_set(s, '{zombie,hp}', pg_catalog.to_jsonb(zhp));
    ev := pg_catalog.array_append(ev, 'zombie_hit'::text);
    if zhp = 0 then
      s := pg_catalog.jsonb_set(s, '{zombie,defeated}', 'true');
      s := pg_catalog.jsonb_set(s, '{hero,xp}', pg_catalog.to_jsonb((s#>>'{hero,xp}')::int + 2));
      ev := pg_catalog.array_append(ev, 'zombie_die'::text);
    else
      hp := greatest(0, (s#>>'{hero,hp}')::int - 5);
      s := pg_catalog.jsonb_set(s, '{hero,hp}', pg_catalog.to_jsonb(hp));
      ev := pg_catalog.array_append(ev, 'player_hit'::text);
      if hp = 0 then
        -- Unreachable with the fixed fixture (hero takes at most 10); death/retry policy is UNRESOLVED.
        perform ruins_private.reject('BAD_COMMAND', 'DEATH_POLICY_UNRESOLVED');
      end if;
    end if;
  when 'CLAIM_ROOM2_CHEST' then
    if room <> 2 then perform ruins_private.reject('BAD_COMMAND', 'WRONG_ROOM'); end if;
    if not zdef then perform ruins_private.reject('BAD_COMMAND', 'ZOMBIE_NOT_DEFEATED'); end if;
    if pg_catalog.abs(hx - 5) + pg_catalog.abs(hy - 4) > 1 then perform ruins_private.reject('OUT_OF_RANGE', 'NOT_AT_CHEST'); end if;
    if (s#>>'{flags,gate_c_r2_reward}')::boolean then
      ev := pg_catalog.array_append(ev, 'already_claimed'::text);
    else
      s := pg_catalog.jsonb_set(s, '{hero,gold}', pg_catalog.to_jsonb((s#>>'{hero,gold}')::int + 30));
      s := pg_catalog.jsonb_set(s, '{flags,gate_c_r2_reward}', 'true');
      ev := pg_catalog.array_append(ev, 'chest_claimed'::text);
    end if;
  when 'SETTLE_DAY1' then
    if room <> 2 then perform ruins_private.reject('BAD_COMMAND', 'WRONG_ROOM'); end if;
    if not zdef then perform ruins_private.reject('BAD_COMMAND', 'ZOMBIE_NOT_DEFEATED'); end if;
    if not (s#>>'{flags,gate_c_r2_reward}')::boolean then perform ruins_private.reject('BAD_COMMAND', 'CHEST_NOT_CLAIMED'); end if;
    s := s || '{"status":"AWAITING_DAY","checkpoint":"day1-settled-room2"}'::jsonb;
    s := pg_catalog.jsonb_set(pg_catalog.jsonb_set(s, '{dayState,1}', '"SETTLED"'), '{roomState,2}', '"CLEARED"');
    ev := pg_catalog.array_append(ev, 'day1_settled'::text);
  else
    perform ruins_private.reject('BAD_COMMAND', 'COMMAND_NOT_ALLOWED');
  end case;
  return pg_catalog.jsonb_build_object('state', s, 'events', pg_catalog.to_jsonb(ev));
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Entry routine 1: bootstrap (idempotent; unique-insert + row lock, no read-before-insert race)
-- ---------------------------------------------------------------------------------------------
create function ruins_private.bootstrap_account_expedition(p_principal_id uuid, p_command jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rules jsonb := ruins_private.day1_rules();
  v_ent ruins_private.expedition_entitlement%rowtype;
  v_inst ruins_private.expedition_instance%rowtype;
  v_op uuid;
  v_hash text;
  v_prior ruins_private.expedition_operation%rowtype;
  v_created boolean := false;
  v_receipt jsonb;
begin
  if p_principal_id is null then perform ruins_private.reject('AUTH_REQUIRED', 'PRINCIPAL'); end if;
  perform ruins_private.validate_command(p_command);
  if p_command->>'type' <> 'BOOTSTRAP' then perform ruins_private.reject('BAD_COMMAND', 'NOT_BOOTSTRAP'); end if;
  v_op := (p_command->>'operationId')::uuid;
  v_hash := ruins_private.request_hash(p_command);

  insert into ruins_private.expedition_entitlement
    (principal_kind, principal_id, campaign_reward_scope, definition_id, contract_version, rules_version, content_pin)
  values ('ACCOUNT', p_principal_id, rules->>'scope', rules->>'definition', rules->>'contractVersion', rules->>'rulesVersion', rules->>'contentPin')
  on conflict on constraint expedition_entitlement_principal_scope_key do nothing;

  -- Lock order: entitlement -> instance.
  select * into strict v_ent from ruins_private.expedition_entitlement
   where principal_kind = 'ACCOUNT' and principal_id = p_principal_id and campaign_reward_scope = rules->>'scope'
   for update;

  if v_ent.rules_version <> rules->>'rulesVersion' or v_ent.content_pin <> rules->>'contentPin' then
    perform ruins_private.reject('ENTITLEMENT_CONFLICT', 'RULES_VERSION_MISMATCH');
  end if;

  select * into v_prior from ruins_private.expedition_operation
   where entitlement_id = v_ent.id and operation_id = v_op;
  if found then
    if v_prior.request_hash <> v_hash then perform ruins_private.reject('OPERATION_ID_REUSE_MISMATCH', 'PAYLOAD_CHANGED'); end if;
    return v_prior.receipt || '{"duplicate":true}'::jsonb;
  end if;

  insert into ruins_private.expedition_instance
    (entitlement_id, revision, status, day_number, room, checkpoint, state, rules_version, content_pin)
  values (v_ent.id, 0, 'ACTIVE', 1, 1, 'day1-room1-entry', ruins_private.day1_initial_state(), v_ent.rules_version, v_ent.content_pin)
  on conflict on constraint expedition_instance_entitlement_key do nothing;
  v_created := found;

  select * into strict v_inst from ruins_private.expedition_instance where entitlement_id = v_ent.id for update;

  v_receipt := pg_catalog.jsonb_build_object(
    'operationId', v_op, 'revision', v_inst.revision, 'status', 'ACCEPTED',
    'events', case when v_created then '["expedition_bootstrapped"]'::jsonb else '["already_bootstrapped"]'::jsonb end,
    'publicState', ruins_private.public_projection(v_inst.state, v_inst.revision),
    'duplicate', false, 'serverRecordedAt', pg_catalog.now());

  insert into ruins_private.expedition_operation
    (entitlement_id, operation_id, command_type, expected_revision, request_hash, committed_revision, receipt)
  values (v_ent.id, v_op, 'BOOTSTRAP', (p_command->>'expectedRevision')::bigint, v_hash, v_inst.revision, v_receipt);

  return v_receipt;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Entry routine 2: read own sanitized state (never creates or mutates)
-- ---------------------------------------------------------------------------------------------
create function ruins_private.get_account_expedition(p_principal_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_inst ruins_private.expedition_instance%rowtype;
begin
  if p_principal_id is null then perform ruins_private.reject('AUTH_REQUIRED', 'PRINCIPAL'); end if;
  select i.* into v_inst
    from ruins_private.expedition_instance i
    join ruins_private.expedition_entitlement e on e.id = i.entitlement_id
   where e.principal_kind = 'ACCOUNT' and e.principal_id = p_principal_id
     and e.campaign_reward_scope = 'ruins-gate-c-015:five-day:v1';
  if not found then
    return pg_catalog.jsonb_build_object('contractVersion', 'ruins-expedition-001c.v1', 'expedition', null,
      'status', 'NOT_BOOTSTRAPPED', 'policyStatus', 'UNRESOLVED');
  end if;
  return pg_catalog.jsonb_build_object('contractVersion', 'ruins-expedition-001c.v1',
    'expedition', ruins_private.public_projection(v_inst.state, v_inst.revision));
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Entry routine 3: one atomic command transaction
-- verified identity -> entitlement lock -> instance lock -> receipt/fingerprint -> revision ->
-- authoritative rules -> stable claim source -> claim + inventory + checkpoint + settlement + receipt
-- (any failure raises and rolls back the whole statement) -> caller commits before success.
-- ---------------------------------------------------------------------------------------------
create function ruins_private.apply_account_expedition_command(p_principal_id uuid, p_command jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rules jsonb := ruins_private.day1_rules();
  v_ent ruins_private.expedition_entitlement%rowtype;
  v_inst ruins_private.expedition_instance%rowtype;
  v_prior ruins_private.expedition_operation%rowtype;
  v_op uuid;
  v_hash text;
  v_type text;
  v_result jsonb;
  v_state jsonb;
  v_events jsonb;
  v_rev bigint;
  v_claim_id uuid;
  v_receipt jsonb;
begin
  if p_principal_id is null then perform ruins_private.reject('AUTH_REQUIRED', 'PRINCIPAL'); end if;
  perform ruins_private.validate_command(p_command);
  v_type := p_command->>'type';
  if v_type = 'BOOTSTRAP' then perform ruins_private.reject('BAD_COMMAND', 'USE_BOOTSTRAP_ROUTINE'); end if;
  v_op := (p_command->>'operationId')::uuid;
  v_hash := ruins_private.request_hash(p_command);

  select * into v_ent from ruins_private.expedition_entitlement
   where principal_kind = 'ACCOUNT' and principal_id = p_principal_id and campaign_reward_scope = rules->>'scope'
   for update;
  if not found then perform ruins_private.reject('ENTITLEMENT_CONFLICT', 'NOT_BOOTSTRAPPED'); end if;

  select * into v_inst from ruins_private.expedition_instance where entitlement_id = v_ent.id for update;
  if not found then perform ruins_private.reject('ENTITLEMENT_CONFLICT', 'NOT_BOOTSTRAPPED'); end if;

  -- Receipt lookup BEFORE the revision check (lost-response replay returns the original receipt).
  select * into v_prior from ruins_private.expedition_operation
   where entitlement_id = v_ent.id and operation_id = v_op;
  if found then
    if v_prior.request_hash <> v_hash then perform ruins_private.reject('OPERATION_ID_REUSE_MISMATCH', 'PAYLOAD_CHANGED'); end if;
    return v_prior.receipt || '{"duplicate":true}'::jsonb;
  end if;

  if v_inst.rules_version <> rules->>'rulesVersion' or v_inst.content_pin <> rules->>'contentPin' then
    perform ruins_private.reject('ENTITLEMENT_CONFLICT', 'RULES_VERSION_MISMATCH');
  end if;
  if (p_command->>'expectedRevision')::bigint <> v_inst.revision then
    perform ruins_private.reject('REVISION_CONFLICT', 'STALE_REVISION');
  end if;

  v_result := ruins_private.day1_reduce(v_inst.state, v_type, p_command->'parameters');
  v_state := v_result->'state';
  v_events := v_result->'events';
  v_rev := v_inst.revision + 1;

  -- Stable server-resolved reward sources; claim key is (entitlement_id, reward_source_id).
  if v_events ? 'zombie_die' then
    insert into ruins_private.expedition_claim (entitlement_id, instance_id, reward_source_id, operation_id, payload, claimed_revision)
    values (v_ent.id, v_inst.id, rules->>'zombieSource', v_op,
            '{"kind":"STAGING_XP","xp":2,"fixture":"native-flare-l1-zombie"}'::jsonb, v_rev)
    returning id into v_claim_id;
    insert into ruins_private.expedition_inventory_event (entitlement_id, operation_id, claim_id, item_key, delta, effect, committed_revision)
    values (v_ent.id, v_op, v_claim_id, 'staging_xp', 2, 'STAGING_NONTRANSFERABLE_CREDIT', v_rev);
    v_state := pg_catalog.jsonb_set(v_state, '{claimed}', (v_state->'claimed') || pg_catalog.jsonb_build_object('source', rules->>'zombieSource', 'kind', 'STAGING_XP', 'award', 2));
  end if;
  if v_events ? 'chest_claimed' then
    insert into ruins_private.expedition_claim (entitlement_id, instance_id, reward_source_id, operation_id, payload, claimed_revision)
    values (v_ent.id, v_inst.id, rules->>'chestSource', v_op,
            '{"kind":"STAGING_GOLD","gold":30,"fixture":"loot/chest_level_1.txt"}'::jsonb, v_rev)
    returning id into v_claim_id;
    insert into ruins_private.expedition_inventory_event (entitlement_id, operation_id, claim_id, item_key, delta, effect, committed_revision)
    values (v_ent.id, v_op, v_claim_id, 'staging_gold', 30, 'STAGING_NONTRANSFERABLE_CREDIT', v_rev);
    v_state := pg_catalog.jsonb_set(v_state, '{claimed}', (v_state->'claimed') || pg_catalog.jsonb_build_object('source', rules->>'chestSource', 'kind', 'STAGING_GOLD', 'award', 30));
  end if;
  if v_events ? 'day1_settled' then
    insert into ruins_private.expedition_day_settlement (entitlement_id, day_number, status, checkpoint, operation_id, settled_revision)
    values (v_ent.id, 1, 'SETTLED', v_state->>'checkpoint', v_op, v_rev);
  end if;

  update ruins_private.expedition_instance
     set revision = v_rev, status = v_state->>'status', day_number = (v_state->>'day')::smallint,
         room = (v_state->>'room')::smallint, checkpoint = v_state->>'checkpoint', state = v_state,
         updated_at = pg_catalog.now()
   where id = v_inst.id;

  v_receipt := pg_catalog.jsonb_build_object(
    'operationId', v_op, 'revision', v_rev, 'status', 'ACCEPTED', 'events', v_events,
    'publicState', ruins_private.public_projection(v_state, v_rev),
    'duplicate', false, 'serverRecordedAt', pg_catalog.now());

  insert into ruins_private.expedition_operation
    (entitlement_id, operation_id, command_type, expected_revision, request_hash, committed_revision, receipt)
  values (v_ent.id, v_op, v_type, (p_command->>'expectedRevision')::bigint, v_hash, v_rev, v_receipt);

  return v_receipt;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Explicit privileges (after creation, so nothing inherits PUBLIC EXECUTE), still as ruins_owner
-- ---------------------------------------------------------------------------------------------

revoke all on all tables in schema ruins_private from public, anon, authenticated, service_role, ruins_backend;
revoke all on all sequences in schema ruins_private from public, anon, authenticated, service_role, ruins_backend;
revoke all on all functions in schema ruins_private from public, anon, authenticated, service_role, ruins_backend;

grant execute on function ruins_private.bootstrap_account_expedition(uuid, jsonb) to ruins_backend;
grant execute on function ruins_private.get_account_expedition(uuid) to ruins_backend;
grant execute on function ruins_private.apply_account_expedition_command(uuid, jsonb) to ruins_backend;

reset role;

-- ---------------------------------------------------------------------------------------------
-- Fail-closed self-check: abort the whole migration unless the privilege wall is exactly as designed.
-- ---------------------------------------------------------------------------------------------
do $verify$
declare
  r record;
  v_role text;
  v_entry text[] := array['ruins_private.bootstrap_account_expedition(uuid,jsonb)',
                          'ruins_private.get_account_expedition(uuid)',
                          'ruins_private.apply_account_expedition_command(uuid,jsonb)'];
begin
  foreach v_role in array array['anon','authenticated','service_role'] loop
    if pg_catalog.has_schema_privilege(v_role, 'ruins_private', 'USAGE')
       or pg_catalog.has_schema_privilege(v_role, 'ruins_private', 'CREATE') then
      raise exception 'RUINS_001C_VERIFY: % has schema access', v_role;
    end if;
  end loop;
  if pg_catalog.has_schema_privilege('ruins_backend', 'ruins_private', 'CREATE')
     or not pg_catalog.has_schema_privilege('ruins_backend', 'ruins_private', 'USAGE') then
    raise exception 'RUINS_001C_VERIFY: backend schema privileges';
  end if;
  for r in select c.oid, c.relname, c.relrowsecurity, c.relacl
             from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'ruins_private' and c.relkind in ('r','p','S','v','m') loop
    if r.relrowsecurity is not true and r.relname like 'expedition\_%' then
      raise exception 'RUINS_001C_VERIFY: RLS off on %', r.relname;
    end if;
    foreach v_role in array array['anon','authenticated','service_role','ruins_backend'] loop
      if pg_catalog.has_table_privilege(v_role, r.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then
        raise exception 'RUINS_001C_VERIFY: % has table privilege on %', v_role, r.relname;
      end if;
    end loop;
  end loop;
  if exists (select 1 from pg_catalog.pg_policy p join pg_catalog.pg_class c on c.oid = p.polrelid
              join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'ruins_private') then
    raise exception 'RUINS_001C_VERIFY: unexpected RLS policy';
  end if;
  for r in select p.oid, p.oid::regprocedure::text as sig, p.prosecdef, p.proconfig, p.proacl
             from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'ruins_private' loop
    if r.proconfig is null or not ('search_path=""' = any(r.proconfig)) then
      raise exception 'RUINS_001C_VERIFY: search_path not pinned on %', r.sig;
    end if;
    foreach v_role in array array['anon','authenticated','service_role'] loop
      if pg_catalog.has_function_privilege(v_role, r.oid, 'EXECUTE') then
        raise exception 'RUINS_001C_VERIFY: % can execute %', v_role, r.sig;
      end if;
    end loop;
    if pg_catalog.has_function_privilege('ruins_backend', r.oid, 'EXECUTE') <> (r.sig = any(v_entry)) then
      raise exception 'RUINS_001C_VERIFY: backend EXECUTE mismatch on %', r.sig;
    end if;
    -- SECURITY DEFINER on exactly the three entry routines; every helper runs as invoker.
    if r.prosecdef <> (r.sig = any(v_entry)) then
      raise exception 'RUINS_001C_VERIFY: SECURITY DEFINER set mismatch on %', r.sig;
    end if;
  end loop;
end
$verify$;

commit;
