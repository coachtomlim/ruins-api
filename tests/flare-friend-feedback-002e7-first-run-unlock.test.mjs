import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {installPagedSelector} from '../public/flare-s8a/paged-selector.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

// --- FIRST-RUN GATE ---

test('customization is locked by default and the lock is tracked via a current-session flag, not a new permanent store',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/const CUSTOMIZATION_UNLOCK_KEY='s8aCustomizationUnlocked'/);
  assert.match(mjs,/let customizationUnlocked=false;/);
  assert.match(mjs,/sessionStorage\.getItem\(CUSTOMIZATION_UNLOCK_KEY\)==='1'/);
  assert.doesNotMatch(mjs,/localStorage|indexedDB|document\.cookie/);
});

test('a desirable locked teaser (not a bare hidden element) is shown in place of the editor when locked',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const customizeSection=html.slice(html.indexOf('data-screen="customize"'),html.indexOf('data-screen="ready"'));
  assert.match(customizeSection,/id="customizeLocked" class="locked-teaser" hidden/);
  assert.match(customizeSection,/CUSTOM DUNGEON TOOLS/);
  assert.match(customizeSection,/LOCKED/);
  assert.match(customizeSection,/Complete your first run to unlock/);
  for(const tool of ['MONSTERS','TRAPS','SUPPORTS'])assert.match(customizeSection,new RegExp(`<li>${tool}</li>`));
});

test('all 3 presets (TOO EASY / JUST RIGHT / BRUTAL) and USE THIS DUNGEON remain usable before any run, unaffected by the lock',async()=>{
  const html=await read('public/flare-s8a/challenge.html'),mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(html,/id="dungeonPresets" class="dungeon-chooser"/);
  assert.match(html,/id="useDungeon" class="primary">USE THIS DUNGEON/);
  assert.match(mjs,/const presetList=\(\)=>\[dungeonPresets\.tooEasy,dungeonPresets\.justRight,dungeonPresets\.brutal\];/);
});

test('first run completion unlocks customization exactly once and persists for the rest of this session/tab (002E8: also arms the full-screen ceremony flag)',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  const completeStart=mjs.indexOf('completeRuntime(result,score){');
  const complete=mjs.slice(completeStart,mjs.indexOf('replayRuntime('));
  assert.match(complete,/if\(!customizationUnlocked\)\{customizationUnlocked=true;justUnlocked=true;unlockCeremonyShown=false;try\{sessionStorage\.setItem\(CUSTOMIZATION_UNLOCK_KEY,'1'\);\}catch\{\}\}else\{justUnlocked=false;\}/);
});

test('(see tests/flare-friend-feedback-002e8-fullscreen-unlock.test.mjs for the full-screen ceremony, phased lock animation, reduced-motion and direct tool handoff coverage)',()=>{assert.ok(true)});

test('normal UI entry points into customization (mission CUSTOMIZE, ready EDIT DUNGEON, rewards CUSTOMIZE THIS DUNGEON) all render through the one gated customize branch — no bypass path',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/\$\('openCustomize'\)\.addEventListener\('click',\(\)=>transition\('CUSTOMIZE'\)\)/);
  assert.match(mjs,/\$\('editDungeon'\)\.addEventListener\('click',\(\)=>transition\('CUSTOMIZE'\)\)/);
  assert.match(mjs,/\$\('editThisDungeon'\)\.addEventListener\('click',\(\)=>transition\('EDIT_DUNGEON'\)\)/);
  const customizeBranchStart=mjs.indexOf("else if(view.kind==='customize'){");
  const customizeBranch=mjs.slice(customizeBranchStart,mjs.indexOf("else if(view.kind==='ready'){"));
  assert.match(customizeBranch,/\$\('customizeLocked'\)\.hidden=customizationUnlocked;\$\('customizeEditor'\)\.hidden=!customizationUnlocked;\$\('customizeActions'\)\.hidden=!customizationUnlocked;/);
  assert.match(customizeBranch,/if\(!customizationUnlocked\)return;/);
});

// --- EDITOR ---

test('REMOVE on a selected monster guard slot safely falls back to that guard\'s own EMPTY/none card (never an invalid encounter state)',()=>{
  class Element{
    children=[];listeners={};attributes={};checked=false;textContent='';
    classList={values:new Set(),add:v=>this.classList.values.add(v),toggle:(v,on)=>on?this.classList.values.add(v):this.classList.values.delete(v)};
    append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node)}}
    querySelector(selector){return this.children.find(node=>node.tag===selector)}
    setAttribute(key,value){this.attributes[key]=value}
    addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
    dispatchEvent(event){for(const fn of this.listeners[event.type]||[])fn(event);if(event.bubbles)this.parentElement?.dispatchEvent(event)}
    click(){this.dispatchEvent({type:'click',preventDefault(){},stopPropagation(){}})}
  }
  const old=globalThis.document;globalThis.document={createElement:tag=>Object.assign(new Element(),{tag})};
  try{
    const parent=new Element(),row=new Element();parent.append(row);
    const emptyInput=Object.assign(new Element(),{tag:'input',type:'radio',name:'guard-0',value:'none',checked:true,attributes:{name:'guard-0',value:'none'}});
    const emptyCard=new Element();emptyCard.append(emptyInput,Object.assign(new Element(),{tag:'strong',textContent:'EMPTY'}));row.append(emptyCard);
    const goblinInput=Object.assign(new Element(),{tag:'input',type:'radio',name:'guard-0',value:'goblin',attributes:{name:'guard-0',value:'goblin'}});
    const goblinCard=new Element();goblinCard.append(goblinInput,Object.assign(new Element(),{tag:'strong',textContent:'Goblin'}));row.append(goblinCard);
    row.querySelector=selector=>row.children.flatMap(c=>c.children).find(node=>{
      if(node.tag!=='input')return false;
      const m=/input\[name="([^"]+)"\]\[value="([^"]+)"\]/.exec(selector);
      return m?node.attributes.name===m[1]&&node.attributes.value===m[2]:false;
    });
    installPagedSelector(row,'monster for guard 1');
    const goblinAction=goblinCard.children.at(-1);
    goblinAction.click();
    assert.equal(goblinInput.checked,true);
    goblinAction.click();
    assert.equal(emptyInput.checked,true,'REMOVE must fall back to EMPTY, never leave the guard slot unset');
  }finally{globalThis.document=old}
});

