import {S7_ROOMS,loadS7StockRoom,drawPreview} from '../flare-s7/rooms.mjs';
import {loadS7PlayableRoom} from '../flare-s7/actors.mjs';
import {Simulation} from '../flare-s7/simulation.mjs';
import {Renderer} from '../flare-s7/renderer.mjs';
import {applyRunnerModel,monsterSummary,encounterCost,buildS7Challenge,actualHpPercent,SUPPORT_IDS,TRAP_IDS} from '../flare-s7/game.mjs';
import {calibrateEncounter,estimateEncounter,difficultyCue,presetById} from '../flare-s7/calibration.mjs';
import {applyPracticeRunnerToCatalog} from './practice-runner-catalog.mjs';

const PRACTICE_TARGET_HP=60;
const SNAPSHOT_KEY='s8bPracticeSnapshot';

const $=id=>document.getElementById(id),roomSpecs=Object.values(S7_ROOMS),rooms=new Map();
let model=null,snapshot=null,runner=null,catalog=null,roomIndex=0,step=0,sim=null,renderer=null,playing=false,paused=false,elapsed=0,acc=0,prev=0,finishDelay=0,calibrated=null;

function selectedSpec(){return roomSpecs[roomIndex]}
function selectedRoom(){return rooms.get(selectedSpec().id)}
function encounter(){return{enemyTypes:['enemy1','enemy2','enemy3'].map(id=>$(id).value),supportTypes:SUPPORT_IDS.filter(id=>$(id).checked),trapTypes:TRAP_IDS.filter(id=>$(id).checked)}}
function sameEncounter(a,b){return a&&b&&JSON.stringify(a.enemyTypes)===JSON.stringify(b.enemyTypes)&&JSON.stringify(a.supportTypes)===JSON.stringify(b.supportTypes)&&JSON.stringify(a.trapTypes)===JSON.stringify(b.trapTypes)}

function goto(n){
  step=Math.max(0,Math.min(2,n));
  $('practiceApp').dataset.step=String(step);
  document.querySelectorAll('.receiver-progress span').forEach((d,i)=>d.classList.toggle('active',i<=step));
  $('practiceTrack').style.transform=`translateX(-${step*100}%)`;
  $('topTitle').textContent=['Choose the dungeon','Optional customization','The run'][step];
  if(step===0)requestAnimationFrame(renderRoom);
  if(step===1)refreshBuild();
}

function renderRoom(){const spec=selectedSpec(),loaded=selectedRoom();$('roomName').textContent=spec.name;$('roomTier').textContent=`Stock Flare v1.15 dungeon · Tier ${spec.tier}`;$('roomIndex').textContent=`${roomIndex+1} / ${roomSpecs.length}`;if(loaded)drawPreview($('roomPreview'),loaded.map,loaded.tiles);$('chooseRoom').disabled=!loaded}
function changeRoom(delta){roomIndex=(roomIndex+delta+roomSpecs.length)%roomSpecs.length;renderRoom();refreshBuild()}
function applyEncounter(e){['enemy1','enemy2','enemy3'].forEach((id,i)=>$(id).value=e.enemyTypes[i]||'none');for(const id of SUPPORT_IDS)$(id).checked=e.supportTypes.includes(id);for(const id of TRAP_IDS)$(id).checked=e.trapTypes.includes(id);document.querySelectorAll('[data-preset]').forEach(b=>b.classList.remove('active'))}
function preset(name){const e=presetById(name);if(!e)return;applyEncounter(e);document.querySelector(`[data-preset="${name}"]`)?.classList.add('active');refreshBuild()}
function refreshDifficulty(e){const estimate=estimateEncounter({catalog,model,runnerId:model.defaultRunner,runner,encounter:e}),cue=difficultyCue(estimate.estimatedHpPercent,PRACTICE_TARGET_HP);$('difficultyLabel').textContent=cue.label.toUpperCase();$('difficultyNote').textContent=(sameEncounter(e,calibrated?.encounter)?'Calibrated start. ':'')+cue.note;$('calibrationStrip').dataset.level=cue.id}
function refreshBuild(){
  if(!catalog||!runner)return;
  const spec=selectedSpec(),e=encounter(),used=encounterCost(catalog,e),left=100-used;
  $('summaryRoom').textContent=spec.name;
  $('spent').textContent=used;
  $('summaryMonsters').textContent=e.enemyTypes.filter(x=>x!=='none').map(x=>catalog.enemies[x].name).join(' + ')||'None';
  $('summarySupport').textContent=[...e.supportTypes,...e.trapTypes].map(x=>catalog.items[x].label||catalog.items[x].name).join(' + ')||'None';
  $('budgetMessage').textContent=left>=0?`${left} Dungeon Budget remaining`:`Over Dungeon Budget by ${-left}`;
  $('budgetMessage').classList.toggle('bad',left<0);
  $('budgetFill').style.width=`${Math.min(100,used)}%`;
  $('run').disabled=left<0||!selectedRoom();
  refreshDifficulty(e);
  $('buildStatus').textContent=left>=0?'Ready to run your current Runner. Customization is optional.':'Reduce the dungeon cost to Dungeon Budget 100 or less.';
}

