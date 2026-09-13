import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEquipmentCatalog} from '../public/flare-s8a/equipment-catalog.mjs';
import {normalizeProgressionOffers} from '../public/flare-s8a/progression-offers.mjs';
import {createGearAccount,purchaseGear,grantRunGear} from '../public/flare-s8b/gear-acquisition-engine.mjs';

const equipment=normalizeEquipmentCatalog({items:[{id:'boots',slot:'feet',modifiers:{defense:1}},{id:'hood',slot:'head',modifiers:{defense:1}},{id:'mace',slot:'weapon',modifiers:{attack:2}}]});
const offers=normalizeProgressionOffers({itemOffers:[{id:'buy-boots',itemId:'boots',goldCost:20},{id:'buy-mace',itemId:'mace',goldCost:15}]},equipment);
const credit={ledger_entry_id:'c1',player_id:'p1',amount:25,currency:'GOLD',reason_code:'DUNGEON_BUILDER_REWARD',idempotency_key:'reward-1'};

test('armor-piece Gold purchase atomically debits and creates gear once',()=>{
  const account=createGearAccount({accountId:'p1',ledgerEntries:[credit]});
  const first=purchaseGear({account,offers,equipmentCatalog:equipment,offerId:'buy-boots',operationKey:'buy-1',ledgerEntryId:'d1',gearInstanceId:'g1'});
  assert.equal(first.balance,5);
  assert.equal(first.gear.itemId,'boots');
  assert.equal(first.reasonCode,'ARMOR_PURCHASE');
  assert.equal(first.account.gearInstances.length,1);
  const retry=purchaseGear({account:first.account,offers,equipmentCatalog:equipment,offerId:'buy-boots',operationKey:'buy-1',ledgerEntryId:'d2',gearInstanceId:'g2'});
  assert.equal(retry.duplicate,true);
  assert.equal(retry.balance,5);
  assert.equal(retry.account.gearInstances.length,1);
});

test('weapon Gold purchase uses equipment debit classification',()=>{
  const account=createGearAccount({accountId:'p1',ledgerEntries:[credit]});
  const bought=purchaseGear({account,offers,equipmentCatalog:equipment,offerId:'buy-mace',operationKey:'buy-mace-1',ledgerEntryId:'d-mace',gearInstanceId:'g-mace'});
  assert.equal(bought.reasonCode,'EQUIPMENT_PURCHASE');
  assert.equal(bought.balance,10);
});

test('run-awarded gear creates ownership without changing Gold balance',()=>{
  const account=createGearAccount({accountId:'p1',ledgerEntries:[credit]});
  const first=grantRunGear({account,equipmentCatalog:equipment,itemId:'hood',runAwardId:'award-1',gearInstanceId:'g2'});
  assert.equal(first.balance,25);
  assert.equal(first.gear.itemId,'hood');
  assert.equal(first.gear.source,'DROP');
  const retry=grantRunGear({account:first.account,equipmentCatalog:equipment,itemId:'hood',runAwardId:'award-1',gearInstanceId:'g3'});
  assert.equal(retry.duplicate,true);
  assert.equal(retry.account.gearInstances.length,1);
});
