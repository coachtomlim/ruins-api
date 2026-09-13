import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgressionCatalog} from '../public/flare-s8a/progression-catalog.mjs';

test('progression catalog supports stat, weapon, shield and individual armor offers',()=>{
  const c=normalizeProgressionCatalog({version:1,statUpgrades:[{id:'hp-1',stat:'hp',amount:10,goldCost:1,tier:1}],equipment:[{id:'club-a',slot:'weapon',name:'Club A',goldCost:1,modifiers:{attack:2},visual:{avatarLayers:['club']}},{id:'shield-a',slot:'shield',name:'Shield A',goldCost:1,modifiers:{defense:1},visual:{avatarLayers:['buckler']}},{id:'boots-a',slot:'feet',name:'Boots A',goldCost:1,modifiers:{defense:1},visual:{avatarLayers:['chain_boots']}}]});
  assert.equal(c.statUpgrades[0].stat,'hp');
  assert.equal(c.equipment[0].slot,'weapon');
  assert.equal(c.equipment[1].slot,'shield');
  assert.equal(c.equipment[2].slot,'feet');
  assert.deepEqual(c.equipment[2].visual.avatarLayers,['chain_boots']);
});

test('catalog rejects duplicate ids, unsupported slots and non-positive costs',()=>{
  assert.throws(()=>normalizeProgressionCatalog({statUpgrades:[{id:'x',stat:'hp',amount:10,goldCost:1},{id:'x',stat:'attack',amount:1,goldCost:1}]}));
  assert.throws(()=>normalizeProgressionCatalog({equipment:[{id:'x',slot:'ring',goldCost:1}]}));
  assert.throws(()=>normalizeProgressionCatalog({equipment:[{id:'x',slot:'weapon',goldCost:0}]}));
});
