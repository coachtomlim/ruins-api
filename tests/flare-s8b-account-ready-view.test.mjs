import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAccountReadyViewFromBackend,normalizeAuthoritativeRunnerState,progressionOfferState,progressionPurchaseMessage} from '../public/flare-s8b/account-ready-view.mjs';

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
    progressionOffers:[
      {catalog_version:'launch',offer_id:'endurance-i',kind:'STAT',stat_key:'hp',stat_amount:5,gold_cost:20},
      {catalog_version:'launch',offer_id:'strike-i',kind:'STAT',stat_key:'attack',stat_amount:1,gold_cost:30}
    ],
    progressionPurchases:[],
    dailyLogin:{reward_day:'2026-09-19',claimed_today:false,current_streak_day:0,next_streak_day:1,claimable_gold:5,next_reset_at:'2026-09-20T00:00:00Z'},
    builderProgression:{total_builder_xp:0,builder_level:1,level_threshold:0,next_level_threshold:20,xp_remaining:20,max_level:false,published_challenges:0},
    builderChallenges:[],
    goldBalance:0
  };
}

test('backend Runner Hub uses authoritative stats and gear without recalculation',()=>{
  const vm=buildAccountReadyViewFromBackend(account());
  assert.equal(vm.displayName,'Ada');
  assert.equal(vm.email,'ada@example.test');
  assert.equal(vm.goldBalance,0);
  assert.equal(vm.dailyLogin.actionLabel,'CLAIM 5 GOLD');
  assert.equal(vm.dailyLogin.streakLabel,'DAY 1 OF 7');
  assert.deepEqual(vm.runner.baseStats,{hp:100,attack:8,defense:0});
  assert.deepEqual(vm.runner.stats,{hp:100,attack:12,defense:1});
  assert.equal(vm.savedGoalLabel,'Tom · Tough Warrior · 60% HP');
  assert.deepEqual(vm.panels,['stats','equipment','armor']);
  assert.equal(vm.equipment[0].label,'MAIN HAND');
  assert.equal(vm.equipment[1].label,'OFF HAND');
  assert.equal(vm.armor.find(row=>row.slot==='hands').label,'HANDS');
  assert.equal(vm.equipment[0].itemName,'Wooden Club');
  assert.equal(vm.equipment[0].modifierLabel,'+4 ATK');
  assert.equal(vm.equipment[1].itemName,'Wooden Shield');
  assert.equal(vm.equipment[1].modifierLabel,'+1 DEF');
  assert.deepEqual(vm.armor.map(row=>row.slot),['head','chest','hands','legs','feet']);
  assert.ok(vm.armor.every(row=>row.equipped===false));
  assert.equal(vm.builderProgression.levelLabel,'BUILDER LEVEL 1');
  assert.equal(vm.builderProgression.xpLabel,'0 / 20 BUILDER XP');
  assert.deepEqual(vm.challengeJournal,[]);
});

test('daily login view is derived from authoritative backend status',()=>{
  const source=account();
  source.dailyLogin={reward_day:'2026-09-19',claimed_today:false,current_streak_day:6,next_streak_day:7,claimable_gold:15,next_reset_at:'2026-09-20T00:00:00Z'};
  const vm=buildAccountReadyViewFromBackend(source);
  assert.equal(vm.dailyLogin.actionLabel,'CLAIM 15 GOLD');
  assert.equal(vm.dailyLogin.streakLabel,'DAY 7 OF 7');
  assert.match(vm.dailyLogin.detail,/\+10 bonus Gold/);
});

test('training actions derive from authoritative Gold and own purchase history',()=>{
  const source=account();source.goldBalance=20;
  source.progressionPurchases=[{player_runner_id:'runner-a',catalog_version:'launch',offer_id:'strike-i'}];
  const vm=buildAccountReadyViewFromBackend(source);
  assert.deepEqual(vm.progressionOffers.map(row=>row.action.state),['available','purchased']);
  assert.equal(progressionOfferState(vm.progressionOffers[0],0).state,'insufficient');
});

test('governed purchase failures map to friendly state without hiding unknown outcomes',()=>{
  assert.equal(progressionPurchaseMessage(new Error('INSUFFICIENT_GOLD')).message,'Not enough Gold for this upgrade.');
  assert.equal(progressionPurchaseMessage(new Error('PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE')).kind,'known');
  assert.equal(progressionPurchaseMessage(new Error('network lost')).kind,'unknown');
  assert.match(progressionPurchaseMessage(new Error('network lost')).message,/uncertain/i);
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


test('Builder journal is mapped from authoritative backend rows',()=>{
  const source=account();
  source.builderProgression={total_builder_xp:20,builder_level:2,level_threshold:20,next_level_threshold:50,xp_remaining:30,max_level:false,published_challenges:2};
  source.builderChallenges=[
    {challenge_id:'c-2',runner_id:'warrior-l1',target_hp:70,invite_code:'Q80e',sender_name:'Ada',created_at:'2026-09-24T02:00:00Z'},
    {challenge_id:'c-1',runner_id:'warrior-l1',target_hp:60,invite_code:'Qs2Z',sender_name:'Ada',created_at:'2026-09-24T01:00:00Z'}
  ];
  const vm=buildAccountReadyViewFromBackend(source);
  assert.equal(vm.builderProgression.levelLabel,'BUILDER LEVEL 2');
  assert.equal(vm.builderProgression.publishedLabel,'2 CHALLENGES PUBLISHED');
  assert.deepEqual(vm.challengeJournal.map(row=>row.targetHp),[70,60]);
  assert.deepEqual(vm.challengeJournal.map(row=>row.inviteCode),['Q80e','Qs2Z']);
});
