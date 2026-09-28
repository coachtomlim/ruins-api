-- FRIEND CHALLENGE NAVIGATION + RESULT FEEDBACK 001
-- Additive public correlation and non-economic result receipts. No wallet/XP/stat/gear mutation.

alter table public.builder_challenge add column if not exists public_token text;
update public.builder_challenge
set public_token = rtrim(translate(encode(gen_random_bytes(24),'base64'),'+/','-_'),'=')
where public_token is null;
alter table public.builder_challenge alter column public_token set not null;
alter table public.builder_challenge drop constraint if exists builder_challenge_public_token_format;
alter table public.builder_challenge add constraint builder_challenge_public_token_format
  check (public_token ~ '^[A-Za-z0-9_-]{32,128}$');
create unique index if not exists builder_challenge_public_token_uidx on public.builder_challenge(public_token);

create table if not exists public.builder_challenge_result (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.builder_challenge(id) on delete cascade,
  room_id text not null check (char_length(room_id) between 1 and 64),
  encounter jsonb not null check (jsonb_typeof(encounter)='object'),
  rules_version text not null check (char_length(rules_version) between 1 and 64),
  terminal_status text not null check (terminal_status in ('cleared','dead','blocked','timeout')),
  finishing_hp integer not null check (finishing_hp>=0),
  max_hp integer not null check (max_hp between 1 and 10000 and finishing_hp<=max_hp),
  finishing_hp_percent numeric(6,2) generated always as (round(finishing_hp::numeric*100/max_hp,2)) stored,
  target_hp integer not null check (target_hp between 5 and 95),
  score integer not null check (score between 0 and 100),
  hero_gold integer not null check (hero_gold between 0 and 100000),
  builder_gold integer not null check (builder_gold between 0 and 100000),
  deterministic_input_hash text not null check (char_length(deterministic_input_hash) between 16 and 128),
  completed_at timestamptz not null default now(),
  owner_seen_at timestamptz,
  unique(challenge_id,deterministic_input_hash)
);
create index if not exists builder_challenge_result_owner_feed_idx on public.builder_challenge_result(challenge_id,completed_at desc,id);
alter table public.builder_challenge_result enable row level security;
revoke all on table public.builder_challenge_result from anon,authenticated;

create or replace function public.create_builder_challenge_v2(p_target_hp integer)
returns table (challenge_id uuid,runner_id text,target_hp integer,invite_code text,sender_name text,public_token text,builder_xp_awarded integer,total_builder_xp integer,builder_level integer,duplicate boolean,created_at timestamptz)
language plpgsql security definer set search_path=''
as $$
declare v_old record; v_token text;
begin
  select * into v_old from public.create_builder_challenge(p_target_hp);
  select c.public_token into v_token from public.builder_challenge c where c.id=v_old.challenge_id;
  return query select v_old.challenge_id,v_old.runner_id,v_old.target_hp,v_old.invite_code,v_old.sender_name,v_token,v_old.builder_xp_awarded,v_old.total_builder_xp,v_old.builder_level,v_old.duplicate,v_old.created_at;
end $$;
revoke all on function public.create_builder_challenge_v2(integer) from public,anon;
grant execute on function public.create_builder_challenge_v2(integer) to authenticated;

create or replace function public.get_builder_challenges_v2(p_limit integer default 20)
returns table (challenge_id uuid,runner_id text,target_hp integer,invite_code text,sender_name text,public_token text,result_count bigint,created_at timestamptz)
language sql stable security invoker set search_path=''
as $$
  select c.id,c.runner_id,c.target_hp,c.invite_code,c.sender_name,c.public_token,count(r.id),c.created_at
  from public.builder_challenge c left join public.builder_challenge_result r on r.challenge_id=c.id
  where c.owner_player_id=auth.uid()
  group by c.id order by c.created_at desc,c.id desc limit least(greatest(coalesce(p_limit,20),1),100)
$$;
revoke all on function public.get_builder_challenges_v2(integer) from public,anon;
grant execute on function public.get_builder_challenges_v2(integer) to authenticated;

