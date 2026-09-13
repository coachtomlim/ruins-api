import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReadyViewModel} from '../public/flare-s8a/ready-view-model.mjs';

test('ready screen keeps target, room and run action concise',()=>{
  const vm=buildReadyViewModel({targetHp:60,roomName:'Twin Lanes',usedBudget:100,totalBudget:100,estimatedHpPercent:60.8,monsters:['Skeleton','Skeleton','Goblin'],traps:['Spike Trap'],supports:[]});
  assert.equal(vm.title,'AIM FOR ~60% HP AT THE EXIT');
  assert.equal(vm.roomName,'Twin Lanes');
  assert.equal(vm.budget.primary,'DUNGEON BUDGET 100 / 100');
  assert.equal(vm.targetFit.label,'CLOSE TO TARGET');
  assert.equal(vm.primaryAction,'RUN THE HERO');
  assert.equal(vm.secondaryAction,'EDIT DUNGEON');
  assert.equal(vm.canRun,true);
});

test('ready screen blocks running when dungeon budget is exceeded',()=>{
  const vm=buildReadyViewModel({targetHp:60,usedBudget:115,totalBudget:100,estimatedHpPercent:60});
  assert.equal(vm.canRun,false);
  assert.equal(vm.primaryAction,'FIX BUDGET');
  assert.equal(vm.budget.secondary,'OVER BUDGET BY 15');
});
