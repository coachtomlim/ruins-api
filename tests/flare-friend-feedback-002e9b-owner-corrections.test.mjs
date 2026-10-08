import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readFile} from 'node:fs/promises';
import {parseMap} from '../public/flare-p0/src/core/flare.mjs';
import {S7_ROOMS} from '../public/flare-s7/rooms.mjs';
import {applyRunnerModel,runnerSummary,buildS7Challenge,encounterCost,normalizeEncounter} from '../public/flare-s7/game.mjs';
import {estimateEncounter,presetById} from '../public/flare-s7/calibration.mjs';
import {Simulation} from '../public/flare-s7/simulation.mjs';
import {buildDungeonPresets,GOVERNED_PRESET_IDS} from '../public/flare-s8a/dungeon-presets.mjs';
import {extendModelWithLevel2,extendCatalogWithLevel2} from '../public/flare-s8a/level2-content.mjs';
import {createReceiverSession,selectDungeon,setEncounter,advanceReceiver} from '../public/flare-s8a/receiver-session.mjs';
import {buildReceiverView} from '../public/flare-s8a/receiver-view.mjs';
import {STARTER_DUNGEON_IDS} from '../public/flare-s8a/builder-level.mjs';
import {buildRewardJourney} from '../public/flare-s8a/reward-journey.mjs';
import {buildResultViewModel} from '../public/flare-s8a/result-view-model.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const readJson=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const model=extendModelWithLevel2(readJson('../public/flare-s7/data/game.json'));
const catalog=extendCatalogWithLevel2(applyRunnerModel(readJson('../public/flare-p0/data/catalog.json'),model,'warrior-l1'),model);
const runner=runnerSummary(model,'warrior-l1',catalog);
const TARGET=50;
const presets=buildDungeonPresets({catalog,model,runnerId:'warrior-l1',runner,targetHp:TARGET,budget:100,roomIds:STARTER_DUNGEON_IDS});
const chooser=[presets.tooEasy,presets.justRight,presets.brutal]; // the exact order presetList() uses in challenge.mjs
const roomMap=id=>{const map=parseMap(fs.readFileSync(new URL(`../public/flare-s7/${S7_ROOMS[id].local}`,import.meta.url),'utf8'));map.id=id;return map};
function play(roomId,encounter){
  const map=roomMap(roomId),built=buildS7Challenge({roomId,roomTitle:S7_ROOMS[roomId].name,map,catalog,targetHp:TARGET,encounter,budget:100});
  const sim=new Simulation(map,built.challenge,catalog);sim.start();for(let i=0;i<3600&&sim.status==='running';i++)sim.step();
  const r=sim.result();return{built,sim,hp:r.hp,status:r.status,gold:r.gold,kills:r.kills,traps:sim.events.filter(e=>e.type==='trap').length};
}
const BRUTAL={enemyTypes:['skeleton','skeleton','goblin'],trapTypes:['spike-trap'],supportTypes:[]};
const TOO_EASY={enemyTypes:['skeleton','skeleton','none'],trapTypes:[],supportTypes:['small-potion']};
const JUST_RIGHT={enemyTypes:['skeleton','skeleton','goblin'],trapTypes:[],supportTypes:[]};

// The 002E9B Level 1 chooser/matrix tests were superseded by the Owner-approved 002E9C presets (see the 002e9c tests).
test('governed BACK matrix is unchanged: customize BACK -> ready, ready BACK -> mission',async()=>{
  const {transitionJourney}=await import('../public/flare-s8a/journey.mjs');
  assert.equal(transitionJourney('customize','BACK'),'ready');
  assert.equal(transitionJourney('ready','BACK'),'mission');
});

// --- retired 002E8 inline unlock status ---
test('no unlockedStatus DOM, no .unlocked-status CSS, no JS reference remains anywhere in the shipped client',async()=>{
  const files=['challenge.html','challenge.mjs','style.css','reward-journey.mjs','reward-journey-view.mjs','builder-level.mjs','panel-shell.css','tokens.css'];
  for(const f of files){
    const src=await read(`public/flare-s8a/${f}`);
    assert.doesNotMatch(src,/unlockedStatus|unlocked-status/,f);
  }
  const html=await read('public/flare-s8a/challenge.html');
  assert.doesNotMatch(html,/BUILDER LEVEL 2 · THIS SESSION/);
  assert.doesNotMatch(await read('public/flare-s8a/challenge.mjs'),/BUILDER LEVEL \$\{/);
});

test('the 002E8 ceremony and its badge are not reintroduced',async()=>{
  const [html,css,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/style.css'),read('public/flare-s8a/challenge.mjs')]);
  assert.doesNotMatch(css,/\.unlock/);
  assert.doesNotMatch(html,/unlockOverlay|unlock-/);
  assert.doesNotMatch(mjs,/unlockOverlay|unlock-overlay|phase-unlocking/);
  assert.equal((html.match(/id="rewardJourney"/g)||[]).length,1,'exactly one unlock presentation container');
});

test('after Level 2 is granted the rewards screen still renders every result/receipt element and no unlock status (navigation can only re-show these)',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const rewards=html.slice(html.indexOf('data-screen="rewards"'),html.indexOf('data-screen="registration"'));
  for(const id of ['resultTarget','resultFinished','resultDifference','resultScore','heroRewardGold','builderRewardGold','resultReceiptStatus','retryResultReceipt','editThisDungeon','runAgain','saveGoalBuildOwn'])assert.match(rewards,new RegExp(`id="${id}"`));
  assert.doesNotMatch(rewards,/unlock/i);
});

// --- CTA copy ---
test('CTA is exactly "Check out your new gizmos" (002E9B copy, still true in 002E9C)',async()=>{
  const j=buildRewardJourney({result:buildResultViewModel({result:{status:'cleared',hp:56,maxHp:100,gold:24},score:88,targetHp:50,senderName:'cactus'}),senderName:'cactus',level:2,nameOf:id=>id});
  assert.equal(j.scenes[5].try,'Check out your new gizmos');
  for(const f of ['reward-journey.mjs','reward-journey-view.mjs','challenge.mjs','challenge.html'])assert.doesNotMatch(await read(`public/flare-s8a/${f}`),/TRY OUT NEW GIZMOS/i,f);
});
