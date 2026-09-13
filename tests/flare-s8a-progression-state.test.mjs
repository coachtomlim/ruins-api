import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgressionCatalog} from '../public/flare-s8a/progression-catalog.mjs';
import {normalizeEquipmentCatalog} from '../public/flare-s8a/equipment-catalog.mjs';
import {deriveRunnerProgressionState} from '../public/flare-s8a/progression-state.mjs';

const catalog=normalizeProgressionCatalog({version:1,statUpgrades:[{id:'hp-1',stat:'hp',amount:10,goldCost:10},{id:'atk-1',stat:'attack',amount:1,goldCost:10}],equipment:[{id:'club-1',slot:'weapon',goldCost:20,modifiers:{attack:3}},{id:'shield-1',slot:'shield',goldCost:20,modifiers:{defense:1}},{id:'boots-1',slot:'feet',goldCost:25,modifiers:{hp:5,defense:1}}]});

test('derived progression equips owned weapon shield and armor pieces',()=>{
  const state=deriveRunnerProgressionState({catalog,statPurchaseOfferIds:['hp-1','atk-1'],ownedAssetIds:['club-1','shield-1','boots-1'],loadout:{weapon:'club-1',shield:'shield-1',feet:'boots-1'}});
  assert.deepEqual(state.statBonuses,{hp:10,attack:1,defense:0});
  assert.equal(state.weapon.id,'club-1');
  assert.equal(state.shield.id,'shield-1');
  assert.equal(state.feet.id,'boots-1');
  assert.equal(state.head,null);
});

test('owned dropped gear can be equipped even when it has no purchase offer',()=>{
  const equipmentCatalog=normalizeEquipmentCatalog({items:[{id:'found-boots',slot:'feet',modifiers:{defense:1}}]});
  const state=deriveRunnerProgressionState({equipmentCatalog,ownedAssetIds:['found-boots'],loadout:{feet:'found-boots'}});
  assert.equal(state.feet.id,'found-boots');
  assert.deepEqual(state.feet.modifiers,{hp:0,attack:0,defense:1});
});

test('duplicate stat application and unowned equipment fail closed',()=>{
  assert.throws(()=>deriveRunnerProgressionState({catalog,statPurchaseOfferIds:['hp-1','hp-1']}));
  assert.throws(()=>deriveRunnerProgressionState({catalog,ownedAssetIds:[],loadout:{weapon:'club-1'}}));
});
