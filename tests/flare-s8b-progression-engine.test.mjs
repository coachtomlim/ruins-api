import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgressionCatalog} from '../public/flare-s8a/progression-catalog.mjs';
import {createProgressionAccount,applyProgressionPurchase,applyProgressionEquip} from '../public/flare-s8b/progression-engine.mjs';

const catalog=normalizeProgressionCatalog({version:1,statUpgrades:[{id:'hp-1',stat:'hp',amount:10,goldCost:10}],equipment:[{id:'club-1',slot:'weapon',goldCost:15,modifiers:{attack:2}},{id:'shield-1',slot:'shield',goldCost:15,modifiers:{defense:1}},{id:'boots-1',slot:'feet',goldCost:20,modifiers:{defense:1}}]});
const credit={ledger_entry_id:'credit-1',player_id:'p1',amount:40,currency:'GOLD',reason_code:'DUNGEON_BUILDER_REWARD',idempotency_key:'reward-1'};

test('purchase debits once and records stat progression',()=>{
  let account=createProgressionAccount({playerId:'p1',ledgerEntries:[credit],runners:{r1:{statOfferIds:[],ownedAssetIds:[],loadout:{}}}});
  const first=applyProgressionPurchase({account,catalog,runnerId:'r1',offerId:'hp-1',idempotencyKey:'buy-hp-1',ledgerEntryId:'debit-1'});
  assert.equal(first.balance,30);
  assert.deepEqual(first.account.runners.r1.statOfferIds,['hp-1']);
  const retry=applyProgressionPurchase({account:first.account,catalog,runnerId:'r1',offerId:'hp-1',idempotencyKey:'buy-hp-1',ledgerEntryId:'ignored'});
  assert.equal(retry.duplicate,true);
  assert.equal(retry.balance,30);
  assert.equal(retry.account.ledgerEntries.length,2);
});

test('weapon and shield purchases can be equipped independently without second Gold debit',()=>{
  let account=createProgressionAccount({playerId:'p1',ledgerEntries:[credit],runners:{r1:{statOfferIds:[],ownedAssetIds:[],loadout:{}}}});
  const club=applyProgressionPurchase({account,catalog,runnerId:'r1',offerId:'club-1',idempotencyKey:'buy-club',ledgerEntryId:'debit-club'});
  const shield=applyProgressionPurchase({account:club.account,catalog,runnerId:'r1',offerId:'shield-1',idempotencyKey:'buy-shield',ledgerEntryId:'debit-shield'});
  let equipped=applyProgressionEquip({account:shield.account,catalog,runnerId:'r1',slot:'weapon',assetId:'club-1'});
  equipped=applyProgressionEquip({account:equipped,catalog,runnerId:'r1',slot:'shield',assetId:'shield-1'});
  assert.equal(equipped.runners.r1.loadout.weapon,'club-1');
  assert.equal(equipped.runners.r1.loadout.shield,'shield-1');
  assert.equal(equipped.ledgerEntries.length,3);
});

test('first armor piece purchase can equip into its own slot',()=>{
  let account=createProgressionAccount({playerId:'p1',ledgerEntries:[credit],runners:{r1:{statOfferIds:[],ownedAssetIds:[],loadout:{}}}});
  const purchase=applyProgressionPurchase({account,catalog,runnerId:'r1',offerId:'boots-1',idempotencyKey:'buy-boots',ledgerEntryId:'debit-boots'});
  const equipped=applyProgressionEquip({account:purchase.account,catalog,runnerId:'r1',slot:'feet',assetId:'boots-1'});
  assert.equal(equipped.runners.r1.loadout.feet,'boots-1');
  assert.equal(equipped.runners.r1.loadout.head,undefined);
});

test('insufficient Gold cannot partially mutate progression',()=>{
  const account=createProgressionAccount({playerId:'p1',ledgerEntries:[],runners:{r1:{statOfferIds:[],ownedAssetIds:[],loadout:{}}}});
  assert.throws(()=>applyProgressionPurchase({account,catalog,runnerId:'r1',offerId:'boots-1',idempotencyKey:'x',ledgerEntryId:'d'}));
  assert.deepEqual(account.runners.r1.ownedAssetIds,[]);
  assert.equal(account.ledgerEntries.length,0);
});
