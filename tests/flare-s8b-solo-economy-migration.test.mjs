import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migration=await readFile(new URL('../supabase/migrations/20260919_s8b_solo_economy_floor.sql',import.meta.url),'utf8');

test('daily login migration extends wallet reasons without replacing existing progression reasons',()=>{
  for(const reason of [
    'dungeon_builder_reward','hero_runner_reward_claim','asset_purchase','admin_adjustment',
    'runner_stat_upgrade','equipment_purchase','armor_purchase','daily_login_bonus'
  ])assert.match(migration,new RegExp(reason));
});

test('daily login claim is one row per player per server reward day',()=>{
  assert.match(migration,/unique \(player_id, reward_day\)/i);
  assert.match(migration,/\(now\(\) at time zone 'UTC'\)::date/i);
  assert.match(migration,/daily-login:' \|\| v_player::text \|\| ':' \|\| v_day::text/i);
});

test('daily bonus is fixed at 5 Gold with a 10 Gold day-seven streak bonus',()=>{
  assert.match(migration,/v_base integer := 5/);
  assert.match(migration,/if v_streak = 7 then\s+v_bonus := 10;/i);
  assert.match(migration,/streak_day between 1 and 7/i);
  assert.match(migration,/streak_bonus_gold in \(0,10\)/i);
});

test('claim RPC serializes per player and keeps browser writes behind security definer',()=>{
  assert.match(migration,/where p\.id = v_player\s+for update;/i);
  assert.match(migration,/security definer/i);
  assert.match(migration,/grant execute on function public\.claim_daily_login_bonus\(\) to authenticated/i);
  assert.doesNotMatch(migration,/grant\s+(?:insert|update|delete|all)\s+on\s+table\s+public\.daily_login_claim\s+to\s+authenticated/i);
});

test('same-day retry returns existing evidence before a second ledger insert',()=>{
  const existingIndex=migration.indexOf('where c.player_id = v_player\n    and c.reward_day = v_day;');
  const ledgerIndex=migration.indexOf('insert into public.wallet_ledger');
  assert.ok(existingIndex>-1&&ledgerIndex>-1&&existingIndex<ledgerIndex);
  assert.match(migration,/v_existing\.base_gold \+ v_existing\.streak_bonus_gold/);
  assert.match(migration,/true,\s+\(\(v_day \+ 1\)::timestamp at time zone 'UTC'\)/i);
});
