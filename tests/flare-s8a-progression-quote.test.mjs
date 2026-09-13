import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEquipmentCatalog} from '../public/flare-s8a/equipment-catalog.mjs';
import {normalizeProgressionOffers} from '../public/flare-s8a/progression-offers.mjs';
import {quoteProgressionOffer} from '../public/flare-s8a/progression-quote.mjs';

const equipment=normalizeEquipmentCatalog({items:[{id:'boots',slot:'feet',modifiers:{defense:1}}]});
const offers=normalizeProgressionOffers({statOffers:[{id:'hp-1',stat:'hp',amount:10,goldCost:10}],itemOffers:[{id:'boots-buy',itemId:'boots',goldCost:20}]},equipment);

test('item quote resolves item identity and modifiers separately from price',()=>{
  const q=quoteProgressionOffer({offers,equipmentCatalog:equipment,offerId:'boots-buy',goldBalance:25});
  assert.equal(q.itemId,'boots');
  assert.equal(q.slot,'feet');
  assert.deepEqual(q.modifiers,{hp:0,attack:0,defense:1});
  assert.equal(q.cost,20);
  assert.equal(q.remaining,5);
  assert.equal(q.affordable,true);
});

test('stat quote remains independent of equipment catalog',()=>{
  const q=quoteProgressionOffer({offers,equipmentCatalog:equipment,offerId:'hp-1',goldBalance:5});
  assert.equal(q.stat,'hp');
  assert.equal(q.amount,10);
  assert.equal(q.affordable,false);
});
