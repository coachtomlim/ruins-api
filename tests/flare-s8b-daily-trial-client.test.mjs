import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  DAILY_TRIAL_ROOM_IDS,dailyTrialView,normalizeDailyTrialRun,normalizeDailyTrialStatus,dailyTrialErrorMessage
} from '../public/flare-s8b/daily-trial.mjs';
import {applyDailyTrialRunnerToCatalog} from '../public/flare-s8b/daily-trial-runner-catalog.mjs';
import {applyPracticeRunnerToCatalog} from '../public/flare-s8b/practice-runner-catalog.mjs';
import {buildAccountReadyViewFromBackend} from '../public/flare-s8b/account-ready-view.mjs';
import {S7_ROOMS} from '../public/flare-s7/rooms.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const TODAY='2026-09-21';

const status=(over={})=>({
  trial_day:TODAY,trial_version:'s8b-daily-trial-001',state:'AVAILABLE',run_id:null,
  room_id:'iron-labyrinth-01',room_name:'Pillar Court',rules_version:'web-flare-0.2.0',content_version:'web-flare-s7-0.1.0',
  runner_snapshot:null,reward_gold:5,expected_ticks:614,expected_seconds:'10.23',settle_after:null,
  runner_hp:null,runner_attack:null,runner_defense:null,encounter_id:'fair-goblin-skeleton-potion-001',budget_spent:65,...over
});
const running=(over={})=>status({state:'RUNNING',run_id:'run-a',settle_after:'2026-09-21T10:00:10.233Z',...over});

const runRow=(over={})=>({
  id:'run-a',player_id:'player-a',player_runner_id:'runner-a',trial_day:TODAY,trial_version:'s8b-daily-trial-001',
  room_id:'iron-labyrinth-07',room_name:'Broken Gallery',rules_version:'web-flare-0.2.0',content_version:'web-flare-s7-0.1.0',
  runner_snapshot:{player_runner_id:'runner-a',runner_name:'Rookie Warrior',effective_stats:{hp:105,attack:13,defense:1}},
  runner_hp:105,runner_attack:13,runner_defense:1,encounter_id:'fair-goblin-skeleton-potion-001',
  encounter:{enemyTypes:['goblin','skeleton','none'],supportTypes:['small-potion'],trapTypes:[]},
  budget_spent:65,reward_gold:5,expected_ticks:604,started_at:'2026-09-21T10:00:00Z',settle_after:'2026-09-21T10:00:10.066Z',
  settled_at:null,ledger_entry_id:null,...over
});

test('Hub AVAILABLE: room, server reward, START DAILY TRIAL, one clear per day, ~10-11 second run',()=>{
  const view=dailyTrialView(status(),{today:TODAY});
  assert.equal(view.state,'AVAILABLE');
  assert.equal(view.roomName,'Pillar Court');
  assert.equal(view.statusLabel,'5 GOLD');
  assert.equal(view.actionKind,'start');
  assert.equal(view.actionLabel,'START DAILY TRIAL');
  assert.equal(view.actionDisabled,false);
  assert.match(view.detail,/One clear per trial day/);
  assert.match(view.detail,/10–11 second automatic run/);
});

test('Hub RUNNING: TRIAL IN PROGRESS with CONTINUE TRIAL bound to the server run id',()=>{
  const view=dailyTrialView(running(),{today:TODAY});
  assert.equal(view.statusLabel,'TRIAL IN PROGRESS');
  assert.equal(view.actionKind,'continue');
  assert.equal(view.actionLabel,'CONTINUE TRIAL');
  assert.equal(view.runId,'run-a');
  assert.equal(view.priorDay,false);
});

test('Hub CLAIMABLE: 5 GOLD READY with CLAIM 5 GOLD; amount comes from authoritative state',()=>{
  const view=dailyTrialView(status({state:'CLAIMABLE',run_id:'run-a',settle_after:'2026-09-21T10:00:10Z'}),{today:TODAY});
  assert.equal(view.statusLabel,'5 GOLD READY');
  assert.equal(view.actionKind,'claim');
  assert.equal(view.actionLabel,'CLAIM 5 GOLD');
  assert.equal(view.rewardGold,5);
});

test('Hub CLAIMED: CLAIMED TODAY with no reward action',()=>{
  const view=dailyTrialView(status({state:'CLAIMED',run_id:'run-a',settle_after:'2026-09-21T10:00:10Z'}),{today:TODAY});
  assert.equal(view.statusLabel,'CLAIMED TODAY');
  assert.equal(view.actionLabel,'CLAIMED TODAY');
  assert.equal(view.actionDisabled,true);
  assert.equal(view.actionKind,'none');
});

