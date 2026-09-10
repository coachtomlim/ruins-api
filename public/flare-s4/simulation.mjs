import {Simulation as BaseSimulation} from '../flare-p0/src/core/simulation.mjs';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export class Simulation extends BaseSimulation{
  reset(){
    super.reset();
    for(const item of this.items)if(item.kind==='trap')item.triggered=false;
  }
  triggerTraps(){
    if(this.status!=='running'||this.hero.hp<=0)return;
    for(const trap of this.items){
      if(trap.kind!=='trap'||trap.collected||trap.triggered)continue;
      if(distance(this.hero,trap)>.46)continue;
      trap.triggered=true;trap.collected=true;
      const damage=Math.max(1,(trap.damage||1)-(this.hero.armor||0));
      this.hero.hp=Math.max(0,this.hero.hp-damage);
      this.emit('trap',{actor:'hero',item:trap.id,value:damage,x:trap.x,y:trap.y});
      this.emit('damage',{actor:trap.id,target:'hero',value:damage,x:this.hero.x,y:this.hero.y});
      if(this.hero.hp<=0){this.hero.state='die';this.hero.stateTick=this.tick;this.hero.attack=null;this.finish('dead','The runner was defeated by a trap.');return;}
    }
  }
  move(){super.move();this.triggerTraps();}
}
