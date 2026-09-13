import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgressionCatalog} from '../public/flare-s8a/progression-catalog.mjs';
import {createProgressionAccount,applyProgressionPurchase,applyProgressionEquip} from '../public/flare-s8b/progression-engine.mjs';

const catalog=normalizeProgressionCatalog({version:1,statUpgrades:[{id:'hp-1',stat:'hp',amount:10,goldCost:10}],equipment:[{id:'blade-1',slot:'weapon',goldCost:15,modifiers:{attack:2}}]});
const credit={ledger_entry_id:'credit-1',player_id:'p1',amount:25,currency:'GOLD',reason_code:'DUNGEON_BUILDER_REWARD',idempotency_key:'reward-1'};

test('purchase debits once and records stat progression',()=>{
  let account=createProgressionAccount({playerId:'p1',ledgerEntries:[credit],runners:{r1:{statOfferIds:[],ownedAssetIds:[],loadout:{}}}});
  const first=applyProgressionPurchase({account,catalog,runnerId:'r1',offerId:'hp-1',idempotencyKey:'buy-hp-1',ledgerEntryId:'debit-1'});
  assert.equal(first.balance,15);
  assert.deepEqual(first.account.runners.r1.statOfferIds,['hp-1']);
  const retry=applyProgressionPurchase({account:first.account,catalog,runnerId:'r1',offerId:'hp-1',idempotencyKey:'buy-hp-1',ledgerEntryId:'ignored'});
  assert.equal(retry.duplicate,true);
  assert.equal(retry.balance,15);
  assert.equal(retry.account.ledgerEntries.length,2);
});

test('equipment purchase then equip updates loadout without second Gold debit',()=>{
  let account=createProgressionAccount({playerId:'p1',ledgerEntries:[credit],runners:{r1:{statOfferIds:[],ownedAssetIds:[],loadout:{}}}});
  const purchase=applyProgressionPurchase({account,catalog,runnerId:'r1',offerId:'blade-1',idempotencyKey:'buy-blade',ledgerEntryId:'debit-blade'});
  assert.equal(purchase.balance,10);
  const equipped=applyProgressionEquip({account:purchase.account,catalog,runnerId:'r1',slot:'weapon',assetId:'blade-1'});
  assert.equal(equipped.runners.r1.loadout.weapon,'blade-1');
  assert.equal(equipped.ledgerEntries.length,2);
});

test('insufficient Gold cannot partially mutate progression',()=>{
  const account=createProgressionAccount({playerId:'p1',ledgerEntries:[],runners:{r1:{statOfferIds:[],ownedAssetIds:[],loadout:{}}}});
  assert.throws(()=>applyProgressionPurchase({account,catalog,runnerId:'r1',offerId:'blade-1',idempotencyKey:'x',ledgerEntryId:'d'}));
  assert.deepEqual(account.runners.r1.ownedAssetIds,[]);
  assert.equal(account.ledgerEntries.length,0);
});
