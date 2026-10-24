\set ON_ERROR_STOP on
INSERT INTO auth.users(id,email,encrypted_password,raw_app_meta_data) VALUES
 ('10000000-0000-0000-0000-000000000001','alice@example.invalid','FAKE_PASSWORD_HASH_A','{"fixture":true}'),
 ('10000000-0000-0000-0000-000000000002','bob@example.invalid','FAKE_PASSWORD_HASH_B','{"fixture":true}');
INSERT INTO auth.identities VALUES('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','email','{"fake":true}');
INSERT INTO auth.sessions VALUES('21000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',now());
INSERT INTO auth.schema_migrations VALUES('fake-auth-v1');
INSERT INTO storage.buckets VALUES('synthetic','synthetic',false);
INSERT INTO storage.objects VALUES('30000000-0000-0000-0000-000000000001','synthetic','FAKE_ONLY.txt','10000000-0000-0000-0000-000000000001','{"size":7}');
INSERT INTO storage.migrations VALUES(1,'fake-storage-v1');
INSERT INTO public.profiles(id,display_name) VALUES('10000000-0000-0000-0000-000000000001','Alice Fake'),('10000000-0000-0000-0000-000000000002','Bob Fake');
INSERT INTO public.friendships(user_id,friend_id,status) VALUES('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','accepted');
INSERT INTO public.daily_trials(trial_date,seed,reward_xp) VALUES('2026-10-24',424242,25);
INSERT INTO public.trial_attempts(trial_id,user_id,completion) VALUES(1,'10000000-0000-0000-0000-000000000001',60);
INSERT INTO public.reward_ledger(attempt_id,xp) VALUES(1,25);
DO $$DECLARE n text;BEGIN FOREACH n IN ARRAY ARRAY['games','class_sessions','rooms','role_seats','network_tests','role_sessions','events','deliveries','control_state','branch_state','turn_states','control_snapshots'] LOOP EXECUTE format('INSERT INTO sl_sim.%I(owner_id,payload) VALUES($1,$2)',n) USING '10000000-0000-0000-0000-000000000001'::uuid,jsonb_build_object('fixture',n);END LOOP;END$$;
INSERT INTO sl_sim_basic1_hosted_poc.sessions(owner_id) VALUES('10000000-0000-0000-0000-000000000001');
INSERT INTO sl_sim_basic1_hosted_poc.teams(session_id,name) VALUES(1,'Synthetic team');
INSERT INTO sl_sim_basic1_hosted_poc.turns(team_id,turn_no,cash) VALUES(1,1,100000.00);
INSERT INTO sl_sim_basic1_postpilot.sessions(owner_id) VALUES('10000000-0000-0000-0000-000000000001');
INSERT INTO sl_sim_basic1_postpilot.teams(session_id) VALUES(1);
INSERT INTO sl_sim_basic1_postpilot.turns(team_id,turn_no,cash) VALUES(1,1,90000.00);
INSERT INTO sl_sim_basic1_postpilot.events(session_id,payload) VALUES(1,'{"kind":"FAKE_ONLY"}');
INSERT INTO supabase_migrations.schema_migrations VALUES('20261023000000',ARRAY['select 1'],'fake baseline'),('20261024000000',ARRAY['select 2'],'fake pre-r2 fixture');
