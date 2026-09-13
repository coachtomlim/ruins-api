import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMissionViewModel} from '../public/flare-s8a/mission-view-model.mjs';

test('mission screen states precision-clear intent and reward incentive',()=>{
  const vm=buildMissionViewModel({targetHp:50,sender:'Tom',roomName:'Pillar Court',roomIndex:0,roomCount:6,estimatedHpPercent:61});
  assert.equal(vm.title,'GET THE HERO TO THE EXIT AT ~50% HP');
  assert.match(vm.incentive,/higher score \+ more gold/i);
  assert.match(vm.warning,/Do not kill the Hero/i);
  assert.equal(vm.rewardCue,'CLEAR NEAR 50% HP · WIN UP TO 25 GOLD');
  assert.equal(vm.actions.primary,'USE THIS DUNGEON');
  assert.equal(vm.actions.secondary,'CUSTOMIZE — OPTIONAL');
  assert.equal(vm.room.label,'1 / 6');
});

test('target-fit messaging gives actionable correction without lethality labels',()=>{
  const gentle=buildMissionViewModel({targetHp:50,estimatedHpPercent:80});
  assert.equal(gentle.targetFit.label,'TOO GENTLE');
  assert.equal(gentle.targetFit.action,'ADD CHALLENGE');
  const harsh=buildMissionViewModel({targetHp:50,estimatedHpPercent:30});
  assert.equal(harsh.targetFit.label,'TOO HARSH');
  assert.equal(harsh.targetFit.action,'EASE DUNGEON');
  for(const vm of [gentle,harsh])assert.doesNotMatch(JSON.stringify(vm.targetFit),/Easy|Fair|Brutal/);
});
