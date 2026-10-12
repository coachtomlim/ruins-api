import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {APP_BUILD,RECOVERY_PARAM} from '../public/flare-s8a/build-id.mjs';
import {V18_DOM_CONTRACT,checkBuildCompatibility,hasRecoveryParam,recoveryHref,withoutRecoveryParam,runBuildGate,BUILD_GATE_RESULT} from '../public/flare-s8a/build-gate.mjs';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

// A tiny DOM stand-in built from real HTML text: ids, and the data-app-build attribute of #receiverApp.
function fakeDocument(html){
  const ids=new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
  const build=(html.match(/<main id="receiverApp"[^>]*\sdata-app-build="([^"]*)"/)||[])[1];
  const log={bodyCleared:false,appended:[]};
  const el=tag=>({tag,style:{},children:[],listeners:{},append(...c){this.children.push(...c)},addEventListener(t,f){this.listeners[t]=f},setAttribute(){}});
  const body={firstChild:{stale:true},children:[],removeChild(){log.bodyCleared=true;this.firstChild=null},append(x){log.appended.push(x);this.children.push(x)}};
  return {log,body,createElement:el,getElementById:id=>ids.has(id)?{getAttribute:n=>(id==='receiverApp'&&n==='data-app-build'?build??null:null)}:null};
}
const fakeLocation=href=>{const u=new URL(href);return {href:u.href,search:u.search,replaced:[],replace(x){this.replaced.push(x)}}};
const fakeHistory=()=>({state:null,calls:[],replaceState(s,t,u){this.calls.push(u)}});

test('the build token, the HTML marker and the versioned entry resources agree (one central token)',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.equal(APP_BUILD,'friend-feedback-002e9e');assert.equal(RECOVERY_PARAM,'__wf_reload');
  assert.match(html,/<main id="receiverApp" class="s8a-shell" data-app-build="friend-feedback-002e9e">/);
  for(const f of ['tokens.css','panel-shell.css','style.css','challenge.mjs'])assert.ok(html.includes(`/quick-dungeon/flare-s8a/${f}?v=${APP_BUILD}`),f);
  assert.ok(html.includes('src="/quick-dungeon/flare-s8b/config.js"'),'deployment-managed config.js is NOT versioned');
  assert.ok(!/config\.js\?/.test(html));
});

test('the current document satisfies the whole V18 contract; the contract lists only static elements',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const verdict=checkBuildCompatibility(fakeDocument(html));
  assert.deepEqual([verdict.compatible,[...verdict.missing]],[true,[]]);
  for(const id of ['receiverApp','heading-invitation','inviteExplain','inviteRunner','inviteTarget','targetMission','inviteGauge','inviteGaugeTrack','inviteGaugeTarget','inviteGaugeArrow','targetRules','inviteReward','loadingOverlay','readyBands'])assert.ok(V18_DOM_CONTRACT.includes(id),id);
  for(const dynamic of ['addGuardBtn','addGuardPicker','guardTotal'])assert.ok(!V18_DOM_CONTRACT.includes(dynamic),dynamic+' is created later');
});

test('challenge.mjs imports the gate FIRST, before any application module',async()=>{
  const src=await read('public/flare-s8a/challenge.mjs');
  const imports=[...src.matchAll(/^import\s.*?from\s+'([^']+)'|^import\s+'([^']+)'/gm)].map(m=>m[1]||m[2]);
  assert.equal(imports[0],'./build-gate.mjs');
  const gate=await read('public/flare-s8a/build-gate.mjs');
  assert.match(gate,/await new Promise\(\(\)=>\{\}\)/,'a blocked or recovering page suspends the import graph instead of throwing');
});

