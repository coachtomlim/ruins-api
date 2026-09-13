import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgressionCatalog} from '../public/flare-s8a/progression-catalog.mjs';
import {createRunnerSnapshot} from '../public/flare-s8a/runner-snapshot.mjs';
import {buildProgressionViewModel} from '../public/flare-s8a/progression-view-model.mjs';

const snapshot=createRunnerSnapshot({runnerId:'r1',runnerName:'My Warrior',runnerLevel:2,baseRunner:{hp:100,attack:12,defense:1},progression:{statBonuses:{hp:10},weapon:{id:'club',slot:'weapon',modifiers:{attack:2}}}});
const catalog=normalizeProgressionCatalog({version:1,statUpgrades:[{id:'hp-1',stat:'hp',amount:10,goldCost:10}],equipment:[{id:'mail-1',slot:'armor',goldCost:25,modifiers:{defense:2}}]});

test('upgrade view shows wallet, effective stats, loadout and affordability',()=>{
  const vm=buildProgressionViewModel({runnerSnapshot:snapshot,goldBalance:20,catalog});
  assert.equal(vm.title,'UPGRADE YOUR RUNNER');
  assert.equal(vm.goldBalance,20);
  assert.deepEqual(vm.runner.stats,{hp:110,attack:14,defense:1});
  assert.equal(vm.loadout.weapon,'club');
  assert.equal(vm.statOffers[0].quote.affordable,true);
  assert.equal(vm.equipment[0].quote.affordable,false);
  assert.deepEqual(vm.categories,['STATS','EQUIPMENT','ARMOR']);
});
