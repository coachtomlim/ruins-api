import {parseMap,parseTiles,parseAnimation} from '../flare-p0/src/core/flare.mjs';

export const PIN='2ef474f5f5f368628bc526f9e56f936dac743e49';
const RAW=`https://raw.githubusercontent.com/flareteam/flare-game/${PIN}/`;
export const ROOMS={
  'iron-labyrinth-01':{id:'iron-labyrinth-01',name:'Pillar Court',tier:1,source:'mods/empyrean_campaign/maps/iron_labyrinth/room1.txt'},
  'iron-labyrinth-07':{id:'iron-labyrinth-07',name:'Broken Gallery',tier:1,source:'mods/empyrean_campaign/maps/iron_labyrinth/room7.txt'},
  'iron-labyrinth-15':{id:'iron-labyrinth-15',name:'Vaulted Crossing',tier:2,source:'mods/empyrean_campaign/maps/iron_labyrinth/room15.txt'}
};
const textCache=new Map(),imageCache=new Map(),roomCache=new Map(),spriteCache={promise:null};
async function text(url){if(!textCache.has(url))textCache.set(url,fetch(url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(`Source ${r.status}`);return r.text();}));return textCache.get(url);}
async function image(url){if(!imageCache.has(url))imageCache.set(url,new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>reject(Error(`Image failed: ${url}`));im.src=url;}));return imageCache.get(url);}
async function modImage(rel){for(const mod of ['empyrean_campaign','fantasycore']){try{return await image(`${RAW}mods/${mod}/${rel}`);}catch{}}throw Error(`Missing Flare image: ${rel}`);}
const visible=new Set(['background','background_fringe','object','object_fringe','foreground','foreground_fringe']);
async function tileAtlas(map){
  const def=await text(`${RAW}mods/empyrean_campaign/${map.tileset}`),ts=parseTiles(def);
  const ids=[...new Set(map.layers.filter(l=>visible.has(l.type)).flatMap(l=>l.data).filter(Boolean))].sort((a,b)=>a-b);
  const usedImages=[...new Set(ids.map(id=>{const f=ts.tiles[id];if(!f)throw Error(`No tile ${id}`);return f.image;}))];
  const sources=Object.fromEntries(await Promise.all(usedImages.map(async rel=>[rel,await modImage(rel)])));
  const width=2048,scale=.5,frames={};let x=2,y=2,rowH=0;
  for(const id of ids){const f=ts.tiles[id],w=Math.max(1,Math.ceil(f.w*scale)),h=Math.max(1,Math.ceil(f.h*scale));if(x+w+2>width){x=2;y+=rowH+4;rowH=0;}frames[id]={x,y,w,h,dw:f.w,dh:f.h,ox:f.ox,oy:f.oy,image:f.image};x+=w+4;rowH=Math.max(rowH,h);}
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=y+rowH+2;const g=canvas.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  for(const id of ids){const f=ts.tiles[id],p=frames[id];g.drawImage(sources[f.image],f.x,f.y,f.w,f.h,p.x,p.y,p.w,p.h);}
  return{canvas,frames};
}
export async function loadStockRoom(id){
  if(!ROOMS[id])throw Error('Unknown room');
  if(!roomCache.has(id))roomCache.set(id,(async()=>{const spec=ROOMS[id],map=parseMap(await text(RAW+spec.source));map.id=id;map.name=spec.name;const packed=await tileAtlas(map);map.tiles=packed.frames;return{map,tiles:packed.canvas,spec};})());
  return roomCache.get(id);
}
function normalizeAnimations(parsed){
  for(const a of Object.values(parsed.animations))for(const f of Object.values(a.entries)){f.dw=f.w;f.dh=f.h;}
  const stance=parsed.animations.stance;
  if(stance){for(const key of ['run','attack','hit','die'])if(!parsed.animations[key])parsed.animations[key]=stance;}
  return parsed;
}
async function stockSprite(configPath){
  const parsed=normalizeAnimations(parseAnimation(await text(`${RAW}mods/fantasycore/${configPath}`)));
  const atlas=await image(`${RAW}mods/fantasycore/${parsed.image}`);
  return{spec:{animations:parsed.animations},atlas};
}
export async function loadActorPack(){
  if(!spriteCache.promise)spriteCache.promise=(async()=>{
    const [hero,goblin,skeleton]=await Promise.all([
      stockSprite('animations/npcs/knight.txt'),
      stockSprite('animations/enemies/goblin.txt'),
      stockSprite('animations/enemies/skeleton.txt')
    ]);
    return{sprites:{warrior:hero.spec,goblin:goblin.spec,skeleton:skeleton.spec},atlases:{warrior:hero.atlas,goblin:goblin.atlas,skeleton:skeleton.atlas}};
  })();
  return spriteCache.promise;
}
export async function loadPlayableRoom(id){const [{map,tiles,spec},actors]=await Promise.all([loadStockRoom(id),loadActorPack()]);map.sprites=actors.sprites;return{map,atlases:{tiles,...actors.atlases},spec};}

export function drawPreview(canvas,map,atlas){
  const rect=canvas.getBoundingClientRect(),W=Math.max(180,rect.width||320),H=Math.max(120,rect.height||200),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);const g=canvas.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#160d20';g.fillRect(0,0,W,H);
  const iso=(x,y)=>({x:(x-y)*map.tileWidth/2,y:(x+y)*map.tileHeight/2}),items=[];let order=0;
  for(const layer of map.layers)if(visible.has(layer.type))for(let i=0;i<layer.data.length;i++){const id=layer.data[i];if(!id)continue;const t=map.tiles[id],p=iso(i%map.width+.5,Math.floor(i/map.width)+.5);items.push({t,p,layer:layer.type,depth:p.y,order:order++});}
  const rank=t=>t.startsWith('background')?0:t.startsWith('object')?1:2;items.sort((a,b)=>rank(a.layer)-rank(b.layer)||(rank(a.layer)===1?a.depth-b.depth:0)||a.order-b.order);
  const left=Math.min(...items.map(q=>q.p.x-q.t.ox)),right=Math.max(...items.map(q=>q.p.x-q.t.ox+q.t.dw)),top=Math.min(...items.map(q=>q.p.y-q.t.oy)),bottom=Math.max(...items.map(q=>q.p.y-q.t.oy+q.t.dh)),s=Math.min((W-8)/(right-left),(H-8)/(bottom-top)),ox=W/2-(left+right)/2*s,oy=H/2-(top+bottom)/2*s;
  for(const q of items){const t=q.t;g.drawImage(atlas,t.x,t.y,t.w,t.h,ox+(q.p.x-t.ox)*s,oy+(q.p.y-t.oy)*s,t.dw*s,t.dh*s);}
}
