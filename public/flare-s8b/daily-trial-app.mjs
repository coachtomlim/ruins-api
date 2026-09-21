import {loadS7StockRoom,S7_ROOMS} from '../flare-s7/rooms.mjs';
import {loadS7PlayableRoom} from '../flare-s7/actors.mjs';
import {Simulation} from '../flare-s7/simulation.mjs';
import {Renderer} from '../flare-s7/renderer.mjs';
import {applyRunnerModel,buildS7Challenge} from '../flare-s7/game.mjs';
import {createBrowserAccountAdapter} from './supabase-browser.mjs';
import {applyDailyTrialRunnerToCatalog} from './daily-trial-runner-catalog.mjs';
import {
  DAILY_TRIAL_BUDGET,normalizeDailyTrialRun,normalizeDailyTrialStatus,dailyTrialErrorMessage
} from './daily-trial.mjs';

const TRIAL_TARGET_HP=60;
const CLAIM_POLL_MS=1000;
const CLAIM_POLL_LIMIT=90;

const $=id=>document.getElementById(id);
let adapter=null,run=null,sim=null,renderer=null,playing=false,paused=false,elapsed=0,acc=0,prev=0,finishDelay=0,claimed=false,claiming=false;

function mode(name){$('dtApp').dataset.mode=name}
function say(text){$('dtStatus').textContent=text}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function showClaimed(balance){
  claimed=true;
  playing=false;
  mode('claimed');
  $('dtTitle').textContent='Daily Trial claimed';
  $('claim').hidden=true;
  $('dtClaimed').hidden=false;
  $('dtBalance').textContent=balance==null?'—':String(balance);
  say('Come back tomorrow for the next Trial.');
}

function hud(){if(!sim)return;$('hp').textContent=sim.hero.hp;$('time').textContent=(sim.tick/60).toFixed(1)}

function begin(){
  sim.reset();sim.start();
  playing=true;paused=false;elapsed=acc=finishDelay=0;prev=performance.now();
  renderer.camera=null;renderer.overview=false;
  $('dtCover').hidden=true;
  $('pause').disabled=false;$('pause').textContent='PAUSE';
  say('Your Runner is running the Trial automatically.');
  hud();
}

async function waitForClaimable(){
  for(let attempt=0;attempt<CLAIM_POLL_LIMIT&&!claimed;attempt++){
    let ready=false;
    try{
      const status=normalizeDailyTrialStatus(await adapter.loadDailyTrialStatus());
      if(status.runId===run.id){
        if(status.state==='CLAIMED'){showClaimed(null);await refreshBalance();return}
        ready=status.state==='CLAIMABLE';
      }else{
        ready=Date.now()>=Date.parse(run.settleAfter);
      }
    }catch(error){
      say(dailyTrialErrorMessage(error).message);
    }
    if(ready){
      $('claim').textContent=`CLAIM ${run.rewardGold} GOLD`;
      $('claim').hidden=false;$('claim').disabled=false;
      say(`Trial complete. ${run.rewardGold} Gold is ready.`);
      return;
    }
    say('Trial complete. Waiting for the server to confirm your run…');
    await sleep(CLAIM_POLL_MS);
  }
  if(!claimed)say('Still waiting for the server. Reload to check again.');
}

async function refreshBalance(){
  try{const account=await adapter.loadAccountState();showClaimed(account.goldBalance)}catch{}
}

function finishRun(){
  const result=sim.result();
  $('dtResultLabel').textContent=result.status==='cleared'?'TRIAL COMPLETE':'TRIAL RUN ENDED';
  $('dtResultText').textContent=`${run.roomName} · ${result.seconds.toFixed(1)}s`;
  $('dtCover').hidden=false;
  $('pause').disabled=true;
  void waitForClaimable();
}

