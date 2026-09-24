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

const RUNNER_STATE=Object.freeze({
  player_runner_id:'runner-a',runner_template_id:'warrior-l1',runner_name:'Rookie Warrior',
  progression_version:'s8b-1',catalog_version:'s8b-1',
  base_stats:{hp:100,attack:8,defense:0},effective_stats:{hp:100,attack:12,defense:1},
  gear:[
    {slot:'weapon',equipped:true,ownership_id:'club-own',item_id:'wooden-club',name:'Wooden Club',modifiers:{hp:0,attack:4,defense:0},catalog_version:'s8b-1',gfx:'club'},
    {slot:'shield',equipped:true,ownership_id:'shield-own',item_id:'wooden-shield',name:'Wooden Shield',modifiers:{hp:0,attack:0,defense:1},catalog_version:'s8b-1',gfx:'buckler'},
    ...['head','chest','hands','legs','feet'].map(slot=>({slot,equipped:false,ownership_id:null,item_id:null,name:null,modifiers:{hp:0,attack:0,defense:0}}))
  ]
});

function fixtureClient({signupSession=null,runnerState=RUNNER_STATE}={}){
  const calls=[];
  const user={id:'player-a',email:'a@example.test'};
  const session={access_token:'public-session',user};
  const tables={
    player_profile:[{id:user.id,display_name:'Ada'}],
    wallet_ledger:[],
    daily_trial_run:[{id:'trial-run-a',trial_day:'2026-09-19',room_id:'iron-labyrinth-01'}],
    saved_goal:[{id:'goal-a',owner_player_id:user.id,source_sender_name:'Tom',source_runner_id:'warrior-l3',source_runner_name:'Tough Warrior',source_runner_level:3,target_hp:60}],
    progression_offer_catalog:[
      {catalog_version:'s8b-launch-progression-001',offer_id:'endurance-i',kind:'STAT',stat_key:'hp',stat_amount:5,gold_cost:20},
      {catalog_version:'s8b-launch-progression-001',offer_id:'strike-i',kind:'STAT',stat_key:'attack',stat_amount:1,gold_cost:30},
      {catalog_version:'s8b-launch-progression-001',offer_id:'guard-i',kind:'STAT',stat_key:'defense',stat_amount:1,gold_cost:40}
    ],
    progression_purchase:[],
    runner_item_catalog:[
      {item_id:'wooden-club',slot:'weapon',display_name:'Wooden Club',hp_modifier:0,attack_modifier:4,defense_modifier:0},
      {item_id:'wooden-shield',slot:'shield',display_name:'Wooden Shield',hp_modifier:0,attack_modifier:0,defense_modifier:1},
      {item_id:'leather-hood',slot:'head',display_name:'Leather Hood',hp_modifier:0,attack_modifier:0,defense_modifier:1}
    ],
    runner_item_ownership:[]
  };
  const runnerProgression={player_runner_id:'runner-a',total_xp:0,runner_level:1,level_threshold:0,next_level_threshold:30,xp_remaining:30,max_level:false,unlocks:[{offerId:'leather-hood',itemId:'leather-hood',minLevel:2,goldCost:35,unlocked:false}],recent_events:[]};
  const progressionHistory=[];
  const builderProgression={total_builder_xp:0,builder_level:1,level_threshold:0,next_level_threshold:20,xp_remaining:20,max_level:false,published_challenges:0};
  const builderChallenges=[];
  const dailyTrialStatus={trial_day:'2026-09-19',trial_version:'s8b-daily-trial-001',state:'AVAILABLE',run_id:null,room_id:'iron-labyrinth-01',room_name:'Pillar Court',rules_version:'web-flare-0.2.0',content_version:'web-flare-s7-0.1.0',runner_snapshot:null,reward_gold:5,expected_ticks:614,expected_seconds:'10.23',settle_after:null,runner_hp:null,runner_attack:null,runner_defense:null,encounter_id:'fair-goblin-skeleton-potion-001',budget_spent:65};
  const dailyTrialRun={id:'trial-run-a',player_id:user.id,trial_day:'2026-09-19',room_id:'iron-labyrinth-01'};
  const dailyLogin={reward_day:'2026-09-19',claimed_today:false,current_streak_day:0,next_streak_day:1,claimable_gold:5,next_reset_at:'2026-09-20T00:00:00Z'};
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
      if(name==='get_account_runner_state')return {data:runnerState,error:null};
      if(name==='save_account_goal')return {data:[{saved_goal_id:'goal-a',runner_id:'warrior-l3',runner_name:'Tough Warrior',runner_level:3,target_hp:60}],error:null};
      if(name==='purchase_progression_offer')return {data:[{progression_purchase_id:'purchase-a',ledger_entry_id:'ledger-a',catalog_version:'s8b-launch-progression-001',offer_id:args.p_offer_id,gold_spent:20,balance:80,duplicate:false,stat_event_id:'event-a',ownership_id:null}],error:null};
      if(name==='get_daily_login_status')return {data:[dailyLogin],error:null};
      if(name==='get_daily_trial_status')return {data:[dailyTrialStatus],error:null};
      if(name==='get_runner_progression')return {data:[runnerProgression],error:null};
      if(name==='get_runner_progression_history')return {data:progressionHistory,error:null};
      if(name==='get_builder_progression')return {data:[builderProgression],error:null};
      if(name==='get_builder_challenges')return {data:builderChallenges,error:null};
      if(name==='create_builder_challenge')return {data:[{
        challenge_id:'challenge-a',runner_id:'warrior-l1',target_hp:args.p_target_hp,invite_code:'Qs2Z',
        sender_name:'Ada',builder_xp_awarded:10,total_builder_xp:10,builder_level:1,duplicate:false,
        created_at:'2026-09-24T00:00:00Z'
      }],error:null};
      if(name==='equip_runner_item')return {data:[{player_runner_id:'runner-a',slot:args.p_slot,ownership_id:args.p_ownership_id,item_id:'leather-hood',effective_hp:100,effective_attack:12,effective_defense:2,equipped_at:'2026-09-24T00:00:00Z'}],error:null};
      if(name==='start_daily_trial')return {data:[{run_id:'trial-run-a',trial_day:'2026-09-19',duplicate:false,reward_gold:5}],error:null};
      if(name==='settle_daily_trial')return {data:[{run_id:args.p_run_id,reward_gold:5,balance:5,duplicate:false,ledger_entry_id:'trial-ledger-a'}],error:null};
      if(name==='claim_daily_login_bonus')return {data:[{claim_id:'daily-a',ledger_entry_id:'daily-ledger-a',reward_day:'2026-09-19',streak_day:1,base_gold:5,streak_bonus_gold:0,gold_awarded:5,balance:5,duplicate:false,next_reset_at:'2026-09-20T00:00:00Z'}],error:null};
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
  await assert.rejects(()=>adapter.loadRunnerState(),/ACCOUNT_SERVICE_NOT_CONFIGURED/);
  await assert.rejects(()=>adapter.claimGuestRun({}),/ACCOUNT_SERVICE_NOT_CONFIGURED/);
});

