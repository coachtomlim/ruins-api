import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEquipmentCatalog,equipmentItemById} from '../public/flare-s8a/equipment-catalog.mjs';

test('equipment identity does not require a purchase price',()=>{
  const c=normalizeEquipmentCatalog({version:1,items:[{id:'leather-boots',name:'Leather Boots',slot:'feet',modifiers:{defense:1},visual:{avatarLayers:['leather_boots']}}]});
  const boots=equipmentItemById(c,'leather-boots');
  assert.equal(boots.slot,'feet');
  assert.deepEqual(boots.modifiers,{hp:0,attack:0,defense:1});
  assert.deepEqual(boots.visual.avatarLayers,['leather_boots']);
  assert.equal('goldCost' in boots,false);
});

test('equipment catalog rejects invalid slots and duplicate item ids',()=>{
  assert.throws(()=>normalizeEquipmentCatalog({items:[{id:'ring',slot:'ring'}]}));
  assert.throws(()=>normalizeEquipmentCatalog({items:[{id:'x',slot:'feet'},{id:'x',slot:'head'}]}));
});
