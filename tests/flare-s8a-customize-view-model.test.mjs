import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCustomizeViewModel} from '../public/flare-s8a/customize-view-model.mjs';

test('customization shows one category panel and persistent budget context',()=>{
  const vm=buildCustomizeViewModel({activePanel:'traps',usedBudget:85,totalBudget:100,monsters:['goblin','skeleton'],traps:['spike-trap'],supports:['small-potion']});
  assert.equal(vm.title,'CUSTOMIZE — OPTIONAL');
  assert.equal(vm.activePanel,'traps');
  assert.equal(vm.tabs.filter(x=>x.active).length,1);
  assert.equal(vm.tabs.find(x=>x.active).id,'traps');
  assert.equal(vm.budget.primary,'DUNGEON BUDGET 85 / 100');
  assert.equal(vm.primaryAction,'DONE');
  assert.equal(vm.canFinish,true);
});

test('invalid panel falls back safely and overspend is not finishable',()=>{
  const vm=buildCustomizeViewModel({activePanel:'everything',usedBudget:120,totalBudget:100});
  assert.equal(vm.activePanel,'monsters');
  assert.equal(vm.canFinish,false);
  assert.equal(vm.budget.secondary,'OVER BUDGET BY 20');
});