test('adapter contract requires authoritative Runner capability',()=>{
  assert.deepEqual(ACCOUNT_CAPABILITIES,[
    'register','signIn','signOut','getMe','getSession','ensureStarterAccount',
    'loadRunnerState','loadProgressionOffers','loadProgressionPurchases','purchaseProgressionOffer',
    'loadDailyLoginStatus','claimDailyLoginBonus',
    'loadDailyTrialStatus','startDailyTrial','loadDailyTrialRun','settleDailyTrial',
    'loadRunnerProgression','loadRunnerProgressionHistory','loadItemCatalog','loadItemOwnership','equipRunnerItem',
    'loadBuilderProgression','loadBuilderChallenges','createBuilderChallenge',
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

test('registration can pin email confirmation back to the current app URL',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  await adapter.register({
    displayName:'Ada',email:'a@example.test',password:'correct horse battery staple',
    emailRedirectTo:'https://think-2-thrive.com/quick-dungeon/flare-s8b/?ignored=1#token'
  });
  assert.deepEqual(client.calls[0],[
    'signUp',{email:'a@example.test',password:'correct horse battery staple',options:{
      data:{display_name:'Ada'},emailRedirectTo:'https://think-2-thrive.com/quick-dungeon/flare-s8b/'
    }}
  ]);
  await assert.rejects(
    ()=>adapter.register({displayName:'Ada',email:'a@example.test',password:'secret123',emailRedirectTo:'http://example.com/'}),
    /EMAIL_REDIRECT_URL_MUST_USE_HTTPS/
  );
});

test('authoritative Runner state is loaded through governed RPC',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  const state=await adapter.loadRunnerState('runner-a');
  assert.equal(state.runner_name,'Rookie Warrior');
  assert.deepEqual(state.effective_stats,{hp:100,attack:12,defense:1});
  assert.deepEqual(client.calls[0],['rpc','get_account_runner_state',{p_player_runner_id:'runner-a'}]);
});

test('authoritative Runner state fails closed when backend projection is absent',async()=>{
  const client=fixtureClient({runnerState:null});
  const adapter=createSupabaseAccountAdapter({client});
  await assert.rejects(()=>adapter.loadRunnerState(),/AUTHORITATIVE_RUNNER_STATE_REQUIRED/);
});

test('sign in provisions starter then maps authoritative account state',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  const result=await adapter.signIn({email:'a@example.test',password:'secret'});
  assert.equal(result.status,'AUTHENTICATED');
  assert.equal(result.starter.starter_created,true);
  assert.equal(result.account.profile.display_name,'Ada');
  assert.equal(result.account.runnerState.runner_name,'Rookie Warrior');
  assert.deepEqual(result.account.runnerState.effective_stats,{hp:100,attack:12,defense:1});
  assert.equal(result.account.goldBalance,0);
  assert.equal(result.account.progressionOffers.length,3);
  assert.deepEqual(result.account.progressionPurchases,[]);
  assert.equal(result.account.dailyLogin.claimable_gold,5);
  assert.deepEqual(result.account.progressionOffers.map(row=>row.gold_cost),[20,30,40]);
  const starterIndex=client.calls.findIndex(call=>call[0]==='rpc'&&call[1]==='ensure_starter_account');
  const runnerIndex=client.calls.findIndex(call=>call[0]==='rpc'&&call[1]==='get_account_runner_state');
  assert.ok(starterIndex>=0&&runnerIndex>starterIndex,'starter RPC must precede authoritative Runner projection');
  assert.deepEqual(client.calls[runnerIndex][2],{p_player_runner_id:'runner-a'});
  assert.equal(client.calls.some(call=>call[0]==='from'&&['player_runner','runner_loadout'].includes(call[1])),false);
  assert.ok(client.calls.some(call=>call[0]==='from'&&call[1]==='runner_item_ownership'),'loadAccountState reads own item ownership (read-only, RLS-scoped)');
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

test('progression purchase uses only the governed RPC and returns its authoritative result',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  const result=await adapter.purchaseProgressionOffer({
    playerRunnerId:'runner-a',offerId:'endurance-i',idempotencyKey:'proof-key-a'
  });
  assert.equal(result.progression_purchase_id,'purchase-a');
  assert.equal(result.ledger_entry_id,'ledger-a');
  assert.equal(result.balance,80);
  assert.deepEqual(client.calls[0],[
    'rpc','purchase_progression_offer',{
      p_player_runner_id:'runner-a',p_offer_id:'endurance-i',p_idempotency_key:'proof-key-a'
    }
  ]);
  assert.equal(client.calls.some(call=>['insert','update','upsert','delete'].includes(call[0])),false);
});

test('progression purchase propagates governed RPC errors without client decisions',async()=>{
  const client=fixtureClient();
  client.rpc=async(name,args)=>{
    client.calls.push(['rpc',name,args]);
    return {data:null,error:{code:'P0001',message:'PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE'}};
  };
  const adapter=createSupabaseAccountAdapter({client});
  await assert.rejects(
    ()=>adapter.purchaseProgressionOffer({playerRunnerId:'runner-a',offerId:'guard-i',idempotencyKey:'proof-key-b'}),
    error=>error.name==='AccountAdapterError'&&error.operation==='purchaseProgressionOffer'&&error.code==='P0001'&&/PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE/.test(error.message)
  );
});

test('daily login status and claim use governed RPCs only',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  const status=await adapter.loadDailyLoginStatus();
  assert.equal(status.claimable_gold,5);
  assert.deepEqual(client.calls[0],['rpc','get_daily_login_status',undefined]);
  client.calls.length=0;
  const claim=await adapter.claimDailyLoginBonus();
  assert.equal(claim.gold_awarded,5);
  assert.equal(claim.balance,5);
  assert.deepEqual(client.calls[0],['rpc','claim_daily_login_bonus',undefined]);
  assert.equal(client.calls.some(call=>['insert','update','upsert','delete'].includes(call[0])),false);
});

test('sign out is local and product reward claim remains disabled',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  assert.equal(await adapter.signOut(),true);
  assert.deepEqual(client.calls[0],['signOut',{scope:'local'}]);
  await assert.rejects(()=>adapter.claimGuestRun({}),/PRODUCT_REWARD_CLAIM_NOT_ENABLED/);
  assert.equal(client.calls.some(call=>call[0]==='rpc'&&/reward/i.test(call[1])),false);
});

