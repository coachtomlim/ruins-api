import {Simulation} from '../flare-p0/src/core/simulation.mjs';
import {Renderer} from '../flare-p0/src/view/renderer.mjs';
import {decodeChallenge,builderScore} from '../flare-s2/core.mjs';
import {loadPlayableRoom,ROOMS} from '../flare-s2/stock.mjs';
import {DEFAULTS,buildDefaultChallenge,runnerSummary,inviteSender} from './flow.mjs';

const $=id=>document.getElementById(id);
let sim,renderer,playing=false,paused=false,elapsed=0,acc=0,prev=0,finishDelay=0,challenge,runner,runUrl=location.href;
function text(id,value){$(id).textContent=value}
function hud(){text('hp',sim?.hero.hp??100);text('gold',sim?.gold??0);text('time',sim?(sim.tick/60).toFixed(1):'0.0')}
function begin(){
  if(!sim||playing)return;sim.reset();sim.start();playing=true;paused=false;elapsed=acc=finishDelay=0;prev=performance.now();renderer.camera=null;renderer.overview=false;
  $('cover').hidden=true;$('afterActions').hidden=true;$('pause').disabled=false;text('pause','PAUSE');text('status','Runner is finding a legal route.');hud();
}
function result(){
  const result=sim.result(),score=builderScore(result.status,result.hp,challenge.targetHp);
  text('overline',result.status==='cleared'?'CHALLENGE COMPLETE':'RUN ENDED');text('headline',result.status==='cleared'?'Gauntlet cleared':result.status==='dead'?'Runner defeated':'Route blocked');
  text('description',`${result.status==='cleared'?`${result.hp}% health left`:`${result.reason}`} · Target ${challenge.targetHp}% · Builder score ${score}/100.`);
  $('playerSummary').hidden=true;$('playerStatsToggle').hidden=true;$('playerStats').hidden=true;$('start').hidden=true;$('cover').hidden=false;$('pause').disabled=true;$('afterActions').hidden=false;
  text('status',result.status==='cleared'?`Cleared in ${result.seconds.toFixed(1)}s with ${result.gold} gold.`:result.reason);
}
function frame(now){
  const dt=prev?Math.min(.1,(now-prev)/1000):0;prev=now;
  if(sim){
    if(playing&&!paused){elapsed+=dt;if(elapsed>=.35&&sim.status==='running'){acc+=dt;while(acc>=1/60&&sim.status==='running'){sim.step();acc-=1/60}hud()}if(sim.status!=='running'){finishDelay+=dt;if(finishDelay>.45){playing=false;result()}}}
    renderer.draw(sim,elapsed,dt,matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

$('start').addEventListener('click',begin);
$('replay').addEventListener('click',()=>{if(!sim)return;$('start').hidden=false;$('playerSummary').hidden=false;$('playerStatsToggle').hidden=false;begin()});
$('pause').addEventListener('click',()=>{if(!playing)return;paused=!paused;text('pause',paused?'RESUME':'PAUSE')});
$('overview').addEventListener('click',()=>{if(renderer)renderer.overview=!renderer.overview});
$('playerStatsToggle').addEventListener('click',()=>{const opening=$('playerStats').hidden;$('playerStats').hidden=!opening;$('playerStatsToggle').textContent=opening?'HIDE RUNNER STATS':'VIEW RUNNER STATS'});
$('shareRun').addEventListener('click',async()=>{
  const sender=inviteSender(location.search),data={title:'Run the Gauntlet',text:`${sender} built this gauntlet. Try it.`,url:runUrl};
  if(navigator.share){try{await navigator.share(data);return}catch(error){if(error?.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(runUrl);text('status','Run link copied.')}catch{text('status','Share this page URL to send the run.')}
});

(async()=>{try{
  const params=new URLSearchParams(location.search),token=(location.hash.match(/(?:^#|&)c=([^&]+)/)||[])[1],sender=inviteSender(location.search);
  const [catalog,profile]=await Promise.all([
    fetch(new URL('../flare-p0/data/catalog.json',location.href),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Catalogue unavailable');return r.json()}),
    fetch(new URL('./data/runner.json',location.href),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Runner unavailable');return r.json()})
  ]);
  runner=runnerSummary(profile,catalog);
  let loaded;
  if(token){challenge=decodeChallenge(token);if(!ROOMS[challenge.room])throw Error('Unknown room in challenge');loaded=await loadPlayableRoom(challenge.room)}
  else if(params.get('demo')==='1'){
    loaded=await loadPlayableRoom(DEFAULTS.roomId);challenge=buildDefaultChallenge({roomId:DEFAULTS.roomId,roomTitle:ROOMS[DEFAULTS.roomId].name,map:loaded.map,catalog}).challenge;
  }else throw Error('Challenge link is missing');
  sim=new Simulation(loaded.map,challenge,catalog);renderer=new Renderer($('scene'),loaded.map,loaded.atlases);renderer.zoom=1.62;
  text('sender',sender);text('playRoom',ROOMS[challenge.room].name);text('playerRunner',`Level ${runner.level} ${runner.className}`);text('playerRoom',ROOMS[challenge.room].name);text('playerDefences',`${challenge.enemies.length} guard${challenge.enemies.length===1?'':'s'}`);text('playerTarget',`${challenge.targetHp}% HP`);text('playerHp',runner.hp);text('playerAtk',runner.attack);text('playerDef',runner.defense);
  text('overline','INVITATION');text('headline',`${sender} built a gauntlet for you.`);text('description',`Your Level ${runner.level} ${runner.className} carries a ${runner.weapon}. One tap begins the challenge.`);text('status','Challenge ready.');$('start').disabled=false;hud();
}catch(error){console.error(error);text('overline','INVALID CHALLENGE');text('headline','This run cannot start');text('description',error.message);text('status','No result was simulated.')}})();