function hud(){if(!sim)return;$('hp').textContent=sim.hero.hp;$('time').textContent=(sim.tick/60).toFixed(1)}
function begin(){if(!sim||playing)return;sim.reset();sim.start();playing=true;paused=false;elapsed=acc=finishDelay=0;prev=performance.now();renderer.camera=null;renderer.overview=false;$('resultCover').hidden=true;$('pause').disabled=false;$('pause').textContent='PAUSE';$('runStatus').textContent='Your Runner is finding a legal route.';hud()}
function finishRun(){
  const r=sim.result(),pct=actualHpPercent(r.status,r.hp,r.maxHp);
  $('resultLabel').textContent=r.status==='cleared'?'DUNGEON CLEARED':r.status==='dead'?'RUNNER DEFEATED':'ROUTE BLOCKED';
  $('resultTitle').textContent=r.status==='cleared'?'Dungeon cleared':r.status==='dead'?'Runner defeated':'Route blocked';
  $('resultText').textContent=`${selectedSpec().name} · ${r.seconds.toFixed(1)}s.`;
  $('resultRemainingHp').textContent=String(r.hp);
  $('resultMaxHp').textContent=String(r.maxHp);
  $('resultFinishPct').textContent=`${pct.toFixed(1)}%`;
  $('resultEffHp').textContent=String(runner.hp);
  $('resultEffAtk').textContent=String(runner.attack);
  $('resultEffDef').textContent=String(runner.defense);
  $('resultCover').hidden=false;
  $('pause').disabled=true;
  $('runStatus').textContent=r.status==='cleared'?'Run again, or edit the dungeon.':r.reason;
}
function frame(now){const dt=prev?Math.min(.1,(now-prev)/1000):0;prev=now;if(sim){if(playing&&!paused){elapsed+=dt;if(elapsed>=.35&&sim.status==='running'){acc+=dt;while(acc>=1/60&&sim.status==='running'){sim.step();acc-=1/60}hud()}if(sim.status!=='running'){finishDelay+=dt;if(finishDelay>.45){playing=false;finishRun()}}}renderer.draw(sim,elapsed,dt,matchMedia('(prefers-reduced-motion: reduce)').matches)}requestAnimationFrame(frame)}

async function runGauntlet(){
  try{
    const spec=selectedSpec(),room=selectedRoom(),e=encounter();
    const built=buildS7Challenge({roomId:spec.id,roomTitle:spec.name,map:room.map,catalog,targetHp:PRACTICE_TARGET_HP,encounter:e,budget:100});
    $('run').disabled=true;$('buildStatus').textContent='Loading the animated run…';
    const loaded=await loadS7PlayableRoom(spec.id);
    sim=new Simulation(loaded.map,built.challenge,catalog);
    renderer=new Renderer($('scene'),loaded.map,loaded.atlases);
    renderer.zoom=1.62;
    goto(2);
    begin();
  }catch(error){console.error(error);$('buildStatus').textContent=error.message;$('run').disabled=false}
}

