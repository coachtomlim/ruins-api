import test from 'node:test';
import assert from 'node:assert/strict';
import {STARTER_CLUB,STARTER_SHIELD} from '../public/flare-s8a/starter-loadout.mjs';
import {createMonsterProfile,legacyMonsterProfile} from '../public/flare-s8a/monster-loadout.mjs';

test('monster owning club and shield receives the same governed item bonuses',()=>{
  const m=createMonsterProfile({monsterId:'test-goblin',baseStats:{hp:30,attack:3,defense:0},equipment:{weapon:STARTER_CLUB,shield:STARTER_SHIELD}});
  assert.deepEqual(m.equipmentBonuses,{hp:0,attack:4,defense:1});
  assert.deepEqual(m.effectiveStats,{hp:30,attack:7,defense:1});
});

test('legacy frozen monster stats can remain effective without pretending item decomposition exists',()=>{
  const m=legacyMonsterProfile({monsterId:'legacy-skeleton',effectiveStats:{hp:45,attack:7,defense:2}});
  assert.equal(m.legacyEffective,true);
  assert.deepEqual(m.effectiveStats,{hp:45,attack:7,defense:2});
});
