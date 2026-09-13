import test from 'node:test';
import assert from 'node:assert/strict';
import {GOAL_TYPES,createFinishHpGoal,goalTargetHp,plainGoalLabel} from '../public/flare-s8a/goal.mjs';

test('current goal is versioned finish-HP-percent only',()=>{
  const goal=createFinishHpGoal(50);
  assert.deepEqual(goal,{goalVersion:1,goalType:GOAL_TYPES.FINISH_HP_PERCENT,payload:{targetHpPercent:50}});
  assert.equal(goalTargetHp(goal),50);
  assert.equal(plainGoalLabel(goal),'GET THE HERO TO THE EXIT AT ~50% HP');
});

test('invalid and unsupported goals fail closed',()=>{
  for(const value of [0,4,51,100,NaN])assert.throws(()=>createFinishHpGoal(value));
  assert.throws(()=>goalTargetHp({goalVersion:2,goalType:'FINISH_HP_PERCENT',payload:{targetHpPercent:50}}));
  assert.throws(()=>goalTargetHp({goalVersion:1,goalType:'KILL_HERO',payload:{targetHpPercent:50}}));
});
