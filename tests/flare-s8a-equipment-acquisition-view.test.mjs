import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEquipmentAcquisitionView} from '../public/flare-s8a/equipment-acquisition-view.mjs';

test('first footwear acquisition is celebrated without assuming purchase or drop source',()=>{
  const vm=buildEquipmentAcquisitionView({item:{id:'boots-1',name:'Chain Boots',slot:'feet',modifiers:{defense:1}},alreadyOwned:false});
  assert.equal(vm.headline,'NEW FOOTWEAR!');
  assert.equal(vm.firstArmorPiece,true);
  assert.deepEqual(vm.effects,['+1 DEF']);
  assert.equal(vm.source,'UNSPECIFIED');
  assert.equal(vm.action,'EQUIP');
});

test('first head gear acquisition is also a piece-by-piece armor moment',()=>{
  const vm=buildEquipmentAcquisitionView({item:{id:'helm-1',name:'Chain Coif',slot:'head',modifiers:{hp:5,defense:1}},source:'REWARD'});
  assert.equal(vm.headline,'NEW HEAD GEAR!');
  assert.deepEqual(vm.effects,['+5 HP','+1 DEF']);
  assert.equal(vm.source,'REWARD');
});

test('existing weapon acquisition stays generic and does not claim first armor',()=>{
  const vm=buildEquipmentAcquisitionView({item:{id:'mace-1',name:'Mace',slot:'weapon',modifiers:{attack:2}},alreadyOwned:false,source:'PURCHASE'});
  assert.equal(vm.firstArmorPiece,false);
  assert.equal(vm.headline,'NEW GEAR!');
});
