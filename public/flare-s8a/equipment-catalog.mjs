import {RUNNER_EQUIPMENT_SLOTS,RUNNER_STAT_KEYS} from './runner-progression.mjs';

const clean=value=>String(value??'').trim();
const nonNegative=value=>{const n=Number(value??0);if(!Number.isFinite(n)||n<0)throw new Error('Equipment modifier must be finite and non-negative');return n;};

export function normalizeEquipmentItem(item={}){
  const id=clean(item.id),slot=clean(item.slot),name=clean(item.name)||id;
  if(!id)throw new Error('Equipment item id is required');
  if(!RUNNER_EQUIPMENT_SLOTS.includes(slot))throw new Error(`Unsupported equipment slot: ${slot}`);
  const modifiers={};for(const stat of RUNNER_STAT_KEYS)modifiers[stat]=nonNegative(item.modifiers?.[stat]);
  const avatarLayers=Object.freeze((item.visual?.avatarLayers||[]).map(clean).filter(Boolean));
  return Object.freeze({id,name,slot,modifiers:Object.freeze(modifiers),visual:Object.freeze({avatarLayers}),sourcePath:clean(item.sourcePath)||null});
}

export function normalizeEquipmentCatalog(catalog={}){
  const version=Number(catalog.version??1);if(!Number.isInteger(version)||version<=0)throw new Error('Equipment catalog version must be a positive integer');
  const items=Object.freeze((catalog.items||[]).map(normalizeEquipmentItem));
  const ids=items.map(x=>x.id);if(new Set(ids).size!==ids.length)throw new Error('Equipment item ids must be unique');
  return Object.freeze({version,items});
}

export function equipmentItemById(catalog,itemId){
  const id=clean(itemId),item=(catalog?.items||[]).find(x=>x.id===id);if(!item)throw new Error(`Unknown equipment item: ${id}`);return item;
}
