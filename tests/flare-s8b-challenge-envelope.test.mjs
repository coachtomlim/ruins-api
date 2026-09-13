import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunnerSnapshot} from '../public/flare-s8a/runner-snapshot.mjs';
import {createChallengeEnvelope} from '../public/flare-s8b/challenge-envelope.mjs';

test('persistent challenge captures sender target and immutable progressed Runner only',()=>{
  const snapshot=createRunnerSnapshot({runnerId:'r1',runnerName:'Warrior',runnerLevel:2,baseRunner:{hp:100,attack:12,defense:1},progression:{statBonuses:{hp:10},weapon:{id:'blade',slot:'weapon',modifiers:{attack:3}}},rulesVersion:'rv',contentVersion:'cv'});
  const env=createChallengeEnvelope({senderPlayerId:'p1',runnerSnapshot:snapshot,targetHp:60});
  assert.equal(env.senderPlayerId,'p1');
  assert.equal(env.targetHp,60);
  assert.deepEqual(env.runnerSnapshot.stats,{hp:110,attack:15,defense:1});
  const serialized=JSON.stringify(env);
  assert.doesNotMatch(serialized,/roomId|enemyTypes|trapTypes|supportTypes|encounter/);
});

test('persistent challenge rejects invalid target or missing sender ownership context',()=>{
  const snapshot={runnerId:'r',stats:{hp:100,attack:10,defense:1}};
  assert.throws(()=>createChallengeEnvelope({runnerSnapshot:snapshot,targetHp:50}));
  assert.throws(()=>createChallengeEnvelope({senderPlayerId:'p1',runnerSnapshot:snapshot,targetHp:52}));
});
