import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAccountReadyView,buildAccountReadyViewFromBackend} from '../public/flare-s8b/account-ready-view.mjs';

test('account ready view shows starter effective stats and only club plus shield',()=>{
  const vm=buildAccountReadyView({goldBalance:20,savedGoalLabel:'Tom target 60% HP'});
  assert.equal(vm.title,'ACCOUNT READY');
  assert.equal(vm.goldBalance,20);
  assert.deepEqual(vm.runner.stats,{hp:100,attack:12,defense:1});
  const bySlot=Object.fromEntries(vm.gear.map(x=>[x.slot,x]));
  assert.equal(bySlot.weapon.itemName,'Wooden Club');
  assert.equal(bySlot.shield.itemName,'Wooden Shield');
  for(const slot of ['head','chest','hands','legs','feet'])assert.equal(bySlot[slot].equipped,false,slot);
  assert.deepEqual(vm.actions,['BUILD YOUR CHALLENGE','UPGRADE YOUR RUNNER']);
});

test('backend account ready view derives equipped gear, stats, Gold and goal from authoritative rows',()=>{
  const vm=buildAccountReadyViewFromBackend({
    identity:{id:'player-a',email:'ada@example.test'},
    profile:{id:'player-a',display_name:'Ada'},
    runner:{id:'runner-a',runner_template_id:'warrior-l1',display_name:'Rookie Warrior'},
    ownedEquipment:[
      {id:'own-club',item_id:'wooden-club',slot:'weapon'},
      {id:'own-shield',item_id:'wooden-shield',slot:'shield'}
    ],
    loadout:{player_runner_id:'runner-a',weapon_ownership_id:'own-club',shield_ownership_id:'own-shield',head_ownership_id:null,chest_ownership_id:null,hands_ownership_id:null,legs_ownership_id:null,feet_ownership_id:null},
    savedGoals:[{source_sender_name:'Tom',source_runner_name:'Tough Warrior',target_hp:60}],
    goldBalance:0
  });
  assert.equal(vm.displayName,'Ada');
  assert.equal(vm.email,'ada@example.test');
  assert.equal(vm.goldBalance,0);
  assert.deepEqual(vm.runner.stats,{hp:100,attack:12,defense:1});
  assert.equal(vm.savedGoalLabel,'Tom · Tough Warrior · 60% HP');
  const bySlot=Object.fromEntries(vm.gear.map(row=>[row.slot,row]));
  assert.equal(bySlot.weapon.itemName,'Wooden Club');
  assert.equal(bySlot.shield.itemName,'Wooden Shield');
  for(const slot of ['head','chest','hands','legs','feet'])assert.equal(bySlot[slot].equipped,false,slot);
});

test('backend view fails closed when loadout points at unowned equipment',()=>{
  assert.throws(()=>buildAccountReadyViewFromBackend({
    profile:{display_name:'Ada'},
    runner:{runner_template_id:'warrior-l1'},
    ownedEquipment:[],
    loadout:{weapon_ownership_id:'someone-elses-item'}
  }),/LOADOUT_OWNERSHIP_MISSING/);
});
