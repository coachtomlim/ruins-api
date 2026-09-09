import {Navigation} from './navigation.mjs';
import {validateChallenge,RULES_VERSION} from './challenge.mjs';
export const TICKS_PER_SECOND=60;
export const TERMINAL=new Set(['cleared','dead','blocked','timeout']);
const centre=at=>({x:at[0]+.5,y:at[1]+.5});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ticks=s=>Math.max(1,Math.round(s*TICKS_PER_SECOND));
const direction=(a,b)=>((Math.round(Math.atan2(b.y-a.y,b.x-a.x)/(Math.PI/4))+6)%8+8)%8;
/** Pure fixed-tick simulation. No DOM, renderer, network, wall clock, RNG or model calls. */
export class Simulation{
 constructor(map,challenge,catalog){
  this.map=map;this.challenge=structuredClone(challenge);this.catalog=structuredClone(catalog);
  this.budget=validateChallenge(challenge,map,catalog);this.nav=new Navigation(map);this.reset();
 }
 reset(){
  this.tick=0;this.status='ready';this.reason='';this.gold=0;this.events=[];this.path=[];this.goal=null;this.pendingLoot=null;this.phase='ready';
  this.metrics={pathPlans:0,movementSteps:0,blockedMoves:0,attacks:0};
  const hero=this.catalog.heroes[this.challenge.hero];
  this.hero={id:'hero',...structuredClone(hero),...centre(this.challenge.spawn),hp:hero.maxHp,dir:4,state:'stance',stateTick:0,cooldown:0,attack:null};
  this.enemies=this.challenge.enemies.map(e=>{const s=this.catalog.enemies[e.type];return{id:e.id,type:e.type,...structuredClone(s),...centre(e.at),hp:s.maxHp,dir:0,state:'stance',stateTick:0,cooldown:0,attack:null}});
  this.items=this.challenge.items.map(i=>({id:i.id,...structuredClone(this.catalog.items[i.type]),type:i.type,...centre(i.at),collected:false}));
  this.loot=[];this.exit=centre(this.challenge.exit);
 }
 start(){if(this.status==='ready'){this.status='running';this.emit('start',{});}}
 emit(type,data){this.events.push({tick:this.tick,type,...data});}
 state(actor,name){if(actor.state!==name){actor.state=name;actor.stateTick=this.tick;}}
 finish(status,reason){this.status=status;this.reason=reason;this.phase=status;this.path=[];this.emit(status,{reason});}
 occupied(){return new Set(this.enemies.filter(e=>e.hp>0).map(e=>this.nav.id(e)));}
 inRange(a,b){return distance(a,b)<=a.range+1e-8 && this.nav.segment(a,b,.01);}
 choose(){
  const occupied=this.occupied();let path=null,goal=null;
  if(this.pendingLoot){goal=this.loot.find(l=>l.id===this.pendingLoot&&!l.collected);if(!goal)this.pendingLoot=null;}
  if(!goal&&this.hero.hp<this.hero.maxHp){
   // Explicit, deterministic policy: a useful nearby potion before another encounter.
   const potions=this.items.filter(i=>!i.collected&&i.kind==='heal'&&this.hero.maxHp-this.hero.hp>=Math.min(i.heal,10));
   goal=potions.find(i=>distance(this.hero,i)<=6)||null;
  }
  if(!goal){
   const enemies=this.enemies.filter(e=>e.hp>0);let best=Infinity;
   for(const enemy of enemies){
    const candidate=this.nav.approach(this.hero,enemy,this.hero.range,occupied);
    if(candidate){let len=0,p=this.hero;for(const q of candidate){len+=distance(p,q);p=q;}if(len<best){best=len;path=candidate;goal=enemy;}}
   }
   if(enemies.length&&!goal){this.finish('blocked','No legal route to a remaining enemy.');return;}
  }
  if(!goal)goal={id:'exit',...this.exit};
  if(!path)path=this.nav.path(this.hero,goal,occupied);
  if(!path){this.finish('blocked',`No legal route to ${goal.id}.`);return;}
  this.goal=goal;this.path=path;this.metrics.pathPlans++;this.emit('path',{goal:goal.id,points:path.map(p=>({...p}))});
 }
 beginAttack(a,target){
  if(a.attack||a.cooldown>0||!this.inRange(a,target)||target.hp<=0)return;
  a.dir=direction(a,target);a.cooldown=ticks(a.interval);a.attack={target:target.id,hitAt:this.tick+ticks(a.windup),endAt:this.tick+ticks(a.animationTime||.4),dealt:false};
  a.state='attack';a.stateTick=this.tick;this.metrics.attacks++;this.emit('attack',{actor:a.id,target:target.id});
 }
 move(){
  this.phase='moving';this.state(this.hero,'run');let remaining=this.hero.speed/TICKS_PER_SECOND;
  while(remaining>1e-10&&this.path.length){
   const p=this.path[0],d=distance(this.hero,p);
   if(d<1e-9){this.path.shift();continue;}
   const step=Math.min(remaining,d),next={x:this.hero.x+(p.x-this.hero.x)*step/d,y:this.hero.y+(p.y-this.hero.y)*step/d};
   const collision=!this.nav.segment(this.hero,next,this.hero.radius)||this.enemies.some(e=>e.hp>0&&distance(next,e)<this.hero.radius+e.radius);
   if(collision){this.metrics.blockedMoves++;this.finish('blocked','Movement was blocked. No wall crossing was permitted.');return;}
   this.hero.dir=direction(this.hero,p);this.hero.x=next.x;this.hero.y=next.y;this.metrics.movementSteps++;remaining-=step;
   if(step>=d-1e-9)this.path.shift();
  }
 }
 resolveGoal(){
  if(!this.goal)return;
  const goal=this.goal;
  if(Object.hasOwn(goal,'hp')){this.phase='combat';this.state(this.hero,'stance');this.beginAttack(this.hero,goal);return;}
  this.state(this.hero,'stance');
  if(goal.id==='exit'){
   if(this.enemies.every(e=>e.hp<=0)&&this.loot.every(l=>l.collected)&&distance(this.hero,this.exit)<.1)this.finish('cleared',`${this.enemies.length} enemies defeated. Exit reached.`);
   else this.finish('blocked','Exit conditions not satisfied.');return;
  }
  if(!goal.collected){
   goal.collected=true;
   if(goal.kind==='gold'){this.gold+=goal.amount;this.emit('pickup',{actor:'hero',item:goal.id,kind:'gold',value:goal.amount,x:goal.x,y:goal.y});this.pendingLoot=null;}
   if(goal.kind==='heal'){const actual=Math.min(goal.heal,this.hero.maxHp-this.hero.hp);this.hero.hp+=actual;this.emit('pickup',{actor:'hero',item:goal.id,kind:'heal',value:actual,x:goal.x,y:goal.y});}
  }
  this.goal=null;this.path=[];
 }
 step(){
  if(this.status!=='running')return;this.tick++;
  if(this.tick>60*TICKS_PER_SECOND){this.finish('timeout','Challenge exceeded its time limit.');return;}
  const actors=[this.hero,...this.enemies];
  for(const a of actors){if(a.cooldown>0)a.cooldown--;if(a.attack&&this.tick>=a.attack.endAt){a.attack=null;if(a.hp>0)this.state(a,'stance');}}
  if(!this.hero.attack){if(!this.goal)this.choose();if(this.status!=='running')return;if(this.path.length)this.move();if(this.status==='running'&&!this.path.length)this.resolveGoal();}
  if(this.status!=='running')return;
  for(const enemy of this.enemies)if(enemy.hp>0){this.beginAttack(enemy,this.hero);}
  // Resolve all impacts for this tick before deaths. Simultaneous impacts have no array-order advantage.
  const impacts=[];
  for(const a of actors)if(a.hp>0&&a.attack&&!a.attack.dealt&&this.tick>=a.attack.hitAt){
   a.attack.dealt=true;const target=actors.find(b=>b.id===a.attack.target);
   if(target&&target.hp>0&&this.inRange(a,target))impacts.push({a,target,damage:Math.max(1,a.damage-(target.armor||0))});
  }
  for(const {a,target,damage} of impacts){target.hp=Math.max(0,target.hp-damage);this.emit('damage',{actor:a.id,target:target.id,value:damage,x:target.x,y:target.y});}
  for(const enemy of this.enemies)if(enemy.hp<=0&&enemy.state!=='die'){
   enemy.state='die';enemy.stateTick=this.tick;enemy.attack=null;
   const drop={id:`loot-${enemy.id}`,kind:'gold',amount:enemy.gold,x:enemy.x,y:enemy.y,collected:false};this.loot.push(drop);this.pendingLoot=drop.id;
   this.emit('death',{actor:enemy.id,x:enemy.x,y:enemy.y});this.emit('drop',{item:drop.id,value:drop.amount,x:drop.x,y:drop.y});
   if(this.goal?.id===enemy.id){this.goal=null;this.path=[];}
  }
  if(this.hero.hp<=0){this.hero.state='die';this.hero.stateTick=this.tick;this.hero.attack=null;this.finish('dead','The warrior was defeated.');}
 }
 result(){return {rules:RULES_VERSION,challenge:this.challenge.id,status:this.status,ticks:this.tick,seconds:Number((this.tick/TICKS_PER_SECOND).toFixed(2)),hp:this.hero.hp,maxHp:this.hero.maxHp,gold:this.gold,kills:this.enemies.filter(e=>e.hp<=0).length,totalEnemies:this.enemies.length,spent:this.budget.spent,reason:this.reason};}
}
