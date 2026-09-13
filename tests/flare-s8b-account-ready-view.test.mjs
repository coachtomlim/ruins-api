import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAccountReadyView} from '../public/flare-s8b/account-ready-view.mjs';

test('account ready view shows starter effective stats and only club plus shield',()=>{
  const vm=buildAccountReadyView({goldBalance:20,savedGoalLabel:'Tom target 60% HP'});
  assert.equal(vm.title,'ACCOUNT READY');
  assert.equal(vm.goldBalance,20);
  assert.deepEqual(vm.runner.stats,{hp:100,attack:12,defense:1});
  const bySlot=Object.fromEntries(vm.gear.map(x=>[x.slot,x]));
  assert.equal(bySlot.weapon.itemName,'Wooden Club');
  assert.equal(bySlot.shield.itemName,'Wooden Shield');
  for(const slot of ['head','chest','hands','legs','feet'])assert.equal(bySlot[slot].equipped,false,slot);
  assert.deepEqual(vm.actions,['BUILD YOUR CHALLENGE','UPGRADE YOUR RUNNER']);
});
