#!/usr/bin/env node
// 002E9D — full Friend run clickthrough from a FRESH session, recorded to video.
//
// Drives the real browser UI (system Chrome via playwright-core) through the 51-step acceptance sequence at a
// 390 x 844 mobile viewport, asserting every step, and records the page with the Chrome DevTools screencast
// (frames are encoded with ffmpeg: H.264, yuv420p). Builder Level is NEVER set by hand: Level 2 is earned by the
// first completed run. The only shortcut is that, after the real runtime has played for a few seconds, the
// simulation is fast-forwarded to its end to keep the recording concise (completion, scoring and the receipt path
// are the normal client code). A little latency is added to Flare asset requests so the real loading screen is
// visible, as it is on a slower PC; the app adds no artificial delay of its own.
//
// Usage (preview server on :4178, system Chrome):
//   PLAYWRIGHT_CORE=<path to playwright-core> node tools/flare-friend-run-acceptance.mjs <outDir> [--no-video]
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const pw=await import(process.env.PLAYWRIGHT_CORE?pathToFileURL(path.join(process.env.PLAYWRIGHT_CORE,'index.mjs')).href:'playwright-core');
const {chromium}=pw.chromium?pw:pw.default;
const outDir=path.resolve(process.argv[2]||'friend-run-acceptance');
const record=!process.argv.includes('--no-video');
const CHROME=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FFMPEG=process.env.FFMPEG_PATH||'ffmpeg';
const BASE=process.env.BASE_URL||'http://127.0.0.1:4178';
const URL_START=`${BASE}/quick-dungeon/flare-s8a/challenge.html?demo=1&from=Makidon`;
const VIEWPORT={width:+(process.env.VIEW_W||390),height:+(process.env.VIEW_H||844)};
fs.mkdirSync(outDir,{recursive:true});

const results=[];const frames=[];let startedAt=Date.now();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({executablePath:CHROME,headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({viewport:VIEWPORT,deviceScaleFactor:2,isMobile:false,hasTouch:false});
const page=await context.newPage();
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!/404|favicon/i.test(m.text()))pageErrors.push('console: '+m.text());});

// click ripple (evidence harness only; purely visual, pointer-events:none)
await page.addInitScript(()=>{
  document.addEventListener('DOMContentLoaded',()=>{const o=document.getElementById('loadingOverlay');if(o)new MutationObserver(()=>{if(!o.hidden&&window.__s8aReceiver&&window.__s8aReceiver.session&&window.__s8aReceiver.session.journey==='runtime')window.__sawRunLoading=true;}).observe(o,{attributes:true,attributeFilter:['hidden']});});
  addEventListener('pointerdown',e=>{
    const d=document.createElement('div');
    d.style.cssText=`position:fixed;left:${e.clientX-18}px;top:${e.clientY-18}px;width:36px;height:36px;border-radius:50%;border:3px solid #ff5a5a;background:#ff5a5a44;z-index:2147483647;pointer-events:none;transition:transform .5s ease-out,opacity .5s ease-out`;
    (document.body||document.documentElement).append(d);
    requestAnimationFrame(()=>{d.style.transform='scale(1.8)';d.style.opacity='0';});
    setTimeout(()=>d.remove(),600);
  },true);
});

// ---- screencast ----
const cdp=await context.newCDPSession(page);
if(record){
  cdp.on('Page.screencastFrame',async f=>{frames.push({t:f.metadata.timestamp,data:Buffer.from(f.data,'base64')});try{await cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId});}catch{}});
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:82,maxWidth:VIEWPORT.width*2,maxHeight:VIEWPORT.height*2,everyNthFrame:1});
}

