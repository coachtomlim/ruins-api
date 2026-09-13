import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunnerSnapshot,challengeRunnerSnapshot} from '../public/flare-s8a/runner-snapshot.mjs';

test('snapshot includes weapon shield and individual armor',()=>{
  const snap=createRunnerSnapshot({runnerId:'runner-1',baseRunner:{hp:100,attack:8,defense:0},progression:{statBonuses:{hp:10,attack:1,defense:1},equipment:{weapon:{id:'club',slot:'weapon',modifiers:{attack:3}},shield:{id:'wood-shield',slot:'shield',modifiers:{defense:1}},feet:{id:'boots',slot:'feet',modifiers:{hp:5,defense:1}}}}});
  assert.equal(snap.version,2);
  assert.deepEqual(snap.stats,{hp:115,attack:12,defense:3});
  assert.equal(snap.equipment.weapon.id,'club');
  assert.equal(snap.equipment.shield.id,'wood-shield');
  assert.equal(snap.equipment.feet.id,'boots');
  assert.equal(snap.equipment.head,null);
});

test('challenge snapshot is detached',()=>{
  const progression={statBonuses:{hp:10},equipment:{weapon:{id:'club',slot:'weapon',modifiers:{attack:2}},shield:{id:'wood-shield',slot:'shield',modifiers:{defense:1}}}};
  const first=createRunnerSnapshot({runnerId:'r',baseRunner:{hp:100,attack:10,defense:0},progression});
  const challenge=challengeRunnerSnapshot(first);
  progression.statBonuses.hp=40;
  assert.deepEqual(challenge.stats,{hp:110,attack:12,defense:1});
});

test('invalid snapshot fails closed',()=>{
  assert.throws(()=>createRunnerSnapshot({baseRunner:{hp:100,attack:10,defense:1}}));
});
