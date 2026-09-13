import {RUNNER_EQUIPMENT_SLOTS} from '../flare-s8a/runner-progression.mjs';
import {GEAR_SOURCES} from './gear-source.mjs';

const clean=value=>String(value??'').trim();

export function normalizeGearGrant(record={}){
  const grantId=clean(record.grantId),accountId=clean(record.accountId),itemId=clean(record.itemId),slot=clean(record.slot),source=clean(record.source),sourceId=clean(record.sourceId),operationKey=clean(record.operationKey);
  if(!grantId||!accountId||!itemId||!sourceId||!operationKey)throw new Error('Incomplete gear grant');
  if(!RUNNER_EQUIPMENT_SLOTS.includes(slot))throw new Error(`Unsupported gear slot: ${slot}`);
  if(!GEAR_SOURCES.includes(source))throw new Error(`Unsupported gear source: ${source}`);
  return Object.freeze({grantId,accountId,itemId,slot,source,sourceId,operationKey,gearInstanceId:clean(record.gearInstanceId)||null});
}

export function applyGearGrant(existing=[],record={}){
  const rows=existing.map(normalizeGearGrant),grant=normalizeGearGrant(record);
  const repeat=rows.find(x=>x.operationKey===grant.operationKey);
  if(repeat)return Object.freeze({rows:Object.freeze(rows),grant:repeat,duplicate:true});
  if(rows.some(x=>x.grantId===grant.grantId))throw new Error('Duplicate gear grant id');
  return Object.freeze({rows:Object.freeze([...rows,grant]),grant,duplicate:false});
}
