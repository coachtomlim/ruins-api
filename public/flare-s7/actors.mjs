import {parseAnimation} from '../flare-p0/src/core/flare.mjs';
import {loadS3ActorPack} from '../flare-s3/actors.mjs';
import {FLARE_115_PIN,loadS7StockRoom} from './rooms.mjs';

const RAW=`https://raw.githubusercontent.com/flareteam/flare-game/${FLARE_115_PIN}/mods/fantasycore/`;
export const S7_ACTORS=Object.freeze({
  'goblin-elite':Object.freeze({source:'animations/enemies/goblin_elite.txt',role:'Premium Striker'}),
  antlion:Object.freeze({source:'animations/enemies/antlion.txt',role:'Durable Tank'})
});
const textCache=new Map(),imageCache=new Map();let packPromise=null;
async function sourceText(url){if(!textCache.has(url))textCache.set(url,fetch(url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(`S7 actor source ${r.status}`);return r.text()}));return textCache.get(url)}
async function sourceImage(url){if(!imageCache.has(url))imageCache.set(url,new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>reject(Error(`S7 actor image failed: ${url}`));im.src=url}));return imageCache.get(url)}
export function requireS7AnimationStates(parsed,id='actor'){
  for(const state of ['stance','run','swing','hit','die'])if(!parsed?.animations?.[state])throw Error(`${id} is missing real ${state} animation`);
  for(const a of Object.values(parsed.animations))for(const f of Object.values(a.entries)){f.dw=f.w;f.dh=f.h}
  return{animations:{...parsed.animations,attack:parsed.animations.swing}};
}
async function stockActor(id){const spec=S7_ACTORS[id],parsed=parseAnimation(await sourceText(RAW+spec.source));return{spec:requireS7AnimationStates(parsed,id),atlas:await sourceImage(RAW+parsed.image)}}
export async function loadS7ActorPack(){if(!packPromise)packPromise=(async()=>{const [base,elite,antlion]=await Promise.all([loadS3ActorPack(),stockActor('goblin-elite'),stockActor('antlion')]);return{sprites:{...base.sprites,'goblin-elite':elite.spec,antlion:antlion.spec},atlases:{...base.atlases,'goblin-elite':elite.atlas,antlion:antlion.atlas}}})();return packPromise}
export async function loadS7PlayableRoom(id){const [{map,tiles,spec},actors]=await Promise.all([loadS7StockRoom(id),loadS7ActorPack()]);map.sprites=actors.sprites;return{map,atlases:{tiles,...actors.atlases},spec}}