function loadSnapshot(){
  const raw=sessionStorage.getItem(SNAPSHOT_KEY);
  if(!raw)throw new Error('No practice Runner found. Return to your Hub and choose TEST YOUR RUNNER again.');
  let parsed;
  try{parsed=JSON.parse(raw)}catch{throw new Error('Practice Runner snapshot is unreadable.')}
  if(parsed?.mode!=='PRACTICE'||parsed?.rewardSettlement!==false)throw new Error('Practice Runner snapshot is invalid.');
  return parsed;
}

$('chooseRoom').addEventListener('click',()=>goto(1));
$('prevRoom').addEventListener('click',()=>changeRoom(-1));
$('nextRoom').addEventListener('click',()=>changeRoom(1));
$('customize').addEventListener('click',()=>{const opening=$('advanced').hidden;$('advanced').hidden=!opening;$('customize').textContent=opening?'HIDE OPTIONAL OPTIONS':'CUSTOMIZE DUNGEON — OPTIONAL'});
for(const b of document.querySelectorAll('[data-preset]'))b.addEventListener('click',()=>preset(b.dataset.preset));
for(const id of ['enemy1','enemy2','enemy3',...SUPPORT_IDS,...TRAP_IDS])$(id).addEventListener('change',refreshBuild);
$('run').addEventListener('click',runGauntlet);
$('pause').addEventListener('click',()=>{if(!playing)return;paused=!paused;$('pause').textContent=paused?'RESUME':'PAUSE'});
$('overview').addEventListener('click',()=>{if(renderer)renderer.overview=!renderer.overview});
$('retry').addEventListener('click',begin);
$('rebuild').addEventListener('click',()=>{playing=false;paused=false;$('resultCover').hidden=true;goto(1);$('run').disabled=false});
let swipe=null;
$('roomStage').addEventListener('pointerdown',e=>swipe={x:e.clientX,y:e.clientY,id:e.pointerId});
$('roomStage').addEventListener('pointerup',e=>{if(!swipe||swipe.id!==e.pointerId)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;swipe=null;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.15)changeRoom(dx<0?1:-1)});
new ResizeObserver(()=>{if(step===0&&selectedRoom())renderRoom()}).observe($('practiceApp'));
requestAnimationFrame(frame);

(async()=>{
  try{
    snapshot=loadSnapshot();
    runner={name:snapshot.runnerName,hp:snapshot.effectiveStats.hp,attack:snapshot.effectiveStats.attack,defense:snapshot.effectiveStats.defense};
    $('practiceRunnerName').textContent=snapshot.runnerName;
    $('goalRunner').textContent=`${runner.hp} HP · ${runner.attack} ATK · ${runner.defense} DEF`;
    $('goalTarget').textContent=`${PRACTICE_TARGET_HP}% HP`;
    const [base,gameModel]=await Promise.all([
      fetch(new URL('../flare-p0/data/catalog.json',import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Catalogue unavailable');return r.json()}),
      fetch(new URL('../flare-s7/data/game.json',import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('S7 game model unavailable');return r.json()})
    ]);
    model=gameModel;
    const legacyCatalog=applyRunnerModel(base,model,model.defaultRunner);
    catalog=applyPracticeRunnerToCatalog(legacyCatalog,snapshot);
    calibrated=calibrateEncounter({catalog,model,runnerId:model.defaultRunner,runner,targetHp:PRACTICE_TARGET_HP});
    applyEncounter(calibrated.encounter);
    await Promise.all(roomSpecs.map(async spec=>rooms.set(spec.id,await loadS7StockRoom(spec.id))));
    renderRoom();
    $('introStatus').textContent='Your Runner is ready.';
    $('chooseRoom').disabled=!selectedRoom();
  }catch(error){
    console.error(error);
    $('introStatus').textContent=error.message;
  }
})();
