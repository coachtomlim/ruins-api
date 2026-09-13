import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgressionCatalog} from '../public/flare-s8a/progression-catalog.mjs';

test('progression catalog supports stat, weapon and armor offers without locking prices here',()=>{
  const c=normalizeProgressionCatalog({version:1,statUpgrades:[{id:'hp-1',stat:'hp',amount:10,goldCost:1,tier:1}],equipment:[{id:'sword-a',slot:'weapon',name:'Sword A',goldCost:1,modifiers:{attack:2}},{id:'armor-a',slot:'armor',name:'Armor A',goldCost:1,modifiers:{defense:2,hp:5}}]});
  assert.equal(c.statUpgrades[0].stat,'hp');
  assert.equal(c.equipment[0].slot,'weapon');
  assert.equal(c.equipment[1].slot,'armor');
});

test('catalog rejects duplicate ids, unsupported slots and non-positive costs',()=>{
  assert.throws(()=>normalizeProgressionCatalog({statUpgrades:[{id:'x',stat:'hp',amount:10,goldCost:1},{id:'x',stat:'attack',amount:1,goldCost:1}]}));
  assert.throws(()=>normalizeProgressionCatalog({equipment:[{id:'x',slot:'ring',goldCost:1}]}));
  assert.throws(()=>normalizeProgressionCatalog({equipment:[{id:'x',slot:'weapon',goldCost:0}]}));
});
