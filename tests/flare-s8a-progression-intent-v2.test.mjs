import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEquipmentCatalog} from '../public/flare-s8a/equipment-catalog.mjs';
import {normalizeProgressionOffers} from '../public/flare-s8a/progression-offers.mjs';
import {progressionIntentV2} from '../public/flare-s8a/progression-intent-v2.mjs';

const equipment=normalizeEquipmentCatalog({items:[{id:'boots',slot:'feet',modifiers:{defense:1}}]});
const offers=normalizeProgressionOffers({itemOffers:[{id:'buy-boots',itemId:'boots',goldCost:20}]},equipment);

test('item purchase intent references offer and item without duplicating item stats',()=>{
  const intent=progressionIntentV2({playerId:'p1',runnerId:'r1',offers,equipmentCatalog:equipment,offerId:'buy-boots',goldBalance:25,idempotencyKey:'op-1'});
  assert.equal(intent.itemId,'boots');
  assert.equal(intent.offerId,'buy-boots');
  assert.equal(intent.amount,-20);
  assert.equal(intent.reasonCode,'EQUIPMENT_PURCHASE');
  assert.equal('modifiers' in intent,false);
});

test('insufficient balance fails before intent creation',()=>{
  assert.throws(()=>progressionIntentV2({playerId:'p1',runnerId:'r1',offers,equipmentCatalog:equipment,offerId:'buy-boots',goldBalance:5,idempotencyKey:'op-2'}));
});
