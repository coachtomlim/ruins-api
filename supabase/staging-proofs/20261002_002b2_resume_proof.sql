-- FRIEND FEEDBACK 002B2 — resumed live staging proof (PM-run, not applied by Claude).
--
-- Context: PM already completed, on the SAME staging challenge used for the 002B1 proof:
--   A. publish NEW challenge                                — PASSED
--   B. verify snapshot (hp=105, atk=12, def=1, 7 slots, no ownership UUID, public RPC works) — PASSED
--   (attempt-aware submission attempt)                       — FAILED with ERROR 23505 on the
--     legacy (challenge_id, deterministic_input_hash) constraint, which is exactly what
--     20261002_friend_challenge_feedback_002b2.sql fixes.
--
-- Run this AFTER applying 20261002_friend_challenge_feedback_002b2.sql. Reuse the SAME
-- <PUBLIC_TOKEN> / <CHALLENGE_ID> from the 002B1 proof run — there is no need to publish a new
-- challenge; the snapshot captured in step B is still valid and unchanged (immutability already
-- holds from the 002B1 proof).
--
-- First, confirm the fix actually landed before resuming the scenario:
select conname
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
where rel.relname = 'builder_challenge_result' and con.contype = 'u'
  and (
    select array_agg(att.attname order by att.attname)
    from unnest(con.conkey) as k(attnum)
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k.attnum
  ) = array['challenge_id','deterministic_input_hash']::name[];
-- expect: 0 rows (the legacy constraint, whatever it was actually named, is gone).

select conname
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
where rel.relname = 'builder_challenge_result' and con.contype = 'u'
  and (
    select array_agg(att.attname order by att.attname)
    from unnest(con.conkey) as k(attnum)
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k.attnum
  ) = array['attempt_token','challenge_id']::name[];
-- expect: exactly 1 row (the attempt-token uniqueness is untouched).

-- C) Attempt A succeeds (first real attempt on this challenge, snapshot-authoritative max_hp):
select * from submit_builder_challenge_result_v2(
  '<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',63,105,6,'attempt-a-0000000000000000000'
);
-- expect: result_id returned, duplicate=false, is_current=true. No ERROR 23505, no ERROR 42702.

-- D) Retry attempt A (same public_token, same attempt token, same inputs):
select * from submit_builder_challenge_result_v2(
  '<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',63,105,6,'attempt-a-0000000000000000000'
);
-- expect: SAME result_id as C, duplicate=true.

-- E) Attempt B: SAME room/build as A, NEW attempt token — this is the exact scenario that
--    previously failed with ERROR 23505:
select * from submit_builder_challenge_result_v2(
  '<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',70,105,6,'attempt-b-0000000000000000000'
);
select id,attempt_token,is_current,superseded_at from builder_challenge_result where challenge_id='<CHALLENGE_ID>' order by completed_at;
-- expect: a NEW result_id, duplicate=false; attempt A is_current=false with superseded_at set;
--         attempt B is_current=true; exactly one is_current=true row total.

-- F) Attempt C: CHANGED build, NEW attempt token:
select * from submit_builder_challenge_result_v2(
  '<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","skeleton","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',63,105,9,'attempt-c-0000000000000000000'
);
select id,attempt_token,is_current,superseded_at from builder_challenge_result where challenge_id='<CHALLENGE_ID>' order by completed_at;
-- expect: attempt B now is_current=false/superseded_at set; attempt C is_current=true.

-- G) Exactly one current row across A/B/C:
select count(*) from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current;
-- expect: 1.

-- H) Current-only RPC returns C:
select * from get_builder_challenge_results_v2(10);
-- expect: exactly one row for this challenge, matching attempt C's values.

-- I) History returns A/B/C:
select * from get_builder_challenge_result_history('<CHALLENGE_ID>',20);
-- expect: 3 rows; only C has is_current=true.

-- J) Unread/read:
select owner_seen_at from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current;
-- expect: null (unread).
select * from mark_builder_challenge_result_read((select id from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current));
select owner_seen_at from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current;
-- expect: now set (read).

-- K) New attempt after read becomes unread again:
select * from submit_builder_challenge_result_v2(
  '<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',63,105,6,'attempt-d-0000000000000000000'
);
select owner_seen_at,is_current from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current;
-- expect: owner_seen_at null again on attempt D's row.

-- L) Legacy v1 still works (template max HP, no attempt token, a separate legacy-style
--    challenge or one with runner_snapshot null):
select * from submit_builder_challenge_result(
  '<LEGACY_PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',60,100,6
);
-- expect: succeeds with max_hp=100, unaffected by any of the above.

-- M) Economy unchanged:
select count(*) from wallet_ledger where created_at > now() - interval '1 hour';
select count(*) from runner_xp_event where created_at > now() - interval '1 hour';
select count(*) from runner_item_ownership where created_at > now() - interval '1 hour';
-- expect: zero rows attributable to any submission above.
