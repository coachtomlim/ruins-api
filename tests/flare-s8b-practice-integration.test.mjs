import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Hub exposes a prominent TEST YOUR RUNNER practice CTA',async()=>{
  const html=await read('public/flare-s8b/index.html');
  assert.match(html,/id="testYourRunner"[^>]*>TEST YOUR RUNNER/);
  assert.match(html,/PRACTICE RUN.*NO REWARDS|Practice run.*no rewards/i);
});

test('Hub CTA builds an immutable practice snapshot and navigates to the practice surface, without touching reward paths',async()=>{
  const app=await read('public/flare-s8b/account-app.mjs');
  assert.match(app,/createPracticeRunnerSnapshot\(readyViewModel\)/);
  assert.match(app,/sessionStorage\.setItem\(PRACTICE_SNAPSHOT_KEY/);
  assert.match(app,/location\.href=['"]practice\.html['"]/);
  assert.doesNotMatch(app,/claim_proof_builder_reward|claimGuestRun|purchase_progression_offer\(.*practice/i);
});

test('practice surface never calls reward settlement, wallet mutation, or persistent challenge creation',async()=>{
  const practiceApp=await read('public/flare-s8b/practice-app.mjs');
  assert.doesNotMatch(practiceApp,/claim_proof_builder_reward|claimGuestRun|purchase_progression_offer|wallet_ledger|reward_claim|runner_stat_upgrade_event/i);
  assert.doesNotMatch(practiceApp,/supabase|createClient/i);
  assert.match(practiceApp,/PRACTICE'.*rewardSettlement!==false|rewardSettlement!==false/);
});

test('practice run enforces a fixed Dungeon Budget of 100, independent of account Gold',async()=>{
  const practiceApp=await read('public/flare-s8b/practice-app.mjs');
  assert.match(practiceApp,/budget:100/);
  assert.match(practiceApp,/left=100-used/);
  assert.doesNotMatch(practiceApp,/goldBalance/i);
});

test('practice result screen exposes RUN AGAIN / EDIT DUNGEON / BACK TO RUNNER with no reward/settlement fields',async()=>{
  const html=await read('public/flare-s8b/practice.html');
  assert.match(html,/id="retry">RUN AGAIN/);
  assert.match(html,/id="rebuild">EDIT DUNGEON/);
  assert.match(html,/<a href="index\.html" id="backToRunner">BACK TO RUNNER/);
  assert.match(html,/resultRemainingHp/);
  assert.match(html,/resultMaxHp/);
  assert.match(html,/resultFinishPct/);
  assert.match(html,/resultEffHp/);
  assert.match(html,/resultEffAtk/);
  assert.match(html,/resultEffDef/);
  assert.doesNotMatch(html,/Builder Gold|Hero Gold|reward claim/i);
});

test('practice surface loads the snapshot from a transient per-tab handoff and fails closed without one',async()=>{
  const practiceApp=await read('public/flare-s8b/practice-app.mjs');
  assert.match(practiceApp,/sessionStorage\.getItem\(SNAPSHOT_KEY\)/);
  assert.match(practiceApp,/if\(!raw\)throw new Error/);
  assert.match(practiceApp,/mode!=='PRACTICE'\|\|parsed\?\.rewardSettlement!==false/);
});

test('practice bridges the authoritative Runner into the existing simulation seam without editing frozen predecessors',async()=>{
  const practiceApp=await read('public/flare-s8b/practice-app.mjs');
  assert.match(practiceApp,/applyPracticeRunnerToCatalog\(legacyCatalog,snapshot\)/);
  assert.match(practiceApp,/from '\.\.\/flare-s7\//);
  assert.doesNotMatch(practiceApp,/from '\.\.\/flare-s8a\/(?!actors)/);
});

test('Runner Hub visual fails closed for an unsupported loadout instead of showing stale gear',async()=>{
  const app=await read('public/flare-s8b/account-app.mjs');
  assert.match(app,/function supportsStarterVisual\(vm\)/);
  assert.match(app,/if\(!supportsStarterVisual\(vm\)\)\{/);
  assert.match(app,/Runner visual unavailable for this loadout\./);
});


test('practice layout provides full-dungeon preview and mobile runtime safeguards',async()=>{
  const css=await read('public/flare-s8b/practice.css');
  assert.match(css,/room-screen \.room-stage\{[^}]*height:clamp\(320px,52vh,620px\)/);
  assert.match(css,/@media\(max-width:620px\)[\s\S]*room-screen \.room-stage\{[^}]*height:clamp\(300px,44vh,430px\)/);
  assert.match(css,/runtime-screen \.receiver-play-stage\{min-height:0\}/);
  assert.match(css,/result-card\{max-height:min\(92vh,760px\);overflow:auto\}/);
});
