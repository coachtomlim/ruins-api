import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunnerSnapshot,challengeRunnerSnapshot} from '../public/flare-s8a/runner-snapshot.mjs';

test('runner snapshot composes base training weapon and armor exactly once',()=>{
  const snap=createRunnerSnapshot({
    runnerId:'runner-1',runnerName:'My Warrior',runnerLevel:2,
    baseRunner:{hp:100,attack:12,defense:1},
    progression:{statBonuses:{hp:10,attack:1,defense:1},weapon:{id:'weapon-a',slot:'weapon',modifiers:{attack:3}},armor:{id:'armor-a',slot:'armor',modifiers:{hp:5,defense:2}}},
    rulesVersion:'rules-1',contentVersion:'content-1'
  });
  assert.deepEqual(snap.stats,{hp:115,attack:16,defense:4});
  assert.equal(snap.equipment.weapon.id,'weapon-a');
  assert.equal(snap.equipment.armor.id,'armor-a');
});

test('challenge runner snapshot is detached from later progression mutation',()=>{
  const progression={statBonuses:{hp:10},weapon:{id:'club',slot:'weapon',modifiers:{attack:2}}};
  const first=createRunnerSnapshot({runnerId:'r',baseRunner:{hp:100,attack:10,defense:1},progression});
  const challenge=challengeRunnerSnapshot(first);
  progression.statBonuses.hp=40;
  progression.weapon.modifiers.attack=9;
  assert.deepEqual(challenge.stats,{hp:110,attack:12,defense:1});
});

test('snapshot rejects missing identity and invalid stats',()=>{
  assert.throws(()=>createRunnerSnapshot({baseRunner:{hp:100,attack:10,defense:1}}));
  assert.throws(()=>createRunnerSnapshot({runnerId:'r',baseRunner:{hp:-1,attack:10,defense:1}}));
});