function frame(now){
  const dt=prev?Math.min(.1,(now-prev)/1000):0;prev=now;
  if(sim){
    if(playing&&!paused){
      elapsed+=dt;
      if(elapsed>=.35&&sim.status==='running'){
        acc+=dt;
        while(acc>=1/60&&sim.status==='running'){sim.step();acc-=1/60}
        hud();
      }
      if(sim.status!=='running'){finishDelay+=dt;if(finishDelay>.45){playing=false;finishRun()}}
    }
    renderer.draw(sim,elapsed,dt,matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  requestAnimationFrame(frame);
}

async function claim(){
  if(claiming||claimed||!run)return;
  claiming=true;
  const button=$('claim');
  button.disabled=true;button.textContent='CLAIMING…';
  say('Claiming your server-authoritative reward…');
  try{
    const settlement=await adapter.settleDailyTrial(run.id);
    showClaimed(settlement.balance);
  }catch(error){
    const feedback=dailyTrialErrorMessage(error);
    say(feedback.message);
    button.textContent=`CLAIM ${run.rewardGold} GOLD`;
    if(feedback.kind==='wait'){button.hidden=true;claiming=false;void waitForClaimable();return}
    button.disabled=false;
  }
  claiming=false;
}

async function fetchJson(path,label){
  const response=await fetch(new URL(path,import.meta.url),{cache:'no-cache'});
  if(!response.ok)throw new Error(`${label} unavailable`);
  return response.json();
}

async function presentRun(){
  const [base,model]=await Promise.all([
    fetchJson('../flare-p0/data/catalog.json','Catalogue'),
    fetchJson('../flare-s7/data/game.json','S7 game model')
  ]);
  const legacy=applyRunnerModel(base,model,model.defaultRunner);
  const catalog=applyDailyTrialRunnerToCatalog(legacy,run);
  const spec=S7_ROOMS[run.roomId];
  if(!spec||spec.name!==run.roomName)throw new Error('INVALID_DAILY_TRIAL_RUN_ROOM_UNSUPPORTED');
  const stock=await loadS7StockRoom(run.roomId);
  const built=buildS7Challenge({
    roomId:run.roomId,roomTitle:run.roomName,map:stock.map,catalog,
    targetHp:TRIAL_TARGET_HP,encounter:structuredClone(run.encounter),budget:100
  });
  if(built.spent!==DAILY_TRIAL_BUDGET)throw new Error('INVALID_DAILY_TRIAL_RUN_BUDGET_UNSUPPORTED');
  const loaded=await loadS7PlayableRoom(run.roomId);
  sim=new Simulation(loaded.map,built.challenge,catalog);
  renderer=new Renderer($('scene'),loaded.map,loaded.atlases);
  renderer.zoom=1.62;
  new ResizeObserver(()=>{if(renderer)renderer.resize()}).observe($('scene'));
  mode('running');
  begin();
}

async function boot(){
  adapter=createBrowserAccountAdapter();
  const session=await adapter.getSession();
  if(!session?.user){mode('failed');say('Sign in from your Hub to continue.');return}
  let runId=new URLSearchParams(location.search).get('run');
  if(!runId){
    const status=normalizeDailyTrialStatus(await adapter.loadDailyTrialStatus());
    if(!status.runId){mode('failed');say('No Daily Trial in progress. Start one from your Hub.');return}
    runId=status.runId;
  }
  run=normalizeDailyTrialRun(await adapter.loadDailyTrialRun(runId));
  $('dtRoom').textContent=run.roomName;
  $('dtRunner').textContent=`${run.runner.hp} HP · ${run.runner.attack} ATK · ${run.runner.defense} DEF`;
  $('dtReward').textContent=`${run.rewardGold} GOLD`;
  if(run.settledAt){
    mode('claimed');
    await refreshBalance();
    if(!claimed)showClaimed(null);
    return;
  }
  await presentRun();
}

$('claim').addEventListener('click',claim);
$('pause').addEventListener('click',()=>{if(!playing)return;paused=!paused;$('pause').textContent=paused?'RESUME':'PAUSE'});
$('overview').addEventListener('click',()=>{if(renderer)renderer.overview=!renderer.overview});
requestAnimationFrame(frame);

try{await boot()}catch(error){
  console.error(error);
  mode('failed');
  say(dailyTrialErrorMessage(error).message);
}