test('midnight: prior-day RUNNING and CLAIMABLE runs keep their original trial_day and run id',()=>{
  const runningPrior=dailyTrialView(running({trial_day:'2026-09-20'}),{today:TODAY});
  assert.equal(runningPrior.trialDay,'2026-09-20');
  assert.equal(runningPrior.runId,'run-a');
  assert.equal(runningPrior.priorDay,true);
  assert.equal(runningPrior.actionKind,'continue');
  assert.match(runningPrior.detail,/2026-09-20/);
  const claimablePrior=dailyTrialView(status({state:'CLAIMABLE',trial_day:'2026-09-20',run_id:'run-a',settle_after:'2026-09-21T00:00:01Z'}),{today:TODAY});
  assert.equal(claimablePrior.trialDay,'2026-09-20');
  assert.equal(claimablePrior.priorDay,true);
  assert.equal(claimablePrior.actionKind,'claim');
  assert.equal(claimablePrior.runId,'run-a');
});

test('status normalization fails closed on unsupported version, encounter, budget, reward, room and state',()=>{
  const bad=[
    [{trial_version:'s8b-daily-trial-999'},/VERSION_UNSUPPORTED/],
    [{encounter_id:'brutal-001'},/ENCOUNTER_UNSUPPORTED/],
    [{budget_spent:100},/BUDGET_UNSUPPORTED/],
    [{reward_gold:15},/REWARD_UNSUPPORTED/],
    [{room_id:'iron-labyrinth-99'},/ROOM_UNSUPPORTED/],
    [{state:'DONE'},/INVALID_DAILY_TRIAL_STATE/],
    [{state:'RUNNING',run_id:null,settle_after:'2026-09-21T10:00:10Z'},/RUN_REQUIRED/],
    [{state:'AVAILABLE',run_id:'run-a'},/AVAILABLE_RUN/]
  ];
  for(const [over,pattern] of bad)assert.throws(()=>normalizeDailyTrialStatus(status(over)),pattern);
  assert.throws(()=>normalizeDailyTrialStatus(null),/AUTHORITATIVE_DAILY_TRIAL_STATUS_REQUIRED/);
});

test('accepted rooms are exactly the six calibrated S7 rooms with matching names',()=>{
  assert.equal(DAILY_TRIAL_ROOM_IDS.length,6);
  for(const id of DAILY_TRIAL_ROOM_IDS)assert.ok(S7_ROOMS[id],id);
});

test('canonical run: room, Runner snapshot stats, reward, budget and fixed FAIR encounter come from the server row',()=>{
  const run=normalizeDailyTrialRun(runRow());
  assert.equal(run.mode,'DAILY_TRIAL');
  assert.equal(run.roomId,'iron-labyrinth-07');
  assert.equal(run.roomName,'Broken Gallery');
  assert.deepEqual(run.runner,{id:'runner-a',name:'Rookie Warrior',hp:105,attack:13,defense:1});
  assert.equal(run.rewardGold,5);
  assert.equal(run.budgetSpent,65);
  assert.deepEqual(run.encounter,{enemyTypes:['goblin','skeleton','none'],supportTypes:['small-potion'],trapTypes:[]});
  assert.equal(run.expectedTicks,604);
  assert.equal(run.trialDay,TODAY);
});

test('run normalization fails closed on unsupported encounter, room, version, budget or a mismatched snapshot',()=>{
  const bad=[
    [{encounter:{enemyTypes:['goblin','skeleton','goblin-elite'],supportTypes:['small-potion'],trapTypes:[]}},/ENCOUNTER_UNSUPPORTED/],
    [{encounter:{enemyTypes:['goblin','skeleton','none'],supportTypes:['small-potion'],trapTypes:['spike-trap']}},/ENCOUNTER_UNSUPPORTED/],
    [{room_id:'iron-labyrinth-02'},/ROOM_UNSUPPORTED/],
    [{trial_version:'x'},/VERSION_UNSUPPORTED/],
    [{rules_version:'web-flare-9'},/RULES_UNSUPPORTED/],
    [{budget_spent:100},/BUDGET_UNSUPPORTED/],
    [{runner_attack:14},/SNAPSHOT_MISMATCH/],
    [{runner_snapshot:null},/SNAPSHOT_REQUIRED/]
  ];
  for(const [over,pattern] of bad)assert.throws(()=>normalizeDailyTrialRun(runRow(over)),pattern);
});

