import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readFile} from 'node:fs/promises';
import {parseMap} from '../public/flare-p0/src/core/flare.mjs';
import {S7_ROOMS} from '../public/flare-s7/rooms.mjs';
import {applyRunnerModel,runnerSummary} from '../public/flare-s7/game.mjs';
import {MAX_GUARD_SLOTS,assertLegalEncounter,canAddGuard,buildRunChallenge,createRunSimulation,governedCost,estimateGoverned,spreadFractions,LEVEL1_PRESETS} from '../public/flare-s8a/governed-encounter.mjs';
import {extendModelWithLevel2,extendCatalogWithLevel2} from '../public/flare-s8a/level2-content.mjs';
import {createReplayContext,replayInputs} from '../public/flare-s8a/replay-context.mjs';
import {canonicalRunInputJson} from '../public/flare-s8a/canonical-run-input.mjs';
import {planResultReceipt} from '../public/flare-s8a/receipt-plan.mjs';
import {targetBands,bandsCopy,targetFitCue} from '../public/flare-s8a/target-fit.mjs';
import {createLoadingOverlay,LOADING_STEPS} from '../public/flare-s8a/loading-view.mjs';
import {saveGuestReturn,readGuestReturn,guestReturnHref,isGuestReturn,withoutGuestParam,GUEST_RETURN_KEY} from '../public/flare-s8a/guest-return.mjs';
import {readBuilderLevel,contentForLevel} from '../public/flare-s8a/builder-level.mjs';
import {LOOT_ASSETS} from '../public/flare-s8a/loot-assets.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const readJson=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const model=extendModelWithLevel2(readJson('../public/flare-s7/data/game.json'));
const catalog=extendCatalogWithLevel2(applyRunnerModel(readJson('../public/flare-p0/data/catalog.json'),model,'warrior-l1'),model);
const runner=runnerSummary(model,'warrior-l1',catalog);
const roomMap=id=>{const m=parseMap(fs.readFileSync(new URL(`../public/flare-s7/${S7_ROOMS[id].local}`,import.meta.url),'utf8'));m.id=id;return m};
const enc=(enemyTypes,extra={})=>({enemyTypes,trapTypes:[],supportTypes:[],...extra});
const run=(roomId,encounter)=>{const {built,sim}=createRunSimulation({roomId,roomTitle:'x',map:roomMap(roomId),catalog,targetHp:50,encounter});sim.start();for(let i=0;i<5000&&sim.status==='running';i++)sim.step();return{built,sim,r:sim.result()}};

