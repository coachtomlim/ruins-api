import test from 'node:test';
import assert from 'node:assert/strict';
import {progressionDebitEntry,foldGoldLedgerNonNegative} from '../public/flare-s8b/progression-ledger.mjs';

test('progression debit creates explicit negative Gold ledger entry',()=>{
  const debit=progressionDebitEntry({ledgerEntryId:'l2',playerId:'p1',goldCost:15,reasonCode:'EQUIPMENT_PURCHASE',sourceId:'blade-1',idempotencyKey:'buy:p1:blade-1:1'});
  assert.equal(debit.amount,-15);
  assert.equal(debit.currency,'GOLD');
  assert.equal(debit.reason_code,'EQUIPMENT_PURCHASE');
});

test('ledger refuses upgrade spend that would drive balance below zero',()=>{
  const credit={ledger_entry_id:'l1',player_id:'p1',amount:10,currency:'GOLD',reason_code:'DUNGEON_BUILDER_REWARD',idempotency_key:'reward:1'};
  const debit=progressionDebitEntry({ledgerEntryId:'l2',playerId:'p1',goldCost:15,reasonCode:'ARMOR_PURCHASE',sourceId:'mail-1',idempotencyKey:'buy:p1:mail-1:1'});
  assert.throws(()=>foldGoldLedgerNonNegative([credit,debit]));
});

test('affordable spend produces the expected derived balance',()=>{
  const credit={ledger_entry_id:'l1',player_id:'p1',amount:25,currency:'GOLD',reason_code:'DUNGEON_BUILDER_REWARD',idempotency_key:'reward:1'};
  const debit=progressionDebitEntry({ledgerEntryId:'l2',playerId:'p1',goldCost:15,reasonCode:'EQUIPMENT_PURCHASE',sourceId:'blade-1',idempotencyKey:'buy:p1:blade-1:1'});
  assert.equal(foldGoldLedgerNonNegative([credit,debit]).balance,10);
});
