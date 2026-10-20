// Source-locked minimal Flare map parser; do not rewrite accepted map content.
export const DAY1_HASHES=Object.freeze({
  1:'931db491d994df65b86a19fbe842c01d06c46627f82ae21a73271cd144e9f17d',
  2:'c225a37af72f08eb032f531f863146f2651ae48c194d39d0ec33f532edbba15e'
});
export function parseGateCRoom(text){
  const sections=text.split(/(?=^\[(?:header|layer|enemy|event|npc|tilesets)\]\s*$)/m);
  const header=sections.find(s=>s.startsWith('[header]'))||'';
  const property=(body,key)=>body.match(new RegExp('^'+key+'=(.*)$','m'))?.[1]??'';
  const width=Number(property(header,'width')),height=Number(property(header,'height'));
  if(width!==8||height!==8)throw new Error('UNSUPPORTED_GATE_C_GEOMETRY');
  const layers={};for(const section of sections.filter(s=>s.startsWith('[layer]'))){
    const type=property(section,'type'),data=section.split('data=\n')[1]?.split('\n\n')[0];
    if(!data)throw new Error('LAYER_DATA_MISSING');const nums=data.split(/[\s,]+/).filter(Boolean).map(Number);
    if(nums.length!==64||nums.some(n=>!Number.isInteger(n)))throw new Error('INVALID_GATE_C_LAYER');
    layers[type]=nums;
  }
  if(!layers.collision||!layers.background||!layers.object)throw new Error('REQUIRED_LAYERS_MISSING');
  const events=sections.filter(s=>s.startsWith('[event]')).map(s=>({location:property(s,'location'),tooltip:property(s,'tooltip'),setStatus:property(s,'set_status'),requiresStatus:property(s,'requires_status'),intermap:property(s,'intermap'),loot:property(s,'loot')}));
  const enemies=sections.filter(s=>s.startsWith('[enemy]')).map(s=>({location:property(s,'location'),category:property(s,'category'),level:Number(property(s,'level'))}));
  return Object.freeze({width,height,title:property(header,'title'),collision:layers.collision,background:layers.background,object:layers.object,events,enemies});
}
export async function loadAuthoredDay1Rooms({fetcher=fetch,cryptoImpl=globalThis.crypto}={}){
  const rooms={};for(const day of [1,2]){
    const url=new URL(`./authority/gate_c_room_0${day}.txt`,import.meta.url);
    const response=await fetcher(url,{cache:'no-store'});if(!response.ok)throw new Error('GATE_C_SOURCE_NOT_AVAILABLE');
    const text=await response.text();
    if(cryptoImpl?.subtle){
      const sum=await cryptoImpl.subtle.digest('SHA-256',new TextEncoder().encode(text));
      const actual=Array.from(new Uint8Array(sum),b=>b.toString(16).padStart(2,'0')).join('');
      if(actual!==DAY1_HASHES[day])throw new Error('GATE_C_SOURCE_HASH_MISMATCH');
    }else throw new Error('SOURCE_HASH_CHECK_UNAVAILABLE');
    rooms[day]=parseGateCRoom(text);
  }
  const r1=rooms[1],r2=rooms[2];
  if(!r1.events.some(x=>x.setStatus==='gate_c_discovery')||!r1.events.some(x=>x.requiresStatus==='gate_c_discovery'&&x.intermap==='maps/gate_c_room_02.txt,1,4')||
    !r2.enemies.some(x=>x.category==='zombie'&&x.location==='4,4,1,1')||!r2.events.some(x=>x.setStatus==='gate_c_r2_reward'&&x.loot==='loot/chest_level_1.txt'))throw new Error('GATE_C_DAY1_SOURCE_SEMANTICS_CHANGED');
  return Object.freeze(rooms);
}