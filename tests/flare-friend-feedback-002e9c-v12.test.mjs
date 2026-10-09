import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readFile} from 'node:fs/promises';
import {parseMap} from '../public/flare-p0/src/core/flare.mjs';
import {S7_ROOMS} from '../public/flare-s7/rooms.mjs';
import {applyRunnerModel,runnerSummary,normalizeEncounter} from '../public/flare-s7/game.mjs';
import {LEVEL1_PRESETS,MAX_GUARD_SLOTS,buildLevel1Presets,createRunSimulation,buildRunChallenge,assertLegalEncounter,isGovernedBrutal,governedCost,governedHeroGold,monsterCount,estimateGoverned,describeMix,PLAYER_BUDGET} from '../public/flare-s8a/governed-encounter.mjs';
import {extendModelWithLevel2,extendCatalogWithLevel2} from '../public/flare-s8a/level2-content.mjs';
import {contentForLevel,STARTER_DUNGEON_IDS,BROKEN_GALLERY_ID} from '../public/flare-s8a/builder-level.mjs';
import {createReplayContext,replayInputs} from '../public/flare-s8a/replay-context.mjs';
import {canonicalRunInputJson} from '../public/flare-s8a/canonical-run-input.mjs';
import {buildRewardJourney,JOURNEY_STAGE_BY_SCENE,LOOT_REVIEW_SCENES} from '../public/flare-s8a/reward-journey.mjs';
import {buildResultViewModel} from '../public/flare-s8a/result-view-model.mjs';
import {LOOT_ASSETS,CATEGORY_ASSET} from '../public/flare-s8a/loot-assets.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const readJson=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const model=extendModelWithLevel2(readJson('../public/flare-s7/data/game.json'));
const catalog=extendCatalogWithLevel2(applyRunnerModel(readJson('../public/flare-p0/data/catalog.json'),model,'warrior-l1'),model);
const runner=runnerSummary(model,'warrior-l1',catalog);
const roomMap=id=>{const m=parseMap(fs.readFileSync(new URL(`../public/flare-s7/${S7_ROOMS[id].local}`,import.meta.url),'utf8'));m.id=id;return m};
const [EASY,NICE,BRUTAL]=LEVEL1_PRESETS;
const play=(preset,roomId=preset.roomId)=>{const {built,sim}=createRunSimulation({roomId,roomTitle:S7_ROOMS[roomId].name,map:roomMap(roomId),catalog,targetHp:50,encounter:preset.encounter});sim.start();for(let i=0;i<3600&&sim.status==='running';i++)sim.step();const r=sim.result();return{built,sim,r}};
const names=e=>[...e.enemyTypes].filter(x=>x!=='none');

