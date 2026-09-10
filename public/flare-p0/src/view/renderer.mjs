import {frameIndex} from '../core/flare.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const iso=(x,y,map)=>({x:(x-y)*map.tileWidth/2,y:(x+y)*map.tileHeight/2});
/** Camera and art are presentation only. Changing zoom or frame rate cannot change the result. */
export class Renderer {
 constructor(canvas,map,atlases){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.map=map;this.atlases=atlases;
  this.zoom=1;this.showPath=false;this.showCollision=false;this.overview=false;this.camera=null;this.W=0;this.H=0;
  this.floor=[];this.objects=[];this.foreground=[];
  let index=0;
  for(const layer of map.layers){
   const bucket=['background','background_fringe'].includes(layer.type)?this.floor:['object','object_fringe'].includes(layer.type)?this.objects:['foreground','foreground_fringe'].includes(layer.type)?this.foreground:null;
   if(!bucket)continue;
   for(let i=0;i<layer.data.length;i++)if(layer.data[i]){
    const t=map.tiles[layer.data[i]];if(!t)throw Error(`Missing tile ${layer.data[i]}`);
    const p=iso(i%map.width+.5,Math.floor(i/map.width)+.5,map);bucket.push({kind:'tile',t,p,depth:p.y,order:index++});
   }
  }
  this.objects.sort((a,b)=>a.depth-b.depth||a.order-b.order);
  const all=[...this.floor,...this.objects,...this.foreground];
  this.bounds={left:Math.min(...all.map(q=>q.p.x-q.t.ox)),right:Math.max(...all.map(q=>q.p.x-q.t.ox+q.t.dw)),top:Math.min(...all.map(q=>q.p.y-q.t.oy)),bottom:Math.max(...all.map(q=>q.p.y-q.t.oy+q.t.dh))};
  this.resize();
 }
 resize(){
  const rect=this.canvas.getBoundingClientRect();this.W=rect.width;this.H=rect.height;
  const dpr=Math.min(globalThis.devicePixelRatio||1,2);this.canvas.width=Math.round(this.W*dpr);this.canvas.height=Math.round(this.H*dpr);
  this.ctx.setTransform(dpr,0,0,dpr,0,0);this.ctx.imageSmoothingEnabled=true;this.ctx.imageSmoothingQuality='high';
  const b=this.bounds,s=Math.min((this.W-20)/(b.right-b.left),(this.H-24)/(b.bottom-b.top));
  this.full={s,x:this.W/2-(b.left+b.right)/2*s,y:this.H/2-(b.top+b.bottom)/2*s};this.camera=null;
 }
 screen(x,y){const p=iso(x,y,this.map),v=this.camera||this.full;return{x:p.x*v.s+v.x,y:p.y*v.s+v.y};}
 setCamera(sim,elapsed,dt,reducedMotion){
  const full=this.full,p=iso(sim.hero.x,sim.hero.y,this.map);
  const s=clamp(this.W/1200,.30,.42)*this.zoom;
  const gameplay={s,x:this.W*.50-p.x*s,y:this.H*.57-p.y*s};
  let t=sim.status==='ready'||this.overview?0:clamp(elapsed/.65,0,1);if(reducedMotion&&t>0)t=1;
  t=t*t*(3-2*t);const desired={s:full.s+(gameplay.s-full.s)*t,x:full.x+(gameplay.x-full.x)*t,y:full.y+(gameplay.y-full.y)*t};
  if(!this.camera||sim.status==='ready'||reducedMotion)this.camera=desired;
  else{const follow=1-Math.exp(-14*Math.min(dt,.1));for(const k of ['s','x','y'])this.camera[k]+=(desired[k]-this.camera[k])*follow;}
 }
 tile(q,hero){
  const g=this.ctx,v=this.camera,t=q.t,x=v.x+(q.p.x-t.ox)*v.s,y=v.y+(q.p.y-t.oy)*v.s,w=t.dw*v.s,h=t.dh*v.s;
  if(x+w<0||y+h<0||x>this.W||y>this.H)return;
  const occludes=hero&&q.depth>hero.depth&&hero.p.x>x&&hero.p.x<x+w&&hero.p.y-14>y&&hero.p.y-14<y+h&&t.dh>130;
  g.globalAlpha=occludes?.45:1;g.drawImage(this.atlases.tiles,t.x,t.y,t.w,t.h,x,y,w,h);g.globalAlpha=1;
 }
 animation(actor,sim){const spec=this.map.sprites[actor.sprite],a=spec.animations[actor.state]||spec.animations.stance;const f=frameIndex(a,(sim.tick-actor.stateTick)/60);return a.entries[`${f}:${actor.dir}`]||a.entries[`${f}:0`];}
 actor(actor,sim){
  const g=this.ctx,v=this.camera,p=this.screen(actor.x,actor.y),f=this.animation(actor,sim);if(!f)return;
  const k=v.s*(actor.sprite==='goblin'?.90:1),dead=actor.hp<=0,dw=f.dw??f.w,dh=f.dh??f.h;
  if(!dead){g.fillStyle=actor.id==='hero'?'rgba(87,195,197,.22)':'rgba(0,0,0,.4)';g.beginPath();g.ellipse(p.x,p.y,Math.max(7,36*k),Math.max(3,16*k),0,0,Math.PI*2);g.fill();}
  g.globalAlpha=dead?.62:1;g.drawImage(this.atlases[actor.sprite],f.x,f.y,f.w,f.h,p.x-f.ox*k,p.y-f.oy*k,dw*k,dh*k);g.globalAlpha=1;
 }
 diamond(x,y,fill,stroke){const g=this.ctx,p=this.screen(x+.5,y+.5),w=this.map.tileWidth*this.camera.s/2,h=this.map.tileHeight*this.camera.s/2;g.beginPath();g.moveTo(p.x,p.y-h);g.lineTo(p.x+w,p.y);g.lineTo(p.x,p.y+h);g.lineTo(p.x-w,p.y);g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=.7;g.stroke();}}
 marker(p,label,color,size=9){const g=this.ctx,q=this.screen(p.x,p.y);g.fillStyle='rgba(5,10,13,.85)';g.strokeStyle=color;g.lineWidth=1.5;g.beginPath();g.ellipse(q.x,q.y,size,size*.52,0,0,Math.PI*2);g.fill();g.stroke();g.font='600 11px system-ui';g.textAlign='center';g.fillStyle=color;g.fillText(label,q.x,q.y-12);}
 draw(sim,elapsed,dt,reducedMotion=false){
  this.setCamera(sim,elapsed,dt,reducedMotion);const g=this.ctx;g.fillStyle='#080c0e';g.fillRect(0,0,this.W,this.H);
  for(const q of this.floor)this.tile(q);
  if(this.showCollision)for(let y=0;y<this.map.height;y++)for(let x=0;x<this.map.width;x++){const c=this.map.collision[y*this.map.width+x];this.diamond(x,y,[1,2,3,4].includes(c)?'rgba(242,84,94,.28)':'rgba(111,213,190,.10)','rgba(255,255,255,.18)');}
  if(this.showPath&&sim.path.length){g.strokeStyle='#e2d196';g.lineWidth=2;g.setLineDash([4,5]);g.beginPath();const h=this.screen(sim.hero.x,sim.hero.y);g.moveTo(h.x,h.y);for(const q of sim.path){const p=this.screen(q.x,q.y);g.lineTo(p.x,p.y);}g.stroke();g.setLineDash([]);}
  const exitOpen=sim.enemies.every(e=>e.hp<=0)&&sim.loot.every(l=>l.collected);this.marker(sim.exit,exitOpen?'EXIT OPEN':'EXIT',exitOpen?'#88dab8':'#8a989c',18);
  for(const i of sim.items)if(!i.collected)this.marker(i,'+10 HP','#df8999',9);for(const l of sim.loot)if(!l.collected)this.marker(l,`+${l.amount}`,'#ecd599',8);
  const hero={p:this.screen(sim.hero.x,sim.hero.y),depth:iso(sim.hero.x,sim.hero.y,this.map).y};
  const list=[...this.objects,...[sim.hero,...sim.enemies].map((a,i)=>({kind:'actor',a,depth:iso(a.x,a.y,this.map).y,order:100000+i}))].sort((a,b)=>a.depth-b.depth||a.order-b.order);
  for(const q of list)if(q.kind==='tile')this.tile(q,hero);else this.actor(q.a,sim);for(const q of this.foreground)this.tile(q,hero);
  for(const a of [sim.hero,...sim.enemies])if(a.hp>0){const p=this.screen(a.x,a.y),f=this.animation(a,sim),height=(f?.oy||150)*this.camera.s,w=a.id==='hero'?42:34,y=p.y-height-9;g.fillStyle='rgba(3,7,8,.85)';g.fillRect(p.x-w/2-1,y-1,w+2,6);g.fillStyle=a.id==='hero'?'#92d5c3':'#cf7772';g.fillRect(p.x-w/2,y,w*a.hp/a.maxHp,4);}
  for(let i=sim.events.length-1;i>=0;i--){const e=sim.events[i],age=(sim.tick-e.tick)/60;if(age>.7)break;if(!['damage','pickup'].includes(e.type))continue;const p=this.screen(e.x,e.y);g.globalAlpha=1-age/.7;g.font='700 14px system-ui';g.textAlign='center';g.fillStyle=e.type==='damage'?'#ffcfb5':e.kind==='gold'?'#f5d998':'#a4e0c7';g.strokeStyle='#101419';g.lineWidth=3;const text=(e.type==='damage'?'-':'+')+e.value;g.strokeText(text,p.x+18,p.y-30-age*26);g.fillText(text,p.x+18,p.y-30-age*26);g.globalAlpha=1;}
 }
}
