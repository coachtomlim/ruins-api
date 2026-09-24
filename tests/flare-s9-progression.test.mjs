import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {progressionSummaryView,equipmentUnlockViews,historyViewRows} from '../public/flare-s8b/runner-progression-view.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

const progression=(over={})=>({
  player_runner_id:'runner-a',total_xp:0,runner_level:1,level_threshold:0,next_level_threshold:30,
  xp_remaining:30,max_level:false,
  unlocks:[{offerId:'leather-hood',itemId:'leather-hood',minLevel:2,goldCost:35,unlocked:false}],
  recent_events:[],...over
});
const itemCatalog=[{item_id:'leather-hood',slot:'head',display_name:'Leather Hood',hp_modifier:0,attack_modifier:0,defense_modifier:1}];

test('progression summary: Level 1 with 0/30 XP renders a 0% bar',()=>{
  const view=progressionSummaryView(progression());
  assert.equal(view.levelLabel,'LEVEL 1');
  assert.equal(view.xpLabel,'0 / 30 XP');
  assert.equal(view.progressPercent,0);
});

test('progression summary: partway through a level shows the fraction and a proportional bar',()=>{
  const view=progressionSummaryView(progression({total_xp:42,runner_level:2,level_threshold:30,next_level_threshold:80,xp_remaining:38}));
  assert.equal(view.levelLabel,'LEVEL 2');
  assert.equal(view.xpLabel,'42 / 80 XP');
  assert.equal(view.progressPercent,Math.round(((42-30)/(80-30))*100));
});

test('progression summary: max level shows LEVEL 5 · MAX with a full bar and no next threshold pressure',()=>{
  const view=progressionSummaryView(progression({total_xp:300,runner_level:5,level_threshold:250,next_level_threshold:250,max_level:true}));
  assert.equal(view.levelLabel,'LEVEL 5 · MAX');
  assert.equal(view.xpLabel,'300 XP');
  assert.equal(view.progressPercent,100);
});

test('progression summary fails closed on a malformed backend result',()=>{
  assert.throws(()=>progressionSummaryView(null),/AUTHORITATIVE_RUNNER_PROGRESSION_REQUIRED/);
  assert.throws(()=>progressionSummaryView({...progression(),runner_level:-1}),/INVALID_PROGRESSION_LEVEL/);
});

test('equipment unlock: LOCKED before the level requirement is met',()=>{
  const [unlock]=equipmentUnlockViews({progression:progression(),itemCatalog,itemOwnership:[],gear:[]});
  assert.equal(unlock.name,'Leather Hood');
  assert.equal(unlock.unlocked,false);
  assert.equal(unlock.action.state,'locked');
  assert.equal(unlock.action.label,'LOCKED · LEVEL 2');
  assert.equal(unlock.action.disabled,true);
});

test('equipment unlock: ACQUIRE once unlocked but not owned',()=>{
  const [unlock]=equipmentUnlockViews({progression:progression({runner_level:2,unlocks:[{offerId:'leather-hood',itemId:'leather-hood',minLevel:2,goldCost:35,unlocked:true}]}),itemCatalog,itemOwnership:[],gear:[]});
  assert.equal(unlock.action.state,'available');
  assert.equal(unlock.action.label,'ACQUIRE');
  assert.equal(unlock.action.disabled,false);
  assert.equal(unlock.priceLabel,'35 Gold');
  assert.equal(unlock.effectLabel,'+1 DEF');
});

test('equipment unlock: EQUIP once owned but not equipped',()=>{
  const [unlock]=equipmentUnlockViews({
    progression:progression({runner_level:2,unlocks:[{offerId:'leather-hood',itemId:'leather-hood',minLevel:2,goldCost:35,unlocked:true}]}),
    itemCatalog,itemOwnership:[{id:'ownership-1',item_id:'leather-hood',slot:'head',revoked_at:null}],gear:[]
  });
  assert.equal(unlock.owned,true);
  assert.equal(unlock.ownershipId,'ownership-1');
  assert.equal(unlock.action.state,'owned');
  assert.equal(unlock.action.label,'EQUIP');
  assert.equal(unlock.action.disabled,false);
});

test('equipment unlock: EQUIPPED and disabled once equipped',()=>{
  const [unlock]=equipmentUnlockViews({
    progression:progression({runner_level:2,unlocks:[{offerId:'leather-hood',itemId:'leather-hood',minLevel:2,goldCost:35,unlocked:true}]}),
    itemCatalog,itemOwnership:[{id:'ownership-1',item_id:'leather-hood',slot:'head',revoked_at:null}],
    gear:[{slot:'head',equipped:true,itemId:'leather-hood'}]
  });
  assert.equal(unlock.equipped,true);
  assert.equal(unlock.action.state,'equipped');
  assert.equal(unlock.action.label,'EQUIPPED');
  assert.equal(unlock.action.disabled,true);
});

