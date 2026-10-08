import {FLARE_115_PIN} from '../flare-s7/rooms.mjs';

// Governed Flare art for the Builder unlock surfaces (reward journey + editor cards). Every frame is a
// rectangle of the stock Flare spritesheet at the same pinned Flare commit the rest of the runtime
// uses (FLARE_115_PIN) — real in-world art, not emoji. Monster frames are each actor's first stance
// frame facing the camera; trap/support frames are the approved 002E9 review selections.
const ROOT=`https://raw.githubusercontent.com/flareteam/flare-game/${FLARE_115_PIN}/mods/fantasycore/images/`;
const art=(name,path,x,y,w,h)=>Object.freeze({name,src:ROOT+path,frame:Object.freeze({x,y,w,h})});

export const FLARE_ART=Object.freeze({
  goblin:art('Goblin','enemies/goblin.png',142,977,111,96),
  skeleton:art('Skeleton','enemies/skeleton.png',805,367,162,170),
  zombie:art('Zombie','enemies/zombie.png',1955,519,77,166),
  'skeleton-archer':art('Skeleton Archer','enemies/skeleton_archer.png',662,171,148,190),
  'spike-trap':art('Spike Trap','powers/spikes.png',0,0,156,292),
  // Quick Dungeon's Dart Trap has no standalone Flare art; the governed Flare arrow projectile stands in.
  'dart-trap':art('Dart Trap','powers/arrows.png',97,119,96,50),
  'small-potion':art('Health Potion','loot/hp_potion.png',71,275,28,30)
});

// Category art for the stable MONSTERS / TRAPS / SUPPORT / DUNGEONS shell. DUNGEONS is a real Flare
// room preview drawn by the caller, so it has no spritesheet entry.
export const CATEGORY_ART=Object.freeze({monsters:'goblin',traps:'spike-trap',supports:'small-potion',dungeons:null});

const images=new Map();
export function loadFlareImage(src){
  if(!images.has(src))images.set(src,new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>reject(Error(`Flare art failed: ${src}`));im.src=src}));
  return images.get(src);
}

// Draws one governed frame, scaled to fit and centred, onto a transparent canvas.
export async function drawFlareArt(canvas,key,{width=144,height=112,pad=6}={}){
  const spec=FLARE_ART[key];if(!spec)throw new Error(`Unknown Flare art: ${key}`);
  canvas.width=width;canvas.height=height;
  const g=canvas.getContext('2d');g.clearRect(0,0,width,height);
  try{
    const im=await loadFlareImage(spec.src),f=spec.frame,scale=Math.min((width-pad*2)/f.w,(height-pad*2)/f.h),dw=f.w*scale,dh=f.h*scale;
    g.clearRect(0,0,width,height);g.drawImage(im,f.x,f.y,f.w,f.h,(width-dw)/2,(height-dh)/2,dw,dh);return true;
  }catch(error){
    console.error(error);
    g.fillStyle='#2a1631';g.fillRect(0,0,width,height);g.fillStyle='#f2c45d';g.font='700 13px system-ui';g.textAlign='center';g.fillText(spec.name,width/2,height/2);return false;
  }
}

export function flareArtCanvas(key,{width=144,height=112,className='flare-art',label}={}){
  const canvas=document.createElement('canvas');canvas.className=className;canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label',label||`${FLARE_ART[key]?.name||key} — Flare art`);
  void drawFlareArt(canvas,key,{width,height});
  return canvas;
}

// Same isometric room composition as flare-s2/stock.mjs drawPreview (identical tile ordering and
// centring) but on a TRANSPARENT canvas, so the actual Flare room floats directly on its panel with
// no extra background box behind it (approved V7 DUNGEONS presentation).
const ROOM_LAYERS=new Set(['background','background_fringe','object','object_fringe','foreground','foreground_fringe']);
export function drawRoomPreviewTransparent(canvas,map,atlas){
  const rect=canvas.getBoundingClientRect(),W=Math.max(120,rect.width||260),H=Math.max(80,rect.height||140),dpr=Math.min(globalThis.devicePixelRatio||1,2);
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
  const g=canvas.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  const iso=(x,y)=>({x:(x-y)*map.tileWidth/2,y:(x+y)*map.tileHeight/2}),items=[];let order=0;
  for(const layer of map.layers)if(ROOM_LAYERS.has(layer.type))for(let i=0;i<layer.data.length;i++){const id=layer.data[i];if(!id)continue;const t=map.tiles[id],p=iso(i%map.width+.5,Math.floor(i/map.width)+.5);items.push({t,p,layer:layer.type,depth:p.y,order:order++});}
  const rank=t=>t.startsWith('background')?0:t.startsWith('object')?1:2;
  items.sort((a,b)=>rank(a.layer)-rank(b.layer)||(rank(a.layer)===1?a.depth-b.depth:0)||a.order-b.order);
  const left=Math.min(...items.map(q=>q.p.x-q.t.ox)),right=Math.max(...items.map(q=>q.p.x-q.t.ox+q.t.dw)),top=Math.min(...items.map(q=>q.p.y-q.t.oy)),bottom=Math.max(...items.map(q=>q.p.y-q.t.oy+q.t.dh)),s=Math.min((W-8)/(right-left),(H-8)/(bottom-top)),ox=W/2-(left+right)/2*s,oy=H/2-(top+bottom)/2*s;
  for(const q of items){const t=q.t;g.drawImage(atlas,t.x,t.y,t.w,t.h,ox+(q.p.x-t.ox)*s,oy+(q.p.y-t.oy)*s,t.dw*s,t.dh*s);}
}
