const asset=relative=>new URL(`./audio/${relative}`,import.meta.url).href;

export const AUDIO_PENDING_LICENSE='AUDIO_PENDING_LICENSE';
export const AUDIO_PREFERENCE_KEY='flareAudioEnabledV1';
export const SFX_LIBRARY=Object.freeze({
  PLAYER_MELEE:AUDIO_PENDING_LICENSE,MELEE_IMPACT:asset('sfx/combat/block.ogg'),BLOCK:asset('sfx/combat/block.ogg'),
  PLAYER_HIT:asset('sfx/player/male_hit.ogg'),PLAYER_DIE:asset('sfx/player/male_die.ogg'),
  ARROW_FIRE:asset('sfx/combat/shoot.ogg'),ARROW_IMPACT:asset('sfx/combat/arrow_wall.ogg'),
  GOBLIN_HIT:asset('sfx/enemies/goblin_hit.ogg'),GOBLIN_DIE:asset('sfx/enemies/goblin_die.ogg'),
  SKELETON_HIT:asset('sfx/enemies/skeleton_hit.ogg'),SKELETON_DIE:asset('sfx/enemies/skeleton_die.ogg'),
  ZOMBIE_HIT:asset('sfx/enemies/zombie_hit.ogg'),ZOMBIE_DIE:asset('sfx/enemies/zombie_die.ogg'),
  ANTLION_HIT:asset('sfx/enemies/antlion_hit.ogg'),ANTLION_DIE:asset('sfx/enemies/antlion_die.ogg'),
  SPIKE_TRAP_TRIGGER:AUDIO_PENDING_LICENSE,FALLING_ROCKS:AUDIO_PENDING_LICENSE,
  LOOT_DROP:asset('sfx/loot/flying_loot.ogg'),GOLD_PICKUP:asset('sfx/loot/inventory_coins.ogg'),
  ITEM_PICKUP:asset('sfx/loot/inventory_object.ogg'),POTION_PICKUP:asset('sfx/loot/inventory_potion.ogg'),
  DOOR_OPEN:asset('sfx/interaction/door_open.ogg'),SECRET_OPEN:AUDIO_PENDING_LICENSE,
  LEVEL_UP:asset('sfx/loot/level_up.ogg')
});
export const MUSIC_LIBRARY=Object.freeze({EXPLORE:asset('music/dungeon_theme.ogg'),COMBAT:asset('music/battle_theme.ogg'),TENSION:asset('music/unrest_theme.ogg'),SAFE:asset('music/safe_room_theme.ogg'),BOSS:asset('music/boss_theme.ogg')});
export const AMBIENCE_LIBRARY=Object.freeze({RUINS_DROPLETS:AUDIO_PENDING_LICENSE,CAVE_WIND:AUDIO_PENDING_LICENSE,WIND:AUDIO_PENDING_LICENSE,FIRE:AUDIO_PENDING_LICENSE,RAIN:AUDIO_PENDING_LICENSE});
const COOLDOWN_MS=Object.freeze({PLAYER_HIT:140,MELEE_IMPACT:100,BLOCK:100,ARROW_FIRE:100,ARROW_IMPACT:100,GOBLIN_HIT:100,SKELETON_HIT:100,ZOMBIE_HIT:100,ANTLION_HIT:100,GOLD_PICKUP:80});

function safeStorage(storage,key,fallback=true){try{const value=storage?.getItem(key);return value==null?fallback:value!=='false';}catch{return fallback;}}
function safePlay(node){try{const result=node?.play?.();if(result?.catch)result.catch(()=>{});return result;}catch{return null;}}
function safePause(node){try{node?.pause?.();}catch{}}

