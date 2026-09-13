import {RUNNER_EQUIPMENT_SLOTS} from '../flare-s8a/runner-progression.mjs';
import {gearInstanceIndex} from './gear-instance.mjs';

const clean=value=>String(value??'').trim();

export function normalizeLoadoutInstances(loadout={}){
  const result={};
  for(const slot of RUNNER_EQUIPMENT_SLOTS)result[slot]=clean(loadout?.[slot])||null;
  return Object.freeze(result);
}

export function validateLoadoutInstances({accountId,loadout={},gearInstances=[]}={}){
  const account=clean(accountId);if(!account)throw new Error('accountId is required');
  const index=gearInstanceIndex(gearInstances),normalized=normalizeLoadoutInstances(loadout),resolved={};
  for(const slot of RUNNER_EQUIPMENT_SLOTS){
    const instanceId=normalized[slot];
    if(!instanceId){resolved[slot]=null;continue;}
    const gear=index.get(instanceId);
    if(!gear||gear.inactiveAt)throw new Error(`Missing active gear instance: ${instanceId}`);
    if(gear.accountId!==account)throw new Error('Gear instance belongs to another account');
    if(gear.slot!==slot)throw new Error(`Gear instance ${instanceId} does not fit ${slot}`);
    resolved[slot]=gear;
  }
  return Object.freeze(resolved);
}
