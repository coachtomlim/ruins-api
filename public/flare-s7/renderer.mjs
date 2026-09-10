import {Renderer as BaseRenderer} from '../flare-p0/src/view/renderer.mjs';

const presentation=Object.freeze({
  'small-potion':{label:'+10 HP',color:'#df8999'},'battle-tonic':{label:'+2 ATK',color:'#efc76e'},'iron-tonic':{label:'+2 DEF',color:'#8fd4c6'},
  'spike-trap':{label:'SPIKES',color:'#efc76e'},'dart-trap':{label:'DARTS',color:'#e79a75'}
});
export class Renderer extends BaseRenderer{
  draw(sim,elapsed,dt,reducedMotion=false){
    const visible=sim.items.filter(item=>!item.collected);for(const item of visible)item.collected=true;
    try{super.draw(sim,elapsed,dt,reducedMotion)}finally{for(const item of visible)item.collected=false}
    for(const item of visible){const p=presentation[item.type]||{label:item.name,color:'#df8999'};this.marker(item,p.label,p.color,item.kind==='trap'?10:9)}
  }
}
