import test from 'node:test';
import assert from 'node:assert/strict';
import {buildInvitationViewModel} from '../public/flare-s8a/invitation-view-model.mjs';

test('invitation remains game-like, short and sender-specific',()=>{
  const vm=buildInvitationViewModel({sender:'<Tom>',runnerName:'Tough Warrior',runnerLevel:3,targetHp:60});
  assert.equal(vm.title,'DUNGEON RUNNER');
  assert.match(vm.challenge,/Your friend Tom has challenged you/);
  assert.match(vm.timePromise,/30 seconds/);
  assert.equal(vm.runnerLabel,'Level 3 Tough Warrior');
  assert.equal(vm.targetLabel,'Target 60% HP');
  assert.equal(vm.heroAnimation,'stance');
  assert.equal(vm.primaryAction,'ACCEPT CHALLENGE');
});
