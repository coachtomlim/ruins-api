import {cameraUiState} from './runtime-view.mjs';

const finite=value=>Number.isFinite(Number(value))?Number(value):0;

export function buildRuntimeHudViewModel({hp=0,maxHp=0,heroGold=0,seconds=0,cameraMode='follow',paused=false}={}){
  const max=Math.max(0,finite(maxHp)),health=Math.max(0,Math.min(max||Infinity,finite(hp))),camera=cameraUiState(cameraMode);
  return Object.freeze({
    hp:Object.freeze({label:'HP',value:health,max}),
    heroGold:Object.freeze({label:'HERO GOLD',value:Math.max(0,finite(heroGold)),note:'Gold collected by the Hero during this run.'}),
    time:Object.freeze({label:'TIME',value:Number(Math.max(0,finite(seconds)).toFixed(1)),unit:'s'}),
    cameraAction:camera.buttonLabel,
    pauseAction:paused?'RESUME':'PAUSE',
    builderRewardVisible:false
  });
}
