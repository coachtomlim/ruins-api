import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {adviseEncounter,advisorIntent,enumerateLegalEncounters,ENCOUNTER_ADVISOR_VERSION,ADVISOR_DEFAULT_TARGET_HP} from '../public/flare-s8b/encounter-advisor.mjs';
import {applyRunnerModel} from '../public/flare-s7/game.mjs';
import {runnerSummary,encounterCost} from '../public/flare-s7/game.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const model=JSON.parse(await read('public/flare-s7/data/game.json'));
const base=JSON.parse(await read('public/flare-p0/data/catalog.json'));
const catalog=applyRunnerModel(base,model,model.defaultRunner);
const runner=runnerSummary(model,model.defaultRunner,catalog);
const current={enemyTypes:['goblin','skeleton','none'],trapTypes:[],supportTypes:['small-potion']};

test('Encounter Advisor is explicitly deterministic and self-contained',async()=>{
  const src=await read('public/flare-s8b/encounter-advisor.mjs');
  assert.equal(ENCOUNTER_ADVISOR_VERSION,'p10-deterministic-encounter-advisor-001');
  assert.doesNotMatch(src,/fetch\s*\(|supabase|openai|anthropic|gemini|provider key|api key|edge function/i);
  assert.match(src,/enumerateLegalEncounters/);
  assert.match(src,/estimateEncounter/);
});

test('intent parser understands easier, harder, target and variation advice',()=>{
  assert.equal(advisorIntent('make this easier',{currentHpPercent:72}).mode,'easier');
  assert.equal(advisorIntent('make this harder',{currentHpPercent:72}).mode,'harder');
  assert.deepEqual(advisorIntent('get closer to 60% finishing HP',{currentHpPercent:72}),{mode:'target',targetHp:60,brief:'get closer to 60% finishing hp'});
  assert.equal(advisorIntent('suggest another legal variation',{currentHpPercent:72}).mode,'variation');
});

test('easier raises the deterministic finish target and harder lowers it',()=>{
  assert.equal(advisorIntent('make easier',{currentHpPercent:72}).targetHp,87);
  assert.equal(advisorIntent('make harder',{currentHpPercent:72}).targetHp,57);
});

test('enumeration returns only legal budget-fitting governed encounters',()=>{
  const rows=enumerateLegalEncounters({catalog,budget:100});
  assert.ok(rows.length>20);
  for(const row of rows){
    assert.ok(row.cost<=100);
    assert.equal(encounterCost(catalog,row.encounter),row.cost);
  }
});

test('advisor ranks legal suggestions against the requested target',()=>{
  const result=adviseEncounter({brief:'get closer to 60% finishing HP',catalog,model,runnerId:model.defaultRunner,runner,currentEncounter:current,targetHp:60,budget:100,limit:3});
  assert.equal(result.version,ENCOUNTER_ADVISOR_VERSION);
  assert.equal(result.intent.targetHp,60);
  assert.equal(result.suggestions.length,3);
  for(const suggestion of result.suggestions){
    assert.ok(suggestion.budgetUsed<=100);
    assert.equal(suggestion.targetHp,60);
    assert.ok(Number.isFinite(suggestion.estimate.estimatedHpPercent));
    assert.match(suggestion.summary,/Suggested adjustment:/);
  }
});

test('variation mode never returns the exact current encounter as the first suggestion',()=>{
  const result=adviseEncounter({brief:'suggest another legal variation',catalog,model,runnerId:model.defaultRunner,runner,currentEncounter:current,budget:100});
  assert.notDeepEqual(result.suggestions[0].encounter,current);
});

test('advisor is deterministic: identical inputs produce identical ranked results',()=>{
  const args={brief:'make this harder',catalog,model,runnerId:model.defaultRunner,runner,currentEncounter:current,budget:100,limit:3};
  assert.deepEqual(adviseEncounter(args),adviseEncounter(args));
});

test('default target remains 60%',()=>{
  assert.equal(ADVISOR_DEFAULT_TARGET_HP,60);
});

test('Practice UI presents Encounter Advisor, never AI terminology',async()=>{
  const html=await read('public/flare-s8b/practice.html');
  const app=await read('public/flare-s8b/practice-app.mjs');
  assert.match(html,/ENCOUNTER ADVISOR/);
  assert.match(html,/SUGGEST ADJUSTMENT/);
  assert.match(html,/SUGGESTED ADJUSTMENT/);
  assert.doesNotMatch(html,/\bAI\b|AI ENCOUNTER|AI ASSIST/i);
  assert.doesNotMatch(app,/ai-encounter|AI ASSIST|AI SUGGESTION|provider|suggest-encounter/i);
  assert.match(app,/adviseEncounter\(/);
});

test('Apply uses the existing manual controls and normal Practice run path',async()=>{
  const app=await read('public/flare-s8b/practice-app.mjs');
  assert.match(app,/applyEncounter\(advisorPlan\.encounter\)/);
  assert.match(app,/refreshBuild\(\)/);
  assert.doesNotMatch(app,/new Simulation\([^)]*advisorPlan/);
});

test('deterministic advice carries no economy or progression authority',async()=>{
  const src=await read('public/flare-s8b/encounter-advisor.mjs');
  assert.doesNotMatch(src,/wallet_ledger|runner_xp_event|builder_xp_event|purchase_progression_offer|equip_runner_item|settle_daily_trial|claim_daily_login_bonus/i);
});

test('external AI/provider components are removed from the runtime tree',async()=>{
  const files=await Promise.allSettled([
    read('public/flare-s8b/ai-encounter-provider.mjs'),
    read('public/flare-s8b/ai-encounter-assist.mjs'),
    read('supabase/functions/suggest-encounter/index.ts')
  ]);
  assert.ok(files.every(x=>x.status==='rejected'));
});