export function createAudioManager({AudioCtor=globalThis.Audio,storage=globalThis.localStorage,preferenceKey=AUDIO_PREFERENCE_KEY,now=()=>Date.now(),fadeMs=450}={}){
  let enabled=safeStorage(storage,preferenceKey,true),unlocked=false,musicState=null,ambienceState=null,music=null,ambience=null,fadeToken=0;
  const lastPlayed=new Map(),listeners=new Set(),trace=[];
  const record=(type,detail={})=>{const entry=Object.freeze({type,at:now(),...detail});trace.push(entry);if(trace.length>160)trace.shift();for(const fn of listeners)try{fn(entry);}catch{}return entry;};
  const make=(src,{loop=false,volume=1,preload='metadata'}={})=>{if(!AudioCtor||!src||src===AUDIO_PENDING_LICENSE)return null;try{const node=new AudioCtor(src);node.loop=loop;node.volume=volume;node.preload=preload;return node;}catch(error){record('failure',{message:String(error?.message||error)});return null;}};
  const silence=node=>{if(node){node.volume=0;safePause(node);}};
  function fadeOut(node,token){if(!node)return;const start=Math.max(0,Number(node.volume)||0),began=now();const step=()=>{if(token!==fadeToken)return;const p=Math.min(1,(now()-began)/Math.max(1,fadeMs));node.volume=start*(1-p);if(p<1)setTimeout(step,32);else safePause(node);};step();}
  function transition(kind,state,library,volume){
    if(state!=null&&!Object.hasOwn(library,state))return record('unknown-state',{kind,state});
    if(state!=null&&library[state]===AUDIO_PENDING_LICENSE){if(kind==='music')musicState=state;else ambienceState=state;return record('pending-license',{kind,state});}
    const current=kind==='music'?music:ambience,previousState=kind==='music'?musicState:ambienceState;
    if(state===previousState&&current){if(enabled&&unlocked&&current.paused)safePlay(current);return record('state-retained',{kind,state});}
    fadeToken++;const token=fadeToken;if(current)fadeOut(current,token);
    const next=state==null?null:make(library[state],{loop:true,volume});
    if(kind==='music'){music=next;musicState=state;}else{ambience=next;ambienceState=state;}
    if(next&&enabled&&unlocked)safePlay(next);
    return record('state',{kind,state,previousState});
  }
  function playSfx(event){
    const src=SFX_LIBRARY[event];if(!src)return record('unknown-sfx',{event});
    if(src===AUDIO_PENDING_LICENSE)return record('pending-license',{kind:'sfx',event});
    const stamp=now(),wait=COOLDOWN_MS[event]||0;if(stamp-(lastPlayed.get(event)||-Infinity)<wait)return record('debounced',{event});lastPlayed.set(event,stamp);
    if(!enabled||!unlocked)return record('suppressed',{event,reason:enabled?'locked':'disabled'});
    const node=make(src,{volume:.72,preload:'auto'});if(node)safePlay(node);return record('sfx',{event});
  }
  function unlock(){unlocked=true;record('unlocked');if(enabled){if(music)safePlay(music);if(ambience)safePlay(ambience);}return true;}
  function setEnabled(next){enabled=Boolean(next);try{storage?.setItem(preferenceKey,String(enabled));}catch{}if(!enabled){silence(music);silence(ambience);}else if(unlocked){if(music){music.volume=.28;safePlay(music);}if(ambience){ambience.volume=.12;safePlay(ambience);}}record('enabled',{enabled});return enabled;}
  return Object.freeze({
    playSfx,setMusicState:state=>transition('music',state,MUSIC_LIBRARY,.28),setAmbience:state=>transition('ambience',state,AMBIENCE_LIBRARY,.12),
    stopMusic:()=>transition('music',null,MUSIC_LIBRARY,.28),stopAmbience:()=>transition('ambience',null,AMBIENCE_LIBRARY,.12),unlock,setEnabled,toggle:()=>setEnabled(!enabled),
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    get enabled(){return enabled;},get unlocked(){return unlocked;},get musicState(){return musicState;},get ambienceState(){return ambienceState;},get trace(){return Object.freeze([...trace]);}
  });
}

const ENEMY_AUDIO=Object.freeze({'goblin':'GOBLIN','goblin-elite':'GOBLIN','skeleton':'SKELETON','skeleton-archer':'SKELETON','zombie':'ZOMBIE','antlion':'ANTLION'});
export function dispatchSimulationAudio(audio,sim,event){
  if(!audio||!sim||!event)return;
  const actor=sim.enemies?.find(enemy=>enemy.id===event.actor),target=sim.enemies?.find(enemy=>enemy.id===event.target);
  if(event.type==='attack'){
    if(event.actor==='hero')audio.playSfx('PLAYER_MELEE');
    else if(actor?.type==='skeleton-archer')audio.playSfx('ARROW_FIRE');
    audio.setMusicState('COMBAT');return;
  }
  if(event.type==='damage'){
    if(event.target==='hero')audio.playSfx('PLAYER_HIT');
    else if(target)audio.playSfx(`${ENEMY_AUDIO[target.type]||'GOBLIN'}_HIT`);
    if(actor?.type==='skeleton-archer')audio.playSfx('ARROW_IMPACT');return;
  }
  if(event.type==='death'){
    if(event.actor==='hero')audio.playSfx('PLAYER_DIE');
    else if(actor)audio.playSfx(`${ENEMY_AUDIO[actor.type]||'GOBLIN'}_DIE`);return;
  }
  if(event.type==='trap'){audio.playSfx(String(event.item).startsWith('spike-trap')?'SPIKE_TRAP_TRIGGER':'ARROW_IMPACT');return;}
  if(event.type==='drop'){audio.playSfx('LOOT_DROP');return;}
  if(event.type==='pickup')audio.playSfx(event.kind==='gold'?'GOLD_PICKUP':event.kind==='heal'?'POTION_PICKUP':'ITEM_PICKUP');
}
