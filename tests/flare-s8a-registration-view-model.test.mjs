import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRegistrationViewModel} from '../public/flare-s8a/registration-view-model.mjs';

test('registration view model carries goal and reward preview without persistence claim',()=>{
  const vm=buildRegistrationViewModel({senderName:'Tom',runner:{id:'warrior-l3',name:'Tough Warrior',level:3},goal:{targetHp:60},rewardPreview:{builderGold:20,heroGold:24},persisted:false});
  assert.equal(vm.title,'CREATE YOUR DUNGEON RUNNER ACCOUNT');
  assert.match(vm.carriedGoal,/Tom/);
  assert.match(vm.carriedGoal,/60% HP/);
  assert.equal(vm.runnerLabel,'Level 3 Tough Warrior');
  assert.equal(vm.previewBuilderGold,20);
  assert.equal(vm.previewHeroGold,24);
  assert.equal(vm.persisted,false);
  assert.deepEqual(vm.actions,['CREATE ACCOUNT','BACK TO REWARDS']);
  assert.equal(vm.accountAction.enabled,false);
  assert.match(vm.accountAction.note,/No account or assets are saved yet/i);
});
