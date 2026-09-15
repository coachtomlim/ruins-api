import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const migrationPath='supabase/migrations/20260915_s8b_progression_transaction_foundation.sql';

test('progression foundation activates no concrete catalog or offer',async()=>{
  const sql=await read(migrationPath);
  assert.doesNotMatch(sql,/insert\s+into\s+public\.progression_catalog_version/i);
  assert.doesNotMatch(sql,/insert\s+into\s+public\.progression_offer_catalog/i);
  assert.doesNotMatch(sql,/insert\s+into\s+public\.runner_challengeability_envelope/i);
  assert.match(sql,/NO_ACTIVE_PROGRESSION_CATALOG/);
});

test('catalog enforces accepted atomic stat units and PREFERRED cumulative gate',async()=>{
  const sql=await read(migrationPath);
  assert.match(sql,/stat_key\s*=\s*'hp'\s+and\s+stat_amount\s*=\s*5/i);
  assert.match(sql,/stat_key\s*=\s*'attack'\s+and\s+stat_amount\s*=\s*1/i);
  assert.match(sql,/stat_key\s*=\s*'defense'\s+and\s+stat_amount\s*=\s*1/i);
  assert.match(sql,/runner_challengeability_envelope/);
  assert.match(sql,/e\.band\s*=\s*'PREFERRED'/i);
  assert.match(sql,/PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE/);
});

test('purchase boundary serializes wallet, is idempotent, and leaves equip separate',async()=>{
  const sql=await read(migrationPath);
  assert.match(sql,/from\s+public\.player_profile[\s\S]*for\s+update/i);
  assert.match(sql,/INSUFFICIENT_GOLD/);
  assert.match(sql,/IDEMPOTENCY_CONFLICT/);
  assert.match(sql,/unique\s*\(player_id,\s*idempotency_key\)/i);
  assert.match(sql,/runner_stat_upgrade_event/);
  assert.match(sql,/GOLD_PURCHASE/);
  assert.doesNotMatch(sql,/update\s+public\.runner_loadout/i);
});

test('browser roles cannot directly mutate progression authority',async()=>{
  const sql=await read(migrationPath);
  for(const table of [
    'progression_catalog_version','progression_offer_catalog','runner_challengeability_envelope',
    'progression_purchase','runner_stat_upgrade_event'
  ]) assert.match(sql,new RegExp(`revoke all on table public\\.${table} from anon, authenticated`,'i'));
  assert.match(sql,/revoke all on function public\.purchase_progression_offer\(uuid,text,text\) from anon/i);
  assert.match(sql,/grant execute on function public\.purchase_progression_offer\(uuid,text,text\) to authenticated/i);
});
