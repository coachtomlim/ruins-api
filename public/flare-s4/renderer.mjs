import {Renderer as BaseRenderer} from '../flare-p0/src/view/renderer.mjs';

export class Renderer extends BaseRenderer{
  draw(sim,elapsed,dt,reducedMotion=false){
    const visibleTraps=sim.items.filter(item=>item.kind==='trap'&&!item.collected);
    for(const trap of visibleTraps)trap.collected=true;
    try{super.draw(sim,elapsed,dt,reducedMotion)}finally{for(const trap of visibleTraps)trap.collected=false}
    for(const trap of visibleTraps)this.marker(trap,'SPIKES','#efc76e',10);
  }
}
