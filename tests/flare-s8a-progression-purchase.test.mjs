import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgressionCatalog} from '../public/flare-s8a/progression-catalog.mjs';
import {quoteProgressionPurchase,purchaseIntent} from '../public/flare-s8a/progression-purchase.mjs';

const catalog=normalizeProgressionCatalog({version:1,statUpgrades:[{id:'hp-1',stat:'hp',amount:10,goldCost:10}],equipment:[{id:'blade-1',slot:'weapon',goldCost:15,modifiers:{attack:2}},{id:'mail-1',slot:'armor',goldCost:20,modifiers:{defense:2}}]});

test('quote reports affordability and remaining Gold',()=>{
  assert.deepEqual(quoteProgressionPurchase({catalog,offerId:'blade-1',goldBalance:25}),{offerId:'blade-1',kind:'equipment',slot:'weapon',cost:15,balance:25,remaining:10,affordable:true,reasonCode:'EQUIPMENT_PURCHASE'});
  assert.equal(quoteProgressionPurchase({catalog,offerId:'mail-1',goldBalance:5}).affordable,false);
});

test('purchase intent creates explicit negative Gold ledger mutation reason',()=>{
  const i=purchaseIntent({playerId:'p1',runnerId:'r1',catalog,offerId:'hp-1',goldBalance:20,idempotencyKey:'upgrade:p1:r1:hp-1:1'});
  assert.equal(i.amount,-10);
  assert.equal(i.reasonCode,'RUNNER_STAT_UPGRADE');
  assert.equal(i.currency,'GOLD');
});

test('purchase intent fails closed on insufficient Gold or missing idempotency key',()=>{
  assert.throws(()=>purchaseIntent({playerId:'p1',runnerId:'r1',catalog,offerId:'mail-1',goldBalance:5,idempotencyKey:'x'}));
  assert.throws(()=>purchaseIntent({playerId:'p1',runnerId:'r1',catalog,offerId:'hp-1',goldBalance:20}));
});
