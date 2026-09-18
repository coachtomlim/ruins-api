import test from 'node:test';
import assert from 'node:assert/strict';
import {createPracticeRunnerSnapshot} from '../public/flare-s8b/practice-runner-snapshot.mjs';

function viewModel(){
  return {
    runner:{
      id:'runner-a',templateId:'warrior-l1',name:'Rookie Warrior',
      progressionVersion:'s8b-1',catalogVersion:'s8b-launch-progression-001',
      baseStats:{hp:100,attack:8,defense:0},
      stats:{hp:105,attack:13,defense:1}
    },
    gear:[
      {slot:'weapon',equipped:true,itemId:'wooden-club',itemName:'Wooden Club',gfx:'club',modifiers:{hp:0,attack:4,defense:0}},
      {slot:'shield',equipped:true,itemId:'wooden-shield',itemName:'Wooden Shield',gfx:'buckler',modifiers:{hp:0,attack:0,defense:1}},
      ...['head','chest','hands','legs','feet'].map(slot=>({slot,equipped:false,itemId:null,itemName:null,gfx:'',modifiers:{hp:0,attack:0,defense:0}}))
    ]
  };
}

test('practice snapshot captures the current authoritative Runner without reward settlement',()=>{
  const snapshot=createPracticeRunnerSnapshot(viewModel());
  assert.equal(snapshot.mode,'PRACTICE');
  assert.equal(snapshot.rewardSettlement,false);
  assert.equal(snapshot.dungeonBudget,100);
  assert.equal(snapshot.playerRunnerId,'runner-a');
  assert.equal(snapshot.runnerName,'Rookie Warrior');
  assert.deepEqual(snapshot.baseStats,{hp:100,attack:8,defense:0});
  assert.deepEqual(snapshot.effectiveStats,{hp:105,attack:13,defense:1});
  assert.equal(snapshot.gear.length,7);
  assert.equal(snapshot.gear[0].itemName,'Wooden Club');
  assert.equal(snapshot.gear[1].itemName,'Wooden Shield');
  assert.ok(snapshot.gear.slice(2).every(row=>row.equipped===false));
  assert.equal(Object.isFrozen(snapshot),true);
});

test('practice snapshot fails closed on missing Runner authority',()=>{
  const missing=viewModel();
  missing.runner={...missing.runner,id:''};
  assert.throws(()=>createPracticeRunnerSnapshot(missing),/PRACTICE_RUNNER_IDENTITY_REQUIRED/);
  const badGear=viewModel();
  badGear.gear=badGear.gear.slice(0,6);
  assert.throws(()=>createPracticeRunnerSnapshot(badGear),/PRACTICE_RUNNER_GEAR_REQUIRED/);
});
