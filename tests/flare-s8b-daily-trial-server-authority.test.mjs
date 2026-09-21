import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migration=await readFile(new URL('../supabase/migrations/20260921_s8b_daily_trial_001.sql',import.meta.url),'utf8');

test('Daily Trial migration preserves existing wallet reasons and adds daily_trial_reward',()=>{
  for(const reason of [
    'dungeon_builder_reward','hero_runner_reward_claim','asset_purchase','admin_adjustment',
    'runner_stat_upgrade','equipment_purchase','armor_purchase','daily_login_bonus','daily_trial_reward'
  ])assert.match(migration,new RegExp(reason));
});

test('Daily Trial room catalog pins all six calibrated rooms and exact tick windows',()=>{
  const expected=[
    ['iron-labyrinth-01','Pillar Court',614],
    ['iron-labyrinth-03','Crossed Court',660],
    ['iron-labyrinth-07','Broken Gallery',604],
    ['iron-labyrinth-08','Scattered Hall',598],
    ['iron-labyrinth-15','Vaulted Crossing',653],
    ['iron-labyrinth-18','Twin Lanes',617]
  ];
  for(const [room,name,ticks] of expected){
    assert.match(migration,new RegExp(`'${room}','${name}',${ticks}`));
  }
});

test('Daily Trial run is one server-created run per player per UTC day with immutable snapshots',()=>{
  assert.match(migration,/unique \(player_id, trial_day\)/i);
  assert.match(migration,/runner_snapshot jsonb not null/i);
  assert.match(migration,/encounter jsonb not null/i);
  assert.match(migration,/rules_version text not null/i);
  assert.match(migration,/content_version text not null/i);
  assert.match(migration,/reward_gold integer not null check \(reward_gold = 5\)/i);
  assert.match(migration,/budget_spent integer not null check \(budget_spent = 65\)/i);
});

test('start RPC derives day, room, Runner and reward without browser reward inputs',()=>{
  assert.match(migration,/create or replace function public\.start_daily_trial\(\)/i);
  assert.match(migration,/\(now\(\) at time zone 'UTC'\)::date/i);
  assert.match(migration,/public\.get_account_runner_state\(null::uuid\)/i);
  assert.match(migration,/runner_challengeability_envelope/i);
  assert.match(migration,/band = 'PREFERRED'/i);
  assert.match(migration,/fair-goblin-skeleton-potion-001/i);
  assert.doesNotMatch(migration,/start_daily_trial\([^)]*(?:reward|gold|hp|score|room|date)/i);
});

test('start RPC snapshots the exact fixed FAIR encounter and calibrated 65-point budget',()=>{
  assert.match(migration,/"enemyTypes":\["goblin","skeleton","none"\]/i);
  assert.match(migration,/"supportTypes":\["small-potion"\]/i);
  assert.match(migration,/"trapTypes":\[\]/i);
  assert.match(migration,/fair-goblin-skeleton-potion-001/i);
  assert.match(migration,/\n\s*65,\n\s*5,/);
});

test('settlement accepts only run id, waits for server settle_after and credits fixed +5 once',()=>{
  assert.match(migration,/create or replace function public\.settle_daily_trial\(p_run_id uuid\)/i);
  assert.match(migration,/if now\(\) < v_run\.settle_after then\s+raise exception 'DAILY_TRIAL_NOT_COMPLETE'/i);
  assert.match(migration,/v_key := 'daily-trial:' \|\| v_player::text \|\| ':' \|\| v_run\.trial_day::text/i);
  assert.match(migration,/\n\s*5,\n\s*'daily_trial_reward'/i);
  assert.match(migration,/if v_run\.settled_at is not null then[\s\S]*?true,/i);
  assert.doesNotMatch(migration,/settle_daily_trial\([^)]*(?:reward|gold|hp|score|status)/i);
});

test('Daily Trial browser roles have read-only tables and authenticated-only RPC execution',()=>{
  assert.match(migration,/revoke all on table public\.daily_trial_run from anon, authenticated/i);
  assert.match(migration,/grant select on table public\.daily_trial_run to authenticated/i);
  for(const fn of ['get_daily_trial_status','start_daily_trial']){
    assert.match(migration,new RegExp(`revoke all on function public\\.${fn}\\(\\) from public`,'i'));
    assert.match(migration,new RegExp(`revoke all on function public\\.${fn}\\(\\) from anon`,'i'));
    assert.match(migration,new RegExp(`grant execute on function public\\.${fn}\\(\\) to authenticated`,'i'));
  }
  assert.match(migration,/revoke all on function public\.settle_daily_trial\(uuid\) from public/i);
  assert.match(migration,/revoke all on function public\.settle_daily_trial\(uuid\) from anon/i);
  assert.match(migration,/grant execute on function public\.settle_daily_trial\(uuid\) to authenticated/i);
});

test('security-definer Daily Trial mutations use empty search paths',()=>{
  const start=migration.slice(migration.indexOf('create or replace function public.start_daily_trial()'));
  const settle=migration.slice(migration.indexOf('create or replace function public.settle_daily_trial(p_run_id uuid)'));
  assert.match(start,/security definer\s+set search_path = ''/i);
  assert.match(settle,/security definer\s+set search_path = ''/i);
});