create or replace function public.submit_builder_challenge_result(p_public_token text,p_room_id text,p_encounter jsonb,p_rules_version text,p_terminal_status text,p_finishing_hp integer,p_max_hp integer,p_score integer,p_hero_gold integer,p_builder_gold integer,p_input_hash text)
returns table(result_id uuid,duplicate boolean)
language plpgsql security definer set search_path=''
as $$
declare v_challenge public.builder_challenge%rowtype; v_result public.builder_challenge_result%rowtype; v_inserted boolean:=true;
begin
  if p_public_token !~ '^[A-Za-z0-9_-]{32,128}$' then raise exception 'UNKNOWN_CHALLENGE_TOKEN'; end if;
  select * into v_challenge from public.builder_challenge c where c.public_token=p_public_token;
  if not found then raise exception 'UNKNOWN_CHALLENGE_TOKEN'; end if;
  if p_room_id is null or char_length(p_room_id) not between 1 and 64 or jsonb_typeof(p_encounter)<>'object' or
     p_rules_version is null or char_length(p_rules_version) not between 1 and 64 or
     p_terminal_status not in ('cleared','dead','blocked','timeout') or p_finishing_hp<0 or p_max_hp not between 1 and 10000 or p_finishing_hp>p_max_hp or
     p_score not between 0 and 100 or p_hero_gold not between 0 and 100000 or p_builder_gold not between 0 and 100000 or
     p_input_hash is null or char_length(p_input_hash) not between 16 and 128 then raise exception 'RESULT_RECEIPT_INVALID'; end if;
  insert into public.builder_challenge_result(challenge_id,room_id,encounter,rules_version,terminal_status,finishing_hp,max_hp,target_hp,score,hero_gold,builder_gold,deterministic_input_hash)
  values(v_challenge.id,p_room_id,p_encounter,p_rules_version,p_terminal_status,p_finishing_hp,p_max_hp,v_challenge.target_hp,p_score,p_hero_gold,p_builder_gold,p_input_hash)
  on conflict(challenge_id,deterministic_input_hash) do nothing returning * into v_result;
  if not found then v_inserted:=false;select * into v_result from public.builder_challenge_result r where r.challenge_id=v_challenge.id and r.deterministic_input_hash=p_input_hash;end if;
  return query select v_result.id,not v_inserted;
end $$;
revoke all on function public.submit_builder_challenge_result(text,text,jsonb,text,text,integer,integer,integer,integer,integer,text) from public;
grant execute on function public.submit_builder_challenge_result(text,text,jsonb,text,text,integer,integer,integer,integer,integer,text) to anon,authenticated;

create or replace function public.get_builder_challenge_results(p_limit integer default 10)
returns table(result_id uuid,challenge_id uuid,target_hp integer,room_id text,encounter_summary text,terminal_status text,finishing_hp_percent numeric,score integer,hero_gold integer,builder_gold integer,completed_at timestamptz,owner_seen_at timestamptz)
language sql stable security definer set search_path=''
as $$
 select r.id,r.challenge_id,r.target_hp,r.room_id,coalesce(r.encounter->>'summary','Recorded encounter'),r.terminal_status,r.finishing_hp_percent,r.score,r.hero_gold,r.builder_gold,r.completed_at,r.owner_seen_at
 from public.builder_challenge_result r join public.builder_challenge c on c.id=r.challenge_id
 where c.owner_player_id=auth.uid() order by r.completed_at desc,r.id desc limit least(greatest(coalesce(p_limit,10),1),50)
$$;
revoke all on function public.get_builder_challenge_results(integer) from public,anon;
grant execute on function public.get_builder_challenge_results(integer) to authenticated;

create or replace function public.mark_builder_challenge_result_read(p_result_id uuid)
returns table(result_id uuid,owner_seen_at timestamptz)
language plpgsql security definer set search_path=''
as $$
begin
 return query update public.builder_challenge_result r set owner_seen_at=coalesce(r.owner_seen_at,now())
 from public.builder_challenge c where r.id=p_result_id and c.id=r.challenge_id and c.owner_player_id=auth.uid()
 returning r.id,r.owner_seen_at;
end $$;
revoke all on function public.mark_builder_challenge_result_read(uuid) from public,anon;
grant execute on function public.mark_builder_challenge_result_read(uuid) to authenticated;
