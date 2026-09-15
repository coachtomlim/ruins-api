import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAccountReadyViewFromBackend,normalizeAuthoritativeRunnerState} from '../public/flare-s8b/account-ready-view.mjs';

function runnerState(overrides={}){
  return {
    player_runner_id:'runner-a',runner_template_id:'warrior-l1',runner_name:'Rookie Warrior',
    progression_version:'s8b-1',catalog_version:'s8b-1',
    base_stats:{hp:100,attack:8,defense:0},
    effective_stats:{hp:100,attack:12,defense:1},
    gear:[
      {slot:'weapon',equipped:true,ownership_id:'own-club',item_id:'wooden-club',name:'Wooden Club',modifiers:{hp:0,attack:4,defense:0},catalog_version:'s8b-1',gfx:'club'},
      {slot:'shield',equipped:true,ownership_id:'own-shield',item_id:'wooden-shield',name:'Wooden Shield',modifiers:{hp:0,attack:0,defense:1},catalog_version:'s8b-1',gfx:'buckler'},
      ...['head','chest','hands','legs','feet'].map(slot=>({slot,equipped:false,ownership_id:null,item_id:null,name:null,modifiers:{hp:0,attack:0,defense:0}}))
    ],
    ...overrides
  };
}

function account(state=runnerState()){
  return {
    identity:{id:'player-a',email:'ada@example.test'},
    profile:{id:'player-a',display_name:'Ada'},
    runnerState:state,
    savedGoals:[{source_sender_name:'Tom',source_runner_name:'Tough Warrior',target_hp:60}],
    goldBalance:0
  };
}

test('backend Runner Hub uses authoritative stats and gear without recalculation',()=>{
  const vm=buildAccountReadyViewFromBackend(account());
  assert.equal(vm.displayName,'Ada');
  assert.equal(vm.email,'ada@example.test');
  assert.equal(vm.goldBalance,0);
  assert.deepEqual(vm.runner.baseStats,{hp:100,attack:8,defense:0});
  assert.deepEqual(vm.runner.stats,{hp:100,attack:12,defense:1});
  assert.equal(vm.savedGoalLabel,'Tom · Tough Warrior · 60% HP');
  assert.deepEqual(vm.panels,['stats','equipment','armor']);
  assert.equal(vm.equipment[0].itemName,'Wooden Club');
  assert.equal(vm.equipment[0].modifierLabel,'+4 ATK');
  assert.equal(vm.equipment[1].itemName,'Wooden Shield');
  assert.equal(vm.equipment[1].modifierLabel,'+1 DEF');
  assert.deepEqual(vm.armor.map(row=>row.slot),['head','chest','hands','legs','feet']);
  assert.ok(vm.armor.every(row=>row.equipped===false));
});

test('effective stats are accepted exactly from backend even when they do not match client arithmetic',()=>{
  const state=runnerState({effective_stats:{hp:137,attack:22,defense:9}});
  const vm=buildAccountReadyViewFromBackend(account(state));
  assert.deepEqual(vm.runner.stats,{hp:137,attack:22,defense:9});
});

test('authoritative projection requires exactly seven known unique slots',()=>{
  const missing=runnerState();missing.gear=missing.gear.slice(0,6);
  assert.throws(()=>normalizeAuthoritativeRunnerState(missing),/SEVEN_SLOTS_REQUIRED/);
  const duplicate=runnerState();duplicate.gear=[...duplicate.gear.slice(0,6),{...duplicate.gear[0]}];
  assert.throws(()=>normalizeAuthoritativeRunnerState(duplicate),/GEAR_SLOT_INVALID/);
  const unknown=runnerState();unknown.gear=[...unknown.gear.slice(0,6),{...unknown.gear[6],slot:'cape'}];
  assert.throws(()=>normalizeAuthoritativeRunnerState(unknown),/GEAR_SLOT_INVALID/);
});

test('equipped item without authoritative identity fails closed instead of becoming zero-stat gear',()=>{
  const state=runnerState();
  state.gear=state.gear.map(row=>row.slot==='weapon'?{...row,item_id:'mystery-item',name:null}:row);
  assert.throws(()=>buildAccountReadyViewFromBackend(account(state)),/AUTHORITATIVE_EQUIPPED_ITEM_REQUIRED:weapon/);
});

test('empty slot carrying an ownership identity fails closed',()=>{
  const state=runnerState();
  state.gear=state.gear.map(row=>row.slot==='head'?{...row,ownership_id:'unexpected'}:row);
  assert.throws(()=>buildAccountReadyViewFromBackend(account(state)),/AUTHORITATIVE_EMPTY_SLOT_INVALID:head/);
});

test('invalid authoritative stats fail closed',()=>{
  assert.throws(()=>buildAccountReadyViewFromBackend(account(runnerState({effective_stats:{hp:100,attack:'unknown',defense:1}}))),/INVALID_AUTHORITATIVE_STAT:effective_attack/);
});
