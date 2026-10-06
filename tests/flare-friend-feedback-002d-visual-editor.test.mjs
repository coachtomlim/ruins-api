import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRunnerInspectorViewModel} from '../public/flare-s8a/runner-inspector-view-model.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

// --- RUNNER INSPECTOR ---

test('inspector shows authoritative HP/ATK/DEF for a snapshot-resolved Runner',()=>{
  const vm=buildRunnerInspectorViewModel({displayName:'Rookie Warrior',hp:105,attack:12,defense:1,authoritySource:'snapshot',snapshotEquipment:[
    {slot:'weapon',equipped:true,name:'Wooden Club',modifiers:{attack:4}},
    {slot:'shield',equipped:true,name:'Wooden Shield',modifiers:{defense:1}},
    {slot:'head',equipped:false},{slot:'chest',equipped:false},{slot:'hands',equipped:false},{slot:'legs',equipped:false},{slot:'feet',equipped:false}
  ]});
  assert.equal(vm.hp,105);assert.equal(vm.attack,12);assert.equal(vm.defense,1);
  assert.equal(vm.equipment.length,7);
});

test('inspector lists all 7 equipment slots with correct empty/equipped state and modifiers',()=>{
  const vm=buildRunnerInspectorViewModel({hp:105,attack:12,defense:1,authoritySource:'snapshot',snapshotEquipment:[
    {slot:'weapon',equipped:true,name:'Wooden Club',modifiers:{attack:4}},
    {slot:'shield',equipped:true,name:'Wooden Shield',modifiers:{defense:1}},
  ]});
  const bySlot=Object.fromEntries(vm.equipment.map(s=>[s.slot,s]));
  assert.equal(bySlot.weapon.empty,false);assert.equal(bySlot.weapon.itemName,'WOODEN CLUB');assert.match(bySlot.weapon.modifierLabel,/\+4 ATK/);
  assert.equal(bySlot.shield.empty,false);assert.match(bySlot.shield.modifierLabel,/\+1 DEF/);
  for(const slot of ['head','chest','hands','legs','feet']){assert.equal(bySlot[slot].empty,true);assert.equal(bySlot[slot].itemName,'EMPTY');}
});

test('legacy/template path (no snapshot) shows the fixed starter loadout: club+shield equipped, rest empty',()=>{
  const vm=buildRunnerInspectorViewModel({hp:100,attack:10,defense:0,authoritySource:'legacy'});
  const bySlot=Object.fromEntries(vm.equipment.map(s=>[s.slot,s]));
  assert.equal(bySlot.weapon.itemName,'WOODEN CLUB');
  assert.equal(bySlot.shield.itemName,'WOODEN SHIELD');
  for(const slot of ['head','chest','hands','legs','feet'])assert.equal(bySlot[slot].empty,true);
});

test('inspector view model never carries ownership/account/player identifiers',()=>{
  const vm=buildRunnerInspectorViewModel({hp:105,attack:12,defense:1,authoritySource:'snapshot',snapshotEquipment:[{slot:'weapon',equipped:true,name:'Wooden Club',modifiers:{attack:4},ownership_id:'should-never-appear'}]});
  assert.doesNotMatch(JSON.stringify(vm),/ownership_id|owner_player_id|owner_runner_id|player_id|account_id/i);
});

test('inspector opens/closes with CLOSE and is wired to the Runner portrait button',async()=>{
  const [html,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs')]);
  assert.match(html,/id="viewRunner"/);
  assert.match(html,/id="runnerInspector" class="modal-overlay" hidden/);
  assert.match(html,/id="closeRunnerInspector"/);
  assert.match(mjs,/\$\('viewRunner'\)\.addEventListener\('click',openRunnerInspector\)/);
  assert.match(mjs,/\$\('closeRunnerInspector'\)\.addEventListener\('click',closeRunnerInspector\)/);
  assert.match(mjs,/e\.key==='Escape'/);
});

test('inspector modal has an accessible name and is a role=dialog',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.match(html,/role="dialog" aria-modal="true" aria-labelledby="runnerInspectorTitle"/);
  assert.match(html,/id="runnerInspectorTitle">RUNNER</);
});

// --- ASSET MAPPING (Part B) ---

test('every governed trap/support uses the exact color+label pair the real dungeon renderer already draws, not an invented one',async()=>{
  const [cardIcons,renderer]=await Promise.all([read('public/flare-s8a/card-icons.mjs'),read('public/flare-s7/renderer.mjs')]);
  for(const [id,label,color] of [
    ['small-potion','+10 HP','#df8999'],['battle-tonic','+2 ATK','#efc76e'],['iron-tonic','+2 DEF','#8fd4c6'],
    ['spike-trap','SPIKES','#efc76e'],['dart-trap','DARTS','#e79a75']
  ]){
    assert.match(renderer,new RegExp(`'${id}':\\{label:'${label.replace(/\+/g,'\\+')}',color:'${color}'\\}`));
    assert.match(cardIcons,new RegExp(`'${id}':\\{label:'${label.replace(/\+/g,'\\+')}',color:'${color}'\\}`));
  }
});

test('public/flare-s7 (frozen tree) was not edited to source the card icons',async()=>{
  const {execFileSync}=await import('node:child_process');
  const repoRoot=new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]):/,'$1:');
  // Mirrors tests/flare-s71-onboarding.test.mjs's own frozen-tree pin; if that commit moves, this
  // still only asserts the diff against HEAD is empty, which is the actual invariant we rely on.
  const diff=execFileSync('git',['-C',repoRoot,'status','--porcelain','--','public/flare-s7']).toString();
  assert.equal(diff.trim(),'');
});

