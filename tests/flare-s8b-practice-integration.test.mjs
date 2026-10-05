import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Hub exposes BUILD A DUNGEON as the primary CTA and TEST DUNGEON as a demoted secondary CTA, both reusing the same build surface',async()=>{
  const html=await read('public/flare-s8b/index.html');
  assert.match(html,/id="buildDungeonCta"[^>]*class="primary[^"]*"[^>]*>BUILD A DUNGEON|class="primary[^"]*"[^>]*id="buildDungeonCta"[^>]*>BUILD A DUNGEON/);
  assert.match(html,/Choose a dungeon, add monsters, traps and support, then test or share it\./);
  assert.match(html,/id="testYourRunner"[^>]*class="secondary[^"]*"[^>]*>TEST DUNGEON|class="secondary[^"]*"[^>]*id="testYourRunner"[^>]*>TEST DUNGEON/);
  assert.match(html,/Run your current Runner through this build\. Test runs do not earn rewards\./);
});

test('Both the BUILD A DUNGEON and TEST DUNGEON CTAs build an immutable practice snapshot and navigate to the same build/test surface, without touching reward paths — no duplicate builder engine',async()=>{
  const app=await read('public/flare-s8b/account-app.mjs');
  assert.match(app,/async function goToDungeonBuilder\(\)\{/);
  assert.match(app,/createPracticeRunnerSnapshot\(readyViewModel,\{accessToken\}\)/);
  assert.match(app,/sessionStorage\.setItem\(PRACTICE_SNAPSHOT_KEY/);
  assert.match(app,/location\.href=['"]practice\.html['"]/);
  assert.match(app,/byId\('buildDungeonCta'\)\.addEventListener\('click',goToDungeonBuilder\)/);
  assert.match(app,/byId\('testYourRunner'\)\.addEventListener\('click',goToDungeonBuilder\)/);
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


test('room preview canvas is pinned to the room stage and redraw observes the sized container',async()=>{
  const [css,app]=await Promise.all([
    read('public/flare-s8b/practice.css'),
    read('public/flare-s8b/practice-app.mjs')
  ]);
  assert.match(css,/room-screen #roomPreview\{position:absolute;inset:0;width:100%;height:100%;display:block\}/);
  assert.match(app,/new ResizeObserver\(\(\)=>\{if\(step===0&&selectedRoom\(\)\)renderRoom\(\)\}\)\.observe\(\$\('roomStage'\)\)/);
  assert.doesNotMatch(app,/ResizeObserver[^\n]*practiceApp/);
});


test('runtime renderer resizes with the scene canvas and result actions meet touch target',async()=>{
  const [app,css]=await Promise.all([
    read('public/flare-s8b/practice-app.mjs'),
    read('public/flare-s8b/practice.css')
  ]);
  assert.match(app,/new ResizeObserver\(\(\)=>\{if\(renderer\)renderer\.resize\(\)\}\)\.observe\(\$\('scene'\)\)/);
  assert.match(css,/\.result-actions button,\.result-actions a\{min-height:44px\}/);
});
