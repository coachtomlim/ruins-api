-- FRIEND FEEDBACK 002B2 — robustly remove the legacy (challenge_id, deterministic_input_hash)
-- uniqueness. 002B and 002B1 are already APPLIED to staging; this is a new additive correction,
-- not a rewrite of either applied migration.
--
-- LIVE STAGING FAILURE: a genuine new attempt (new attempt_token, same build) still failed with
--   ERROR 23505: duplicate key value violates unique constraint
--   "builder_challenge_result_challenge_id_deterministic_input_h_key"
-- 002B's `drop constraint if exists builder_challenge_result_challenge_id_deterministic_input_hash_key`
-- was a guess at Postgres's auto-generated constraint name. PostgreSQL truncates generated
-- identifiers to 63 bytes; the real name on staging came out one character shorter
-- (`..._input_h_key`, not `..._input_hash_key`), so `drop constraint if exists <guessed name>`
-- silently matched nothing and the old uniqueness stayed active, continuing to block the exact
-- replay scenario 002B was supposed to unblock.
--
-- Fix: never hard-code the constraint/index name again. Find the real UNIQUE constraint (or,
-- defensively, a standalone unique index not backed by any constraint) on
-- public.builder_challenge_result whose constrained columns are EXACTLY
-- {challenge_id, deterministic_input_hash} — by catalog introspection, not by guessing a name —
-- and drop whichever one actually exists, however Postgres happened to name it. Idempotent: if
-- nothing matches (already dropped, e.g. by a successful run of this same migration), both
-- blocks below are no-ops.

do $$
declare
  v_conname text;
  v_idxname text;
begin
  -- Case 1: a real table CONSTRAINT (contype = 'u') on exactly these two columns, any name.
  select con.conname into v_conname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'builder_challenge_result'
    and con.contype = 'u'
    and (
      select array_agg(att.attname order by att.attname)
      from unnest(con.conkey) as k(attnum)
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k.attnum
    ) = array['challenge_id','deterministic_input_hash']::name[]
  limit 1;

  if v_conname is not null then
    execute format('alter table public.builder_challenge_result drop constraint %I', v_conname);
    raise notice 'FRIEND_FEEDBACK_002B2: dropped legacy unique constraint %', v_conname;
  else
    raise notice 'FRIEND_FEEDBACK_002B2: no (challenge_id, deterministic_input_hash) unique constraint found (already removed or never existed under this shape)';
  end if;

  -- Case 2 (defensive): a standalone unique INDEX on exactly these two columns that is not
  -- backed by any pg_constraint row at all (would not be caught by case 1). Explicitly excludes
  -- partial indexes (indpred is null) so the one-current-result partial unique index — which is
  -- only ever on (challenge_id) — can never be matched here even if its column set somehow
  -- changed shape in the future.
  select cls.relname into v_idxname
  from pg_index idx
  join pg_class cls on cls.oid = idx.indexrelid
  join pg_class tbl on tbl.oid = idx.indrelid
  join pg_namespace nsp on nsp.oid = tbl.relnamespace
  where nsp.nspname = 'public'
    and tbl.relname = 'builder_challenge_result'
    and idx.indisunique
    and not idx.indisprimary
    and idx.indpred is null
    and not exists (select 1 from pg_constraint c2 where c2.conindid = idx.indexrelid)
    and (
      select array_agg(att.attname order by att.attname)
      from unnest(idx.indkey::int[]) as k(attnum)
      join pg_attribute att on att.attrelid = idx.indrelid and att.attnum = k.attnum
      where k.attnum > 0
    ) = array['challenge_id','deterministic_input_hash']::name[]
  limit 1;

  if v_idxname is not null then
    execute format('drop index public.%I', v_idxname);
    raise notice 'FRIEND_FEEDBACK_002B2: dropped legacy standalone unique index %', v_idxname;
  end if;
end $$;

-- Post-migration invariant check: fail loudly (not silently) if the old uniqueness somehow
-- survives, or if either structure this migration must preserve is missing. Safe to run
-- repeatedly — all three conditions are pure catalog reads.
do $$
declare
  v_legacy_count integer;
  v_attempt_unique_count integer;
  v_one_current_count integer;
begin
  select count(*) into v_legacy_count
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public' and rel.relname = 'builder_challenge_result' and con.contype = 'u'
    and (
      select array_agg(att.attname order by att.attname)
      from unnest(con.conkey) as k(attnum)
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k.attnum
    ) = array['challenge_id','deterministic_input_hash']::name[];
  if v_legacy_count > 0 then
    raise exception 'FRIEND_FEEDBACK_002B2_ASSERTION_FAILED: legacy (challenge_id, deterministic_input_hash) uniqueness still present';
  end if;

  select count(*) into v_attempt_unique_count
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public' and rel.relname = 'builder_challenge_result' and con.contype = 'u'
    and (
      select array_agg(att.attname order by att.attname)
      from unnest(con.conkey) as k(attnum)
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k.attnum
    ) = array['attempt_token','challenge_id']::name[];
  if v_attempt_unique_count <> 1 then
    raise exception 'FRIEND_FEEDBACK_002B2_ASSERTION_FAILED: (challenge_id, attempt_token) uniqueness missing or duplicated';
  end if;

  select count(*) into v_one_current_count
  from pg_class cls
  join pg_namespace nsp on nsp.oid = cls.relnamespace
  where nsp.nspname = 'public' and cls.relname = 'builder_challenge_result_one_current_uidx';
  if v_one_current_count <> 1 then
    raise exception 'FRIEND_FEEDBACK_002B2_ASSERTION_FAILED: one-current-result partial unique index missing';
  end if;
end $$;

-- deterministic_input_hash itself (column + NOT NULL + format check + value generation inside
-- submit_builder_challenge_result_v2) is untouched by this migration — only its old table-level
-- uniqueness is removed. The hash keeps being computed and stored; it is simply no longer a
-- uniqueness key, which is exactly the fix 002B originally intended but mis-targeted by name.
