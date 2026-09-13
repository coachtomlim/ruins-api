import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyRunnerModel,runnerSummary} from '../public/flare-s7/game.mjs';
import {buildCustomizationCatalog} from '../public/flare-s8a/catalog-view-model.mjs';

const base=JSON.parse(fs.readFileSync(new URL('../public/flare-p0/data/catalog.json',import.meta.url),'utf8'));
const model=JSON.parse(fs.readFileSync(new URL('../public/flare-s7/data/game.json',import.meta.url),'utf8'));

test('mobile catalog exposes exactly four monsters, two traps and three supports',()=>{
  const runnerId='warrior-l3',catalog=applyRunnerModel(base,model,runnerId),runner=runnerSummary(model,runnerId,catalog),vm=buildCustomizationCatalog({model,catalog,runnerId,runner});
  assert.deepEqual(vm.monsters.map(x=>x.id),['goblin','skeleton','goblin-elite','antlion']);
  assert.deepEqual(vm.traps.map(x=>x.id),['spike-trap','dart-trap']);
  assert.deepEqual(vm.supports.map(x=>x.id),['small-potion','battle-tonic','iron-tonic']);
});

test('catalog cards keep costs and concise gameplay effects visible',()=>{
  const runnerId='warrior-l1',catalog=applyRunnerModel(base,model,runnerId),runner=runnerSummary(model,runnerId,catalog),vm=buildCustomizationCatalog({model,catalog,runnerId,runner});
  assert.equal(vm.monsters.find(x=>x.id==='antlion').cost,50);
  assert.match(vm.monsters.find(x=>x.id==='goblin-elite').summary,/HP 55 · ATK 9 · DEF 2/);
  assert.match(vm.traps.find(x=>x.id==='dart-trap').summary,/ignores DEF/);
  assert.equal(vm.supports.find(x=>x.id==='battle-tonic').summary,'+2 ATK');
});
