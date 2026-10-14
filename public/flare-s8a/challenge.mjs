// 002E9F: dependency-free entry bootstrap for the S8A challenge page.
//
// This file deliberately has NO static imports and NO top-level await. It executes by itself against whatever
// challenge.html the browser holds, decides whether that document belongs to this build, and only then loads the
// real application (challenge-app.mjs) with a dynamic import:
//   * current document          -> clean ?__wf_reload from the address bar, import the application (bounded wait)
//   * stale document, first try -> exactly one cache-busted location.replace to the same URL
//   * stale document, retried   -> controlled "needs a refresh" screen (no loop)
//   * application import fails / does not arrive in time -> controlled "could not start" overlay, never an endless
//     "Loading your challenge…"
// The build token below must equal data-app-build on #receiverApp and the ?v= on the entry assets in
// challenge.html (pinned by tests/flare-friend-feedback-002e9f-bootstrap.test.mjs).
const BUILD='friend-feedback-002e9f';
const RECOVERY_PARAM='__wf_reload';
const IMPORT_TIMEOUT_MS=15000;
// Static elements of the current challenge.html only (nothing created dynamically later).
export const DOM_CONTRACT=Object.freeze(['receiverApp','heading-invitation','inviteExplain','inviteRunner','inviteTarget','targetMission','inviteGauge','inviteGaugeTrack','inviteGaugeTarget','inviteGaugeArrow','targetRules','inviteReward','loadingOverlay','readyBands']);
export const BOOTSTRAP_BUILD=BUILD;

export function checkDocument(doc){
  const missing=[];
  const root=doc&&doc.getElementById?doc.getElementById('receiverApp'):null;
  const marker=root&&root.getAttribute?root.getAttribute('data-app-build')||'':'';
  if(marker!==BUILD)missing.push('data-app-build('+(marker||'absent')+')');
  for(const id of DOM_CONTRACT)if(!(doc&&doc.getElementById&&doc.getElementById(id)))missing.push(id);
  return {compatible:missing.length===0,marker,missing};
}
const hasParam=search=>new URLSearchParams(String(search||'')).has(RECOVERY_PARAM);
function hrefWithParam(loc,value){const url=new URL(String(loc.href));url.searchParams.set(RECOVERY_PARAM,value);return url.href;}
function pathWithoutParam(loc){const url=new URL(String(loc.href));url.searchParams.delete(RECOVERY_PARAM);return url.pathname+url.search+url.hash;}

// Non-sensitive: build token, phase, timestamps and a short error message only.
function makeDiagnostic(env){
  const diag={build:BUILD,phase:'',at:0,trail:[]};
  diag.set=(phase,error)=>{
    const at=Date.now();diag.phase=phase;diag.at=at;
    if(error!==undefined)diag.error=String((error&&error.message)||error).slice(0,200);
    diag.trail.push({phase,at});
  };
  if(env.window)env.window.__S8A_BOOT_DIAGNOSTIC__=diag;
  return diag;
}

