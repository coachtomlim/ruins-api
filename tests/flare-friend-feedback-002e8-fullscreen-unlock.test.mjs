import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

// 002E8 introduced a full-screen first-run unlock moment. 002E9 SUPERSEDES its lock/unlock ceremony
// with the single reward journey (see flare-friend-feedback-002e9-reward-journey.test.mjs). What
// 002E8 guaranteed that must still hold is kept here: the unlock owns the viewport, the result
// DOM underneath is intact, receipts are independent of presentation, and no inline duplicate exists.

test('the unlock moment is a true full-screen overlay (fixed, full-viewport, above everything), not an inline rewards card',async()=>{
  const [html,css]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/style.css')]);
  assert.match(html,/id="rewardJourney" class="journey-overlay" hidden role="dialog" aria-modal="true"/);
  assert.match(css,/\.journey-overlay\{position:fixed;inset:0;z-index:30;/);
  const rewardsSection=html.slice(html.indexOf('data-screen="rewards"'),html.indexOf('data-screen="registration"'));
  assert.doesNotMatch(rewardsSection,/journey-overlay|rewardJourney/);
});

test('the 002E8 lock/unlock ceremony is gone — one unlock experience only, no stacked duplicate',async()=>{
  const [html,mjs,css]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/style.css')]);
  for(const gone of ['unlockOverlay','unlockShackle','unlockLockBody','unlockLockGlow','unlockToolCards','continueToResults','unlockSuccessText','unlockFinalText','FIRST RUN COMPLETE!','DUNGEON BUILDER TOOLS UNLOCKED','CONTINUE TO RESULTS'])assert.doesNotMatch(html,new RegExp(gone));
  for(const gone of ['runUnlockSequence','buildUnlockToolCards','UNLOCK_TOOLS','phase-locked','phase-unlocking','phase-revealed','unlockCeremonyShown'])assert.doesNotMatch(mjs,new RegExp(gone));
  assert.doesNotMatch(css,/\.unlock-overlay|\.unlock-tool-card|\.unlock-lock/);
  assert.doesNotMatch(html,/id="unlockMoment"/);
});

test('normal result/receipt/reward DOM remains intact underneath and is not replaced by the overlay',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const rewardsSection=html.slice(html.indexOf('data-screen="rewards"'),html.indexOf('data-screen="registration"'));
  for(const id of ['resultTarget','resultFinished','resultDifference','resultScore','heroRewardGold','builderRewardGold','resultReceiptStatus','retryResultReceipt'])
    assert.match(rewardsSection,new RegExp(`id="${id}"`));
});

test('receipt submission is wired independently of the overlay — completeRuntime always calls sendResultReceipt in its finally block',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  const completeStart=mjs.indexOf('completeRuntime(result,score){');
  const complete=mjs.slice(completeStart,mjs.indexOf('replayRuntime('));
  assert.match(complete,/finally\{void sendResultReceipt\(\);\}/);
});

test('the rewards screen shows no unlock status at all (002E9B retired the inline cyan status)',async()=>{
  const [html,mjs,css]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/style.css')]);
  assert.doesNotMatch(html,/unlockedStatus|unlocked-status/);
  assert.doesNotMatch(mjs,/unlockedStatus/);
  assert.doesNotMatch(css,/unlocked-status/);
  assert.match(mjs,/if\(!justUnlocked\|\|journeyShown\)return;\s*journeyShown=true;/);
});

test('the journey runs only once per first completion and does not replay on a later show() while still on the rewards screen',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/let heroActorPack=null,journeyShown=false;/);
  assert.match(mjs,/journeyShown=true;/);
});

test('account CTA copy and placement are unchanged',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.match(html,/id="saveGoalBuildOwn">CREATE AN ACCOUNT TO KEEP PROGRESSING/);
  assert.match(html,/Save your goal and start building with your own Runner\./);
  assert.match(html,/id="editThisDungeon" class="primary">CUSTOMIZE THIS DUNGEON/);
  assert.match(html,/id="runAgain">RUN AGAIN/);
});
