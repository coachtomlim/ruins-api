import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

// --- A: FULL-SCREEN FIRST-RUN SUCCESS MOMENT ---

test('the unlock ceremony is a true full-screen overlay (fixed, full-viewport, above everything), not an inline rewards card',async()=>{
  const [html,css]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/style.css')]);
  assert.match(html,/id="unlockOverlay" class="unlock-overlay" hidden role="dialog" aria-modal="true"/);
  assert.match(css,/\.unlock-overlay\{position:fixed;inset:0;z-index:30;/);
  // the overlay markup sits alongside the runnerInspector modal (outside the [data-screen] states),
  // never inside the rewards <section> — it owns the viewport independently of that screen.
  const rewardsSection=html.slice(html.indexOf('data-screen="rewards"'),html.indexOf('data-screen="registration"'));
  assert.doesNotMatch(rewardsSection,/unlock-overlay|unlockOverlay/);
});

test('normal result/receipt/reward DOM remains intact underneath and is not replaced by the overlay',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const rewardsSection=html.slice(html.indexOf('data-screen="rewards"'),html.indexOf('data-screen="registration"'));
  for(const id of ['resultTarget','resultFinished','resultDifference','resultScore','heroRewardGold','builderRewardGold','resultReceiptStatus','retryResultReceipt'])
    assert.match(rewardsSection,new RegExp(`id="${id}"`));
});

// --- B: ANIMATION SEQUENCE ---

test('the phase sequence (success -> locked -> unlocking -> revealed) is timed via explicit, inspectable delays, not an opaque single transition',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/el\.classList\.add\('phase-success'\);/);
  assert.match(mjs,/setTimeout\(\(\)=>el\.classList\.add\('phase-locked'\),500\)/);
  assert.match(mjs,/setTimeout\(\(\)=>el\.classList\.add\('phase-unlocking'\),1000\)/);
  assert.match(mjs,/setTimeout\(\(\)=>el\.classList\.add\('phase-revealed'\),1700\)/);
});

test('the lock has a real closed-state and a real open-state transition — separate body and shackle elements, not a single static icon that just scales',async()=>{
  const [html,css]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/style.css')]);
  assert.match(html,/id="unlockShackle" class="unlock-shackle"/);
  assert.match(html,/id="unlockLockBody" class="unlock-lock-body"/);
  assert.match(html,/id="unlockLockGlow" class="unlock-lock-glow"/);
  assert.match(css,/\.unlock-overlay\.phase-locked \.unlock-lock-stage\{opacity:1;transform:scale\(1\)\}/);
  assert.match(css,/\.unlock-overlay\.phase-unlocking \.unlock-shackle\{transform:translateY\(-14px\) rotate\(-28deg\)\}/);
  assert.match(css,/\.unlock-overlay\.phase-unlocking \.unlock-lock-glow\{stroke-width:3;opacity:\.8\}/);
});

test('FIRST RUN COMPLETE! appears large/central in phase 1, DUNGEON BUILDER TOOLS UNLOCKED appears in the reveal phase',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.match(html,/id="unlockSuccessText">FIRST RUN COMPLETE!/);
  assert.match(html,/id="unlockFinalText">DUNGEON BUILDER TOOLS UNLOCKED/);
});

