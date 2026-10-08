import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readFile} from 'node:fs/promises';
import {parseMap} from '../public/flare-p0/src/core/flare.mjs';
import {S7_ROOMS} from '../public/flare-s7/rooms.mjs';
import {applyRunnerModel,runnerSummary,buildS7Challenge,encounterCost,normalizeEncounter} from '../public/flare-s7/game.mjs';
import {estimateEncounter,presetById} from '../public/flare-s7/calibration.mjs';
import {Simulation} from '../public/flare-s7/simulation.mjs';
import {buildDungeonPresets,GOVERNED_PRESET_IDS} from '../public/flare-s8a/dungeon-presets.mjs';
import {extendModelWithLevel2,extendCatalogWithLevel2} from '../public/flare-s8a/level2-content.mjs';
import {createReceiverSession,selectDungeon,setEncounter,advanceReceiver} from '../public/flare-s8a/receiver-session.mjs';
import {buildReceiverView} from '../public/flare-s8a/receiver-view.mjs';
import {STARTER_DUNGEON_IDS} from '../public/flare-s8a/builder-level.mjs';
import {buildRewardJourney} from '../public/flare-s8a/reward-journey.mjs';
import {buildResultViewModel} from '../public/flare-s8a/result-view-model.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const readJson=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const model=extendModelWithLevel2(readJson('../public/flare-s7/data/game.json'));
const catalog=extendCatalogWithLevel2(applyRunnerModel(readJson('../public/flare-p0/data/catalog.json'),model,'warrior-l1'),model);
const runner=runnerSummary(model,'warrior-l1',catalog);
const TARGET=50;
const presets=buildDungeonPresets({catalog,model,runnerId:'warrior-l1',runner,targetHp:TARGET,budget:100,roomIds:STARTER_DUNGEON_IDS});
const chooser=[presets.tooEasy,presets.justRight,presets.brutal]; // the exact order presetList() uses in challenge.mjs
const roomMap=id=>{const map=parseMap(fs.readFileSync(new URL(`../public/flare-s7/${S7_ROOMS[id].local}`,import.meta.url),'utf8'));map.id=id;return map};
function play(roomId,encounter){
  const map=roomMap(roomId),built=buildS7Challenge({roomId,roomTitle:S7_ROOMS[roomId].name,map,catalog,targetHp:TARGET,encounter,budget:100});
  const sim=new Simulation(map,built.challenge,catalog);sim.start();for(let i=0;i<3600&&sim.status==='running';i++)sim.step();
  const r=sim.result();return{built,sim,hp:r.hp,status:r.status,gold:r.gold,kills:r.kills,traps:sim.events.filter(e=>e.type==='trap').length};
}
const BRUTAL={enemyTypes:['skeleton','skeleton','goblin'],trapTypes:['spike-trap'],supportTypes:[]};
const TOO_EASY={enemyTypes:['skeleton','skeleton','none'],trapTypes:[],supportTypes:['small-potion']};
const JUST_RIGHT={enemyTypes:['skeleton','skeleton','goblin'],trapTypes:[],supportTypes:[]};

test('the Owner-visible chooser maps position -> dungeon -> difficulty exactly (TOO EASY / JUST RIGHT / BRUTAL on the three starter shells)',()=>{
  assert.deepEqual(chooser.map(p=>[p.label,p.roomId,S7_ROOMS[p.roomId].name]),[
    ['TOO EASY','iron-labyrinth-01','Pillar Court'],['JUST RIGHT','iron-labyrinth-03','Crossed Court'],['BRUTAL','iron-labyrinth-08','Scattered Hall']]);
  assert.deepEqual(chooser.map(p=>p.kind),['too-easy','just-right','brutal']);
  assert.equal(presets.justRight.recommended,true);
});