const BOX_CSS='box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px 16px;text-align:center;background:#35163f;color:#fff;font:700 16px/1.4 system-ui,sans-serif';
const BTN_CSS='min-height:52px;padding:0 32px;border-radius:12px;border:1px solid #cda257;background:#ffd34d;color:#2a1330;font:900 16px system-ui,sans-serif';
function noticeBox(doc,{id,buttonId,title,text,onRefresh,css}){
  const box=doc.createElement('main');box.id=id;box.setAttribute('role','alert');box.style.cssText=css;
  const h=doc.createElement('h1');h.textContent=title;h.style.cssText='margin:0;font-size:22px';
  const p=doc.createElement('p');p.textContent=text;p.style.cssText='margin:0;max-width:320px;font-weight:600';
  const b=doc.createElement('button');b.type='button';b.id=buttonId;b.textContent='REFRESH';b.style.cssText=BTN_CSS;b.addEventListener('click',onRefresh);
  box.append(h,p,b);return box;
}
// Stale document: replaced outright (nothing in it is trustworthy).
function showRefreshNeeded(doc,onRefresh){
  const body=doc.body;while(body.firstChild)body.removeChild(body.firstChild);
  const box=noticeBox(doc,{id:'versionSkewNotice',buttonId:'versionSkewRefresh',title:'THIS CHALLENGE NEEDS A REFRESH',text:'This page is from an older Dungeon Runner version. Please refresh or reopen the challenge.',onRefresh,css:BOX_CSS+';min-height:100vh'});
  body.append(box);return box;
}
// Current document but the application could not load: a covering overlay (removed if the module arrives late).
function showStartupFailure(doc,onRefresh){
  const box=noticeBox(doc,{id:'startupFailure',buttonId:'startupFailureRefresh',title:'DUNGEON RUNNER COULD NOT START',text:'The latest game files could not be loaded. Please refresh and try again.',onRefresh,css:BOX_CSS+';position:fixed;inset:0;z-index:2147483647'});
  (doc.body||doc.documentElement).append(box);return box;
}

export function startChallenge(env){
  const doc=env.document,loc=env.location,hist=env.history;
  const importApp=env.importApp||(()=>import('./challenge-app.mjs?v=friend-feedback-002e9f'));
  const timers=env.timers||{setTimeout:(f,ms)=>globalThis.setTimeout(f,ms),clearTimeout:t=>globalThis.clearTimeout(t)};
  const timeoutMs=env.importTimeoutMs===undefined?IMPORT_TIMEOUT_MS:env.importTimeoutMs;
  const nonce=()=>env.nonce?env.nonce():Date.now().toString(36);
  const refresh=()=>loc.replace(hrefWithParam(loc,BUILD+'.'+nonce()));
  const diag=makeDiagnostic(env);
  diag.set('bootstrap-start');
  const outcome={action:'',href:'',verdict:null,loaded:Promise.resolve('')};
  try{
    const verdict=checkDocument(doc);outcome.verdict=verdict;
    if(!verdict.compatible){
      diag.set('stale-document','missing: '+verdict.missing.join(','));
      if(!hasParam(loc.search)){
        outcome.action='recover';outcome.href=hrefWithParam(loc,BUILD);
        diag.set('recovery-navigation');
        loc.replace(outcome.href);
      }else{
        outcome.action='refresh-needed';
        showRefreshNeeded(doc,refresh);
      }
      return outcome;
    }
    diag.set('dom-compatible');
    if(hasParam(loc.search)){try{hist.replaceState(hist.state,'',pathWithoutParam(loc));}catch(e){/* cosmetic only */}}
    outcome.action='boot';
    diag.set('app-import-start');
    let settled=false,overlay=null;
    outcome.loaded=new Promise(resolve=>{
      const timer=timers.setTimeout(()=>{
        if(settled)return;
        diag.set('app-import-timeout');overlay=showStartupFailure(doc,refresh);resolve('timeout');
      },timeoutMs);
      Promise.resolve().then(importApp).then(()=>{
        timers.clearTimeout(timer);
        const late=diag.phase==='app-import-timeout';
        settled=true;
        if(late&&overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);
        // challenge-app.mjs reports app-ready / boot-error itself once its asynchronous start-up finishes.
        if(diag.phase==='app-import-start'||late)diag.set('app-imported');
        resolve('imported');
      },error=>{
        timers.clearTimeout(timer);settled=true;
        diag.set('app-import-error',error);
        if(!overlay)overlay=showStartupFailure(doc,refresh);
        resolve('error');
      });
    });
  }catch(error){
    diag.set('boot-error',error);outcome.action='boot-error';
    try{showStartupFailure(doc,refresh);}catch(e){/* nothing more can be done */}
  }
  return outcome;
}

if(typeof document!=='undefined'&&typeof location!=='undefined'){
  startChallenge({window,document,location,history});
}
