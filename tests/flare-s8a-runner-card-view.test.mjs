import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildRunnerCardView} from '../public/flare-s8a/runner-card-view.mjs';

const model=JSON.parse(fs.readFileSync(new URL('../public/flare-s7/data/game.json',import.meta.url),'utf8'));

test('Rookie Runner card shows Club attack and Wooden Shield defense explicitly',()=>{
  const vm=buildRunnerCardView(model.runners['warrior-l1']);
  assert.deepEqual(vm.stats,{hp:100,attack:12,defense:1});
  assert.equal(vm.breakdown.attack,'8 base + 4 Club');
  assert.equal(vm.breakdown.defense,'0 base + 1 Wooden Shield');
  assert.deepEqual(vm.equipment.map(x=>x.name),['Wooden Club','Wooden Shield']);
});

test('legacy higher demo Runner cards preserve accepted effective totals',()=>{
  assert.deepEqual(buildRunnerCardView(model.runners['warrior-l2']).stats,{hp:110,attack:13,defense:2});
  assert.deepEqual(buildRunnerCardView(model.runners['warrior-l3']).stats,{hp:120,attack:14,defense:3});
});
