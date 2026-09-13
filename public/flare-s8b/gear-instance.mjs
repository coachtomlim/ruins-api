import {RUNNER_EQUIPMENT_SLOTS} from '../flare-s8a/runner-progression.mjs';
import {GEAR_SOURCES} from './gear-source.mjs';

const clean=value=>String(value??'').trim();

export function normalizeGearInstance(record={}){
  const instanceId=clean(record.instanceId),accountId=clean(record.accountId),itemId=clean(record.itemId),slot=clean(record.slot),source=clean(record.source),sourceId=clean(record.sourceId);
  if(!instanceId||!accountId||!itemId||!sourceId)throw new Error('Incomplete gear instance');
  if(!RUNNER_EQUIPMENT_SLOTS.includes(slot))throw new Error(`Unsupported gear slot: ${slot}`);
  if(!GEAR_SOURCES.includes(source))throw new Error(`Unsupported gear source: ${source}`);
  return Object.freeze({instanceId,accountId,itemId,slot,source,sourceId,inactiveAt:record.inactiveAt||null});
}

export function activeGearInstances(records=[],accountId=''){
  const account=clean(accountId);if(!account)throw new Error('accountId is required');
  return Object.freeze(records.map(normalizeGearInstance).filter(x=>x.accountId===account&&!x.inactiveAt));
}

export function gearInstanceIndex(records=[]){
  const map=new Map();
  for(const record of records.map(normalizeGearInstance)){
    if(map.has(record.instanceId))throw new Error(`Duplicate gear instance id: ${record.instanceId}`);
    map.set(record.instanceId,record);
  }
  return map;
}
