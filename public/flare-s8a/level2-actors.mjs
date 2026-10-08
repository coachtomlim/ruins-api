import {parseAnimation} from '../flare-p0/src/core/flare.mjs';
import {FLARE_115_PIN} from '../flare-s7/rooms.mjs';
import {requireS7AnimationStates} from '../flare-s7/actors.mjs';
import {LEVEL2_MONSTER_IDS,LEVEL2_MONSTER_MODEL} from './level2-content.mjs';

// Real Flare stock actors for the Level 2 monsters, loaded from the same pinned Flare source the
// existing S7 actors (goblin-elite, antlion) use. Returned in the {sprites,atlases} shape that
// loadS7PlayableRoom produces so the runtime can merge them straight in.
const RAW=`https://raw.githubusercontent.com/flareteam/flare-game/${FLARE_115_PIN}/`;
const texts=new Map(),images=new Map();let packPromise=null;
async function text(url){if(!texts.has(url))texts.set(url,fetch(url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(`Level 2 actor source ${r.status}`);return r.text()}));return texts.get(url)}
function image(url){if(!images.has(url))images.set(url,new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>reject(Error(`Level 2 actor image failed: ${url}`));im.src=url}));return images.get(url)}
async function actor(id){
  const parsed=parseAnimation(await text(`${RAW}${LEVEL2_MONSTER_MODEL[id].animation}`));
  return{spec:requireS7AnimationStates(parsed,id),atlas:await image(`${RAW}mods/fantasycore/${parsed.image}`)};
}
export function loadLevel2ActorPack(){
  if(!packPromise)packPromise=Promise.all(LEVEL2_MONSTER_IDS.map(actor)).then(loaded=>({
    sprites:Object.fromEntries(LEVEL2_MONSTER_IDS.map((id,i)=>[id,loaded[i].spec])),
    atlases:Object.fromEntries(LEVEL2_MONSTER_IDS.map((id,i)=>[id,loaded[i].atlas]))
  }));
  return packPromise;
}
