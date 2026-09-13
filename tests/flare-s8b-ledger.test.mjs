import test from 'node:test';
import assert from 'node:assert/strict';
import {GOLD_REASON_CODES,rewardIdempotencyKey,foldGoldLedger} from '../public/flare-s8b/ledger.mjs';

test('reward idempotency keys distinguish builder and Hero settlement',()=>{
  assert.equal(rewardIdempotencyKey({reasonCode:GOLD_REASON_CODES.DUNGEON_BUILDER_REWARD,canonicalRunId:'run-1',playerId:'p1'}),'builder-reward:run-1:p1');
  assert.equal(rewardIdempotencyKey({reasonCode:GOLD_REASON_CODES.HERO_RUN_REWARD,canonicalRunId:'run-1',playerId:'p2'}),'hero-reward:run-1:p2');
});

test('Gold balance derives from append-only entries',()=>{
  const folded=foldGoldLedger([
    {ledger_entry_id:'e1',player_id:'p1',amount:20,currency:'GOLD',reason_code:'DUNGEON_BUILDER_REWARD',source_type:'run',source_id:'run-1',idempotency_key:'builder-reward:run-1:p1',created_at:'2026-09-13T00:00:00Z'},
    {ledger_entry_id:'e2',player_id:'p1',amount:5,currency:'GOLD',reason_code:'STARTER_GRANT',source_type:'system',source_id:'starter',idempotency_key:'starter:p1',created_at:'2026-09-13T00:00:01Z'}
  ]);
  assert.deepEqual(folded,{currency:'GOLD',balance:25,entryCount:2});
});

test('duplicate idempotency keys fail closed',()=>{
  const e={player_id:'p1',amount:20,currency:'GOLD',reason_code:'DUNGEON_BUILDER_REWARD',source_type:'run',source_id:'run-1',idempotency_key:'builder-reward:run-1:p1',created_at:'2026-09-13T00:00:00Z'};
  assert.throws(()=>foldGoldLedger([{...e,ledger_entry_id:'e1'},{...e,ledger_entry_id:'e2'}]),/Duplicate ledger idempotency key/);
});
