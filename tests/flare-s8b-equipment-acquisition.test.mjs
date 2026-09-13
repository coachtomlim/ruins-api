import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEquipmentAcquisition} from '../public/flare-s8b/equipment-acquisition.mjs';

test('starter, reward and drop gear ownership do not invent Gold debits',()=>{
  for(const reason of ['STARTER_GRANT','REWARD','DROP','UNLOCK']){
    const row=normalizeEquipmentAcquisition({ownershipId:`o-${reason}`,playerId:'p1',runnerId:'r1',itemId:'boots-1',slot:'feet',reason,sourceId:'source-1'});
    assert.equal(row.reason,reason);
    assert.equal(row.ledgerEntryId,null);
  }
});

test('purchase ownership requires an explicit ledger entry',()=>{
  const row=normalizeEquipmentAcquisition({ownershipId:'o1',playerId:'p1',runnerId:'r1',itemId:'helm-1',slot:'head',reason:'PURCHASE',sourceId:'offer-1',ledgerEntryId:'debit-1'});
  assert.equal(row.ledgerEntryId,'debit-1');
  assert.throws(()=>normalizeEquipmentAcquisition({ownershipId:'o2',playerId:'p1',runnerId:'r1',itemId:'helm-1',slot:'head',reason:'PURCHASE'}));
});

test('unsupported slots and acquisition reasons fail closed',()=>{
  assert.throws(()=>normalizeEquipmentAcquisition({ownershipId:'o1',playerId:'p1',runnerId:'r1',itemId:'ring-1',slot:'ring',reason:'REWARD'}));
  assert.throws(()=>normalizeEquipmentAcquisition({ownershipId:'o1',playerId:'p1',runnerId:'r1',itemId:'boots-1',slot:'feet',reason:'MYSTERY'}));
});
