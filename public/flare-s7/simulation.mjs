import {Simulation as BaseSimulation} from '../flare-p0/src/core/simulation.mjs';
import {gridPath} from '../flare-s2/core.mjs';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export class Simulation extends BaseSimulation{
  reset(){super.reset();this.hero.attackBonus=0;this.hero.defenseBonus=0;for(const item of this.items)item.triggered=false;const route=gridPath(this.map,this.challenge.spawn,this.challenge.exit)||[],rank=new Map(route.map((p,i)=>[p.join(','),i]));this.routeEntities=[...this.challenge.enemies.map(x=>({kind:'enemy',id:x.id,rank:rank.get(x.at.join(','))??Infinity})),...this.challenge.items.map(x=>({kind:'item',id:x.id,rank:rank.get(x.at.join(','))??Infinity}))].sort((a,b)=>a.rank-b.rank||a.id.localeCompare(b.id))}
  defeatBy(item,reason){this.hero.state='die';this.hero.stateTick=this.tick;this.hero.attack=null;this.finish('dead',reason);this.emit('death',{actor:'hero',source:item.id,x:this.hero.x,y:this.hero.y})}
  collect(item){
    if(item.collected||distance(this.hero,item)>.49||this.status!=='running')return;
    item.collected=true;item.triggered=true;
    if(item.kind==='trap'){
      const damage=item.armorPiercing?item.damage:Math.max(1,item.damage-(this.hero.armor||0));this.hero.hp=Math.max(0,this.hero.hp-damage);
      this.emit('trap',{actor:'hero',item:item.id,value:damage,armorPiercing:Boolean(item.armorPiercing),x:item.x,y:item.y});this.emit('damage',{actor:item.id,target:'hero',value:damage,x:this.hero.x,y:this.hero.y});
      if(this.hero.hp<=0)this.defeatBy(item,`The runner was defeated by the ${item.name}.`);return;
    }
    if(item.kind==='heal'){const actual=Math.min(item.heal,this.hero.maxHp-this.hero.hp);this.hero.hp+=actual;this.emit('pickup',{actor:'hero',item:item.id,kind:'heal',value:actual,x:item.x,y:item.y});return}
    if(item.kind==='buff-attack'){this.hero.damage+=item.attack;this.hero.attackBonus+=item.attack;this.emit('pickup',{actor:'hero',item:item.id,kind:'attack',value:item.attack,x:item.x,y:item.y});return}
    if(item.kind==='buff-defense'){this.hero.armor+=item.defense;this.hero.defenseBonus+=item.defense;this.emit('pickup',{actor:'hero',item:item.id,kind:'defense',value:item.defense,x:item.x,y:item.y})}
  }
  activateRouteItems(){for(const item of this.items)this.collect(item)}
  choose(){
    if(this.pendingLoot){super.choose();return}
    const next=this.routeEntities.find(entry=>entry.kind==='enemy'?this.enemies.some(x=>x.id===entry.id&&x.hp>0):this.items.some(x=>x.id===entry.id&&!x.collected));
    if(!next){super.choose();return}
    const occupied=this.occupied(),goal=next.kind==='enemy'?this.enemies.find(x=>x.id===next.id):this.items.find(x=>x.id===next.id);
    const path=next.kind==='enemy'?this.nav.approach(this.hero,goal,this.hero.range,occupied):this.nav.path(this.hero,goal,occupied);
    if(!path){this.finish('blocked',`No legal route to ${goal.id}.`);return}
    this.goal=goal;this.path=path;this.metrics.pathPlans++;this.emit('path',{goal:goal.id,points:path.map(p=>({...p}))});
  }
  move(){super.move();if(this.status==='running')this.activateRouteItems()}
  step(){
    const eventAt=this.events.length;super.step();
    for(const event of this.events.slice(eventAt))if(event.type==='damage'&&event.target!=='hero'){const target=this.enemies.find(x=>x.id===event.target);if(target?.hp>0&&target.state!=='attack')this.state(target,'hit')}
  }
}