test('Daily Trial runner bridge applies only the server-snapshotted HP/ATK/DEF and never mutates the base catalog',()=>{
  const base={heroes:{warrior:{maxHp:100,damage:12,armor:1,name:'Warrior'}}};
  const run=normalizeDailyTrialRun(runRow());
  const applied=applyDailyTrialRunnerToCatalog(base,run);
  assert.deepEqual([applied.heroes.warrior.maxHp,applied.heroes.warrior.damage,applied.heroes.warrior.armor],[105,13,1]);
  assert.deepEqual(base.heroes.warrior,{maxHp:100,damage:12,armor:1,name:'Warrior'});
  assert.throws(()=>applyDailyTrialRunnerToCatalog(base,{mode:'PRACTICE',runner:{hp:1,attack:1,defense:1}}),/DAILY_TRIAL_RUN_REQUIRED/);
  assert.throws(()=>applyDailyTrialRunnerToCatalog({},run),/DAILY_TRIAL_BASE_CATALOG_REQUIRED/);
});

test('the Practice-only bridge still refuses a Daily Trial run, so the two paths cannot be swapped',()=>{
  const base={heroes:{warrior:{maxHp:100,damage:12,armor:1}}};
  assert.throws(()=>applyPracticeRunnerToCatalog(base,normalizeDailyTrialRun(runRow())),/PRACTICE_RUNNER_SNAPSHOT_REQUIRED/);
});

test('settlement wait is not treated as failure; other errors map to safe messages',()=>{
  assert.equal(dailyTrialErrorMessage(new Error('DAILY_TRIAL_NOT_COMPLETE')).kind,'wait');
  assert.equal(dailyTrialErrorMessage(new Error('DAILY_TRIAL_RUN_NOT_FOUND')).kind,'known');
  assert.match(dailyTrialErrorMessage(new Error('RUNNER_OUTSIDE_DAILY_TRIAL_ENVELOPE')).message,/not eligible/);
  assert.equal(dailyTrialErrorMessage(new Error('boom')).kind,'unknown');
});

test('Ready view carries the Daily Trial view model and stays valid without one',()=>{
  const gear=[
    {slot:'weapon',equipped:true,ownership_id:'a',item_id:'wooden-club',name:'Wooden Club',modifiers:{hp:0,attack:4,defense:0},gfx:'club'},
    {slot:'shield',equipped:true,ownership_id:'b',item_id:'wooden-shield',name:'Wooden Shield',modifiers:{hp:0,attack:0,defense:1},gfx:'buckler'},
    ...['head','chest','hands','legs','feet'].map(slot=>({slot,equipped:false,ownership_id:null,item_id:null,name:null,modifiers:{hp:0,attack:0,defense:0}}))
  ];
  const account={
    identity:{id:'p',email:'a@example.test'},profile:{display_name:'Ada'},goldBalance:5,savedGoals:[],
    progressionOffers:[],progressionPurchases:[],
    dailyLogin:{reward_day:TODAY,claimed_today:true,current_streak_day:1,next_streak_day:2,claimable_gold:0,next_reset_at:'2026-09-22T00:00:00Z'},
    runnerState:{player_runner_id:'r',runner_template_id:'warrior-l1',runner_name:'Rookie Warrior',progression_version:'v',catalog_version:'v',base_stats:{hp:100,attack:8,defense:0},effective_stats:{hp:100,attack:12,defense:1},gear}
  };
  assert.equal(buildAccountReadyViewFromBackend(account).dailyTrial,null);
  const withTrial=buildAccountReadyViewFromBackend({...account,dailyTrial:running()});
  assert.equal(withTrial.dailyTrial.actionLabel,'CONTINUE TRIAL');
  assert.equal(withTrial.dailyLogin.actionLabel,'CLAIMED TODAY');
  assert.equal(withTrial.goldBalance,5);
});

