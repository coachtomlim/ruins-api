import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunnerSnapshot} from '../public/flare-s8a/runner-snapshot.mjs';
import {calibrationRunnerFromSnapshot,progressionCalibrationKey} from '../public/flare-s8a/runner-calibration.mjs';

test('progressed runner snapshot exposes effective stats to calibration',()=>{
  const snap=createRunnerSnapshot({runnerId:'r1',runnerName:'Warrior',runnerLevel:2,baseRunner:{hp:100,attack:12,defense:1},progression:{statBonuses:{hp:10},weapon:{id:'blade',slot:'weapon',modifiers:{attack:3}},armor:{id:'mail',slot:'armor',modifiers:{defense:2}}},rulesVersion:'rv',contentVersion:'cv'});
  const r=calibrationRunnerFromSnapshot(snap);
  assert.deepEqual({hp:r.hp,attack:r.attack,defense:r.defense},{hp:110,attack:15,defense:3});
  assert.match(progressionCalibrationKey(snap),/r1\|110\|15\|3/);
});

test('calibration adapter rejects missing or invalid snapshot data',()=>{
  assert.throws(()=>calibrationRunnerFromSnapshot({}));
  assert.throws(()=>calibrationRunnerFromSnapshot({runnerId:'r',stats:{hp:-1,attack:1,defense:1}}));
});