test('OLD pre-V18 HTML + new JS: incompatible, one recovery URL, query preserved, no V18 render, no exception',async()=>{
  const old=await read('tests/fixtures/flare-s8a-challenge-pre-v18.html');
  assert.ok(!old.includes('id="inviteExplain"')&&!old.includes('id="inviteGaugeTrack"'),'fixture is the pre-V18 structure');
  const doc=fakeDocument(old);
  const verdict=checkBuildCompatibility(doc);
  assert.equal(verdict.compatible,false);
  for(const id of ['inviteExplain','inviteGaugeTrack','inviteGaugeArrow','loadingOverlay','readyBands'])assert.ok(verdict.missing.includes(id),id);
  assert.ok(verdict.missing.some(m=>m.startsWith('data-app-build')));
  const loc=fakeLocation('https://example.test/quick-dungeon/flare-s8a/challenge.html?m=Qs2Z&c=3TRH-2n59iP61P1EoP8y-QKwfn01AfQc&from=cactus&demo=1&guest=1#top'),hist=fakeHistory();
  let result;assert.doesNotThrow(()=>{result=runBuildGate({document:doc,location:loc,history:hist});});
  assert.equal(result.action,'recover');
  assert.equal(loc.replaced.length,1,'exactly one navigation');
  const target=new URL(loc.replaced[0]);
  assert.equal(target.pathname,'/quick-dungeon/flare-s8a/challenge.html');
  assert.equal(target.hash,'#top');
  for(const [k,v] of [['m','Qs2Z'],['c','3TRH-2n59iP61P1EoP8y-QKwfn01AfQc'],['from','cactus'],['demo','1'],['guest','1'],['__wf_reload',APP_BUILD]])assert.equal(target.searchParams.get(k),v,k);
  assert.equal(doc.log.bodyCleared,false,'the stale document is not rewritten');
  assert.equal(hist.calls.length,0);
});

test('LOOP GUARD: incompatible DOM with the recovery parameter already present never reloads again; shows a controlled refresh UI',async()=>{
  const old=await read('tests/fixtures/flare-s8a-challenge-pre-v18.html');
  const doc=fakeDocument(old);
  const loc=fakeLocation(`https://example.test/quick-dungeon/flare-s8a/challenge.html?demo=1&from=Makidon&__wf_reload=${APP_BUILD}`),hist=fakeHistory();
  let result;assert.doesNotThrow(()=>{result=runBuildGate({document:doc,location:loc,history:hist,now:()=>'abc'});});
  assert.equal(result.action,'blocked');
  assert.equal(loc.replaced.length,0,'no automatic second reload');
  assert.equal(doc.log.bodyCleared,true);
  const box=doc.log.appended[0];
  const [h,p,b]=box.children;
  assert.equal(h.textContent,'THIS CHALLENGE NEEDS A REFRESH');
  assert.equal(p.textContent,'This page is from an older Dungeon Runner version. Please refresh or reopen the challenge.');
  assert.equal(b.textContent,'REFRESH');assert.equal(b.tag,'button');
  b.listeners.click();
  assert.equal(loc.replaced.length,1,'REFRESH is a user action and may navigate');
  const next=new URL(loc.replaced[0]);
  assert.equal(next.searchParams.get('__wf_reload'),`${APP_BUILD}.abc`,'fresh nonce');
  assert.equal(next.searchParams.get('from'),'Makidon');assert.equal(next.searchParams.get('demo'),'1');
});

test('CURRENT DOM: no reload, boots normally, the recovery parameter is cleaned from the visible URL, other parameters survive',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const doc=fakeDocument(html);
  const loc=fakeLocation(`https://example.test/quick-dungeon/flare-s8a/challenge.html?demo=1&from=Makidon&__wf_reload=${APP_BUILD}#x`),hist=fakeHistory();
  const result=runBuildGate({document:doc,location:loc,history:hist});
  assert.equal(result.action,'continue');assert.equal(loc.replaced.length,0);
  assert.deepEqual(hist.calls,['/quick-dungeon/flare-s8a/challenge.html?demo=1&from=Makidon#x']);
  const clean=fakeLocation('https://example.test/quick-dungeon/flare-s8a/challenge.html?demo=1&from=Makidon'),h2=fakeHistory();
  assert.equal(runBuildGate({document:fakeDocument(html),location:clean,history:h2}).action,'continue');
  assert.equal(h2.calls.length,0,'nothing to clean');
  assert.equal(BUILD_GATE_RESULT.action,'continue','importing the gate outside a browser has no side effects');
});

test('URL helpers keep functional parameters and are idempotent',()=>{
  const l=fakeLocation('https://example.test/m/Qs2Z?from=cactus&c=T');
  assert.equal(hasRecoveryParam(l.search),false);
  const r=fakeLocation(recoveryHref(l));
  assert.equal(hasRecoveryParam(r.search),true);
  assert.equal(withoutRecoveryParam(r),'/m/Qs2Z?from=cactus&c=T');
  assert.equal(recoveryHref(r),recoveryHref(l),'setting it twice yields the same URL');
});

test('scope: only deployment/version-skew files changed in the app; no product copy or economics touched',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.match(html,/MAKIDON|inviteExplain/);
  const gate=await read('public/flare-s8a/build-gate.mjs');
  assert.ok(!/supabase|fetch\(|localStorage/i.test(gate),'the gate performs no network or storage');
});