test('Hub replaces the COMING NEXT teaser with the stateful Daily Trial card',async()=>{
  const html=await read('public/flare-s8b/index.html');
  assert.doesNotMatch(html,/COMING NEXT/);
  for(const id of ['dailyTrialCard','dailyTrialAction','dailyTrialRoom','dailyTrialState','dailyTrialDetail','dailyTrialStatus'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/id="dailyLoginClaim"/);
  assert.match(html,/id="testYourRunner"/);
});

test('Hub start calls start_daily_trial with no browser arguments, then navigates by run id only',async()=>{
  const app=await read('public/flare-s8b/account-app.mjs');
  assert.match(app,/adapter\.startDailyTrial\(\)/);
  assert.match(app,/adapter\.settleDailyTrial\(trial\.runId\)/);
  assert.match(app,/daily-trial\.html\?run=/);
  assert.doesNotMatch(app,/startDailyTrial\([^)]/);
  assert.match(app,/adapter\.claimDailyLoginBonus\(\)/);
});

test('Daily Trial page is a fixed run: no customization, difficulty, budget, room or preset controls',async()=>{
  const html=await read('public/flare-s8b/daily-trial.html');
  assert.doesNotMatch(html,/<select|type="checkbox"|data-preset|prevRoom|nextRoom|roomStage|id="customize"|id="enemy1"|BRUTAL|EASY|Dungeon Budget|RUN THE GAUNTLET/i);
  assert.doesNotMatch(html,/id="overview"|>OVERVIEW</);
  assert.match(html,/id="pause"/);
  assert.match(html,/id="claim"/);
  assert.match(html,/DAILY TRIAL CLAIMED/);
  assert.match(html,/<script src="config\.js">/);
});

test('Daily Trial page loads only the server run, never starts one, and settles by run id only',async()=>{
  const app=await read('public/flare-s8b/daily-trial-app.mjs');
  assert.match(app,/adapter\.loadDailyTrialRun\(runId\)/);
  assert.match(app,/adapter\.settleDailyTrial\(run\.id\)/);
  assert.doesNotMatch(app,/startDailyTrial|start_daily_trial/);
  assert.doesNotMatch(app,/sessionStorage|localStorage/);
  assert.match(app,/normalizeDailyTrialRun\(/);
  assert.match(app,/applyDailyTrialRunnerToCatalog\(legacy,run\)/);
  assert.match(app,/structuredClone\(run\.encounter\)/);
  assert.match(app,/loadS7StockRoom\(run\.roomId\)/);
  assert.match(app,/built\.spent!==DAILY_TRIAL_BUDGET/);
  assert.doesNotMatch(app,/select\(|insert\(|update\(|delete\(|from\(/);
});

test('Daily Trial page treats the animation as presentation, waits on the server, and handles NOT_COMPLETE',async()=>{
  const app=await read('public/flare-s8b/daily-trial-app.mjs');
  assert.match(app,/waitForClaimable/);
  assert.match(app,/loadDailyTrialStatus\(\)/);
  assert.match(app,/feedback\.kind==='wait'/);
  assert.match(app,/run\.settleAfter/);
});

test('the deterministic simulation loot Gold is never presented or credited by the Daily Trial UI',async()=>{
  const app=await read('public/flare-s8b/daily-trial-app.mjs');
  const html=await read('public/flare-s8b/daily-trial.html');
  assert.doesNotMatch(app,/result\.gold|\.gold\b|\b15\b|hero_runner_reward_claim|claimGuestRun/);
  assert.doesNotMatch(html,/\b15\b/);
  assert.match(html,/CLAIM 5 GOLD/);
});

test('Practice stays isolated and reward-free',async()=>{
  const practice=await read('public/flare-s8b/practice-app.mjs');
  const snapshot=await read('public/flare-s8b/practice-runner-snapshot.mjs');
  const html=await read('public/flare-s8b/practice.html');
  for(const source of [practice,snapshot])assert.doesNotMatch(source,/daily_trial|dailyTrial|DailyTrial|daily-trial/i);
  assert.match(html,/PRACTICE RUN · NO REWARDS/);
  assert.match(practice,/rewardSettlement!==false/);
});

test('Daily Login stays independent of Daily Trial',async()=>{
  const login=await read('public/flare-s8b/daily-login.mjs');
  assert.doesNotMatch(login,/trial/i);
  const adapter=await read('public/flare-s8b/account-adapter.mjs');
  assert.match(adapter,/rpc\('claim_daily_login_bonus'\)/);
  assert.match(adapter,/rpc\('settle_daily_trial',\{p_run_id:id\}\)/);
});

test('no service-role or admin credential is present in any Daily Trial browser source',async()=>{
  for(const file of ['daily-trial.mjs','daily-trial-runner-catalog.mjs','daily-trial-app.mjs','daily-trial.html','daily-trial.css']){
    const source=await read(`public/flare-s8b/${file}`);
    assert.doesNotMatch(source,/service_role|sb_secret_|SUPABASE_SERVICE/i,file);
  }
});

test('Daily Trial controls keep 44px minimum touch targets',async()=>{
  const trialCss=await read('public/flare-s8b/daily-trial.css');
  const hubCss=await read('public/flare-s8b/account.css');
  assert.match(trialCss,/\.dt-back[^}]*min-height:44px/);
  assert.match(trialCss,/\.dt-tools button[^}]*min-height:44px/);
  const action=hubCss.match(/\.daily-trial-action\{([^}]*)\}/);
  assert.ok(action,'hub action rule');
  assert.ok(Number(action[1].match(/min-height:(\d+)px/)?.[1])>=44);
});