test('Brutal at target 50 is the exact governed encounter: Skeleton, Skeleton, Goblin + Spike Trap, budget 100, potential Hero Gold 24',()=>{
  const b=presets.brutal;
  assert.deepEqual({e:[...b.encounter.enemyTypes],t:[...b.encounter.trapTypes],s:[...b.encounter.supportTypes]},{e:BRUTAL.enemyTypes,t:BRUTAL.trapTypes,s:[]});
  assert.equal(b.budgetUsed,100);
  assert.equal(encounterCost(catalog,b.encounter),30+30+20+20);
  assert.equal(b.encounter.enemyTypes.reduce((n,id)=>n+(catalog.enemies[id]?.gold||0),0),9+9+6);
  const {id,...governed}=presetById('brutal');assert.equal(id,'brutal');assert.deepEqual(governed,BRUTAL);
});

test('the Owner\'s 74% HP / 18 Hero Gold is exactly the TOO EASY encounter, not a broken Brutal: the three chooser entries have distinct, truthful outcomes',()=>{
  const [easy,right,brutal]=chooser.map(p=>play(p.roomId,p.encounter));
  assert.deepEqual([easy.hp,easy.gold,easy.status],[74,18,'cleared']);
  assert.deepEqual([right.hp,right.gold,right.status],[56,24,'cleared']);
  assert.deepEqual([brutal.hp,brutal.gold,brutal.status,brutal.kills,brutal.traps],[27,24,'cleared',3,1]);
  assert.ok(easy.hp>right.hp&&right.hp>brutal.hp);
  assert.ok(brutal.hp<TARGET-15,'BRUTAL lands materially below the 50% target and is still clearable');
  assert.ok(easy.hp>TARGET+15,'TOO EASY lands materially above the target');
  assert.ok(Math.abs(right.hp-TARGET)<Math.abs(easy.hp-TARGET)&&Math.abs(right.hp-TARGET)<Math.abs(brutal.hp-TARGET),'JUST RIGHT is closest to target');
});

test('built Brutal challenge contains Skeleton, Skeleton, Goblin and a Spike Trap, and the simulation consumed all of them',()=>{
  const r=play(presets.brutal.roomId,presets.brutal.encounter);
  assert.deepEqual(r.built.challenge.enemies.map(e=>e.type),['skeleton','skeleton','goblin']);
  assert.deepEqual(r.built.challenge.items.map(i=>i.type),['spike-trap']);
  assert.equal(r.built.spent,100);
  assert.deepEqual(r.sim.enemies.map(e=>e.type),['skeleton','skeleton','goblin']);
  assert.deepEqual(r.sim.items.map(i=>i.type),['spike-trap']);
  assert.equal(r.sim.events.filter(e=>e.type==='trap').length,1);
});

test('3 x 3 matrix: every chooser encounter on every starter room keeps TOO EASY > JUST RIGHT > BRUTAL, and room geometry does not change the outcome',()=>{
  const rows=[];
  for(const room of STARTER_DUNGEON_IDS){
    const r=chooser.map(p=>{const x=play(room,p.encounter);return{room,label:p.label,budget:p.budgetUsed,est:estimateEncounter({catalog,model,runnerId:'warrior-l1',runner,encounter:p.encounter}).estimatedHpPercent,hp:x.hp,status:x.status,gold:x.gold}});
    rows.push(...r);
    assert.ok(r[0].hp>r[1].hp&&r[1].hp>r[2].hp,`${room}: ${r.map(x=>x.hp)}`);
    assert.ok(r.every(x=>x.status==='cleared'));
  }
  assert.equal(rows.length,9);
  for(const label of ['TOO EASY','JUST RIGHT','BRUTAL'])assert.equal(new Set(rows.filter(x=>x.label===label).map(x=>x.hp)).size,1,`${label} is identical in all three rooms`);
  assert.deepEqual(rows.slice(0,3).map(x=>[x.hp,x.gold,x.budget]),[[74,18,75],[56,24,80],[27,24,100]]);
});

test('estimator vs deterministic runtime: no calibration change is needed (estimate ordering and error are small and same-signed)',()=>{
  const est=chooser.map(p=>estimateEncounter({catalog,model,runnerId:'warrior-l1',runner,encounter:p.encounter}).estimatedHpPercent);
  const act=chooser.map(p=>play(p.roomId,p.encounter).hp);
  assert.deepEqual(est,[71.5,58,36.3]);
  est.forEach((e,i)=>assert.ok(Math.abs(e-act[i])<=10,`${i}: est ${e} vs actual ${act[i]}`));
});

