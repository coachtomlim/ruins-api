import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBudgetViewModel} from '../public/flare-s8a/budget-view-model.mjs';

test('dungeon build budget is explicit and distinct from earned rewards',()=>{
  const vm=buildBudgetViewModel({used:65,total:100});
  assert.equal(vm.primary,'DUNGEON BUDGET 65 / 100');
  assert.equal(vm.secondary,'35 BUILD GOLD LEFT');
  assert.equal(vm.legal,true);
  assert.match(vm.clarification,/not reward Gold/i);
  assert.match(vm.clarification,/not added to your wallet/i);
});

test('overspend fails closed with explicit over-budget state',()=>{
  const vm=buildBudgetViewModel({used:115,total:100});
  assert.equal(vm.legal,false);
  assert.equal(vm.over,15);
  assert.equal(vm.secondary,'OVER BUDGET BY 15');
});
