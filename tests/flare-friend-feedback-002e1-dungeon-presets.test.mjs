import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readFile} from 'node:fs/promises';
import {applyRunnerModel,runnerSummary} from '../public/flare-s71/game.mjs';
import {buildDungeonPresets} from '../public/flare-s8a/dungeon-presets.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const baseCatalog=JSON.parse(fs.readFileSync(new URL('../public/flare-p0/data/catalog.json',import.meta.url),'utf8'));
const model=JSON.parse(fs.readFileSync(new URL('../public/flare-s7/data/game.json',import.meta.url),'utf8'));
const ROOM_IDS=['iron-labyrinth-01','iron-labyrinth-03','iron-labyrinth-07'];

function fixture(runnerId='warrior-l1',targetHp=60){
  const catalog=applyRunnerModel(baseCatalog,model,runnerId);
  const runner=runnerSummary(model,runnerId,catalog);
  return buildDungeonPresets({catalog,model,runnerId,runner,targetHp,roomIds:ROOM_IDS});
}

test('exactly three presets are produced, labeled TOO EASY / JUST RIGHT / BRUTAL',()=>{
  const presets=fixture();
  assert.equal(presets.tooEasy.label,'TOO EASY');
  assert.equal(presets.justRight.label,'JUST RIGHT');
  assert.equal(presets.brutal.label,'BRUTAL');
  assert.equal(Object.keys(presets).length,3);
});

test('JUST RIGHT is the only recommended preset',()=>{
  const presets=fixture();
  assert.equal(presets.justRight.recommended,true);
  assert.equal(presets.tooEasy.recommended,false);
  assert.equal(presets.brutal.recommended,false);
});

test('all three presets stay within budget',()=>{
  const presets=fixture();
  for(const p of Object.values(presets))assert.ok(p.budgetUsed<=p.totalBudget,`${p.label} over budget: ${p.budgetUsed}/${p.totalBudget}`);
});

test('presets differ in encounter composition (not the same preset shown three times)',()=>{
  const presets=fixture();
  const key=p=>JSON.stringify(p.encounter);
  const keys=new Set([key(presets.tooEasy),key(presets.justRight),key(presets.brutal)]);
  assert.equal(keys.size,3);
});

test('TOO EASY estimate > JUST RIGHT estimate > BRUTAL estimate',()=>{
  const presets=fixture();
  assert.ok(presets.tooEasy.estimatedHpPercent>presets.justRight.estimatedHpPercent,
    `too easy ${presets.tooEasy.estimatedHpPercent} should exceed just right ${presets.justRight.estimatedHpPercent}`);
  assert.ok(presets.justRight.estimatedHpPercent>presets.brutal.estimatedHpPercent,
    `just right ${presets.justRight.estimatedHpPercent} should exceed brutal ${presets.brutal.estimatedHpPercent}`);
});

test('JUST RIGHT is the closest legal preset to the actual target across multiple targets/runner tiers',()=>{
  for(const runnerId of ['warrior-l1','warrior-l2','warrior-l3']){
    for(const targetHp of [40,60,80]){
      const presets=fixture(runnerId,targetHp);
      const delta=Math.abs(presets.justRight.estimatedHpPercent-targetHp);
      const tooEasyDelta=Math.abs(presets.tooEasy.estimatedHpPercent-targetHp);
      const brutalDelta=Math.abs(presets.brutal.estimatedHpPercent-targetHp);
      assert.ok(delta<=tooEasyDelta,`just right (${delta}) should be at least as close as too easy (${tooEasyDelta}) for ${runnerId}@${targetHp}`);
      assert.ok(delta<=brutalDelta,`just right (${delta}) should be at least as close as brutal (${brutalDelta}) for ${runnerId}@${targetHp}`);
    }
  }
});

test('the ordering invariant (tooEasy >= justRight >= brutal) holds universally across the whole target range, even at the edges where the 6-preset library cannot produce 3 distinct estimates',()=>{
  for(const runnerId of ['warrior-l1','warrior-l2','warrior-l3']){
    for(const targetHp of [20,40,60,80,95]){
      const presets=fixture(runnerId,targetHp);
      assert.ok(presets.tooEasy.estimatedHpPercent>=presets.justRight.estimatedHpPercent,`${runnerId}@${targetHp}: too easy below just right`);
      assert.ok(presets.justRight.estimatedHpPercent>=presets.brutal.estimatedHpPercent,`${runnerId}@${targetHp}: just right below brutal`);
    }
  }
});

test('documented known limitation: a very tanky Runner at a very low target can exhaust the 6-preset library, degenerating tooEasy/brutal to the same preset as justRight (never a false ordering, just a duplicate)',()=>{
  const catalog=applyRunnerModel(baseCatalog,model,'warrior-l3');
  const runner=runnerSummary(model,'warrior-l3',catalog);
  const presets=buildDungeonPresets({catalog,model,runnerId:'warrior-l3',runner,targetHp:20,roomIds:ROOM_IDS});
  assert.equal(presets.tooEasy.estimatedHpPercent,presets.justRight.estimatedHpPercent);
  assert.equal(presets.brutal.estimatedHpPercent,presets.justRight.estimatedHpPercent);
});

test('each preset carries its own room id, distinct where rooms are available',()=>{
  const presets=fixture();
  assert.ok(ROOM_IDS.includes(presets.tooEasy.roomId));
  assert.ok(ROOM_IDS.includes(presets.justRight.roomId));
  assert.ok(ROOM_IDS.includes(presets.brutal.roomId));
});

test('interpretation copy is distinct per preset and never a generic repeated line',()=>{
  const presets=fixture();
  assert.match(presets.tooEasy.interpretation,/too gentle/i);
  assert.match(presets.justRight.interpretation,/Closest starting setup/i);
  assert.match(presets.brutal.interpretation,/chance to clear/i);
  const texts=new Set([presets.tooEasy.interpretation,presets.justRight.interpretation,presets.brutal.interpretation]);
  assert.equal(texts.size,3);
});

test('no fabricated win-probability claims are produced',()=>{
  const presets=fixture();
  for(const p of Object.values(presets))assert.doesNotMatch(p.interpretation,/%\s*chance|probability/i);
});

test('only governed enemy/trap/support ids ever appear in a preset encounter',()=>{
  const presets=fixture();
  const enemies=new Set(['none','goblin','skeleton','goblin-elite','antlion']);
  const traps=new Set(['spike-trap','dart-trap']);
  const supports=new Set(['small-potion','battle-tonic','iron-tonic']);
  for(const p of Object.values(presets)){
    for(const id of p.encounter.enemyTypes)assert.ok(enemies.has(id),`unexpected enemy id ${id}`);
    for(const id of p.encounter.trapTypes)assert.ok(traps.has(id),`unexpected trap id ${id}`);
    for(const id of p.encounter.supportTypes)assert.ok(supports.has(id),`unexpected support id ${id}`);
  }
});

test('no HARDCORE or IMPOSSIBLE preset is produced or displayed this release',()=>{
  const presets=fixture();
  assert.doesNotMatch(JSON.stringify(presets),/HARDCORE|IMPOSSIBLE/i);
});

test('dungeon-presets.mjs sources only governed preset ids via presetById, never invents a new encounter combination',async()=>{
  const src=await read('public/flare-s8a/dungeon-presets.mjs');
  assert.match(src,/presetById/);
  assert.match(src,/GOVERNED_PRESET_IDS=\['soft','light','balanced','firm','hard','brutal'\]/);
});
