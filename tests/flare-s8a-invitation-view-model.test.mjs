import test from 'node:test';
import assert from 'node:assert/strict';
import {buildInvitationViewModel} from '../public/flare-s8a/invitation-view-model.mjs';

test('invitation makes the Dungeon Builder precision mission explicit',()=>{
  const vm=buildInvitationViewModel({sender:'<Tom>',runnerName:'Tough Warrior',runnerLevel:3,targetHp:60});
  assert.equal(vm.title,'TOM HAS CHALLENGED YOU');
  assert.equal(vm.role,'YOU ARE THE DUNGEON BUILDER');
  assert.match(vm.challenge,/Choose or tune a dungeon for Tom's Runner/);
  assert.match(vm.targetExplanation,/EXIT with about 60% health remaining/);
  assert.match(vm.targetScale.harsh,/too harsh/);
  assert.match(vm.targetScale.gentle,/too gentle/);
  assert.match(vm.defeatRule,/reward = 0/);
  assert.equal(vm.runnerLabel,'Level 3 Tough Warrior');
  assert.equal(vm.targetLabel,'TARGET: 60% HP');
  assert.equal(vm.heroAnimation,'stance');
  assert.equal(vm.primaryAction,'CHOOSE A DUNGEON');
});