// Latency on Flare asset requests so the real loading screen is visible (slower-PC conditions). Not an app delay.
const FLARE_LATENCY=+(process.env.FLARE_LATENCY_MS||550);
// The dungeon/room tile requests are additionally held until the CHOOSE A DUNGEON click (then released after a short
// wait), i.e. a slow connection/PC where the rooms are still preparing when the player taps through — this is what
// makes the real loading screen appear at step 9. The app itself adds no delay.
let releaseRooms;const roomGate=new Promise(r=>{releaseRooms=r;});
await context.route(/raw\.githubusercontent\.com/,async route=>{await sleep(FLARE_LATENCY);if(/\/mods\/empyrean_campaign\//.test(route.request().url()))await roomGate;await route.continue();});

const state={n:0};
async function step(n,name,fn,{hold=700}={}){
  const began=Date.now();let ok=true,detail='';
  try{detail=(await fn())||'';}catch(e){ok=false;detail=String(e.message||e).split('\n')[0];}
  results.push({step:n,name,status:ok?'PASS':'FAIL',detail,ms:Date.now()-began});
  console.log(`${ok?'PASS':'FAIL'} ${String(n).padStart(2,'0')} ${name}${detail?' — '+detail:''}`);
  if(!ok)throw Object.assign(new Error(`STEP ${n} FAILED: ${name}: ${detail}`),{stepFailed:true});
  await sleep(hold);
}
const must=(cond,msg)=>{if(!cond)throw new Error(msg);};
const text=async sel=>(await page.locator(sel).first().innerText()).replace(/\s+/g,' ').trim();
const ev=(fn,arg)=>page.evaluate(fn,arg);
const sceneId=()=>ev(()=>document.getElementById('rewardJourney')?.dataset.scene||null);
const waitScene=(id,timeout=30000)=>page.waitForFunction(i=>document.getElementById('rewardJourney')?.dataset.scene===i,id,{timeout});
const journeyNext=async()=>{await page.locator('#rewardJourney .j-next').first().click();};

let fastForwarded=false,finalState={};
try{
  await step(1,'Invitation screen (fresh session, loading screen at boot, then the invitation)',async()=>{
    await page.goto(URL_START);
    await page.waitForFunction(()=>window.__s8aData,null,{timeout:120000});
    await page.waitForFunction(()=>document.getElementById('loadingOverlay').hidden,null,{timeout:60000});
    const s=await ev(()=>({lvl:sessionStorage.getItem('s8aBuilderLevel'),legacy:sessionStorage.getItem('s8aCustomizationUnlocked'),screen:[...document.querySelectorAll('[data-screen]')].filter(x=>!x.hidden).map(x=>x.dataset.screen)}));
    must(s.lvl===null&&s.legacy===null,'fresh session must have no Builder Level');must(s.screen.join()==='invitation','invitation visible');
    return 'fresh sessionStorage, invitation visible';
  },{hold:1500});
  await step(2,'Combined invitation headline',async()=>{
    const h=await text('#heading-invitation');
    must(h==="MAKIDON HAS CHALLENGED YOU TO BUILD A DUNGEON FOR 'THE RUNNER'",`headline was "${h}"`);
    must(await page.locator('.invitation-main h1').count()===1,'exactly one headline');
    must(await page.locator('.builder-role').count()===0,'no separate builder-role tagline');
    return h;
  },{hold:1200});
  await step(3,'Single explanatory paragraph',async()=>{
    const p=await text('#inviteExplain');
    must(p==='Your Dungeon will contain monsters who will attack the Runner! But fear not, we have devised some good ones for you already! Just choose one and go!',`paragraph was "${p}"`);
    must(await page.locator('.invite-extra').count()===1,'exactly one explanation block');
    return 'one paragraph';
  },{hold:1200});
  await step(4,'VIEW RUNNER',async()=>{
    must((await text('#inviteRunner'))==='Level 1 Rookie Warrior','runner label');
    const box=await page.locator('#inviteHeroCanvas').boundingBox();must(box.height<=140&&box.width<=120,`runner canvas ${box.width}x${box.height} is the smaller size`);
    must(box.y+box.height<=VIEWPORT.height,'runner fully on screen');
    await page.locator('#viewRunner').click();await page.waitForSelector('#runnerInspector:not([hidden])');return 'inspector open';
  },{hold:1000});
  await step(5,'Runner details: HP / ATK / DEF / equipment',async()=>{
    const t=await text('#runnerInspector');
    must(/HP\s*100/.test(t)&&/ATK\s*12/.test(t)&&/DEF\s*1\b/.test(t),`stats: ${t.slice(0,80)}`);
    must(/WOODEN CLUB/.test(t)&&/WOODEN SHIELD/.test(t),'weapon and shield');
    return t.slice(0,140);
  },{hold:2200});
  await step(6,'Close Runner details',async()=>{await page.locator('#closeRunnerInspector').click();await page.waitForSelector('#runnerInspector',{state:'hidden'});});
  await step(7,'Target gauge and thresholds',async()=>{
    must((await text('#inviteTarget'))==='TARGET: 50% HP','target 50');
    must((await text('#targetMission'))==='Get the Runner to the EXIT with as close to 50% HP health remaining!','mission wording');
    must((await text('#targetRules'))==='HP Less than 35%: Too Harsh · 35%-70%: Just Nice · Above 70%: Too Gentle','bands wording');
    must((await text('#inviteReward'))==='The closer your eventual score is to the Target (50%), the more rewards you will earn!','reward sentence');
    const g=await ev(()=>{const a=document.getElementById('inviteGaugeArrow'),cs=getComputedStyle(a),gauge=document.getElementById('inviteGauge');return{down:cs.borderTopWidth==='18px'&&cs.borderBottomWidth==='0px',left:a.style.left,pe:getComputedStyle(gauge).pointerEvents,inputs:gauge.querySelectorAll('input,[draggable],[role=slider]').length};});
    must(g.down&&g.left==='50%','yellow triangle points down at 50%');must(g.pe==='none'&&g.inputs===0,'gauge is display only');
    return 'triangle down at 50%, display-only';
  },{hold:2000});
  await step(8,'CHOOSE A DUNGEON',async()=>{await page.locator('#acceptChallenge').click();setTimeout(()=>releaseRooms(),+(process.env.ROOM_RELEASE_MS||3500));},{hold:0});
  await step(9,'Real loading screen',async()=>{
    await page.waitForFunction(()=>!document.getElementById('loadingOverlay').hidden,null,{timeout:20000});
    const t=await text('#loadingOverlay');must(/Loading your dungeon/.test(t)&&/Preparing the room/.test(t)&&/Placing guards and hazards/.test(t)&&/Getting the Runner ready/.test(t),'loading copy: '+t);
    const bar=await ev(()=>({role:document.querySelector('#loadingOverlay [role=progressbar]')?.getAttribute('role'),fill:!!document.querySelector('#loadingOverlay .load-fill')}));must(bar.role==='progressbar'&&bar.fill,'progress bar');
    await sleep(1800);
    await page.waitForFunction(()=>document.getElementById('loadingOverlay').hidden,null,{timeout:90000});
    return 'loading overlay shown while the rooms/tiles were still preparing';
  },{hold:600});
  await step(10,'Browse EASY / JUST NICE / BRUTAL',async()=>{
    await page.waitForSelector('#presetNext');
    const seen=[];
    for(let i=0;i<3;i++){seen.push(await ev(()=>[document.getElementById('presetLabel').textContent,document.getElementById('presetRoomName').textContent,document.getElementById('presetContents').textContent].join(' | ')));await page.locator('#presetNext').click();await sleep(900);}
    const all=seen.join(' ; ');
    must(/JUST NICE \| Crossed Court \| Skeleton ×2 · Goblin/.test(all)&&/BRUTAL \| Scattered Hall \| Goblin ×2 · Skeleton ×3/.test(all)&&/EASY \| Pillar Court \| Skeleton · Goblin/.test(all),all);
    return all;
  },{hold:300});
  await step(11,'Choose JUST NICE',async()=>{
    for(let i=0;i<3&&(await text('#presetLabel'))!=='JUST NICE';i++){await page.locator('#presetNext').click();await sleep(300);}
    must((await text('#presetLabel'))==='JUST NICE','JUST NICE selected');return 'JUST NICE · Crossed Court';
  },{hold:1500});
  await step(12,'Open CUSTOMIZE - OPTIONAL',async()=>{await page.locator('#openCustomize').click();});
  await step(13,'First-run lock',async()=>{
    must(await page.locator('#customizeLocked').isVisible(),'locked teaser visible');must(await page.locator('#customizeEditor').isHidden(),'editor hidden');
    const t=await text('#customizeLocked');must(/LOCKED/.test(t)&&/MONSTERS/.test(t)&&/DUNGEONS/.test(t),t);return t;
  },{hold:2000});
  await step(14,'Back',async()=>{await page.locator('#navBack').click();await page.waitForSelector('[data-screen="ready"]:not([hidden])');
    must(/Crossed Court · JUST NICE/.test(await text('#readyDungeon')),'selection preserved');return await text('#readyDungeon');},{hold:1800});
  await step(15,'Run JUST NICE',async()=>{await page.locator('#runHero').click();await page.waitForSelector('[data-screen="runtime"]:not([hidden])');},{hold:300});
  await step(16,'Real runtime plays',async()=>{
    await page.waitForFunction(()=>window.__s8aRuntime&&window.__s8aRuntime.sim&&document.getElementById('loadingOverlay').hidden,null,{timeout:120000});
    const info=await ev(()=>({enemies:window.__s8aRuntime.sim.challenge.enemies.map(e=>e.type),room:window.__s8aRuntime.sim.challenge.room}));
    must(info.room==='iron-labyrinth-03'&&info.enemies.join()==='skeleton,goblin,skeleton','JUST NICE reached the runtime: '+JSON.stringify(info));
    must(await ev(()=>window.__sawRunLoading===true),'loading overlay appeared while the run assets prepared');await sleep(6000);return JSON.stringify(info)+' (loading overlay was shown while assets prepared)';
  },{hold:0});
  await step(17,'Fast-forward the simulation to its end (recording only)',async()=>{
    const r=await ev(()=>{const s=window.__s8aRuntime.sim;for(let i=0;i<4000&&s.status==='running';i++)s.step();return s.result();});
    fastForwarded=true;finalState.run=r;must(r.status==='cleared','cleared');return `${r.status} ${r.hp}% HP, ${r.gold} Hero Gold`;
  },{hold:0});
  await step(18,'SUCCESS',async()=>{await waitScene('success');must(/SUCCESS!/.test(await text('.j-scene')),'success text');},{hold:2200});
  await step(19,'PERFORMANCE',async()=>{await journeyNext();await waitScene('performance');await sleep(2800);const t=await text('.j-scene');must(/TARGET 50% HP/.test(t)&&/YOU FINISHED 56% HP/.test(t),t);finalState.performance=t;return t;},{hold:800});
  await step(20,'YOU GAINED',async()=>{await journeyNext();await waitScene('reward');await sleep(2000);const t=await text('.j-scene');must(/YOU GAINED/.test(t)&&/GOLD/.test(t),t);finalState.reward=t;return t;},{hold:900});
  await step(21,'YOUR FRIEND GAINED',async()=>{await journeyNext();await waitScene('friend');const t=await text('.j-scene');must(/YOUR FRIEND GAINED/.test(t)&&/MAKIDON'S HERO/.test(t),t);finalState.friend=t;return t;},{hold:1500});
  await step(22,'LEVEL 2 ACHIEVEMENT',async()=>{await journeyNext();await waitScene('achievement');const t=await text('.j-scene');must(/LEVEL 2/.test(t)&&/YOU LEVELED UP!/.test(t),t);
    must(await ev(()=>sessionStorage.getItem('s8aBuilderLevel'))==='2','Level 2 earned naturally by the first completed run');return t;},{hold:1800});
  await step(23,'NEW GIZMOS',async()=>{await journeyNext();await waitScene('gizmos');const t=await text('.j-scene');
    must(/MONSTERS 2 new/.test(t)&&/TRAPS 2 new/.test(t)&&/SUPPORT no new item/.test(t)&&/DUNGEONS 1 new/.test(t),t);return t;},{hold:1600});
  await step(24,'Click "Check out your new gizmos"',async()=>{
    must((await text('#rewardJourney .j-next'))==='Check out your new gizmos','CTA copy');await page.locator('#rewardJourney .j-next').click();await waitScene('loot-monsters');
    must(await ev(()=>window.__s8aReceiver.session.journey)==='rewards','did NOT jump into EDIT DUNGEON');return 'loot review opened';
  },{hold:900});
  await step(25,'Browse Zombie',async()=>{must(/Zombie/.test(await text('.j-loot-card')),'zombie');},{hold:1300});
  await step(26,'Browse Skeleton Archer',async()=>{await page.locator('.j-arrow[aria-label^="Next"]').click();must(/Skeleton Archer/.test(await text('.j-loot-card')),'archer');},{hold:1300});
  await step(27,'Back to Gizmos',async()=>{await page.locator('.j-back').click();await waitScene('gizmos');},{hold:700});
  await step(28,'Browse Spike Trap',async()=>{await page.locator('.j-cat[data-tool="traps"]').click();await waitScene('loot-traps');must(/Spike Trap/.test(await text('.j-loot-card')),'spike');},{hold:1300});
  await step(29,'Browse Dart Trap',async()=>{await page.locator('.j-arrow[aria-label^="Next"]').click();must(/Dart Trap/.test(await text('.j-loot-card')),'dart');},{hold:1300});
  await step(30,'Back to Gizmos',async()=>{await page.locator('.j-back').click();await waitScene('gizmos');},{hold:700});
  await step(31,'Open Support',async()=>{await page.locator('.j-cat[data-tool="supports"]').click();await waitScene('loot-support');},{hold:900});
  await step(32,'Verify no new Support',async()=>{must(/No new Support unlocked at Level 2\./.test(await text('.j-scene')),'empty state');},{hold:1500});
  await step(33,'Back to Gizmos',async()=>{await page.locator('.j-back').click();await waitScene('gizmos');},{hold:700});
  await step(34,'Open Broken Gallery',async()=>{await page.locator('.j-cat[data-tool="dungeons"]').click();await waitScene('loot-dungeon');},{hold:500});
  await step(35,'NEW DUNGEON celebration',async()=>{
    const info=await ev(()=>({badge:document.querySelector('.j-new-badge')?.textContent,confetti:document.querySelectorAll('.j-confetti').length,img:document.querySelector('.j-dungeon-img')?.naturalWidth}));
    must(info.badge==='NEW DUNGEON'&&info.confetti>0&&info.img>0,JSON.stringify(info));return JSON.stringify(info);
  },{hold:2200});
  await step(36,'Finish loot review',async()=>{await page.locator('#rewardJourney .j-next').click();await waitScene('loot-complete');
    const t=await text('.j-scene');must(/LOOT REVIEW COMPLETE/.test(t)&&/Your new gizmos are ready!/.test(t)&&/You may use them to create more challenging dungeons/.test(t)&&/I am sure your friend can't wait to see what you can come up with next!/.test(t),t);return t;},{hold:2200});
  await step(37,'Continue to the Level 2 builder',async()=>{
    await page.locator('#rewardJourney .j-next').click();await waitScene('momentum');await sleep(1200);
    await page.getByRole('button',{name:'CUSTOMIZE THIS DUNGEON'}).first().click();
    await page.waitForSelector('[data-screen="customize"]:not([hidden])');await page.waitForSelector('#customizeEditor:not([hidden])');
  },{hold:700});
  await step(38,'Preview your Guards',async()=>{must((await text('#heading-customize'))==='Preview your Guards','title');must((await text('[data-screen="customize"] .eyebrow'))==='EDIT DUNGEON','eyebrow');
    must(await page.locator('.mix-row').count()===4,'four monster rows (Goblin, Skeleton, Zombie, Skeleton Archer)');
    must(await page.locator('[data-screen="customize"] :text("Guard 1")').count()===0,'no positional Guard 1/2/3 UI');
    must(await page.locator('.card-row').count()===0,'no horizontal card rows');
    const t=await text('#guardTotal');return t;},{hold:1800});
  await step(39,'Click + ADD A GUARD',async()=>{await page.locator('#addGuardBtn').click();await page.waitForSelector('#addGuardPicker:not([hidden])');
    const opts=await page.locator('.add-choice strong').allInnerTexts();must(opts.join()==='Goblin,Skeleton,Zombie,Skeleton Archer',opts.join());return opts.join(', ');},{hold:1500});
  await step(40,'Add one legal monster (Goblin)',async()=>{await page.locator('.add-choice[data-monster="goblin"]').click();await sleep(300);
    must((await text('#guardTotal'))==='4 / 8 GUARDS','4 / 8 GUARDS');must((await text('[data-qty="goblin"]'))==='2','goblin quantity 2');
    must(/DUNGEON BUDGET 100 \/ 100/.test(await text('#dungeonBudget')),'budget 100/100');return '4 / 8 GUARDS';},{hold:1500});
  await step(41,'Quantity left/right controls',async()=>{
    await page.locator('.mix-row[data-monster="skeleton"] .mini-arrow').first().click();await sleep(500);must((await text('[data-qty="skeleton"]'))==='1','skeleton 1');
    await sleep(700);await page.locator('.mix-row[data-monster="skeleton"] .mini-arrow').nth(1).click();await sleep(500);must((await text('[data-qty="skeleton"]'))==='2','skeleton back to 2');
    return 'left then right arrow';},{hold:900});
  await step(42,'Budget enforcement',async()=>{
    await page.locator('.mix-row[data-monster="zombie"] .mini-arrow').nth(1).click();await sleep(400);
    const m=await text('[data-custom-panel="monsters"] .editor-message');must(/Not enough dungeon budget: Zombie costs 35 and you have 0 left\./.test(m),m);
    must((await text('[data-qty="zombie"]'))==='0','zombie not added');must((await text('#guardTotal'))==='4 / 8 GUARDS','still 4 / 8');return m;},{hold:2400});
  await step(43,'Traps tab',async()=>{await page.locator('[data-custom-tab="traps"]').click();await sleep(300);const t=await text('[data-custom-panel="traps"]');must(/Spike Trap/.test(t)&&/Dart Trap/.test(t),t);return t.slice(0,80);},{hold:1500});
  await step(44,'Support tab',async()=>{await page.locator('[data-custom-tab="supports"]').click();await sleep(300);const t=await text('[data-custom-panel="supports"]');must(/Small Potion/.test(t),t);return t.slice(0,80);},{hold:1500});
  await step(45,'Dungeons tab',async()=>{await page.locator('[data-custom-tab="dungeons"]').click();await sleep(500);const n=await page.locator('.dungeon-card').count();must(n===4,`${n} dungeon cards`);return `${n} dungeons`;},{hold:1500});
  await step(46,'Show Broken Gallery',async()=>{const card=page.locator('.dungeon-card',{hasText:'Broken Gallery'});await card.click();await sleep(500);
    must(await ev(()=>window.__s8aReceiver.roomId)==='iron-labyrinth-07','Broken Gallery selected');must(/NEW AT LEVEL 2/.test(await card.innerText()),'new-at-level-2 tag');return 'Broken Gallery selected';},{hold:2000});
  await step(47,'Press HOME',async()=>{await page.locator('#navHome').click();await page.waitForURL(/flare-s8b/,{timeout:30000});});
  await step(48,'Runner Hub opens',async()=>{await page.waitForSelector('#signedOutView:not([hidden])',{timeout:30000});must(/RUNNER HUB/.test(await text('.masthead')),'masthead');return page.url();},{hold:1600});
  await step(49,'Click CONTINUE AS GUEST',async()=>{const b=page.locator('#continueAsGuest');must(await b.isVisible(),'CONTINUE AS GUEST visible');must((await b.innerText())==='CONTINUE AS GUEST','label');await b.click();});
  await step(50,'Back at the unlocked Gizmos (session)',async()=>{
    await page.waitForURL(/flare-s8a\/challenge\.html/,{timeout:30000});await page.waitForFunction(()=>window.__s8aData,null,{timeout:120000});await waitScene('gizmos',60000);
    const s=await ev(()=>({lvl:sessionStorage.getItem('s8aBuilderLevel'),url:location.search,cats:[...document.querySelectorAll('.j-cat')].length}));
    must(s.lvl==='2','session-only Level 2 still active');must(!/guest=/.test(s.url),'guest marker removed from the URL');must(s.cats===4,'four categories');return 'unlocked Gizmos reopened';},{hold:2200});
  await step(51,'No retired cyan unlock UI',async()=>{
    const r=await ev(()=>({status:!!document.getElementById('unlockedStatus'),els:document.querySelectorAll('[id*=unlock],[class*=unlock]').length,txt:/BUILDER LEVEL 2 · THIS SESSION|UNLOCKED|FIRST RUN COMPLETE/i.test(document.body.innerText)}));
    must(!r.status&&r.els===0&&!r.txt,JSON.stringify(r));return 'none present';},{hold:1500});
  // extra: Guest can keep going, and browser Back/Forward stay clean
  await step(52,'Guest can reopen the loot review from the returned Gizmos',async()=>{
    await page.locator('.j-cat[data-tool="monsters"]').click();await waitScene('loot-monsters');await page.locator('.j-back').click();await waitScene('gizmos');
    return 'journey reopened from Gizmos';},{hold:700});
  await step(53,'Browser Back / Forward stay clean',async()=>{
    await page.goBack();await page.waitForLoadState('domcontentloaded');await sleep(800);await page.goForward();await page.waitForFunction(()=>window.__s8aData,null,{timeout:120000});await sleep(800);
    const r=await ev(()=>({status:!!document.getElementById('unlockedStatus'),els:document.querySelectorAll('[id*=unlock],[class*=unlock]').length,lvl:sessionStorage.getItem('s8aBuilderLevel'),overlay:document.getElementById('rewardJourney').hidden}));
    must(!r.status&&r.els===0&&r.lvl==='2','clean after back/forward '+JSON.stringify(r));return JSON.stringify(r);},{hold:1500});
}catch(e){
  if(!e.stepFailed)console.log('ERROR',e.stack||e);
  var failed=e;
}
await sleep(1500);
if(record){try{await cdp.send('Page.stopScreencast');}catch{}}
fs.writeFileSync(path.join(outDir,'FRIEND_RUN_V18_RUN_EVIDENCE.json'),JSON.stringify({viewport:VIEWPORT,url:URL_START,fastForwarded,floodedLatencyMs:FLARE_LATENCY,startedAt:new Date(startedAt).toISOString(),durationMs:Date.now()-startedAt,pageErrors,results,finalState},null,2));
await browser.close();
let video=null;
if(record&&frames.length&&!failed){
  const dir=path.join(outDir,'_frames');fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
  const list=[];
  frames.sort((a,b)=>a.t-b.t);
  frames.forEach((f,i)=>{const name=`f${String(i).padStart(5,'0')}.jpg`;fs.writeFileSync(path.join(dir,name),f.data);const next=frames[i+1]?.t??(f.t+2);const dur=Math.max(1/60,Math.min(4,next-f.t));list.push(`file '${name}'`,`duration ${dur.toFixed(4)}`);});
  list.push(`file '${`f${String(frames.length-1).padStart(5,'0')}.jpg`}'`);
  fs.writeFileSync(path.join(dir,'list.txt'),list.join('\n'));
  const mp4=path.join(outDir,'FRIEND_RUN_V18_FULL_CLICKTHROUGH.mp4');
  const r=spawnSync(FFMPEG,['-y','-f','concat','-safe','0','-i',path.join(dir,'list.txt'),'-vf','fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p','-c:v','libx264','-preset','medium','-crf','22','-movflags','+faststart','-pix_fmt','yuv420p',mp4],{encoding:'utf8'});
  if(r.status!==0){console.log('FFMPEG FAILED',r.stderr?.slice(-600));}else{video=mp4;fs.rmSync(dir,{recursive:true,force:true});}
}
const pass=results.filter(r=>r.status==='PASS').length;
console.log(`\n${pass}/${results.length} steps passed; pageErrors=${pageErrors.length}; video=${video||'none'}`);
process.exit(failed||pageErrors.length?1:0);