test('total ceremony duration is within the task\'s ~2-2.5s target (last phase trigger at 1.7s plus staggered reveal transitions, nothing open-ended)',async()=>{
  const [mjs,css]=await Promise.all([read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/style.css')]);
  const delays=[...mjs.matchAll(/setTimeout\([^,]+,(\d+)\)/g)].map(m=>Number(m[1]));
  assert.ok(Math.max(...delays)<=1700,'no unlock-sequence timer should run past ~1.7s, leaving room for the staggered reveal to land by ~2.1-2.5s');
  assert.match(css,/\.unlock-overlay\.phase-revealed \.unlock-tool-card:nth-child\(3\)\{transition-delay:\.34s\}/);
});

// --- C/J: UNLOCKED ASSET CARDS MUST BE CLICKABLE, DIRECT HANDOFF ---

test('MONSTERS/TRAPS/SUPPORTS are real interactive buttons built from existing governed icon authority, not decorative chips',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/const UNLOCK_TOOLS=Object\.freeze\(\[/);
  assert.match(mjs,/\{panel:'monsters',label:'MONSTERS',copy:'Choose what guards each room\.',icon:\(\)=>monsterCardIcon\(\)\}/);
  assert.match(mjs,/\{panel:'traps',label:'TRAPS',copy:'Add hazards to change the challenge\.',icon:\(\)=>encounterItemBadge\('spike-trap'\)\}/);
  assert.match(mjs,/\{panel:'supports',label:'SUPPORTS',copy:'Help the Runner survive\.',icon:\(\)=>encounterItemBadge\('small-potion'\)\}/);
  assert.match(mjs,/card\.addEventListener\('click',\(\)=>openUnlockedTool\(tool\.panel\)\)/);
});

test('each tool card opens EDIT DUNGEON directly on the correct active tab via one small helper — no parallel editor state machine',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/function openUnlockedTool\(panel\)\{activePanel=panel;dismissUnlockOverlay\(\);transition\('EDIT_DUNGEON'\);\}/);
  // EDIT_DUNGEON is the SAME existing rewards->customize transition used elsewhere (e.g. CUSTOMIZE
  // THIS DUNGEON), and renderTabs() already drives the active tab from the shared `activePanel`
  // variable — so no second tab-rendering implementation was introduced.
  assert.match(mjs,/function renderTabs\(\)\{for\(const tab of document\.querySelectorAll\('\[data-custom-tab\]'\)\)\{const on=tab\.dataset\.customTab===activePanel;/);
});

// --- E/F: CONTINUE TO RESULTS, RECEIPT INDEPENDENCE, NO DUPLICATE INLINE CARD ---

test('CONTINUE TO RESULTS dismisses only the overlay (clears timers, hides it) without touching journey state or re-fetching results',async()=>{
  const [html,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs')]);
  assert.match(html,/id="continueToResults">CONTINUE TO RESULTS/);
  assert.match(mjs,/\$\('continueToResults'\)\.addEventListener\('click',dismissUnlockOverlay\)/);
  assert.match(mjs,/function dismissUnlockOverlay\(\)\{clearUnlockTimers\(\);\$\('unlockOverlay'\)\.hidden=true;/);
});

test('receipt submission is wired independently of the overlay — completeRuntime always calls sendResultReceipt in its finally block regardless of unlock/ceremony state',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  const completeStart=mjs.indexOf('completeRuntime(result,score){');
  const complete=mjs.slice(completeStart,mjs.indexOf('replayRuntime('));
  assert.match(complete,/finally\{void sendResultReceipt\(\);\}/);
});

test('the rewards screen shows at most a compact BUILDER TOOLS UNLOCKED status, never the full ceremony content again, once seen',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/function renderUnlockOverlay\(\)\{/);
  const fnStart=mjs.indexOf('function renderUnlockOverlay(){');
  const fn=mjs.slice(fnStart,mjs.indexOf('}',fnStart)+1);
  assert.match(fn,/\$\('unlockedStatus'\)\.hidden=!customizationUnlocked;/);
  assert.match(fn,/if\(justUnlocked&&!unlockCeremonyShown\)runUnlockSequence\(\);/);
});

// --- H: REDUCED MOTION ---

test('reduced-motion still shows the full-screen final unlocked state (not skipped) with every phase class applied at once, and transitions disabled',async()=>{
  const [mjs,css]=await Promise.all([read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/style.css')]);
  assert.match(mjs,/if\(prefersReducedMotion\(\)\)\{el\.classList\.add\('phase-success','phase-locked','phase-unlocking','phase-revealed'\);return;\}/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.unlock-overlay \*\{transition:none!important\}\}/);
  // tool cards carry no disabled/pointer-events gating by phase — always clickable once rendered
  assert.doesNotMatch(css,/\.unlock-tool-card\{[^}]*pointer-events:none/);
});

// --- I: STATE / FIRST-RUN SEMANTICS ---

test('the unlock ceremony only runs once per first completion and does not replay on a later show() while still on the rewards screen',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/let unlockTimers=\[\],unlockCeremonyShown=false;/);
  assert.match(mjs,/function runUnlockSequence\(\)\{\s*unlockCeremonyShown=true;/);
});

test('session-based unlock authority (sessionStorage key, same-tab persistence) is unchanged from 002E7',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/const CUSTOMIZATION_UNLOCK_KEY='s8aCustomizationUnlocked'/);
  assert.match(mjs,/sessionStorage\.getItem\(CUSTOMIZATION_UNLOCK_KEY\)==='1'/);
  assert.match(mjs,/sessionStorage\.setItem\(CUSTOMIZATION_UNLOCK_KEY,'1'\)/);
  assert.doesNotMatch(mjs,/localStorage|indexedDB|document\.cookie/);
});

// --- G: ACCOUNT MOTIVATION, unchanged ---

test('account CTA copy and placement are unchanged by the full-screen ceremony',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.match(html,/id="saveGoalBuildOwn">CREATE AN ACCOUNT TO KEEP PROGRESSING/);
  assert.match(html,/Save your goal and start building with your own Runner\./);
  assert.match(html,/id="editThisDungeon" class="primary">CUSTOMIZE THIS DUNGEON/);
  assert.match(html,/id="runAgain">RUN AGAIN/);
});
