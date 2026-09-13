import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgressionCatalog} from '../public/flare-s8a/progression-catalog.mjs';
import {createStarterAccountProgression} from '../public/flare-s8b/account-starter.mjs';
import {createProgressionAccount,applyProgressionPurchase,applyProgressionEquip} from '../public/flare-s8b/progression-engine.mjs';

test('fixture flow can preserve starter club shield while acquiring first footwear',()=>{
  const starter=createStarterAccountProgression({playerId:'p1'});
  const reward={ledger_entry_id:'reward-1',player_id:'p1',amount:20,currency:'GOLD',reason_code:'DUNGEON_BUILDER_REWARD',source_type:'RUN',source_id:'run-1',idempotency_key:'builder-reward:run-1:p1'};
  let account=createProgressionAccount({playerId:'p1',ledgerEntries:[reward],runners:starter.account.runners});
  const catalog=normalizeProgressionCatalog({version:1,equipment:[{id:'boots-fixture',slot:'feet',name:'Chain Boots',goldCost:20,modifiers:{defense:1}}]});
  const bought=applyProgressionPurchase({account,catalog,runnerId:'warrior-l1',offerId:'boots-fixture',idempotencyKey:'buy-boots-fixture',ledgerEntryId:'debit-boots'});
  account=applyProgressionEquip({account:bought.account,catalog,runnerId:'warrior-l1',slot:'feet',assetId:'boots-fixture'});
  const runner=account.runners['warrior-l1'];
  assert.equal(runner.loadout.weapon,'wooden-club');
  assert.equal(runner.loadout.shield,'wooden-shield');
  assert.equal(runner.loadout.feet,'boots-fixture');
  assert.equal(runner.loadout.head,null);
  assert.equal(bought.balance,0);
});
