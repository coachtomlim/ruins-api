import {normalizeGearSource} from './gear-source.mjs';

const clean=value=>String(value??'').trim();

export function normalizeOwnershipGrant(record={}){
  const ownershipId=clean(record.ownershipId),playerId=clean(record.playerId),idempotencyKey=clean(record.idempotencyKey);
  if(!ownershipId||!playerId||!idempotencyKey)throw new Error('Incomplete ownership grant');
  const source=normalizeGearSource(record);
  return Object.freeze({ownershipId,playerId,idempotencyKey,...source,revokedAt:record.revokedAt||null});
}

export function addOwnershipGrant(existing=[],rawGrant={}){
  const grants=existing.map(normalizeOwnershipGrant),grant=normalizeOwnershipGrant(rawGrant);
  const retry=grants.find(x=>x.idempotencyKey===grant.idempotencyKey);
  if(retry)return Object.freeze({grants:Object.freeze(grants),grant:retry,duplicate:true});
  if(grants.some(x=>x.ownershipId===grant.ownershipId))throw new Error('Duplicate ownership id');
  return Object.freeze({grants:Object.freeze([...grants,grant]),grant,duplicate:false});
}

export function activeOwnershipForPlayer(grants=[],playerId=''){
  const player=clean(playerId);if(!player)throw new Error('playerId is required');
  return Object.freeze(grants.map(normalizeOwnershipGrant).filter(x=>x.playerId===player&&!x.revokedAt));
}
