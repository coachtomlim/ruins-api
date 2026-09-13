import {RUNNER_EQUIPMENT_SLOTS} from '../flare-s8a/runner-progression.mjs';

const clean=value=>String(value??'').trim();

export function normalizeRunGearAward(record={}){
  const awardId=clean(record.awardId),runId=clean(record.runId),itemId=clean(record.itemId),slot=clean(record.slot);
  if(!awardId||!runId||!itemId)throw new Error('awardId, runId and itemId are required');
  if(!RUNNER_EQUIPMENT_SLOTS.includes(slot))throw new Error(`Unsupported gear slot: ${slot}`);
  return Object.freeze({awardId,runId,itemId,slot,sourceMonsterId:clean(record.sourceMonsterId)||null,rulesVersion:clean(record.rulesVersion),contentVersion:clean(record.contentVersion)});
}

export function awardOwnershipInput({award,ownershipId,playerId,runnerId,idempotencyKey}={}){
  const a=normalizeRunGearAward(award),ownership=clean(ownershipId),player=clean(playerId),runner=clean(runnerId),key=clean(idempotencyKey);
  if(!ownership||!player||!runner||!key)throw new Error('ownershipId, playerId, runnerId and idempotencyKey are required');
  return Object.freeze({ownershipId:ownership,playerId:player,runnerId:runner,itemId:a.itemId,slot:a.slot,reason:'DROP',sourceId:a.awardId,idempotencyKey:key,ledgerEntryId:null});
}
