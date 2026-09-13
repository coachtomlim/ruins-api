import test from 'node:test';
import assert from 'node:assert/strict';
import {applyRunnerProgression,normalizeOwnedEquipment,runnerProgressionPurpose,RUNNER_EQUIPMENT_SLOTS} from '../public/flare-s8a/runner-progression.mjs';

test('runner progression combines training, weapon, shield and individual armor pieces exactly once',()=>{
  const effective=applyRunnerProgression(
    {hp:100,attack:8,defense:0},
    {
      statBonuses:{hp:10,attack:1,defense:1},
      equipment:{
        weapon:{id:'club-test',slot:'weapon',modifiers:{attack:4}},
        shield:{id:'shield-test',slot:'shield',modifiers:{defense:1}},
        head:{id:'helm-test',slot:'head',modifiers:{hp:5,defense:2}}
      }
    }
  );
  assert.equal(effective.hp,115);
  assert.equal(effective.attack,13);
  assert.equal(effective.defense,4);
  assert.equal(effective.equipment.weapon.id,'club-test');
  assert.equal(effective.equipment.shield.id,'shield-test');
  assert.equal(effective.equipment.head.id,'helm-test');
});

test('starter equipment slots include shield and piece-by-piece armor',()=>{
  assert.deepEqual(RUNNER_EQUIPMENT_SLOTS,['weapon','shield','head','chest','hands','legs','feet']);
});

test('unequipped assets cannot affect runner stats',()=>{
  const effective=applyRunnerProgression({hp:100,attack:8,defense:0},{statBonuses:{}});
  assert.deepEqual({hp:effective.hp,attack:effective.attack,defense:effective.defense},{hp:100,attack:8,defense:0});
});

test('equipment slot mismatch and invalid progression values fail closed',()=>{
  assert.throws(()=>normalizeOwnedEquipment({id:'shield-x',slot:'shield',modifiers:{defense:1}},'weapon'));
  assert.throws(()=>applyRunnerProgression({hp:100,attack:8,defense:0},{statBonuses:{attack:-1}}));
});

test('gold purpose is explicit and separate from dungeon budget',()=>{
  const purpose=runnerProgressionPurpose();
  assert.equal(purpose.currency,'GOLD');
  assert.equal(purpose.headline,'USE GOLD TO UPGRADE YOUR RUNNER');
  assert.deepEqual(purpose.categories,['Stats','Equipment','Armor']);
});
