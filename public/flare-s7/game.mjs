import {targetInstruction,actualHpPercent,scoreForTarget,scoreLabel} from '../flare-s5/game.mjs';
import {applyGameModel as applyLegacyRunner,runnerSummary as legacyRunnerSummary} from '../flare-s4/game.mjs';
import {deriveSlots,gridPath} from '../flare-s2/core.mjs';

export const S7_VERSION='web-flare-s7-0.1.0';
export const ROOM_IDS=Object.freeze(['iron-labyrinth-01','iron-labyrinth-03','iron-labyrinth-07','iron-labyrinth-08','iron-labyrinth-15','iron-labyrinth-18']);
export const MONSTER_IDS=Object.freeze(['goblin','skeleton','goblin-elite','antlion']);
export const TRAP_IDS=Object.freeze(['spike-trap','dart-trap']);
export const SUPPORT_IDS=Object.freeze(['small-potion','battle-tonic','iron-tonic']);
export const DEFAULT_ENCOUNTER=Object.freeze({enemyTypes:['goblin','skeleton','none'],supportTypes:['small-potion'],trapTypes:[]});
const clone=value=>structuredClone(value);
const fnv1a=text=>{let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(36).padStart(7,'0')};

export function runnerIds(model){return Object.keys(model?.runners||{})}
export function runnerById(model,id){const runner=model?.runners?.[id];if(!runner)throw Error(`Unknown runner: ${id}`);return clone(runner)}
function legacyModel(model,id){const runner=runnerById(model,id);return{version:model.version,runner,monsters:{goblin:clone(model.monsters.goblin),skeleton:clone(model.monsters.skeleton)},items:{'small-potion':clone(model.items['small-potion']),'spike-trap':clone(model.items['spike-trap'])}}}
export function applyRunnerModel(baseCatalog,model,id){
  const catalog=applyLegacyRunner(baseCatalog,legacyModel(model,id));
  for(const monsterId of ['goblin-elite','antlion']){const m=model.monsters[monsterId];if(!m)throw Error(`Missing S7 monster: ${monsterId}`);catalog.enemies[monsterId]={name:m.name,sprite:monsterId,maxHp:m.hp,damage:m.attack,armor:m.defense,cost:m.cost,gold:m.gold,interval:monsterId==='goblin-elite'?.76:.92,windup:monsterId==='goblin-elite'?.24:.3,animationTime:.4,range:1.08,radius:.24,behavior:'guard'}}
  for(const id of SUPPORT_IDS){const item=model.items[id];if(!item)throw Error(`Missing S7 support: ${id}`);catalog.items[id]={...clone(item)}}
  for(const id of TRAP_IDS){const item=model.items[id];if(!item)throw Error(`Missing S7 trap: ${id}`);catalog.items[id]={...clone(item)}}
  return catalog;
}
export function runnerSummary(model,id,catalog){return legacyRunnerSummary(legacyModel(model,id),catalog)}
export function monsterSummary(id,model,runnerId,catalog,runner){const m=model.monsters[id],c=catalog.enemies[id];if(!m||!c)throw Error(`Unknown monster: ${id}`);return Object.freeze({id,name:m.name,rating:m.rating,role:m.role||'',hp:c.maxHp,attack:c.damage,defense:c.armor,cost:c.cost,gold:c.gold,damageToRunner:Math.max(1,c.damage-runner.defense),runnerDamage:Math.max(1,runner.attack-c.armor)})}
export function itemSummary(id,model){const item=model.items[id];if(!item)throw Error(`Unknown S7 item: ${id}`);return Object.freeze({id,...clone(item)})}
export {targetInstruction,actualHpPercent,scoreForTarget,scoreLabel};

function selected(encounter,key,legacyKey,id){if(Array.isArray(encounter?.[key]))return encounter[key].includes(id);return Boolean(encounter?.[legacyKey])}
export function normalizeEncounter(encounter={}){return{enemyTypes:(encounter.enemyTypes||DEFAULT_ENCOUNTER.enemyTypes).map(x=>x||'none').slice(0,3),supportTypes:SUPPORT_IDS.filter(id=>selected(encounter,'supportTypes','potion',id)),trapTypes:TRAP_IDS.filter(id=>selected(encounter,'trapTypes','trap',id))}}
export function encounterCost(catalog,encounter=DEFAULT_ENCOUNTER){const e=normalizeEncounter(encounter);let total=0;for(const id of [...e.enemyTypes.filter(x=>x!=='none'),...e.supportTypes,...e.trapTypes]){const spec=catalog.enemies[id]||catalog.items[id];if(!spec)throw Error(`Unknown encounter entry: ${id}`);total+=spec.cost}return total}
function nearestFree(path,index,used){for(let d=0;d<path.length;d++)for(const i of [index-d,index+d])if(i>0&&i<path.length-1){const p=path[i],key=p.join(',');if(!used.has(key)){used.add(key);return p}}return null}

export function buildS7Challenge({roomId,roomTitle,map,catalog,targetHp=50,encounter=DEFAULT_ENCOUNTER,budget=100}){
  const e=normalizeEncounter(encounter),types=e.enemyTypes.filter(x=>x!=='none');if(types.length>3)throw Error('Maximum three enemies');
  const slots=deriveSlots(map,Math.max(1,types.length)),path=gridPath(map,slots.spawn,slots.exit);if(!path)throw Error('S7 route unavailable');
  const used=new Set([slots.spawn.join(','),slots.exit.join(',')]),enemies=[];
  for(let i=0;i<types.length;i++){const type=types[i],spec=catalog.enemies[type];if(!spec)throw Error(`Unknown enemy: ${type}`);const at=nearestFree(path,Math.round((path.length-1)*[.28,.53,.76][i]),used);if(!at)throw Error('No legal enemy slot');enemies.push({id:`guard-${i+1}`,type,at})}
  const items=[],fractions={'battle-tonic':.16,'iron-tonic':.38,'small-potion':.48,'spike-trap':.63,'dart-trap':.82};
  for(const type of [...e.supportTypes,...e.trapTypes]){if(!catalog.items[type])throw Error(`Unknown item: ${type}`);const at=nearestFree(path,Math.round((path.length-1)*fractions[type]),used);if(!at)throw Error(`No legal ${type} slot`);items.push({id:`${type}-${items.length+1}`,type,at})}
  const spent=encounterCost(catalog,e);if(spent>budget)throw Error(`Budget exceeded: ${spent}/${budget}`);
  const challenge={version:1,rules:catalog.rules,id:'',title:roomTitle||'Quick Challenge',room:roomId,hero:'warrior',spawn:slots.spawn,exit:slots.exit,budget,targetHp:Number(targetHp),enemies,items};
  if(!Number.isInteger(challenge.targetHp)||challenge.targetHp<1||challenge.targetHp>100)throw Error('Target HP must be 1..100');challenge.id=`quick-${fnv1a(JSON.stringify({...challenge,id:undefined}))}`;
  return{challenge,spent,remaining:budget-spent,slots:{...slots,itemSlots:Object.fromEntries(items.map(x=>[x.type,x.at]))}};
}