// ---------- A. Level 1 preset authority ----------
test('1: the Owner-only composition-authority screen is not in the player UI',async()=>{
  for(const f of ['challenge.html','challenge.mjs','style.css','reward-journey.mjs','reward-journey-view.mjs'])
    assert.doesNotMatch(await read(`public/flare-s8a/${f}`),/OWNER ONLY|COMPOSITION AUTHORITY|Three difficulty mixes|NOT SHOWN TO PLAYERS/i,f);
});
test('2: Level 1 EASY is exactly Skeleton + Goblin',()=>{assert.deepEqual(names(EASY.encounter),['skeleton','goblin']);assert.equal(EASY.label,'EASY');assert.equal(EASY.roomId,'iron-labyrinth-01');assert.equal(S7_ROOMS[EASY.roomId].name,'Pillar Court')});
test('3: Level 1 JUST NICE is exactly Skeleton + Goblin + Skeleton',()=>{assert.deepEqual(names(NICE.encounter),['skeleton','goblin','skeleton']);assert.equal(NICE.label,'JUST NICE');assert.equal(NICE.roomId,'iron-labyrinth-03');assert.equal(S7_ROOMS[NICE.roomId].name,'Crossed Court')});
test('4: Level 1 BRUTAL is exactly Goblin x2 + Skeleton x3 in Scattered Hall',()=>{assert.deepEqual([...BRUTAL.encounter.enemyTypes],['goblin','goblin','skeleton','skeleton','skeleton']);assert.equal(BRUTAL.label,'BRUTAL');assert.equal(BRUTAL.roomId,'iron-labyrinth-08');assert.equal(S7_ROOMS[BRUTAL.roomId].name,'Scattered Hall')});
test('5: no Level 1 preset contains support, traps, Zombie, Skeleton Archer or Broken Gallery; everything in them is unlocked at Level 1',()=>{
  const l1=contentForLevel(1);
  for(const p of LEVEL1_PRESETS){
    assert.deepEqual([...p.encounter.trapTypes],[],p.id);assert.deepEqual([...p.encounter.supportTypes],[],p.id);
    for(const m of names(p.encounter)){assert.ok(l1.monsters.includes(m),`${p.id}:${m}`);assert.ok(!['zombie','skeleton-archer'].includes(m))}
    assert.ok(STARTER_DUNGEON_IDS.includes(p.roomId));assert.notEqual(p.roomId,BROKEN_GALLERY_ID);
  }
  assert.deepEqual(LEVEL1_PRESETS.map(p=>p.roomId),[...STARTER_DUNGEON_IDS]);
  assert.doesNotMatch(JSON.stringify(LEVEL1_PRESETS.map(p=>[p.encounter.enemyTypes,p.encounter.supportTypes,p.encounter.trapTypes,p.roomId])),/potion|tonic|trap-|zombie|archer|-07/i);
});
test('player chooser maps EASY / JUST NICE / BRUTAL to Pillar Court / Crossed Court / Scattered Hall, defaults to JUST NICE, and ships no Owner screen',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.deepEqual(LEVEL1_PRESETS.map(p=>[p.label,S7_ROOMS[p.roomId].name]),[['EASY','Pillar Court'],['JUST NICE','Crossed Court'],['BRUTAL','Scattered Hall']]);
  assert.match(mjs,/let presetIndex=1;/);assert.match(mjs,/const presetList=\(\)=>dungeonPresets;/);
  const presets=buildLevel1Presets({catalog,model,runnerId:'warrior-l1',runner,targetHp:50});
  assert.deepEqual(presets.map(p=>describeMix(names(p.encounter).map(id=>catalog.enemies[id].name))),[['Skeleton','Goblin'],['Skeleton ×2','Goblin'],['Goblin ×2','Skeleton ×3']]);
});

