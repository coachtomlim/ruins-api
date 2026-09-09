/** Build-time stock art ingestion. Browsers receive only the room and compressed local atlases.
 * No engine executable, new art, generated map geometry or source campaign scripts are used.
 */
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import sharp from 'sharp';
import {parseMap,parseTiles,parseAnimation} from '../public/flare-p0/src/core/flare.mjs';
import {fixture} from '../tests/room-fixture.mjs';
const ROOT=path.resolve('public/flare-p0'),OUT=path.join(ROOT,'assets'),DATA=path.join(ROOT,'data');
const PIN='2ef474f5f5f368628bc526f9e56f936dac743e49';const RAW=`https://raw.githubusercontent.com/flareteam/flare-game/${PIN}/`;
const cache=new Map(),sources=[];sharp.concurrency(2);
await fs.mkdir(OUT,{recursive:true});await fs.mkdir(path.join(ROOT,'evidence'),{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitHash=b=>crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
async function get(rel,expected){
 if(cache.has(rel))return cache.get(rel);
 if(rel.includes('..')||!/^[-a-zA-Z0-9_/.]+$/.test(rel))throw Error('Untrusted asset path');
 const work=(async()=>{
  let response;
  for(let attempt=0;attempt<2;attempt++){
   try{response=await fetch(RAW+rel,{signal:AbortSignal.timeout(30000)});if(response.ok||response.status===404)break;}catch(e){if(attempt===1)throw e;}
  }
  if(!response?.ok)throw Error(`Stock asset ${response?.status}: ${rel}`);
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>25_000_000)throw Error('Asset size limit');
  if(expected&&gitHash(bytes)!==expected)throw Error(`Source identity mismatch: ${rel}`);
  sources.push({path:rel,bytes:bytes.length,sha256:digest(bytes),gitBlob:gitHash(bytes)});return bytes;
 })();cache.set(rel,work);return work;
}
async function parallel(list,fn,workers=3){const results=new Array(list.length);let cursor=0;await Promise.all(Array.from({length:Math.min(workers,list.length)},async()=>{while(cursor<list.length){const i=cursor++;results[i]=await fn(list[i],i);}}));return results;}
const sourceMap=await get('mods/empyrean_campaign/maps/iron_labyrinth/room1.txt','9511ff0af89049daf59b550482ab8aa711ccf298');
const map=parseMap(sourceMap.toString('utf8'));map.id='iron-labyrinth-01';assert.deepEqual(map.collision,fixture.collision,'Stock collision fixture must exactly match source');
// Preserve the original for attribution and independent verification; do not execute its events.
await fs.writeFile(path.join(DATA,'source-room1.txt'),sourceMap);
const def=await get('mods/empyrean_campaign/'+map.tileset,'cb68f184d2872df8dda7b940e8cac79059bd3a65');
const ts=parseTiles(def.toString('utf8'));
async function modImage(rel,mod='empyrean_campaign'){
 try{return await get(`mods/${mod}/${rel}`);}catch(e){if(!String(e).includes('404'))throw e;return get(`mods/fantasycore/${rel}`);}
}
async function decode(buffer){const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {data,info:{width:info.width,height:info.height,channels:info.channels}};}
const sheetBuffers={};await parallel(ts.images,async image=>{sheetBuffers[image]=await decode(await modImage(image));});
async function crop(buffer,f){return (buffer.data?sharp(buffer.data,{raw:buffer.info}):sharp(buffer)).extract({left:f.x,top:f.y,width:f.w,height:f.h}).png().toBuffer();}
/** Deterministic shelf packing. Native draw dimensions/foot anchors remain unchanged. */
async function pack(records,name){
 let x=2,y=2,rowH=0;const width=2048,composites=[],metadata={};
 for(const r of records){
  const w=Math.ceil(r.dw*.5),h=Math.ceil(r.dh*.5);if(w>width-4)throw Error('Oversize atlas frame');
  if(x+w+2>width){x=2;y+=rowH+4;rowH=0;}
  const buffer=await sharp(r.buffer).resize(w,h,{kernel:'lanczos3'}).png().toBuffer();
  composites.push({input:buffer,left:x,top:y});metadata[r.key]={x,y,w,h,dw:r.dw,dh:r.dh,ox:r.ox,oy:r.oy};x+=w+4;rowH=Math.max(rowH,h);
 }
 const height=y+rowH+2;if(height>8192)throw Error('Atlas exceeds memory cap');
 const file=await sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites).webp({quality:90,alphaQuality:100,effort:4}).toBuffer();
 const filename=`${name}-${digest(file).slice(0,12)}.webp`;await fs.writeFile(path.join(OUT,filename),file);
 console.log(`ART ${name}: ${records.length} frames, ${width}x${height}, ${file.length} bytes`);return{atlas:'assets/'+filename,frames:metadata,bytes:file.length,width,height};
}
const visible=['background','background_fringe','object','object_fringe','foreground','foreground_fringe'];
const ids=[...new Set(map.layers.filter(l=>visible.includes(l.type)).flatMap(l=>l.data).filter(Boolean))].sort((a,b)=>a-b);
const tileRecords=await parallel(ids,async id=>{const f=ts.tiles[id];if(!f)throw Error(`No stock tile ${id}`);return {key:id,buffer:await crop(sheetBuffers[f.image],f),dw:f.w,dh:f.h,ox:f.ox,oy:f.oy};});
const tileAtlas=await pack(tileRecords,'room');map.atlas=tileAtlas.atlas;map.tiles=tileAtlas.frames;
const STATES={stance:'stance',run:'run',attack:'swing',hit:'hit',die:'die'};
async function animation(rel){const bytes=await get('mods/fantasycore/'+rel);const a=parseAnimation(bytes.toString('utf8'));return{...a,buffer:await decode(await get('mods/fantasycore/'+a.image))};}
function action(spec,state){const key=state==='attack'?(spec.animations.swing?'swing':spec.animations.melee?'melee':'attack'):STATES[state];const a=spec.animations[key];if(!a)throw Error(`Required ${state} animation missing: ${spec.image}`);return a;}
function frame(a,f,d){const p=a.entries[`${f}:${d}`];if(!p)throw Error(`Missing frame ${f}:${d}`);return p;}
async function monster(name){
 const spec=await animation(`animations/enemies/${name}.txt`),records=[],animations={};
 for(const state of Object.keys(STATES)){
  const a=action(spec,state);animations[state]={frames:a.frames,duration:a.duration,type:a.type,entries:{}};
  for(let f=0;f<a.frames;f++)for(let d=0;d<8;d++){const p=frame(a,f,d);records.push({key:`${state}:${f}:${d}`,buffer:await crop(spec.buffer,p),dw:p.w,dh:p.h,ox:p.ox,oy:p.oy});}
 }
 const packed=await pack(records,name);
 for(const [state,a] of Object.entries(animations))for(let f=0;f<a.frames;f++)for(let d=0;d<8;d++)a.entries[`${f}:${d}`]=packed.frames[`${state}:${f}:${d}`];
 return{atlas:packed.atlas,animations,bytes:packed.bytes};
}
async function warrior(){
 const files={main:'longsword',feet:'chain_boots',legs:'chain_greaves',hands:'chain_gloves',chest:'chain_cuirass',off:'buckler',face:'head_short',head:'chain_coif'};
 const parts={};await parallel(Object.entries(files),async([key,file])=>{parts[key]=await animation(`animations/avatar/male/${file}.txt`);});
 const layerBytes=await get('mods/fantasycore/engine/hero_layers.txt','813d43e3cfcec8e60dd610c9cb9aaa656a0f928c');
 const order=Object.fromEntries(layerBytes.toString('utf8').split('\n').filter(l=>l.startsWith('layer=')).map(l=>{const [d,...rest]=l.slice(6).trim().split(',');return[d,rest];}));
 const directions=['SW','W','NW','N','NE','E','SE','S'];const records=[],animations={};
 for(const state of Object.keys(STATES)){
  const a=action(parts.chest,state);animations[state]={frames:a.frames,duration:a.duration,type:a.type,entries:{}};
  for(let f=0;f<a.frames;f++)for(let d=0;d<8;d++){
   const entries=order[directions[d]].flatMap(key=>key==='head'?['face','head']:[key]).map(key=>{const aa=action(parts[key],state);return{key,p:frame(aa,Math.min(f,aa.frames-1),d)};});
   const left=Math.min(...entries.map(e=>-e.p.ox)),top=Math.min(...entries.map(e=>-e.p.oy)),right=Math.max(...entries.map(e=>e.p.w-e.p.ox)),bottom=Math.max(...entries.map(e=>e.p.h-e.p.oy));
   const w=right-left,h=bottom-top,comps=[];
   for(const e of entries)comps.push({input:await crop(parts[e.key].buffer,e.p),left:-e.p.ox-left,top:-e.p.oy-top});
   const buffer=await sharp({create:{width:w,height:h,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(comps).png().toBuffer();
   records.push({key:`${state}:${f}:${d}`,buffer,dw:w,dh:h,ox:-left,oy:-top});
  }
 }
 const packed=await pack(records,'warrior');
 for(const [state,a]of Object.entries(animations))for(let f=0;f<a.frames;f++)for(let d=0;d<8;d++)a.entries[`${f}:${d}`]=packed.frames[`${state}:${f}:${d}`];
 return{atlas:packed.atlas,animations,bytes:packed.bytes};
}
map.sprites={warrior:await warrior(),goblin:await monster('goblin'),skeleton:await monster('skeleton')};
map.source={repository:'flareteam/flare-game',commit:PIN,tag:'v1.15',map:'mods/empyrean_campaign/maps/iron_labyrinth/room1.txt',mapBlob:gitHash(sourceMap),license:'CC-BY-SA-3.0',changes:'Original geometry and collision; original events omitted. Selected tiles cropped and downscaled; stock hero equipment composited. New challenge entities and rules live in separate JSON.'};
await fs.writeFile(path.join(DATA,'room.json'),JSON.stringify(map));
const readme=await get('README.md');await fs.writeFile(path.join(DATA,'FLARE-README.md'),readme);
const provenance={version:1,pin:PIN,sourceMapVerified:true,collisionFixtureVerified:true,artBytes:tileAtlas.bytes+Object.values(map.sprites).reduce((a,s)=>a+s.bytes,0),sources:sources.sort((a,b)=>a.path.localeCompare(b.path))};
await fs.writeFile(path.join(DATA,'asset-provenance.json'),JSON.stringify(provenance,null,2));
await fs.writeFile(path.join(ROOT,'evidence','asset-build.json'),JSON.stringify({sourceMapVerified:true,collisionFixtureVerified:true,artBytes:provenance.artBytes,atlasCount:4,mapCells:map.width*map.height,sourceFiles:sources.length},null,2));
console.log('ASSET_BUILD_PASS',JSON.stringify({bytes:provenance.artBytes,files:4,collision:'exact'}));
