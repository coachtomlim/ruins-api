import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunnerSnapshot} from '../public/flare-s8a/runner-snapshot.mjs';
import {createChallengeEnvelope} from '../public/flare-s8b/challenge-envelope.mjs';

test('persistent challenge captures immutable Runner stats and every equipped gear slot',()=>{
  const progression={statBonuses:{hp:10},equipment:{weapon:{id:'wooden-club',slot:'weapon',modifiers:{attack:4}},shield:{id:'wooden-shield',slot:'shield',modifiers:{defense:1}},feet:{id:'boots-1',slot:'feet',modifiers:{hp:5,defense:1}}}};
  const snapshot=createRunnerSnapshot({runnerId:'r1',runnerName:'Warrior',runnerLevel:1,baseRunner:{hp:100,attack:8,defense:0},progression,rulesVersion:'rv',contentVersion:'cv'});
  const env=createChallengeEnvelope({senderPlayerId:'p1',runnerSnapshot:snapshot,targetHp:60});
  assert.equal(env.senderPlayerId,'p1');
  assert.equal(env.targetHp,60);
  assert.deepEqual(env.runnerSnapshot.stats,{hp:115,attack:12,defense:2});
  assert.equal(env.runnerSnapshot.equipment.weapon.id,'wooden-club');
  assert.equal(env.runnerSnapshot.equipment.shield.id,'wooden-shield');
  assert.equal(env.runnerSnapshot.equipment.feet.id,'boots-1');
  progression.equipment.feet.modifiers.defense=9;
  assert.equal(env.runnerSnapshot.stats.defense,2);
  const serialized=JSON.stringify(env);
  assert.doesNotMatch(serialized,/roomId|enemyTypes|trapTypes|supportTypes|encounter/);
});

test('persistent challenge rejects invalid target or missing sender ownership context',()=>{
  const snapshot={runnerId:'r',stats:{hp:100,attack:10,defense:1}};
  assert.throws(()=>createChallengeEnvelope({runnerSnapshot:snapshot,targetHp:50}));
  assert.throws(()=>createChallengeEnvelope({senderPlayerId:'p1',runnerSnapshot:snapshot,targetHp:52}));
});