test('equipment unlock fails closed if the unlocked item is not in the governed catalog',()=>{
  assert.throws(()=>equipmentUnlockViews({progression:progression(),itemCatalog:[],itemOwnership:[],gear:[]}),/AUTHORITATIVE_UNLOCK_ITEM_UNGOVERNED/);
});

test('history rows carry a compact badge and player-facing label, not database terminology',()=>{
  const rows=historyViewRows([
    {kind:'daily_trial',label:'Daily Trial · +10 XP · +5 Gold',gold_delta:5,xp_delta:10,created_at:'2026-09-24T00:00:00Z'},
    {kind:'stat_purchase',label:'Strike-i purchased · ATK +1',gold_delta:-30,xp_delta:0,created_at:'2026-09-23T00:00:00Z'},
    {kind:'level_reached',label:'Level 2 reached',gold_delta:0,xp_delta:0,created_at:'2026-09-22T00:00:00Z'}
  ]);
  assert.equal(rows.length,3);
  assert.equal(rows[0].badge,'DAILY TRIAL');
  assert.equal(rows[2].badge,'LEVEL UP');
  assert.doesNotMatch(JSON.stringify(rows),/runner_xp_event|wallet_ledger|player_id|source_ref/);
});

test('history view fails closed on a malformed row',()=>{
  assert.throws(()=>historyViewRows([{kind:'',label:'x',created_at:'2026-09-24T00:00:00Z'}]),/INVALID_PROGRESSION_HISTORY_ROW/);
  assert.throws(()=>historyViewRows(null),/AUTHORITATIVE_PROGRESSION_HISTORY_REQUIRED/);
});

// ---------------- Migration source checks (mirrors the project's existing static-migration-test style) ----------------

test('migration defines an append-only XP ledger with the correct governed reason and no negative amounts',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_progression_xp_levels.sql');
  assert.match(sql,/create table if not exists public\.runner_xp_event/i);
  assert.match(sql,/amount integer not null check \(amount > 0\)/i);
  assert.match(sql,/reason text not null check \(reason in \('daily_trial_completion'\)\)/i);
  assert.match(sql,/idempotency_key text not null unique/i);
});

test('migration locks the exact five-level XP curve',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_progression_xp_levels.sql');
  for(const pair of [[1,0],[2,30],[3,80],[4,150],[5,250]]){
    assert.match(sql,new RegExp(`\\(${pair[0]}, ${pair[1]}\\)`));
  }
  assert.match(sql,/when p_xp >= 250 then 5/);
  assert.match(sql,/when p_xp >= 150 then 4/);
  assert.match(sql,/when p_xp >= 80 then 3/);
  assert.match(sql,/when p_xp >= 30 then 2/);
});

test('settle_daily_trial is redefined (dropped first) and awards XP without changing the 5-Gold reward',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_progression_xp_levels.sql');
  assert.match(sql,/drop function if exists public\.settle_daily_trial\(uuid\);/);
  assert.match(sql,/10,\s*\n\s*'daily_trial_completion',/);
  assert.match(sql,/5,\s*\n\s*'daily_trial_reward',/);
  assert.doesNotMatch(sql,/reward_gold integer not null check \(reward_gold = (?!5)\d+\)/);
});

test('the new item is a real stock Flare fantasycore asset, not invented art',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_progression_xp_levels.sql');
  assert.match(sql,/'leather-hood', 'head', 'Leather Hood'/);
  assert.match(sql,/mods\/fantasycore\/items\/base\/armor\/leather\/head\.txt/);
  assert.match(sql,/'leather_hood'/);
});

test('the item unlock is Level 2 gated and priced between Strike I and Guard I',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_progression_xp_levels.sql');
  assert.match(sql,/'s8b-launch-progression-001', 'leather-hood', 'ITEM', 'leather-hood', 35, true, 2/);
  assert.match(sql,/if v_offer\.min_runner_level > v_level then/);
});

test('equip_runner_item projects effective stats and fails closed outside the PREFERRED envelope',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_progression_xp_levels.sql');
  assert.match(sql,/create or replace function public\.equip_runner_item\(/);
  assert.match(sql,/and e\.band = 'PREFERRED'/);
  assert.match(sql,/raise exception 'PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE';/);
  assert.match(sql,/o\.owner_player_id = v_player/);
  assert.match(sql,/o\.revoked_at is null/);
  assert.match(sql,/if v_ownership\.slot <> v_slot then/);
});