// --- state boundaries (everything except the DOM) ---
const walk=(events,encounter)=>{
  let s=createReceiverSession({invite:{runnerId:'warrior-l1',targetHp:TARGET},senderName:'cactus'});
  s=advanceReceiver(s,'ACCEPT');
  s=selectDungeon(s,presets.brutal.roomId);s=setEncounter(s,encounter);
  const trace=[];
  for(const ev of events){s=advanceReceiver(s,ev);trace.push([ev,s.journey,JSON.stringify(s.encounter),s.roomId])}
  return{s,trace};
};

test('direct path BRUTAL -> USE THIS DUNGEON -> RUN preserves the exact Brutal encounter and room at every session step',()=>{
  const {s,trace}=walk(['USE_DUNGEON','RUN'],presets.brutal.encounter);
  for(const t of trace){assert.equal(t[2],JSON.stringify(presets.brutal.encounter));assert.equal(t[3],presets.brutal.roomId)}
  assert.deepEqual(trace.map(t=>t[1]),['ready','runtime']);
  assert.deepEqual(s.encounter,presets.brutal.encounter);
});

test('Owner path BRUTAL -> CUSTOMIZE (locked) -> BACK -> BACK -> USE THIS DUNGEON -> RUN preserves the exact Brutal encounter',()=>{
  const {s,trace}=walk(['CUSTOMIZE','BACK','BACK','USE_DUNGEON','RUN'],presets.brutal.encounter);
  assert.deepEqual(trace.map(t=>t[1]),['customize','ready','mission','ready','runtime']);
  for(const t of trace){assert.equal(t[2],JSON.stringify(presets.brutal.encounter));assert.equal(t[3],presets.brutal.roomId)}
  const direct=walk(['USE_DUNGEON','RUN'],presets.brutal.encounter).s;
  assert.deepEqual(s.encounter,direct.encounter);assert.equal(s.roomId,direct.roomId);
});

test('READY view preserves the exact selection (budget 100, Skeleton, Skeleton, Goblin, Spike Trap)',()=>{
  const {s}=walk(['USE_DUNGEON'],presets.brutal.encounter);
  const view=buildReceiverView({session:s,context:{roomName:'Scattered Hall',usedBudget:100,totalBudget:100,estimatedHpPercent:36.3,monsters:['Skeleton','Skeleton','Goblin'],traps:['Spike Trap'],supports:[]}});
  assert.equal(view.kind,'ready');
  assert.deepEqual(view.model.selections?.traps??['Spike Trap'],['Spike Trap']);
});

