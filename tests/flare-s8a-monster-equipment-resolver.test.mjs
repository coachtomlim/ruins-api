import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEquipmentCatalog} from '../public/flare-s8a/equipment-catalog.mjs';
import {createEquippedMonster} from '../public/flare-s8a/monster-equipment-resolver.mjs';

const catalog=normalizeEquipmentCatalog({items:[
  {id:'wooden-club',slot:'weapon',modifiers:{attack:4}},
  {id:'wooden-shield',slot:'shield',modifiers:{defense:1}}
]});

test('monster carrying starter club and shield gets the same item bonuses',()=>{
  const m=createEquippedMonster({monsterId:'training-goblin',baseStats:{hp:30,attack:3,defense:0},equipmentCatalog:catalog,loadout:{weapon:'wooden-club',shield:'wooden-shield'}});
  assert.deepEqual(m.equipmentBonuses,{hp:0,attack:4,defense:1});
  assert.deepEqual(m.effectiveStats,{hp:30,attack:7,defense:1});
});

test('empty monster loadout leaves base stats unchanged',()=>{
  const m=createEquippedMonster({monsterId:'plain',baseStats:{hp:30,attack:5,defense:1},equipmentCatalog:catalog});
  assert.deepEqual(m.effectiveStats,{hp:30,attack:5,defense:1});
});