test('all new RPCs are authenticated-only, and mutation RPCs use an empty search path',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_progression_xp_levels.sql');
  for(const fn of ['get_runner_progression(uuid)','get_runner_progression_history(uuid,integer)','equip_runner_item(uuid,uuid,text)']){
    assert.match(sql,new RegExp(`revoke all on function public\\.${fn.replace(/[()]/g,'\\$&')} from public`));
    assert.match(sql,new RegExp(`revoke all on function public\\.${fn.replace(/[()]/g,'\\$&')} from anon`));
    assert.match(sql,new RegExp(`grant execute on function public\\.${fn.replace(/[()]/g,'\\$&')} to authenticated`));
  }
  const equipBody=sql.slice(sql.indexOf('create or replace function public.equip_runner_item('),sql.indexOf('revoke all on function public.equip_runner_item'));
  assert.match(equipBody,/security definer/);
  assert.match(equipBody,/set search_path = ''/);
});

test('no direct browser write to runner_xp_event or runner_loadout is granted',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_progression_xp_levels.sql');
  assert.match(sql,/revoke all on table public\.runner_xp_event from anon, authenticated;/);
  assert.match(sql,/grant select on table public\.runner_xp_event to authenticated;/);
  assert.doesNotMatch(sql,/grant (insert|update|delete) on table public\.runner_xp_event/i);
  assert.doesNotMatch(sql,/grant (insert|update|delete) on table public\.runner_loadout/i);
});

// ---------------- Client wiring ----------------

test('Hub renders LEVEL/XP progression, an equipment-unlock list and a HISTORY tab',async()=>{
  const html=await read('public/flare-s8b/index.html');
  assert.match(html,/id="progressionLevel"/);
  assert.match(html,/id="progressionXp"/);
  assert.match(html,/id="progressionFill"/);
  assert.match(html,/id="unlockList"/);
  assert.match(html,/id="historyTab"[^>]*>HISTORY/);
  assert.match(html,/id="historyList"/);
});

test('adapter binds Daily Trial settlement XP/progression only through governed RPCs, no direct table mutation',async()=>{
  const adapter=await read('public/flare-s8b/account-adapter.mjs');
  assert.match(adapter,/rpc\('get_runner_progression'/);
  assert.match(adapter,/rpc\('get_runner_progression_history'/);
  assert.match(adapter,/rpc\('equip_runner_item'/);
  assert.doesNotMatch(adapter,/from\('runner_xp_event'\)|from\('runner_loadout'\)/);
});

test('equip action sends only Runner id and ownership id, never a client-submitted stat total',async()=>{
  const adapter=await read('public/flare-s8b/account-adapter.mjs');
  const fn=adapter.slice(adapter.indexOf('async function equipRunnerItem'),adapter.indexOf('async function loadAccountState'));
  assert.doesNotMatch(fn,/effective_hp|effective_attack|effective_defense|hp_modifier|attack_modifier|defense_modifier/);
  assert.match(fn,/p_player_runner_id:runnerId,p_ownership_id:ownership,p_slot:targetSlot/);
});

test('Daily Trial, Daily Login, Practice and Friend Share regressions are untouched by this slice',async()=>{
  const dailyTrialLib=await read('public/flare-s8b/daily-trial.mjs');
  const login=await read('public/flare-s8b/daily-login.mjs');
  const practiceApp=await read('public/flare-s8b/practice-app.mjs');
  const friendShare=await read('public/flare-s8b/friend-share.mjs');
  assert.match(dailyTrialLib,/DAILY_TRIAL_REWARD_GOLD\s*=\s*5/);
  assert.doesNotMatch(login,/\bxp\b|\blevel\b|runner_xp_event/i);
  assert.doesNotMatch(practiceApp,/runner_xp_event|equip_runner_item|get_runner_progression/i);
  assert.doesNotMatch(friendShare,/runner_xp_event|equip_runner_item|get_runner_progression/i);
});

test('existing stat purchases (Endurance I / Strike I / Guard I) remain untouched in the migration',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_progression_xp_levels.sql');
  assert.match(sql,/if v_offer\.stat_key = 'hp' then/);
  assert.match(sql,/if v_offer\.kind = 'STAT' then/);
  assert.match(sql,/v_reason := 'runner_stat_upgrade';/);
});
