import {Simulation} from './core/simulation.mjs';
import {Renderer} from './view/renderer.mjs';
import {RULES_VERSION} from './core/challenge.mjs';
const el=id=>document.getElementById(id);
let sim,renderer,loaded=false,playing=false,paused=false,accumulator=0,elapsed=0,previous=0,finishedAt=0;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
async function json(path){const r=await fetch(new URL(path,import.meta.url),{cache:'no-cache'});if(!r.ok)throw Error(`Could not load ${path} (${r.status})`);return r.json();}
async function image(path){const im=new Image();im.decoding='async';im.src=new URL('../'+path,import.meta.url).href;await Promise.race([im.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error(`Image timed out: ${path}`)),15000))]);return im;}
function text(id,s){el(id).textContent=s;}
function hud(){
 text('hp',`${sim.hero.hp} / ${sim.hero.maxHp}`);el('healthfill').style.width=`${sim.hero.hp/sim.hero.maxHp*100}%`;
 text('gold',sim.gold);text('kills',`${sim.enemies.filter(e=>e.hp<=0).length} / ${sim.enemies.length}`);text('time',`${(sim.tick/60).toFixed(1)}s`);
 text('phase',paused?'PAUSED':sim.status==='ready'?'OVERVIEW':sim.status==='running'?sim.phase.toUpperCase():sim.status.toUpperCase());
}
function result(){
 const r=sim.result();text('overline',r.status==='cleared'?'CHALLENGE COMPLETE':'RUN ENDED');
 text('headline',r.status==='cleared'?'Room cleared':r.status==='dead'?'Warrior defeated':'Route blocked');
 text('description',r.status==='cleared'?`${r.hp}% health remaining · ${r.gold} gold · ${r.seconds.toFixed(1)} seconds. These results came from the combat rules.`:r.reason);
 text('start','RUN AGAIN');text('hint','Same challenge. Same rules. Reproducible result.');el('cover').hidden=false;el('pause').disabled=true;
 text('status',r.status==='cleared'?'Both enemies cleared. Warrior reached the exit.':r.reason);el('start').focus({preventScroll:true});
}
function frame(now){
 const dt=previous?Math.min(.1,(now-previous)/1000):0;previous=now;
 if(loaded){
  if(playing&&!paused){elapsed+=dt;
   if(elapsed>=.65&&sim.status==='running'){accumulator+=dt;while(accumulator>=1/60&&sim.status==='running'){sim.step();accumulator-=1/60;}hud();}
   if(sim.status!=='running'){finishedAt+=dt;if(finishedAt>.75){playing=false;result();}}
  }
  renderer.draw(sim,elapsed,dt,motion.matches);
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
el('start').addEventListener('click',()=>{
 if(!loaded){location.reload();return;}if(playing)return;
 sim.reset();sim.start();playing=true;paused=false;elapsed=0;finishedAt=0;accumulator=0;previous=performance.now();renderer.camera=null;renderer.overview=false;
 el('mapview').setAttribute('aria-pressed','false');el('cover').hidden=true;el('pause').disabled=false;text('pause','Pause');text('status','Warrior is finding a legal route through the room.');hud();
});
el('pause').addEventListener('click',()=>{if(!playing)return;paused=!paused;text('pause',paused?'Resume':'Pause');hud();});
el('mapview').addEventListener('click',()=>{if(!renderer)return;renderer.overview=!renderer.overview;el('mapview').setAttribute('aria-pressed',String(renderer.overview));});
el('zoomin').addEventListener('click',()=>{if(renderer)renderer.zoom=Math.min(1.8,renderer.zoom*1.15);});
el('zoomout').addEventListener('click',()=>{if(renderer)renderer.zoom=Math.max(.7,renderer.zoom/1.15);});
for(const [id,key] of [['path','showPath'],['collision','showCollision']])el(id).addEventListener('click',()=>{if(!renderer)return;renderer[key]=!renderer[key];el(id).setAttribute('aria-pressed',String(renderer[key]));});
new ResizeObserver(()=>renderer?.resize()).observe(el('stage'));
document.addEventListener('visibilitychange',()=>{previous=0;if(document.hidden&&playing){paused=true;text('pause','Resume');hud();}});
(async()=>{try{
 const [map,challenge,catalog]=await Promise.all([json('../data/room.json'),json('../data/challenge.json'),json('../data/catalog.json')]);
 sim=new Simulation(map,challenge,catalog);
 const atlases={tiles:await image(map.atlas)};
 await Promise.all(Object.entries(map.sprites).map(async([id,s])=>{atlases[id]=await image(s.atlas);}));
 renderer=new Renderer(el('scene'),map,atlases);loaded=true;
 text('overline','ONE ROOM. ONE RUN.');text('headline','Find your way through');text('description','A warrior. Two sentries. One potion. The warrior must go around the walls, win both fights and reach the exit.');
 text('start','START');el('start').disabled=false;text('status','Ready. Tap Start for an automatic run.');hud();
 if(new URLSearchParams(location.search).has('debug'))Object.defineProperty(window,'__flare',{value:Object.freeze({
  version:RULES_VERSION,snapshot:()=>structuredClone({...sim.result(),hero:sim.hero,path:sim.path,metrics:sim.metrics,enemies:sim.enemies,items:sim.items,camera:renderer.camera,viewport:{width:renderer.W,height:renderer.H}}),events:()=>structuredClone(sim.events)
 })});
}catch(error){console.error(error);text('overline','NOT READY');text('headline','The room could not load');text('description',error.message);text('start','RETRY');el('start').disabled=false;text('hint','No result has been simulated.');text('status','Loading failed. Tap Retry.');}})();