test('active tab (MONSTERS/TRAPS/SUPPORTS) has an unmistakable visual treatment, not just an aria attribute',async()=>{
  const css=await read('public/flare-s8a/style.css');
  assert.match(css,/\.custom-tabs button\[aria-selected="true"\]\{background:linear-gradient/);
});

test('duplicate selected-state treatment is removed — no always-present "SELECTED" badge alongside the SELECT/REMOVE action',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.doesNotMatch(mjs,/card-selected-mark/);
  assert.match(mjs,/function monsterCard\(/);
  assert.match(mjs,/function itemCard\(/);
});

test('option card density is reworked: icon, name, effect, cost, then the paged-selector action — not a tall centered stack',async()=>{
  const [mjs,css]=await Promise.all([read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/style.css')]);
  assert.match(mjs,/body\.append\(strong,summaryLine,costLine\);/);
  assert.match(mjs,/body\.append\(strong,effectLine,costLine\);/);
  assert.match(css,/\.card\{display:grid;grid-template-columns:auto 1fr/);
});

test('action copy is SAVE CHANGES, not the repetitive DONE/OPTIONAL wording',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.match(html,/id="finishCustomize" class="primary">SAVE CHANGES/);
  assert.match(html,/id="resetSuggested">RESET TO SUGGESTED/);
  assert.doesNotMatch(html,/>DONE</);
});

// --- RESULT ---

test('002E8: the old inline unlock card is gone; only a compact, non-repeating status remains on the rewards screen itself',async()=>{
  const [html,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs')]);
  assert.doesNotMatch(html,/id="unlockMoment"/);
  assert.doesNotMatch(mjs,/function renderUnlockMoment\(\)\{/);
  assert.match(html,/id="unlockedStatus" class="unlocked-status" hidden>BUILDER TOOLS UNLOCKED/);
  assert.match(mjs,/\$\('unlockedStatus'\)\.hidden=!customizationUnlocked;/);
});

test('CUSTOMIZE THIS DUNGEON is the primary post-result action; RUN AGAIN remains available; account CTA is present but not required to view the unlock',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const rewardsSection=html.slice(html.indexOf('data-screen="rewards"'),html.indexOf('data-screen="registration"'));
  assert.match(rewardsSection,/id="editThisDungeon" class="primary">CUSTOMIZE THIS DUNGEON/);
  assert.match(rewardsSection,/id="runAgain">RUN AGAIN/);
  assert.match(rewardsSection,/id="saveGoalBuildOwn">CREATE AN ACCOUNT TO KEEP PROGRESSING/);
  assert.match(rewardsSection,/Save your goal and start building with your own Runner\./);
  // account creation is a standalone CTA, never a gate in front of the unlock message itself
  assert.doesNotMatch(rewardsSection,/disabled[^>]*>.*unlock/i);
});

test('result receipt status, retry control and replay-replacement notice are untouched by the unlock change',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.match(html,/id="resultReceiptStatus" class="receipt-status" role="status">Sending result…/);
  assert.match(html,/id="retryResultReceipt" hidden>RETRY RESULT/);
  assert.match(html,/id="replayNotice" class="replay-notice">A new run will replace your current challenge result\./);
});

test('replay/current-result and attempt-token semantics are untouched',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/replayRuntime\(\)\{currentAttemptToken=createAttemptToken\(\);session=advanceReceiver\(session,'RUN_AGAIN'\);show\(\);\}/);
});

// --- REGRESSION ---

test('002E5 single-dungeon visual chooser (3 presets, real preview, LEFT/RIGHT) is unregressed',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/function renderDungeonChooser\(\)\{/);
  assert.match(mjs,/function renderDungeonChooserFrame\(\)\{/);
  assert.match(mjs,/drawPreview\(\$\('presetPreview'\),roomData\.map,roomData\.tiles\)/);
});

test('Runner Inspector, HOME/BACK and account handoff remain untouched by this change',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/function openRunnerInspector\(\)\{/);
  assert.match(mjs,/\$\('navBack'\)\.addEventListener\('click',\(\)=>transition\('BACK'\)\)/);
  assert.match(mjs,/FRIEND_GOAL_CLAIM_KEY/);
});

test('Ready screen (room/target/gauge/budget/selections) markup is untouched by this change',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const readySection=html.slice(html.indexOf('data-screen="ready"'),html.indexOf('data-screen="runtime"'));
  assert.match(readySection,/id="runHero" class="primary">RUN THE HERO/);
  assert.match(readySection,/id="editDungeon">EDIT DUNGEON/);
  assert.match(readySection,/id="readySelections" class="ready-selections"/);
});
