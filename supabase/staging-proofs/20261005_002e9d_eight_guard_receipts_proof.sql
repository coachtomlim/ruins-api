-- FRIEND FEEDBACK 002E9D — staging proof for eight-guard result receipts (PM-run; NOT applied by Claude).
--
-- Run ONLY against: Dungeon Runner S8B Staging, project ref qpgwqmduqtqidmhbuclw (ap-southeast-1), AFTER
-- 20261005_friend_challenge_feedback_002e9d_eight_guard_receipts.sql has been applied on top of
-- 002B / 002B1 / 002B2 / 002E9A / 002E9C. Never production, Gamma Mission Control, StoryForge or any other project.
--
-- Use a TEST player's NEW challenge (zero result rows) published through the app, target 60, warrior-l1.
-- Replace <PUBLIC_TOKEN> and <CHALLENGE_ID>. If the snapshot hp is not 100, change every max_hp `100` below.
-- Delete the synthetic rows afterwards. Negative cases are wrapped so the editor prints a readable NOTICE.

-- A) Four ordinary guards (budget 80, Hero Gold 24) — previously RESULT_ENCOUNTER_INVALID:
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
  '{"enemyTypes":["goblin","goblin","goblin","goblin"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',60,100,24,'l2d-proof-a-0000000000');
-- expect: success, duplicate=false, is_current=true.

-- B) Five ordinary guards (5 x Goblin = budget 100, Hero Gold 30; supersedes A):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
  '{"enemyTypes":["goblin","goblin","goblin","goblin","goblin"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',50,100,30,'l2d-proof-b-0000000000');
select attempt_token,hero_gold,encounter->'enemyTypes' as enemies,is_current from builder_challenge_result
where challenge_id='<CHALLENGE_ID>' and attempt_token='l2d-proof-b-0000000000';
-- expect: hero_gold=30, all five goblins preserved, is_current=true.

-- C) Mixed Level 2 quantity build: Goblin x2, Skeleton x2 (budget 100, Gold 30; supersedes B):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-03',
  '{"enemyTypes":["goblin","goblin","skeleton","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',45,100,30,'l2d-proof-c-0000000000');

-- D) The governed Level 1 BRUTAL still works (supersedes C):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
  '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,39,'l2d-proof-d-0000000000');

-- E) Idempotent retry of D: SAME result_id, duplicate=true:
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
  '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,39,'l2d-proof-d-0000000000');

-- F) Rejections — every block must print REJECTED (expected) with the error shown, never UNEXPECTED ACCEPT:
do $$ begin  -- six goblins (budget 120): RESULT_ENCOUNTER_BUDGET_EXCEEDED
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
    '{"enemyTypes":["goblin","goblin","goblin","goblin","goblin","goblin"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,36,'l2d-proof-f1-000000000');
  raise notice 'UNEXPECTED ACCEPT: six goblins';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- eight goblins (budget 160): RESULT_ENCOUNTER_BUDGET_EXCEEDED
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
    '{"enemyTypes":["goblin","goblin","goblin","goblin","goblin","goblin","goblin","goblin"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,48,'l2d-proof-f2-000000000');
  raise notice 'UNEXPECTED ACCEPT: eight goblins';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- nine entries: RESULT_ENCOUNTER_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
    '{"enemyTypes":["goblin","goblin","goblin","goblin","goblin","goblin","goblin","goblin","goblin"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,0,'l2d-proof-f3-000000000');
  raise notice 'UNEXPECTED ACCEPT: nine entries';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- the Brutal mix in another room (budget 130): RESULT_ENCOUNTER_BUDGET_EXCEEDED
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-03',
    '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,39,'l2d-proof-f4-000000000');
  raise notice 'UNEXPECTED ACCEPT: Brutal mix outside Scattered Hall';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- governed mix + trap: RESULT_ENCOUNTER_BUDGET_EXCEEDED
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
    '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton"],"trapTypes":["spike-trap"],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,39,'l2d-proof-f5-000000000');
  raise notice 'UNEXPECTED ACCEPT: governed mix + trap';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- unknown id among four guards: RESULT_ENCOUNTER_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
    '{"enemyTypes":["goblin","goblin","goblin","dragon"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,0,'l2d-proof-f6-000000000');
  raise notice 'UNEXPECTED ACCEPT: dragon';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- four goblins claiming more Gold than they can derive (25 > 24): RESULT_HERO_GOLD_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
    '{"enemyTypes":["goblin","goblin","goblin","goblin"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,25,'l2d-proof-f7-000000000');
  raise notice 'UNEXPECTED ACCEPT: 25 gold on four goblins';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- ordinary Zombie+Zombie+Skeleton claiming 32: RESULT_HERO_GOLD_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
    '{"enemyTypes":["zombie","zombie","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,32,'l2d-proof-f8-000000000');
  raise notice 'UNEXPECTED ACCEPT: 32 gold ordinary';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- governed Brutal claiming 40: RESULT_HERO_GOLD_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
    '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,40,'l2d-proof-f9-000000000');
  raise notice 'UNEXPECTED ACCEPT: 40 gold';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;

-- G) Replay supersession and the one-current-result invariant:
select attempt_token,hero_gold,is_current,superseded_at from builder_challenge_result where challenge_id='<CHALLENGE_ID>' order by completed_at;
-- expect: 4 rows (a,b,c,d); only d is_current=true; a,b,c have superseded_at NOT NULL; no row for any rejected attempt.
select count(*) from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current;
-- expect: 1.
select * from get_builder_challenge_results_v2(10);
-- expect: exactly one row for this challenge (attempt d, hero_gold=39).

-- H) Economy untouched:
select count(*) from wallet_ledger where created_at > now() - interval '1 hour';
select count(*) from runner_xp_event where created_at > now() - interval '1 hour';
select count(*) from runner_item_ownership where created_at > now() - interval '1 hour';
-- expect: zero rows attributable to the submissions above.