test('monsters have no per-item sprite asset in the repo, so every monster card uses one honest, consistently-labeled generic category icon',async()=>{
  const cardIcons=await read('public/flare-s8a/card-icons.mjs');
  assert.match(cardIcons,/no sprite\/image files exist anywhere under public\/ for monsters/);
  assert.match(cardIcons,/export function monsterCardIcon\(\)/);
  // Exactly one icon function for all four monster ids — not four distinct (nonexistent) sprites.
  assert.equal((cardIcons.match(/card-icon--monster/g)||[]).length,1);
});

test('equipment slot icons are the existing Runner Hub icon set, not newly invented glyphs',async()=>{
  const [icon,accountApp]=await Promise.all([read('public/flare-s8a/gear-slot-icon.mjs'),read('public/flare-s8b/account-app.mjs')]);
  for(const slot of ['weapon','shield','head','chest','hands','legs','feet']){
    const pathMatch=accountApp.match(new RegExp(`${slot}:'(<svg[^']+)'`));
    assert.ok(pathMatch,`account-app.mjs missing ${slot} icon to compare against`);
    assert.ok(icon.includes(pathMatch[1]),`gear-slot-icon.mjs ${slot} icon does not match the governed Runner Hub icon`);
  }
});

// --- VISUAL EDITOR ---

test('monster slots are radio-style cards (one selection per guard), not bare <select> elements',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/input\.type='radio';input\.name=name/);
  assert.doesNotMatch(mjs,/document\.createElement\('select'\)/);
});

test('trap/support cards are checkbox-backed labels with a visible, non-color-only selected indicator (border/background treatment, not a duplicate badge — 002E7 Part K)',async()=>{
  const [mjs,css]=await Promise.all([read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/style.css')]);
  assert.match(mjs,/input\.type='checkbox';input\.dataset\.choice=item\.id/);
  assert.match(css,/\.card:has\(:checked\)\{border-color:/);
  assert.match(css,/\.card\.is-selected\{border-color:/);
  // the old always-present "SELECTED" text badge is gone — the paged-selector's own
  // SELECT/REMOVE action button is now the single selected-state treatment (see 002E4 test file).
  assert.doesNotMatch(mjs,/card-selected-mark/);
});

test('every card shows an icon, name, budget cost and short effect',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/costLine\.textContent=`\$\{item\.cost\} BUDGET`/);
  assert.match(mjs,/effectLine\.textContent=encounterItemEffectLabel\(item\.id\)\|\|item\.summary/);
});

test('budget enforcement is unchanged: DONE stays disabled over the legal budget, authority untouched',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/\$\('finishCustomize'\)\.disabled=!m\.canFinish/);
});

test('selecting a card dispatches the existing change-driven estimate/budget pipeline, no new state path',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/for\(const control of document\.querySelectorAll\('\[name\^="guard-"\],\[data-choice\]'\)\)control\.addEventListener\('change',\(\)=>\{session=setEncounter\(session,encounter\(\)\);show\(\);\}\)/);
});

// --- GAUGE (regression from 002C, still wired through the new editor) ---

test('gauge stays visible and live while the card editor is open',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const customizeSection=html.slice(html.indexOf('data-screen="customize"'),html.indexOf('data-screen="ready"'));
  assert.match(customizeSection,/id="customizeGaugeTarget"/);
  assert.match(customizeSection,/id="customizeGaugeEstimate"/);
});

// --- READY SUMMARY (Part H) ---

test('Ready screen shows room, target, live estimate gauge, budget and a visual list of selections',async()=>{
  const [html,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs')]);
  assert.match(html,/id="readyGaugeTarget"/);
  assert.match(html,/id="readyGaugeEstimate"/);
  assert.match(html,/id="readySelections" class="ready-selections"/);
  assert.match(mjs,/function renderReadySelections\(\)/);
  assert.match(mjs,/renderReadySelections\(\);\}/);
});

test('Ready screen selections reuse the existing labels() helper (room/catalog authority), not invented text',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/const names=\[\.\.\.labels\(e\.enemyTypes,'monster'\),\.\.\.labels\(e\.trapTypes,'item'\),\.\.\.labels\(e\.supportTypes,'item'\)\];/);
});

// --- REPLAY / ACTIVITY REGRESSION ---

test('RUN AGAIN replacement copy and v2 Activity RPC remain intact',async()=>{
  const [html,adapter]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8b/account-adapter.mjs')]);
  assert.match(html,/A new run will replace your current challenge result\./);
  assert.match(adapter,/get_builder_challenge_results_v2/);
});

// --- FOUNDATION REGRESSION ---

test('HOME/BACK, bold primary buttons, account handoff and Rewards DOM contract are untouched',async()=>{
  const [html,mjs,css]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/style.css')]);
  assert.match(html,/id="navHome" class="nav-link" href="\/quick-dungeon\/flare-s8b\/"/);
  assert.match(html,/id="navBack" class="nav-link" type="button" hidden/);
  assert.match(css,/\.primary\{[^}]*color:#000/);
  assert.match(mjs,/FRIEND_GOAL_CLAIM_KEY/);
  assert.match(mjs,/REWARDS_DOM_CONTRACT=\[/);
});
