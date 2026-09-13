import test from 'node:test';
import assert from 'node:assert/strict';
import {buildResultViewModel} from '../public/flare-s8a/result-view-model.mjs';

test('cleared result builds distinct friend and builder rewards with runner progression purpose',()=>{
  const vm=buildResultViewModel({result:{status:'cleared',gold:24,hp:73,maxHp:120},score:98,targetHp:60,senderName:'Tom'});
  assert.equal(vm.cleared,true);
  assert.equal(vm.outcome,'HERO CLEARED');
  assert.equal(vm.heroReward.gold,24);
  assert.equal(vm.builderReward.gold,20);
  assert.match(vm.heroReward.label,/TOM'S HERO EARNED/);
  assert.equal(vm.actualHpPercent,73/120*100);
  assert.equal(vm.targetHpPercent,60);
  assert.equal(vm.progression.currency,'GOLD');
  assert.equal(vm.progression.headline,'USE GOLD TO UPGRADE YOUR RUNNER');
  assert.match(vm.progression.detail,/Stats/);
  assert.match(vm.progression.detail,/Equipment/);
  assert.match(vm.progression.detail,/Armor/);
  assert.deepEqual(vm.actions,['RUN AGAIN','EDIT THIS DUNGEON','SAVE THIS GOAL & BUILD YOUR OWN']);
});

test('failed result yields zero builder reward',()=>{
  const vm=buildResultViewModel({result:{status:'dead',gold:9,hp:0,maxHp:100},score:100,targetHp:50,senderName:'Buddy'});
  assert.equal(vm.cleared,false);
  assert.equal(vm.outcome,'HERO DID NOT CLEAR');
  assert.equal(vm.builderReward.gold,0);
  assert.equal(vm.heroReward.gold,9);
});