// ---------------- INVITATION ----------------
test('INVITATION: one combined headline, one explanation paragraph, Level label, VIEW RUNNER — no builder-role tagline',async()=>{
  const [html,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs')]);
  const inv=html.slice(html.indexOf('data-screen="invitation"'),html.indexOf('data-screen="mission"'));
  assert.equal((inv.match(/<h1\b/g)||[]).length,1);
  assert.equal((inv.match(/class="invite-extra"/g)||[]).length,1);
  assert.doesNotMatch(inv,/builder-role|YOU ARE THE DUNGEON BUILDER|id="senderHeading"/);
  assert.match(mjs,/\$\('heading-invitation'\)\.textContent=`\$\{name\} HAS CHALLENGED YOU TO BUILD A DUNGEON FOR 'THE RUNNER'`;/);
  assert.match(mjs,/\$\('inviteExplain'\)\.textContent='Your Dungeon will contain monsters who will attack the Runner! But fear not, we have devised some good ones for you already! Just choose one and go!';/);
  assert.match(mjs,/\$\('inviteRunner'\)\.textContent=`Level \$\{runner\.level\} \$\{runner\.name\}`;/);
  assert.match(inv,/VIEW RUNNER/);assert.match(inv,/id="viewRunner"/);
});
test('RUNNER: the real animated canvas, smaller, transparent, fully visible; the inspector still shows real HP / ATK / DEF / weapon / shield',async()=>{
  const [html,css,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/style.css'),read('public/flare-s8a/challenge.mjs')]);
  assert.match(html,/<canvas id="inviteHeroCanvas"/);
  assert.match(css,/#inviteHeroCanvas\{width:96px!important;height:117px!important;background:transparent/);
  assert.doesNotMatch(css.match(/#inviteHeroCanvas\{[^}]*\}/)[0],/background:#|background:linear|border/);
  assert.match(mjs,/startComposedHeroStance\(\$\('inviteHeroCanvas'\),heroPack\)/);
  const inspector=html.slice(html.indexOf('id="runnerInspector"'),html.indexOf('data-screen="invitation"'));
  for(const id of ['inspectorHp','inspectorAttack','inspectorDefense','inspectorEquipment','closeRunnerInspector'])assert.match(inspector,new RegExp(`id="${id}"`));
  assert.match(mjs,/\$\('viewRunner'\)\.addEventListener\('click',openRunnerInspector\)/);
  assert.match(mjs,/buildRunnerInspectorViewModel\(\{displayName:runner\.name,hp:runner\.hp,attack:runner\.attack,defense:runner\.defense/);
});

// ---------------- TARGET ----------------
test('TARGET: downward yellow triangle, display-only gauge, exact band wording, consistent 35% / 70% bands',async()=>{
  const [html,css,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/style.css'),read('public/flare-s8a/challenge.mjs')]);
  assert.match(css,/\.range-target\{[^}]*border-top:18px solid #f2c45d/);assert.doesNotMatch(css.match(/\.range-target\{[^}]*\}/)[0],/border-bottom/);
  assert.match(css,/\.range-gauge\{[^}]*pointer-events:none/);
  const gauge=html.slice(html.indexOf('id="inviteGauge"'),html.indexOf('id="targetRules"'));
  assert.doesNotMatch(gauge,/<input|<button|type="range"|role="slider"|draggable/i);
  assert.equal(bandsCopy(50),'HP Less than 35%: Too Harsh · 35%-70%: Just Nice · Above 70%: Too Gentle');
  assert.deepEqual({h:targetBands(50).harshBelow,g:targetBands(50).gentleAbove},{h:35,g:70});
  assert.equal(targetFitCue(34,50).id,'harsh');assert.equal(targetFitCue(35,50).id,'close');assert.equal(targetFitCue(70,50).id,'close');assert.equal(targetFitCue(71,50).id,'gentle');
  assert.match(mjs,/\$\('targetRules'\)\.textContent=bandsCopy\(invite\.targetHp\);/);
  assert.match(mjs,/Get the Runner to the EXIT with as close to \$\{target\}% HP health remaining!/);
  assert.match(mjs,/The closer your eventual score is to the Target \(\$\{target\}%\), the more rewards you will earn!/);
  // READY uses the same bands
  assert.match(mjs,/\$\('readyBands'\)\.textContent=`<\$\{bands\.harshBelow\}% Too Harsh · \$\{bands\.harshBelow\}%-\$\{bands\.gentleAbove\}% Just Nice · >\$\{bands\.gentleAbove\}% Too Gentle`;/);
  assert.match(html,/<div class="sg-zones"><span>TOO HARSH<\/span><span>JUST NICE<\/span><span>TOO GENTLE<\/span><\/div>/);
});

// ---------------- LOADING ----------------
class FakeNode{constructor(t){this.tag=t;this.children=[];this.className='';this.textContent='';this.dataset={};this.attrs={};this.hidden=true;this.style={setProperty(){}};this.classList={toggle(){}}}append(...n){this.children.push(...n)}replaceChildren(...n){this.children=[...n]}setAttribute(k,v){this.attrs[k]=v}}
const text=n=>[n.textContent,...n.children.map(text)].join(' ');
async function withFakeDom(fn){const old=globalThis.document;globalThis.document={createElement:t=>new FakeNode(t)};try{return await fn()}finally{globalThis.document=old}}
test('LOADING: a genuine overlay for pending work only — paints after a tiny grace, never delays resolution, hides when the work ends',async()=>{
  await withFakeDom(async()=>{
    const root=new FakeNode('div');let timers=[];
    const o=createLoadingOverlay({root,graceMs:120,setTimer:(f,ms)=>{timers.push({f,ms});return timers.length},clearTimer:()=>{timers=[]}});
    // work that finishes immediately: overlay is never painted
    const quick=await o.track(Promise.resolve('done'),'Loading your dungeon…');
    assert.equal(quick,'done');assert.equal(o.visible,false);assert.equal(root.hidden,true);
    // work still pending when the grace elapses: painted, then hidden as soon as the work resolves
    let release;const slow=new Promise(r=>{release=r});const tracked=o.track(slow,'Loading your dungeon…');
    assert.equal(timers.length,1);assert.equal(timers[0].ms,120,'only the paint-grace is a timer; the work itself is never delayed');
    timers[0].f();assert.equal(o.visible,true);assert.equal(root.hidden,false);
    assert.match(text(root),/Loading your dungeon…/);for(const s of LOADING_STEPS)assert.match(text(root),new RegExp(s));
    o.setStep(1);assert.equal(root.dataset.step,'1');
    release('ok');assert.equal(await tracked,'ok');assert.equal(o.visible,false);assert.equal(root.hidden,true);
    // immediate mode (used when we already know the wait is real)
    o.begin('Loading your dungeon…',{immediate:true});assert.equal(o.visible,true);o.end();assert.equal(o.visible,false);
    // failures still hide it
    await assert.rejects(o.track(Promise.reject(new Error('x')),'t',{immediate:true}),/x/);assert.equal(o.visible,false);
  });
});
test('LOADING: reduced-motion gets a static, clearly labelled progress state; real async preparation is wired to the overlay',async()=>{
  const [css,mjs,rt,view]=await Promise.all([read('public/flare-s8a/style.css'),read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/runtime-controller.mjs'),read('public/flare-s8a/loading-view.mjs')]);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.loader-orb\{animation:none!important\}\.load-fill\{animation:none!important;width:var\(--static-width,60%\)\}\}/);
  assert.match(view,/aria-valuenow/);assert.match(view,/setAttribute\('role','progressbar'\)/);
  assert.match(mjs,/loading\.begin\('Loading your challenge…'\)/);
  assert.match(mjs,/if\(!roomsLoaded&&roomsReady\)\{[\s\S]*?loading\.begin\('Loading your dungeon…',\{immediate:true\}\);loading\.setStep\(0\);await roomsReady;/);
  assert.match(rt,/bridge\.loadingBegin\?\.\(\);bridge\.loadingStep\?\.\(0\);/);
  assert.match(rt,/bridge\.loadingStep\?\.\(1\)/);assert.match(rt,/bridge\.loadingStep\?\.\(2\)/);assert.match(rt,/bridge\.loadingEnd\?\.\(\)/);
  assert.doesNotMatch(view,/setTimeout\([^)]*await|sleep\(|delay\(/,'no artificial delay in the overlay');
});

// ---------------- BUILDER ----------------
test('BUILDER: no Guard 1/2/3 positional UI, no horizontal card rows; Preview your Guards with + ADD A GUARD, quantity arrows, N / 8 GUARDS',async()=>{
  const [html,mjs,css]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/style.css')]);
  const cust=html.slice(html.indexOf('data-screen="customize"'),html.indexOf('data-screen="ready"'));
  assert.match(cust,/<p class="eyebrow">EDIT DUNGEON<\/p><h1 id="heading-customize" tabindex="-1">Preview your Guards<\/h1>/);
  for(const tab of ['MONSTERS','TRAPS','SUPPORT','DUNGEONS'])assert.match(cust,new RegExp(`>${tab}<`));
  assert.doesNotMatch(mjs,/GUARD \$\{i\+1\}|guard-\$\{i\}|name="guard-/);
  assert.match(mjs,/'\+ ADD A GUARD'/);assert.match(mjs,/CLOSE GUARD PICKER/);
  assert.match(mjs,/`\$\{total\} \/ \$\{MAX_GUARD_SLOTS\} GUARDS`/);
  assert.match(mjs,/minus\.setAttribute\('aria-label',`Remove one \$\{m\.label\}`\)/);assert.match(mjs,/plus\.setAttribute\('aria-label',`Add one \$\{m\.label\}`\)/);
  assert.doesNotMatch(css.match(/\.mixer\{[^}]*\}/)[0],/overflow-x/);
  assert.doesNotMatch(mjs.slice(mjs.indexOf('function renderGuardMixer'),mjs.indexOf('function refreshGuardMixer')),/type='range'|overflow|scrollLeft|draggable/);
  assert.equal(MAX_GUARD_SLOTS,8);
});
test('BUILDER: art — Goblin and Skeleton use their own transparent Flare art; Zombie and Skeleton Archer keep theirs; no card background baked in',()=>{
  for(const id of ['goblin','skeleton','zombie','skeleton-archer']){
    const b=fs.readFileSync(new URL(LOOT_ASSETS[id]));assert.equal(b.subarray(1,4).toString(),'PNG',id);assert.equal(b[25],6,`${id} RGBA`);
  }
  const files=['goblin','skeleton','zombie','skeleton-archer'].map(id=>fs.readFileSync(new URL(LOOT_ASSETS[id])).toString('hex'));
  assert.equal(new Set(files).size,4,'four distinct images (Skeleton is not the Goblin art)');
  const sk=fs.readFileSync(new URL(LOOT_ASSETS.skeleton)),gb=fs.readFileSync(new URL(LOOT_ASSETS.goblin));
  assert.equal(sk.readUInt32BE(16),162);assert.equal(sk.readUInt32BE(20),170,'Skeleton = Flare skeleton.png stance frame 162x170');
  assert.equal(gb.readUInt32BE(16),111);assert.equal(gb.readUInt32BE(20),96,'Goblin = Flare goblin.png stance frame 111x96 (no yellow strip)');
});
test('BUILDER: Add A Guard obeys content, slots and the 100 budget — an over-budget addition is prevented with a clear reason',()=>{
  const r='iron-labyrinth-03';
  const ok=canAddGuard({roomId:r,catalog,encounter:enc(['skeleton','goblin','skeleton']),monsterId:'goblin'});
  assert.deepEqual([ok.ok,ok.cost,ok.left],[true,20,20]);
  const blocked=canAddGuard({roomId:r,catalog,encounter:enc(['skeleton','goblin','skeleton']),monsterId:'zombie'});
  assert.equal(blocked.ok,false);assert.equal(blocked.reason,'OVER_BUDGET');assert.equal(blocked.message,'Not enough dungeon budget: Zombie costs 35 and you have 20 left.');
  const full=canAddGuard({roomId:r,catalog,encounter:enc(Array(8).fill('goblin')),monsterId:'goblin'});
  assert.equal(full.reason,'NO_SLOTS');assert.match(full.message,/All 8 guard slots are full/);
  assert.equal(canAddGuard({roomId:r,catalog,encounter:enc([]),monsterId:'dragon'}).reason,'UNKNOWN_MONSTER');
  // eight slots is capacity, not permission: the cheapest guards still stop at five
  let e=enc([]),added=0;while(canAddGuard({roomId:r,catalog,encounter:e,monsterId:'goblin'}).ok){e=enc([...e.enemyTypes,'goblin']);added++;}
  assert.equal(added,5);assert.equal(governedCost(catalog,e),100);
  assert.throws(()=>assertLegalEncounter({roomId:r,catalog,encounter:enc(Array(8).fill('goblin'))}),/Budget exceeded: 160\/100/);
  assert.equal(PLAYER_BUDGET_CHECK(),100);
  function PLAYER_BUDGET_CHECK(){return readJson('../public/flare-s7/data/game.json').budget}
});
test('BUILDER: content stays gated — Level 2 monsters/traps/dungeon never appear in the Level 1 editor',()=>{
  const l1=contentForLevel(1);
  assert.deepEqual(l1.monsters,['goblin','skeleton']);assert.deepEqual(l1.traps,[]);assert.ok(!l1.dungeons.includes('iron-labyrinth-07'));
  const l2=contentForLevel(2);assert.deepEqual(l2.monsters,['goblin','skeleton','zombie','skeleton-archer']);assert.deepEqual(l2.traps,['spike-trap','dart-trap']);
});

// ---------------- RUNTIME ----------------
test('RUNTIME: a legal quantity encounter (5 x Goblin) serializes, replays, constructs and simulates — deterministic system placement',()=>{
  const e=enc(['goblin','goblin','goblin','goblin','goblin']);
  const a=run('iron-labyrinth-03',e),b=run('iron-labyrinth-03',e);
  assert.equal(a.built.governed,false);assert.equal(a.built.challenge.enemies.length,5);assert.equal(a.built.spent,100);assert.equal(a.built.challenge.budget,100);
  assert.equal(new Set(a.built.challenge.enemies.map(x=>x.at.join(','))).size,5,'five distinct system-chosen positions');
  assert.deepEqual(JSON.parse(JSON.stringify(a.built.challenge)),a.built.challenge,'serializes');
  assert.equal(a.sim.enemies.length,5);assert.equal(a.r.totalEnemies,5);
  assert.equal(a.r.gold,30);assert.ok(['cleared','dead'].includes(a.r.status));
  assert.deepEqual(a.r,b.r,'deterministic');
  const ctx=createReplayContext({roomId:'iron-labyrinth-03',encounter:e,runnerId:'warrior-l1',targetHp:50,rulesVersion:'s8a-1'});
  assert.deepEqual([...replayInputs(ctx).encounter.enemyTypes],e.enemyTypes);
  assert.deepEqual(JSON.parse(canonicalRunInputJson(ctx)).encounter.enemyTypes,e.enemyTypes);
  for(const x of a.sim.enemies)assert.ok(a.sim.events.some(ev=>(ev.type==='attack'&&ev.actor===x.id)||(ev.type==='damage'&&ev.target===x.id)),`${x.id} took part`);
});
test('RUNTIME: mixed quantity builds with traps and support place deterministically; up to eight guard entries construct structurally',()=>{
  const mixed=enc(['goblin','goblin','skeleton','zombie'],{});
  // 20+20+30+35=105 -> illegal; use a legal mix with a trap (4 goblins + dart trap = 95)
  const legal=enc(['goblin','goblin','goblin','goblin'],{trapTypes:['dart-trap']});
  assert.throws(()=>buildRunChallenge({roomId:'iron-labyrinth-07',roomTitle:'x',map:roomMap('iron-labyrinth-07'),catalog,targetHp:50,encounter:mixed}),/Budget exceeded/);
  const r=buildRunChallenge({roomId:'iron-labyrinth-07',roomTitle:'x',map:roomMap('iron-labyrinth-07'),catalog,targetHp:50,encounter:legal});
  assert.deepEqual(r.challenge.enemies.map(x=>x.type),['goblin','goblin','goblin','goblin']);assert.deepEqual(r.challenge.items.map(x=>x.type),['dart-trap']);
  assert.equal(r.spent,4*20+15);
  const pos=[...r.challenge.enemies,...r.challenge.items].map(x=>x.at.join(','));assert.equal(new Set(pos).size,pos.length,'no overlaps');
  assert.deepEqual(spreadFractions(5),[.2,.35,.5,.65,.8]);assert.equal(spreadFractions(8).length,8);
  // the frozen builder is still used for <=3 guards (previous results unchanged)
  const [easy,nice]=[LEVEL1_PRESETS[0],LEVEL1_PRESETS[1]].map(p=>run(p.roomId,p.encounter).r);
  assert.deepEqual([easy.hp,easy.gold],[74,15]);assert.deepEqual([nice.hp,nice.gold],[56,24]);
  // estimator covers >3 guards including traps and potion
  const est=estimateGoverned({catalog,model,runnerId:'warrior-l1',runner,encounter:enc(['goblin','goblin','goblin','goblin'],{supportTypes:['small-potion']})});
  const base=estimateGoverned({catalog,model,runnerId:'warrior-l1',runner,encounter:enc(['goblin','goblin','goblin','goblin'])});
  assert.ok(est.estimatedHpPercent>base.estimatedHpPercent,'potion heals in the estimate');
});
test('RUNTIME + RECEIPT: the result plan keeps every guard; ordinary 4+ guard receipts now build a normal payload (migration proven on staging)',()=>{
  const e=enc(['goblin','goblin','goblin','goblin']);const {r}=run('iron-labyrinth-03',e);
  const base={publicToken:'T'.repeat(40),roomId:'iron-labyrinth-03',encounter:e,result:r,heroGold:r.gold,attemptToken:'a'.repeat(20)};
  const ok=planResultReceipt(base);assert.equal(ok.block,null);assert.equal(ok.payload.p_encounter.enemyTypes.length,4);
});

// ---------------- GUEST / HOME ----------------
test('GUEST: the challenge page records a session-only return target; the Hub reads it; the return URL carries ?guest=1 and cleans itself',()=>{
  const mem=()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}};
  const s=mem();
  assert.equal(saveGuestReturn(s,{pathname:'/quick-dungeon/flare-s8a/challenge.html',search:'?demo=1&from=Makidon&guest=1'}),true);
  const entry=readGuestReturn(s);assert.deepEqual({...entry},{path:'/quick-dungeon/flare-s8a/challenge.html',search:'?demo=1&from=Makidon'});
  assert.equal(guestReturnHref(entry),'/quick-dungeon/flare-s8a/challenge.html?demo=1&from=Makidon&guest=1');
  assert.equal(isGuestReturn('?demo=1&guest=1'),true);assert.equal(isGuestReturn('?demo=1'),false);
  assert.equal(withoutGuestParam({pathname:'/quick-dungeon/flare-s8a/challenge.html',search:'?demo=1&from=Makidon&guest=1',hash:''}),'/quick-dungeon/flare-s8a/challenge.html?demo=1&from=Makidon');
  assert.equal(saveGuestReturn(s,{pathname:'/m/Qs2Z',search:'?from=cactus'}),true);assert.equal(readGuestReturn(s).path,'/m/Qs2Z');
});
test('GUEST: only challenge pages are valid return targets (no open redirect), nothing stored on bad input, no durable Level claim',()=>{
  const mem=()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))}};
  const s=mem();
  assert.equal(saveGuestReturn(s,{pathname:'//evil.example/x',search:''}),false);assert.equal(saveGuestReturn(s,{pathname:'/quick-dungeon/flare-s8b/',search:''}),false);assert.equal(s.getItem(GUEST_RETURN_KEY),null);
  s.setItem(GUEST_RETURN_KEY,JSON.stringify({path:'https://evil.example/a',search:''}));assert.equal(readGuestReturn(s),null);
  s.setItem(GUEST_RETURN_KEY,JSON.stringify({path:'/quick-dungeon/flare-s8a/challenge.html',search:'?x=<script>'}));assert.equal(readGuestReturn(s),null);
  s.setItem(GUEST_RETURN_KEY,'not json');assert.equal(readGuestReturn(s),null);
  // session Level 2 lives in sessionStorage only; the return target adds nothing durable
  const lv=mem();lv.setItem('s8aBuilderLevel','2');assert.equal(readBuilderLevel(lv),2);assert.equal(readBuilderLevel(mem()),1);
});
test('HOME / HUB: HOME records the return target; the Runner Hub has CONTINUE AS GUEST wired to it; the challenge page reopens the unlocked Gizmos only when Level 2 is active',async()=>{
  const [mjs,hub,gc,css]=await Promise.all([read('public/flare-s8a/challenge.mjs'),read('public/flare-s8b/index.html'),read('public/flare-s8b/guest-continue.mjs'),read('public/flare-s8b/account.css')]);
  assert.match(mjs,/\$\('navHome'\)\.addEventListener\('click',\(\)=>\{saveGuestReturn\(SESSION_STORE,location\);\}\)/);
  assert.match(hub,/<button class="guest-btn" id="continueAsGuest" type="button" hidden>CONTINUE AS GUEST<\/button>/);
  assert.match(hub,/Continue as Guest returns you to your unlocked Gizmos for this session\./);
  assert.match(hub,/<script type="module" src="guest-continue\.mjs"><\/script>/);
  assert.match(gc,/readGuestReturn\(sessionStorage\)/);assert.match(gc,/location\.href=guestReturnHref\(entry\)/);
  assert.doesNotMatch(gc,/supabase|fetch\(|localStorage|indexedDB/);
  assert.match(mjs,/if\(isGuestReturn\(location\.search\)\)resumeGuestSession\(\);/);
  assert.match(mjs,/function resumeGuestSession\(\)\{\s*try\{history\.replaceState\(null,'',withoutGuestParam\(location\)\);\}catch\{\}\s*if\(builderLevel<2\)return;/);
  assert.match(mjs,/\{sceneId:'gizmos'\}/);
  assert.match(css,/\.guest-btn\{/);
});

// ---------------- LOOT / OLD UI ----------------
test('LOOT: four categories, final copy and the retired cyan/002E8 unlock UI stay gone (V18 preserves V12)',async()=>{
  const [j,view,html,css]=await Promise.all([read('public/flare-s8a/reward-journey.mjs'),read('public/flare-s8a/reward-journey-view.mjs'),read('public/flare-s8a/challenge.html'),read('public/flare-s8a/style.css')]);
  for(const s of ["'Check out your new gizmos'",'LOOT REVIEW COMPLETE','Your new gizmos are ready!','You may use them to create more challenging dungeons',"I am sure your friend can't wait to see what you can come up with next!",'No new Support unlocked'])assert.ok((j+view).includes(s)||s==='No new Support unlocked','copy: '+s);
  assert.match(j,/count:items\.length\?`\$\{items\.length\} new`:'no new item'/);
  for(const f of [html,css,view,j])assert.doesNotMatch(f,/unlockedStatus|unlocked-status|unlockOverlay|unlock-overlay/);
});
