// 002E9E: deployment version-skew self-recovery.
// A browser context that retained an OLD challenge.html in memory can fetch the NEW challenge.mjs (the server sends
// no-cache for HTML/JS, but a document already loaded before a deployment is never refetched). New JS then reads
// V18-only elements from the old DOM and throws. This module is the FIRST import of challenge.mjs, so it evaluates
// before any application code. It checks the document's build marker and the minimum V18 DOM contract:
//   * compatible          -> continue; an internal recovery parameter left in the address bar is cleaned up.
//   * incompatible, first -> exactly ONE top-level cache-busted navigation (location.replace) to the same URL with
//                            ?__wf_reload=<build>, preserving every other parameter and the hash.
//   * incompatible, again -> never reload twice: show a controlled "needs a refresh" message with a REFRESH button.
// When it blocks, the module suspends its own evaluation (a never-settling top-level await), so challenge.mjs and
// the rest of the import graph never run against the stale document and nothing throws.
import {APP_BUILD,RECOVERY_PARAM} from './build-id.mjs';

// Only elements present in the static current challenge.html. Elements created dynamically later (mixer rows,
// picker, reward journey scenes) are intentionally not listed.
export const V18_DOM_CONTRACT=Object.freeze(['receiverApp','heading-invitation','inviteExplain','inviteRunner','inviteTarget','targetMission','inviteGauge','inviteGaugeTrack','inviteGaugeTarget','inviteGaugeArrow','targetRules','inviteReward','loadingOverlay','readyBands']);

export function checkBuildCompatibility(doc,{build=APP_BUILD,contract=V18_DOM_CONTRACT}={}){
  const missing=[];
  const root=doc?.getElementById?.('receiverApp')||null;
  const marker=root?.getAttribute?.('data-app-build')||'';
  if(marker!==build)missing.push(`data-app-build(${marker||'absent'})`);
  for(const id of contract)if(!doc?.getElementById?.(id))missing.push(id);
  return Object.freeze({compatible:missing.length===0,marker,missing:Object.freeze(missing)});
}

export function hasRecoveryParam(search,param=RECOVERY_PARAM){return new URLSearchParams(String(search||'')).has(param);}

// Same URL (path, every other query parameter, hash) with the recovery parameter set.
export function recoveryHref(locationLike,{build=APP_BUILD,param=RECOVERY_PARAM,nonce=''}={}){
  const url=new URL(String(locationLike?.href||''));
  url.searchParams.set(param,nonce?`${build}.${nonce}`:build);
  return url.href;
}
// Same URL with the recovery parameter removed (relative form, safe for history.replaceState).
export function withoutRecoveryParam(locationLike,{param=RECOVERY_PARAM}={}){
  const url=new URL(String(locationLike?.href||''));
  url.searchParams.delete(param);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function renderRefreshNeeded(doc,{onRefresh}){
  const body=doc.body;
  while(body.firstChild)body.removeChild(body.firstChild);
  const box=doc.createElement('main');box.id='versionSkewNotice';box.setAttribute('role','alert');
  box.style.cssText='box-sizing:border-box;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px 16px;text-align:center;background:#35163f;color:#fff;font:700 16px/1.4 system-ui,sans-serif';
  const h=doc.createElement('h1');h.textContent='THIS CHALLENGE NEEDS A REFRESH';h.style.cssText='margin:0;font-size:22px';
  const p=doc.createElement('p');p.textContent='This page is from an older Dungeon Runner version. Please refresh or reopen the challenge.';p.style.cssText='margin:0;max-width:320px;font-weight:600';
  const b=doc.createElement('button');b.type='button';b.id='versionSkewRefresh';b.textContent='REFRESH';b.style.cssText='min-height:52px;padding:0 32px;border-radius:12px;border:1px solid #cda257;background:#ffd34d;color:#2a1330;font:900 16px system-ui,sans-serif';
  b.addEventListener('click',onRefresh);
  box.append(h,p,b);body.append(box);
  return box;
}

// Pure decision + side effects through injected globals, so it is testable without a browser.
export function runBuildGate({document:doc,location:loc,history:hist,now=()=>Date.now().toString(36)}){
  const verdict=checkBuildCompatibility(doc);
  if(verdict.compatible){
    if(hasRecoveryParam(loc.search)){try{hist.replaceState(hist.state,'',withoutRecoveryParam(loc));}catch{}}
    return Object.freeze({action:'continue',verdict});
  }
  if(!hasRecoveryParam(loc.search)){
    const href=recoveryHref(loc);
    loc.replace(href);
    return Object.freeze({action:'recover',href,verdict});
  }
  renderRefreshNeeded(doc,{onRefresh:()=>loc.replace(recoveryHref(loc,{nonce:now()}))});
  return Object.freeze({action:'blocked',verdict});
}

export const BUILD_GATE_RESULT=(typeof document!=='undefined'&&typeof location!=='undefined')
  ?runBuildGate({document,location,history})
  :Object.freeze({action:'continue',verdict:null});
if(BUILD_GATE_RESULT.action!=='continue')await new Promise(()=>{});
