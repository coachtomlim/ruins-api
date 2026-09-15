import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const run=()=>spawnSync(process.execPath,['tools/flare-s8b-economy-calibration.mjs'],{encoding:'utf8'});

function calibration(){
  const result=run();
  assert.equal(result.status,0,result.stderr||'calibration tool failed');
  return JSON.parse(result.stdout);
}

function focusByEffective(data,hp,attack,defense){
  return data.focus.find(row=>row.effective.hp===hp&&row.effective.attack===attack&&row.effective.defense===defense);
}

test('calibration enumerates the fixed 100-point S7 challenge space deterministically',()=>{
  const data=calibration();
  assert.equal(data.budget,100);
  assert.deepEqual(data.targets,[20,40,60,80]);
  assert.equal(data.legalEncounterCount,317);
  assert.deepEqual(data.baseline,{hp:100,attack:12,defense:1});
  assert.equal(data.matrix.length,84);
});

test('baseline and bounded early progression remain inside the calibration envelope',()=>{
  const data=calibration();
  assert.equal(focusByEffective(data,100,12,1).band,'PREFERRED');
  assert.equal(focusByEffective(data,120,12,1).band,'PREFERRED');
  assert.equal(focusByEffective(data,100,13,1).band,'PREFERRED');
  assert.equal(focusByEffective(data,100,12,2).band,'PREFERRED');
  assert.equal(focusByEffective(data,100,12,3).band,'EDGE');
});

test('strong combined progression is detected outside the current 100-point envelope',()=>{
  const data=calibration();
  assert.equal(focusByEffective(data,120,13,1).band,'OUTSIDE');
  assert.equal(focusByEffective(data,110,13,2).band,'OUTSIDE');
});
