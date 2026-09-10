import {parseAnimation} from '../flare-p0/src/core/flare.mjs';
import {loadActorPack as loadS2ActorPack,loadStockRoom} from '../flare-s2/stock.mjs';

const PIN='2ef474f5f5f368628bc526f9e56f936dac743e49';
const RAW=`https://raw.githubusercontent.com/flareteam/flare-game/${PIN}/mods/fantasycore/`;
const HERO_LAYERS=['default_legs','default_feet','default_chest','default_hands','head_short','club'];
const textCache=new Map(),imageCache=new Map();let heroPromise=null,packPromise=null;

async function sourceText(url){if(!textCache.has(url))textCache.set(url,fetch(url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(`Flare source ${r.status}`);return r.text()}));return textCache.get(url)}
async function sourceImage(url){if(!imageCache.has(url))imageCache.set(url,new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>reject(Error(`Flare image failed: ${url}`));im.src=url}));return imageCache.get(url)}
async function loadLayer(name){const parsed=parseAnimation(await sourceText(`${RAW}animations/avatar/male/${name}.txt`));return{parsed,image:await sourceImage(`${RAW}${parsed.image}`)}}

function stateSource(name){return name==='attack'?'swing':name}
function frameMeta(layers,state,frame,dir){
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity,found=false;
  for(const layer of layers){const a=layer.parsed.animations[stateSource(state)];const f=a?.entries[`${frame}:${dir}`];if(!f)continue;found=true;left=Math.min(left,-f.ox);top=Math.min(top,-f.oy);right=Math.max(right,f.w-f.ox);bottom=Math.max(bottom,f.h-f.oy)}
  if(!found)return null;return{left,top,right,bottom,w:Math.ceil(right-left),h:Math.ceil(bottom-top)};
}

async function buildHero(){
  const layers=await Promise.all(HERO_LAYERS.map(loadLayer)),states=['stance','run','attack','hit','die'],records=[];
  for(const state of states){const src=layers[0].parsed.animations[stateSource(state)]||layers[0].parsed.animations.stance;for(let frame=0;frame<src.frames;frame++)for(let dir=0;dir<8;dir++){const m=frameMeta(layers,state,frame,dir);if(m)records.push({state,frame,dir,m})}}
  const atlasWidth=2048,pad=2;let x=pad,y=pad,rowH=0;
  for(const r of records){if(x+r.m.w+pad>atlasWidth){x=pad;y+=rowH+pad;rowH=0}r.x=x;r.y=y;x+=r.m.w+pad;rowH=Math.max(rowH,r.m.h)}
  const atlas=document.createElement('canvas');atlas.width=atlasWidth;atlas.height=y+rowH+pad;const g=atlas.getContext('2d');
  const animations={};
  for(const state of states){const source=layers[0].parsed.animations[stateSource(state)]||layers[0].parsed.animations.stance;animations[state]={frames:source.frames,duration:source.duration,type:source.type,entries:{}}}
  for(const r of records){
    for(const layer of layers){const a=layer.parsed.animations[stateSource(r.state)]||layer.parsed.animations.stance,f=a?.entries[`${Math.min(r.frame,a.frames-1)}:${r.dir}`];if(!f)continue;const dx=r.x+(-f.ox-r.m.left),dy=r.y+(-f.oy-r.m.top);g.drawImage(layer.image,f.x,f.y,f.w,f.h,dx,dy,f.w,f.h)}
    animations[r.state].entries[`${r.frame}:${r.dir}`]={x:r.x,y:r.y,w:r.m.w,h:r.m.h,ox:-r.m.left,oy:-r.m.top,dw:r.m.w,dh:r.m.h};
  }
  return{spec:{animations},atlas};
}

export async function loadS3ActorPack(){
  if(!packPromise)packPromise=(async()=>{const [hero,s2]=await Promise.all([heroPromise||(heroPromise=buildHero()),loadS2ActorPack()]);return{sprites:{warrior:hero.spec,goblin:s2.sprites.goblin,skeleton:s2.sprites.skeleton},atlases:{warrior:hero.atlas,goblin:s2.atlases.goblin,skeleton:s2.atlases.skeleton}}})();
  return packPromise;
}

export async function loadS3PlayableRoom(id){const [{map,tiles,spec},actors]=await Promise.all([loadStockRoom(id),loadS3ActorPack()]);map.sprites=actors.sprites;return{map,atlases:{tiles,...actors.atlases},spec}}