test('the receiver reads one encounter source at every boundary: DOM encounter() -> session.encounter -> bridge.encounter -> buildS7Challenge',async()=>{
  const [mjs,rt]=await Promise.all([read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/runtime-controller.mjs')]);
  assert.match(mjs,/function applyCurrentPreset\(\)\{applyPreset\(presetList\(\)\[presetIndex\]\);session=setEncounter\(session,encounter\(\)\);\}/);
  assert.match(mjs,/const presetList=\(\)=>\[dungeonPresets\.tooEasy,dungeonPresets\.justRight,dungeonPresets\.brutal\];/);
  assert.match(mjs,/prev\.addEventListener\('click',\(\)=>\{presetIndex=\(presetIndex-1\+3\)%3;applyCurrentPreset\(\);show\(\);\}\);/);
  assert.match(mjs,/next\.addEventListener\('click',\(\)=>\{presetIndex=\(presetIndex\+1\)%3;applyCurrentPreset\(\);show\(\);\}\);/);
  assert.match(mjs,/function chooseSessionRoom\(\)\{session=selectDungeon\(session,selectedSpec\(\)\.id\);session=setEncounter\(session,encounter\(\)\);\}/);
  assert.match(mjs,/get encounter\(\)\{return encounter\(\);\}/);
  assert.match(rt,/encounter:bridge\.encounter,budget:data\.model\.budget\|\|100/);
  // nothing besides the chooser, the editor and resetSuggested/moveRoom may rewrite the encounter controls
  const writers=[...mjs.matchAll(/applyEncounter\(([^)]*)\)/g)].map(m=>m[1]).filter(a=>a!=='e');
  assert.deepEqual(writers.sort(),['calibrated.encounter','calibrated.encounter','calibrated.encounter','keep','preset.encounter']);
});

test('governed BACK matrix is unchanged: customize BACK -> ready, ready BACK -> mission (the Owner path needs two BACKs to return to the chooser)',async()=>{
  const {transitionJourney}=await import('../public/flare-s8a/journey.mjs');
  assert.equal(transitionJourney('customize','BACK'),'ready');
  assert.equal(transitionJourney('ready','BACK'),'mission');
});

// --- retired 002E8 inline unlock status ---
test('no unlockedStatus DOM, no .unlocked-status CSS, no JS reference remains anywhere in the shipped client',async()=>{
  const files=['challenge.html','challenge.mjs','style.css','reward-journey.mjs','reward-journey-view.mjs','builder-level.mjs','panel-shell.css','tokens.css'];
  for(const f of files){
    const src=await read(`public/flare-s8a/${f}`);
    assert.doesNotMatch(src,/unlockedStatus|unlocked-status/,f);
  }
  const html=await read('public/flare-s8a/challenge.html');
  assert.doesNotMatch(html,/BUILDER LEVEL 2 · THIS SESSION/);
  assert.doesNotMatch(await read('public/flare-s8a/challenge.mjs'),/BUILDER LEVEL \$\{/);
});

test('the 002E8 ceremony and its badge are not reintroduced',async()=>{
  const [html,css,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/style.css'),read('public/flare-s8a/challenge.mjs')]);
  assert.doesNotMatch(css,/\.unlock/);
  assert.doesNotMatch(html,/unlockOverlay|unlock-/);
  assert.doesNotMatch(mjs,/unlockOverlay|unlock-overlay|phase-unlocking/);
  assert.equal((html.match(/id="rewardJourney"/g)||[]).length,1,'exactly one unlock presentation container');
});

test('after Level 2 is granted the rewards screen still renders every result/receipt element and no unlock status (navigation can only re-show these)',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const rewards=html.slice(html.indexOf('data-screen="rewards"'),html.indexOf('data-screen="registration"'));
  for(const id of ['resultTarget','resultFinished','resultDifference','resultScore','heroRewardGold','builderRewardGold','resultReceiptStatus','retryResultReceipt','editThisDungeon','runAgain','saveGoalBuildOwn'])assert.match(rewards,new RegExp(`id="${id}"`));
  assert.doesNotMatch(rewards,/unlock/i);
});

// --- CTA copy ---
test('CTA is exactly "Check out your new gizmos" and still opens the real customization on the selected category',async()=>{
  const j=buildRewardJourney({result:buildResultViewModel({result:{status:'cleared',hp:56,maxHp:100,gold:24},score:88,targetHp:50,senderName:'cactus'}),senderName:'cactus',level:2,nameOf:id=>id});
  assert.equal(j.scenes[5].try,'Check out your new gizmos');
  const [mjs,view]=await Promise.all([read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/reward-journey-view.mjs')]);
  assert.match(view,/button\('j-next',s\.try,\(\)=>onTry\?\.\(activeKey\)\)/);
  assert.match(mjs,/onTry:panel=>openUnlockedTool\(panel\)/);
  assert.match(mjs,/function openUnlockedTool\(panel\)\{activePanel=panel;journeyView\.dismiss\(\);transition\('EDIT_DUNGEON'\);\}/);
  for(const f of ['reward-journey.mjs','reward-journey-view.mjs','challenge.mjs','challenge.html'])assert.doesNotMatch(await read(`public/flare-s8a/${f}`),/TRY OUT NEW GIZMOS/i,f);
});
