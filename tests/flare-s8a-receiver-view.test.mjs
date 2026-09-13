import test from 'node:test';
import assert from 'node:assert/strict';
import {createReceiverSession,selectDungeon,setEncounter,advanceReceiver} from '../public/flare-s8a/receiver-session.mjs';
import {buildReceiverView} from '../public/flare-s8a/receiver-view.mjs';

test('receiver presenter maps invitation and mission to exact mobile models',()=>{
  let s=createReceiverSession({invite:{runnerId:'warrior-l3',targetHp:60},senderName:'Tom'});
  let view=buildReceiverView({session:s,context:{runnerName:'Tough Warrior',runnerLevel:3}});
  assert.equal(view.kind,'invitation');assert.equal(view.model.title,'DUNGEON RUNNER');
  s=advanceReceiver(s,'ACCEPT');
  view=buildReceiverView({session:s,context:{roomName:'Pillar Court',roomIndex:0,roomCount:6,estimatedHpPercent:60.8}});
  assert.equal(view.kind,'mission');assert.equal(view.model.title,'GET THE HERO TO THE EXIT AT ~60% HP');
});

test('receiver presenter carries a completed run into rewards and registration',()=>{
  let s=createReceiverSession({invite:{runnerId:'warrior-l3',targetHp:60},senderName:'Tom'});
  s=advanceReceiver(s,'ACCEPT');s=selectDungeon(s,'iron-labyrinth-01');s=advanceReceiver(s,'USE_DUNGEON');s=setEncounter(s,{enemyTypes:['skeleton','skeleton','goblin'],supportTypes:[],trapTypes:['spike-trap']});s=advanceReceiver(s,'RUN');s=advanceReceiver(s,'COMPLETE',{result:{status:'cleared',hp:73,maxHp:120,gold:24},score:98});
  let view=buildReceiverView({session:s});
  assert.equal(view.kind,'rewards');assert.equal(view.model.builderReward.gold,20);
  s=advanceReceiver(s,'SAVE_GOAL');
  view=buildReceiverView({session:s,context:{runnerName:'Tough Warrior',runnerLevel:3}});
  assert.equal(view.kind,'registration');assert.equal(view.model.targetHp,60);assert.equal(view.model.persisted,false);assert.equal(view.model.accountAction.enabled,false);
});
