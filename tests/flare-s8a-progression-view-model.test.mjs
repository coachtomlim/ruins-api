import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgressionCatalog} from '../public/flare-s8a/progression-catalog.mjs';
import {createRunnerSnapshot} from '../public/flare-s8a/runner-snapshot.mjs';
import {buildProgressionViewModel} from '../public/flare-s8a/progression-view-model.mjs';

const snapshot=createRunnerSnapshot({runnerId:'r1',runnerName:'My Warrior',runnerLevel:1,baseRunner:{hp:100,attack:8,defense:0},progression:{statBonuses:{hp:10},equipment:{weapon:{id:'club',slot:'weapon',modifiers:{attack:4}},shield:{id:'wood-shield',slot:'shield',modifiers:{defense:1}}}}});
const catalog=normalizeProgressionCatalog({version:1,statUpgrades:[{id:'hp-1',stat:'hp',amount:10,goldCost:10}],equipment:[{id:'mace-1',slot:'weapon',goldCost:25,modifiers:{attack:2}},{id:'helm-1',slot:'head',goldCost:20,modifiers:{defense:1}},{id:'boots-1',slot:'feet',goldCost:15,modifiers:{defense:1}}]});

test('upgrade view shows starter weapon and shield with empty armor slots',()=>{
  const vm=buildProgressionViewModel({runnerSnapshot:snapshot,goldBalance:20,catalog});
  assert.equal(vm.title,'UPGRADE YOUR RUNNER');
  assert.equal(vm.goldBalance,20);
  assert.deepEqual(vm.runner.stats,{hp:110,attack:12,defense:1});
  assert.equal(vm.loadout.weapon,'club');
  assert.equal(vm.loadout.shield,'wood-shield');
  assert.equal(vm.loadout.head,null);
  assert.equal(vm.loadout.feet,null);
  assert.equal(vm.statOffers[0].quote.affordable,true);
  assert.equal(vm.equipmentOffers[0].quote.affordable,false);
  assert.equal(vm.armorOffers.length,2);
  assert.ok(vm.emptyArmorSlots.includes('head'));
  assert.ok(vm.emptyArmorSlots.includes('feet'));
  assert.deepEqual(vm.categories,['STATS','EQUIPMENT','ARMOR']);
});
