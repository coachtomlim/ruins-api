import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgressionCatalog} from '../public/flare-s8a/progression-catalog.mjs';
import {deriveRunnerProgressionState} from '../public/flare-s8a/progression-state.mjs';

const catalog=normalizeProgressionCatalog({version:1,statUpgrades:[{id:'hp-1',stat:'hp',amount:10,goldCost:10},{id:'atk-1',stat:'attack',amount:1,goldCost:10}],equipment:[{id:'blade-1',slot:'weapon',goldCost:20,modifiers:{attack:3}},{id:'mail-1',slot:'armor',goldCost:25,modifiers:{hp:5,defense:2}}]});

test('derived progression sums permanent stats and equips only owned items',()=>{
  const state=deriveRunnerProgressionState({catalog,statPurchaseOfferIds:['hp-1','atk-1'],ownedAssetIds:['blade-1','mail-1'],loadout:{weapon:'blade-1',armor:'mail-1'}});
  assert.deepEqual(state.statBonuses,{hp:10,attack:1,defense:0});
  assert.equal(state.weapon.id,'blade-1');
  assert.equal(state.armor.id,'mail-1');
});

test('duplicate stat application and unowned equipment fail closed',()=>{
  assert.throws(()=>deriveRunnerProgressionState({catalog,statPurchaseOfferIds:['hp-1','hp-1']}));
  assert.throws(()=>deriveRunnerProgressionState({catalog,ownedAssetIds:[],loadout:{weapon:'blade-1'}}));
});
