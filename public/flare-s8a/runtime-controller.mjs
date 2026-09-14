import {loadS7PlayableRoom} from '../flare-s7/actors.mjs';
import {Simulation} from '../flare-s7/simulation.mjs';
import {Renderer} from '../flare-s7/renderer.mjs';
import {buildS7Challenge,scoreForTarget} from '../flare-s7/game.mjs';
import {loadS3ActorPack} from './actors.mjs';
import {applyCameraMode,toggleCameraMode} from './camera-controller.mjs';
import {canonicalRunInputJson} from './canonical-run-input.mjs';
import {createReplayContext,replayInputs} from './replay-context.mjs';

const $=id=>document.getElementById(id);
export function installRuntime(bridge){let sim=null,renderer=null,playing=false,paused=false,elapsed=0,acc=0,prev=0,finishDelay=0,replay=null,lastCanonical='';
  function hud(){if(!sim)return;$('heroHp').textContent=sim.hero.hp;$('heroGoldHud').textContent=sim.gold;$('runTime').textContent=(sim.tick/60).toFixed(1);}
  function cameraGeometry(){const c=renderer?.camera;return c?{scale:c.s,x:c.x,y:c.y,mode:renderer.overview?'overview':'follow'}:null;}
  function begin(){sim.reset();sim.start();playing=true;paused=false;elapsed=acc=finishDelay=0;prev=performance.now();applyCameraMode(renderer,'follow');$('cameraToggle').textContent='OVERVIEW';$('pauseToggle').textContent='PAUSE';$('pauseToggle').disabled=false;hud();}
  async function start(){const data=window.__s8aData;if(!data)return;bridge.startRuntime();try{const spec=data.specs.find(x=>x.id===bridge.roomId),stock=bridge.room,loaded=await loadS7PlayableRoom(spec.id),actors=await loadS3ActorPack();loaded.map.sprites.warrior=actors.sprites.warrior;loaded.atlases.warrior=actors.atlases.warrior;const built=buildS7Challenge({roomId:spec.id,roomTitle:spec.name,map:stock.map,catalog:data.catalog,targetHp:data.invite.targetHp,encounter:bridge.encounter,budget:data.model.budget||100});sim=new Simulation(loaded.map,built.challenge,data.catalog);renderer=new Renderer($('scene'),loaded.map,loaded.atlases);renderer.zoom=1.62;replay=createReplayContext({roomId:spec.id,encounter:bridge.encounter,runnerId:data.invite.runnerId,targetHp:data.invite.targetHp,rulesVersion:'s8a-1'});lastCanonical=canonicalRunInputJson(replay);window.__s8aRuntime={get sim(){return sim;},get renderer(){return renderer;},get replay(){return replayInputs(replay);},get canonical(){return lastCanonical;},cameraGeometry,begin};begin();}catch(error){console.error(error);playing=false;bridge.runFailed(error.message);}}
  function frame(now){const dt=prev?Math.min(.1,(now-prev)/1000):0;prev=now;if(sim&&renderer){if(playing&&!paused){elapsed+=dt;if(elapsed>=.35&&sim.status==='running'){acc+=dt;while(acc>=1/60&&sim.status==='running'){sim.step();acc-=1/60;}hud();}if(sim.status!=='running'){finishDelay+=dt;if(finishDelay>.45){playing=false;$('pauseToggle').disabled=true;const result=sim.result(),score=scoreForTarget(result.status,result.hp,window.__s8aData.invite.targetHp,result.maxHp);bridge.completeRuntime(result,score);}}}renderer.draw(sim,elapsed,dt,matchMedia('(prefers-reduced-motion: reduce)').matches);}requestAnimationFrame(frame);}
  $('cameraToggle').addEventListener('click',()=>{if(!renderer)return;const before=cameraGeometry(),state=toggleCameraMode(renderer);$('cameraToggle').textContent=state.label;requestAnimationFrame(()=>{const after=cameraGeometry();window.__s8aCameraProof={before,after};});});
  $('pauseToggle').addEventListener('click',()=>{if(!playing)return;paused=!paused;$('pauseToggle').textContent=paused?'RESUME':'PAUSE';});
  $('runAgain').addEventListener('click',()=>{if(!sim||!replay)return;bridge.replayRuntime();begin();});
  bridge.setRuntimeStart(start);requestAnimationFrame(frame);return{start,begin};
}
