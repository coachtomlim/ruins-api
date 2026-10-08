-- FRIEND FEEDBACK 002E9A — live staging proof for Level 2 receipt authority (PM-run; NOT applied by Claude).
--
-- Run ONLY against: Dungeon Runner S8B Staging, project ref qpgwqmduqtqidmhbuclw (ap-southeast-1),
-- AFTER 20261003_friend_challenge_feedback_002e9a_level2_receipts.sql has been applied on top of
-- 002B / 002B1 / 002B2. Do NOT run against production, Gamma Mission Control, StoryForge or any other project.
--
-- Use a TEST player's NEW challenge published through the app (or `select * from create_builder_challenge_v2(60);`
-- as the authenticated test player). Replace <PUBLIC_TOKEN> and <CHALLENGE_ID>. A published challenge for
-- warrior-l1 with an account snapshot of hp=105 is assumed (as in the 002B1/002B2 proofs); if your snapshot hp
-- differs, change every `105` max_hp below to that value. Every row written is a test row on that test challenge.
--
-- Negative cases are wrapped so the editor prints a readable NOTICE instead of aborting the script.

-- 0) Migration landed: exactly one hero_gold CHECK, and it is 0..31.
select conname,pg_get_constraintdef(oid)
from pg_constraint
where conrelid='public.builder_challenge_result'::regclass and contype='c' and pg_get_constraintdef(oid) ~ 'hero_gold';
-- expect: 1 row, builder_challenge_result_hero_gold_range, definition mentions hero_gold >= 0 AND hero_gold <= 31.

-- A) Existing Level 1 receipt still succeeds (attempt A):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","skeleton","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',63,105,15,'l2proof-a-00000000000000');
-- expect: result_id, duplicate=false, is_current=true.

-- I) Idempotent retry of A (same token, same inputs):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-01',
  '{"enemyTypes":["goblin","skeleton","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',63,105,15,'l2proof-a-00000000000000');
-- expect: SAME result_id as A, duplicate=true.

-- B) Zombie receipt (attempt B; supersedes A):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
  '{"enemyTypes":["zombie","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',70,105,11,'l2proof-b-00000000000000');
-- expect: new result_id, duplicate=false, is_current=true.

-- C) Skeleton Archer receipt (attempt C; supersedes B):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
  '{"enemyTypes":["skeleton-archer","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',70,105,11,'l2proof-c-00000000000000');
-- expect: new result_id, duplicate=false, is_current=true.

-- Mixed Level 1 / Level 2, budget 90, Hero Gold 28 (attempt D; supersedes C):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
  '{"enemyTypes":["zombie","skeleton-archer","goblin"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',52,105,28,'l2proof-d-00000000000000');
-- expect: success.

-- D + E) Zombie + Zombie + Skeleton: legal budget 100, Hero Gold 31 (attempt E; supersedes D):
select * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
  '{"enemyTypes":["zombie","zombie","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',52,105,31,'l2proof-e-00000000000000');
-- expect: success (this needs BOTH the function ceiling and the table CHECK at 31).
select id,hero_gold,is_current,superseded_at from builder_challenge_result where id=(select result_id from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
  '{"enemyTypes":["zombie","zombie","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,
  's8a-1','cleared',52,105,31,'l2proof-e-00000000000000'));
-- expect: hero_gold=31, is_current=true (this call is also an idempotent retry of E: duplicate, no new row).

-- F) 32+ Hero Gold is rejected (all three must print "REJECTED ... RESULT_HERO_GOLD_INVALID"):
do $$ begin
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
    '{"enemyTypes":["zombie","zombie","skeleton"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',52,105,32,'l2proof-f1-0000000000000');
  raise notice 'UNEXPECTED ACCEPT: 32 gold on ZZS';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
    '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',52,105,31,'l2proof-f2-0000000000000');
  raise notice 'UNEXPECTED ACCEPT: 31 gold claimed on a goblin-only encounter';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;
do $$ begin
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-07',
    '{"enemyTypes":["zombie","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',52,105,12,'l2proof-f3-0000000000000');
  raise notice 'UNEXPECTED ACCEPT: 12 gold on a single zombie';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;

-- G) Unknown monster ids are rejected (RESULT_ENCOUNTER_INVALID each time):
do $$ declare bad text; begin
  foreach bad in array array['dragon','Zombie','skeleton_archer','zombie-archer',''] loop
    begin
      perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-01',
        jsonb_build_object('enemyTypes',jsonb_build_array(bad),'trapTypes','[]'::jsonb,'supportTypes','[]'::jsonb),
        's8a-1','cleared',52,105,0,'l2proof-g-'||md5(bad)||'x');
      raise notice 'UNEXPECTED ACCEPT: %',bad;
    exception when others then raise notice 'REJECTED % (expected): %',bad,sqlerrm; end;
  end loop;
end $$;

-- Over-budget Level 2 encounter is still rejected:
do $$ begin
  perform * from submit_builder_challenge_result_v2('<PUBLIC_TOKEN>','iron-labyrinth-01',
    '{"enemyTypes":["zombie","zombie","zombie"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',52,105,33,'l2proof-h-00000000000000');
  raise notice 'UNEXPECTED ACCEPT: 3 zombies';
exception when others then raise notice 'REJECTED (expected): %',sqlerrm; end $$;

-- H) Replay supersession: A..E in order. Only E is current; A..D have superseded_at set.
select attempt_token,hero_gold,is_current,superseded_at
from builder_challenge_result where challenge_id='<CHALLENGE_ID>' order by completed_at;
-- expect: 5 rows (l2proof-a..e); only l2proof-e has is_current=true; the other four have superseded_at NOT NULL.
-- (No row exists for any rejected attempt above.)

-- I/J) One-current-result invariant and public/current semantics unchanged:
select count(*) from builder_challenge_result where challenge_id='<CHALLENGE_ID>' and is_current;
-- expect: 1.
select * from get_builder_challenge_results_v2(10);
-- expect: exactly one row for this challenge (attempt E, hero_gold=31).
select * from get_builder_challenge_result_history('<CHALLENGE_ID>',20);
-- expect: 5 rows, only attempt E is_current=true.

-- Legacy v1 wrapper unaffected (use a challenge with runner_snapshot null, template max_hp):
-- select * from submit_builder_challenge_result('<LEGACY_PUBLIC_TOKEN>','iron-labyrinth-01',
--   '{"enemyTypes":["goblin","none","none"],"trapTypes":[],"supportTypes":[]}'::jsonb,'s8a-1','cleared',60,100,6);
-- expect: succeeds, max_hp=100.

-- Economy untouched by any of the above:
select count(*) from wallet_ledger where created_at > now() - interval '1 hour';
select count(*) from runner_xp_event where created_at > now() - interval '1 hour';
select count(*) from runner_item_ownership where created_at > now() - interval '1 hour';
-- expect: zero rows attributable to the submissions above.
