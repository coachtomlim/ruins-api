import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
// challenge.mjs is imported here with NO globals: it must load by itself (zero dependencies) and do nothing without a document.
import {startChallenge,checkDocument,DOM_CONTRACT,BOOTSTRAP_BUILD} from '../public/flare-s8a/challenge.mjs';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const BUILD='friend-feedback-002e9f';

// Minimal DOM stand-in built from real HTML text (ids + data-app-build of #receiverApp).
function fakeDocument(html){
  const ids=new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
  const build=(html.match(/<main id="receiverApp"[^>]*\sdata-app-build="([^"]*)"/)||[])[1];
  const log={bodyCleared:false,appended:[]};
  const el=tag=>({tag,style:{},children:[],listeners:{},parentNode:null,
    append(...c){this.children.push(...c)},setAttribute(){},addEventListener(t,f){this.listeners[t]=f}});
  const body={firstChild:{stale:true},removeChild(){log.bodyCleared=true;this.firstChild=null},
    append(x){x.parentNode=body;log.appended.push(x)}};
  body.removeChildNode=x=>{log.appended.splice(log.appended.indexOf(x),1);x.parentNode=null};
  const doc={log,body,documentElement:body,createElement:el,
    getElementById:id=>ids.has(id)?{getAttribute:n=>(id==='receiverApp'&&n==='data-app-build'?build??null:null)}:null};
  return doc;
}
const fakeLocation=href=>{const u=new URL(href);return{href:u.href,search:u.search,replaced:[],replace(x){this.replaced.push(x)}}};
const fakeHistory=()=>({state:null,calls:[],replaceState(s,t,u){this.calls.push(u)}});
const fakeTimers=()=>({fn:null,cleared:false,setTimeout(f){this.fn=f;return 1},clearTimeout(){this.cleared=true}});
const fakeWindow=()=>({});
// parentNode.removeChild is used for the late-arrival path
function wire(doc){doc.body.removeChild=function(x){if(x&&x.stale){doc.log.bodyCleared=true;this.firstChild=null}else{doc.body.removeChildNode(x)}};return doc}

const CURRENT_URL=`https://example.test/quick-dungeon/flare-s8a/challenge.html?demo=1&from=Makidon`;

