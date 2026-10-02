-- FRIEND FEEDBACK 002B1 — live staging proof script (PM-run, not applied by Claude).
--
-- Run against: Dungeon Runner S8B Staging (project ref qpgwqmduqtqidmhbuclw), AFTER
-- 20261001_friend_challenge_feedback_002b1.sql has been applied on top of the already-applied
-- 20260930_friend_challenge_feedback_002b.sql.
--
-- Run as the authenticated test player who owns the challenge you publish (via the SQL editor
-- with an impersonated/authenticated session, or via the app itself for steps 1-2 and psql/SQL
-- editor with elevated/admin access for the read-only inspection steps). Each numbered block corresponds to
-- one item in the FRIEND FEEDBACK 002B1 task's Part F list. Replace <PUBLIC_TOKEN>,
-- <CHALLENGE_ID>, <ATTEMPT_A>, <ATTEMPT_B>, <ATTEMPT_C> with real values as you go.
--
-- IMPORTANT: this script is evidence for a human to run and read the output of. It is not
-- executed as part of any automated test here — there is no live Postgres connection available
-- in this environment. Treat every "expect:" line as the thing to visually confirm.

-- 1) Publish a NEW challenge (do this through the app's PUBLISH FRIEND CHALLENGE action, or via
--    `select * from create_builder_challenge_v2(60);` as the authenticated player). Record:
--      challenge_id, public_token
-- expect: duplicate=false (first publish of this exact target_hp for this player/runner tier)

-- 2) Confirm runner_snapshot captured HP/ATK/DEF/all 7 equipment slots, no ownership UUID:
select runner_snapshot
from builder_challenge
where id = '<CHALLENGE_ID>';
-- expect: runner_snapshot->'runner'->'stats' has hp/attack/defense as plain integers;
--         runner_snapshot->'equipment' has exactly 7 elements, one per slot
--         (weapon/shield/head/chest/hands/legs/feet), each WITHOUT an "ownership_id" key.

-- 3) Public anon snapshot RPC returns only the three safe fields:
select * from get_builder_challenge_public_snapshot('<PUBLIC_TOKEN>');
-- expect: exactly sender_name, target_hp, runner_snapshot columns — no owner_player_id,
--         owner_runner_id, or challenge id in the result shape at all.

-- 4) Unknown token returns zero rows, not an error:
select * from get_builder_challenge_public_snapshot('not-a-real-token-but-32-chars-long-xx');
-- expect: 0 rows, no exception raised.

-- 5) Attempt A: submit using the snapshot's own HP as max_hp (e.g. 105, not 100), with a fresh
--    attempt token:
select * from submit_builder_challenge_result_v2(
  '<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',63,105,6,'attempt-a-0000000000000000000'
);
-- expect: result_id returned, duplicate=false, is_current=true.
-- Before 002B1 this call would have raised RESULT_MAX_HP_INVALID (expected 100, got 105) or
-- hit ERROR 42702 on the supersede path for a second attempt — confirm neither happens.

-- 6) Retry attempt A (same public_token, same attempt token, same inputs):
select * from submit_builder_challenge_result_v2(
  '<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',63,105,6,'attempt-a-0000000000000000000'
);
select count(*) from builder_challenge_result where challenge_id='<CHALLENGE_ID>';
-- expect: same result_id as step 5, duplicate=true; row count unchanged from after step 5.

-- 7) Attempt B: SAME room/build, NEW attempt token:
select * from submit_builder_challenge_result_v2(
  '<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',70,105,6,'attempt-b-0000000000000000000'
);
select id,attempt_token,is_current,superseded_at from builder_challenge_result where challenge_id='<CHALLENGE_ID>' order by completed_at;
-- expect: a NEW result_id, duplicate=false; attempt A's row now is_current=false with a
--         non-null superseded_at; attempt B's row is_current=true; exactly one row with
--         is_current=true in the full list.

-- 8) Attempt C: CHANGED build, NEW attempt token — same supersession behavior:
select * from submit_builder_challenge_result_v2(
  '<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","skeleton","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',63,105,9,'attempt-c-0000000000000000000'
);
select id,attempt_token,is_current,superseded_at from builder_challenge_result where challenge_id='<CHALLENGE_ID>' order by completed_at;
-- expect: attempt B now is_current=false/superseded_at set; attempt C is_current=true;
--         still exactly one is_current=true row across all three attempts.

-- 9) get_builder_challenge_results_v2 returns only the latest/current result:
select * from get_builder_challenge_results_v2(10);
-- expect: exactly one row for this challenge (attempt C's), not three.

-- 10) history RPC returns all three, only the latest marked current:
select * from get_builder_challenge_result_history('<CHALLENGE_ID>',20);
-- expect: 3 rows (A, B, C); only C has is_current=true; A and B have superseded_at set.

-- 11) Unread: the new current result's owner_seen_at is null:
select owner_seen_at from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current;
-- expect: null.

-- 12) Mark read: current result becomes seen:
select * from mark_builder_challenge_result_read((select id from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current));
select owner_seen_at from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current;
-- expect: owner_seen_at now set (non-null).

-- 13) New attempt after read starts unread again:
select * from submit_builder_challenge_result_v2(
  '<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',63,105,6,'attempt-d-0000000000000000000'
);
select owner_seen_at,is_current from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current;
-- expect: owner_seen_at is null again on the new current (attempt D) row.

-- 14) Legacy v1 submission still works using template max HP, no attempt token required. Publish
--     a SEPARATE legacy-style challenge first (or reuse one with runner_snapshot null), then:
select * from submit_builder_challenge_result(
  '<LEGACY_PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',60,100,6
);
-- expect: succeeds with max_hp=100 (template), NOT 105 — confirms legacy clients are unaffected
--         by the snapshot-authority change.

-- 15) Snapshot immutability — run inside a transaction you roll back:
begin;
  update player_runner set display_name='Changed Name' where id = (
    select owner_runner_id from builder_challenge where id='<CHALLENGE_ID>'
  );
  -- also change an equipped item / stat here if convenient for a fuller proof
  select runner_snapshot->'runner'->>'display_name' from builder_challenge where id='<CHALLENGE_ID>';
  -- expect: STILL the original captured name, not 'Changed Name' — the snapshot never re-reads
  -- live account state.
rollback;

-- 16) Economy boundary — confirm no wallet/XP/ownership side effects from any of the above:
select count(*) from wallet_ledger where created_at > now() - interval '1 hour';
select count(*) from runner_xp_event where created_at > now() - interval '1 hour';
select count(*) from runner_item_ownership where created_at > now() - interval '1 hour';
-- expect: zero rows attributable to the submissions above (Friend Feedback result receipts never
-- write to these tables — confirm no unrelated activity in the same window is muddying the count).
