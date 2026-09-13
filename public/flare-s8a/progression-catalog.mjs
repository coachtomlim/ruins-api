import {RUNNER_STAT_KEYS,RUNNER_EQUIPMENT_SLOTS} from './runner-progression.mjs';

const positiveInt=(value,label)=>{const n=Number(value);if(!Number.isInteger(n)||n<=0)throw new Error(`${label} must be a positive integer`);return n};
const clean=value=>String(value??'').trim();
const visualLayers=value=>Object.freeze((Array.isArray(value)?value:[]).map(clean).filter(Boolean));

export function normalizeStatUpgrade(spec={}){
  const id=clean(spec.id);if(!id)throw new Error('Stat upgrade id is required');
  if(!RUNNER_STAT_KEYS.includes(spec.stat))throw new Error(`Unknown runner stat: ${spec.stat}`);
  return Object.freeze({id,kind:'stat',stat:spec.stat,amount:positiveInt(spec.amount,'Stat upgrade amount'),goldCost:positiveInt(spec.goldCost,'Stat upgrade Gold cost'),tier:positiveInt(spec.tier??1,'Stat upgrade tier')});
}

export function normalizeEquipmentOffer(spec={}){
  const id=clean(spec.id),slot=clean(spec.slot);if(!id)throw new Error('Equipment id is required');
  if(!RUNNER_EQUIPMENT_SLOTS.includes(slot))throw new Error(`Unknown equipment slot: ${slot}`);
  const mods=spec.modifiers||{};
  const normalizedMods={};
  for(const key of RUNNER_STAT_KEYS){const n=Number(mods[key]??0);if(!Number.isFinite(n)||n<0)throw new Error(`Invalid ${key} modifier`);normalizedMods[key]=n;}
  return Object.freeze({id,kind:'equipment',slot,name:clean(spec.name)||id,goldCost:positiveInt(spec.goldCost,'Equipment Gold cost'),modifiers:Object.freeze(normalizedMods),visual:Object.freeze({avatarLayers:visualLayers(spec.visual?.avatarLayers)})});
}

export function normalizeProgressionCatalog(catalog={}){
  const stats=Object.freeze((catalog.statUpgrades||[]).map(normalizeStatUpgrade));
  const equipment=Object.freeze((catalog.equipment||[]).map(normalizeEquipmentOffer));
  const ids=[...stats,...equipment].map(x=>x.id);if(new Set(ids).size!==ids.length)throw new Error('Progression catalog ids must be unique');
  return Object.freeze({version:positiveInt(catalog.version??1,'Catalog version'),statUpgrades:stats,equipment});
}
