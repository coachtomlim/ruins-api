import test from 'node:test';
import assert from 'node:assert/strict';
import {createReceiverSession,selectDungeon,setEncounter,advanceReceiver} from '../public/flare-s8a/receiver-session.mjs';
import {JOURNEY_STATES} from '../public/flare-s8a/journey.mjs';

test('novice receiver session preserves room and encounter through run and rewards',()=>{
  let s=createReceiverSession({invite:{runnerId:'warrior-l3',targetHp:60},senderName:'Tom'});
  s=advanceReceiver(s,'ACCEPT');
  s=selectDungeon(s,'iron-labyrinth-18');
  s=advanceReceiver(s,'USE_DUNGEON');
  s=setEncounter(s,{enemyTypes:['skeleton','skeleton','goblin'],supportTypes:[],trapTypes:['spike-trap']});
  s=advanceReceiver(s,'RUN');
  s=advanceReceiver(s,'COMPLETE',{result:{status:'cleared',gold:24,hp:73,maxHp:120},score:98});
  assert.equal(s.journey,JOURNEY_STATES.REWARDS);
  assert.equal(s.roomId,'iron-labyrinth-18');
  assert.deepEqual(s.encounter.enemyTypes,['skeleton','skeleton','goblin']);
  assert.equal(s.reward.heroGold,24);
  assert.equal(s.reward.builderGold,20);
  assert.equal(s.persisted,false);
});

test('run again clears only terminal result and preserves deterministic inputs',()=>{
  let s=createReceiverSession({invite:{runnerId:'warrior-l3',targetHp:60}});
  s=advanceReceiver(s,'ACCEPT');s=selectDungeon(s,'iron-labyrinth-01');s=advanceReceiver(s,'USE_DUNGEON');
  s=setEncounter(s,{enemyTypes:['goblin','skeleton','none'],supportTypes:['small-potion'],trapTypes:[]});
  s=advanceReceiver(s,'RUN');s=advanceReceiver(s,'COMPLETE',{result:{status:'cleared',gold:18},score:80});
  const before=JSON.stringify({roomId:s.roomId,encounter:s.encounter,invite:s.invite});
  s=advanceReceiver(s,'RUN_AGAIN');
  assert.equal(s.journey,JOURNEY_STATES.RUNTIME);
  assert.equal(JSON.stringify({roomId:s.roomId,encounter:s.encounter,invite:s.invite}),before);
  assert.equal(s.lastResult,null);assert.equal(s.reward,null);
});

test('edit dungeon and registration transitions preserve context without persistence',()=>{
  let s=createReceiverSession({invite:{runnerId:'warrior-l1',targetHp:50}});
  s=advanceReceiver(s,'ACCEPT');s=selectDungeon(s,'iron-labyrinth-03');s=advanceReceiver(s,'USE_DUNGEON');s=advanceReceiver(s,'RUN');
  s=advanceReceiver(s,'COMPLETE',{result:{status:'cleared',gold:9},score:76});
  const reward=s.reward;
  s=advanceReceiver(s,'EDIT_DUNGEON');assert.equal(s.journey,JOURNEY_STATES.CUSTOMIZE);
  s=advanceReceiver(s,'RUN');s=advanceReceiver(s,'COMPLETE',{result:{status:'cleared',gold:9},score:76});
  s=advanceReceiver(s,'SAVE_GOAL');assert.equal(s.journey,JOURNEY_STATES.REGISTRATION);assert.equal(s.persisted,false);assert.deepEqual(s.reward,reward);
});

test('receiver session fails closed when run or result prerequisites are missing',()=>{
  let s=createReceiverSession();
  s=advanceReceiver(s,'ACCEPT');
  assert.throws(()=>advanceReceiver(s,'USE_DUNGEON'));
  assert.throws(()=>advanceReceiver(s,'COMPLETE',{result:{status:'cleared'},score:98}));
});
