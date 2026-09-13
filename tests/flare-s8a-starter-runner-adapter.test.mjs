import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decomposeLegacyRunnerForStarterGear} from '../public/flare-s8a/starter-runner-adapter.mjs';

const model=JSON.parse(fs.readFileSync(new URL('../public/flare-s7/data/game.json',import.meta.url),'utf8'));

test('all three legacy demo Runners preserve effective stats when Club and Shield become explicit',()=>{
  const expected={
    'warrior-l1':{hp:100,attack:12,defense:1,baseDefense:0},
    'warrior-l2':{hp:110,attack:13,defense:2,baseDefense:1},
    'warrior-l3':{hp:120,attack:14,defense:3,baseDefense:2}
  };
  for(const [id,e] of Object.entries(expected)){
    const d=decomposeLegacyRunnerForStarterGear(model.runners[id]);
    assert.deepEqual(d.effective,{hp:e.hp,attack:e.attack,defense:e.defense},id);
    assert.equal(d.base.defense,e.baseDefense,id);
    assert.equal(d.progression.equipment.weapon.id,'wooden-club');
    assert.equal(d.progression.equipment.shield.id,'wooden-shield');
  }
});

test('armor piece slots remain empty in S8A starter decomposition',()=>{
  const d=decomposeLegacyRunnerForStarterGear(model.runners['warrior-l1']);
  for(const slot of ['head','chest','hands','legs','feet'])assert.equal(d.progression.equipment[slot],null,slot);
});
