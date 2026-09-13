import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyRunnerModel,runnerSummary} from '../public/flare-s7/game.mjs';
import {createRunnerSnapshot} from '../public/flare-s8a/runner-snapshot.mjs';
import {assessProgressionChallengeability} from '../public/flare-s8a/progression-feasibility.mjs';

const base=JSON.parse(fs.readFileSync(new URL('../public/flare-p0/data/catalog.json',import.meta.url),'utf8'));
const model=JSON.parse(fs.readFileSync(new URL('../public/flare-s7/data/game.json',import.meta.url),'utf8'));
function snapshot(progress={}){const id='warrior-l3',catalog=applyRunnerModel(base,model,id),runner=runnerSummary(model,id,catalog);return{catalog,snap:createRunnerSnapshot({runnerId:id,runnerName:runner.name,runnerLevel:runner.level,baseRunner:{hp:runner.hp,attack:runner.attack,defense:runner.defense},progression:progress})};}

test('accepted L3/60 baseline remains credible to the calibration heuristic',()=>{
  const {catalog,snap}=snapshot();
  const a=assessProgressionChallengeability({catalog,model,runnerSnapshot:snap,targetHp:60,budget:100,tolerance:15});
  assert.equal(a.credible,true);
  assert.ok(a.cost<=100);
});

test('extreme future progression can be detected as exceeding current challengeability envelope',()=>{
  const {catalog,snap}=snapshot({statBonuses:{hp:200,attack:15,defense:7}});
  const a=assessProgressionChallengeability({catalog,model,runnerSnapshot:snap,targetHp:60,budget:100,tolerance:15});
  assert.equal(a.credible,false);
  assert.ok(a.delta>15);
});
