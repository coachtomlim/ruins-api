import {parseMap,parseTiles} from '../flare-p0/src/core/flare.mjs';
import {drawPreview} from '../flare-s2/stock.mjs';

export const FLARE_115_PIN='2ef474f5f5f368628bc526f9e56f936dac743e49';
const RAW=`https://raw.githubusercontent.com/flareteam/flare-game/${FLARE_115_PIN}/`;
export const S7_ROOMS=Object.freeze({
  'iron-labyrinth-01':Object.freeze({id:'iron-labyrinth-01',name:'Pillar Court',tier:1,source:'mods/empyrean_campaign/maps/iron_labyrinth/room1.txt',local:'data/rooms/room1.txt'}),
  'iron-labyrinth-03':Object.freeze({id:'iron-labyrinth-03',name:'Crossed Court',tier:1,source:'mods/empyrean_campaign/maps/iron_labyrinth/room3.txt',local:'data/rooms/room3.txt'}),
  'iron-labyrinth-07':Object.freeze({id:'iron-labyrinth-07',name:'Broken Gallery',tier:1,source:'mods/empyrean_campaign/maps/iron_labyrinth/room7.txt',local:'data/rooms/room7.txt'}),
  'iron-labyrinth-08':Object.freeze({id:'iron-labyrinth-08',name:'Scattered Hall',tier:1,source:'mods/empyrean_campaign/maps/iron_labyrinth/room8.txt',local:'data/rooms/room8.txt'}),
  'iron-labyrinth-15':Object.freeze({id:'iron-labyrinth-15',name:'Vaulted Crossing',tier:2,source:'mods/empyrean_campaign/maps/iron_labyrinth/room15.txt',local:'data/rooms/room15.txt'}),
  'iron-labyrinth-18':Object.freeze({id:'iron-labyrinth-18',name:'Twin Lanes',tier:2,source:'mods/empyrean_campaign/maps/iron_labyrinth/room18.txt',local:'data/rooms/room18.txt'})
});
const visible=new Set(['background','background_fringe','object','object_fringe','foreground','foreground_fringe']);
const textCache=new Map(),imageCache=new Map(),roomCache=new Map();
async function sourceText(url){if(!textCache.has(url))textCache.set(url,fetch(url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(`S7 room source ${r.status}`);return r.text()}));return textCache.get(url)}
async function sourceImage(url){if(!imageCache.has(url))imageCache.set(url,new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>reject(Error(`Flare image failed: ${url}`));im.src=url}));return imageCache.get(url)}
async function modImage(rel){for(const mod of ['empyrean_campaign','fantasycore'])try{return await sourceImage(`${RAW}mods/${mod}/${rel}`)}catch{}throw Error(`Missing Flare image: ${rel}`)}
async function tileAtlas(map){
  const ts=parseTiles(await sourceText(`${RAW}mods/empyrean_campaign/${map.tileset}`));
  const ids=[...new Set(map.layers.filter(l=>visible.has(l.type)).flatMap(l=>l.data).filter(Boolean))].sort((a,b)=>a-b);
  const used=[...new Set(ids.map(id=>{const f=ts.tiles[id];if(!f)throw Error(`No tile ${id}`);return f.image}))];
  const sources=Object.fromEntries(await Promise.all(used.map(async rel=>[rel,await modImage(rel)])));
  const width=2048,scale=.5,frames={};let x=2,y=2,rowH=0;
  for(const id of ids){const f=ts.tiles[id],w=Math.max(1,Math.ceil(f.w*scale)),h=Math.max(1,Math.ceil(f.h*scale));if(x+w+2>width){x=2;y+=rowH+4;rowH=0}frames[id]={x,y,w,h,dw:f.w,dh:f.h,ox:f.ox,oy:f.oy,image:f.image};x+=w+4;rowH=Math.max(rowH,h)}
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=y+rowH+2;const g=canvas.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  for(const id of ids){const f=ts.tiles[id],p=frames[id];g.drawImage(sources[f.image],f.x,f.y,f.w,f.h,p.x,p.y,p.w,p.h)}
  return{canvas,frames};
}
export async function loadS7StockRoom(id){
  const spec=S7_ROOMS[id];if(!spec)throw Error('Unknown S7 room');
  if(!roomCache.has(id))roomCache.set(id,(async()=>{const map=parseMap(await sourceText(new URL(spec.local,import.meta.url)));map.id=id;map.name=spec.name;const packed=await tileAtlas(map);map.tiles=packed.frames;return{map,tiles:packed.canvas,spec}})());
  return roomCache.get(id);
}
export {drawPreview};
