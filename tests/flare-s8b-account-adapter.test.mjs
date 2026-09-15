import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCOUNT_CAPABILITIES,createSupabaseAccountAdapter,unavailableAccountAdapter,
  validateAccountAdapter,validateSupabasePublicConfig
} from '../public/flare-s8b/account-adapter.mjs';

function query(data,{singleData}={}){
  const chain={
    select(){return chain},eq(){return chain},is(){return chain},
    order(){return Promise.resolve({data,error:null})},
    single(){return Promise.resolve({data:singleData??(Array.isArray(data)?data[0]:data),error:null})},
    then(resolve){return Promise.resolve({data,error:null}).then(resolve)}
  };
  return chain;
}

function fixtureClient({signupSession=null}={}){
  const calls=[];
  const user={id:'player-a',email:'a@example.test'};
  const session={access_token:'public-session',user};
  const tables={
    player_profile:[{id:user.id,display_name:'Ada'}],
    player_runner:[{id:'runner-a',owner_player_id:user.id,runner_template_id:'warrior-l1',display_name:'Rookie Warrior',progression_version:'s8b-1'}],
    runner_item_ownership:[
      {id:'club-own',owner_player_id:user.id,item_id:'wooden-club',slot:'weapon',revoked_at:null},
      {id:'shield-own',owner_player_id:user.id,item_id:'wooden-shield',slot:'shield',revoked_at:null}
    ],
    runner_loadout:[{player_runner_id:'runner-a',weapon_ownership_id:'club-own',shield_ownership_id:'shield-own',head_ownership_id:null,chest_ownership_id:null,hands_ownership_id:null,legs_ownership_id:null,feet_ownership_id:null}],
    wallet_ledger:[],
    saved_goal:[{id:'goal-a',owner_player_id:user.id,source_sender_name:'Tom',source_runner_id:'warrior-l3',source_runner_name:'Tough Warrior',source_runner_level:3,target_hp:60}]
  };
  return {
    calls,user,session,
    auth:{
      async signUp(payload){calls.push(['signUp',payload]);return {data:{user,session:signupSession},error:null}},
      async signInWithPassword(payload){calls.push(['signInWithPassword',payload]);return {data:{user,session},error:null}},
      async signOut(payload){calls.push(['signOut',payload]);return {error:null}},
      async getSession(){calls.push(['getSession']);return {data:{session},error:null}}
    },
    from(table){calls.push(['from',table]);return query(tables[table]||[])},
    async rpc(name,args){
      calls.push(['rpc',name,args]);
      if(name==='ensure_starter_account')return {data:[{player_runner_id:'runner-a',starter_runner_template_id:'warrior-l1',weapon_ownership_id:'club-own',shield_ownership_id:'shield-own',starter_created:true}],error:null};
      if(name==='save_account_goal')return {data:[{saved_goal_id:'goal-a',runner_id:'warrior-l3',runner_name:'Tough Warrior',runner_level:3,target_hp:60}],error:null};
      return {data:null,error:{message:'unexpected rpc'}};
    }
  };
}

test('unconfigured adapter is explicit and fails closed',async()=>{
  const adapter=unavailableAccountAdapter();
  assert.equal(adapter.available,false);
  assert.equal(adapter.provider,'unconfigured');
  assert.equal(validateAccountAdapter(adapter),true);
  await assert.rejects(()=>adapter.register({}),/ACCOUNT_SERVICE_NOT_CONFIGURED/);
  await assert.rejects(()=>adapter.claimGuestRun({}),/ACCOUNT_SERVICE_NOT_CONFIGURED/);
});

test('adapter contract requires the account-foundation capabilities',()=>{
  assert.deepEqual(ACCOUNT_CAPABILITIES,[
    'register','signIn','signOut','getMe','getSession','ensureStarterAccount',
    'loadAccountState','loadSavedGoals','saveGoal','claimGuestRun'
  ]);
  assert.throws(()=>validateAccountAdapter({register(){}}),/missing signIn/i);
});

test('public config accepts publishable keys and rejects admin credentials',()=>{
  assert.equal(validateSupabasePublicConfig({url:'https://project.supabase.co',publishableKey:'sb_publishable_example'}).url,'https://project.supabase.co');
  assert.throws(()=>validateSupabasePublicConfig({url:'https://project.supabase.co',publishableKey:'sb_secret_nope'}),/ADMIN_SECRET_REJECTED/);
  const serviceJwt=['e30',Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url'),'signature'].join('.');
  assert.throws(()=>validateSupabasePublicConfig({url:'https://project.supabase.co',publishableKey:serviceJwt}),/ADMIN_SECRET_REJECTED/);
  assert.throws(()=>validateSupabasePublicConfig({url:'http://project.supabase.co',publishableKey:'sb_publishable_example'}),/MUST_USE_HTTPS/);
});

test('registration maps email-confirmation signup to CHECK_EMAIL without bootstrapping',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  const result=await adapter.register({displayName:'Ada',email:'a@example.test',password:'correct horse battery staple'});
  assert.equal(result.status,'CHECK_EMAIL');
  assert.equal(result.pendingConfirmation,true);
  assert.equal(result.session,null);
  assert.deepEqual(client.calls[0],[
    'signUp',{email:'a@example.test',password:'correct horse battery staple',options:{data:{display_name:'Ada'}}}
  ]);
  assert.equal(client.calls.some(call=>call[0]==='rpc'),false);
});

test('sign in provisions starter then maps authoritative account state',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  const result=await adapter.signIn({email:'a@example.test',password:'secret'});
  assert.equal(result.status,'AUTHENTICATED');
  assert.equal(result.starter.starter_created,true);
  assert.equal(result.account.profile.display_name,'Ada');
  assert.equal(result.account.runner.display_name,'Rookie Warrior');
  assert.deepEqual(result.account.ownedEquipment.map(row=>row.item_id),['wooden-club','wooden-shield']);
  assert.equal(result.account.loadout.weapon_ownership_id,'club-own');
  assert.equal(result.account.goldBalance,0);
  const rpcIndex=client.calls.findIndex(call=>call[0]==='rpc'&&call[1]==='ensure_starter_account');
  const runnerReadIndex=client.calls.findIndex(call=>call[0]==='from'&&call[1]==='player_runner');
  assert.ok(rpcIndex>=0&&runnerReadIndex>rpcIndex,'starter RPC must precede authoritative reads');
});

test('saved goal uses only the governed RPC and reads goals back',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  const result=await adapter.saveGoal({senderName:'Tom',runnerId:'warrior-l3',targetHp:60});
  assert.equal(result.saved.runner_name,'Tough Warrior');
  assert.equal(result.goals[0].target_hp,60);
  assert.deepEqual(client.calls.find(call=>call[0]==='rpc'),[
    'rpc','save_account_goal',{p_source_sender_name:'Tom',p_runner_id:'warrior-l3',p_target_hp:60}
  ]);
  assert.equal(client.calls.some(call=>call[0]==='insert'),false);
});

test('sign out is local and product reward claim remains disabled',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  assert.equal(await adapter.signOut(),true);
  assert.deepEqual(client.calls[0],['signOut',{scope:'local'}]);
  await assert.rejects(()=>adapter.claimGuestRun({}),/PRODUCT_REWARD_CLAIM_NOT_ENABLED/);
  assert.equal(client.calls.some(call=>call[0]==='rpc'&&/reward/i.test(call[1])),false);
});