// ---------- B/C/D. five-monster governed BRUTAL ----------
test('6: five-monster BRUTAL constructs (route placement for five positions, no items)',()=>{
  const b=buildRunChallenge({roomId:BRUTAL.roomId,roomTitle:'x',map:roomMap(BRUTAL.roomId),catalog,targetHp:50,encounter:BRUTAL.encounter});
  assert.equal(b.governed,true);assert.deepEqual(b.challenge.enemies.map(e=>e.type),['goblin','goblin','skeleton','skeleton','skeleton']);
  assert.equal(new Set(b.challenge.enemies.map(e=>e.at.join(','))).size,5,'five distinct positions');
  assert.deepEqual(b.challenge.items,[]);assert.equal(b.spent,130);
});
test('7: the simulation uses all five monsters: all five fight, all five are killed, Hero Gold reflects all five',()=>{
  const {sim,r}=play(BRUTAL);
  assert.equal(sim.enemies.length,5);assert.equal(r.totalEnemies,5);assert.equal(r.kills,5);assert.equal(r.gold,39);assert.equal(r.spent,130);
  for(const e of sim.enemies)assert.ok(sim.events.some(x=>x.type==='attack'&&x.actor===e.id)||sim.events.some(x=>x.type==='damage'&&x.target===e.id),`${e.id} took part`);
  assert.ok(sim.events.filter(x=>x.type==='death'&&x.actor!=='hero').length===5);
  assert.equal(governedHeroGold(catalog,BRUTAL.encounter),39);
});
test('8: serialization and replay preserve all five (challenge JSON, replay context, canonical run input)',()=>{
  const {built}=play(BRUTAL);
  const round=JSON.parse(JSON.stringify(built.challenge));assert.deepEqual(round,built.challenge);assert.equal(round.enemies.length,5);
  const ctx=createReplayContext({roomId:BRUTAL.roomId,encounter:BRUTAL.encounter,runnerId:'warrior-l1',targetHp:50,rulesVersion:'s8a-1'});
  assert.deepEqual([...replayInputs(ctx).encounter.enemyTypes],[...BRUTAL.encounter.enemyTypes]);
  assert.deepEqual(JSON.parse(canonicalRunInputJson(ctx)).encounter.enemyTypes,['goblin','goblin','skeleton','skeleton','skeleton']);
  const a=play(BRUTAL).r,b=play(BRUTAL).r;assert.deepEqual(a,b,'deterministic replay');
});
test('9: ordinary custom-build budget stays 100; guard slots are capacity (8), the budget is the gate',()=>{
  assert.equal(PLAYER_BUDGET,100);
  assert.throws(()=>assertLegalEncounter({roomId:'iron-labyrinth-03',catalog,encounter:{enemyTypes:['antlion','antlion','zombie'],trapTypes:[],supportTypes:[]}}),/Budget exceeded: 135\/100/);
  assert.equal(assertLegalEncounter({roomId:'iron-labyrinth-03',catalog,encounter:{enemyTypes:['goblin','goblin','goblin','goblin'],trapTypes:[],supportTypes:[]}}).governed,false,'four goblins = 80 is legal');
  assert.throws(()=>assertLegalEncounter({roomId:'iron-labyrinth-03',catalog,encounter:{enemyTypes:Array(9).fill('goblin'),trapTypes:[],supportTypes:[]}}),/Maximum 8 enemies/);
  assert.equal(assertLegalEncounter({roomId:'iron-labyrinth-03',catalog,encounter:{enemyTypes:['goblin','skeleton','skeleton'],trapTypes:[],supportTypes:[]}}).governed,false);
  assert.equal(readJson('../public/flare-s7/data/game.json').budget,100);
});
test('10: the only >100 exception is the exact governed BRUTAL (room, order, no traps, no supports)',()=>{
  const e=(enemyTypes,extra={})=>({enemyTypes,trapTypes:[],supportTypes:[],...extra});
  assert.equal(assertLegalEncounter({roomId:'iron-labyrinth-08',catalog,encounter:BRUTAL.encounter}).governed,true);
  assert.equal(isGovernedBrutal('iron-labyrinth-08',BRUTAL.encounter),true);
  for(const [room,enc] of [
    ['iron-labyrinth-03',e(['goblin','goblin','skeleton','skeleton','skeleton'])],
    ['iron-labyrinth-08',e(['skeleton','skeleton','skeleton','goblin','goblin'])],
    ['iron-labyrinth-08',e(['goblin','goblin','skeleton','skeleton','skeleton'],{trapTypes:['spike-trap']})],
    ['iron-labyrinth-08',e(['goblin','goblin','skeleton','skeleton','skeleton'],{supportTypes:['small-potion']})],
    ['iron-labyrinth-08',e(['skeleton','skeleton','skeleton','skeleton','skeleton'])],
    ['iron-labyrinth-08',e(['goblin','goblin','skeleton','skeleton','skeleton','goblin'])],
    ['iron-labyrinth-08',e(['antlion','antlion','zombie'])]
  ]){assert.equal(isGovernedBrutal(room,enc),false,JSON.stringify([room,enc]));assert.throws(()=>assertLegalEncounter({roomId:room,catalog,encounter:enc}));}
});
test('governed preset nominal cost is 130 and its monsters sit outside the three-slot estimator, so the extended estimator is used',()=>{
  assert.equal(governedCost(catalog,BRUTAL.encounter),130);assert.equal(monsterCount(BRUTAL.encounter),5);
  const est=estimateGoverned({catalog,model,runnerId:'warrior-l1',runner,encounter:BRUTAL.encounter});
  assert.equal(est.cost,130);assert.ok(est.estimatedHpPercent<60);
  assert.equal(normalizeEncounter(BRUTAL.encounter).enemyTypes.length,3,'the frozen estimator would have dropped two monsters');
});
test('the frozen predecessor trees were not edited for five-monster support',()=>{
  const g=fs.readFileSync(new URL('../public/flare-s8a/governed-encounter.mjs',import.meta.url),'utf8');
  assert.match(g,/Nothing in the frozen trees is edited/);
  assert.match(g,/class GovernedSimulation extends Simulation/);
});
test('the receiver keeps one encounter source: the active preset as authored, otherwise the guard mixer',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/const encounter=\(\)=>activePreset\?structuredClone\(activePreset\.encounter\):domEncounter\(\);/);
  assert.match(mjs,/function applyPreset\(preset\)\{[\s\S]*?activePreset=preset;\r?\n\}/);
  assert.match(mjs,/function commitEditorChange\(\)\{activePreset=null;/);
  const rt=await read('public/flare-s8a/runtime-controller.mjs');
  assert.match(rt,/createRunSimulation\(\{roomId:spec\.id,roomTitle:spec\.name,map:stock\.map,catalog:data\.catalog,targetHp:data\.invite\.targetHp,encounter:bridge\.encounter,budget:data\.model\.budget\|\|100\}\)/);
  assert.doesNotMatch(rt,/buildS7Challenge|new Simulation\(/);
});
test('the editor is a quantity mixer: no per-guard position controls, no Guard 4 / Guard 5 slots, eight guards of capacity',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/function renderGuardMixer\(panel,monsters\)\{/);
  assert.doesNotMatch(mjs,/guard-3|guard-4|GUARD 4|GUARD 5|GUARD \$\{/);
  assert.equal(MAX_GUARD_SLOTS,8);
});

