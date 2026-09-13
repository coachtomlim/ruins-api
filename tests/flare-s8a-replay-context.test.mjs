import test from 'node:test';
import assert from 'node:assert/strict';
import {createReplayContext,replayInputs,editDungeonInputs} from '../public/flare-s8a/replay-context.mjs';

test('run again preserves exact gameplay inputs',()=>{
  const original=createReplayContext({roomId:'iron-labyrinth-18',runnerId:'warrior-l3',targetHp:60,rulesVersion:'s8a',encounter:{enemyTypes:['goblin-elite','antlion','none'],trapTypes:['dart-trap'],supportTypes:['iron-tonic']}});
  assert.deepEqual(replayInputs(original),original);
});

test('edit dungeon returns current room and encounter without resetting',()=>{
  const original=createReplayContext({roomId:'iron-labyrinth-08',runnerId:'warrior-l2',targetHp:55,encounter:{enemyTypes:['goblin','skeleton','none'],trapTypes:[],supportTypes:['small-potion']}});
  assert.deepEqual(editDungeonInputs(original),{roomId:'iron-labyrinth-08',encounter:original.encounter});
});
