import test from 'node:test';
import assert from 'node:assert/strict';
import {monsterCombatStats} from '../public/flare-s8a/combatant-equipment.mjs';

test('monster item bonuses use the same stat composition rule as runners',()=>{
  const stats=monsterCombatStats({
    baseStats:{hp:30,attack:3,defense:0},
    equipment:{
      weapon:{id:'wooden-club',slot:'weapon',modifiers:{attack:4}},
      shield:{id:'wooden-shield',slot:'shield',modifiers:{defense:1}}
    }
  });
  assert.deepEqual({hp:stats.hp,attack:stats.attack,defense:stats.defense},{hp:30,attack:7,defense:1});
  assert.deepEqual(stats.equipmentBonuses,{hp:0,attack:4,defense:1});
});

test('monster without equipment receives no hidden equipment bonus',()=>{
  const stats=monsterCombatStats({baseStats:{hp:45,attack:7,defense:2}});
  assert.deepEqual({hp:stats.hp,attack:stats.attack,defense:stats.defense},{hp:45,attack:7,defense:2});
});
