import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEquipmentInventoryItem,groupInventoryBySlot} from '../public/flare-s8a/equipment-inventory-view.mjs';

test('equipment inventory item shows slot and stat effect',()=>{
  const vm=buildEquipmentInventoryItem({item:{id:'leather-boots',name:'Leather Boots',slot:'feet',modifiers:{defense:1}},source:'DROP',equipped:false});
  assert.equal(vm.slotLabel,'FOOTWEAR');
  assert.deepEqual(vm.effects,['+1 DEF']);
  assert.equal(vm.action,'EQUIP');
});

test('inventory groups owned equipment into governed slots',()=>{
  const grouped=groupInventoryBySlot([{item:{id:'club',slot:'weapon',modifiers:{attack:4}},source:'STARTER',equipped:true},{item:{id:'boots',slot:'feet',modifiers:{defense:1}},source:'DROP'}]);
  assert.equal(grouped.weapon.length,1);
  assert.equal(grouped.feet.length,1);
  assert.equal(grouped.head.length,0);
});