test('daily trial capabilities use only the governed RPCs and one read-only table select',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  const status=await adapter.loadDailyTrialStatus();
  assert.equal(status.state,'AVAILABLE');
  assert.deepEqual(client.calls.at(-1),['rpc','get_daily_trial_status',undefined]);
  const started=await adapter.startDailyTrial();
  assert.equal(started.run_id,'trial-run-a');
  assert.deepEqual(client.calls.at(-1),['rpc','start_daily_trial',undefined]);
  const run=await adapter.loadDailyTrialRun('trial-run-a');
  assert.equal(run.id,'trial-run-a');
  assert.deepEqual(client.calls.at(-1),['from','daily_trial_run']);
  const settled=await adapter.settleDailyTrial('trial-run-a');
  assert.equal(settled.reward_gold,5);
  assert.deepEqual(client.calls.at(-1),['rpc','settle_daily_trial',{p_run_id:'trial-run-a'}]);
  assert.equal(client.calls.some(call=>['insert','update','upsert','delete'].includes(call[0])),false);
});

test('daily trial settlement and run lookup require a run id and never send browser reward fields',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  await assert.rejects(()=>adapter.settleDailyTrial(''),/DAILY_TRIAL_RUN_ID_REQUIRED/);
  await assert.rejects(()=>adapter.loadDailyTrialRun('  '),/DAILY_TRIAL_RUN_ID_REQUIRED/);
  await adapter.startDailyTrial();
  await adapter.settleDailyTrial('trial-run-a');
  const rpcArgs=client.calls.filter(call=>call[0]==='rpc'&&/daily_trial/.test(call[1])).map(call=>call[2]);
  assert.deepEqual(rpcArgs,[undefined,{p_run_id:'trial-run-a'}]);
});

