-- TEST-ONLY shim: reproduces the Supabase role landscape on a disposable local PostgreSQL so the
-- RUINS 001C migration draft can be applied and attacked offline. Never applied to any Supabase project.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
-- PostgREST-style connection role: logs in, then SET ROLE anon/authenticated per request.
create role authenticator login noinherit password null;
grant anon, authenticated, service_role to authenticator;
-- Supabase-like migration role: NOT a superuser; may create roles and schemas.
create role migrator login nosuperuser createrole nobypassrls password null;
grant create on database postgres to migrator;

-- Sentinels for out-of-scope shared objects that RUINS must never touch.
create table public.wallet_ledger (id bigint generated always as identity primary key, player_id uuid, delta int, note text);
create table public.runner_xp_event (id bigint generated always as identity primary key, player_id uuid, xp int);
create table public.daily_trial_run (id bigint generated always as identity primary key, player_id uuid, state text);
create table public.builder_challenge (id bigint generated always as identity primary key, owner uuid, state text);
insert into public.wallet_ledger (player_id, delta, note) values ('00000000-0000-4000-8000-000000000001', 5, 'sentinel');
insert into public.runner_xp_event (player_id, xp) values ('00000000-0000-4000-8000-000000000001', 1);
insert into public.daily_trial_run (player_id, state) values ('00000000-0000-4000-8000-000000000001', 'sentinel');
insert into public.builder_challenge (owner, state) values ('00000000-0000-4000-8000-000000000001', 'sentinel');
-- Supabase grants browser roles on public; replicate so RUINS isolation is tested against that posture.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.wallet_ledger, public.runner_xp_event, public.daily_trial_run, public.builder_challenge to anon, authenticated, service_role;

-- Supabase installs pgcrypto in schema extensions (owned by the migration role there). The r2 draft only checks
-- for it; it never creates or alters an extension.
create schema extensions authorization migrator;
create extension pgcrypto with schema extensions;
grant usage on schema extensions to anon, authenticated;
