-- FRIEND FEEDBACK 002E9C — staging proof for governed Level 1 BRUTAL receipt authority (PM-run; NOT applied by Claude).
--
-- Run ONLY against: Dungeon Runner S8B Staging, project ref qpgwqmduqtqidmhbuclw (ap-southeast-1),
-- AFTER 20261004_friend_challenge_feedback_002e9c_governed_brutal_receipts.sql has been applied on top of
-- 002B / 002B1 / 002B2 / 002E9A. Never production, Gamma Mission Control, StoryForge or any other project.
--
-- Use a TEST player's NEW challenge (zero result rows) published through the app, target 60, warrior-l1.
-- Replace <PUBLIC_TOKEN> and <CHALLENGE_ID>. If the snapshot hp is not 100, change every max_hp `100` below.
-- Delete the synthetic test rows afterwards (the PM did this for the 002E9A proof).
-- Negative cases are wrapped so the editor prints a readable NOTICE instead of aborting.

-- 0) Migration landed: exactly one hero_gold CHECK, now 0..39.
select conname,pg_get_constraintdef(oid) from pg_constraint
where conrelid='public.builder_challenge_result'::regclass and contype='c' and pg_get_constraintdef(oid) ~ 'hero_gold';
-- expect: 1 row builder_challenge_result_hero_gold_range, hero_gold >= 0 AND hero_gold <= 39.

-- A) Ordinary Level 1 receipts still succeed (attempt A, then idempotent retry of A):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-03',
  '{"enemyTypes":["skeleton","goblin","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',56,100,24,'l2c-proof-a-0000000000');
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-03',
  '{"enemyTypes":["skeleton","goblin","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',56,100,24,'l2c-proof-a-0000000000');
-- expect: first: duplicate=false,is_current=true. second: SAME result_id, duplicate=true.

-- B) EASY (two monsters) succeeds (attempt B; supersedes A):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["skeleton","goblin"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',74,100,15,'l2c-proof-b-0000000000');

-- C) THE GOVERNED BRUTAL: five monsters, budget 130, Hero Gold 39 (attempt C; supersedes B):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
  '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,39,'l2c-proof-c-0000000000');
-- expect: success. Then:
select attempt_token,hero_gold,is_current,encounter->'enemyTypes' as enemies
from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and attempt_token='l2c-proof-c-0000000000';
-- expect: hero_gold=39, is_current=true, enemies = ["goblin","goblin","skeleton","skeleton","skeleton"] (all five preserved).

-- D) Idempotent retry of the governed receipt: SAME result_id, duplicate=true, still exactly one current row.
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
  '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,39,'l2c-proof-c-0000000000');

-- E) Rejections — every block must print REJECTED (expected) with the shown error, never UNEXPECTED ACCEPT:
do $$ begin  -- 40 Hero Gold on the governed preset: RESULT_HERO_GOLD_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
    '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,40,'l2c-proof-e1-000000000');
  raise notice 'UNEXPECTED ACCEPT: 40 gold';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- same five monsters in a DIFFERENT room: RESULT_ENCOUNTER_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-03',
    '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,39,'l2c-proof-e2-000000000');
  raise notice 'UNEXPECTED ACCEPT: governed mix outside Scattered Hall';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- governed mix plus a trap: RESULT_ENCOUNTER_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
    '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton"],"trapTypes":["spike-trap"],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,39,'l2c-proof-e3-000000000');
  raise notice 'UNEXPECTED ACCEPT: governed mix + trap';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- governed mix plus a support: RESULT_ENCOUNTER_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
    '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton"],"trapTypes":[],"supportTypes":["small-potion"]}'::jsonb,'s8a-1','cleared',30,100,39,'l2c-proof-e4-000000000');
  raise notice 'UNEXPECTED ACCEPT: governed mix + support';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- a different five-monster mix in room 08 (not the governed composition): RESULT_ENCOUNTER_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
    '{"enemyTypes":["skeleton","skeleton","skeleton","skeleton","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,45,'l2c-proof-e5-000000000');
  raise notice 'UNEXPECTED ACCEPT: five skeletons';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- governed mix in a different ORDER: RESULT_ENCOUNTER_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
    '{"enemyTypes":["skeleton","skeleton","skeleton","goblin","goblin"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,39,'l2c-proof-e6-000000000');
  raise notice 'UNEXPECTED ACCEPT: reordered governed mix';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- six monsters: RESULT_ENCOUNTER_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
    '{"enemyTypes":["goblin","goblin","skeleton","skeleton","skeleton","goblin"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,45,'l2c-proof-e7-000000000');
  raise notice 'UNEXPECTED ACCEPT: six monsters';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- an ordinary over-budget three-monster build: RESULT_ENCOUNTER_BUDGET_EXCEEDED
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-03',
    '{"enemyTypes":["antlion","antlion","zombie"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,0,'l2c-proof-e8-000000000');
  raise notice 'UNEXPECTED ACCEPT: 135 budget';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- ordinary encounter claiming 32 Gold (ceiling stays 31): RESULT_HERO_GOLD_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-03',
    '{"enemyTypes":["zombie","zombie","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,32,'l2c-proof-e9-000000000');
  raise notice 'UNEXPECTED ACCEPT: 32 gold on an ordinary encounter';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- Level 1 BRUTAL claiming more than it can derive (38 is fine, 39 is the max; check 39 on EASY):
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-01',
    '{"enemyTypes":["skeleton","goblin"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',74,100,39,'l2c-proof-ea-000000000');
  raise notice 'UNEXPECTED ACCEPT: 39 gold claimed on EASY';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin  -- unknown id: RESULT_ENCOUNTER_INVALID
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-08',
    '{"enemyTypes":["dragon"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',30,100,0,'l2c-proof-eb-000000000');
  raise notice 'UNEXPECTED ACCEPT: dragon';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;

-- F) Replay supersession and the one-current-result invariant:
select attempt_token,hero_gold,is_current,superseded_at from builder_challenge_result
where challenge_id='<CHALLENGE_ID>' order by completed_at;
-- expect: 3 rows (a,b,c); only c is_current=true; a and b have superseded_at NOT NULL; no row for any rejected attempt.
select count(*) from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current;
-- expect: 1.
select * from get_builder_challenge_results_v2(10);
-- expect: exactly one row for this challenge (attempt c, hero_gold=39).
select * from get_builder_challenge_result_history('<CHALLENGE_ID>',20);
-- expect: 3 rows, only attempt c is_current=true.

-- G) The 002E9A receipts still work (Zombie / Skeleton Archer, 31 Gold on Zombie+Zombie+Skeleton):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
  '{"enemyTypes":["zombie","zombie","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',52,100,31,'l2c-proof-g-0000000000');
-- expect: success (ordinary ceiling stays 31 and budget 100).

-- Economy untouched:
select count(*) from wallet_ledger where created_at > now() - interval '1 hour';
select count(*) from runner_xp_event where created_at > now() - interval '1 hour';
select count(*) from runner_item_ownership where created_at > now() - interval '1 hour';
-- expect: zero rows attributable to the submissions above.
