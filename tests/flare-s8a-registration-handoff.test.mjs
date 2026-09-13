import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRegistrationHandoff,registrationGateCopy} from '../public/flare-s8a/registration-handoff.mjs';

test('registration handoff carries current goal and rewards without claiming persistence',()=>{
  const h=buildRegistrationHandoff({senderName:'Tom',runnerId:'warrior-l3',runnerName:'Tough Warrior',runnerLevel:3,targetHp:60,score:98,heroGold:24,builderGold:20,roomId:'iron-labyrinth-03',encounter:{enemyTypes:['goblin','skeleton','none']},result:{status:'cleared',gold:24}});
  assert.equal(h.version,1);
  assert.equal(h.senderName,'Tom');
  assert.equal(h.goal.targetHp,60);
  assert.deepEqual(h.goalSpec,{goalVersion:1,goalType:'FINISH_HP_PERCENT',payload:{targetHpPercent:60}});
  assert.equal(h.rewardPreview.builderGold,20);
  assert.equal(h.persisted,false);
  assert.equal(h.dungeon.roomId,'iron-labyrinth-03');
  const copy=registrationGateCopy(h);
  assert.equal(copy.title,'CREATE YOUR DUNGEON RUNNER ACCOUNT');
  assert.match(copy.body,/60% goal/);
  assert.match(copy.persistedNotice,/Nothing has been saved yet/);
});

test('handoff has no credentials or auth token fields',()=>{
  const text=JSON.stringify(buildRegistrationHandoff({targetHp:50}));
  assert.doesNotMatch(text,/password|email|token|secret|session/i);
});
