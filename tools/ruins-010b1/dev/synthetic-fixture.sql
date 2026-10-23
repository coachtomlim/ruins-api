\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator login;
create role app_operator nologin;
grant anon, authenticated, service_role to authenticator;

create schema auth authorization postgres;
create schema storage authorization postgres;
create schema supabase_migrations authorization postgres;
create schema sl_sim authorization postgres;

create type public.friend_status as enum ('pending','accepted','blocked');
create table public.profiles(id uuid primary key, display_name text not null, created_at timestamptz not null default now());
create table public.friendships(id bigint generated always as identity primary key, user_id uuid not null references public.profiles(id), friend_id uuid not null references public.profiles(id), status public.friend_status not null, unique(user_id,friend_id));
create table public.daily_trials(id bigint generated always as identity primary key, trial_date date not null unique, seed bigint not null, reward_xp integer not null check(reward_xp>=0));
create view public.accepted_friendships as select user_id,friend_id from public.friendships where status='accepted';
create function public.friend_count(p_user uuid) returns bigint language sql stable security invoker as $$select count(*) from public.friendships where user_id=p_user and status='accepted'$$;
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.daily_trials enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(true);
create policy friendships_read on public.friendships for select to authenticated using(true);
create policy daily_trials_read on public.daily_trials for select to anon,authenticated using(true);
grant usage on schema public to anon,authenticated,service_role;
grant select on public.profiles,public.friendships,public.daily_trials,public.accepted_friendships to authenticated;
grant select on public.daily_trials to anon;
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to authenticated,service_role;
alter default privileges in schema public grant select on tables to authenticated;

create table auth.users(id uuid primary key,email text unique,encrypted_password text,created_at timestamptz not null default now());
create table auth.identities(id uuid primary key,user_id uuid not null references auth.users(id),provider text not null,identity_data jsonb not null default '{}'::jsonb);
create table auth.schema_migrations(version text primary key);
create table storage.buckets(id text primary key,name text not null unique,public boolean not null default false);
create table storage.objects(id uuid primary key,bucket_id text references storage.buckets(id),name text not null,owner_id uuid,metadata jsonb);
create table storage.migrations(id integer primary key,name text);
create table supabase_migrations.schema_migrations(version text primary key,statements text[],name text);

do $$declare n text;begin foreach n in array array['games','class_sessions','rooms','role_seats','network_tests','role_sessions','events','deliveries','control_state','branch_state','turn_states','control_snapshots'] loop
  execute format('create table sl_sim.%I(id bigint generated always as identity primary key, owner_id uuid not null, payload jsonb not null default ''{}''::jsonb, created_at timestamptz not null default now())',n);
  execute format('alter table sl_sim.%I enable row level security',n);
  execute format('alter table sl_sim.%I force row level security',n);
  execute format('create policy %I on sl_sim.%I for select to authenticated using (true)','read_'||n,n);
  execute format('grant select on sl_sim.%I to authenticated',n);
  execute format('grant all on sl_sim.%I to service_role',n);
end loop;end$$;
grant usage on schema sl_sim to authenticated,service_role;
grant usage,select on all sequences in schema sl_sim to authenticated,service_role;

insert into public.profiles values
 ('00000000-0000-0000-0000-000000000001','Synthetic One',now()),
 ('00000000-0000-0000-0000-000000000002','Synthetic Two',now());
insert into public.friendships(user_id,friend_id,status) values('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','accepted');
insert into public.daily_trials(trial_date,seed,reward_xp) values(current_date,424242,25);
insert into auth.users values('10000000-0000-0000-0000-000000000001','synthetic@example.invalid','$2a$synthetic-only',now());
insert into auth.identities values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','email','{"synthetic":true}');
insert into auth.schema_migrations values('synthetic-auth-1');
insert into storage.buckets values('synthetic','synthetic',false);
insert into storage.objects values('30000000-0000-0000-0000-000000000001','synthetic','fixture.txt','10000000-0000-0000-0000-000000000001','{"size":7}');
insert into storage.migrations values(1,'synthetic-storage-1');
insert into supabase_migrations.schema_migrations values('20261023000000',array['select 1'],'synthetic fixture');
do $$declare n text;begin foreach n in array array['games','class_sessions','rooms','role_seats','network_tests','role_sessions','events','deliveries','control_state','branch_state','turn_states','control_snapshots'] loop execute format('insert into sl_sim.%I(owner_id,payload) values($1,$2)',n) using '10000000-0000-0000-0000-000000000001'::uuid,jsonb_build_object('fixture',n);end loop;end$$;