test('loadAccountState includes the authoritative daily trial status',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  const account=await adapter.loadAccountState();
  assert.equal(account.dailyTrial.state,'AVAILABLE');
  assert.equal(account.dailyTrial.room_name,'Pillar Court');
  assert.equal(account.dailyLogin.claimable_gold,5);
  assert.equal(account.builderProgression.builder_level,1);
  assert.deepEqual(account.builderChallenges,[]);
});

test('unconfigured adapter also fails closed for daily trial',async()=>{
  const adapter=unavailableAccountAdapter();
  for(const name of ['loadDailyTrialStatus','startDailyTrial','loadDailyTrialRun','settleDailyTrial'])
    await assert.rejects(()=>adapter[name]('x'),/ACCOUNT_SERVICE_NOT_CONFIGURED/);
});


test('Builder progression and challenge publishing use governed RPCs only',async()=>{
  const client=fixtureClient();
  const adapter=createSupabaseAccountAdapter({client});
  const progression=await adapter.loadBuilderProgression();
  assert.equal(progression.builder_level,1);
  assert.deepEqual(client.calls.at(-1),['rpc','get_builder_progression',undefined]);

  const challenges=await adapter.loadBuilderChallenges();
  assert.deepEqual(challenges,[]);
  assert.deepEqual(client.calls.at(-1),['rpc','get_builder_challenges',{p_limit:20}]);

  const published=await adapter.createBuilderChallenge(60);
  assert.equal(published.target_hp,60);
  assert.equal(published.builder_xp_awarded,10);
  assert.deepEqual(client.calls.at(-1),['rpc','create_builder_challenge',{p_target_hp:60}]);
  assert.equal(client.calls.some(call=>['insert','update','upsert','delete'].includes(call[0])),false);
});

test('training offer feed remains STAT-only after ITEM unlock offers become active',async()=>{
  const source=await readFile(new URL('../public/flare-s8b/account-adapter.mjs',import.meta.url),'utf8');
  const start=source.indexOf('async function loadProgressionOffers');
  const end=source.indexOf('async function loadProgressionPurchases');
  const fn=source.slice(start,end);
  assert.match(fn,/\.eq\('active',true\)[\s\S]*\.eq\('kind','STAT'\)/);
});
