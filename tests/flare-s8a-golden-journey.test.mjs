import test from 'node:test';
import assert from 'node:assert/strict';
import {buildInvitationViewModel} from '../public/flare-s8a/invitation-view-model.mjs';
import {buildMissionViewModel} from '../public/flare-s8a/mission-view-model.mjs';
import {buildReadyViewModel} from '../public/flare-s8a/ready-view-model.mjs';
import {buildResultViewModel} from '../public/flare-s8a/result-view-model.mjs';
import {buildRegistrationHandoff} from '../public/flare-s8a/registration-handoff.mjs';
import {buildRegistrationViewModel} from '../public/flare-s8a/registration-view-model.mjs';

test('golden L3 60 receiver journey keeps one coherent product story',()=>{
  const invitation=buildInvitationViewModel({sender:'Tom',runnerName:'Tough Warrior',runnerLevel:3,targetHp:60});
  assert.equal(invitation.title,'DUNGEON RUNNER');
  assert.equal(invitation.primaryAction,'ACCEPT CHALLENGE');

  const mission=buildMissionViewModel({targetHp:60,sender:'Tom',roomName:'Pillar Court',roomIndex:0,roomCount:6,estimatedHpPercent:60.8});
  assert.equal(mission.title,'GET THE HERO TO THE EXIT AT ~60% HP');
  assert.equal(mission.rewardCue,'CLEAR NEAR 60% HP · WIN UP TO 25 GOLD');
  assert.equal(mission.targetFit.label,'CLOSE TO TARGET');

  const ready=buildReadyViewModel({targetHp:60,roomName:'Pillar Court',usedBudget:100,totalBudget:100,estimatedHpPercent:60.8,monsters:['Skeleton','Skeleton','Goblin'],traps:['Spike Trap'],supports:[]});
  assert.equal(ready.primaryAction,'RUN THE HERO');
  assert.equal(ready.budget.primary,'DUNGEON BUDGET 100 / 100');

  const result={status:'cleared',hp:73,maxHp:120,gold:24};
  const rewards=buildResultViewModel({result,score:98,targetHp:60,senderName:'Tom'});
  assert.equal(rewards.cleared,true);
  assert.equal(rewards.heroReward.gold,24);
  assert.equal(rewards.builderReward.gold,20);
  assert.ok(Math.abs(rewards.actualHpPercent-60.833333333333336)<0.000001);

  const handoff=buildRegistrationHandoff({senderName:'Tom',runnerId:'warrior-l3',runnerName:'Tough Warrior',runnerLevel:3,targetHp:60,score:98,heroGold:24,builderGold:20,roomId:'iron-labyrinth-01',encounter:{enemyTypes:['skeleton','skeleton','goblin'],supportTypes:[],trapTypes:['spike-trap']},result});
  const registration=buildRegistrationViewModel(handoff);
  assert.equal(registration.title,'CREATE YOUR DUNGEON RUNNER ACCOUNT');
  assert.equal(registration.persisted,false);
  assert.equal(registration.accountAction.enabled,false);
  assert.match(registration.notSaved,/Nothing has been saved yet/i);
});