// ---------- R. difficulty verification ----------
test('R: the three Level 1 presets at the default Runner and target 50 order EASY > JUST NICE > BRUTAL and nothing was tuned to a target',()=>{
  const [e,n,b]=LEVEL1_PRESETS.map(p=>play(p).r);
  assert.deepEqual([e.status,e.hp,e.gold],['cleared',74,15]);
  assert.deepEqual([n.status,n.hp,n.gold],['cleared',56,24]);
  assert.deepEqual([b.status,b.hp,b.gold,b.kills],['cleared',30,39,5]);
  assert.ok(e.hp>n.hp&&n.hp>b.hp);
  const presets=buildLevel1Presets({catalog,model,runnerId:'warrior-l1',runner,targetHp:50});
  assert.deepEqual(presets.map(p=>p.estimatedHpPercent),[76,58,34]);
  // compositions are constants, independent of the target
  const other=buildLevel1Presets({catalog,model,runnerId:'warrior-l1',runner,targetHp:80});
  assert.deepEqual(other.map(p=>[...p.encounter.enemyTypes]),presets.map(p=>[...p.encounter.enemyTypes]));
});
test('R: BRUTAL on the other starter rooms is not a governed run (the exception is room-bound)',()=>{
  assert.throws(()=>createRunSimulation({roomId:'iron-labyrinth-01',roomTitle:'x',map:roomMap('iron-labyrinth-01'),catalog,targetHp:50,encounter:BRUTAL.encounter}),/Budget exceeded: 130\/100/);
});