test('bootstrap source: zero static imports, no top-level await, no build-gate/build-id dependency, one literal dynamic import',async()=>{
  const src=await read('public/flare-s8a/challenge.mjs');
  const code=src.replace(/\/\/[^\n]*/g,'');
  assert.deepEqual(code.match(/^\s*import\s[^(]/gm)||[],[],'no static import statements');
  assert.deepEqual(code.match(/\bfrom\s+['"]/g)||[],[],'no "from" module specifiers');
  assert.ok(!/\bawait\b/.test(code),'no await at all (hence no top-level await)');
  assert.ok(!/build-gate|build-id/.test(src));
  assert.equal((code.match(/import\(/g)||[]).length,1);
  assert.ok(code.includes("import('./challenge-app.mjs?v=friend-feedback-002e9f')"));
  assert.ok(code.includes("IMPORT_TIMEOUT_MS=15000"));
  for(const f of ['build-gate.mjs','build-id.mjs'])await assert.rejects(access(new URL('../public/flare-s8a/'+f,import.meta.url)),f+' is retired');
  assert.equal(BOOTSTRAP_BUILD,BUILD);
});

test('one build token: challenge.html marker, entry asset ?v= and bootstrap agree; config.js is not versioned',async()=>{
  const html=await read('public/flare-s8a/challenge.html'),src=await read('public/flare-s8a/challenge.mjs');
  assert.match(html,/<main id="receiverApp" class="s8a-shell" data-app-build="friend-feedback-002e9f">/);
  for(const f of ['tokens.css','panel-shell.css','style.css','challenge.mjs'])assert.ok(html.includes(`/quick-dungeon/flare-s8a/${f}?v=${BUILD}`),f);
  assert.ok(html.includes('src="/quick-dungeon/flare-s8b/config.js"')&&!/config\.js\?/.test(html));
  assert.ok(src.includes(`const BUILD='${BUILD}'`));
  assert.ok(!html.includes('002e9e'),'no leftover previous token');
  const app=await read('public/flare-s8a/challenge-app.mjs');
  assert.ok(!/build-gate|build-id/.test(app));
});

test('the application lives in challenge-app.mjs and reports app-ready / boot-error',async()=>{
  const app=await read('public/flare-s8a/challenge-app.mjs');
  assert.match(app,/window\.__s8aData=\{[^}]*\};bootPhase\('app-ready'\)/);
  assert.match(app,/console\.error\(error\);bootPhase\('boot-error',error\)/);
  assert.match(app,/function bootPhase\(phase,error\)\{try\{globalThis\.__S8A_BOOT_DIAGNOSTIC__\?\.set\?\.\(phase,error\)/);
  assert.ok(app.includes("from './actors.mjs'")&&app.includes('async function bootReceiver()'));
});

test('the current document satisfies the whole contract; dynamic elements are not required',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const v=checkDocument(fakeDocument(html));
  assert.deepEqual([v.compatible,[...v.missing]],[true,[]]);
  for(const id of ['receiverApp','heading-invitation','inviteExplain','inviteRunner','inviteTarget','targetMission','inviteGauge','inviteGaugeTrack','inviteGaugeTarget','inviteGaugeArrow','targetRules','inviteReward','loadingOverlay','readyBands'])assert.ok(DOM_CONTRACT.includes(id),id);
  for(const dyn of ['addGuardBtn','addGuardPicker','guardTotal'])assert.ok(!DOM_CONTRACT.includes(dyn));
});

test('OLD pre-V18 HTML + new bootstrap: stale detected, one recovery URL, params preserved, application never imported, no exception',async()=>{
  const old=await read('tests/fixtures/flare-s8a-challenge-pre-v18.html');
  assert.ok(!old.includes('id="inviteExplain"')&&!old.includes('id="inviteGaugeTrack"'));
  const doc=wire(fakeDocument(old)),win=fakeWindow(),loc=fakeLocation('https://example.test/quick-dungeon/flare-s8a/challenge.html?m=Qs2Z&c=3TRH-2n59iP61P1EoP8y-QKwfn01AfQc&from=cactus&demo=1&guest=1#top'),hist=fakeHistory();
  let imports=0,out;
  assert.doesNotThrow(()=>{out=startChallenge({window:win,document:doc,location:loc,history:hist,importApp:()=>{imports++;return Promise.resolve()}});});
  assert.equal(out.action,'recover');assert.equal(imports,0,'the application is never imported against the old DOM');
  assert.equal(loc.replaced.length,1);
  const t=new URL(loc.replaced[0]);
  assert.equal(t.hash,'#top');
  for(const [k,v] of [['m','Qs2Z'],['c','3TRH-2n59iP61P1EoP8y-QKwfn01AfQc'],['from','cactus'],['demo','1'],['guest','1'],['__wf_reload',BUILD]])assert.equal(t.searchParams.get(k),v,k);
  assert.equal(doc.log.bodyCleared,false);
  assert.deepEqual(win.__S8A_BOOT_DIAGNOSTIC__.trail.map(x=>x.phase),['bootstrap-start','stale-document','recovery-navigation']);
  assert.equal(win.__S8A_BOOT_DIAGNOSTIC__.build,BUILD);
  assert.ok(/data-app-build|inviteExplain/.test(win.__S8A_BOOT_DIAGNOSTIC__.error));
});

test('LOOP GUARD: stale HTML with the recovery parameter already present shows the refresh screen and never reloads again',async()=>{
  const old=await read('tests/fixtures/flare-s8a-challenge-pre-v18.html');
  const doc=wire(fakeDocument(old)),win=fakeWindow(),loc=fakeLocation(`${CURRENT_URL}&__wf_reload=${BUILD}`),hist=fakeHistory();
  let imports=0,out;
  assert.doesNotThrow(()=>{out=startChallenge({window:win,document:doc,location:loc,history:hist,nonce:()=>'abc',importApp:()=>{imports++;return Promise.resolve()}});});
  assert.equal(out.action,'refresh-needed');assert.equal(loc.replaced.length,0);assert.equal(imports,0);
  assert.equal(doc.log.bodyCleared,true);
  const [h,p,b]=doc.log.appended[0].children;
  assert.equal(h.textContent,'THIS CHALLENGE NEEDS A REFRESH');
  assert.equal(p.textContent,'This page is from an older Dungeon Runner version. Please refresh or reopen the challenge.');
  assert.deepEqual([b.textContent,b.tag],['REFRESH','button']);
  b.listeners.click();
  assert.equal(loc.replaced.length,1);const n=new URL(loc.replaced[0]);
  assert.equal(n.searchParams.get('__wf_reload'),`${BUILD}.abc`);assert.equal(n.searchParams.get('from'),'Makidon');
});

test('CURRENT HTML + bootstrap: compatible, application import requested, no navigation, recovery parameter cleaned',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const doc=wire(fakeDocument(html)),win=fakeWindow(),loc=fakeLocation(`${CURRENT_URL}&__wf_reload=${BUILD}#x`),hist=fakeHistory(),timers=fakeTimers();
  let imports=0;
  const out=startChallenge({window:win,document:doc,location:loc,history:hist,timers,importApp:()=>{imports++;return Promise.resolve({})}});
  assert.equal(out.action,'boot');assert.equal(loc.replaced.length,0);
  assert.deepEqual(hist.calls,['/quick-dungeon/flare-s8a/challenge.html?demo=1&from=Makidon#x']);
  assert.equal(await out.loaded,'imported');assert.equal(imports,1);assert.equal(timers.cleared,true,'timeout cancelled once the module loads');
  assert.equal(win.__S8A_BOOT_DIAGNOSTIC__.phase,'app-imported');
  win.__S8A_BOOT_DIAGNOSTIC__.set('app-ready');// what challenge-app.mjs does once the invitation is enabled
  assert.deepEqual(win.__S8A_BOOT_DIAGNOSTIC__.trail.map(x=>x.phase),['bootstrap-start','dom-compatible','app-import-start','app-imported','app-ready']);
  const clean=fakeHistory();startChallenge({window:fakeWindow(),document:wire(fakeDocument(html)),location:fakeLocation(CURRENT_URL),history:clean,timers:fakeTimers(),importApp:()=>Promise.resolve()});
  assert.equal(clean.calls.length,0);
});

test('IMPORT FAILURE: controlled startup failure with REFRESH, phase app-import-error, no endless loading',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const doc=wire(fakeDocument(html)),win=fakeWindow(),loc=fakeLocation(CURRENT_URL),timers=fakeTimers();
  const out=startChallenge({window:win,document:doc,location:loc,history:fakeHistory(),timers,nonce:()=>'n1',importApp:()=>Promise.reject(new TypeError('Failed to fetch dynamically imported module'))});
  assert.equal(await out.loaded,'error');
  assert.equal(win.__S8A_BOOT_DIAGNOSTIC__.phase,'app-import-error');assert.match(win.__S8A_BOOT_DIAGNOSTIC__.error,/Failed to fetch/);
  const box=doc.log.appended[0];assert.equal(box.id,'startupFailure');
  const [h,p,b]=box.children;
  assert.equal(h.textContent,'DUNGEON RUNNER COULD NOT START');
  assert.equal(p.textContent,'The latest game files could not be loaded. Please refresh and try again.');
  assert.equal(b.textContent,'REFRESH');assert.match(box.style.cssText,/position:fixed;inset:0/);
  b.listeners.click();assert.equal(new URL(loc.replaced[0]).searchParams.get('__wf_reload'),`${BUILD}.n1`);
});

test('IMPORT TIMEOUT: a never-settling import is cut off by the bounded guard; a late arrival removes the failure overlay',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const doc=wire(fakeDocument(html)),win=fakeWindow(),timers=fakeTimers();
  let release;const pending=new Promise(r=>{release=r});
  const out=startChallenge({window:win,document:doc,location:fakeLocation(CURRENT_URL),history:fakeHistory(),timers,importApp:()=>pending});
  assert.equal(typeof timers.fn,'function');
  assert.equal(win.__S8A_BOOT_DIAGNOSTIC__.phase,'app-import-start');
  timers.fn();// the 15 s guard fires
  assert.equal(await out.loaded,'timeout');
  assert.equal(win.__S8A_BOOT_DIAGNOSTIC__.phase,'app-import-timeout');
  assert.equal(doc.log.appended.length,1);assert.equal(doc.log.appended[0].children[2].textContent,'REFRESH');
  release({});await new Promise(r=>setImmediate(r));
  assert.equal(doc.log.appended.length,0,'late success removes the overlay');
  assert.equal(win.__S8A_BOOT_DIAGNOSTIC__.phase,'app-imported');
});

test('importing the bootstrap outside a browser has no side effects',()=>{
  assert.equal(typeof globalThis.__S8A_BOOT_DIAGNOSTIC__,'undefined');
});
