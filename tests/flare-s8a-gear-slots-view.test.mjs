import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGearSlotsView} from '../public/flare-s8a/gear-slots-view.mjs';

test('starter gear view shows club and shield plus intentionally empty armor slots',()=>{
  const slots=buildGearSlotsView({loadout:{weapon:'wooden-club',shield:'wooden-shield'},itemsById:{'wooden-club':{name:'Wooden Club'},'wooden-shield':{name:'Wooden Shield'}}});
  const bySlot=Object.fromEntries(slots.map(x=>[x.slot,x]));
  assert.equal(bySlot.weapon.itemName,'Wooden Club');
  assert.equal(bySlot.shield.itemName,'Wooden Shield');
  for(const slot of ['head','chest','hands','legs','feet']){
    assert.equal(bySlot[slot].equipped,false);
    assert.equal(bySlot[slot].emptyLabel,'EMPTY — FIND YOUR FIRST PIECE');
  }
});

test('acquired armor fills only its own slot',()=>{
  const slots=buildGearSlotsView({loadout:{weapon:'wooden-club',shield:'wooden-shield',feet:'boots-1'},itemsById:{'boots-1':{name:'Chain Boots'}}});
  const bySlot=Object.fromEntries(slots.map(x=>[x.slot,x]));
  assert.equal(bySlot.feet.itemName,'Chain Boots');
  assert.equal(bySlot.head.equipped,false);
});