// ---------- F. READY (V12) ----------
test('15-18: READY is a static display — down-pointing yellow triangle, estimate numeral inside a green circle, ESTIMATED FINISH below, not interactive',async()=>{
  const [html,css,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/style.css'),read('public/flare-s8a/challenge.mjs')]);
  const ready=html.slice(html.indexOf('data-screen="ready"'),html.indexOf('data-screen="runtime"'));
  const gauge=ready.slice(ready.indexOf('id="readyGauge"'),ready.indexOf('class="summary-box"'));
  assert.match(css,/\.sg-target\{[^}]*border-top:18px solid #f2c45d/);          // points DOWN toward the target
  assert.doesNotMatch(css.match(/\.sg-target\{[^}]*\}/)[0],/border-bottom/);
  assert.match(css,/\.sg-estimate\{[^}]*border-radius:50%[^}]*border:4px solid #75dbc9/);   // green circle
  assert.match(mjs,/dot\.textContent=`\$\{Math\.round\(gauge\.estimatePercent\)\}%`/);        // dynamic numeral inside the circle
  assert.ok(gauge.indexOf('id="readyGaugeEstimate"')<gauge.indexOf('id="readyGaugeEstimateCopy"'),'copy is after (below) the circle');
  assert.match(css,/\.sg-estimate-copy\{[^}]*top:84px/);assert.match(css,/\.sg-estimate\{[^}]*top:27px/);
  assert.match(css,/\.sg-estimate-copy\{[^}]*animation:sgPulse/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.sg-estimate-copy\{animation:none!important/);
  assert.doesNotMatch(gauge,/<input|<button|type="range"|role="slider"|draggable/i);
  assert.match(css,/\.static-gauge\{[^}]*pointer-events:none/);
  assert.match(gauge,/role="img"/);
  assert.doesNotMatch(mjs.slice(mjs.indexOf('function renderReady(m){'),mjs.indexOf('function renderRunnerInspector')),/addEventListener|pointerdown|draggable/);
  assert.doesNotMatch(css.match(/\.static-gauge\{[^}]*\}/)[0],/cursor:(pointer|grab)/);
});
test('READY summary: dungeon, difficulty, monster count and level only — no guard positions, no build budget',async()=>{
  const [html,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs')]);
  const ready=html.slice(html.indexOf('data-screen="ready"'),html.indexOf('data-screen="runtime"'));
  assert.doesNotMatch(ready,/Guard|GUARD|BUDGET|budget/);
  const fn=mjs.slice(mjs.indexOf('function renderReady(m){'),mjs.indexOf('function renderRunnerInspector'));
  assert.doesNotMatch(fn,/Guard|budget|Budget|labels\(/);
  assert.match(fn,/monster\$\{count===1\?'':'s'\} · Level \$\{builderLevel\}/);
});

// ---------- H-O. New Gizmos overview and loot review (V12) ----------
const journey=()=>buildRewardJourney({result:buildResultViewModel({result:{status:'cleared',hp:56,maxHp:100,gold:24},score:88,targetHp:50,senderName:'cactus'}),senderName:'cactus',level:2,nameOf:(id)=>({zombie:'Zombie','skeleton-archer':'Skeleton Archer','spike-trap':'Spike Trap','dart-trap':'Dart Trap','iron-labyrinth-07':'Broken Gallery'})[id]||id});
test('19-22: overview has four selectable categories; Support is selectable with the empty-state loot screen; no invented Support',()=>{
  const g=journey().scenes.find(s=>s.id==='gizmos');
  assert.equal(g.categories.length,4);assert.deepEqual(g.categories.map(c=>c.scene),['loot-monsters','loot-traps','loot-support','loot-dungeon']);
  assert.deepEqual(g.categories.map(c=>c.count),['2 new','2 new','no new item','1 new']);
  const sup=journey().scenes.find(s=>s.id==='loot-support');assert.equal(sup.body,'No new Support unlocked at Level 2.');assert.deepEqual(g.categories[2].items,[]);
});
test('20/21: category cards are visually consistent and aligned on fixed rows; Support is muted, not bright cyan',async()=>{
  const css=await read('public/flare-s8a/style.css');
  const cat=css.match(/\.j-cat\{[^}]*\}/)[0];
  assert.match(cat,/grid-template-rows:92px 24px 20px/);assert.match(cat,/border:2px solid #8e6999/);assert.match(cat,/linear-gradient\(180deg,#2a1730,#211127\)/);
  assert.match(css,/\.j-cat strong\{[^}]*align-self:center/);assert.match(css,/\.j-cat small\{[^}]*align-self:center/);
  assert.doesNotMatch(css.match(/\.j-cat\.is-support\{[^}]*\}/)?.[0]||'',/./,'Support gets no special border/glow of its own');
  assert.match(css,/\.support-icon\{[^}]*filter:saturate\(\.38\) brightness\(\.92\)/);
  assert.doesNotMatch(css.match(/\.support-icon\{[^}]*\}/)[0],/#9be3d5|#75dbc9|cyan/i);
  assert.match(css,/\.j-cat-art img\{[^}]*filter:brightness\(\.9\) saturate\(\.72\)/);
});
test('23/24/28: monster and trap review use LEFT/RIGHT arrows + Back to Gizmos; no sliders, no editing, no Save/Reset anywhere in the loot review',async()=>{
  const view=await read('public/flare-s8a/reward-journey-view.mjs');
  assert.match(view,/function lootBrowser\(s,box,kind\)/);
  assert.match(view,/button\('j-arrow','‹'/);assert.match(view,/button\('j-arrow','›'/);
  assert.match(view,/const backButton=s=>button\('j-back',s\.back,\(\)=>goId\('gizmos'\)\)/);
  const j=journey();for(const id of ['loot-monsters','loot-traps','loot-support','loot-dungeon'])assert.equal(j.scenes.find(s=>s.id===id).back,'‹ BACK TO GIZMOS');
  assert.doesNotMatch(view.replace(/\/\/.*$/gm,''),/SAVE CHANGES|RESET|Reset|type=.range|slider|<input|createElement\('input'\)|el\('input'/i);
  assert.doesNotMatch(JSON.stringify(j),/SAVE CHANGES|RESET TO SUGGESTED|Guard 1|Guard 2|Guard 3|GUARD/);
  const css=await read('public/flare-s8a/style.css');
  const arrows=css.match(/\.j-arrows\{[^}]*\}/)[0];assert.doesNotMatch(arrows,/overflow-x:\s*(auto|scroll)/);
});
test('monster and trap loot use governed Flare thumbnails packaged locally (no blank cards, no emoji)',async()=>{
  const j=journey();
  const mon=j.scenes.find(s=>s.id==='loot-monsters'),trap=j.scenes.find(s=>s.id==='loot-traps');
  assert.deepEqual(mon.items.map(i=>[i.name,i.copy,i.asset]),[['Zombie','Bruiser · Level 2','zombie'],['Skeleton Archer','Ranged Guard · Level 2','skeleton-archer']]);
  assert.deepEqual(trap.items.map(i=>[i.name,i.copy,i.asset]),[['Spike Trap','New Level 2 hazard','spike-trap'],['Dart Trap','New Level 2 hazard','dart-trap']]);
  for(const [key,url] of Object.entries(LOOT_ASSETS)){
    const file=new URL(url);const bytes=fs.readFileSync(file);
    assert.equal(bytes.subarray(1,4).toString(),'PNG',key);assert.ok(bytes.length>1500,key);
  }
  assert.deepEqual(CATEGORY_ASSET,{monsters:'zombie',traps:'spike-trap',supports:null,dungeons:'broken-gallery'});
  for(const f of ['reward-journey.mjs','reward-journey-view.mjs','loot-assets.mjs'])assert.doesNotMatch(await read(`public/flare-s8a/${f}`),/[👾⚠🧪🏰]/u);
  assert.doesNotMatch(await read('public/flare-s8a/reward-journey-view.mjs'),/fetch\(|raw\.githubusercontent/,'the journey needs no remote artwork');
});
test('25: Broken Gallery gets the flashing NEW DUNGEON badge and confetti; Scattered Hall is not highlighted as new',async()=>{
  const [view,css]=await Promise.all([read('public/flare-s8a/reward-journey-view.mjs'),read('public/flare-s8a/style.css')]);
  const d=journey().scenes.find(s=>s.id==='loot-dungeon');
  assert.equal(d.badge,'NEW DUNGEON');assert.equal(d.title,'Broken Gallery');assert.equal(d.subtitle,'Unlocked at Builder Level 2');assert.equal(d.item.id,'iron-labyrinth-07');
  assert.match(view,/'loot-dungeon'\(s,box\)\{[\s\S]*?confetti\(layer,36\)[\s\S]*?j-new-badge/);
  assert.match(css,/\.j-new-badge\{[^}]*animation:jNewFlash/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.j-new-badge\{animation:none!important/);
  assert.doesNotMatch(JSON.stringify(journey()),/Scattered Hall/);
});
test('26/27/28: CTA is exactly "Check out your new gizmos" and starts the loot review, never EDIT DUNGEON',async()=>{
  const g=journey().scenes.find(s=>s.id==='gizmos');
  assert.equal(g.try,'Check out your new gizmos');assert.equal(g.next,'loot-monsters');
  const [view,mjs]=await Promise.all([read('public/flare-s8a/reward-journey-view.mjs'),read('public/flare-s8a/challenge.mjs')]);
  assert.match(view,/button\('j-next',s\.try,\(\)=>goId\(s\.next\)\)/);
  assert.doesNotMatch(view,/EDIT_DUNGEON|onTry|openUnlockedTool/);
  for(const f of ['reward-journey.mjs','reward-journey-view.mjs','challenge.mjs'])assert.doesNotMatch(await read(`public/flare-s8a/${f}`),/Try out new gizmos/i);
  // the only journey path into the editor is the explicit CUSTOMIZE THIS DUNGEON on the last scene
  assert.match(mjs,/onCustomize:\(\)=>\{[\s\S]*?openUnlockedTool\('monsters'\);\s*\}/);
  assert.equal(view.split('onCustomize').length-1,2);
});
test('29: final loot page copy matches Owner authority exactly',()=>{
  const f=journey().scenes.find(s=>s.id==='loot-complete');
  assert.deepEqual([f.eyebrow,f.title,f.headline,f.body],['LOOT REVIEW COMPLETE','Your new gizmos are ready!','You may use them to create more challenging dungeons',"I am sure your friend can't wait to see what you can come up with next!"]);
  assert.equal(f.next,'CONTINUE JOURNEY →');
});
test('loot review sequence: overview -> monsters -> traps -> support -> dungeon -> complete -> keep progressing; dots stay on seven stages',()=>{
  const ids=journey().scenes.map(s=>s.id);
  assert.deepEqual(ids.slice(5),['gizmos','loot-monsters','loot-traps','loot-support','loot-dungeon','loot-complete','momentum']);
  const next=Object.fromEntries(journey().scenes.filter(s=>s.nextScene).map(s=>[s.id,s.nextScene]));
  assert.deepEqual(next,{'loot-monsters':'loot-traps','loot-traps':'loot-support','loot-support':'loot-dungeon','loot-dungeon':'loot-complete'});
  assert.deepEqual([...LOOT_REVIEW_SCENES],['loot-monsters','loot-traps','loot-support','loot-dungeon']);
  assert.equal(new Set(Object.values(JOURNEY_STAGE_BY_SCENE)).size,7);
});
test('30: no retired 002E8 cyan unlock status or ceremony returns',async()=>{
  for(const f of ['challenge.html','challenge.mjs','style.css','reward-journey.mjs','reward-journey-view.mjs'])assert.doesNotMatch(await read(`public/flare-s8a/${f}`),/unlockedStatus|unlocked-status|unlockOverlay|unlock-overlay|phase-unlocking|BUILDER LEVEL 2 · THIS SESSION/,f);
});
test('old New Gizmos tool-card/detail UI is gone (replaced by the V12 overview + loot review)',async()=>{
  const [css,view]=await Promise.all([read('public/flare-s8a/style.css'),read('public/flare-s8a/reward-journey-view.mjs')]);
  assert.doesNotMatch(css,/\.j-tool\b|\.j-detail\b|\.j-assets\b|\.j-asset\b/);
  assert.doesNotMatch(view,/j-tool|j-detail|drawArt|drawDungeon/);
});
test('Level 1 stays clean: no Level 2 loot in the Level 1 dungeons and customization remains locked until Level 2',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.match(html,/id="customizeLocked" class="locked-teaser" hidden/);
  assert.deepEqual(contentForLevel(1).dungeons,[...STARTER_DUNGEON_IDS]);
  assert.ok(!contentForLevel(1).monsters.includes('zombie'));assert.deepEqual(contentForLevel(1).traps,[]);
});

// ---------- the real view module, rendered against a minimal fake DOM (catches runtime errors source-greps cannot) ----------
class FakeNode{
  constructor(tag){this.tag=tag;this.children=[];this.className='';this.textContent='';this.dataset={};this.attrs={};this.listeners={};this.hidden=false;this.style={setProperty(){}};this.classList={add:()=>{},remove:()=>{},toggle:()=>{}};}
  append(...n){for(const x of n)this.children.push(typeof x==='string'?Object.assign(new FakeNode('#text'),{textContent:x}):x)}
  replaceChildren(...n){this.children=[];this.append(...n)}
  setAttribute(k,v){this.attrs[k]=v}
  addEventListener(t,f){(this.listeners[t]??=[]).push(f)}
  focus(){}
  querySelector(sel){const cls=sel.replace(/^button\./,'').replace(/^\./,'');return this.all().find(n=>n!==this&&(sel.startsWith('button')?n.tag==='button':true)&&String(n.className).split(' ').includes(cls))||null}
  click(){for(const f of this.listeners.click||[])f({target:this})}
  all(){return[this,...this.children.flatMap(c=>c.all?c.all():[])]}
  text(){return [this.textContent,...this.children.map(c=>c.text())].join(' ').replace(/\s+/g,' ').trim()}
}
async function withFakeDom(fn){
  const g=globalThis,old={document:g.document,raf:g.requestAnimationFrame,Audio:g.AudioContext};
  g.document={createElement:t=>new FakeNode(t),createTextNode:t=>Object.assign(new FakeNode('#text'),{textContent:t})};
  g.requestAnimationFrame=f=>0;g.AudioContext=undefined;
  try{return await fn()}finally{g.document=old.document;g.requestAnimationFrame=old.raf;g.AudioContext=old.Audio}
}
test('the real journey view renders every scene and walks the full loot review without errors, with only browse controls',async()=>{
  const {createRewardJourney}=await import('../public/flare-s8a/reward-journey-view.mjs');
  await withFakeDom(()=>{
    const root=new FakeNode('div'),calls=[];
    const view=createRewardJourney({root,coinSrc:'coin.png',startHero:()=>()=>{},reducedMotion:()=>true,onCustomize:()=>calls.push('customize'),onCreateAccount:()=>calls.push('account'),onGuest:()=>calls.push('guest')});
    const j=journey();view.start(j);
    const btn=label=>root.all().find(n=>n.tag==='button'&&n.text()===label);
    const buttons=()=>root.all().filter(n=>n.tag==='button').map(n=>n.text());
    const seen=[];const here=()=>{seen.push(view.sceneId);return buttons()};
    for(const label of ['CONTINUE →','NEXT →','NEXT →','NEXT →','SEE WHAT YOU UNLOCKED →']){assert.ok(btn(label),`${view.sceneId}: ${label}`);here();btn(label).click();}
    assert.equal(view.sceneId,'gizmos');
    const cats=root.all().filter(n=>n.tag==='button'&&/^(MONSTERS|TRAPS|SUPPORT|DUNGEONS)/.test(n.text()));
    assert.equal(cats.length,4);assert.deepEqual(cats.map(c=>c.text()),['MONSTERS 2 new','TRAPS 2 new','SUPPORT no new item','DUNGEONS 1 new']);
    assert.ok(btn('Check out your new gizmos'));
    // every category is selectable and returns via Back to Gizmos
    for(const [i,sceneId] of ['loot-monsters','loot-traps','loot-support','loot-dungeon'].entries()){
      root.all().filter(n=>n.tag==='button'&&/^(MONSTERS|TRAPS|SUPPORT|DUNGEONS)/.test(n.text()))[i].click();
      assert.equal(view.sceneId,sceneId);
      const b=buttons();assert.ok(b.includes('‹ BACK TO GIZMOS'),sceneId);
      assert.ok(!b.some(t=>/SAVE|RESET|EDIT/i.test(t)),`${sceneId}: ${b}`);
      btn('‹ BACK TO GIZMOS').click();assert.equal(view.sceneId,'gizmos');
    }
    // the CTA enters the review (not the editor); arrows browse; NEXT walks to the final page
    btn('Check out your new gizmos').click();assert.equal(view.sceneId,'loot-monsters');
    assert.match(root.text(),/Zombie/);btn('›').click();assert.match(root.text(),/Skeleton Archer/);btn('‹').click();assert.match(root.text(),/Zombie/);
    btn('NEXT →').click();assert.equal(view.sceneId,'loot-traps');assert.match(root.text(),/Spike Trap/);btn('›').click();assert.match(root.text(),/Dart Trap/);
    btn('NEXT →').click();assert.equal(view.sceneId,'loot-support');assert.match(root.text(),/No new Support unlocked at Level 2\./);
    btn('NEXT →').click();assert.equal(view.sceneId,'loot-dungeon');assert.match(root.text(),/NEW DUNGEON/);assert.match(root.text(),/Broken Gallery/);
    btn('NEXT →').click();assert.equal(view.sceneId,'loot-complete');assert.match(root.text(),/LOOT REVIEW COMPLETE.*Your new gizmos are ready!.*You may use them to create more challenging dungeons.*I am sure your friend can't wait/);
    assert.deepEqual(calls,[],'nothing opened the editor during the loot review');
    btn('CONTINUE JOURNEY →').click();assert.equal(view.sceneId,'momentum');
    btn('CUSTOMIZE THIS DUNGEON').click();assert.deepEqual(calls,['customize']);
    view.dismiss();assert.equal(root.hidden,true);
  });
});
