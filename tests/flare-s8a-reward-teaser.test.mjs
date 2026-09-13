import test from 'node:test';
import assert from 'node:assert/strict';
import {rewardTeaser,BUILDER_REWARD_TIERS} from '../public/flare-s8a/reward-teaser.mjs';

test('mission reward teaser explains clear-first precision incentive',()=>{
  const vm=rewardTeaser();
  assert.equal(vm.headline,'WIN UP TO 25 GOLD');
  assert.match(vm.body,/must clear/i);
  assert.match(vm.body,/closer/i);
  assert.equal(vm.compact,'CLEAR + HIT THE TARGET = MORE GOLD');
});

test('reward teaser tiers mirror governed builder reward bands',()=>{
  assert.deepEqual(BUILDER_REWARD_TIERS.map(x=>x.gold),[25,20,15,10,5]);
  assert.equal(BUILDER_REWARD_TIERS[0].minScore,100);
  assert.equal(BUILDER_REWARD_TIERS.at(-1).minScore,0);
});
